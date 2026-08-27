import DashboardLayout from "@/components/DashboardLayout";
import { AIChatBox } from "@/components/AIChatBox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Bot, CircleAlert, Github, LockKeyhole, MessageSquarePlus, SearchCheck, ShieldCheck, Sparkles } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function AiWorkspace() {
  const { direction, t } = useLanguage();
  const utils = trpc.useUtils();
  const { data: threads = [] } = trpc.aiWorkspace.listThreads.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery();
  const [threadId, setThreadId] = useState<number | null>(null);
  const [title, setTitle] = useState("مناقشة تقنية جديدة");
  const [open, setOpen] = useState(false);
  const [assistantError, setAssistantError] = useState("");
  const [githubProjectId, setGithubProjectId] = useState<number | null>(null);
  const [useGithubContext, setUseGithubContext] = useState(false);
  const [researchMode, setResearchMode] = useState<"off" | "trusted-web">("off");
  const [researchResult, setResearchResult] = useState<{ disclosure: string; sources: string[] } | null>(null);
  const [lastResearchRequest, setLastResearchRequest] = useState<{ threadId: number; content: string; githubProjectId?: number; researchMode: "trusted-web" } | null>(null);
  const githubLink = trpc.githubWorkspace.getLink.useQuery({ projectId: githubProjectId ?? 0 }, { enabled: Boolean(githubProjectId) });

  useEffect(() => { if (!threadId && threads[0]) setThreadId(threads[0].id); }, [threadId, threads]);
  const messages = trpc.aiWorkspace.messages.useQuery({ threadId: threadId ?? 0 }, { enabled: Boolean(threadId) });
  const createThread = trpc.aiWorkspace.createThread.useMutation({
    onSuccess: async thread => { await utils.aiWorkspace.listThreads.invalidate(); setThreadId(thread.id); setOpen(false); toast.success(t("newPrivateChat")); },
    onError: error => toast.error(error.message),
  });
  const askAssistant = trpc.aiWorkspace.ask.useMutation({
    onSuccess: async result => { await Promise.all([utils.aiWorkspace.messages.invalidate(), utils.aiWorkspace.listThreads.invalidate()]); setAssistantError(""); setResearchResult(result.research.requested ? { disclosure: result.research.disclosure, sources: result.research.sources } : null); },
    onError: error => { setAssistantError(error.message); toast.error(error.message); },
  });
  const selectedGithubLink = useGithubContext ? githubLink.data : null;

  return (
    <DashboardLayout>
      <section dir={direction} className="space-y-5 sm:space-y-6">
        <div className="rounded-3xl border border-violet-300/15 bg-gradient-to-l from-violet-400/12 to-cyan-300/8 p-5 sm:p-7">
          <Badge className="border border-violet-300/20 bg-violet-300/10 text-violet-100"><LockKeyhole className="ml-1 h-3.5 w-3.5" /> {t("privateOwnerChat")}</Badge>
          <h1 className="mt-4 text-2xl font-bold text-white sm:text-3xl">{t("aiTitle")}</h1>
          <p className="mt-3 max-w-3xl leading-8 text-slate-300">{t("aiIntro")}</p>
        </div>

        <div className="grid min-h-[520px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-white/8 bg-white/[0.025] p-4">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="w-full bg-violet-300 text-slate-950 hover:bg-violet-200"><MessageSquarePlus className="ml-2 h-4 w-4" /> {t("newChat")}</Button></DialogTrigger>
              <DialogContent dir={direction} className="border-white/10 bg-slate-950 text-white">
                <form onSubmit={event => { event.preventDefault(); createThread.mutate({ title }); }}>
                  <DialogHeader><DialogTitle>{t("newPrivateChat")}</DialogTitle><DialogDescription className="text-slate-400">{t("newChatDescription")}</DialogDescription></DialogHeader>
                  <Input value={title} onChange={event => setTitle(event.target.value)} className="my-5 border-white/10 bg-white/5 text-white" />
                  <DialogFooter><Button type="submit" className="bg-violet-300 text-slate-950 hover:bg-violet-200">{t("create")}</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <div className="mt-4 space-y-2">
              {threads.length ? threads.map(thread => <button key={thread.id} onClick={() => setThreadId(thread.id)} className={`w-full rounded-xl p-3 text-right ${threadId === thread.id ? "bg-violet-300/12 text-violet-100" : "text-slate-400 hover:bg-white/6"}`}><p className="truncate text-sm font-semibold">{thread.title}</p><p className="mt-1 text-[11px] text-slate-600">{thread.provider === "managed" ? t("managedAssistant") : t("previousRecord")}</p></button>) : <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm leading-7 text-slate-600">{t("threadEmpty")}</p>}
            </div>
          </aside>

          <article className="min-w-0 rounded-3xl border border-white/8 bg-slate-950/50 p-4 sm:p-6">
            {threadId ? <>
              <div className="flex items-center gap-3"><Bot className="h-6 w-6 text-violet-300" /><div><h2 className="font-bold text-white">{t("ownerChat")}</h2><p className="mt-1 text-sm text-slate-500">{t("aiNoExternal")}</p></div></div>

              <section className="mt-5 rounded-2xl border border-white/8 bg-white/[0.025] p-4" aria-label={t("githubContext")}>
                <div className="flex items-start gap-3"><Github className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" /><div className="min-w-0 flex-1"><h3 className="font-bold text-white">{t("githubContext")}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{t("githubContextCopy")}</p></div></div>
                <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"><div className="space-y-2"><Label htmlFor="ai-github-project" className="text-slate-300">{t("githubProject")}</Label><select id="ai-github-project" value={githubProjectId ?? ""} onChange={event => { setGithubProjectId(event.target.value ? Number(event.target.value) : null); setUseGithubContext(false); }} className="h-10 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white"><option value="">{t("noGithubContext")}</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>{githubProjectId && githubLink.data ? <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/5 px-3 text-sm text-cyan-100"><input type="checkbox" checked={useGithubContext} onChange={event => setUseGithubContext(event.target.checked)} className="accent-cyan-300" /> {t("useForMessage")}</label> : null}</div>
                {githubProjectId && githubLink.data ? <p className="mt-3 text-xs text-cyan-100">{t("selectedRepository")}: <span className="font-mono">{githubLink.data.repositoryFullName}</span> · {t("branch")} <span className="font-mono">{githubLink.data.defaultBranch}</span></p> : null}
                {githubProjectId && !githubLink.isLoading && !githubLink.data ? <p className="mt-3 text-xs leading-6 text-amber-200">{t("missingGithubLink")} <Link href="/github" className="font-bold text-cyan-200 underline">{t("openGithub")}</Link></p> : null}
              </section>

              <section className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-300/5 p-4" aria-label={t("trustedResearch")}>
                <div className="flex items-start gap-3"><SearchCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" /><div className="min-w-0 flex-1"><h3 className="font-bold text-emerald-100">{t("trustedResearch")}</h3><p className="mt-1 text-sm leading-6 text-emerald-100/70">{t("trustedResearchCopy")}</p></div></div>
                <label className="mt-4 flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-300/20 bg-slate-950/20 p-3 text-sm text-emerald-100"><input type="checkbox" checked={researchMode === "trusted-web"} onChange={event => setResearchMode(event.target.checked ? "trusted-web" : "off")} className="accent-emerald-300" /> {t("requestResearch")}</label>
                <p className="mt-3 text-xs leading-6 text-slate-400">{researchMode === "trusted-web" ? "يُنفّذ البحث لهذه الرسالة فقط ويعرض روابط المصادر التي أعادها. إذا لم تظهر روابط، لا تُعامل النتيجة كبحث موثق." : t("researchOff")}</p>
              </section>

              <section className="mt-4 flex gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" /><div><h3 className="font-bold text-white">{t("qualityAnswer")}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{t("qualityAnswerCopy")}</p></div></section>

              {assistantError && <section role="alert" className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/5 p-3 text-sm text-rose-100"><p>{assistantError}</p>{lastResearchRequest ? <Button type="button" variant="outline" size="sm" className="mt-3 w-full border-rose-300/25 text-rose-100 hover:bg-rose-300/10 hover:text-rose-50 sm:w-auto" disabled={askAssistant.isPending} onClick={() => { setAssistantError(""); askAssistant.mutate(lastResearchRequest); }}>إعادة محاولة البحث الموثق</Button> : null}</section>}
              {researchResult && <section className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.035] p-4" aria-label="مصادر البحث"><h3 className="font-bold text-emerald-100">حالة مصادر البحث</h3><p className="mt-1 text-sm leading-6 text-emerald-100/75">{researchResult.disclosure}</p>{researchResult.sources.length ? <div className="mt-3 flex flex-wrap gap-2">{researchResult.sources.map(source => <a key={source} href={source} target="_blank" rel="noreferrer" className="max-w-full truncate rounded-lg border border-emerald-300/20 px-3 py-1.5 text-xs text-emerald-100 hover:bg-emerald-300/10">{source}</a>)}</div> : null}</section>}
              {selectedGithubLink ? <p className="mt-4 rounded-xl border border-cyan-300/15 bg-cyan-300/5 p-3 text-xs leading-6 text-cyan-100">{t("githubAttached")}: <span className="font-mono">{selectedGithubLink.repositoryFullName}@{selectedGithubLink.defaultBranch}</span>. {t("noFetchGithub")}</p> : null}
              <AIChatBox messages={(messages.data ?? []).map(message => ({ role: message.role, content: message.content }))} onSendMessage={(content: string) => { const request = { threadId, content, githubProjectId: selectedGithubLink ? githubProjectId ?? undefined : undefined, researchMode }; setAssistantError(""); setResearchResult(null); setLastResearchRequest(researchMode === "trusted-web" ? { ...request, researchMode: "trusted-web" } : null); askAssistant.mutate(request); }} isLoading={askAssistant.isPending} height="min(56vh, 540px)" placeholder={t("promptPlaceholder")} emptyStateMessage={t("chatEmpty")} suggestedPrompts={[t("promptWebsite"), t("promptReview"), t("promptApi")]} />
            </> : <div className="grid h-full place-items-center text-center"><div><Sparkles className="mx-auto h-8 w-8 text-violet-300" /><h2 className="mt-4 font-bold text-white">{t("startPrivateChat")}</h2><p className="mt-2 max-w-md text-sm leading-7 text-slate-500">{t("startPrivateChatCopy")}</p></div></div>}
          </article>
        </div>
        <div className="rounded-3xl border border-amber-300/15 bg-amber-300/5 p-5"><div className="flex gap-3"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" /><div><h2 className="font-bold text-amber-100">{t("managedUse")}</h2><p className="mt-2 leading-7 text-sm text-amber-100/70">{t("managedUseCopy")}</p></div></div></div>
      </section>
    </DashboardLayout>
  );
}
