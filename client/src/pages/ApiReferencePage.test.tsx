import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ApiReferencePage from "./ApiReferencePage";

describe("ApiReferencePage", () => {
  afterEach(cleanup);
  it("uses the active DevForge origin and keeps API credentials out of the public reference", () => {
    render(<LanguageProvider><ApiReferencePage /></LanguageProvider>);
    const endpoint = `${window.location.origin}/api/trpc`;
    expect(screen.getByText(endpoint)).toBeTruthy();
    expect(screen.getByRole("link", { name: "فتح رابط API" }).getAttribute("href")).toBe(endpoint);
    expect(document.body.textContent).toContain("عقد API الخاص بـ DevForge");
    expect(document.body.textContent).not.toContain("devforgeapp-grp92cnd.manus.space");
  });
});
