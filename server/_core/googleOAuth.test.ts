import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { buildGoogleAuthorizationUrl, googleSubjectOpenId, registerGoogleOAuthRoutes, validateGoogleProfile } from "./googleOAuth";

let server: Server;
let origin = "";
const googleFetch = vi.fn<typeof fetch>();

beforeAll(async () => {
  const app = express();
  registerGoogleOAuthRoutes(app, { fetch: googleFetch });
  await new Promise<void>(resolve => {
    server = app.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind to a TCP port");
  origin = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

describe("Google OAuth", () => {
  it("builds the authorization-code request with state and PKCE", () => {
    const url = buildGoogleAuthorizationUrl({
      clientId: "client.apps.googleusercontent.com",
      redirectUri: "https://xm.example.com/api/auth/google/callback",
      state: "state-value",
      codeChallenge: "challenge-value",
    });
    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("scope")).toBe("openid email profile");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("state")).toBe("state-value");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  });

  it("derives a stable bounded identifier without storing the Google subject", () => {
    const first = googleSubjectOpenId("google-account-subject");
    expect(first).toBe(googleSubjectOpenId("google-account-subject"));
    expect(first).not.toContain("google-account-subject");
    expect(first.length).toBeLessThanOrEqual(64);
  });

  it("accepts only a verified Google email", () => {
    expect(validateGoogleProfile({ sub: "123", email: " User@Example.com ", email_verified: true, name: "User" })).toEqual({ subject: "123", email: "user@example.com", name: "User" });
    expect(() => validateGoogleProfile({ sub: "123", email: "user@example.com", email_verified: false })).toThrow(/not verified/);
  });

  it("rejects a mismatched state before token exchange", async () => {
    googleFetch.mockClear();
    const response = await fetch(`${origin}/api/auth/google/callback?state=received&code=code`, {
      headers: { cookie: "google_oauth_state=expected; google_oauth_verifier=verifier" },
      redirect: "manual",
    });
    expect(response.status).toBe(403);
    expect(googleFetch).not.toHaveBeenCalled();
  });

  it("rejects a missing PKCE verifier before token exchange", async () => {
    googleFetch.mockClear();
    const response = await fetch(`${origin}/api/auth/google/callback?state=expected&code=code`, {
      headers: { cookie: "google_oauth_state=expected" },
      redirect: "manual",
    });
    expect(response.status).toBe(403);
    expect(googleFetch).not.toHaveBeenCalled();
  });
});
