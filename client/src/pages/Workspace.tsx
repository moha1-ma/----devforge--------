import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculateProjectHealth, projectHealthCopy } from "@shared/platform";
import { canSubmitWorkItem, matchesWorkspaceQuery } from "@shared/workspaceView";
import { Activity, ArrowUpLeft, CheckCircle2, CircleDotDashed, Clock3, Code2, GitMerge, GitPullRequest, KanbanSquare, ListTodo, Plus, Rocket, Search, Send, ShieldCheck, UsersRound } from "lucide-react";
import React, { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type ItemStatus = "backlog" | "in-progress" | "review" | "done";

const pageDescription: Record<string, string> = {
  "/workspace": "صورة تنفيذية عن مسار التسليم والهندسة في مساحة العمل.",
  "/projects": "مستودع واضح للمشاريع وملكية الفريق وإشارات الجاهزية.",
  "/work-items": "حرّك العمل من التخطيط إلى المراجعة ثم الإنجاز ضمن لوحة واحدة.",
  "/pull-requests": "اتخذ قرارات الدمج من حالة المراجعات والفحوصات، لا من التخمين.",
  "/releases": "تابع كل إصدار ونشره عبر البيئات بسجل واضح قابل للتدقيق.",
};

const columns: Array<{ key: ItemStatus; label: string; className: string }> = [
  { key: "backlog", label: "قائمة الانتظار", className: "border-slate-400/20" },
  { key: "in-progress", label: "قيد التنفيذ", className: "border-cyan-300/30" },
  { key: "review", label: "قيد المراجعة", className: "border-amber-300/30" },
  { key: "done", label: "مكتمل", className: "border-emerald-300/30" },
];

const priorityLabel = { low: "منخفضة", medium: "متوسطة", high: "عالية", urgent: "عاجلة" } as const;

export default function Workspace() {
  const [location, setLocation] = useLocation();
  const { direction, language, t } = useLanguage();
  const localizedDescription: Record<string, string> = language === "ar" ? pageDescription : {
    "/workspace": t("workspaceOverview"), "/projects": t("projectsOverview"), "/work-items": t("workItemsOverview"), "/pull-requests": t("pullsOverview"), "/releases": t("releasesOverview"),
  };
  const utils = trpc.useUtils();
  const [query, setQuery] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [workDialogOpen, setWorkDialogOpen] = useState(false);
  const [workTitle, setWorkTitle] = useState("");
  const [workProjectId, setWorkProjectId] = useState("");
  const { data, isLoading } = trpc.workspace.summary.useQuery();
  const { data: buildPlans = [] } = trpc.buildPlans.list.useQuery();
  const createProject = trpc.projects.create.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.workspace.summary.invalidate(), utils.projects.list.invalidate()]);
      setProjectDialogOpen(false);
      setProjectName("");
      setProjectKey("");
      toast.success(t("projectCreated"));
    },
    onError: error => toast.error(error.message),
  });
  const createWorkItem = trpc.workItems.create.useMutation({
    onSuccess: async () => {
      await utils.workspace.summary.invalidate();
      setWorkDialogOpen(false);
      setWorkTitle("");
      toast.success(t("workItemAdded"));
    },
    onError: error => toast.error(error.message),
  });

  const projects = data?.projects ?? [];
  const workItems = data?.workItems ?? [];
  const pullRequests = data?.pullRequests ?? [];
  const releases = data?.releases ?? [];
  const deployments = data?.deployments ?? [];
  const activity = data?.activity ?? [];
  const resumablePlan = buildPlans.find(plan => plan.status !== "complete") ?? buildPlans[0];
  const filteredProjects = useMemo(() => projects.filter(project => matchesWorkspaceQuery({ key: project.key, name: project.name }, query)), [projects, query]);
  const filteredItems = useMemo(() => workItems.filter(item => matchesWorkspaceQuery({ key: item.key, title: item.title }, query)), [workItems, query]);
  const filteredPrs = useMemo(() => pullRequests.filter(pr => matchesWorkspaceQuery({ key: pr.number, title: pr.title }, query)), [pullRequests, query]);
  const health = calculateProjectHealth({
    failedChecks: pullRequests.filter(pr => !pr.checksPassed).length,
    overdueItems: 0,
    waitingForReview: workItems.filter(item => item.status === "review").length,
  });

  function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createProject.mutate({ name: projectName, key: projectKey });
  }

  function submitWorkItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmitWorkItem(workProjectId, workTitle)) return toast.error(t("chooseProjectAndTitle"));
    createWorkItem.mutate({ projectId: Number(workProjectId), title: workTitle, priority: "medium" });
  }

  function openBuildPlan() {
    setLocation(resumablePlan ? `/plans?plan=${resumablePlan.id}` : "/plans");
  }

  const projectDialog = (
    <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
      <DialogTrigger asChild><Button className="h-11 rounded-xl bg-cyan-300 font-bold text-slate-950 hover:bg-cyan-200"><Plus className="ml-2 h-4 w-4" /> {t("newProject")}</Button></DialogTrigger>
      <DialogContent dir={direction} className="border-white/10 bg-slate-950 text-white sm:max-w-md">
        <form onSubmit={submitProject}><DialogHeader><DialogTitle>{t("createProject")}</DialogTitle><DialogDescription className="text-slate-400">{t("createProjectDescription")}</DialogDescription></DialogHeader><div className="space-y-4 py-5"><div className="space-y-2"><Label htmlFor="project-name">{t("projectName")}</Label><Input id="project-name" value={projectName} onChange={event => setProjectName(event.target.value)} placeholder="Developer Portal" className="border-white/10 bg-white/5 text-white" required /></div><div className="space-y-2"><Label htmlFor="project-key">{t("projectKey")}</Label><Input id="project-key" value={projectKey} onChange={event => setProjectKey(event.target.value.toUpperCase())} placeholder="DEV" className="border-white/10 bg-white/5 font-mono text-white" required /></div></div><DialogFooter><Button type="submit" disabled={createProject.isPending} className="bg-cyan-300 font-bold text-slate-950 hover:bg-cyan-200">{createProject.isPending ? t("creating") : t("createProjectAction")}</Button></DialogFooter></form>
      </DialogContent>
    </Dialog>
  );

  const workItemDialog = (
    <Dialog open={workDialogOpen} onOpenChange={setWorkDialogOpen}>
      <DialogTrigger asChild><Button variant="outline" className="h-11 rounded-xl border-white/12 bg-white/[0.03] text-white hover:bg-white/8 hover:text-white"><ListTodo className="ml-2 h-4 w-4" /> {t("workItem")}</Button></DialogTrigger>
      <DialogContent dir={direction} className="border-white/10 bg-slate-950 text-white sm:max-w-md">
        <form onSubmit={submitWorkItem}><DialogHeader><DialogTitle>{t("addWorkItem")}</DialogTitle><DialogDescription className="text-slate-400">{t("addWorkItemDescription")}</DialogDescription></DialogHeader><div className="space-y-4 py-5"><div className="space-y-2"><Label htmlFor="item-project">{t("project")}</Label><select id="item-project" value={workProjectId} onChange={event => setWorkProjectId(event.target.value)} className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white" required><option value="" className="bg-slate-950">{t("selectProject")}</option>{projects.map(project => <option key={project.id} value={project.id} className="bg-slate-950">{project.name}</option>)}</select></div><div className="space-y-2"><Label htmlFor="item-title">{t("title")}</Label><Input id="item-title" value={workTitle} onChange={event => setWorkTitle(event.target.value)} placeholder="Improve user authentication" className="border-white/10 bg-white/5 text-white" required /></div></div><DialogFooter><Button type="submit" disabled={createWorkItem.isPending || !projects.length || !canSubmitWorkItem(workProjectId, workTitle)} className="bg-cyan-300 font-bold text-slate-950 hover:bg-cyan-200">{createWorkItem.isPending ? t("adding") : t("addToBacklog")}</Button></DialogFooter></form>
      </DialogContent>
    </Dialog>
  );

  return (
    <DashboardLayout>
      <section className="space-y-7" dir={direction}>
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end"><div><h1 className="text-3xl font-bold tracking-tight text-white">{location === "/workspace" ? t("workspaceRhythm") : localizedDescription[location].split(language === "ar" ? "،" : ".")[0]}</h1><p className="mt-2 max-w-2xl leading-7 text-slate-400">{localizedDescription[location] || localizedDescription["/workspace"]}</p></div><div className="flex flex-wrap gap-3"><Button variant="outline" onClick={openBuildPlan} className="h-11 rounded-xl border-violet-300/25 bg-violet-300/8 text-violet-100 hover:bg-violet-300/15 hover:text-white"><Rocket className="ml-2 h-4 w-4" /> {resumablePlan ? t("continuePlan") : t("beginPlan")}</Button>{workItemDialog}{projectDialog}</div></div>

        <div className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-3 md:flex-row md:items-center"><div className="relative flex-1"><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder={t("workspaceSearch")} className="h-11 border-0 bg-transparent pr-10 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-cyan-300" /></div><div className="hidden h-6 w-px bg-white/10 md:block" /><span className="px-2 text-xs text-slate-500">{projects.length} {t("projectCount")} · {workItems.length} {t("workItemCount")}</span></div>

        {location === "/projects" && <ProjectsView projects={filteredProjects} isLoading={isLoading} />}
        {location === "/work-items" && <WorkItemsBoard items={filteredItems} isLoading={isLoading} />}
        {location === "/pull-requests" && <PullRequestsView pullRequests={filteredPrs} isLoading={isLoading} />}
        {location === "/releases" && <ReleasesView releases={releases} deployments={deployments} isLoading={isLoading} />}
        {location === "/workspace" && <Overview projects={filteredProjects} workItems={filteredItems} pullRequests={filteredPrs} releases={releases} activity={activity} health={health} isLoading={isLoading} />}
      </section>
    </DashboardLayout>
  );
}

function Overview({ projects, workItems, pullRequests, releases, activity, health, isLoading }: { projects: any[]; workItems: any[]; pullRequests: any[]; releases: any[]; activity: any[]; health: ReturnType<typeof calculateProjectHealth>; isLoading: boolean }) {
  return <><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[{ label: "المشاريع النشطة", value: projects.length, icon: CircleDotDashed, color: "text-cyan-300" }, { label: "عناصر قيد التنفيذ", value: workItems.filter(item => item.status === "in-progress").length, icon: Activity, color: "text-violet-300" }, { label: "طلبات السحب المفتوحة", value: pullRequests.filter(pr => pr.status === "open").length, icon: GitPullRequest, color: "text-amber-300" }, { label: "إصدارات الإنتاج", value: releases.filter(release => release.environment === "production").length, icon: Rocket, color: "text-emerald-300" }].map(metric => <article key={metric.label} className="rounded-2xl border border-white/8 bg-white/[0.035] p-5"><metric.icon className={`h-5 w-5 ${metric.color}`} /><p className="mt-8 text-3xl font-bold text-white">{isLoading ? "—" : metric.value}</p><p className="mt-1 text-sm text-slate-500">{metric.label}</p></article>)}</div><div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]"><article className="rounded-3xl border border-white/8 bg-slate-950/45 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-bold text-white">صحة التسليم</p><p className="mt-1 text-sm text-slate-500">إشارة تجمع الفحوصات والمراجعات والعمل المنتظر.</p></div><Badge className="border-0 bg-emerald-400/12 text-emerald-300">{projectHealthCopy[health].label}</Badge></div><div className="mt-6 grid gap-3">{projects.length ? projects.slice(0, 4).map(project => <div key={project.id} className="flex items-center justify-between rounded-2xl bg-white/[0.035] px-4 py-4"><div><p className="font-semibold text-white">{project.name}</p><p className="mt-1 font-mono text-xs text-slate-500">{project.key} · {project.defaultBranch}</p></div><span className="text-xs text-cyan-200">عرض السياق <ArrowUpLeft className="mr-1 inline h-3 w-3" /></span></div>) : <EmptyState icon={ShieldCheck} title="ابدأ بمشروعك الأول" copy="ستظهر مؤشرات التسليم والمراجعات هنا فور إضافة مشروع." />}</div></article><article className="rounded-3xl border border-white/8 bg-white/[0.025] p-6"><p className="text-sm font-bold text-white">أحدث النشاطات</p><div className="mt-5 space-y-4">{activity.length ? activity.slice(0, 5).map(event => <div key={event.id} className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-cyan-300" /><div><p className="text-sm text-slate-200">{event.summary}</p><p className="mt-1 text-xs text-slate-600">{new Date(event.createdAt).toLocaleString("ar")}</p></div></div>) : <p className="rounded-2xl border border-dashed border-white/10 p-5 text-sm leading-7 text-slate-500">سيظهر هنا سجل الإصدارات والمراجعات وعناصر العمل عند بدء تنفيذ الفريق.</p>}</div></article></div></>;
}

function ProjectsView({ projects, isLoading }: { projects: any[]; isLoading: boolean }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{isLoading ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-56 animate-pulse rounded-3xl bg-white/5" />) : projects.length ? projects.map(project => <article key={project.id} className="rounded-3xl border border-white/8 bg-white/[0.03] p-6"><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300/10 font-mono text-sm font-bold text-cyan-200">{project.key.slice(0, 3)}</span><Badge className="border-0 bg-emerald-400/10 text-emerald-300">{projectHealthCopy[project.health as keyof typeof projectHealthCopy].label}</Badge></div><h2 className="mt-8 text-xl font-bold text-white">{project.name}</h2><p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-slate-500">{project.description || "لا يوجد وصف بعد. أضف سياقًا يوضح مسؤولية المشروع وهدفه."}</p><div className="mt-6 flex items-center justify-between border-t border-white/8 pt-4 text-xs text-slate-500"><span className="flex items-center gap-1"><Code2 className="h-3.5 w-3.5" /> {project.defaultBranch}</span><span className="flex items-center gap-1"><UsersRound className="h-3.5 w-3.5" /> فريق المالك</span></div></article>) : <EmptyState icon={CircleDotDashed} title="لا توجد مشاريع مطابقة" copy="أنشئ مشروعًا أو غيّر عبارة البحث لعرض مساحة العمل." />}</div>;
}

function WorkItemsBoard({ items, isLoading }: { items: any[]; isLoading: boolean }) {
  return <div className="grid gap-4 xl:grid-cols-4">{columns.map(column => <section key={column.key} className={`min-h-80 rounded-3xl border-t-2 ${column.className} bg-white/[0.025] p-4`}><div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-white">{column.label}</h2><span className="rounded-full bg-white/7 px-2 py-0.5 text-xs text-slate-500">{items.filter(item => item.status === column.key).length}</span></div><div className="space-y-3">{isLoading ? <div className="h-28 animate-pulse rounded-2xl bg-white/5" /> : items.filter(item => item.status === column.key).length ? items.filter(item => item.status === column.key).map(item => <article key={item.id} className="rounded-2xl border border-white/8 bg-slate-950/60 p-4"><p className="font-mono text-xs text-cyan-300">{item.key}</p><h3 className="mt-3 text-sm font-bold leading-6 text-white">{item.title}</h3><div className="mt-4 flex items-center justify-between"><span className="text-xs text-slate-500">{priorityLabel[item.priority as keyof typeof priorityLabel]}</span><span className="grid h-6 w-6 place-items-center rounded-full bg-violet-300/10 text-[10px] font-bold text-violet-200">DF</span></div></article>) : <p className="rounded-2xl border border-dashed border-white/10 p-4 text-xs leading-6 text-slate-600">لا توجد عناصر في هذه المرحلة.</p>}</div></section>)}</div>;
}

function PullRequestsView({ pullRequests, isLoading }: { pullRequests: any[]; isLoading: boolean }) {
  return <section className="overflow-hidden rounded-3xl border border-white/8 bg-white/[0.025]"><div className="grid grid-cols-[1.3fr_0.4fr_0.45fr_0.45fr] gap-4 border-b border-white/8 px-5 py-4 text-xs font-bold text-slate-500"><span>طلب السحب</span><span>الحالة</span><span>المراجعون</span><span>الفحوصات</span></div>{isLoading ? <div className="h-40 animate-pulse bg-white/[0.02]" /> : pullRequests.length ? pullRequests.map(pr => <div key={pr.id} className="grid grid-cols-[1.3fr_0.4fr_0.45fr_0.45fr] gap-4 border-b border-white/6 px-5 py-5 text-sm last:border-0"><div><p className="font-mono text-xs text-violet-300">PR #{pr.number}</p><p className="mt-2 font-semibold text-white">{pr.title}</p></div><Badge className="h-fit w-fit border-0 bg-cyan-300/10 text-cyan-200">{pr.status}</Badge><span className="text-slate-400">{pr.reviewerCount} مراجع</span><span className="flex items-center gap-1 text-emerald-300"><CheckCircle2 className="h-4 w-4" /> {pr.checksPassed ? "مكتملة" : "قيد التشغيل"}</span></div>) : <EmptyState icon={GitPullRequest} title="لا توجد طلبات سحب مطابقة" copy="عند ربط تدفق المراجعة، ستظهر هنا تفاصيل الفحوصات وحالة الدمج." />}</section>;
}

function ReleasesView({ releases, deployments, isLoading }: { releases: any[]; deployments: any[]; isLoading: boolean }) {
  const entries = [...releases.map(release => ({ kind: "release", value: release, createdAt: release.createdAt })), ...deployments.map(deployment => ({ kind: "deployment", value: deployment, createdAt: deployment.createdAt }))].sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)));
  return <section className="rounded-3xl border border-white/8 bg-white/[0.025] p-6"><div className="mb-7 flex items-center justify-between"><div><h2 className="font-bold text-white">الجدول الزمني للإصدار</h2><p className="mt-1 text-sm text-slate-500">تسلسل واضح من الإصدار إلى النشر عبر البيئات.</p></div><Rocket className="h-5 w-5 text-cyan-300" /></div>{isLoading ? <div className="h-44 animate-pulse rounded-2xl bg-white/5" /> : entries.length ? <div className="space-y-5">{entries.map((entry, index) => <div key={`${entry.kind}-${entry.value.id}`} className="relative flex gap-4 pr-2"><div className="flex flex-col items-center"><span className={`grid h-9 w-9 place-items-center rounded-full ${entry.kind === "deployment" ? "bg-cyan-300/15 text-cyan-200" : "bg-violet-300/15 text-violet-200"}`}>{entry.kind === "deployment" ? <Send className="h-4 w-4" /> : <Rocket className="h-4 w-4" />}</span>{index < entries.length - 1 && <span className="mt-2 h-8 w-px bg-white/10" />}</div><div className="pb-3"><p className="font-semibold text-white">{entry.kind === "deployment" ? `نشر إلى ${entry.value.environment}` : `إصدار ${entry.value.version}`}</p><p className="mt-1 text-sm text-slate-500">الحالة: {entry.value.status} · {new Date(entry.createdAt).toLocaleString("ar")}</p></div></div>)}</div> : <EmptyState icon={Rocket} title="لا توجد إصدارات حتى الآن" copy="ستظهر هنا جميع الترقيات والنشرات والبيئات فور بدء إطلاق المنتج." />}</section>;
}

function EmptyState({ icon: Icon, title, copy }: { icon: any; title: string; copy: string }) {
  return <div className="col-span-full grid min-h-52 place-items-center rounded-3xl border border-dashed border-white/10 p-8 text-center"><div><Icon className="mx-auto h-7 w-7 text-cyan-300" /><h3 className="mt-4 font-bold text-white">{title}</h3><p className="mt-2 max-w-sm text-sm leading-7 text-slate-500">{copy}</p></div></div>;
}
