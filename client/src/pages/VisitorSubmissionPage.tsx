import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { FileCode2, ImagePlus, MessageSquareHeart, Send, ShieldCheck, Video } from "lucide-react";
import React, { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

type AttachmentDraft = { name: string; mimeType: string; base64: string };

const categories = [
  { key: "opinion" as const, label: "رأي أو اقتراح", icon: MessageSquareHeart },
  { key: "media" as const, label: "صور أو فيديو", icon: ImagePlus },
  { key: "code" as const, label: "مشاركة كود", icon: FileCode2 },
  { key: "project" as const, label: "مشروع أو تجربة", icon: Video },
];

function fileToDraft(file: File) {
  return new Promise<AttachmentDraft>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("تعذر قراءة الملف"));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const base64 = result.includes(",") ? result.split(",", 2)[1] : "";
      if (!base64) return reject(new Error("تعذر تجهيز الملف"));
      resolve({ name: file.name, mimeType: file.type || "text/plain", base64 });
    };
    reader.readAsDataURL(file);
  });
}

export default function VisitorSubmissionPage() {
  const { direction } = useLanguage();
  const [category, setCategory] = useState<(typeof categories)[number]["key"]>("opinion");
  const [alias, setAlias] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [consent, setConsent] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const policy = trpc.visitorSubmissions.policy.useQuery();
  const submit = trpc.visitorSubmissions.submit.useMutation({ onSuccess: () => { setAlias(""); setTitle(""); setContent(""); setAttachments([]); setConsent(false); toast.success("وصلت مشاركتك إلى طابور المراجعة الخاص."); }, onError: error => toast.error(error.message) });
  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    try {
      const selection = Array.from(files);
      if (selection.length + attachments.length > 4) throw new Error("يمكن إرفاق أربعة ملفات كحد أقصى");
      const drafts = await Promise.all(selection.map(fileToDraft));
      setAttachments(current => [...current, ...drafts]);
    } catch (error) { toast.error(error instanceof Error ? error.message : "تعذر تجهيز المرفق"); }
  };

  return <main dir={direction} className="dev-shell min-h-screen px-4 py-8 sm:px-6 sm:py-12"><section className="mx-auto max-w-3xl"><header className="flex items-center justify-between gap-4"><Link href="/" className="font-mono text-lg font-bold text-white">Dev<span className="text-cyan-300">Forge</span></Link><Badge className="border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">مساحة مشاركة آمنة</Badge></header><div className="mt-8 rounded-[2rem] border border-cyan-300/15 bg-gradient-to-l from-cyan-300/10 via-slate-950 to-violet-400/10 p-6 sm:p-9"><div className="flex gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-300 text-slate-950"><MessageSquareHeart className="h-6 w-6" /></div><div><h1 className="text-2xl font-bold text-white sm:text-3xl">شارك رأيك أو عملك</h1><p className="mt-2 leading-8 text-slate-300">أرسل رأيًا أو صورة أو فيديو أو ملف كود. تبقى كل المشاركات معلّقة ولا تصبح عامة تلقائيًا.</p></div></div></div><form onSubmit={event => { event.preventDefault(); submit.mutate({ visitorAlias: alias.trim() || undefined, category, title, content, consentAccepted: true, attachments }); }} className="mt-5 rounded-[2rem] border border-white/8 bg-slate-950/70 p-5 sm:p-7"><div className="grid gap-3 sm:grid-cols-2">{categories.map(item => <button key={item.key} type="button" onClick={() => setCategory(item.key)} className={`rounded-2xl border p-4 text-right ${category === item.key ? "border-cyan-300/35 bg-cyan-300/10" : "border-white/8 bg-white/[0.02]"}`}><item.icon className={`h-5 w-5 ${category === item.key ? "text-cyan-300" : "text-slate-500"}`} /><p className="mt-2 font-bold text-white">{item.label}</p></button>)}</div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-300">اسم مستعار اختياري<input value={alias} onChange={event => setAlias(event.target.value)} maxLength={80} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/[0.035] px-3 text-white outline-none focus:border-cyan-300/40" placeholder="يمكنك تركه فارغًا" /></label><label className="text-sm font-semibold text-slate-300">عنوان المشاركة<input value={title} onChange={event => setTitle(event.target.value)} maxLength={180} required className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/[0.035] px-3 text-white outline-none focus:border-cyan-300/40" placeholder="عنوان واضح ومختصر" /></label></div><label className="mt-4 block text-sm font-semibold text-slate-300">وصف المشاركة<textarea value={content} onChange={event => setContent(event.target.value)} minLength={12} maxLength={6000} required className="mt-2 min-h-44 w-full resize-y rounded-2xl border border-white/10 bg-white/[0.035] p-4 leading-7 text-white outline-none focus:border-cyan-300/40" placeholder="اشرح رأيك أو مشروعك أو سياق الكود الذي تشاركه…" /></label><section className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4"><div className="flex items-start gap-3"><ImagePlus className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" /><div><h2 className="font-bold text-white">مرفقات اختيارية</h2><p className="mt-1 text-sm leading-6 text-slate-500">صور JPEG/PNG/WebP حتى 5MB، فيديو MP4/WebM حتى 12MB، أو ملفات كود نصية آمنة حتى 512KB. أربعة مرفقات و16MB إجمالًا كحد أقصى.</p></div></div><input aria-label="إضافة مرفقات" type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,.py,.ts,.tsx,.js,.jsx,.html,.css,.json,.md,.sql,.java,.go,.rs,.php,.rb,.swift,.kt,.cpp,.c,.cs" onChange={event => void handleFiles(event.target.files)} className="mt-4 block w-full text-sm text-slate-400 file:ml-3 file:rounded-lg file:border-0 file:bg-cyan-300 file:px-3 file:py-2 file:font-bold file:text-slate-950" />{attachments.length ? <ul className="mt-3 space-y-2 text-sm text-cyan-100">{attachments.map((attachment, index) => <li key={`${attachment.name}-${index}`} className="flex items-center justify-between rounded-lg bg-cyan-300/5 px-3 py-2"><span className="truncate">{attachment.name}</span><button type="button" onClick={() => setAttachments(current => current.filter((_, itemIndex) => itemIndex !== index))} className="text-rose-200 hover:text-rose-100">إزالة</button></li>)}</ul> : null}</section><label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-4 text-sm leading-7 text-amber-100"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-1 accent-cyan-300" /><span>{policy.data?.copy ?? "تتم مراجعة المحتوى يدويًا ولا يُنشر تلقائيًا."}</span></label><Button type="submit" disabled={!consent || title.trim().length < 3 || content.trim().length < 12 || submit.isPending} className="mt-5 w-full bg-cyan-300 text-slate-950 hover:bg-cyan-200"><Send className="ml-2 h-4 w-4" />{submit.isPending ? "يجري إرسال المشاركة…" : "إرسال للمراجعة"}</Button></form><p className="mt-5 flex gap-2 text-xs leading-6 text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />لا ترسل كلمات مرور أو رموز تحقق أو بيانات حساسة أو محتوى لا تملك حق مشاركته.</p></section></main>;
}
