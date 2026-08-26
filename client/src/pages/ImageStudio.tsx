import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Download, ImagePlus, Loader2, Sparkles, WandSparkles } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const promptIdeas = [
  "خلفية تجريدية داكنة بألوان سماوية وبنفسجية لمنصة تطوير برمجيات، إضاءة ناعمة، أسلوب ثلاثي الأبعاد أنيق",
  "رسم توضيحي احترافي لفريق برمجة يتعاون على منتج رقمي، أسلوب حديث، ألوان هادئة، بدون أي نص",
  "أيقونة ثلاثية الأبعاد لواجهة ذكاء اصطناعي محلية، معدن داكن مع وهج فيروزي، خلفية شفافة",
];

export default function ImageStudio() {
  const { direction, t } = useLanguage();
  const utils = trpc.useUtils();
  const { data: projects = [] } = trpc.projects.list.useQuery();
  const { data: images = [], isLoading } = trpc.imageStudio.list.useQuery();
  const [projectId, setProjectId] = useState<number | null>(null);
  const [prompt, setPrompt] = useState(promptIdeas[0]);
  const [generationError, setGenerationError] = useState("");
  useEffect(() => { if (!projectId && projects[0]) setProjectId(projects[0].id); }, [projectId, projects]);
  const generate = trpc.imageStudio.generate.useMutation({
    onSuccess: async () => { setGenerationError(""); await utils.imageStudio.list.invalidate(); toast.success(t("imageGenerated")); },
    onError: error => { setGenerationError(error.message); toast.error(error.message); },
  });
  function download(asset: { imageUrl: string; id: number }) {
    const anchor = document.createElement("a");
    anchor.href = asset.imageUrl;
    anchor.download = `devforge-ai-${asset.id}.png`;
    anchor.target = "_blank";
    anchor.click();
  }
  return <DashboardLayout><section dir={direction} className="space-y-6"><div className="rounded-3xl border border-fuchsia-300/15 bg-gradient-to-l from-fuchsia-400/12 to-cyan-300/10 p-7"><Badge className="border border-fuchsia-300/20 bg-fuchsia-300/10 text-fuchsia-100"><WandSparkles className="ml-1 h-3.5 w-3.5" /> {t("privateImageStudio")}</Badge><h1 className="mt-4 text-3xl font-bold text-white">{t("imageHero")}</h1><p className="mt-3 max-w-3xl leading-8 text-slate-300">{t("imageHeroCopy")}</p></div><div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]"><article className="rounded-3xl border border-white/8 bg-white/[0.025] p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-fuchsia-300/10 text-fuchsia-200"><ImagePlus className="h-5 w-5" /></span><div><h2 className="font-bold text-white">{t("assetDescription")}</h2><p className="mt-1 text-sm text-slate-500">{t("assetDescriptionCopy")}</p></div></div><Textarea value={prompt} onChange={event => setPrompt(event.target.value)} className="mt-6 min-h-44 border-white/10 bg-slate-950/50 text-white" /><div className="mt-4 flex flex-wrap gap-2">{promptIdeas.map(idea => <button key={idea} onClick={() => setPrompt(idea)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400 hover:border-fuchsia-300/30 hover:text-fuchsia-100">{t("suggestion")}</button>)}</div><div className="mt-6 space-y-2"><label htmlFor="studio-project" className="text-sm font-medium text-slate-300">{t("optionalProjectLink")}</label><select id="studio-project" value={projectId ?? ""} onChange={event => setProjectId(event.target.value ? Number(event.target.value) : null)} className="h-10 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white"><option value="">{t("noSpecificProject")}</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div><Button onClick={() => generate.mutate({ prompt, projectId: projectId ?? undefined })} disabled={generate.isPending || prompt.trim().length < 12} className="mt-6 h-12 w-full bg-fuchsia-300 font-bold text-slate-950 hover:bg-fuchsia-200">{generate.isPending ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" /> {t("generatingImage")}</> : <><Sparkles className="ml-2 h-4 w-4" /> {t("generateImage")}</>}</Button>{generationError && <p role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm leading-6 text-rose-100">{t("imageCreateError")}: {generationError}</p>}</article><article className="rounded-3xl border border-white/8 bg-slate-950/50 p-6"><div className="flex items-center justify-between"><div><h2 className="font-bold text-white">{t("studioHistory")}</h2><p className="mt-1 text-sm text-slate-500">{t("accountOnlyResults")}</p></div><span className="text-sm text-fuchsia-200">{images.length} {t("assets")}</span></div>{isLoading ? <Loader2 className="mx-auto mt-24 h-6 w-6 animate-spin text-fuchsia-300" /> : images.length ? <div className="mt-6 grid gap-4 sm:grid-cols-2">{images.map(asset => <figure key={asset.id} className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025]"><img src={asset.imageUrl} alt={asset.prompt} className="aspect-square w-full object-cover" /><figcaption className="p-3"><p className="line-clamp-2 text-sm leading-6 text-slate-300">{asset.prompt}</p><button onClick={() => download(asset)} className="mt-3 inline-flex items-center text-xs font-semibold text-cyan-200 hover:text-cyan-100"><Download className="ml-1 h-3.5 w-3.5" /> {t("downloadAsset")}</button></figcaption></figure>)}</div> : <div className="grid min-h-80 place-items-center text-center"><div><ImagePlus className="mx-auto h-8 w-8 text-fuchsia-300" /><h2 className="mt-4 font-bold text-white">{t("startFirstVisual")}</h2><p className="mt-2 max-w-sm text-sm leading-7 text-slate-500">{t("imageEmptyCopy")}</p></div></div>}</article></div></section></DashboardLayout>;
}
