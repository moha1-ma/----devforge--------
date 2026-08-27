export const globalResearchSources = [
  { key: "openalex", name: "OpenAlex", category: "أبحاث مفتوحة", description: "أعمال بحثية ومؤلفون ومؤسسات وموضوعات.", documentationUrl: "https://help.openalex.org/api/", attribution: "OpenAlex", searchable: true },
  { key: "crossref", name: "Crossref", category: "بيانات DOI", description: "بيانات وصفية للمنشورات والرخص والتمويل.", documentationUrl: "https://www.crossref.org/documentation/retrieve-metadata/rest-api/", attribution: "Crossref", searchable: true },
  { key: "wikidata", name: "Wikidata", category: "معرفة منظمة", description: "كيانات ومفاهيم وروابط معرفة عامة.", documentationUrl: "https://www.wikidata.org/wiki/Wikidata:Data_access", attribution: "Wikidata / Wikimedia", searchable: true },
  { key: "world-bank", name: "البنك الدولي للبيانات", category: "تنمية وإحصاء", description: "مؤشرات تنموية عامة تحتاج رمز بلد ومؤشر محددين.", documentationUrl: "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation", attribution: "World Bank Open Data", searchable: false },
] as const;

export type GlobalResearchSourceKey = (typeof globalResearchSources)[number]["key"];
type SearchableSourceKey = Extract<GlobalResearchSourceKey, "openalex" | "crossref" | "wikidata">;

export type GlobalResearchResult = { title: string; summary: string; url: string; meta?: string };

const sourceByKey = new Map(globalResearchSources.map(source => [source.key, source]));
const queryLimit = 180;
const resultLimit = 5;

function sourceFor(key: GlobalResearchSourceKey) {
  const source = sourceByKey.get(key);
  if (!source) throw new Error("مصدر البحث غير معتمد.");
  return source;
}

function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function compact(value: string, max = 280) { return value.length > max ? `${value.slice(0, max - 1)}…` : value; }

function buildUrl(source: SearchableSourceKey, query: string) {
  const encoded = encodeURIComponent(query);
  if (source === "openalex") return `https://api.openalex.org/works?search=${encoded}&per-page=${resultLimit}&select=id,title,doi,publication_date,primary_location`;
  if (source === "crossref") return `https://api.crossref.org/works?query=${encoded}&rows=${resultLimit}&select=DOI,title,publisher,published-print,published-online`;
  return `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encoded}&language=ar&uselang=ar&format=json&origin=*&limit=${resultLimit}`;
}

function mapOpenAlex(payload: any): GlobalResearchResult[] {
  return Array.isArray(payload?.results) ? payload.results.slice(0, resultLimit).map((item: any) => ({
    title: text(item.title) || "سجل بحثي بلا عنوان",
    summary: compact(text(item.primary_location?.source?.display_name) || "سجل من OpenAlex"),
    url: text(item.doi) || text(item.id),
    meta: text(item.publication_date),
  })).filter((item: GlobalResearchResult) => item.url) : [];
}

function mapCrossref(payload: any): GlobalResearchResult[] {
  const items = payload?.message?.items;
  return Array.isArray(items) ? items.slice(0, resultLimit).map((item: any) => ({
    title: text(item.title?.[0]) || "سجل Crossref بلا عنوان",
    summary: compact(text(item.publisher) || "بيانات وصفية من Crossref"),
    url: text(item.DOI) ? `https://doi.org/${text(item.DOI)}` : "",
    meta: text(item["published-print"]?.["date-parts"]?.[0]?.join("-")) || text(item["published-online"]?.["date-parts"]?.[0]?.join("-")),
  })).filter((item: GlobalResearchResult) => item.url) : [];
}

function mapWikidata(payload: any): GlobalResearchResult[] {
  return Array.isArray(payload?.search) ? payload.search.slice(0, resultLimit).map((item: any) => ({
    title: text(item.label) || text(item.id) || "كيان Wikidata",
    summary: compact(text(item.description) || "كيان معرفي من Wikidata"),
    url: text(item.concepturi) || `https://www.wikidata.org/wiki/${encodeURIComponent(text(item.id))}`,
    meta: text(item.id),
  })).filter((item: GlobalResearchResult) => item.url) : [];
}

export function listGlobalResearchSources() { return globalResearchSources.map(source => ({ ...source, access: "public-reference" as const })); }

export async function searchGlobalResearch(input: { source: SearchableSourceKey; query: string }) {
  const query = input.query.trim().replace(/\s+/g, " ");
  if (!query || query.length > queryLimit) throw new Error(`اكتب عبارة بحث بين 1 و${queryLimit} حرفًا.`);
  const source = sourceFor(input.source);
  if (!source.searchable) throw new Error("هذا المصدر مرجعي فقط ويتطلب رموز مؤشرات محددة خارج هذا البحث المبسط.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7_000);
  try {
    const response = await fetch(buildUrl(input.source, query), { headers: { accept: "application/json", "user-agent": "DevForge-Research-ReadOnly/1.0" }, signal: controller.signal });
    if (!response.ok) throw new Error(`تعذر الوصول إلى ${source.name} الآن (رمز ${response.status}).`);
    const payload = await response.json();
    const results = input.source === "openalex" ? mapOpenAlex(payload) : input.source === "crossref" ? mapCrossref(payload) : mapWikidata(payload);
    return { query, source: { key: source.key, name: source.name, documentationUrl: source.documentationUrl, attribution: source.attribution }, results, disclosure: "نتائج قراءة فقط من المصدر المحدد. راجع الرابط الأصلي والترخيص قبل إعادة الاستخدام أو الاعتماد." };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("انتهت مهلة مصدر البحث. أعد المحاولة لاحقًا أو اختر مصدرًا آخر.");
    throw error;
  } finally { clearTimeout(timeout); }
}
