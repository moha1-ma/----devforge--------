import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listGlobalResearchSources, searchGlobalResearch, searchUnifiedGlobalResearch } from "./globalResearch";

const fetchMock = vi.fn();

describe("global research service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("publishes a curated catalog and keeps the World Bank entry as a reference-only source", () => {
    const catalog = listGlobalResearchSources();
    expect(catalog.map(source => source.key)).toEqual(["openalex", "crossref", "wikidata", "world-bank"]);
    expect(catalog.find(source => source.key === "world-bank")?.searchable).toBe(false);
    expect(catalog.every(source => source.access === "public-reference")).toBe(true);
  });

  it("uses only the selected approved source URL and maps external text as read-only results", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ results: [{ id: "https://openalex.org/W1", title: "نظام تعلم", doi: "https://doi.org/10.1/example", publication_date: "2026-01-01", primary_location: { source: { display_name: "Open Journal" } } }] }) });
    const result = await searchGlobalResearch({ source: "openalex", query: "تعلم آلي" });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("https://api.openalex.org/works?search="), expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(result.results).toEqual([expect.objectContaining({ title: "نظام تعلم", url: "https://doi.org/10.1/example" })]);
    expect(result.disclosure).toContain("قراءة فقط");
  });

  it("rejects oversized queries before making an external request", async () => {
    await expect(searchGlobalResearch({ source: "wikidata", query: "س".repeat(181) })).rejects.toThrow("180");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("runs an owner-chosen unified search only across approved sources and preserves partial failures", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ results: [{ id: "https://openalex.org/W1", title: "بحث", primary_location: { source: { display_name: "Open" } } }] }) });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ message: { items: [{ DOI: "10.1/example", title: ["DOI record"], publisher: "Publisher" }] } }) });
    fetchMock.mockRejectedValueOnce(new Error("المصدر غير متاح"));
    const result = await searchUnifiedGlobalResearch({ sources: ["openalex", "crossref", "wikidata"], query: "ذكاء مسؤول" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.map(call => String(call[0]))).toEqual(expect.arrayContaining([expect.stringContaining("api.openalex.org"), expect.stringContaining("api.crossref.org"), expect.stringContaining("wikidata.org")]));
    expect(result.sources).toEqual(expect.arrayContaining([expect.objectContaining({ source: expect.objectContaining({ name: "OpenAlex" }), results: [expect.objectContaining({ title: "بحث" })] }), expect.objectContaining({ source: expect.objectContaining({ name: "Wikidata" }), error: "المصدر غير متاح" })]));
    expect(result.disclosure).toContain("المصادر المعتمدة");
  });
});
