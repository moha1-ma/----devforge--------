import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DeveloperCenter from "./DeveloperCenter";

const generate = vi.fn();
let proposalsQuery: any = { data: [], isLoading: false, error: null };
let tasksQuery: any = { data: [] };
let language = "ar";

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ direction: language === "en" ? "ltr" : "rtl", language }) }));
vi.mock("@/lib/trpc", () => ({ trpc: {
  useUtils: () => ({ developerCenter: { list: { invalidate: vi.fn() }, listTasks: { invalidate: vi.fn() } } }),
  developerCenter: { list: { useQuery: () => proposalsQuery }, listTasks: { useQuery: () => tasksQuery }, generate: { useMutation: () => ({ mutate: generate, isPending: false }) } },
} }));

describe("DeveloperCenter", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); proposalsQuery = { data: [], isLoading: false, error: null }; tasksQuery = { data: [] }; language = "ar"; });

  it("offers Python by default and sends only a structured review proposal", () => {
    render(<DeveloperCenter />);
    expect((screen.getByLabelText("لغة التصميم المقترحة") as HTMLSelectElement).value).toBe("python");
    const submit = screen.getByRole("button", { name: "إنشاء مقترح" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("وصف الطلب"), { target: { value: "صمم طبقة Python آمنة لمعالجة بيانات تعليمية مع اختبارات واضحة." } });
    fireEvent.click(submit);
    expect(generate).toHaveBeenCalledWith(expect.objectContaining({ mode: "software", languageKey: "python", focus: "general" }));
    expect(screen.getByText(/لا تعديل ملفات، ولا تشغيل كود/)).toBeTruthy();
  });

  it("shows the self-improvement mode as a review workflow rather than an execution action", () => {
    render(<DeveloperCenter />);
    fireEvent.click(screen.getByRole("button", { name: /دورة تحسين ذاتي/ }));
    expect(screen.getByText(/تشخيص ومقترحات واختبارات وموافقة قبل أي تغيير يدوي/)).toBeTruthy();
    expect(screen.getByText(/ليست أوامر قابلة للتشغيل/)).toBeTruthy();
  });

  it("renders reviewed English labels while preserving the private request as owner-entered text", () => {
    language = "en";
    render(<DeveloperCenter />);
    expect(screen.getByText("AI Developer Center")).toBeTruthy();
    expect(screen.getAllByText("Software architect")).toHaveLength(2);
    expect(screen.getByLabelText("Proposed design language")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create proposal" })).toBeTruthy();
  });
});
