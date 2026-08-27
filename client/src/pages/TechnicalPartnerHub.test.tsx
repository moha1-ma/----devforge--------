import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import TechnicalPartnerHub from "./TechnicalPartnerHub";

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ integrationCenter: { list: { invalidate: vi.fn() } } }), integrationCenter: { list: { useQuery: () => ({ data: [] }) }, request: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } } } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("wouter", () => ({ useLocation: () => ["/partners", vi.fn()] }));

describe("TechnicalPartnerHub", () => {
  afterEach(() => { cleanup(); localStorage.clear(); });
  it("lists only documented partners and keeps API actions as review requests", () => {
    render(<LanguageProvider><TechnicalPartnerHub /></LanguageProvider>);
    expect(screen.getByRole("heading", { name: "الشركاء التقنيون" })).toBeTruthy();
    expect(screen.getByText("GitHub")).toBeTruthy();
    expect(screen.getByText("OpenAlex")).toBeTruthy();
    expect(screen.getByRole("link", { name: "توثيق Sentry" }).getAttribute("href")).toBe("https://docs.sentry.io/");
    expect(screen.getAllByRole("button", { name: "طلب مراجعة API" }).length).toBeGreaterThan(0);
    expect(document.body.textContent).toContain("لا ينشئ حسابًا");
  });

  it("filters the partner directory locally without sending the search term externally", () => {
    render(<LanguageProvider><TechnicalPartnerHub /></LanguageProvider>);
    fireEvent.change(screen.getByLabelText("ابحث في الشركاء التقنيين"), { target: { value: "مراقبة" } });
    expect(screen.getByText("Sentry")).toBeTruthy();
    expect(screen.queryByText("Replit")).toBeNull();
    expect(document.body.textContent).toContain("البحث محلي داخل الدليل");
  });

  it("renders reviewed English controls while preserving official partner links", () => {
    localStorage.setItem("devforge-language", "en");
    render(<LanguageProvider><TechnicalPartnerHub /></LanguageProvider>);
    expect(screen.getByRole("heading", { name: "Technical partners" })).toBeTruthy();
    expect(screen.getByLabelText("Search technical partners")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Documentation Sentry" }).getAttribute("href")).toBe("https://docs.sentry.io/");
    expect(screen.getAllByRole("button", { name: "Request API review" }).length).toBeGreaterThan(0);
  });
});
