import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import GoogleSignInButton from "./GoogleSignInButton";

const mocks = vi.hoisted(() => ({ startGoogleLogin: vi.fn() }));
vi.mock("@/const", () => ({ startGoogleLogin: mocks.startGoogleLogin }));

describe("GoogleSignInButton", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    mocks.startGoogleLogin.mockReset();
  });

  it("starts Google sign-in when the server reports it is configured", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ enabled: true })));
    render(<LanguageProvider><GoogleSignInButton /></LanguageProvider>);
    const button = await screen.findByRole("button", { name: /المتابعة عبر Google/ });
    fireEvent.click(button);
    expect(mocks.startGoogleLogin).toHaveBeenCalledTimes(1);
  });

  it("stays disabled when Google sign-in is not configured", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ enabled: false })));
    render(<LanguageProvider><GoogleSignInButton /></LanguageProvider>);
    const button = await screen.findByRole("button", { name: /يحتاج إعداد المالك/ });
    expect(button.hasAttribute("disabled")).toBe(true);
  });
});
