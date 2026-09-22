import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import crypto from "node:crypto";
import type { Express, Request } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

const GOOGLE_STATE_COOKIE = "google_oauth_state";
const GOOGLE_VERIFIER_COOKIE = "google_oauth_verifier";
const GOOGLE_AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const LOGIN_TTL_MS = 10 * 60 * 1000;

type GoogleProfile = {
  sub?: unknown;
  email?: unknown;
  email_verified?: unknown;
  name?: unknown;
};

type GoogleOAuthDependencies = {
  fetch?: typeof fetch;
};

// Reads the Google OAuth client credentials and redirect URI from env.
function googleConfiguration() {
  return {
    clientId: ENV.googleClientId,
    clientSecret: ENV.googleClientSecret,
    redirectUri: ENV.googleRedirectUri,
  };
}

/** Returns whether Google sign-in has all required env vars configured. */
export function isGoogleOAuthConfigured() {
  const config = googleConfiguration();
  return Boolean(
    config.clientId &&
      config.clientSecret &&
      config.redirectUri &&
      ENV.cookieSecret &&
      ENV.databaseUrl
  );
}

/** Builds the Google OAuth authorization URL for a PKCE-based sign-in request. */
export function buildGoogleAuthorizationUrl(input: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}) {
  const url = new URL(GOOGLE_AUTHORIZATION_URL);
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", input.state);
  url.searchParams.set("code_challenge", input.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");
  return url;
}

/** Derives a stable, non-reversible DevForge openId from a Google `sub` claim. */
export function googleSubjectOpenId(subject: string) {
  return `google:${crypto.createHash("sha256").update(subject).digest("base64url")}`;
}

/**
 * Validates and normalizes a Google userinfo profile, rejecting it if the
 * subject/email are missing or malformed or the email is not verified.
 */
export function validateGoogleProfile(profile: GoogleProfile) {
  const subject = typeof profile.sub === "string" ? profile.sub.trim() : "";
  const email =
    typeof profile.email === "string" ? profile.email.trim().toLowerCase() : "";
  const name = typeof profile.name === "string" ? profile.name.trim() : "";
  if (!subject || subject.length > 255)
    throw new Error("Google profile has no valid subject");
  if (!email || email.length > 320 || !email.includes("@"))
    throw new Error("Google profile has no valid email");
  if (profile.email_verified !== true)
    throw new Error("Google email is not verified");
  return { subject, email, name: name || email.split("@")[0] };
}

// Constant-time comparison of the OAuth `state` param against the cookie
// value, to avoid leaking timing information to an attacker.
function timingSafeMatch(
  received: string | undefined,
  expected: string | undefined
) {
  if (!received || !expected) return false;
  const receivedBytes = Buffer.from(received);
  const expectedBytes = Buffer.from(expected);
  return (
    receivedBytes.length === expectedBytes.length &&
    crypto.timingSafeEqual(receivedBytes, expectedBytes)
  );
}

// Cookie options for the short-lived Google OAuth state/verifier cookies.
function oauthCookieOptions(req: Request) {
  return { ...getSessionCookieOptions(req), sameSite: "lax" as const };
}

// Reads a single string query parameter, ignoring array/undefined values.
function queryValue(req: Request, key: string) {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

// Exchanges the authorization code and PKCE verifier for a Google access token.
async function exchangeCode(
  code: string,
  verifier: string,
  fetchImpl: typeof fetch
) {
  const config = googleConfiguration();
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    code_verifier: verifier,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
  });
  const response = await fetchImpl(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(10_000),
  });
  const payload = (await response.json()) as { access_token?: unknown };
  if (
    !response.ok ||
    typeof payload.access_token !== "string" ||
    !payload.access_token
  ) {
    throw new Error("Google token exchange failed");
  }
  return payload.access_token;
}

// Fetches the Google userinfo endpoint and validates the returned profile.
async function fetchProfile(accessToken: string, fetchImpl: typeof fetch) {
  const response = await fetchImpl(GOOGLE_USERINFO_URL, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Google user profile request failed");
  return validateGoogleProfile((await response.json()) as GoogleProfile);
}

/**
 * Registers the Google sign-in routes: a status check, the PKCE-based
 * authorization redirect, and the callback that exchanges the code for a
 * token, fetches the profile, and creates/updates the DevForge session.
 */
export function registerGoogleOAuthRoutes(
  app: Express,
  dependencies: GoogleOAuthDependencies = {}
) {
  const fetchImpl = dependencies.fetch ?? fetch;
  app.get("/api/auth/google/status", (_req, res) => {
    res
      .set("Cache-Control", "no-store")
      .json({ enabled: isGoogleOAuthConfigured() });
  });

  app.get("/api/auth/google", (req, res) => {
    if (!isGoogleOAuthConfigured()) {
      return res
        .status(503)
        .json({ error: "Google sign-in is not configured" });
    }
    const config = googleConfiguration();
    const state = crypto.randomBytes(32).toString("base64url");
    const verifier = crypto.randomBytes(48).toString("base64url");
    const challenge = crypto
      .createHash("sha256")
      .update(verifier)
      .digest("base64url");
    const cookieOptions = oauthCookieOptions(req);
    res.cookie(GOOGLE_STATE_COOKIE, state, {
      ...cookieOptions,
      maxAge: LOGIN_TTL_MS,
    });
    res.cookie(GOOGLE_VERIFIER_COOKIE, verifier, {
      ...cookieOptions,
      maxAge: LOGIN_TTL_MS,
    });
    return res.redirect(
      buildGoogleAuthorizationUrl({
        clientId: config.clientId,
        redirectUri: config.redirectUri,
        state,
        codeChallenge: challenge,
      }).toString()
    );
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const state = queryValue(req, "state");
    if (
      !timingSafeMatch(state, cookies[GOOGLE_STATE_COOKIE]) ||
      !cookies[GOOGLE_VERIFIER_COOKIE]
    ) {
      return res.status(403).send("Invalid Google OAuth state");
    }
    const cookieOptions = oauthCookieOptions(req);
    res.clearCookie(GOOGLE_STATE_COOKIE, cookieOptions);
    res.clearCookie(GOOGLE_VERIFIER_COOKIE, cookieOptions);
    if (queryValue(req, "error")) return res.redirect(302, "/#/workspace");
    const code = queryValue(req, "code");
    if (!code || !isGoogleOAuthConfigured())
      return res.status(400).send("Invalid Google OAuth callback");

    try {
      const accessToken = await exchangeCode(
        code,
        cookies[GOOGLE_VERIFIER_COOKIE],
        fetchImpl
      );
      const profile = await fetchProfile(accessToken, fetchImpl);
      const openId = googleSubjectOpenId(profile.subject);
      await db.upsertUser({
        openId,
        name: profile.name,
        email: profile.email,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });
      if (!(await db.getUserByOpenId(openId)))
        throw new Error("Google user could not be persisted");
      const sessionToken = await sdk.signSession(
        { openId, appId: ENV.appId || "devforge", name: profile.name },
        { expiresInMs: ONE_YEAR_MS }
      );
      res.cookie(COOKIE_NAME, sessionToken, {
        ...getSessionCookieOptions(req),
        maxAge: ONE_YEAR_MS,
      });
      return res.redirect(302, "/#/workspace");
    } catch (error) {
      console.error(
        "[Google OAuth] Callback failed",
        error instanceof Error ? error.message : "unknown error"
      );
      return res.status(500).send("Google sign-in failed");
    }
  });
}
