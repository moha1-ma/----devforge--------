import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { detectSourceLanguage } from "@shared/sourceFilePolicy";
import { Code2, Download, FileCode2, FilePlus2, History, Import, Loader2, PanelRightOpen, Play, Save, ShieldCheck, Trash2, Upload } from "lucide-react";
import React, { ChangeEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

function downloadTextFile(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name.split("/").pop() || "source.txt";
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function CodeWorkspace() {
  const [location] = useLocation();
  const { direction, language: selectedLanguage, t } = useLanguage();
  const utils = trpc.useUtils();
  const { data: projects = [], isLoading: projectsLoading } = trpc.projects.list.useQuery();
  const [projectId, setProjectId] = useState<number | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [path, setPath] = useState("src/main.py");
  const [newContent, setNewContent] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const requestedProjectId = Number(new URLSearchParams(location.split("?")[1] ?? "").get("project")) || null;
  useEffect(() => {
    const requestedProject = requestedProjectId && projects.some(project => project.id === requestedProjectId) ? requestedProjectId : null;
    if (requestedProject && requestedProject !== projectId) setProjectId(requestedProject);
    else if (!projectId && projects[0]) setProjectId(projects[0].id);
  }, [projectId, projects, requestedProjectId]);
  const filesQuery = trpc.sourceFiles.list.useQuery({ projectId: projectId ?? 0 }, { enabled: Boolean(projectId) });
  const fileQuery = trpc.sourceFiles.read.useQuery({ sourceFileId: selectedFileId ?? 0 }, { enabled: Boolean(selectedFileId) });
  const revisionsQuery = trpc.sourceFiles.revisions.useQuery({ sourceFileId: selectedFileId ?? 0 }, { enabled: Boolean(selectedFileId) });
  const createFile = trpc.sourceFiles.create.useMutation({
    onSuccess: async file => { await utils.sourceFiles.list.invalidate(); setSelectedFileId(file.id); setNewFileOpen(false); setPath("src/main.py"); setNewContent(""); toast.success(t("fileSaved")); },
    onError: error => toast.error(error.message),
  });
  const saveFile = trpc.sourceFiles.save.useMutation({
    onSuccess: async () => { await Promise.all([utils.sourceFiles.read.invalidate(), utils.sourceFiles.list.invalidate(), utils.sourceFiles.revisions.invalidate()]); toast.success(t("revisionSaved")); },
    onError: error => toast.error(error.message),
  });
  const removeFile = trpc.sourceFiles.remove.useMutation({
    onSuccess: async () => { await utils.sourceFiles.list.invalidate(); setSelectedFileId(null); setEditorContent(""); toast.success(t("fileRemoved")); },
    onError: error => toast.error(error.message),
  });

  useEffect(() => { if (fileQuery.data) setEditorContent(fileQuery.data.content); }, [fileQuery.data]);
  const selectedFile = fileQuery.data?.file;
  const language = selectedFile?.language ?? detectSourceLanguage(path);
  const canPreview = language === "html" && Boolean(editorContent.trim());
  const codeLabel = useMemo(() => selectedFile ? `${selectedFile.path} · ${selectedFile.language}` : t("chooseFile"), [selectedFile, t]);

  function submitNewFile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectId) return toast.error(t("createProjectBeforeFiles"));
    createFile.mutate({ projectId, path, content: newContent, note: "إضافة من مساحة الكود" });
  }

  function importTextFile(event: ChangeEvent<HTMLInputElement>) {
    const uploaded = event.target.files?.[0];
    event.target.value = "";
    if (!uploaded) return;
    if (!projectId) return toast.error(t("createProjectBeforeImport"));
    if (uploaded.size > 512 * 1024) return toast.error(t("maxTextFile"));
    const reader = new FileReader();
    reader.onload = () => createFile.mutate({ projectId, path: uploaded.name, content: String(reader.result || ""), note: "استيراد ملف نصي" });
    reader.onerror = () => toast.error(t("importReadError"));
    reader.readAsText(uploaded);
  }

  return <DashboardLayout><section dir={direction} className="space-y-5"><div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end"><div><Badge className="border border-cyan-300/20 bg-cyan-300/10 text-cyan-100"><ShieldCheck className="ml-1 h-3.5 w-3.5" /> {t("privateOwnerSpace")}</Badge><h1 className="mt-4 text-3xl font-bold text-white">{t("codeSources")}</h1><p className="mt-2 max-w-2xl leading-7 text-slate-400">{t("codeSourcesCopy")}</p></div><div className="flex flex-wrap gap-3"><label className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-white/12 bg-white/[0.03] px-4 text-sm font-semibold text-white hover:bg-white/8"><Upload className="ml-2 h-4 w-4" /> {t("importText")}<input type="file" accept=".py,.html,.htm,.css,.js,.jsx,.ts,.tsx,.json,.md,.markdown,.yaml,.yml,.toml,.xml,.sql,.sh,.txt,.java,.c,.cpp,.h,.cs,.go,.rs,.php,.rb,.swift,.kt,.kts,.dart,.vue,.svelte" className="hidden" onChange={importTextFile} /></label><Dialog open={newFileOpen} onOpenChange={setNewFileOpen}><DialogTrigger asChild><Button className="bg-cyan-300 font-bold text-slate-950 hover:bg-cyan-200"><FilePlus2 className="ml-2 h-4 w-4" /> {t("newFile")}</Button></DialogTrigger><DialogContent dir={direction} className="border-white/10 bg-slate-950 text-white sm:max-w-lg"><form onSubmit={submitNewFile}><DialogHeader><DialogTitle>{t("addPrivateTextFile")}</DialogTitle><DialogDescription className="text-slate-400">{t("addPrivateTextFileCopy")}</DialogDescription></DialogHeader><div className="space-y-4 py-5"><div className="space-y-2"><Label htmlFor="source-path">{t("projectPath")}</Label><Input id="source-path" value={path} onChange={event => setPath(event.target.value)} className="border-white/10 bg-white/5 font-mono text-white" required /></div><div className="space-y-2"><Label htmlFor="source-content">{t("content")}</Label><Textarea id="source-content" value={newContent} onChange={event => setNewContent(event.target.value)} className="min-h-52 border-white/10 bg-white/5 font-mono text-sm text-white" /></div></div><DialogFooter><Button type="submit" disabled={createFile.isPending} className="bg-cyan-300 font-bold text-slate-950 hover:bg-cyan-200">{createFile.isPending ? t("saving") : t("saveFile")}</Button></DialogFooter></form></DialogContent></Dialog></div></div>
    <div className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-3 md:flex-row md:items-center"><span className="text-sm font-semibold text-slate-300">{t("project")}:</span><select value={projectId ?? ""} onChange={event => { setProjectId(Number(event.target.value)); setSelectedFileId(null); }} className="h-10 min-w-52 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white"><option value="">{projectsLoading ? t("loadingProjects") : t("selectProject")}</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name} · {project.key}</option>)}</select>{!projects.length && !projectsLoading && <Link href="/projects" className="text-sm font-semibold text-cyan-200 hover:text-cyan-100">{t("createFirstProject")}</Link>}<span className="mr-auto text-xs text-slate-500">{t("textFilesOnly")} · 512 KB</span></div>
    <div className="grid min-h-[620px] gap-4 xl:grid-cols-[260px_minmax(0,1fr)_250px]"><aside className="rounded-3xl border border-white/8 bg-white/[0.025] p-3"><div className="mb-3 flex items-center justify-between px-2"><p className="text-sm font-bold text-white">ملفات المشروع</p><FileCode2 className="h-4 w-4 text-cyan-300" /></div><div className="space-y-1">{filesQuery.isLoading ? <Loader2 className="mx-auto mt-12 h-5 w-5 animate-spin text-cyan-300" /> : filesQuery.data?.length ? filesQuery.data.map(file => <button key={file.id} onClick={() => setSelectedFileId(file.id)} className={`w-full rounded-xl px-3 py-3 text-right transition ${selectedFileId === file.id ? "bg-cyan-300/12 text-cyan-100" : "text-slate-400 hover:bg-white/6 hover:text-white"}`}><span className="block truncate font-mono text-xs">{file.path}</span><span className="mt-1 block text-[11px] text-slate-600">{file.language} · r{file.revisionCount}</span></button>) : <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs leading-6 text-slate-600">لا توجد ملفات بعد. أضف ملفًا أو استورد ملفًا نصيًا.</p>}</div></aside>
      <article className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-white/8 bg-slate-950/60"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-4 py-3"><div><p className="font-mono text-xs text-cyan-200">{codeLabel}</p><p className="mt-1 text-[11px] text-slate-600">الحفظ ينشئ مراجعة جديدة ولا يشغّل الكود.</p></div><div className="flex gap-2">{canPreview && <Button onClick={() => setPreviewOpen(value => !value)} variant="outline" className="h-9 border-white/10 bg-white/[0.03] text-white hover:bg-white/8 hover:text-white"><Play className="ml-1 h-3.5 w-3.5" /> معاينة HTML</Button>}<Button onClick={() => selectedFile && downloadTextFile(selectedFile.path, editorContent)} disabled={!selectedFile} variant="outline" className="h-9 border-white/10 bg-white/[0.03] text-white hover:bg-white/8 hover:text-white"><Download className="ml-1 h-3.5 w-3.5" /> تنزيل</Button><Button onClick={() => selectedFile && saveFile.mutate({ sourceFileId: selectedFile.id, content: editorContent, note: "حفظ من المحرر" })} disabled={!selectedFile || saveFile.isPending} className="h-9 bg-cyan-300 text-slate-950 hover:bg-cyan-200"><Save className="ml-1 h-3.5 w-3.5" /> حفظ</Button></div></div>{selectedFile ? <div className="grid min-h-0 flex-1 grid-rows-[minmax(280px,1fr)_auto]"><Textarea value={editorContent} onChange={event => setEditorContent(event.target.value)} spellCheck={false} className="min-h-80 resize-none rounded-none border-0 bg-transparent p-5 font-mono text-sm leading-7 text-slate-100 focus-visible:ring-0" />{previewOpen && <iframe title="HTML preview" sandbox="" srcDoc={editorContent} className="h-56 border-t border-white/8 bg-white" />}</div> : <div className="grid flex-1 place-items-center p-8 text-center"><div><PanelRightOpen className="mx-auto h-8 w-8 text-cyan-300" /><h2 className="mt-4 font-bold text-white">افتح ملفًا من المشروع</h2><p className="mt-2 max-w-sm text-sm leading-7 text-slate-500">ستظهر هنا مساحة تحرير خاصة، مع معاينة HTML مقيدة وتنزيل للمحتوى.</p></div></div>}</article>
      <aside className="rounded-3xl border border-white/8 bg-white/[0.025] p-4"><div className="flex items-center gap-2"><History className="h-4 w-4 text-violet-300" /><p className="text-sm font-bold text-white">المراجعات</p></div><div className="mt-4 space-y-3">{revisionsQuery.data?.length ? revisionsQuery.data.map(revision => <div key={revision.id} className="rounded-2xl bg-white/[0.035] p-3"><p className="font-mono text-xs text-violet-200">r{revision.revisionNumber}</p><p className="mt-2 text-xs leading-5 text-slate-500">{revision.note || "بدون ملاحظة"}</p><p className="mt-2 text-[11px] text-slate-600">{new Date(revision.createdAt).toLocaleString("ar")}</p></div>) : <p className="text-sm leading-7 text-slate-600">اختر ملفًا لعرض تاريخه.</p>}</div>{selectedFile && <Button onClick={() => { if (confirm(`حذف ${selectedFile.path} من فهرس المشروع؟`)) removeFile.mutate({ sourceFileId: selectedFile.id }); }} variant="outline" className="mt-6 w-full border-rose-400/20 bg-rose-400/5 text-rose-200 hover:bg-rose-400/10 hover:text-rose-100"><Trash2 className="ml-2 h-4 w-4" /> حذف من المشروع</Button>}</aside></div>
  </section></DashboardLayout>;
}
