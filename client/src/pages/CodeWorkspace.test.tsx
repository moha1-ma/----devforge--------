import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import CodeWorkspace from "./CodeWorkspace";

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("wouter", () => ({ Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>, useLocation: () => ["/code?project=8", vi.fn()] }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ sourceFiles: { list: { invalidate: vi.fn() }, read: { invalidate: vi.fn() }, revisions: { invalidate: vi.fn() } } }),
    projects: { list: { useQuery: () => ({ data: [{ id: 8, name: "موقع أطلس", key: "SITE-8" }], isLoading: false }) } },
    sourceFiles: {
      list: { useQuery: () => ({ data: [], isLoading: false }) },
      read: { useQuery: () => ({ data: undefined }) },
      revisions: { useQuery: () => ({ data: [] }) },
      create: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      save: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      remove: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

describe("CodeWorkspace", () => {
  afterEach(cleanup);
  it("explains non-execution and shows an empty private source state", () => {
    render(<LanguageProvider><CodeWorkspace /></LanguageProvider>);
    expect(screen.getByText(/ولا يُنفذ أي كود مرفوع/)).toBeTruthy();
    expect(screen.getByText(/لا توجد ملفات بعد/)).toBeTruthy();
    expect((screen.getByRole("button", { name: /حفظ/ }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("8");
  });
});
