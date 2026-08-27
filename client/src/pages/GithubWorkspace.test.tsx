import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import GithubWorkspace from "./GithubWorkspace";

const actionMocks = vi.hoisted(() => ({ selectRepository: vi.fn(), prepareMerge: vi.fn() }));
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ githubWorkspace: { getLink: { invalidate: vi.fn() } } }),
    projects: { list: { useQuery: () => ({ data: [] }) } },
    githubWorkspace: {
      getLink: { useQuery: () => ({ data: null }) },
      selectRepository: { useMutation: () => ({ mutate: actionMocks.selectRepository, isPending: false }) },
    },
    githubMerge: { prepare: { useMutation: () => ({ mutate: actionMocks.prepareMerge, isPending: false, data: null }) } },
  },
}));

describe("GithubWorkspace", () => {
  afterEach(cleanup);
  beforeEach(() => vi.clearAllMocks());
  it("keeps repository selection available but blocks connection execution", () => {
    render(<LanguageProvider><GithubWorkspace /></LanguageProvider>);
    expect(screen.getByText(/لا يمنح هذا وصولًا ولا ينفذ استيرادًا أو تصديرًا/)).toBeTruthy();
    expect(screen.getByText(/اختيار المستودع يحفظ مرجعًا للمراجعة في DevForge فقط/)).toBeTruthy();
    expect((screen.getByLabelText("المستودع") as HTMLInputElement).placeholder).toContain("https://github.com");
    expect((screen.getByRole("button", { name: "حفظ الاختيار" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: /انتظار مصادقة GitHub الصريحة/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("heading", { name: "خطة دمج موحّدة للمراجعة" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "إنشاء خطة المراجعة" })).toBeTruthy();
    expect(actionMocks.selectRepository).not.toHaveBeenCalled();
    expect(actionMocks.prepareMerge).not.toHaveBeenCalled();
  });
});
