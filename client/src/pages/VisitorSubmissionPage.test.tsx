import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import VisitorSubmissionPage from "./VisitorSubmissionPage";

const submit = vi.fn();
let mutationOutcome: "success" | "error" = "success";
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ direction: "rtl" }) }));
vi.mock("@/lib/trpc", () => ({ trpc: { visitorSubmissions: { policy: { useQuery: () => ({ data: { copy: "تتم مراجعة المحتوى يدويًا ولا يُنشر تلقائيًا." } }) }, submit: { useMutation: (options: { onSuccess: () => void; onError: (error: Error) => void }) => ({ mutate: (input: unknown) => { submit(input); if (mutationOutcome === "error") options.onError(new Error("تعذر الاتصال")); else options.onSuccess(); }, isPending: false }) } } } }));

describe("VisitorSubmissionPage", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); mutationOutcome = "success"; });
  it("explains consent and keeps a successful pending share visible", () => {
    render(<VisitorSubmissionPage />);
    const button = screen.getByRole("button", { name: "إرسال للمراجعة" });
    fireEvent.change(screen.getByLabelText("عنوان المشاركة"), { target: { value: "اقتراح تعليمي" } });
    fireEvent.change(screen.getByLabelText("وصف المشاركة"), { target: { value: "هذه فكرة واضحة لتحسين التجربة التعليمية للزوار." } });
    fireEvent.click(button);
    expect(screen.getByRole("status").textContent).toContain("فعّل مربع الموافقة");
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(button);
    expect(submit).toHaveBeenCalledWith({ visitorAlias: undefined, category: "opinion", title: "اقتراح تعليمي", content: "هذه فكرة واضحة لتحسين التجربة التعليمية للزوار.", mediaReferenceUrl: undefined, consentAccepted: true, attachments: [] });
    expect(screen.getByRole("status").textContent).toContain("تم استلام مشاركتك");
  });
  it("rejects an invalid attachment before sending it", () => {
    render(<VisitorSubmissionPage />);
    fireEvent.change(screen.getByLabelText("إضافة مرفقات"), { target: { files: [new File(["binary"], "unsafe.exe", { type: "application/octet-stream" })] } });
    expect(screen.getByRole("status").textContent).toContain("نوع الملف غير مدعوم");
    expect(submit).not.toHaveBeenCalled();
  });
  it("shows a retry action after a valid request fails", () => {
    mutationOutcome = "error";
    render(<VisitorSubmissionPage />);
    fireEvent.change(screen.getByLabelText("عنوان المشاركة"), { target: { value: "تجربة اتصال" } });
    fireEvent.change(screen.getByLabelText("وصف المشاركة"), { target: { value: "هذه مشاركة صالحة لاختبار رسالة الفشل الظاهرة." } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "إرسال للمراجعة" }));
    expect(screen.getByRole("status").textContent).toContain("تعذر الاتصال");
    fireEvent.click(screen.getByRole("button", { name: "حاول الإرسال مجددًا" }));
    expect(submit).toHaveBeenCalledTimes(2);
  });
  it("passes an allowlisted media reference only as a pending review field", () => {
    render(<VisitorSubmissionPage />);
    fireEvent.change(screen.getByLabelText("عنوان المشاركة"), { target: { value: "فيديو تعليمي" } });
    fireEvent.change(screen.getByLabelText("وصف المشاركة"), { target: { value: "مشاركة مرئية صالحة تنتظر مراجعة المالك قبل الظهور." } });
    fireEvent.change(screen.getByLabelText("رابط وسيط اختياري"), { target: { value: "https://www.youtube.com/watch?v=example" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "إرسال للمراجعة" }));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ mediaReferenceUrl: "https://www.youtube.com/watch?v=example" }));
    expect(screen.getByRole("status").textContent).toContain("معلّقة");
  });
});
