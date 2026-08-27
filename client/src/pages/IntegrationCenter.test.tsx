import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import IntegrationCenter from "./IntegrationCenter";

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ integrationCenter: { list: { invalidate: vi.fn() } } }), integrationCenter: { list: { useQuery: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }) }, request: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } } } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("IntegrationCenter", () => {
  afterEach(cleanup);
  it("states that catalog cards are not automatic external connections", () => {
    render(<LanguageProvider><IntegrationCenter /></LanguageProvider>);
    expect(screen.getByText(/لا تعني البطاقة أن الحساب متصل/)).toBeTruthy();
    expect(screen.getByText(/لا تُحفظ كلمات المرور أو المفاتيح/)).toBeTruthy();
    expect(screen.getByText("GitHub")).toBeTruthy();
  });

  it("filters the expanded catalog locally by category", () => {
    render(<LanguageProvider><IntegrationCenter /></LanguageProvider>);
    fireEvent.click(screen.getByRole("button", { name: "التحليلات" }));
    expect(screen.getByText("Google Analytics")).toBeTruthy();
    expect(screen.getByText("PostHog")).toBeTruthy();
    expect(screen.queryByText("GitHub")).toBeNull();
  });

  it("shows official AI-provider documentation links without marking providers connected", () => {
    render(<LanguageProvider><IntegrationCenter /></LanguageProvider>);
    fireEvent.click(screen.getByRole("button", { name: "الوسائط والذكاء" }));
    const documentation = screen.getByRole("link", { name: "توثيق OpenAI" });
    expect(documentation.getAttribute("href")).toBe("https://developers.openai.com/api/docs");
    expect(screen.getAllByText("غير متصل").length).toBeGreaterThan(0);
  });

  it("lists free-tier development platforms as reviewable references rather than active workspaces", () => {
    render(<LanguageProvider><IntegrationCenter /></LanguageProvider>);
    fireEvent.click(screen.getByRole("button", { name: "بيئات تطوير سحابية" }));
    expect(screen.getByText("Replit")).toBeTruthy();
    expect(screen.getByText("GitHub Codespaces")).toBeTruthy();
    expect(screen.getByText("StackBlitz")).toBeTruthy();
    expect(screen.getByText(/لا ينشئ DevForge مساحة Replit/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "توثيق Replit" }).getAttribute("href")).toBe("https://docs.replit.com/features/integrations/overview");
  });

  it("lists reliability services as unconnected review options", () => {
    render(<LanguageProvider><IntegrationCenter /></LanguageProvider>);
    fireEvent.click(screen.getByRole("button", { name: "استمرارية المنصة" }));
    expect(screen.getByText("UptimeRobot")).toBeTruthy();
    expect(screen.getByText("Better Stack Uptime")).toBeTruthy();
    expect(screen.getAllByText(/لا ينشئ DevForge مراقبًا/).length).toBeGreaterThan(0);
  });
});
