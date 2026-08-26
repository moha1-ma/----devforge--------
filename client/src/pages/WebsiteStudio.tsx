import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { websiteVisualPresets, type WebsiteVisualPreset } from "@shared/websiteStarter";
import { ArrowLeft, CheckCircle2, Code2, Database, ExternalLink, Globe2, LayoutTemplate, Palette, ShieldCheck, Sparkles, Smartphone } from "lucide-react";
import React, { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const paletteOptions = [
  { key: "cyan", label: "سماوي", swatch: "bg-cyan-300" },
  { key: "emerald", label: "زمردي", swatch: "bg-emerald-400" },
  { key: "amber", label: "كهرماني", swatch: "bg-amber-400" },
  { key: "rose", label: "وردي", swatch: "bg-rose-400" },
] as const;

export default function WebsiteStudio() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: builds = [], isLoading, isError, refetch } = trpc.websiteBuilder.list.useQuery();
  const [title, setTitle] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [brief, setBrief] = useState("");
  const [primaryCta, setPrimaryCta] = useState("ابدأ المحادثة");
  const [visualPreset, setVisualPreset] = useState<WebsiteVisualPreset>("studio");
  const [palette, setPalette] = useState<(typeof paletteOptions)[number]["key"]>("cyan");
  const [desiredDomain, setDesiredDomain] = useState("");
  const [activeBuildId, setActiveBuildId] = useState<number | null>(null);
  const [domainDraft, setDomainDraft] = useState("");

  const activeBuild = useMemo(() => builds.find(build => build.id === activeBuildId) ?? builds[0] ?? null, [activeBuildId, builds]);
  const create = trpc.websiteBuilder.create.useMutation({
    onSuccess: async result => {
      await Promise.all([utils.websiteBuilder.list.invalidate(), utils.projects.list.invalidate(), utils.workspace.summary.invalidate()]);
      setActiveBuildId(result.build?.id ?? null);
      toast.success(`تم إنشاء ${result.files.length} ملفات قابلة للتحرير لموقعك`);
    },
    onError: error => toast.error(error.message),
  });
  const prepareDomain = trpc.websiteBuilder.prepareDomain.useMutation({
    onSuccess: async result => {
      await utils.websiteBuilder.list.invalidate();
      toast.success(`تم حفظ ${result.domainCandidate} كاسم نطاق للتحضير`);
    },
    onError: error => toast.error(error.message),
  });
  const addSupabaseStarter = trpc.websiteBuilder.addSupabaseStarter.useMutation({
    onSuccess: async result => {
      await Promise.all([utils.websiteBuilder.list.invalidate(), utils.sourceFiles.list.invalidate()]);
      toast.success(result.alreadyPrepared ? "حزمة Supabase موجودة بالفعل في المشروع" : `أضيفت ${result.files.length} ملفات إعداد Supabase خاصة`);
      setLocation(`/code?project=${result.projectId}`);
    },
    onError: error => toast.error(error.message),
  });

  const canCreate = title.trim().length >= 2 && businessType.trim().length >= 2 && brief.trim().length >= 24 && primaryCta.trim().length >= 2;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreate) return;
    create.mutate({ title, businessType, brief, visualPreset, palette, primaryCta, desiredDomain: desiredDomain.trim() || undefined });
  }

  return <DashboardLayout><section dir="rtl" className="space-y-7">
    <header className="overflow-hidden rounded-3xl border border-cyan-300/20 bg-[radial-gradient(circle_at_90%_10%,rgba(34,211,238,.2),transparent_34%),linear-gradient(135deg,rgba(15,23,42,.8),rgba(24,24,50,.92))] p-7 md:p-9">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div className="max-w-3xl"><Badge className="border border-cyan-300/20 bg-cyan-300/10 text-cyan-100"><LayoutTemplate className="ml-1 h-3.5 w-3.5" /> Website Studio</Badge><h1 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-5xl">حوّل متطلباتك إلى موقع قابل للتطوير.</h1><p className="mt-4 max-w-2xl leading-8 text-slate-300">اكتب فكرة منظمة، اختر اتجاهًا بصريًا، وسينشئ DevForge مشروعًا خاصًا بملفات HTML وCSS وJavaScript يمكنك تحريرها ومراجعتها من مساحة الكود.</p></div><div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-slate-300"><p className="font-bold text-white">نقطة البداية المجانية</p><p>قالب قابل للتحرير ومعاينة آمنة، بلا شراء نطاق أو تشغيل كود على الخادم.</p></div></div>
    </header>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(340px,.88fr)]">
      <form onSubmit={submit} className="space-y-5 rounded-3xl border border-white/8 bg-white/[0.025] p-5 md:p-7">
        <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-white">موجز الموقع</h2><p className="mt-1 text-sm text-slate-500">كل ما تكتبه يبقى داخل مشروعك الخاص.</p></div><Sparkles className="h-5 w-5 text-cyan-300" /></div>
        <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="site-title">اسم الموقع</Label><Input id="site-title" value={title} onChange={event => setTitle(event.target.value)} placeholder="اسم العلامة أو المشروع" className="border-white/10 bg-white/5 text-white" required /></div><div className="space-y-2"><Label htmlFor="site-business">نوع النشاط</Label><Input id="site-business" value={businessType} onChange={event => setBusinessType(event.target.value)} placeholder="استشارات، متجر، منتج رقمي..." className="border-white/10 bg-white/5 text-white" required /></div></div>
        <div className="space-y-2"><Label htmlFor="site-brief">ماذا يجب أن يفهم الزائر؟</Label><Textarea id="site-brief" value={brief} onChange={event => setBrief(event.target.value)} placeholder="اشرح القيمة التي تقدمها، الجمهور، والرسالة الأساسية للموقع." className="min-h-28 border-white/10 bg-white/5 text-white placeholder:text-slate-600" required /><p className="text-xs text-slate-600">{brief.trim().length}/24 حرفًا على الأقل</p></div>
        <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="site-cta">دعوة الإجراء الأساسية</Label><Input id="site-cta" value={primaryCta} onChange={event => setPrimaryCta(event.target.value)} className="border-white/10 bg-white/5 text-white" required /></div><div className="space-y-2"><Label htmlFor="site-domain">نطاق مقترح — اختياري</Label><Input id="site-domain" value={desiredDomain} onChange={event => setDesiredDomain(event.target.value)} placeholder="example.com" className="border-white/10 bg-white/5 font-mono text-white" /><p className="text-xs text-slate-600">لا نتحقق من التوفر ولا نسجل النطاق تلقائيًا.</p></div></div>
        <div className="space-y-3"><Label>الاتجاه البصري</Label><div className="grid gap-3 sm:grid-cols-2">{(Object.entries(websiteVisualPresets) as [WebsiteVisualPreset, typeof websiteVisualPresets[WebsiteVisualPreset]][]).map(([key, preset]) => <button type="button" key={key} onClick={() => setVisualPreset(key)} className={`rounded-2xl border p-4 text-right transition ${visualPreset === key ? "border-cyan-300/50 bg-cyan-300/10" : "border-white/8 bg-white/[0.02] hover:border-white/20"}`}><p className="font-bold text-white">{preset.label}</p><p className="mt-1 text-xs leading-6 text-slate-500">{preset.description}</p></button>)}</div></div>
        <div className="space-y-3"><Label><Palette className="ml-1 inline h-4 w-4" /> لوحة الإبراز</Label><div className="flex flex-wrap gap-2">{paletteOptions.map(option => <button type="button" key={option.key} onClick={() => setPalette(option.key)} className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${palette === option.key ? "border-white/50 bg-white/10 text-white" : "border-white/8 text-slate-400"}`}><span className={`h-3 w-3 rounded-full ${option.swatch}`} />{option.label}</button>)}</div></div>
        <Button type="submit" disabled={!canCreate || create.isPending} className="h-12 w-full bg-cyan-300 font-bold text-slate-950 hover:bg-cyan-200">{create.isPending ? "جارٍ إنشاء ملفات الموقع..." : "إنشاء موقع خاص قابل للتحرير"}<ArrowLeft className="mr-2 h-4 w-4" /></Button>
      </form>

      <aside className="overflow-hidden rounded-3xl border border-white/8 bg-slate-950/70"><div className="border-b border-white/8 p-5"><p className="text-sm font-bold text-white">معاينة اتجاه التصميم</p><p className="mt-1 text-sm text-slate-500">شكل مبدئي مبني على اختياراتك، قبل إنشاء الملفات.</p></div><div className="p-5"><div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${palette === "rose" ? "from-rose-300/20 to-slate-950" : palette === "amber" ? "from-amber-300/20 to-slate-950" : palette === "emerald" ? "from-emerald-300/20 to-slate-950" : "from-cyan-300/20 to-slate-950"} p-6`}><span className="text-xs font-bold text-white/70">{businessType || "نوع النشاط"}</span><h3 className="mt-7 text-3xl font-bold leading-tight text-white">{title || "اسم موقعك"}</h3><p className="mt-3 min-h-20 text-sm leading-7 text-slate-300">{brief || "اكتب الموجز لترى كيف سيُعرض جوهر الموقع هنا."}</p><span className="mt-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950">{primaryCta || "دعوة الإجراء"}</span></div><div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs text-slate-500"><span className="rounded-lg bg-white/[0.04] p-2">متجاوب</span><span className="rounded-lg bg-white/[0.04] p-2">قابل للتحرير</span><span className="rounded-lg bg-white/[0.04] p-2">ملفات خاصة</span></div></div></aside>
    </div>

    <section className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]"><article className="rounded-3xl border border-white/8 bg-white/[0.025] p-6"><div className="flex items-center justify-between"><div><h2 className="font-bold text-white">مواقعك المنشأة</h2><p className="mt-1 text-sm text-slate-500">تصل الملفات من مساحة الكود، وليس من صفحة عامة.</p></div><Code2 className="h-5 w-5 text-violet-300" /></div>{isLoading ? <div className="mt-5 h-28 animate-pulse rounded-2xl bg-white/5" /> : isError ? <div className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-300/5 p-5"><p role="alert" className="text-sm leading-7 text-rose-100">تعذر تحميل مواقعك الخاصة الآن. لم تُفقد أي ملفات أو إعدادات.</p><Button variant="outline" onClick={() => refetch()} className="mt-4 border-rose-300/30 text-rose-100 hover:bg-rose-300/10 hover:text-white">إعادة المحاولة</Button></div> : builds.length ? <div className="mt-5 space-y-2">{builds.map(build => <button key={build.id} onClick={() => { setActiveBuildId(build.id); setDomainDraft(build.domainCandidate || ""); }} className={`w-full rounded-2xl border p-4 text-right transition ${activeBuild?.id === build.id ? "border-cyan-300/35 bg-cyan-300/8" : "border-white/8 hover:bg-white/[0.04]"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-white">{build.title}</p><p className="mt-1 text-xs text-slate-500">{build.businessType} · {build.visualPreset}</p></div><Badge className="border-0 bg-emerald-400/10 text-emerald-300">ملفات جاهزة</Badge></div></button>)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-6 text-sm leading-7 text-slate-500">ابدأ بموجز واضح، وسيظهر هنا كل موقع أنشأته داخل حسابك.</div>}<Button variant="outline" onClick={() => activeBuild && setLocation(`/code?project=${activeBuild.projectId}`)} disabled={!activeBuild} className="mt-5 w-full border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white">فتح مساحة الكود <ExternalLink className="mr-2 h-4 w-4" /></Button></article>
      <article className="rounded-3xl border border-white/8 bg-white/[0.025] p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><Globe2 className="h-5 w-5" /></span><div><h2 className="font-bold text-white">مركز النطاقات</h2><p className="mt-1 text-sm text-slate-500">إعداد الاتصال، لا شراء نطاقات في الخلفية.</p></div></div>{activeBuild ? <div className="mt-6 space-y-4"><div className="rounded-2xl border border-amber-300/15 bg-amber-300/5 p-4 text-sm leading-7 text-amber-100">سجل النطاق يتطلب جهة تسجيل خارجية وقد يطلب بريدًا أو هاتفًا ورسومًا بحسب بلدك. لن يجري DevForge عملية شراء أو إعداد DNS نيابة عنك دون قرار صريح.</div><div className="flex flex-col gap-3 sm:flex-row"><Input value={domainDraft} onChange={event => setDomainDraft(event.target.value)} placeholder="your-domain.com" className="border-white/10 bg-white/5 font-mono text-white" /><Button onClick={() => prepareDomain.mutate({ websiteBuildId: activeBuild.id, domain: domainDraft })} disabled={prepareDomain.isPending || domainDraft.trim().length < 4} className="bg-cyan-300 font-bold text-slate-950 hover:bg-cyan-200">تحضير الاتصال</Button></div><div className="flex items-center gap-2 text-sm text-slate-400"><CheckCircle2 className="h-4 w-4 text-emerald-300" />{activeBuild.domainCandidate ? `الحالة: ${activeBuild.domainStatus} · ${activeBuild.domainCandidate}` : "لم يُحفظ اسم نطاق لهذا الموقع بعد."}</div><ol className="space-y-2 rounded-2xl border border-white/8 bg-slate-950/50 p-4 text-sm leading-7 text-slate-400"><li><strong className="text-slate-200">1.</strong> اشترِ النطاق أو ادِره لدى جهة تسجيل تختارها باستخدام بياناتك القانونية.</li><li><strong className="text-slate-200">2.</strong> بعد نشر الموقع، افتح إعدادات النطاقات في الاستضافة للحصول على سجل CNAME أو A المخصص لذلك النطاق.</li><li><strong className="text-slate-200">3.</strong> لا تدخل سجلات DNS عشوائية؛ أضف السجل الذي تعرضه الاستضافة فقط، ثم تحقق بعد اكتمال الانتشار.</li></ol></div> : <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-6 text-sm leading-7 text-slate-500">أنشئ موقعًا أولًا لتجهيز اسم نطاقه وإرشادات الربط.</div>}<p className="mt-5 flex items-center gap-2 text-xs text-slate-600"><ShieldCheck className="h-4 w-4 text-emerald-300" />لا يتم جمع بيانات دفع أو هوية أو رقم هاتف داخل هذه الصفحة.</p></article>
      <article className="rounded-3xl border border-white/8 bg-white/[0.025] p-6 xl:col-span-2"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-300/10 text-emerald-200"><Database className="h-5 w-5" /></span><div><h2 className="font-bold text-white">إعداد Supabase من الهاتف</h2><p className="mt-1 text-sm text-slate-500">حزمة ملفات خاصة تساعدك على الربط، ولا تحتفظ DevForge بمفاتيح قاعدة البيانات.</p></div></div>{activeBuild && <Badge className="w-fit border-0 bg-emerald-400/10 text-emerald-300">{activeBuild.supabaseStarterStatus === "starter-added" ? "الحزمة جاهزة" : "لم تبدأ"}</Badge>}</div>{activeBuild ? <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto]"><ol className="space-y-2 rounded-2xl border border-white/8 bg-slate-950/50 p-4 text-sm leading-7 text-slate-400"><li><strong className="text-slate-200">1.</strong> من Safari افتح Supabase Dashboard وأنشئ أو افتح مشروعك بنفسك.</li><li><strong className="text-slate-200">2.</strong> أضف الحزمة هنا، ثم افتح ملفاتها في مساحة الكود.</li><li><strong className="text-slate-200">3.</strong> انسخ Project URL وPublishable key فقط إلى الملف المخصص. لا تستخدم <code>service_role</code> في موقع عام.</li><li><strong className="text-slate-200">4.</strong> راجع SQL وشغّله يدويًا؛ RLS مفعّل افتراضيًا ولا توجد سياسة وصول عامة تلقائية.</li></ol><div className="flex flex-col gap-3"><a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-bold text-white hover:bg-white/10"><Smartphone className="ml-2 h-4 w-4" />فتح Supabase في المتصفح</a><Button onClick={() => addSupabaseStarter.mutate({ websiteBuildId: activeBuild.id })} disabled={addSupabaseStarter.isPending} className="h-11 bg-emerald-300 font-bold text-slate-950 hover:bg-emerald-200">{addSupabaseStarter.isPending ? "جارٍ تجهيز الملفات..." : "إضافة حزمة Supabase للموقع"}</Button></div></div> : <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-5 text-sm leading-7 text-slate-500">أنشئ موقعًا أولًا لتظهر له حزمة Supabase الخاصة.</div>}</article>
    </section>
  </section></DashboardLayout>;
}
