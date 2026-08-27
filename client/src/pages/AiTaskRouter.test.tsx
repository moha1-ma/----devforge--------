import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { AI_ROUTER_MAX_LENGTH } from "@/lib/aiTaskRouter";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AiTaskRouter from "./AiTaskRouter";

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("wouter", () => ({ useLocation: () => ["/ai-router", vi.fn()] }));

describe("AI task router page", () => {
  afterEach(cleanup);

  it("keeps routing owner-scoped and does not present it as an automatic executor", () => {
    render(<LanguageProvider><AiTaskRouter /></LanguageProvider>);
    expect(screen.getByText("خاص بالمالك")).toBeTruthy();
    expect(screen.getByText(/لا ينفذ أو ينشر أو يتصل بحسابات/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /تقسيم للمراجعة/ }).hasAttribute("disabled")).toBe(true);
  });

  it("bounds the task input and renders review-only workstreams in a mobile-safe grid", () => {
    const { container } = render(<LanguageProvider><AiTaskRouter /></LanguageProvider>);
    const input = screen.getByLabelText("مهمة التطوير");
    expect(input.getAttribute("maxlength")).toBe(String(AI_ROUTER_MAX_LENGTH));
    expect(container.querySelector(".sm\\:grid-cols-3")).toBeTruthy();
    fireEvent.change(input, { target: { value: "أريد مراجعة مسارات API وإصلاح TypeScript مع اختبار الحماية قبل اعتماد أي تكامل." } });
    fireEvent.click(container.querySelector("button[type='submit']")!);
    expect(screen.getByText("مراجعة المالك مطلوبة")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "فتح المساحة" }).length).toBeGreaterThan(0);
  });

  it("uses the reviewed English copy when English is selected without changing review-only safeguards", () => {
    localStorage.setItem("devforge-language", "en");
    render(<LanguageProvider><AiTaskRouter /></LanguageProvider>);
    expect(screen.getByText("AI task router")).toBeTruthy();
    expect(screen.getByText(/does not execute, publish, or connect/)).toBeTruthy();
    localStorage.removeItem("devforge-language");
  });
});
