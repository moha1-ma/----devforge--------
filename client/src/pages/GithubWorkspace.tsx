import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle2, FileDown, FileUp, Github, GitPullRequest, LockKeyhole, ShieldAlert } from "lucide-react";
import React, { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

export default function GithubWorkspace() {
  const { direction, t } = useLanguage();
  const utils = trpc.useUtils();
  const { data: projects = [] } = trpc.projects.list.useQuery();
  const [projectId, setProjectId] = useState<number | null>(null);
  const [repositoryFullName, setRepositoryFullName] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");

  useEffect(() => { if (!projectId && projects[0]) setProjectId(projects[0].id); }, [projectId, projects]);
  const link = trpc.githubWorkspace.getLink.useQuery({ projectId: projectId ?? 0 }, { enabled: Boolean(projectId) });
  useEffect(() => { if (link.data) { setRepositoryFullName(link.data.repositoryFullName); setDefaultBranch(link.data.defaultBranch); } }, [link.data]);

  const selectRepository = trpc.githubWorkspace.selectRepository.useMutation({
    onSuccess: async () => { await utils.githubWorkspace.getLink.invalidate(); toast.success(t("selectionSaved")); },
    onError: error => toast.error(error.message),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectId) return toast.error(t("chooseProjectFirst"));
    selectRepository.mutate({ projectId, repositoryFullName, defaultBranch });
  }

  return (
    <DashboardLayout>
      <section dir={direction} className="space-y-6">
        <div className="rounded-3xl border border-white/8 bg-gradient-to-l from-slate-900 to-slate-950 p-7">
          <Badge className="border border-white/15 bg-white/[0.07] text-white"><Github className="ml-1 h-3.5 w-3.5" /> {t("optionalGithub")}</Badge>
          <h1 className="mt-4 text-3xl font-bold text-white">{t("githubHero")}</h1>
          <p className="mt-3 max-w-3xl leading-8 text-slate-300">{t("githubHeroCopy")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[{ icon: FileUp, title: t("reviewedExport"), copy: t("reviewedExportCopy") }, { icon: FileDown, title: t("limitedImport"), copy: t("limitedImportCopy") }, { icon: GitPullRequest, title: t("engineeringContext"), copy: t("engineeringContextCopy") }].map(item => <article key={item.title} className="rounded-3xl border border-white/8 bg-white/[0.025] p-6"><item.icon className="h-6 w-6 text-cyan-300" /><h2 className="mt-8 font-bold text-white">{item.title}</h2><p className="mt-3 text-sm leading-7 text-slate-500">{item.copy}</p></article>)}
        </div>

        <section className="rounded-3xl border border-white/8 bg-white/[0.025] p-5 sm:p-6">
          <div className="flex items-center gap-3"><Github className="h-5 w-5 text-cyan-300" /><div><h2 className="font-bold text-white">{t("selectProjectRepository")}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{t("selectRepositoryCopy")}</p></div></div>
          <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-[0.8fr_1.2fr_0.55fr_auto] md:items-end">
            <div className="space-y-2"><Label htmlFor="github-project">{t("project")}</Label><select id="github-project" value={projectId ?? ""} onChange={event => setProjectId(Number(event.target.value))} className="h-11 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white"><option value="">{t("selectProject")}</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="github-repository">{t("repository")}</Label><Input id="github-repository" value={repositoryFullName} onChange={event => setRepositoryFullName(event.target.value)} placeholder="owner/repository or https://github.com/owner/repository" autoCapitalize="none" autoCorrect="off" className="h-11 border-white/10 bg-white/5 font-mono text-white" required /><p className="text-xs leading-5 text-slate-500">{t("githubUrlNormalized")} <span className="font-mono">owner/repository</span>.</p></div>
            <div className="space-y-2"><Label htmlFor="github-branch">{t("branchName")}</Label><Input id="github-branch" value={defaultBranch} onChange={event => setDefaultBranch(event.target.value)} autoCapitalize="none" autoCorrect="off" className="h-11 border-white/10 bg-white/5 font-mono text-white" required /></div>
            <Button type="submit" disabled={!projectId || selectRepository.isPending} className="h-11 bg-cyan-300 font-bold text-slate-950 hover:bg-cyan-200">{t("saveSelection")}</Button>
          </form>
          {link.data && <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-4 text-sm text-cyan-100"><CheckCircle2 className="ml-2 inline h-4 w-4" /> {t("savedRepository")}: <span className="font-mono">{link.data.repositoryFullName}</span> · {t("branchName")} <span className="font-mono">{link.data.defaultBranch}</span> · {t("status")}: {t("pendingGithubAuth")}</div>}
        </section>

        <section className="rounded-3xl border border-amber-300/15 bg-amber-300/5 p-6"><div className="flex gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" /><div><h2 className="font-bold text-amber-100">{t("githubNotConnected")}</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-amber-100/70">{t("githubNotConnectedCopy")}</p></div></div><Button disabled className="mt-5 bg-white/10 text-slate-500"><LockKeyhole className="ml-2 h-4 w-4" /> {t("waitGithubAuth")}</Button></section>
      </section>
    </DashboardLayout>
  );
}
