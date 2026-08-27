import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import GlobalResearchHub from "./GlobalResearchHub";

const mocks = vi.hoisted(() => ({ mutate: vi.fn(), unifiedMutate: vi.fn(), options: undefined as any, unifiedOptions: undefined as any }));
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({ trpc: { globalResearch: { catalog: { useQuery: () => ({ data: [{ key: "openalex", name: "OpenAlex", category: "أبحاث", description: "بحث مفتوح", documentationUrl: "https://help.openalex.org/api/", searchable: true }, { key: "crossref", name: "Crossref", category: "DOI", description: "بيانات", documentationUrl: "https://crossref.org", searchable: true }, { key: "wikidata", name: "Wikidata", category: "معرفة", description: "كيانات", documentationUrl: "https://wikidata.org", searchable: true }, { key: "world-bank", name: "البنك الدولي", category: "إحصاء", description: "بيانات عامة", documentationUrl: "https://datahelpdesk.worldbank.org", searchable: false }], isLoading: false }) }, search: { useMutation: (options: any) => { mocks.options = options; return { mutate: mocks.mutate, isPending: false }; } }, searchUnified: { useMutation: (options: any) => { mocks.unifiedOptions = options; return { mutate: mocks.unifiedMutate, isPending: false }; } } } } }));

describe("GlobalResearchHub", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.options = undefined; mocks.unifiedOptions = undefined; });
  afterEach(cleanup);
  it("shows curated source boundaries and sends an owner-requested search through the disclosed approved sources", () => {
    render(<LanguageProvider><GlobalResearchHub /></LanguageProvider>);
    expect(screen.getByText("مركز البحث العالمي")).toBeTruthy();
    expect(screen.getByText("مرجع متخصص")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("عبارة البحث"), { target: { value: "تعلم مسؤول" } });
    const submit = screen.getByRole("button", { name: "بحث داخل المنصة" });
    expect(submit.className).toContain("w-full");
    expect(submit.className).toContain("sm:w-auto");
    fireEvent.click(submit);
    expect(mocks.unifiedMutate).toHaveBeenCalledWith({ sources: ["openalex", "crossref", "wikidata"], query: "تعلم مسؤول" });
  });

  it("can narrow a search to one chosen source", () => {
    render(<LanguageProvider><GlobalResearchHub /></LanguageProvider>);
    fireEvent.change(screen.getByLabelText("نطاق البحث"), { target: { value: "openalex" } });
    fireEvent.change(screen.getByLabelText("عبارة البحث"), { target: { value: "تعلم مسؤول" } });
    fireEvent.click(screen.getByRole("button", { name: "بحث داخل المنصة" }));
    expect(mocks.mutate).toHaveBeenCalledWith({ source: "openalex", query: "تعلم مسؤول" });
  });
  it("renders source disclosure and original result links without a direct write action", () => {
    render(<LanguageProvider><GlobalResearchHub /></LanguageProvider>);
    act(() => { mocks.unifiedOptions.onSuccess({ query: "تعلم", disclosure: "نتائج قراءة فقط", sources: [{ source: { name: "OpenAlex", documentationUrl: "https://help.openalex.org/api/", attribution: "OpenAlex" }, results: [{ title: "بحث تعليمي", summary: "ملخص خارجي", url: "https://example.org/work", meta: "2026" }] }, { source: { name: "Wikidata", documentationUrl: "https://wikidata.org", attribution: "Wikidata" }, results: [], error: "انتهت المهلة" }] }); });
    expect(screen.getByLabelText("نتائج البحث العالمي")).toBeTruthy();
    expect(screen.getByRole("link", { name: "بحث تعليمي" }).getAttribute("href")).toBe("https://example.org/work");
    expect(document.body.textContent).toContain("قراءة فقط");
    expect(document.body.textContent).toContain("انتهت المهلة");
  });
});
