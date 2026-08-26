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
});
