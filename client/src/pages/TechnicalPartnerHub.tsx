import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { technicalPartnerCatalog } from "@shared/technicalPartnerCatalog";
import { CheckCircle2, ExternalLink, Globe2, Link2, Search, ShieldCheck } from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function TechnicalPartnerHub() {
  const { direction } = useLanguage();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const utils = trpc.useUtils();
  const { data: preferences = [] } = trpc.integrationCenter.list.useQuery();
  const request = trpc.integrationCenter.request.useMutation({
    onSuccess: () => { utils.integrationCenter.list.invalidate(); toast.success("سُجل طلب مراجعة الربط. لا يوجد اتصال أو مشاركة بيانات حتى تعتمد النطاق بنفسك."); },
    onError: issue => toast.error(issue.message),
  });
  const requested = new Set(preferences.map(item => item.providerKey));
  const visible = useMemo(() => technicalPartnerCatalog.filter(partner => `${partner.name} ${partner.focus} ${partner.description}`.toLowerCase().includes(query.trim().toLowerCase())), [query]);

  return <DashboardLayout><main dir={direction} className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
    <header className="relative overflow-hidden rounded-[2rem] border border-violet-300/15 bg-gradient-to-l from-violet-400/15 via-slate-950 to-cyan-400/10 p-6 sm:p-8"><div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-violet-300/10 blur-3xl" /><Badge className="relative border border-violet-300/20 bg-violet-300/10 text-violet-100"><ShieldCheck className="ml-1 h-3.5 w-3.5" />خاص بالمالك · مراجعة قبل الربط</Badge><div className="relative mt-5 flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-300 text-slate-950"><Link2 className="h-6 w-6" /></div><div><h1 className="text-2xl font-bold text-white sm:text-3xl">الشركاء التقنيون</h1><p className="mt-2 max-w-3xl leading-8 text-slate-300">دليل لمصادر تقنية مرشحة لمنفعة DevForge. يعرض كل مدخل مرجعًا رسميًا ونطاق بيانات واضحًا. طلب المراجعة لا ينشئ حسابًا، ولا يتصل بواجهة API، ولا يرسل أي معلومات للشريك.</p></div></div></header>
    <section className="rounded-3xl border border-white/8 bg-slate-950/55 p-5 sm:p-6"><label className="sr-only" htmlFor="partner-query">ابحث في الشركاء التقنيين</label><div className="relative"><Search className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-500" /><Input id="partner-query" value={query} onChange={event => setQuery(event.target.value)} placeholder="ابحث: شفرة، بيانات، مراقبة، بحث…" className="h-11 border-white/10 bg-white/[0.035] pr-10 text-white" /></div><p className="mt-3 text-xs leading-6 text-slate-500">البحث محلي داخل الدليل؛ لا يرسل الكلمات إلى مواقع الشركاء.</p></section>
    <section aria-label="دليل الشركاء التقنيين" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map(partner => <Card key={partner.providerKey} className="flex min-w-0 flex-col border-white/10 bg-slate-950/55 text-white"><CardHeader className="pb-3"><div className="flex items-center justify-between gap-2"><Badge variant="outline" className="border-violet-300/20 text-violet-100">{partner.focus}</Badge>{partner.requestable && requested.has(partner.providerKey) ? <Badge className="bg-emerald-400/15 text-emerald-200"><CheckCircle2 className="ml-1 h-3.5 w-3.5" />بانتظار المراجعة</Badge> : <Badge className="bg-slate-400/10 text-slate-300">{partner.connectionMethod}</Badge>}</div><CardTitle className="mt-3 text-lg">{partner.name}</CardTitle><CardDescription className="min-h-12 leading-6 text-slate-400">{partner.description}</CardDescription></CardHeader><CardContent className="mt-auto space-y-3"><p className="rounded-xl border border-white/8 bg-white/[0.035] p-3 text-xs leading-6 text-slate-300"><strong className="text-violet-100">نطاق البيانات:</strong> {partner.dataScope}</p><a href={partner.documentationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-200 hover:text-cyan-100">توثيق {partner.name}<ExternalLink className="h-3.5 w-3.5" /></a>{partner.requestable ? <Button className="w-full" disabled={request.isPending || requested.has(partner.providerKey)} onClick={() => request.mutate({ providerKey: partner.providerKey })}>{requested.has(partner.providerKey) ? "طلب المراجعة مسجل" : "طلب مراجعة API"}</Button> : <Button variant="outline" className="w-full border-cyan-300/25 text-cyan-100 hover:bg-cyan-300/10 hover:text-cyan-50" onClick={() => setLocation("/global-research")}><Globe2 className="ml-1 h-4 w-4" />فتح البحث العالمي</Button>}</CardContent></Card>)}</section>
    {!visible.length ? <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm leading-7 text-slate-400">لا توجد نتيجة داخل دليل الشركاء الحالي. لا يضيف DevForge مزودًا غير موثق تلقائيًا.</p> : null}
  </main></DashboardLayout>;
}
