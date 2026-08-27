import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import JavaScriptMigrationCenter from "./JavaScriptMigrationCenter";

const request = vi.fn();
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({ trpc: { integrationCenter: { request: { useMutation: () => ({ mutate: request, isPending: false }) } } } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("JavaScriptMigrationCenter", () => {
  afterEach(() => { cleanup(); localStorage.clear(); vi.clearAllMocks(); });
  it("shows bounded JavaScript portability information and records review intent only after an explicit click", () => {
    render(<LanguageProvider><JavaScriptMigrationCenter /></LanguageProvider>);
    expect(screen.getByText("جاهزية انتقال محرك JavaScript")).toBeTruthy();
    expect(screen.getByText("Node.js + TypeScript")).toBeTruthy();
    expect(request).not.toHaveBeenCalled();
    expect(document.body.textContent).not.toMatch(/Bearer |service_role|127\.0\.0\.1|DATABASE_URL|JWT_SECRET/);
    fireEvent.click(screen.getByRole("button", { name: "سجل مراجعة انتقال JavaScript" }));
    expect(request).toHaveBeenCalledWith({ providerKey: "devforge-javascript-portability" });
    expect(document.body.textContent).toContain("لا تصدر بيانات، ولا تنقل أسرارًا أو مستخدمين");
  });

  it("renders reviewed English labels without replacing the active-origin contract", () => {
    localStorage.setItem("devforge-language", "en");
    render(<LanguageProvider><JavaScriptMigrationCenter /></LanguageProvider>);
    expect(screen.getByRole("heading", { name: "JavaScript migration readiness" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Record JavaScript migration review" })).toBeTruthy();
    expect(document.body.textContent).toContain(`${window.location.origin}/api/trpc`);
    expect(document.body.textContent).toContain("It does not export data, transfer secrets or users");
  });
});
