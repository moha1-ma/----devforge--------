import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { AI_ROUTER_MAX_LENGTH } from "@/lib/aiTaskRouter";
import AiTaskRouter from "./AiTaskRouter";

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("wouter", () => ({ useLocation: () => ["/ai-router", vi.fn()] }));

describe("AI task router page", () => {
  afterEach(cleanup);

  it("keeps routing owner-scoped and does not present it as an automatic executor", () => {
    render(<AiTaskRouter />);
    expect(screen.getByText("خاص بالمالك")).toBeTruthy();
    expect(screen.getByText(/لا ينفذ أو ينشر أو يتصل بحسابات/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /تقسيم للمراجعة/ }).hasAttribute("disabled")).toBe(true);
  });

  it("bounds the task input and renders review-only workstreams in a mobile-safe grid", () => {
    const { container } = render(<AiTaskRouter />);
    const input = screen.getByLabelText("مهمة التطوير");
    expect(input.getAttribute("maxlength")).toBe(String(AI_ROUTER_MAX_LENGTH));
    expect(container.querySelector(".sm\\:grid-cols-3")).toBeTruthy();
    fireEvent.change(input, { target: { value: "أريد مراجعة مسارات API وإصلاح TypeScript مع اختبار الحماية قبل اعتماد أي تكامل." } });
    fireEvent.click(container.querySelector("button[type='submit']")!);
    expect(screen.getByText("مراجعة المالك مطلوبة")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "فتح المساحة" }).length).toBeGreaterThan(0);
  });
});
