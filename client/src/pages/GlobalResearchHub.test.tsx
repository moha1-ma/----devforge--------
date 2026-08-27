import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import GlobalResearchHub from "./GlobalResearchHub";

const mocks = vi.hoisted(() => ({ mutate: vi.fn(), options: undefined as any }));
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({ trpc: { globalResearch: { catalog: { useQuery: () => ({ data: [{ key: "openalex", name: "OpenAlex", category: "أبحاث", description: "بحث مفتوح", documentationUrl: "https://help.openalex.org/api/", searchable: true }, { key: "world-bank", name: "البنك الدولي", category: "إحصاء", description: "بيانات عامة", documentationUrl: "https://datahelpdesk.worldbank.org", searchable: false }], isLoading: false }) }, search: { useMutation: (options: any) => { mocks.options = options; return { mutate: mocks.mutate, isPending: false }; } } } } }));

describe("GlobalResearchHub", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.options = undefined; });
  afterEach(cleanup);
  it("shows curated source boundaries and sends one owner-requested search through the selected source", () => {
    render(<LanguageProvider><GlobalResearchHub /></LanguageProvider>);
    expect(screen.getByText("مركز البحث العالمي")).toBeTruthy();
    expect(screen.getByText("مرجع متخصص")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("عبارة البحث"), { target: { value: "تعلم مسؤول" } });
    const submit = screen.getByRole("button", { name: "بحث داخل المنصة" });
    expect(submit.className).toContain("w-full");
    expect(submit.className).toContain("sm:w-auto");
    fireEvent.click(submit);
    expect(mocks.mutate).toHaveBeenCalledWith({ source: "openalex", query: "تعلم مسؤول" });
  });
  it("renders source disclosure and original result links without a direct write action", () => {
    render(<LanguageProvider><GlobalResearchHub /></LanguageProvider>);
    act(() => { mocks.options.onSuccess({ query: "تعلم", source: { name: "OpenAlex", documentationUrl: "https://help.openalex.org/api/", attribution: "OpenAlex" }, disclosure: "نتائج قراءة فقط", results: [{ title: "بحث تعليمي", summary: "ملخص خارجي", url: "https://example.org/work", meta: "2026" }] }); });
    expect(screen.getByLabelText("نتائج البحث العالمي")).toBeTruthy();
    expect(screen.getByRole("link", { name: "بحث تعليمي" }).getAttribute("href")).toBe("https://example.org/work");
    expect(document.body.textContent).toContain("قراءة فقط");
  });
});
