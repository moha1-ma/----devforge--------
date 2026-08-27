import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Activity, Cable, CheckCircle2, KeyRound, RefreshCw, ShieldCheck, Unplug } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

const apiContracts = [
  { name: "بوابة DevForge API", path: "/api/trpc", scope: "عقد النقل الموحد", activity: "عنوان نشط" },
  { name: "إشارة الصحة", path: "/api/trpc/system.health", scope: "قراءة عامة محدودة", activity: "فحص متاح" },
  { name: "موجز المجتمع", path: "/api/trpc/communityHub.publicFeed", scope: "منشورات معتمدة فقط", activity: "عند الطلب" },
  { name: "موجز وسائط الزوار", path: "/api/trpc/visitorSubmissions.approvedFeed", scope: "وسائط معتمدة فقط", activity: "عند الطلب" },
  { name: "مساحات المالك", path: "/api/trpc/{workspace,sourceFiles,aiWorkspace,globalResearch}", scope: "مصادقة المالك مطلوبة", activity: "محمي" },
  { name: "المراجعة والتكاملات", path: "/api/trpc/{integrationCenter,developerCenter,githubWorkspace}", scope: "مصادقة ومراجعة صريحة", activity: "محمي" },
] as const;

export default function ApiControlCenter() {
  const { direction } = useLanguage();
  const [timestamp, setTimestamp] = useState(() => Date.now());
  const health = trpc.system.health.useQuery({ timestamp });
  const requestSeparation = trpc.integrationCenter.request.useMutation({
    onSuccess: () => toast.success("سُجلت مراجعة فصل API. لم يتغير أي اتصال أو استضافة."),
    onError: issue => toast.error(issue.message),
  });
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const healthLabel = health.isLoading ? "يجري فحص الإشارة…" : health.data?.ok ? "متاح" : "غير متاح حاليًا";

  return <DashboardLayout><section dir={direction} className="mx-auto max-w-6xl space-y-5">
    <header className="rounded-[2rem] border border-cyan-300/20 bg-gradient-to-l from-cyan-300/10 via-slate-950 to-indigo-400/10 p-6 sm:p-8"><Badge className="border border-cyan-300/25 bg-cyan-300/10 text-cyan-100"><Cable className="ml-1 h-3.5 w-3.5" />خاص بالمالك</Badge><div className="mt-5 flex flex-wrap items-start justify-between gap-5"><div><h1 className="text-2xl font-bold text-white sm:text-3xl">مركز تحكم DevForge API</h1><p className="mt-2 max-w-3xl leading-8 text-slate-300">سجل العقود والعناوين النشطة الآمنة للمنصة. يعرض المركز النطاق والحالة التشغيلية المتاحة فقط؛ لا يعرض مفاتيحًا أو عناوين داخلية أو إعدادات مزودين.</p></div><div className="rounded-2xl border border-cyan-300/20 bg-black/25 px-4 py-3 text-sm text-cyan-100"><Activity className="ml-2 inline h-4 w-4" />إشارة الصحة: <strong>{healthLabel}</strong></div></div></header>

    <Card className="border-amber-300/20 bg-amber-300/[0.045] text-amber-50"><CardHeader><CardTitle className="flex items-center gap-2 text-amber-100"><Unplug className="h-5 w-5" />مراجعة فصل الاتصال</CardTitle><CardDescription className="leading-7 text-amber-100/75">هذا الخيار يسجل فقط رغبة المالك في مراجعة عزل عقد API أو انتقاله مستقبلًا. لا يفصل أي خدمة، ولا ينقل الاستضافة، ولا ينشئ بيانات اعتماد أو اتصالًا خارجيًا.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-3"><Button onClick={() => requestSeparation.mutate({ providerKey: "devforge-api-boundary" })} disabled={requestSeparation.isPending} className="bg-amber-300 text-slate-950 hover:bg-amber-200"><ShieldCheck className="ml-2 h-4 w-4" />{requestSeparation.isPending ? "يجري تسجيل المراجعة…" : "سجل مراجعة فصل API"}</Button><Button variant="outline" onClick={() => { setTimestamp(Date.now()); health.refetch(); }} className="border-amber-300/30 text-amber-100 hover:bg-amber-300/10 hover:text-amber-50"><RefreshCw className="ml-2 h-4 w-4" />تحديث إشارة الصحة</Button></CardContent></Card>

    <section aria-label="عقود API النشطة" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{apiContracts.map(contract => <Card key={contract.name} className="flex min-w-0 flex-col border-white/10 bg-slate-950/60 text-white"><CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><CardTitle className="text-lg">{contract.name}</CardTitle><Badge variant="outline" className="border-cyan-300/25 text-cyan-100">{contract.activity}</Badge></div><CardDescription className="mt-3 text-slate-400">{contract.scope}</CardDescription></CardHeader><CardContent className="mt-auto"><code dir="ltr" className="block overflow-x-auto rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-left text-xs text-cyan-100">{origin}{contract.path}</code></CardContent></Card>)}</section>

    <section className="grid gap-4 md:grid-cols-2"><Card className="border-white/10 bg-slate-950/60 text-white"><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-300" />ما يظهر هنا</CardTitle></CardHeader><CardContent className="text-sm leading-7 text-slate-400">العناوين العامة، العقود المحمية، وإشارة الصحة فقط. حالة «عند الطلب» تعني أن الواجهة لا تعمل في الخلفية ولا تشير إلى اتصال خارجي نشط.</CardContent></Card><Card className="border-white/10 bg-slate-950/60 text-white"><CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-rose-200" />ما لا يظهر هنا</CardTitle></CardHeader><CardContent className="text-sm leading-7 text-slate-400">لا مفاتيح API، ولا رموز جلسات، ولا عناوين خوادم داخلية، ولا سجلات زوار، ولا بيانات مقدمي الخدمة أو الحسابات الخارجية.</CardContent></Card></section>
  </section></DashboardLayout>;
}
