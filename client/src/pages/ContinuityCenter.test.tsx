import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ContinuityCenter from "./ContinuityCenter";

const mocks = vi.hoisted(() => ({ mutate: vi.fn(), refetch: vi.fn(), navigate: vi.fn() }));
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ integrationCenter: { list: { invalidate: vi.fn() } } }), system: { health: { useQuery: () => ({ data: { ok: true }, isLoading: false, isFetching: false, isError: false, refetch: mocks.refetch }) } }, integrationCenter: { list: { useQuery: () => ({ data: [] }) }, request: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) } } } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("wouter", () => ({ useLocation: () => ["/continuity", mocks.navigate] }));

describe("ContinuityCenter", () => {
  afterEach(cleanup);
  it("shows a bounded local health signal and explicitly excludes automatic remediation", () => {
    render(<LanguageProvider><ContinuityCenter /></LanguageProvider>);
    expect(screen.getByRole("heading", { name: "مركز الاستمرارية" })).toBeTruthy();
    expect(screen.getByText(/استجابة محلية متاحة/)).toBeTruthy();
    expect(screen.getByText(/لا تعيد تشغيل خدمات ولا تغيّر كودًا/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "فحص جديد" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "فتح التشخيص المحلي" }));
    expect(mocks.navigate).toHaveBeenCalledWith("/javascript-lab");
  });

  it("only records a review request for a documented reliability service", () => {
    render(<LanguageProvider><ContinuityCenter /></LanguageProvider>);
    expect(screen.getAllByRole("link", { name: "التوثيق الرسمي" })[0].getAttribute("href")).toBe("https://uptimerobot.com/api/");
    fireEvent.click(screen.getAllByRole("button", { name: "طلب مراجعة الربط" })[0]);
    expect(mocks.mutate).toHaveBeenCalledWith({ providerKey: "uptimerobot" });
  });
});
