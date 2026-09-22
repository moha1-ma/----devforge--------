import {
  COOKIE_NAME,
  ONE_YEAR_MS,
  OAUTH_STATE_COOKIE,
  decodeOAuthState,
} from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { saveGithubConnection } from "../githubAggregation";
import crypto from "node:crypto";
import { registerGoogleOAuthRoutes } from "./googleOAuth";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

// Registers the Google, GitHub, and Manus OAuth routes used to authenticate
// users and, for GitHub, to link a repository-scoped access token to the
// signed-in account.
export function registerOAuthRoutes(app: Express) {
  registerGoogleOAuthRoutes(app);
  // Kick off the GitHub OAuth flow: stash a CSRF state nonce in a cookie and
  // redirect the browser to GitHub's authorize endpoint.
  app.get("/api/github/connect", (req, res) => {
    if (
      !ENV.githubClientId ||
      !ENV.githubClientSecret ||
      !ENV.githubTokenEncryptionKey
    )
      return res.status(503).json({ error: "GitHub OAuth is not configured" });
    const state = crypto.randomBytes(24).toString("base64url");
    res.cookie("github_oauth_state", state, {
      ...getSessionCookieOptions(req),
      httpOnly: true,
      maxAge: 10 * 60 * 1000,
    });
    const redirectUri = `${req.protocol}://${req.get("host")}/api/github/callback`;
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", ENV.githubClientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("scope", "repo delete_repo read:org");
    res.redirect(url.toString());
  });
  // Complete the GitHub OAuth flow: verify the CSRF state, exchange the code
  // for an access token, fetch the GitHub login, and persist the connection
  // for the signed-in DevForge user.
  app.get("/api/github/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const expected = parseCookieHeader(
      req.headers.cookie ?? ""
    ).github_oauth_state;
    if (
      !code ||
      !state ||
      !expected ||
      Buffer.byteLength(state) !== Buffer.byteLength(expected) ||
      !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(expected))
    )
      return res.status(403).send("Invalid GitHub OAuth state");
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user?.id) return res.status(401).send("Sign in to DevForge first");
      const redirectUri = `${req.protocol}://${req.get("host")}/api/github/callback`;
      const tokenResponse = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            client_id: ENV.githubClientId,
            client_secret: ENV.githubClientSecret,
            code,
            redirect_uri: redirectUri,
          }),
          signal: AbortSignal.timeout(10_000),
        }
      );
      const token = ((await tokenResponse.json()) as { access_token?: string })
        .access_token;
      if (!token) throw new Error("GitHub did not return an access token");
      const profile = await fetch("https://api.github.com/user", {
        headers: {
          authorization: `Bearer ${token}`,
          accept: "application/vnd.github+json",
        },
        signal: AbortSignal.timeout(10_000),
      });
      const login = ((await profile.json()) as { login?: string }).login;
      if (!profile.ok || !login) throw new Error("GitHub profile unavailable");
      await saveGithubConnection(user.id, login, token);
      res.clearCookie("github_oauth_state", getSessionCookieOptions(req));
      res.redirect("/github?connected=1");
    } catch {
      res.status(500).send("GitHub connection failed");
    }
  });
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: the nonce in `state` must match the one-time cookie that
    // startLogin set in the browser that began this login. An attacker can
    // forge `state`, but cannot plant this cookie in the victim's browser.
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[
      OAUTH_STATE_COOKIE
    ];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, {
      path: "/",
      secure: true,
      sameSite: "none",
    });

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
