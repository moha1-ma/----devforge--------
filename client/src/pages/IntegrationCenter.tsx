import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { integrationCatalog } from "@shared/integrationCatalog";
import { CheckCircle2, ExternalLink, Globe2, KeyRound, Link2, Loader2, LockKeyhole, Search, ShieldCheck } from "lucide-react";
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
  const [mcpEndpoint, setMcpEndpoint] = useState("");
  const [mcpDiscovery, setMcpDiscovery] = useState<{
    endpoint: string;
    resource: string;
    metadataUrl: string;
    scopes: string[];
    authorizationServers: Array<{
      issuer: string;
      authorizationEndpoint: string;
      tokenEndpoint: string | null;
      registrationEndpoint: string | null;
      scopes: string[];
      grantTypes: string[];
      supportsPkce: boolean;
      supportsClientMetadataDocument: boolean;
    }>;
  } | null>(null);
  const utils = trpc.useUtils();
  const { data: preferences = [], isLoading, isError, refetch } = trpc.integrationCenter.list.useQuery();
  const requestConnection = trpc.integrationCenter.request.useMutation({
    onSuccess: () => { utils.integrationCenter.list.invalidate(); toast.success(`${t("requestRecorded")}. ${t("noAutomatedActions")}`); },
    onError: error => toast.error(error.message || t("privatePreferencesError")),
  });
  const discoverMcp = trpc.integrationCenter.discoverMcp.useMutation({
    onSuccess: result => { setMcpDiscovery(result); toast.success(isEnglish ? "MCP authorization discovered" : "تم اكتشاف تفويض MCP"); },
    onError: error => { setMcpDiscovery(null); toast.error(error.message); },
  });
  const categories = useMemo(() => [allCategory, ...Array.from(new Set(integrationCatalog.map(item => item.category)))], []);
  const filtered = useMemo(() => integrationCatalog.filter(item => (category === allCategory || item.category === category) && `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(query.trim().toLowerCase())), [category, query]);
  const requested = new Map(preferences.map(item => [item.providerKey, item]));

  const methodCopy = { oauth: t("needsOAuth"), "api-key": t("needsOwnerKey"), session: t("sessionAvailable") } as const;
  const availabilityCopy = { "no-cost-local": t("noPaymentRequired"), "free-tier": t("freeTier"), "account-dependent": t("accountDependent") } as const;
  const mcpCopy = isEnglish ? {
    badge: "Universal connector",
    title: "Connect any compatible MCP application",
    description: "Enter the public MCP server URL. DevForge validates the destination, discovers RFC 9728 and OAuth metadata, and shows the official consent gateway. Each application still requires its own approval.",
    placeholder: "https://service.example/mcp",
    discover: "Discover secure connection",
    success: "Secure discovery completed",
    oauth: "Official authorization gateway",
    scopes: "Declared scopes",
    pkce: "PKCE S256",
    clientMetadata: "Client metadata document",
    supported: "supported",
    missing: "not advertised",
    boundary: "Discovery does not grant access or store a token. Completing OAuth requires a compatible client registration and your approval on the external service.",
  } : {
    badge: "الموصل العام",
    title: "اربط أي تطبيق متوافق مع MCP",
    description: "أدخل رابط خادم MCP العام. يتحقق DevForge من الوجهة، ويكتشف بيانات RFC 9728 وOAuth، ويعرض بوابة الموافقة الرسمية. يبقى لكل تطبيق تفويض مستقل.",
    placeholder: "https://service.example/mcp",
    discover: "اكتشاف الربط الآمن",
    success: "اكتمل الاكتشاف الآمن",
    oauth: "بوابة التفويض الرسمية",
    scopes: "النطاقات المعلنة",
    pkce: "حماية PKCE S256",
    clientMetadata: "وثيقة تعريف العميل",
    supported: "مدعومة",
    missing: "غير معلنة",
    boundary: "الاكتشاف لا يمنح صلاحية ولا يخزن رمز وصول. إتمام OAuth يحتاج تسجيلاً متوافقاً للعميل وموافقتك داخل الخدمة الخارجية.",
  };
  const discoveredAuthorization = mcpDiscovery?.authorizationServers[0];
  return <DashboardLayout><div dir={direction} className="mx-auto max-w-6xl space-y-5">
    <Card className="border-cyan-300/15 bg-slate-950/60 text-white"><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><Badge className="mb-3 border-cyan-300/20 bg-cyan-300/10 text-cyan-100">{t("integrationCenter")}</Badge><CardTitle className="text-2xl">{t("integrationTitle")}</CardTitle><CardDescription className="mt-2 max-w-3xl leading-7 text-slate-400">{t("integrationDescription")}</CardDescription></div><ShieldCheck className="h-9 w-9 text-cyan-300" /></div></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300"><LockKeyhole className="mb-2 h-4 w-4 text-cyan-300" />{t("noCredentials")}</div><div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300"><Link2 className="mb-2 h-4 w-4 text-cyan-300" />{t("ownerScoped")}</div><div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300"><KeyRound className="mb-2 h-4 w-4 text-cyan-300" />{t("noAutomatedActions")}</div></CardContent></Card>
    <Card className="border-violet-300/20 bg-violet-300/[0.045] text-white">
      <CardHeader><div className="flex items-start justify-between gap-3"><div><Badge className="mb-3 bg-violet-300/15 text-violet-100">{mcpCopy.badge}</Badge><CardTitle>{mcpCopy.title}</CardTitle><CardDescription className="mt-2 max-w-3xl leading-6 text-slate-300">{mcpCopy.description}</CardDescription></div><Globe2 className="h-7 w-7 text-violet-200" /></div></CardHeader>
      <CardContent className="space-y-4">
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={event => { event.preventDefault(); setMcpDiscovery(null); discoverMcp.mutate({ endpoint: mcpEndpoint }); }}>
          <Input aria-label={mcpCopy.title} type="url" required disabled={discoverMcp.isPending} value={mcpEndpoint} onChange={event => { setMcpEndpoint(event.target.value); setMcpDiscovery(null); }} placeholder={mcpCopy.placeholder} className="border-white/10 bg-slate-950/65 text-white" />
          <Button type="submit" disabled={discoverMcp.isPending || !mcpEndpoint.trim()} className="shrink-0">{discoverMcp.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="me-2 h-4 w-4" />}{mcpCopy.discover}</Button>
        </form>
        {mcpDiscovery && discoveredAuthorization ? <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-emerald-100">{mcpCopy.success}</strong><Badge className="bg-emerald-300/15 text-emerald-100">OAuth 2.1 / MCP</Badge></div>
          <p className="mt-3 break-all text-xs text-slate-300">{discoveredAuthorization.issuer}</p>
          <div className="mt-3 flex flex-wrap gap-2"><Badge variant="outline" className="border-white/15 text-slate-200">{mcpCopy.pkce}: {discoveredAuthorization.supportsPkce ? mcpCopy.supported : mcpCopy.missing}</Badge><Badge variant="outline" className="border-white/15 text-slate-200">{mcpCopy.clientMetadata}: {discoveredAuthorization.supportsClientMetadataDocument ? mcpCopy.supported : mcpCopy.missing}</Badge></div>
          {(mcpDiscovery.scopes.length || discoveredAuthorization.scopes.length) ? <p className="mt-3 text-xs text-slate-300">{mcpCopy.scopes}: {Array.from(new Set([...mcpDiscovery.scopes, ...discoveredAuthorization.scopes])).join(", ")}</p> : null}
          <a href={discoveredAuthorization.authorizationEndpoint} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 font-semibold text-violet-200 hover:text-violet-100">{mcpCopy.oauth}<ExternalLink className="h-3.5 w-3.5" /></a>
        </div> : null}
        <p className="text-xs leading-5 text-amber-100/80">{mcpCopy.boundary}</p>
      </CardContent>
    </Card>
    <Card className="border-emerald-300/20 bg-emerald-300/[0.045] text-emerald-50"><CardContent className="p-4"><h2 className="font-bold">{t("noPaymentRequired")}</h2><p className="mt-2 text-sm leading-6 text-emerald-50/75">{t("noPaymentRequiredCopy")}</p></CardContent></Card>
    <div className="relative"><Search className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-500" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder={t("searchIntegration")} className="h-11 border-white/10 bg-slate-950/60 pr-10 text-white" /></div>
    <div className="flex gap-2 overflow-x-auto pb-1" aria-label={t("filterCategories")}>{categories.map(item => <Button key={item} size="sm" variant={category === item ? "default" : "outline"} className="shrink-0" onClick={() => setCategory(item)}>{item === allCategory ? allCategoryLabel : categoryLabel(item)}</Button>)}</div>
    {isError ? <Card className="border-rose-300/20 bg-rose-500/5"><CardContent className="flex items-center justify-between gap-3 p-4 text-sm text-rose-100"><span>{t("privatePreferencesError")}</span><Button variant="outline" onClick={() => refetch()}>{t("retry")}</Button></CardContent></Card> : null}
    <div className="flex items-center justify-between gap-3 text-sm text-slate-400"><span>{t("showingProviders")} {filtered.length} {t("within")} {categories.length - 1} {t("categories")}.</span><span>{t("localFilter")}</span></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(item => { const preference = requested.get(item.providerKey); return <Card key={item.providerKey} className="flex min-w-0 flex-col border-white/10 bg-slate-950/55 text-white"><CardHeader className="pb-3"><div className="flex items-center justify-between gap-2"><Badge variant="outline" className="border-white/15 text-slate-300">{categoryLabel(item.category)}</Badge>{preference ? <Badge className="bg-emerald-400/15 text-emerald-200"><CheckCircle2 className="ml-1 h-3.5 w-3.5" />{t("requestRecorded")}</Badge> : <Badge className="bg-slate-400/10 text-slate-300">{t("disconnected")}</Badge>}</div><CardTitle className="mt-3 text-lg">{item.name}</CardTitle><CardDescription className="min-h-12 leading-6 text-slate-400">{item.description}</CardDescription></CardHeader><CardContent className="mt-auto space-y-3">{item.availability ? <Badge className="bg-emerald-300/10 text-emerald-100">{availabilityCopy[item.availability]}</Badge> : null}<p className="rounded-lg border border-white/8 bg-white/4 p-2 text-xs text-slate-300">{methodCopy[item.connectionMethod]} — {t("proposedScope")}: {item.requestedScope}</p><p className="text-xs leading-5 text-amber-100/80">{item.protectedBoundary}</p>{item.documentationUrl ? <a href={item.documentationUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold text-cyan-200 hover:text-cyan-100">{documentationLabel} {item.name}<ExternalLink className="h-3.5 w-3.5" /></a> : null}<Button className="w-full" variant={preference ? "outline" : "default"} disabled={requestConnection.isPending || Boolean(preference)} onClick={() => requestConnection.mutate({ providerKey: item.providerKey })}>{preference ? t("requestRecorded") : t("prepareSecureConnection")}</Button></CardContent></Card>; })}</div>
    {!isLoading && filtered.length === 0 ? <p className="rounded-xl border border-white/10 p-5 text-center text-sm text-slate-400">{t("noMatchingProvider")}</p> : null}
  </div></DashboardLayout>;
}
