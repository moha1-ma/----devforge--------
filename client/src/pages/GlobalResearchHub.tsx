import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { BookOpenCheck, ExternalLink, Globe2, Loader2, Search, ShieldCheck } from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

type SearchableSource = "openalex" | "crossref" | "wikidata";
type ResultItem = { title: string; summary: string; url: string; meta?: string };
type SourceDetails = { key?: string; name: string; documentationUrl: string; attribution: string };
type SingleResult = { query: string; source: SourceDetails; results: ResultItem[]; disclosure: string };
type UnifiedResult = { query: string; sources: Array<{ source: SourceDetails; results: ResultItem[]; disclosure?: string; error?: string }>; disclosure: string };
type ResearchResult = SingleResult | UnifiedResult;

function isUnifiedResult(result: ResearchResult): result is UnifiedResult { return "sources" in result; }

export default function GlobalResearchHub() {
  const { direction, t } = useLanguage();
  const { data: catalog = [], isLoading } = trpc.globalResearch.catalog.useQuery();
  const [sourceKey, setSourceKey] = useState<SearchableSource | "all">("all");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const search = trpc.globalResearch.search.useMutation({
    onSuccess: response => { setResult(response); toast.success(`${t("globalResultsPrefix")} ${response.source.name}: ${response.results.length}`); },
    onError: issue => toast.error(issue.message),
  });
  const searchUnified = trpc.globalResearch.searchUnified.useMutation({
    onSuccess: response => { setResult(response); const successful = response.sources.filter(item => !item.error).length; toast.success(`${successful}/${response.sources.length} ${t("globalSearchAll")}`); },
    onError: issue => toast.error(issue.message),
  });
  const searchable = useMemo(() => catalog.filter(source => source.searchable), [catalog]);
  const isSearching = search.isPending || searchUnified.isPending;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) return;
    setResult(null);
    if (sourceKey === "all") searchUnified.mutate({ sources: ["openalex", "crossref", "wikidata"], query: query.trim() });
    else search.mutate({ source: sourceKey, query: query.trim() });
  }

  const resultsTitle = result && isUnifiedResult(result) ? t("globalResults") : result ? `${t("globalResultsPrefix")} ${result.source.name}` : "";
  return <DashboardLayout><section dir={direction} className="space-y-5 sm:space-y-6">
    <header className="relative overflow-hidden rounded-[2rem] border border-emerald-300/15 bg-gradient-to-l from-emerald-400/12 via-slate-950 to-cyan-400/10 p-6 sm:p-8"><div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-emerald-300/10 blur-3xl" /><Badge className="relative border border-emerald-300/20 bg-emerald-300/10 text-emerald-100"><ShieldCheck className="ml-1 h-3.5 w-3.5" />{t("globalResearchOwner")}</Badge><div className="relative mt-5 flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-300 text-slate-950"><Globe2 className="h-6 w-6" /></div><div><h1 className="text-2xl font-bold text-white sm:text-3xl">{t("globalResearchTitle")}</h1><p className="mt-2 max-w-3xl leading-8 text-slate-300">{t("globalResearchIntro")}</p></div></div></header>

    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]"><form onSubmit={submit} className="rounded-3xl border border-white/8 bg-slate-950/55 p-5 sm:p-6"><div className="flex items-start gap-3"><Search className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" /><div><h2 className="font-bold text-white">{t("globalSearchTitle")}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{t("globalSearchCopy")}</p></div></div><label htmlFor="global-source" className="mt-5 block text-sm font-semibold text-slate-300">{t("globalSearchScope")}</label><select id="global-source" value={sourceKey} onChange={event => setSourceKey(event.target.value as SearchableSource | "all")} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/[0.035] px-3 text-white outline-none focus:border-emerald-300/40"><option value="all">{t("globalSearchAll")}</option>{searchable.map(source => <option key={source.key} value={source.key}>{source.name} · {source.category}</option>)}</select><label htmlFor="global-query" className="sr-only">{t("globalQuery")}</label><Input id="global-query" value={query} onChange={event => setQuery(event.target.value)} className="mt-4 h-12 border-white/10 bg-white/[0.035] text-white placeholder:text-slate-600" placeholder={t("globalQueryPlaceholder")} maxLength={180} /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs leading-6 text-slate-500">{query.length}/180 · {t("globalSearchBoundary")}</p><Button type="submit" disabled={isSearching || !query.trim() || !searchable.length} className="w-full bg-emerald-300 text-slate-950 hover:bg-emerald-200 sm:w-auto">{isSearching ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Search className="ml-2 h-4 w-4" />}{isSearching ? t("globalSearching") : t("globalSearchSubmit")}</Button></div></form><aside className="rounded-3xl border border-amber-300/15 bg-amber-300/[0.045] p-5"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" /><div><h2 className="font-bold text-amber-100">{t("globalBoundaries")}</h2><p className="mt-2 text-sm leading-7 text-amber-100/70">{t("globalBoundariesCopy")}</p></div></div></aside></section>

    <section aria-label={t("globalCatalogAria")} className="rounded-3xl border border-white/8 bg-white/[0.025] p-5 sm:p-6"><div className="flex items-start gap-3"><BookOpenCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" /><div><h2 className="font-bold text-white">{t("globalCatalog")}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{t("globalCatalogCopy")}</p></div></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{isLoading ? <p role="status" className="inline-flex items-center gap-2 text-sm text-cyan-200"><Loader2 className="h-5 w-5 animate-spin text-cyan-300" />{t("globalCatalogLoading")}</p> : catalog.map(source => <article key={source.key} className="rounded-2xl border border-white/8 bg-slate-950/40 p-4"><Badge variant="outline" className="border-cyan-300/20 text-cyan-100">{source.category}</Badge><h3 className="mt-3 font-bold text-white">{source.name}</h3><p className="mt-2 min-h-14 text-sm leading-6 text-slate-500">{source.description}</p><p className="mt-3 text-xs font-semibold text-emerald-200">{source.searchable ? t("globalSearchable") : t("globalSpecialized")}</p><a href={source.documentationUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-cyan-200 hover:text-cyan-100">{t("globalSourceDocs")} <ExternalLink className="h-3.5 w-3.5" /></a></article>)}</div></section>

    {result ? <section aria-label={t("globalResultsLabel")} className="rounded-3xl border border-emerald-300/15 bg-emerald-300/[0.035] p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-emerald-100">{resultsTitle}</h2><p className="mt-1 text-sm text-emerald-100/70">«{result.query}» · {t("globalResultsProvenance")}</p></div></div><p className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/5 p-3 text-xs leading-6 text-amber-100">{result.disclosure}</p>{isUnifiedResult(result) ? <div className="mt-4 grid gap-4 xl:grid-cols-3">{result.sources.map(group => <article key={group.source.name} className="rounded-2xl border border-white/8 bg-slate-950/45 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-cyan-100">{group.source.name}</h3><p className="mt-1 text-xs text-slate-500">{group.source.attribution}</p></div><a href={group.source.documentationUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-cyan-200 underline">{t("globalSource")}</a></div>{group.error ? <p className="mt-4 rounded-xl border border-rose-300/15 bg-rose-300/5 p-3 text-sm leading-6 text-rose-100">{group.error}</p> : group.results.length ? <div className="mt-4 space-y-3">{group.results.map(item => <div key={item.url} className="rounded-xl border border-white/8 bg-white/[0.025] p-3"><a href={item.url} target="_blank" rel="noreferrer" className="font-bold text-cyan-100 hover:text-cyan-200">{item.title}</a><p className="mt-2 text-sm leading-6 text-slate-400">{item.summary}</p>{item.meta ? <p className="mt-2 font-mono text-xs text-slate-600">{item.meta}</p> : null}</div>)}</div> : <p className="mt-4 text-sm leading-7 text-slate-500">{t("globalNoRecords")}</p>}</article>)}</div> : <div className="mt-4 space-y-3">{result.results.length ? result.results.map(item => <article key={item.url} className="rounded-2xl border border-white/8 bg-slate-950/45 p-4"><a href={item.url} target="_blank" rel="noreferrer" className="font-bold text-cyan-100 hover:text-cyan-200">{item.title}</a><p className="mt-2 text-sm leading-6 text-slate-400">{item.summary}</p>{item.meta ? <p className="mt-2 font-mono text-xs text-slate-600">{item.meta}</p> : null}</article>) : <p className="rounded-2xl border border-dashed border-white/10 p-5 text-sm leading-7 text-slate-500">{t("globalNoRecordsSuggestion")}</p>}</div>}</section> : null}
  </section></DashboardLayout>;
}
