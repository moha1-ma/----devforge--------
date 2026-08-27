import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { miniWorkstationRoles, type MiniWorkstationKey } from "@shared/miniWorkstationCatalog";
import { Activity, Archive, BrainCircuit, Check, CircleAlert, Clock3, Cpu, FileSearch, LockKeyhole, Play, ShieldCheck } from "lucide-react";
import React, { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

type SavedOutput = { executionStatus?: string; headline?: string; summary?: string; findings?: string[]; openQuestions?: string[]; risks?: string[]; ownerNextSteps?: string[] };

function readOutput(value: string): SavedOutput | null {
  try {
    const parsed = JSON.parse(value) as SavedOutput;
    return parsed && parsed.executionStatus === "review-only" ? parsed : null;
  } catch {
    return null;
  }
}

function statusCopy(status: "completed" | "reviewed" | "archived") {
  return status === "reviewed" ? "تمت المراجعة" : status === "archived" ? "مؤرشف" : "نتيجة جديدة";
}

function DetailList({ title, items, tone = "slate" }: { title: string; items?: string[]; tone?: "slate" | "amber" }) {
  if (!items?.length) return null;
  return <section className="mt-4"><h4 className={`text-xs font-bold ${tone === "amber" ? "text-amber-200" : "text-slate-500"}`}>{title}</h4><ul className="mt-2 space-y-2">{items.map((item, index) => <li key={`${index}-${item.slice(0, 24)}`} className="rounded-xl bg-white/[0.035] p-3 text-sm leading-6 text-slate-300">{item}</li>)}</ul></section>;
}

export default function MiniWorkstations() {
  const { direction } = useLanguage();
  const utils = trpc.useUtils();
  const [stationKey, setStationKey] = useState<MiniWorkstationKey>("architecture");
  const [request, setRequest] = useState("");
  const paths = trpc.miniWorkstations.paths.useQuery();
  const run = trpc.miniWorkstations.run.useMutation({
    onSuccess: async () => { await utils.miniWorkstations.paths.invalidate(); setRequest(""); toast.success("حُفظت نتيجة المحطة في مسار المراجعة الخاص بالمالك."); },
    onError: error => toast.error(error.message),
  });
  const reviewPath = trpc.miniWorkstations.reviewPath.useMutation({
    onSuccess: async () => { await utils.miniWorkstations.paths.invalidate(); toast.success("تم تحديث حالة المراجعة فقط؛ لم تُطبَّق أي تغييرات."); },
    onError: error => toast.error(error.message),
  });
  const consolidate = trpc.miniWorkstations.consolidate.useMutation({
    onSuccess: async () => { await utils.miniWorkstations.paths.invalidate(); toast.success("حُفظت مسودة تجميع الفريق للمراجعة؛ لم يُدمج أي كود أو تغيير."); },
    onError: error => toast.error(error.message),
  });
  const selectedStation = miniWorkstationRoles.find(role => role.key === stationKey) ?? miniWorkstationRoles[0];
  const latestByStation = useMemo(() => {
    const latest = new Map<string, { reviewStatus: "completed" | "reviewed" | "archived" }>();
    for (const path of paths.data ?? []) if (!latest.has(path.stationKey)) latest.set(path.stationKey, path);
    return latest;
  }, [paths.data]);
  const stationsWithPaths = latestByStation.size;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run.mutate({ stationKey, request });
  }

  return <DashboardLayout><section dir={direction} className="space-y-6"><header className="relative overflow-hidden rounded-[2rem] border border-violet-300/20 bg-gradient-to-l from-violet-400/15 via-slate-950 to-cyan-400/10 p-6 sm:p-8"><div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-violet-300/10 blur-3xl" /><div className="relative flex flex-wrap items-start justify-between gap-4"><div><Badge className="border border-violet-300/20 bg-violet-300/10 text-violet-100"><LockKeyhole className="ml-1 h-3.5 w-3.5" />محطات المالك فقط</Badge><h1 className="mt-4 text-2xl font-bold text-white sm:text-3xl">المحطات المصغرة الذكية</h1><p className="mt-2 max-w-3xl leading-8 text-slate-300">عشر محطات ذات أدوار ثابتة. تبدأ المحطة بعد طلبك فقط، ويُحفظ المسار داخل DevForge للمراجعة. لا تعمل في الخلفية، ولا تعدّل أو تنشر أو تدمج أو تحفظ إلى GitHub تلقائيًا.</p></div><div className="rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-center"><p className="font-mono text-xl font-bold text-cyan-200">10 / 10</p><p className="mt-1 text-xs text-slate-500">محطات ثابتة</p></div></div></header>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{miniWorkstationRoles.map((station, index) => { const latest = latestByStation.get(station.key); return <button type="button" key={station.key} aria-pressed={stationKey === station.key} onClick={() => setStationKey(station.key)} className={`rounded-2xl border p-4 text-right transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${stationKey === station.key ? "border-cyan-300/40 bg-cyan-300/10" : "border-white/8 bg-slate-950/55 hover:bg-white/[0.045]"}`}><div className="flex items-center justify-between gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-white/[0.055] font-mono text-xs text-cyan-200">{String(index + 1).padStart(2, "0")}</span>{latest ? <Badge className="border border-emerald-300/20 bg-emerald-300/10 text-[10px] text-emerald-100">{statusCopy(latest.reviewStatus)}</Badge> : <Badge className="border border-white/10 bg-white/[0.04] text-[10px] text-slate-400">جاهزة</Badge>}</div><h2 className="mt-4 font-bold text-white">{station.title}</h2><p className="mt-2 text-xs leading-6 text-slate-500">{station.summary}</p></button>; })}</section>
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]"><form onSubmit={submit} className="rounded-3xl border border-white/8 bg-slate-950/65 p-5 sm:p-6"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200"><Cpu className="h-5 w-5" /></div><div><h2 className="font-bold text-white">{selectedStation.title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{selectedStation.summary}</p></div></div><label htmlFor="mini-workstation-request" className="mt-5 block text-sm font-semibold text-slate-300">طلب المحطة المختارة</label><textarea id="mini-workstation-request" value={request} onChange={event => setRequest(event.target.value)} maxLength={4000} placeholder="اكتب هدفًا محددًا وقيودًا ونتيجة متوقعة ليُنشئ الذكاء مسار مراجعة منظمًا…" className="mt-2 min-h-44 w-full resize-y rounded-2xl border border-white/10 bg-white/[0.035] p-4 leading-7 text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/45" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">{request.length}/4000 · يبدأ الذكاء عند الضغط فقط.</p><Button type="submit" disabled={run.isPending || request.trim().length < 24} className="bg-cyan-300 font-bold text-slate-950 hover:bg-cyan-200"><Play className="ml-1 h-4 w-4" />{run.isPending ? "تعمل المحطة…" : "بدء مراجعة بالذكاء"}</Button></div></form><aside className="rounded-3xl border border-amber-300/15 bg-amber-300/[0.045] p-5"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" /><div><h2 className="font-bold text-amber-100">قواعد التشغيل</h2><p className="mt-2 text-sm leading-7 text-amber-100/75">تعمل محطة JavaScript ومحطة Python ضمن مسار واحد عند بدء المالك لكل مراجعة. لا توجد رسائل بين المحطات أو تشغيل متكرر.</p></div></div><div className="mt-5 space-y-2 text-xs leading-6 text-amber-100/70"><p>• Termux: تسليم دليل مراجعة للمالك، لا اتصال بهاتف أو تنفيذ جهاز.</p><p>• لا تشغيل كود أو تغيير ملفات أو نشر.</p><p>• لا وصول إلى أسرار أو حسابات أو أجهزة.</p><p>• لا مزامنة أو كتابة تلقائية في GitHub.</p></div></aside></section>
    <section className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold text-white">ذاكرة المسارات</h2><p className="mt-1 text-sm text-slate-500">تُحفظ الطلبات والنتائج والتوقيت وحالة مراجعتك. لا تُنشئ هذه الصفحة دمجًا أو تغييرًا في المشروع.</p></div><Badge variant="outline" className="border-white/10 text-slate-300"><Clock3 className="ml-1 h-3.5 w-3.5" />{paths.data?.length ?? 0} مسار</Badge></div><section className="rounded-3xl border border-violet-300/15 bg-violet-300/[0.035] p-5"><div className="flex flex-wrap items-end justify-between gap-4"><div><h3 className="font-bold text-white">تجميع فريق المراجعة</h3><p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">بعد وجود مسار لكل محطة، يمكنك طلب مسودة تجميع واحدة. هذه المسودة لا تدمج الشيفرة ولا تحذف محطات ولا تغيّر البنية أو GitHub.</p></div><Button type="button" onClick={() => consolidate.mutate()} disabled={stationsWithPaths < 10 || consolidate.isPending} className="bg-violet-300 text-slate-950 hover:bg-violet-200"><BrainCircuit className="ml-1 h-4 w-4" />{consolidate.isPending ? "يجري إعداد المسودة…" : "إنشاء تجميع للمراجعة"}</Button></div><p className="mt-3 text-xs text-violet-100/75">تغطية الفريق: {stationsWithPaths}/10 محطات. يبدأ التجميع عند الضغط فقط.</p></section>{paths.isLoading ? <p className="rounded-3xl border border-white/8 p-6 text-sm text-slate-500">يجري تحميل المسارات الخاصة…</p> : paths.data?.length ? <div className="grid gap-4 xl:grid-cols-2">{paths.data.map(path => { const output = readOutput(path.outputJson); const station = miniWorkstationRoles.find(item => item.key === path.stationKey); return <article key={path.id} className="rounded-3xl border border-white/8 bg-slate-950/65 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><Badge className="border border-cyan-300/15 bg-cyan-300/10 text-cyan-100">{station?.title ?? (path.stationKey === "team-consolidation" ? "مسودة تجميع الفريق" : path.stationKey)}</Badge><h3 className="mt-3 font-bold text-white">{path.headline}</h3><p className="mt-2 text-xs text-slate-500"><Activity className="ml-1 inline h-3.5 w-3.5" />{new Date(path.createdAt).toLocaleString("ar")} · {path.model}</p></div><Badge className={path.reviewStatus === "reviewed" ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : path.reviewStatus === "archived" ? "border border-white/10 bg-white/[0.04] text-slate-400" : "border border-amber-300/20 bg-amber-300/10 text-amber-100"}>{statusCopy(path.reviewStatus)}</Badge></div><p className="mt-4 leading-7 text-slate-300">{output?.summary ?? "المخرج المحفوظ غير متاح للعرض الآن."}</p><DetailList title="النتائج" items={output?.findings} /><DetailList title="الأسئلة المفتوحة" items={output?.openQuestions} /><DetailList title="المخاطر" items={output?.risks} tone="amber" /><DetailList title="خطوات المالك التالية" items={output?.ownerNextSteps} />{path.reviewStatus === "completed" ? <div className="mt-5 flex flex-wrap gap-2"><Button size="sm" onClick={() => reviewPath.mutate({ id: path.id, reviewStatus: "reviewed" })} disabled={reviewPath.isPending} className="bg-emerald-300 text-slate-950 hover:bg-emerald-200"><Check className="ml-1 h-4 w-4" />توثيق المراجعة</Button><Button size="sm" variant="outline" onClick={() => reviewPath.mutate({ id: path.id, reviewStatus: "archived" })} disabled={reviewPath.isPending} className="border-white/15 text-slate-300 hover:bg-white/10 hover:text-white"><Archive className="ml-1 h-4 w-4" />أرشفة</Button></div> : null}</article>; })}</div> : <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center"><FileSearch className="mx-auto h-7 w-7 text-violet-300" /><h3 className="mt-3 font-bold text-white">لا يوجد مسار محفوظ بعد</h3><p className="mt-2 text-sm leading-7 text-slate-500">اختر إحدى المحطات العشر، اكتب طلبًا محددًا، ثم ابدأ مراجعة واحدة بالذكاء.</p></div>}</section><p className="flex gap-2 rounded-2xl border border-rose-300/15 bg-rose-300/[0.035] p-4 text-sm leading-7 text-rose-100"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />هذه محطات مراجعة محدودة وليست نسخًا ذاتية من حاسوب أو وكلاء مستقلين. لا يمكنها تطوير نفسها أو توليد محطات أو دمج مخرجات أو تنفيذ أعمال خارجية تلقائيًا.</p></section></DashboardLayout>;
}
