import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import CodeWorkspace from "./CodeWorkspace";

const mocks = vi.hoisted(() => ({ suggest: vi.fn(), save: vi.fn(), suggestionOptions: undefined as any, selectedFile: { file: { id: 4, path: "src/main.ts", language: "typescript" }, content: "const answer = " } }));

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("wouter", () => ({ Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>, useLocation: () => ["/code?project=8", vi.fn()] }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ sourceFiles: { list: { invalidate: vi.fn() }, read: { invalidate: vi.fn() }, revisions: { invalidate: vi.fn() } } }),
    projects: { list: { useQuery: () => ({ data: [{ id: 8, name: "موقع أطلس", key: "SITE-8" }], isLoading: false }) } },
    sourceFiles: {
      list: { useQuery: () => ({ data: [{ id: 4, path: "src/main.ts", language: "typescript", revisionCount: 1 }], isLoading: false }) },
      read: { useQuery: () => ({ data: mocks.selectedFile }) },
      revisions: { useQuery: () => ({ data: [] }) },
      create: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      save: { useMutation: () => ({ mutate: mocks.save, isPending: false }) },
      remove: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    codeAssistant: {
      suggest: {
        useMutation: (options: any) => {
          mocks.suggestionOptions = options;
          return { mutate: mocks.suggest, isPending: false };
        },
      },
    },
  },
}));

describe("CodeWorkspace", () => {
  afterEach(cleanup);
  beforeEach(() => { vi.clearAllMocks(); mocks.suggestionOptions = undefined; });
  it("explains non-execution and shows the selected private source state", () => {
    render(<LanguageProvider><CodeWorkspace /></LanguageProvider>);
    expect(screen.getByText(/ولا يُنفذ أي كود مرفوع/)).toBeTruthy();
    expect(screen.getByText("src/main.ts · typescript")).toBeTruthy();
    expect((screen.getByRole("button", { name: /حفظ/ }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("8");
  });

  it("keeps a completion as a manual draft until the owner explicitly inserts and saves it", async () => {
    render(<LanguageProvider><CodeWorkspace /></LanguageProvider>);
    const completion = await screen.findByRole("button", { name: "إكمال السطر" });
    fireEvent.click(completion);
    expect(mocks.suggest).toHaveBeenCalledWith(expect.objectContaining({ sourceFileId: 4, mode: "complete" }));
    act(() => { mocks.suggestionOptions.onSuccess({ operation: "complete", suggestion: "42;", explanation: "إكمال ثابت", risks: [], tests: [] }); });
    expect(screen.getByLabelText("اقتراح كود للمراجعة")).toBeTruthy();
    expect(mocks.save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "إدراج المسودة" }));
    await waitFor(() => expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toContain("42;"));
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("offers private file diagnostics as a manual repair draft without autosaving", () => {
    render(<LanguageProvider><CodeWorkspace /></LanguageProvider>);
    expect(screen.getByLabelText("تشخيص الملف")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "تشخيص الملف" }));
    expect(mocks.suggest).toHaveBeenCalledWith(expect.objectContaining({ sourceFileId: 4, mode: "diagnose" }));
    act(() => { mocks.suggestionOptions.onSuccess({ operation: "diagnose", suggestion: "const answer = fallback;", explanation: "قيمة غير مكتملة", risks: ["راجع fallback"], tests: ["اختبر القيمة الفارغة"] }); });
    expect(screen.getByText("تشخيص وإصلاح مقترح للملف")).toBeTruthy();
    expect(mocks.save).not.toHaveBeenCalled();
  });
});
