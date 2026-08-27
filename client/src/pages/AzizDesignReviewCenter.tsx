import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, FilePenLine, Palette, ShieldCheck } from "lucide-react";
import React, { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

const reviewStatuses = ["pending", "approved", "rejected", "archived"] as const;
type ReviewStatus = (typeof reviewStatuses)[number];

function outputSummary(outputJson: string) {
  try {
    const value = JSON.parse(outputJson) as { concept?: unknown };
    return typeof value.concept === "string" ? value.concept : "لا يمكن قراءة الملخص الآن.";
  } catch { return "لا يمكن قراءة الملخص الآن."; }
}

export default function AzizDesignReviewCenter() {
  const utils = trpc.useUtils();
  const collections = trpc.azizMarket.collections.useQuery();
  const mine = trpc.azizMarket.mine.useQuery();
  const [collectionKey, setCollectionKey] = useState<"aziz-1" | "aziz-2" | "aziz-3">("aziz-1");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [status, setStatus] = useState<ReviewStatus>("pending");
  const [mediaUrl, setMediaUrl] = useState("");
  const [note, setNote] = useState("");
  const selected = useMemo(() => mine.data?.find(asset => asset.id === selectedId), [mine.data, selectedId]);
  const create = trpc.azizMarket.createDraft.useMutation({
    onSuccess: async () => { setTitle(""); setBrief(""); await mine.refetch(); toast.success("حُفظت مسودة تصميم واحدة للمراجعة؛ لم يُنشأ ملف أو صورة تلقائيًا."); },
    onError: issue => toast.error(issue.message),
  });
  const review = trpc.azizMarket.review.useMutation({
    onSuccess: async () => { await Promise.all([mine.refetch(), utils.azizMarket.collections.invalidate(), utils.azizMarket.publicAssets.invalidate()]); toast.success("تم تحديث حالة المراجعة فقط."); },
    onError: issue => toast.error(issue.message),
  });
  function submitDraft(event: FormEvent<HTMLFormElement>) { event.preventDefault(); create.mutate({ collectionKey, title, brief }); }
  function submitReview(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (selected) review.mutate({ id: selected.id, status, mediaUrl: mediaUrl || undefined, moderationNote: note || undefined }); }
  function selectAsset(asset: NonNullable<typeof mine.data>[number]) {
    setSelectedId(asset.id);
    setStatus(asset.status === "draft" ? "pending" : asset.status);
    setMediaUrl(asset.mediaUrl ?? "");
    setNote(asset.moderationNote ?? "");
  }

  return <DashboardLayout><section className="mx-auto max-w-6xl space-y-5">
    <header className="rounded-[2rem] border border-amber-300/20 bg-gradient-to-l from-amber-300/10 via-slate-950 to-violet-400/10 p-6 sm:p-8">
      <Badge className="border border-amber-300/25 bg-amber-300/10 text-amber-100"><ShieldCheck className="ml-1 h-3.5 w-3.5" />خاص بالمالك</Badge>
      <h1 className="mt-4 text-2xl font-bold text-white sm:text-3xl">مراجعة سوق عزوز</h1>
      <p className="mt-2 max-w-3xl leading-8 text-slate-300">أنشئ مسودة تصميم واحدة عند الطلب. لا تنشر المسودة ولا تنشئ وسائط أو أسعارًا أو دفعًا. لا يصبح التصميم عامًا إلا بعد مراجعته وإضافة مرجع HTTPS يثبت مصدره.</p>
    </header>
    <section className="grid gap-5 xl:grid-cols-2">
      <Card className="border-white/10 bg-slate-950/65 text-white"><CardHeader><CardTitle className="flex items-center gap-2"><FilePenLine className="h-5 w-5 text-amber-300" />مسودة تصميم بالذكاء</CardTitle></CardHeader><CardContent><form onSubmit={submitDraft} className="space-y-3"><select value={collectionKey} onChange={event => setCollectionKey(event.target.value as typeof collectionKey)} className="h-10 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white"><option value="aziz-1">عزوز 1 — مواقع</option><option value="aziz-2">عزوز 2 — بطاقات أعمال</option><option value="aziz-3">عزوز 3 — أغلفة كتب</option></select><input value={title} onChange={event => setTitle(event.target.value)} maxLength={160} placeholder="عنوان التصميم" className="h-10 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white" /><textarea value={brief} onChange={event => setBrief(event.target.value)} maxLength={4000} placeholder="هدف التصميم، جمهوره، الأسلوب، والقيود…" className="min-h-36 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm leading-6 text-white" /><Button type="submit" disabled={create.isPending || title.trim().length < 3 || brief.trim().length < 24} className="w-full bg-amber-300 text-slate-950 hover:bg-amber-200"><Palette className="ml-1 h-4 w-4" />{create.isPending ? "يجري إعداد مسودة واحدة…" : "إعداد مسودة للمراجعة"}</Button></form></CardContent></Card>
      <Card className="border-white/10 bg-slate-950/65 text-white"><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-300" />حالة المجموعات</CardTitle></CardHeader><CardContent className="space-y-3">{collections.data?.map(collection => <div key={collection.key} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.025] p-3"><div><p className="font-bold">{collection.name}</p><p className="mt-1 text-xs text-slate-500">{collection.description}</p></div><Badge className="border border-white/10 bg-white/[0.04] text-slate-200">{collection.approvedCount} / {collection.capacity}</Badge></div>)}</CardContent></Card>
    </section>
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="border-white/10 bg-slate-950/65 text-white"><CardHeader><CardTitle>مسوداتك وأصولك</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{mine.isLoading ? <p className="text-sm text-slate-400">يجري تحميل المسودات…</p> : mine.data?.length ? mine.data.map(asset => <button type="button" key={asset.id} onClick={() => selectAsset(asset)} className={`rounded-2xl border p-4 text-right ${selectedId === asset.id ? "border-amber-300/45 bg-amber-300/[0.08]" : "border-white/10 bg-white/[0.02]"}`}><div className="flex items-center justify-between gap-2"><h3 className="font-bold">{asset.title}</h3><Badge variant="outline" className="border-white/15 text-slate-300">{asset.status}</Badge></div><p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-400">{outputSummary(asset.outputJson)}</p></button>) : <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm leading-7 text-slate-500">لا توجد مسودات بعد. لا ينشئ السوق عناصر وهمية بدلًا عنها.</p>}</CardContent></Card>
      <Card className="border border-amber-300/20 bg-amber-300/[0.04] text-white"><CardHeader><CardTitle>مراجعة الأصل المختار</CardTitle></CardHeader><CardContent><form onSubmit={submitReview} className="space-y-3"><p className="text-sm leading-7 text-slate-400">{selected ? selected.title : "اختر مسودة أولًا."}</p><select value={status} onChange={event => setStatus(event.target.value as ReviewStatus)} disabled={!selected} className="h-10 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white">{reviewStatuses.map(value => <option key={value} value={value}>{value}</option>)}</select><input value={mediaUrl} onChange={event => setMediaUrl(event.target.value)} type="url" placeholder="رابط HTTPS لمرجع التصميم عند الاعتماد" disabled={!selected} className="h-10 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white" /><textarea value={note} onChange={event => setNote(event.target.value)} maxLength={500} placeholder="ملاحظة مراجعة اختيارية" disabled={!selected} className="min-h-24 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white" /><Button type="submit" disabled={!selected || review.isPending} className="w-full bg-emerald-300 text-slate-950 hover:bg-emerald-200">{review.isPending ? "يجري حفظ المراجعة…" : "حفظ حالة المراجعة"}</Button></form></CardContent></Card>
    </section>
  </section></DashboardLayout>;
}
