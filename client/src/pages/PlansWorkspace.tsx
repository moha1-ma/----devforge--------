import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { buildBlueprints, BuildBlueprintKey } from "@shared/buildBlueprints";
import { CheckCircle2, ChevronLeft, Circle, CircleDotDashed, Code2, Layers3, Rocket, Smartphone, Sparkles } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

const icons: Record<BuildBlueprintKey, typeof Layers3> = { web: Layers3, mobile: Smartphone, api: Code2, product: Rocket };
const nextStatus = { "not-started": "in-progress", "in-progress": "done", done: "not-started" } as const;
export default function PlansWorkspace() {
  const { direction, t } = useLanguage();
  const statusCopy = { "not-started": t("notStarted"), "in-progress": t("inProgress"), done: t("complete") } as const;
  const [location] = useLocation();
  const utils = trpc.useUtils();
  const { data: plans = [] } = trpc.buildPlans.list.useQuery();
  const [planId, setPlanId] = useState<number | null>(null);
  const requestedPlanId = Number(new URLSearchParams(location.split("?")[1] ?? "").get("plan")) || null;
  useEffect(() => {
    const preferredPlanId = requestedPlanId && plans.some(plan => plan.id === requestedPlanId) ? requestedPlanId : plans[0]?.id ?? null;
    if (preferredPlanId && preferredPlanId !== planId) setPlanId(preferredPlanId);
  }, [planId, plans, requestedPlanId]);
  const detail = trpc.buildPlans.get.useQuery({ planId: planId ?? 0 }, { enabled: Boolean(planId) });
  const create = trpc.buildPlans.create.useMutation({ onSuccess: async data => { await utils.buildPlans.list.invalidate(); setPlanId(data.plan.id); toast.success(t("createdPlan")); }, onError: error => toast.error(error.message) });
  const update = trpc.buildPlans.updateStep.useMutation({ onSuccess: async () => { await utils.buildPlans.get.invalidate(); await utils.buildPlans.list.invalidate(); }, onError: error => toast.error(error.message) });
  const activePlan = detail.data?.plan;
  const steps = detail.data?.steps ?? [];
  return <DashboardLayout><section dir={direction} className="space-y-6"><div className="rounded-3xl border border-cyan-300/15 bg-gradient-to-l from-cyan-300/10 to-violet-400/10 p-7"><Badge className="border border-cyan-300/20 bg-cyan-300/10 text-cyan-100"><Sparkles className="ml-1 h-3.5 w-3.5" /> {t("guidedPlans")}</Badge><h1 className="mt-4 text-3xl font-bold text-white">{t("plansHero")}</h1><p className="mt-3 max-w-3xl leading-8 text-slate-300">{t("plansCopy")}</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{(Object.entries(buildBlueprints) as [BuildBlueprintKey, typeof buildBlueprints[BuildBlueprintKey]][]).map(([key, blueprint]) => { const Icon = icons[key]; return <article key={key} className="rounded-3xl border border-white/8 bg-white/[0.025] p-5"><Icon className="h-6 w-6 text-cyan-300" /><h2 className="mt-7 font-bold text-white">{blueprint.title}</h2><p className="mt-3 min-h-20 text-sm leading-7 text-slate-500">{blueprint.summary}</p><Button onClick={() => create.mutate({ blueprint: key })} disabled={create.isPending} className="mt-5 w-full bg-white/8 text-white hover:bg-cyan-300 hover:text-slate-950">{t("startThisPlan")} <ChevronLeft className="mr-1 h-4 w-4" /></Button></article>; })}</div><div className="grid min-h-[520px] gap-4 xl:grid-cols-[260px_minmax(0,1fr)]"><aside className="rounded-3xl border border-white/8 bg-white/[0.025] p-4"><p className="text-sm font-bold text-white">{t("myPlans")}</p><div className="mt-4 space-y-2">{plans.length ? plans.map(plan => <button key={plan.id} onClick={() => setPlanId(plan.id)} className={`w-full rounded-xl p-3 text-right ${plan.id === planId ? "bg-cyan-300/12 text-cyan-100" : "text-slate-400 hover:bg-white/6"}`}><p className="truncate text-sm font-semibold">{plan.title}</p><p className="mt-1 text-xs text-slate-600">{plan.status === "complete" ? t("complete") : t("active")}</p></button>) : <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm leading-7 text-slate-600">{t("choosePath")}</p>}</div></aside><article className="rounded-3xl border border-white/8 bg-slate-950/55 p-6">{activePlan ? <><div className="flex flex-col justify-between gap-4 md:flex-row md:items-start"><div><Badge className="border-0 bg-emerald-400/10 text-emerald-300">{activePlan.status === "complete" ? t("completedPlan") : t("activePlan")}</Badge><h2 className="mt-4 text-2xl font-bold text-white">{activePlan.title}</h2><p className="mt-2 text-sm text-slate-500">{t("planInstruction")}</p></div><Link href="/code"><Button className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"><Code2 className="ml-2 h-4 w-4" /> {t("openCodeWorkspace")}</Button></Link></div><div className="mt-8 space-y-3">{steps.map((step, index) => <button key={step.id} onClick={() => update.mutate({ planId: activePlan.id, stepId: step.id, status: nextStatus[step.status] })} className="flex w-full gap-4 rounded-2xl border border-white/8 bg-white/[0.025] p-4 text-right transition hover:border-cyan-300/25 hover:bg-white/[0.05]"><span className="mt-0.5 text-cyan-300">{step.status === "done" ? <CheckCircle2 className="h-5 w-5" /> : step.status === "in-progress" ? <CircleDotDashed className="h-5 w-5" /> : <Circle className="h-5 w-5" />}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-slate-500">{String(index + 1).padStart(2, "0")}</span><span className="font-bold text-white">{step.title}</span><span className="text-xs text-slate-500">{statusCopy[step.status]}</span></span><span className="mt-2 block text-sm leading-7 text-slate-400">{step.description}</span><span className="mt-2 block text-xs text-cyan-200">{t("outcome")}: {step.deliverable}</span></span></button>)}</div></> : <div className="grid h-full place-items-center text-center"><div><Rocket className="mx-auto h-8 w-8 text-cyan-300" /><h2 className="mt-4 font-bold text-white">{t("planStartsHere")}</h2><p className="mt-2 max-w-md text-sm leading-7 text-slate-500">{t("planStartsHereCopy")}</p></div></div>}</article></div></section></DashboardLayout>;
}
