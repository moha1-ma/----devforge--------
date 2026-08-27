import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle2, FileDown, FileUp, Github, GitMerge, GitPullRequest, LockKeyhole, ShieldAlert } from "lucide-react";
import React, { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

const githubCopy = {
  ar: { selectionBoundary: "اختيار المستودع يحفظ مرجعًا للمراجعة في DevForge فقط. لا يجري نسخًا أو استيرادًا أو كتابة أو دمجًا في GitHub تلقائيًا.", loadingProjects: "يجري تحميل المشاريع…", noProjects: "أنشئ مشروع DevForge أولًا ثم اختر المستودع الذي تريد مراجعته.", savingReference: "يجري حفظ المرجع…", loadingReference: "يجري قراءة مرجع المستودع المحفوظ لهذه المساحة…", referenceError: "تعذر قراءة مرجع المستودع الآن. لم تُجرَ أي عملية على GitHub.", retryReference: "إعادة تحميل المرجع", mergeTitle: "خطة دمج موحّدة للمراجعة", mergeCopy: "أدخل المستودعات العامة التي تختارها فقط. تتحقق الأداة من بياناتها العلنية ثم تنشئ ترتيب مراجعة وضوابط دمج؛ لا تستنسخ أي مستودع ولا تكتب إلى GitHub ولا تدمج شفرة تلقائيًا.", toolLabel: "اسم الأداة الموحدة", defaultToolName: "أداة DevForge الموحدة", briefLabel: "هدف الدمج", briefPlaceholder: "مثال: مراجعة وحدات واجهة قابلة لإعادة الاستخدام", repositoriesLabel: "المستودعات المختارة", repositoriesCopy: "حتى 12 مستودعًا عامًا؛ افصل بينها بسطر جديد أو فاصلة. تُرفض التكرارات أو المصادر غير المتاحة.", createPlan: "إنشاء خطة المراجعة", reviewOnly: "مراجعة فقط", noBrief: "لا يوجد وصف إضافي.", unknownLanguage: "غير محددة", unknownLicense: "ترخيص غير محدد", sourceOrder: "ترتيب المراجعة", safeguards: "الضوابط", checklist: "قائمة الاعتماد" },
  en: { selectionBoundary: "Repository selection saves a review reference in DevForge only. It does not clone, import, write, or merge in GitHub automatically.", loadingProjects: "Loading projects…", noProjects: "Create a DevForge project first, then choose the repository you want to review.", savingReference: "Saving reference…", loadingReference: "Reading the saved repository reference for this workspace…", referenceError: "The repository reference cannot be read right now. No GitHub operation was performed.", retryReference: "Reload reference", mergeTitle: "Unified merge plan for review", mergeCopy: "Enter only public repositories you choose. The tool checks their public metadata and then creates a review sequence and merge safeguards; it does not clone a repository, write to GitHub, or merge code automatically.", toolLabel: "Unified tool name", defaultToolName: "Unified DevForge tool", briefLabel: "Merge objective", briefPlaceholder: "Example: review reusable interface modules", repositoriesLabel: "Selected repositories", repositoriesCopy: "Up to 12 public repositories; separate them with a new line or comma. Duplicates and unavailable sources are rejected.", createPlan: "Create review plan", reviewOnly: "Review only", noBrief: "No additional brief.", unknownLanguage: "Unspecified", unknownLicense: "Unspecified license", sourceOrder: "Review order", safeguards: "Safeguards", checklist: "Approval checklist" },
} as const;

export default function GithubWorkspace() {
  const { direction, language, t } = useLanguage();
  const copy = githubCopy[language === "en" ? "en" : "ar"];
  const utils = trpc.useUtils();
  const { data: projects = [], isLoading: projectsLoading } = trpc.projects.list.useQuery();
  const [projectId, setProjectId] = useState<number | null>(null);
  const [repositoryFullName, setRepositoryFullName] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [toolName, setToolName] = useState<string>(() => copy.defaultToolName);
  const [mergeRepositories, setMergeRepositories] = useState("");
  const [mergeBrief, setMergeBrief] = useState("");

  useEffect(() => { if (!projectId && projects[0]) setProjectId(projects[0].id); }, [projectId, projects]);
  const link = trpc.githubWorkspace.getLink.useQuery({ projectId: projectId ?? 0 }, { enabled: Boolean(projectId) });
  useEffect(() => { if (link.data) { setRepositoryFullName(link.data.repositoryFullName); setDefaultBranch(link.data.defaultBranch); } }, [link.data]);

  const selectRepository = trpc.githubWorkspace.selectRepository.useMutation({
    onSuccess: async () => { await utils.githubWorkspace.getLink.invalidate(); toast.success(t("selectionSaved")); },
    onError: error => toast.error(error.message),
  });
  const mergePlan = trpc.githubMerge.prepare.useMutation({ onError: error => toast.error(error.message) });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectId) return toast.error(t("chooseProjectFirst"));
    selectRepository.mutate({ projectId, repositoryFullName, defaultBranch });
  }
  function buildMergePlan(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const repositories = mergeRepositories.split(/[\n,]/).map(item => item.trim()).filter(Boolean); mergePlan.mutate({ toolName, repositories, brief: mergeBrief.trim() || undefined }); }

  return (
    <DashboardLayout>
      <section dir={direction} className="space-y-6">
        <div className="rounded-3xl border border-white/8 bg-gradient-to-l from-slate-900 to-slate-950 p-5 sm:p-7">
          <Badge className="border border-white/15 bg-white/[0.07] text-white"><Github className="ml-1 h-3.5 w-3.5" /> {t("optionalGithub")}</Badge>
          <h1 className="mt-4 text-3xl font-bold text-white">{t("githubHero")}</h1>
          <p className="mt-3 max-w-3xl leading-8 text-slate-300">{t("githubHeroCopy")}</p>
          <p role="status" className="mt-4 rounded-xl border border-cyan-300/15 bg-cyan-300/5 px-3 py-2 text-xs leading-6 text-cyan-100/85">{copy.selectionBoundary}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[{ icon: FileUp, title: t("reviewedExport"), copy: t("reviewedExportCopy") }, { icon: FileDown, title: t("limitedImport"), copy: t("limitedImportCopy") }, { icon: GitPullRequest, title: t("engineeringContext"), copy: t("engineeringContextCopy") }].map(item => <article key={item.title} className="rounded-3xl border border-white/8 bg-white/[0.025] p-6"><item.icon className="h-6 w-6 text-cyan-300" /><h2 className="mt-8 font-bold text-white">{item.title}</h2><p className="mt-3 text-sm leading-7 text-slate-500">{item.copy}</p></article>)}
        </div>

        <section className="rounded-3xl border border-white/8 bg-white/[0.025] p-5 sm:p-6">
          <div className="flex items-center gap-3"><Github className="h-5 w-5 text-cyan-300" /><div><h2 className="font-bold text-white">{t("selectProjectRepository")}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{t("selectRepositoryCopy")}</p></div></div>
          <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-[0.8fr_1.2fr_0.55fr_auto] md:items-end">
            <div className="space-y-2"><Label htmlFor="github-project">{t("project")}</Label><select id="github-project" value={projectId ?? ""} onChange={event => setProjectId(event.target.value ? Number(event.target.value) : null)} disabled={projectsLoading || !projects.length} className="h-11 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"><option value="">{projectsLoading ? copy.loadingProjects : t("selectProject")}</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select>{!projectsLoading && !projects.length ? <p className="text-xs leading-5 text-amber-200">{copy.noProjects}</p> : null}</div>
            <div className="space-y-2"><Label htmlFor="github-repository">{t("repository")}</Label><Input id="github-repository" value={repositoryFullName} onChange={event => setRepositoryFullName(event.target.value)} placeholder="owner/repository or https://github.com/owner/repository" autoCapitalize="none" autoCorrect="off" className="h-11 border-white/10 bg-white/5 font-mono text-white" required /><p className="text-xs leading-5 text-slate-500">{t("githubUrlNormalized")} <span className="font-mono">owner/repository</span>.</p></div>
            <div className="space-y-2"><Label htmlFor="github-branch">{t("branchName")}</Label><Input id="github-branch" value={defaultBranch} onChange={event => setDefaultBranch(event.target.value)} autoCapitalize="none" autoCorrect="off" className="h-11 border-white/10 bg-white/5 font-mono text-white" required /></div>
            <Button type="submit" disabled={!projectId || !repositoryFullName.trim() || !defaultBranch.trim() || selectRepository.isPending} className="h-11 bg-cyan-300 font-bold text-slate-950 hover:bg-cyan-200">{selectRepository.isPending ? copy.savingReference : t("saveSelection")}</Button>
          </form>
          {projectId && link.isLoading ? <p role="status" className="mt-4 rounded-xl border border-white/8 bg-white/[0.025] p-3 text-sm text-slate-400">{copy.loadingReference}</p> : null}
          {projectId && link.isError ? <section role="alert" className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/5 p-3 text-sm leading-7 text-rose-100"><p>{copy.referenceError}</p><Button type="button" size="sm" variant="outline" className="mt-3 border-rose-300/25 text-rose-100 hover:bg-rose-300/10 hover:text-rose-50" onClick={() => void link.refetch()}>{copy.retryReference}</Button></section> : null}
          {link.data && <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-4 text-sm text-cyan-100"><CheckCircle2 className="ml-2 inline h-4 w-4" /> {t("savedRepository")}: <span className="font-mono">{link.data.repositoryFullName}</span> · {t("branchName")} <span className="font-mono">{link.data.defaultBranch}</span> · {t("status")}: {t("pendingGithubAuth")}</div>}
        </section>

        <section className="rounded-3xl border border-amber-300/15 bg-amber-300/5 p-6"><div className="flex gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" /><div><h2 className="font-bold text-amber-100">{t("githubNotConnected")}</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-amber-100/70">{t("githubNotConnectedCopy")}</p></div></div><Button disabled className="mt-5 bg-white/10 text-slate-500"><LockKeyhole className="ml-2 h-4 w-4" /> {t("waitGithubAuth")}</Button></section>
        <section className="rounded-3xl border border-violet-300/15 bg-violet-300/[0.035] p-5 sm:p-6"><div className="flex gap-3"><GitMerge className="mt-0.5 h-5 w-5 shrink-0 text-violet-200" /><div><h2 className="font-bold text-white">{copy.mergeTitle}</h2><p className="mt-1 max-w-3xl text-sm leading-7 text-slate-400">{copy.mergeCopy}</p></div></div><form onSubmit={buildMergePlan} className="mt-6 grid gap-4"><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="merge-tool-name">{copy.toolLabel}</Label><Input id="merge-tool-name" value={toolName} onChange={event => setToolName(event.target.value)} maxLength={120} required className="border-white/10 bg-slate-950/60 text-white" /></div><div className="space-y-2"><Label htmlFor="merge-brief">{copy.briefLabel}</Label><Input id="merge-brief" value={mergeBrief} onChange={event => setMergeBrief(event.target.value)} maxLength={2000} placeholder={copy.briefPlaceholder} className="border-white/10 bg-slate-950/60 text-white" /></div></div><div className="space-y-2"><Label htmlFor="merge-repositories">{copy.repositoriesLabel}</Label><textarea id="merge-repositories" value={mergeRepositories} onChange={event => setMergeRepositories(event.target.value)} placeholder={"owner/repository-one\nowner/repository-two"} dir="ltr" className="min-h-28 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 font-mono text-sm text-white outline-none" required /><p className="text-xs text-slate-500">{copy.repositoriesCopy}</p></div><div><Button type="submit" disabled={mergePlan.isPending} className="bg-violet-300 text-slate-950 hover:bg-violet-200"><GitMerge className="ml-1 h-4 w-4" />{copy.createPlan}</Button></div></form>{mergePlan.data && <article className="mt-6 rounded-2xl border border-violet-300/15 bg-slate-950/50 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold text-white">{mergePlan.data.toolName}</h3><Badge className="border border-violet-300/20 bg-violet-300/10 text-violet-100">{copy.reviewOnly}</Badge></div><p className="mt-2 text-sm text-slate-400">{mergePlan.data.brief || copy.noBrief}</p><div className="mt-4 grid gap-2 md:grid-cols-2">{mergePlan.data.repositories.map(repo => <a key={repo.fullName} href={repo.url} target="_blank" rel="noreferrer" className="rounded-xl border border-white/8 bg-white/[0.025] p-3 text-sm text-cyan-100 hover:bg-white/[0.05]"><span className="font-mono">{repo.fullName}</span><span className="mt-1 block text-xs text-slate-500">{repo.defaultBranch} · {repo.language ?? copy.unknownLanguage} · {repo.license ?? copy.unknownLicense}</span></a>)}</div><p className="mt-3 text-xs leading-6 text-violet-100/80">{mergePlan.data.sourceDisclosure}</p><MergeList title={copy.sourceOrder} items={mergePlan.data.mergeOrder} /><MergeList title={copy.safeguards} items={mergePlan.data.safeguards} /><MergeList title={copy.checklist} items={mergePlan.data.reviewChecklist} /></article>}</section>
      </section>
    </DashboardLayout>
  );
}
function MergeList({ title, items }: { title: string; items: string[] }) { return <div className="mt-5"><h4 className="text-xs font-bold text-slate-500">{title}</h4><ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">{items.map(item => <li key={item} className="rounded-xl bg-white/[0.03] p-3">{item}</li>)}</ul></div>; }
