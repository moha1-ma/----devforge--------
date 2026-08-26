import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import VisitorSubmissionPage from "./VisitorSubmissionPage";

const submit = vi.fn();
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ direction: "rtl" }) }));
vi.mock("@/lib/trpc", () => ({ trpc: { visitorSubmissions: { policy: { useQuery: () => ({ data: { copy: "تتم مراجعة المحتوى يدويًا ولا يُنشر تلقائيًا." } }) }, submit: { useMutation: () => ({ mutate: submit, isPending: false }) } } } }));

describe("VisitorSubmissionPage", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });
  it("keeps a visitor submission gated by policy consent and sends it as pending content", () => {
    render(<VisitorSubmissionPage />);
    const button = screen.getByRole("button", { name: "إرسال للمراجعة" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(screen.getByText(/لا يُنشر تلقائيًا/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("عنوان المشاركة"), { target: { value: "اقتراح تعليمي" } });
    fireEvent.change(screen.getByLabelText("وصف المشاركة"), { target: { value: "هذه فكرة واضحة لتحسين التجربة التعليمية للزوار." } });
    fireEvent.click(screen.getByRole("checkbox"));
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    expect(submit).toHaveBeenCalledWith({ visitorAlias: undefined, category: "opinion", title: "اقتراح تعليمي", content: "هذه فكرة واضحة لتحسين التجربة التعليمية للزوار.", consentAccepted: true, attachments: [] });
  });
});
