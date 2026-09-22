import { useAuth } from "@/_core/hooks/useAuth";
import AppCommandPalette from "@/components/AppCommandPalette";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { LanguageSelector, useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/useMobile";
import { getCategoryLabel, getLocalizedApps, primaryAppKeys } from "@/lib/appRegistry";
import { trpc } from "@/lib/trpc";
import { Bell, Code2, LogOut, Search, Sparkles } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import OwnerCodeGate from "./OwnerCodeGate";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [commandOpen, setCommandOpen] = useState(false);
  const isMobile = useIsMobile();
  const { direction, language, t, isFullyTranslated } = useLanguage();
  const apps = useMemo(() => getLocalizedApps(language), [language]);
  const primaryApps = primaryAppKeys.map(key => apps.find(app => app.key === key)!).filter(Boolean);
  const activeApp = apps.find(app => app.path === location) ?? apps.find(app => app.key === "apps")!;
  const unreadNotifications = trpc.notifications.unreadCount.useQuery(undefined, { enabled: Boolean(user) });
  const preferences = trpc.appPreferences.list.useQuery(undefined, { enabled: Boolean(user) });
  const touch = trpc.appPreferences.touch.useMutation();
  const primaryKeySet = new Set(primaryAppKeys);
  const pinnedApps = apps.filter(app => preferences.data?.some(preference => preference.appKey === app.key && preference.isPinned) && !primaryKeySet.has(app.key as typeof primaryAppKeys[number])).sort((a, b) => {
    const aOrder = preferences.data?.find(preference => preference.appKey === a.key)?.displayOrder ?? 0;
    const bOrder = preferences.data?.find(preference => preference.appKey === b.key)?.displayOrder ?? 0;
    return aOrder - bOrder;
  });

  const navigate = (app: (typeof apps)[number]) => {
    touch.mutate({ appKey: app.key });
    setLocation(app.path);
  };

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) {
    return (
      <main dir={direction} className="dev-shell min-h-screen grid place-items-center px-5">
        <section className="auth-card w-full max-w-md text-center">
          <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-400/15"><Code2 className="h-7 w-7" /></div>
          <p className="command-label">DEVFORGE / SECURE ACCESS</p>
          <h1 className="mt-3 text-2xl font-bold text-white">{t("privateSpace")}</h1>
          <p className="mt-3 leading-7 text-slate-400">{t("loginCopy")}</p>
          <div className="mt-5 flex justify-center"><LanguageSelector compact /></div>
          <GoogleSignInButton className="mt-5 h-12 w-full" />
          <div className="my-4 flex items-center gap-3 text-[11px] text-slate-600"><span className="h-px flex-1 bg-white/8" /><span>{t("otherSignIn")}</span><span className="h-px flex-1 bg-white/8" /></div>
          <Button onClick={() => startLogin()} size="lg" variant="ghost" className="w-full font-semibold text-slate-400 hover:text-white">{t("loginContinue")}</Button>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-600"><Sparkles className="h-3.5 w-3.5 text-cyan-300" />{language === "ar" ? "دخول مشفّر ومساحة خاصة" : "Encrypted sign-in and private workspace"}</p>
        </section>
      </main>
    );
  }

  return (
    <OwnerCodeGate ownerKey={user.openId}>
      <SidebarProvider defaultOpen={!isMobile}>
        <div dir={direction} className="dev-shell flex min-h-screen w-full overflow-x-hidden">
          <Sidebar collapsible="icon" side={direction === "rtl" ? "right" : "left"} className="border-white/8 bg-[#080d17]/96 backdrop-blur-xl">
            <SidebarHeader className="h-20 justify-center border-b border-white/7 px-3">
              <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
                <button type="button" onClick={() => navigate(apps.find(app => app.key === "overview")!)} className="flex min-h-11 min-w-0 items-center gap-3 rounded-xl px-1 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-300 text-slate-950"><Code2 className="h-4 w-4" /></span><span className="font-mono text-lg font-bold tracking-tight text-white group-data-[collapsible=icon]:hidden">Dev<span className="text-cyan-300">Forge</span></span></button>
                <SidebarTrigger className="h-10 w-10 rounded-xl text-slate-500 hover:bg-white/7 hover:text-white group-data-[collapsible=icon]:hidden" aria-label={t("closeNavigation")} />
              </div>
            </SidebarHeader>
            <SidebarContent className="px-2 py-4">
              <SidebarGroup className="p-0">
                <SidebarGroupLabel className="px-3 text-[10px] uppercase tracking-[0.18em] text-slate-600">{language === "ar" ? "مساحة العمل" : "Workspace"}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1.5">
                    {primaryApps.map(app => <SidebarMenuItem key={app.key}><SidebarMenuButton isActive={location === app.path} onClick={() => navigate(app)} tooltip={app.title} className="h-11 rounded-xl text-slate-400 hover:bg-white/6 hover:text-white data-[active=true]:bg-cyan-300/10 data-[active=true]:text-cyan-100"><app.Icon className="h-4 w-4" /><span className="font-medium">{app.title}</span></SidebarMenuButton></SidebarMenuItem>)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              {pinnedApps.length ? <SidebarGroup className="mt-5 p-0"><SidebarGroupLabel className="px-3 text-[10px] uppercase tracking-[0.18em] text-slate-600">{language === "ar" ? "مثبتة" : "Pinned"}</SidebarGroupLabel><SidebarGroupContent><SidebarMenu className="gap-1">{pinnedApps.map(app => <SidebarMenuItem key={app.key}><SidebarMenuButton isActive={location === app.path} onClick={() => navigate(app)} tooltip={app.title} className="h-10 rounded-xl text-slate-500 hover:bg-white/6 hover:text-white data-[active=true]:bg-violet-300/10 data-[active=true]:text-violet-100"><app.Icon className="h-4 w-4" /><span>{app.title}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup> : null}
            </SidebarContent>
            <SidebarFooter className="border-t border-white/7 p-3">
              <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/7 bg-white/[0.025] p-2 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
                <Avatar className="h-9 w-9 shrink-0 border border-cyan-300/20"><AvatarFallback className="bg-cyan-300/10 text-sm font-bold text-cyan-100">{user.name?.slice(0, 1).toUpperCase() || "D"}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-semibold text-white">{user.name || (language === "ar" ? "عضو الفريق" : "Team member")}</p><p className="truncate text-xs text-slate-600">{user.email || "DevForge"}</p></div>
                <Button type="button" variant="ghost" size="icon" onClick={logout} aria-label={language === "ar" ? "تسجيل الخروج" : "Sign out"} className="text-slate-500 hover:text-rose-300 group-data-[collapsible=icon]:hidden"><LogOut /></Button>
              </div>
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>

          <SidebarInset className="min-w-0 w-full bg-transparent">
            <header className="platform-topbar sticky top-0 z-30 flex h-16 items-center justify-between gap-3 px-4 sm:h-20 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3"><SidebarTrigger className="hidden h-10 w-10 rounded-xl text-slate-500 hover:bg-white/7 hover:text-white md:inline-flex" aria-label={t("openNavigation")} /><div className="min-w-0"><p className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600 sm:block">DevForge / {getCategoryLabel(activeApp.category, language)}</p><h2 className="truncate text-base font-bold text-white sm:mt-1 sm:text-lg">{activeApp.title}</h2></div></div>
              <button type="button" onClick={() => setCommandOpen(true)} className="hidden h-11 min-w-[15rem] max-w-md flex-1 items-center gap-3 rounded-xl border border-white/8 bg-black/15 px-4 text-sm text-slate-500 transition hover:border-cyan-300/15 hover:bg-white/[0.035] hover:text-slate-300 lg:flex"><Search className="h-4 w-4" /><span className="flex-1 text-start">{language === "ar" ? "ابحث في المنصة…" : "Search the platform…"}</span><kbd className="rounded-md border border-white/8 bg-white/5 px-2 py-1 font-mono text-[10px] text-slate-600">⌘ K</kbd></button>
              <div className="flex items-center gap-2"><LanguageSelector compact /><Button type="button" variant="ghost" size="icon" onClick={() => setCommandOpen(true)} className="lg:hidden" aria-label={language === "ar" ? "فتح البحث" : "Open search"}><Search /></Button>{isMobile ? <SidebarTrigger className="h-11 w-11 rounded-xl border border-white/8 text-slate-400 hover:bg-white/7 hover:text-white" aria-label={t("openNavigation")} /> : null}<Button type="button" variant="ghost" size="icon" onClick={() => setLocation("/notifications")} className="relative" aria-label={t("notifications")}><Bell />{unreadNotifications.data?.count ? <span className="absolute -end-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-cyan-300 px-1 text-[9px] font-bold text-slate-950">{unreadNotifications.data.count > 9 ? "9+" : unreadNotifications.data.count}</span> : null}</Button></div>
            </header>
            <main className="platform-content min-w-0 max-w-full overflow-x-hidden p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-10">{!isFullyTranslated && <p role="status" className="mb-5 rounded-xl border border-amber-300/20 bg-amber-300/5 px-4 py-3 text-xs leading-6 text-amber-100/85" dir="rtl">{t("languageFallback")}</p>}{children}</main>
          </SidebarInset>

          <nav className="platform-mobile-nav md:hidden" aria-label={language === "ar" ? "التنقل الأساسي" : "Primary navigation"}>{primaryApps.map(app => <button type="button" key={app.key} aria-current={location === app.path ? "page" : undefined} onClick={() => navigate(app)} className="platform-mobile-nav-item"><app.Icon /><span>{app.title}</span></button>)}</nav>
          <AppCommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
        </div>
      </SidebarProvider>
    </OwnerCodeGate>
  );
}
