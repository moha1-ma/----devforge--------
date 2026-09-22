import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";
import { useLanguage } from "@/contexts/LanguageContext";
import { appCategories, getCategoryLabel, getLocalizedApps, type AppCategory } from "@/lib/appRegistry";
import { trpc } from "@/lib/trpc";
import React, { useEffect } from "react";
import { useLocation } from "wouter";

export default function AppCommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { language, direction } = useLanguage();
  const [, navigate] = useLocation();
  const apps = getLocalizedApps(language);
  const touch = trpc.appPreferences.touch.useMutation();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange, open]);

  const selectApp = (app: (typeof apps)[number]) => {
    touch.mutate({ appKey: app.key });
    onOpenChange(false);
    navigate(app.path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title={language === "ar" ? "البحث في DevForge" : "Search DevForge"} description={language === "ar" ? "افتح أي تطبيق أو مساحة بسرعة" : "Quickly open any app or workspace"} className="border-white/10 bg-[#090e19] text-white shadow-2xl sm:max-w-2xl">
      <CommandInput dir={direction} placeholder={language === "ar" ? "ابحث عن تطبيق، أداة، أو مساحة…" : "Search apps, tools, and workspaces…"} className="h-14 text-base" />
      <CommandList className="max-h-[min(65vh,34rem)] p-2">
        <CommandEmpty className="py-12 text-slate-500">{language === "ar" ? "لا توجد نتيجة مطابقة." : "No matching result."}</CommandEmpty>
        {(Object.keys(appCategories) as AppCategory[]).map(category => {
          const categoryApps = apps.filter(app => app.category === category);
          return (
            <CommandGroup key={category} heading={getCategoryLabel(category, language)} className="text-slate-200 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-3 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.16em] [&_[cmdk-group-heading]]:text-slate-500">
              {categoryApps.map(app => <CommandItem key={app.key} value={`${app.title} ${app.summary} ${app.keywords.join(" ")}`} onSelect={() => selectApp(app)} className="min-h-12 cursor-pointer rounded-xl px-3 text-slate-300 data-[selected=true]:bg-cyan-300/10 data-[selected=true]:text-cyan-100"><app.Icon className="h-4 w-4" /><span className="flex-1">{app.title}</span><CommandShortcut className="font-mono text-[10px] text-slate-600">{app.path}</CommandShortcut></CommandItem>)}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
