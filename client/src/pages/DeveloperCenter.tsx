import DashboardLayout from "@/components/DashboardLayout";
import { DeveloperCenterProposalCard } from "@/components/DeveloperCenterProposalCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { BrainCircuit, CircleAlert, Globe2, Layers3, Lightbulb, LockKeyhole, Send, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const modes = [
  { key: "software" as const, label: "معمار البرمجيات", description: "فكّك منتجًا معقدًا إلى نطاق وبنية واختبارات ومخاطر.", icon: Layers3 },
  { key: "website" as const, label: "محرك بناء المواقع", description: "أنشئ هيكل صفحات وعناوين وتسلسل محتوى وCTA منظم.", icon: Globe2 },
  { key: "titles" as const, label: "استوديو العناوين", description: "صمّم نظام عناوين ورسائل تحويل متسقة مع هدف المنتج.", icon: Lightbulb },
];

export default function DeveloperCenter() {
  const { direction } = useLanguage();
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<(typeof modes)[number]["key"]>("software");
  const [brief, setBrief] = useState("");
  const { data: proposals = [], isLoading, error } = trpc.developerCenter.list.useQuery();
  const generate = trpc.developerCenter.generate.useMutation({
    onSuccess: async () => { await utils.developerCenter.list.invalidate(); setBrief(""); toast.success("تم إنشاء مسودة هندسية للمراجعة."); },
    onError: issue => toast.error(issue.message),
  });
  const activeMode = modes.find(item => item.key === mode) ?? modes[0];

  return <DashboardLayout><section dir={direction} className="space-y-5 sm:space-y-6">
    <header className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-gradient-to-l from-cyan-400/15 via-slate-950 to-violet-400/10 p-6 sm:p-8"><div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-cyan-300/10 blur-3xl" /><Badge className="relative border border-cyan-300/20 bg-cyan-300/10 text-cyan-100"><LockKeyhole className="ml-1 h-3.5 w-3.5" /> خاص بالمالك</Badge><div className="relative mt-5 flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-300 text-slate-950"><BrainCircuit className="h-6 w-6" /></div><div><h1 className="text-2xl font-bold text-white sm:text-3xl">مركز المطور الذكي</h1><p className="mt-2 max-w-3xl leading-8 text-slate-300">محرّك منظم لتصميم البرمجيات المعقدة وهياكل المواقع والعناوين. كل نتيجة مسودة للمراجعة ولا تنفذ أي تغيير أو أمر أو نشر.</p></div></div></header>

    <section className="rounded-3xl border border-white/8 bg-white/[0.025] p-4 sm:p-6"><div className="flex items-start gap-3"><Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" /><div><h2 className="font-bold text-white">اختر عقلًا هندسيًا</h2><p className="mt-1 text-sm leading-6 text-slate-500">حوّل الهدف إلى وثيقة قابلة للنقد والتحسين قبل أي تطبيق يدوي لاحق.</p></div></div><div className="mt-5 grid gap-3 lg:grid-cols-3">{modes.map(item => <button key={item.key} onClick={() => setMode(item.key)} className={`rounded-2xl border p-4 text-right transition ${mode === item.key ? "border-cyan-300/35 bg-cyan-300/10" : "border-white/8 bg-slate-950/35 hover:bg-white/[0.05]"}`}><item.icon className={`h-5 w-5 ${mode === item.key ? "text-cyan-300" : "text-slate-500"}`} /><h3 className="mt-3 font-bold text-white">{item.label}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p></button>)}</div></section>

    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_310px]"><form onSubmit={event => { event.preventDefault(); generate.mutate({ mode, brief }); }} className="rounded-3xl border border-white/8 bg-slate-950/55 p-5 sm:p-6"><div className="flex items-center gap-3"><activeMode.icon className="h-5 w-5 text-cyan-300" /><div><h2 className="font-bold text-white">{activeMode.label}</h2><p className="mt-1 text-sm text-slate-500">اكتب الهدف والقيود والجمهور والنتيجة المرغوبة.</p></div></div><label htmlFor="developer-center-brief" className="sr-only">وصف الطلب</label><textarea id="developer-center-brief" value={brief} onChange={event => setBrief(event.target.value)} placeholder="مثال: صمم منصة تعليمية عربية للشركات، تشمل مسارات تدريب ولوحة مدير وموقعًا تسويقيًا من خمس صفحات…" className="mt-5 min-h-48 w-full resize-y rounded-2xl border border-white/10 bg-white/[0.035] p-4 leading-7 text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40" maxLength={6000} /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">{brief.length}/6000 · لا تطلب تنفيذ أوامر أو نشرًا أو استخدام أسرار.</p><Button type="submit" disabled={generate.isPending || brief.trim().length < 24} className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"><Send className="ml-2 h-4 w-4" />{generate.isPending ? "يجري بناء المسودة…" : "إنشاء مقترح"}</Button></div></form><aside className="rounded-3xl border border-amber-300/15 bg-amber-300/[0.045] p-5"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" /><div><h2 className="font-bold text-amber-100">حدود ثابتة</h2><p className="mt-2 text-sm leading-7 text-amber-100/70">لا تعديل ملفات، ولا تشغيل كود، ولا اتصالات خارجية، ولا نشر أو دفع أو حسابات. أي خطوة تطبيق لاحقة تتطلب قرارًا منفصلًا ومراجعة المالك.</p></div></div></aside></section>

    {error ? <p role="alert" className="rounded-2xl border border-rose-300/20 bg-rose-300/5 p-4 text-sm text-rose-100">{error.message}</p> : null}
    <section className="space-y-4"><div className="flex items-center gap-3"><h2 className="text-lg font-bold text-white">مسوداتك المنظمة</h2><Badge variant="outline" className="border-white/10 text-slate-400">{proposals.length}</Badge></div>{isLoading ? <p className="rounded-3xl border border-white/8 p-6 text-sm text-slate-500">يجري تحميل المسودات الخاصة…</p> : proposals.length ? proposals.map(proposal => <DeveloperCenterProposalCard key={proposal.id} headline={proposal.headline} mode={proposal.mode} proposalJson={proposal.proposalJson} createdAt={proposal.createdAt} />) : <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center"><CircleAlert className="mx-auto h-7 w-7 text-slate-600" /><h3 className="mt-3 font-bold text-white">لا توجد مسودات بعد</h3><p className="mt-2 text-sm leading-7 text-slate-500">ابدأ بوصف مشروعك ليولد المركز خطة منظمة قابلة للمراجعة.</p></div>}</section>
  </section></DashboardLayout>;
}
