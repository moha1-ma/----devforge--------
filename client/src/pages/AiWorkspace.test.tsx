import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AiWorkspace from "./AiWorkspace";

let askMutate: ReturnType<typeof vi.fn>;
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/components/AIChatBox", () => ({ AIChatBox: ({ onSendMessage }: { onSendMessage: (text: string) => void }) => <button onClick={() => onSendMessage("اختبر الرد")}>إرسال للمساعد</button> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ aiWorkspace: { listThreads: { invalidate: vi.fn() }, messages: { invalidate: vi.fn() } } }),
    projects: { list: { useQuery: () => ({ data: [] }) } },
    aiWorkspace: {
      listThreads: { useQuery: () => ({ data: [{ id: 1, title: "مراجعة مستودع", provider: "managed" }] }) },
      messages: { useQuery: () => ({ data: [] }) },
      createThread: { useMutation: () => ({ mutate: vi.fn() }) },
      ask: { useMutation: () => ({ mutate: askMutate, isPending: false }) },
    },
    githubWorkspace: { getLink: { useQuery: () => ({ data: null }) } },
  },
}));

describe("AiWorkspace", () => {
  afterEach(cleanup);
  beforeEach(() => { askMutate = vi.fn(); });
  it("renders the request-triggered managed assistant disclosure", () => {
    render(<LanguageProvider><AiWorkspace /></LanguageProvider>);
    expect(screen.getByText(/يُستدعى النموذج المُدار من الخادم فقط عند ضغط إرسال/)).toBeTruthy();
    expect(screen.getByText(/استخدام مُدار عند الطلب/)).toBeTruthy();
    expect(screen.getByText("سياق GitHub اختياري")).toBeTruthy();
    expect(screen.getByText(/لا يقرأ ملفات GitHub ولا يكتب أو يدفع أي تغييرات/)).toBeTruthy();
  });

  it("keeps research explicit and records the requested mode without calling an external source", () => {
    render(<LanguageProvider><AiWorkspace /></LanguageProvider>);
    expect(screen.getByText(/لن يُجرى بحث خارجي لهذه الرسالة/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText("اطلب بحثًا موثوقًا لهذه الرسالة"));
    expect(screen.getByText(/لا يوجد مزود بحث مهيأ داخل DevForge الآن/)).toBeTruthy();
    fireEvent.click(screen.getByText("إرسال للمساعد"));
    expect(askMutate).toHaveBeenCalledWith(expect.objectContaining({ threadId: 1, researchMode: "trusted-web" }));
  });
});
