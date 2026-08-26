import { Badge } from "@/components/ui/badge";
import { Braces, CheckCircle2, ClipboardCheck, Globe2, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import React from "react";

type ProposalOutput = {
  executionStatus: "review-only";
  headline: string;
  language?: string;
  scope: string[];
  architecture: string[];
  websiteOutline: { title: string; pages: string[]; hierarchy: string[]; primaryCta: string };
  codeSketch: string[];
  testPlan: string[];
  risks: string[];
  securityReview?: string[];
  aiReview?: string[];
  reviewTasks?: { title: string; objective: string; category: string }[];
  approvalsRequired: string[];
};

export type DeveloperCenterProposalCardProps = {
  headline: string;
  mode: "software" | "website" | "titles" | "security" | "ai" | "self-improvement";
  proposalJson: string;
  createdAt?: Date | string;
};

function parseOutput(proposalJson: string): ProposalOutput | null {
  try {
    const parsed = JSON.parse(proposalJson) as ProposalOutput;
    if (parsed.executionStatus !== "review-only") return null;
    return { ...parsed, language: parsed.language || "General", securityReview: parsed.securityReview || [], aiReview: parsed.aiReview || [], reviewTasks: parsed.reviewTasks || [] };
  } catch { return null; }
}

const modeLabel = { software: "برمجيات معقدة", website: "هيكل موقع", titles: "محرك العناوين", security: "هندسة أمنية", ai: "هندسة ذكاء اصطناعي", "self-improvement": "تحسين ذاتي مضبوط" } as const;

export function DeveloperCenterProposalCard({ headline, mode, proposalJson, createdAt }: DeveloperCenterProposalCardProps) {
  const output = parseOutput(proposalJson);
  if (!output) return <article className="rounded-3xl border border-rose-300/20 bg-rose-300/5 p-5 text-sm text-rose-100">تعذر قراءة مسودة المقترح المحفوظة.</article>;
  const when = createdAt ? new Date(createdAt).toLocaleDateString("ar") : null;
  const section = (title: string, items: string[], icon: React.ReactNode) => items.length ? <section className="rounded-2xl border border-white/8 bg-slate-950/45 p-4"><div className="flex items-center gap-2 text-sm font-bold text-white">{icon}{title}</div><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-400">{items.map((item, index) => <li key={`${title}-${index}`} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />{item}</li>)}</ul></section> : null;

  const securityReview = output.securityReview ?? [];
  const aiReview = output.aiReview ?? [];
  const reviewTasks = output.reviewTasks ?? [];
  return <article className="overflow-hidden rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[0.07] via-slate-950/70 to-violet-400/[0.06] shadow-xl shadow-black/10"><header className="border-b border-white/8 p-5 sm:p-6"><div className="flex flex-wrap items-center gap-2"><Badge className="border border-cyan-300/20 bg-cyan-300/10 text-cyan-100"><ShieldCheck className="ml-1 h-3.5 w-3.5" /> للمراجعة فقط</Badge><Badge variant="outline" className="border-white/10 text-slate-300">{modeLabel[mode]}</Badge><Badge variant="outline" className="border-violet-300/20 text-violet-100">{output.language}</Badge>{when ? <span className="text-xs text-slate-500">{when}</span> : null}</div><h2 className="mt-3 text-xl font-bold text-white">{headline}</h2><p className="mt-2 text-sm leading-7 text-slate-400">هذه مسودة منظمة. لا تغيّر ملفات أو تشغّل كودًا أو تنشر أي شيء.</p></header><div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">{section("نطاق العمل", output.scope, <ClipboardCheck className="h-4 w-4 text-cyan-300" />)}{section("البنية المقترحة", output.architecture, <Braces className="h-4 w-4 text-violet-300" />)}<section className="rounded-2xl border border-white/8 bg-slate-950/45 p-4"><div className="flex items-center gap-2 text-sm font-bold text-white"><Globe2 className="h-4 w-4 text-emerald-300" />بنية الموقع والعناوين</div><p className="mt-3 text-sm font-semibold text-emerald-100">{output.websiteOutline.title}</p><p className="mt-1 text-sm text-slate-400">CTA: {output.websiteOutline.primaryCta}</p><ul className="mt-3 space-y-2 text-sm text-slate-400">{output.websiteOutline.pages.map((page, index) => <li key={`page-${index}`}>• {page}</li>)}</ul></section>{section("مسودة الكود", output.codeSketch, <Braces className="h-4 w-4 text-amber-300" />)}{section("خطة الاختبار", output.testPlan, <CheckCircle2 className="h-4 w-4 text-emerald-300" />)}{section("المخاطر والحدود", output.risks, <TriangleAlert className="h-4 w-4 text-amber-300" />)}{section("مراجعة أمنية دفاعية", securityReview, <ShieldCheck className="h-4 w-4 text-cyan-300" />)}{section("مراجعة الذكاء الاصطناعي", aiReview, <Sparkles className="h-4 w-4 text-violet-300" />)}</div>{reviewTasks.length ? <section className="border-t border-white/8 bg-white/[0.02] p-5 sm:p-6"><h3 className="font-bold text-white">مكتبة مهام المراجعة</h3><p className="mt-1 text-sm text-slate-500">مهام موصى بها فقط؛ ليست أوامر قابلة للتشغيل.</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{reviewTasks.map((task, index) => <div key={`${task.title}-${index}`} className="rounded-xl border border-white/8 bg-slate-950/45 p-3"><p className="text-xs text-cyan-200">{task.category}</p><p className="mt-1 font-semibold text-white">{task.title}</p><p className="mt-1 text-sm leading-6 text-slate-400">{task.objective}</p></div>)}</div></section> : null}<footer className="border-t border-amber-300/10 bg-amber-300/[0.04] p-5 sm:p-6"><p className="text-sm font-semibold text-amber-100">الموافقات المطلوبة قبل أي تطبيق</p><p className="mt-2 text-sm leading-7 text-amber-100/70">{output.approvalsRequired.join(" • ")}</p></footer></article>;
}
