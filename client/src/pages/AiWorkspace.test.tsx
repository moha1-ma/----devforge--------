import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AiWorkspace from "./AiWorkspace";

let askMutate: ReturnType<typeof vi.fn>;
let askOptions: { onSuccess?: (result: any) => Promise<void>; onError?: (error: Error) => void } | undefined;
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
      ask: { useMutation: (options: typeof askOptions) => { askOptions = options; return { mutate: askMutate, isPending: false }; } },
    },
    githubWorkspace: { getLink: { useQuery: () => ({ data: null }) } },
  },
}));

describe("AiWorkspace", () => {
  afterEach(cleanup);
  beforeEach(() => { askMutate = vi.fn(); askOptions = undefined; });
  it("renders the request-triggered managed assistant disclosure", () => {
    render(<LanguageProvider><AiWorkspace /></LanguageProvider>);
    expect(screen.getByText(/يُستدعى النموذج المُدار من الخادم فقط عند ضغط إرسال/)).toBeTruthy();
    expect(screen.getByText(/استخدام مُدار عند الطلب/)).toBeTruthy();
    expect(screen.getByText("سياق GitHub اختياري")).toBeTruthy();
    expect(screen.getByText(/لا يقرأ ملفات GitHub ولا يكتب أو يدفع أي تغييرات/)).toBeTruthy();
  });

  it("keeps research explicit and records the requested mode with source disclosure", () => {
    render(<LanguageProvider><AiWorkspace /></LanguageProvider>);
    expect(screen.getByText(/لن يُجرى بحث خارجي لهذه الرسالة/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText("اطلب بحثًا موثوقًا لهذه الرسالة"));
    expect(screen.getByText(/يُنفّذ البحث لهذه الرسالة فقط/)).toBeTruthy();
    fireEvent.click(screen.getByText("إرسال للمساعد"));
    expect(askMutate).toHaveBeenCalledWith(expect.objectContaining({ threadId: 1, researchMode: "trusted-web" }));
  });

  it("shows returned research sources and a recoverable request error", async () => {
    render(<LanguageProvider><AiWorkspace /></LanguageProvider>);
    await act(async () => { await askOptions?.onSuccess?.({ research: { requested: true, disclosure: "مصدر واحد متاح.", sources: ["https://example.org/source"] } }); });
    expect(screen.getByLabelText("مصادر البحث")).toBeTruthy();
    expect(screen.getByRole("link", { name: "https://example.org/source" })).toBeTruthy();
    act(() => { askOptions?.onError?.(new Error("تعذر الوصول إلى البحث")); });
    expect(screen.getByRole("alert").textContent).toContain("تعذر الوصول إلى البحث");
  });

  it("retries only the last explicit trusted-web request through a mobile-safe control", () => {
    render(<LanguageProvider><AiWorkspace /></LanguageProvider>);
    fireEvent.click(screen.getByLabelText("اطلب بحثًا موثوقًا لهذه الرسالة"));
    fireEvent.click(screen.getByText("إرسال للمساعد"));
    act(() => { askOptions?.onError?.(new Error("تعذر الوصول إلى البحث")); });

    const retry = screen.getByRole("button", { name: "إعادة محاولة البحث الموثق" });
    expect(retry.className).toContain("w-full");
    expect(retry.className).toContain("sm:w-auto");
    fireEvent.click(retry);
    expect(askMutate).toHaveBeenLastCalledWith(expect.objectContaining({ threadId: 1, content: "اختبر الرد", researchMode: "trusted-web" }));
  });
});
