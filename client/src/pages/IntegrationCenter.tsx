import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { integrationCatalog } from "@shared/integrationCatalog";
import { CheckCircle2, ExternalLink, KeyRound, Link2, LockKeyhole, Search, ShieldCheck } from "lucide-react";
import React from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const categoryTranslations: Record<string, { ar: string; en: string }> = {
  "DevForge": { ar: "DevForge", en: "DevForge" },
  "الشفرة والتطوير": { ar: "الشفرة والتطوير", en: "Code and development" },
  "بيئات تطوير سحابية": { ar: "بيئات تطوير سحابية", en: "Cloud development environments" },
  "البيانات والاستضافة": { ar: "البيانات والاستضافة", en: "Data and hosting" },
  "التصميم": { ar: "التصميم", en: "Design" },
  "التواصل": { ar: "التواصل", en: "Communication" },
  "المعرفة والعمل": { ar: "المعرفة والعمل", en: "Knowledge and work" },
  "التجارة": { ar: "التجارة", en: "Commerce" },
  "البيانات والعملاء": { ar: "البيانات والعملاء", en: "Data and customers" },
  "المراقبة": { ar: "المراقبة", en: "Monitoring" },
  "استمرارية المنصة": { ar: "استمرارية المنصة", en: "Platform continuity" },
  "البحث والبيانات": { ar: "البحث والبيانات", en: "Research and data" },
  "الوسائط والذكاء": { ar: "الوسائط والذكاء", en: "Media and AI" },
  "التحليلات": { ar: "التحليلات", en: "Analytics" },
  "التسويق والنشر": { ar: "التسويق والنشر", en: "Marketing and publishing" },
  "الأتمتة": { ar: "الأتمتة", en: "Automation" },
  "الدعم": { ar: "الدعم", en: "Support" },
  "النطاقات": { ar: "النطاقات", en: "Domains" },
};

export default function IntegrationCenter() {
  const { direction, language, t } = useLanguage();
  const isEnglish = language === "en";
  const allCategory = "الكل";
  const allCategoryLabel = isEnglish ? "All" : "الكل";
  const categoryLabel = (categoryName: string) => categoryTranslations[categoryName]?.[isEnglish ? "en" : "ar"] ?? categoryName;
  const documentationLabel = isEnglish ? "Documentation" : "توثيق";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(allCategory);
  const utils = trpc.useUtils();
  const { data: preferences = [], isLoading, isError, refetch } = trpc.integrationCenter.list.useQuery();
  const requestConnection = trpc.integrationCenter.request.useMutation({
    onSuccess: () => { utils.integrationCenter.list.invalidate(); toast.success(`${t("requestRecorded")}. ${t("noAutomatedActions")}`); },
    onError: error => toast.error(error.message || t("privatePreferencesError")),
  });
  const categories = useMemo(() => [allCategory, ...Array.from(new Set(integrationCatalog.map(item => item.category)))], []);
  const filtered = useMemo(() => integrationCatalog.filter(item => (category === allCategory || item.category === category) && `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(query.trim().toLowerCase())), [category, query]);
  const requested = new Map(preferences.map(item => [item.providerKey, item]));

  const methodCopy = { oauth: t("needsOAuth"), "api-key": t("needsOwnerKey"), session: t("sessionAvailable") } as const;
  const availabilityCopy = { "no-cost-local": t("noPaymentRequired"), "free-tier": t("freeTier"), "account-dependent": t("accountDependent") } as const;
  return <DashboardLayout><div dir={direction} className="mx-auto max-w-6xl space-y-5">
    <Card className="border-cyan-300/15 bg-slate-950/60 text-white"><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><Badge className="mb-3 border-cyan-300/20 bg-cyan-300/10 text-cyan-100">{t("integrationCenter")}</Badge><CardTitle className="text-2xl">{t("integrationTitle")}</CardTitle><CardDescription className="mt-2 max-w-3xl leading-7 text-slate-400">{t("integrationDescription")}</CardDescription></div><ShieldCheck className="h-9 w-9 text-cyan-300" /></div></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300"><LockKeyhole className="mb-2 h-4 w-4 text-cyan-300" />{t("noCredentials")}</div><div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300"><Link2 className="mb-2 h-4 w-4 text-cyan-300" />{t("ownerScoped")}</div><div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300"><KeyRound className="mb-2 h-4 w-4 text-cyan-300" />{t("noAutomatedActions")}</div></CardContent></Card>
    <Card className="border-emerald-300/20 bg-emerald-300/[0.045] text-emerald-50"><CardContent className="p-4"><h2 className="font-bold">{t("noPaymentRequired")}</h2><p className="mt-2 text-sm leading-6 text-emerald-50/75">{t("noPaymentRequiredCopy")}</p></CardContent></Card>
    <div className="relative"><Search className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-500" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder={t("searchIntegration")} className="h-11 border-white/10 bg-slate-950/60 pr-10 text-white" /></div>
    <div className="flex gap-2 overflow-x-auto pb-1" aria-label={t("filterCategories")}>{categories.map(item => <Button key={item} size="sm" variant={category === item ? "default" : "outline"} className="shrink-0" onClick={() => setCategory(item)}>{item === allCategory ? allCategoryLabel : categoryLabel(item)}</Button>)}</div>
    {isError ? <Card className="border-rose-300/20 bg-rose-500/5"><CardContent className="flex items-center justify-between gap-3 p-4 text-sm text-rose-100"><span>{t("privatePreferencesError")}</span><Button variant="outline" onClick={() => refetch()}>{t("retry")}</Button></CardContent></Card> : null}
    <div className="flex items-center justify-between gap-3 text-sm text-slate-400"><span>{t("showingProviders")} {filtered.length} {t("within")} {categories.length - 1} {t("categories")}.</span><span>{t("localFilter")}</span></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(item => { const preference = requested.get(item.providerKey); return <Card key={item.providerKey} className="flex min-w-0 flex-col border-white/10 bg-slate-950/55 text-white"><CardHeader className="pb-3"><div className="flex items-center justify-between gap-2"><Badge variant="outline" className="border-white/15 text-slate-300">{categoryLabel(item.category)}</Badge>{preference ? <Badge className="bg-emerald-400/15 text-emerald-200"><CheckCircle2 className="ml-1 h-3.5 w-3.5" />{t("requestRecorded")}</Badge> : <Badge className="bg-slate-400/10 text-slate-300">{t("disconnected")}</Badge>}</div><CardTitle className="mt-3 text-lg">{item.name}</CardTitle><CardDescription className="min-h-12 leading-6 text-slate-400">{item.description}</CardDescription></CardHeader><CardContent className="mt-auto space-y-3">{item.availability ? <Badge className="bg-emerald-300/10 text-emerald-100">{availabilityCopy[item.availability]}</Badge> : null}<p className="rounded-lg border border-white/8 bg-white/4 p-2 text-xs text-slate-300">{methodCopy[item.connectionMethod]} — {t("proposedScope")}: {item.requestedScope}</p><p className="text-xs leading-5 text-amber-100/80">{item.protectedBoundary}</p>{item.documentationUrl ? <a href={item.documentationUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold text-cyan-200 hover:text-cyan-100">{documentationLabel} {item.name}<ExternalLink className="h-3.5 w-3.5" /></a> : null}<Button className="w-full" variant={preference ? "outline" : "default"} disabled={requestConnection.isPending || Boolean(preference)} onClick={() => requestConnection.mutate({ providerKey: item.providerKey })}>{preference ? t("requestRecorded") : t("prepareSecureConnection")}</Button></CardContent></Card>; })}</div>
    {!isLoading && filtered.length === 0 ? <p className="rounded-xl border border-white/10 p-5 text-center text-sm text-slate-400">{t("noMatchingProvider")}</p> : null}
  </div></DashboardLayout>;
}
