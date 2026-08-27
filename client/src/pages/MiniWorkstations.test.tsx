import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import MiniWorkstations from "./MiniWorkstations";

const run = vi.fn();
const reviewPath = vi.fn();
const invalidate = vi.fn();

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ miniWorkstations: { paths: { invalidate } } }),
    miniWorkstations: {
      paths: { useQuery: () => ({ data: [], isLoading: false }) },
      run: { useMutation: () => ({ mutate: run, isPending: false }) },
      reviewPath: { useMutation: () => ({ mutate: reviewPath, isPending: false }) },
    },
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("MiniWorkstations", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("shows ten fixed roles and starts a bounded AI review only after an explicit click", () => {
    render(<LanguageProvider><MiniWorkstations /></LanguageProvider>);

    expect(screen.getByText("10 / 10")).toBeTruthy();
    expect(document.querySelectorAll("button[aria-pressed]")).toHaveLength(10);
    expect(run).not.toHaveBeenCalled();

    const request = "راجع بنية منصة تعليمية متعددة المساحات مع معايير قبول واختبارات وحدود صلاحية واضحة.";
    fireEvent.change(screen.getByLabelText("طلب المحطة المختارة"), { target: { value: request } });
    fireEvent.click(screen.getByRole("button", { name: "بدء مراجعة بالذكاء" }));

    expect(run).toHaveBeenCalledWith({ stationKey: "architecture", request });
    expect(document.body.textContent).toMatch(/لا مزامنة أو كتابة تلقائية في GitHub/);
    expect(document.body.textContent).toMatch(/Termux: تسليم دليل مراجعة/);
    expect(document.body.textContent).not.toMatch(/Bearer |service_role|127\.0\.0\.1/);
  });
});
