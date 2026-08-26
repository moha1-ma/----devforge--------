import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { LanguageSelector, useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/useMobile";
import { Bell, Blocks, Boxes, BrainCircuit, Cable, Code2, CreditCard, FolderKanban, Github, GitPullRequest, Globe2, ImagePlus, LayoutTemplate, ListChecks, LogOut, Menu, MessageSquareHeart, Rocket, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import OwnerCodeGate from "./OwnerCodeGate";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const { direction, t, isFullyTranslated } = useLanguage();
  const menuItems = [
    { icon: Boxes, label: t("overview"), path: "/workspace" }, { icon: FolderKanban, label: t("projects"), path: "/projects" }, { icon: Code2, label: t("workItems"), path: "/work-items" }, { icon: GitPullRequest, label: t("pullRequests"), path: "/pull-requests" }, { icon: Rocket, label: t("releases"), path: "/releases" }, { icon: ListChecks, label: t("buildPlans"), path: "/plans" }, { icon: Blocks, label: t("codeWorkspace"), path: "/code" }, { icon: Sparkles, label: t("aiAssistant"), path: "/ai" }, { icon: BrainCircuit, label: "مركز المطور الذكي", path: "/developer-center" }, { icon: MessageSquareHeart, label: "مراجعة مشاركات الزوار", path: "/visitor-review" }, { icon: ImagePlus, label: t("imageStudio"), path: "/image-studio" }, { icon: LayoutTemplate, label: t("websiteBuilder"), path: "/website-studio" }, { icon: Globe2, label: t("domainGallery"), path: "/domains" }, { icon: Github, label: "GitHub", path: "/github" }, { icon: Cable, label: t("integrations"), path: "/integrations" }, { icon: CreditCard, label: t("stripeLab"), path: "/stripe-lab" },
  ];
  const initialSidebarOpen = !isMobile;

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) {
    return (
      <main dir={direction} className="dev-shell min-h-screen grid place-items-center px-5">
        <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-cyan-400 text-slate-950"><Code2 className="h-7 w-7" /></div>
          <h1 className="text-2xl font-bold text-white">{t("privateSpace")}</h1>
          <p className="mt-3 leading-7 text-slate-400">{t("loginCopy")}</p>
          <div className="mt-5 flex justify-center"><LanguageSelector compact /></div>
          <Button onClick={() => startLogin()} className="mt-5 h-12 w-full rounded-xl bg-cyan-400 font-bold text-slate-950 hover:bg-cyan-300">{t("loginContinue")}</Button>
        </section>
      </main>
    );
  }

  return (
    <OwnerCodeGate ownerKey={user.openId}>
    <SidebarProvider defaultOpen={initialSidebarOpen}>
      <div dir={direction} className="dev-shell flex min-h-screen w-full overflow-x-hidden">
        <Sidebar collapsible="offcanvas" side="right" className="border-l border-white/10 border-r-0 bg-slate-950/95 backdrop-blur-xl">
          <SidebarHeader className="h-20 px-4 justify-center">
            <div className="flex items-center justify-between gap-3">
              <SidebarTrigger className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-white/8 hover:text-white" aria-label={t("closeNavigation")} />
              <span className="font-mono text-lg font-bold tracking-tight text-white">Dev<span className="text-cyan-300">Forge</span></span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu className="gap-2 px-3">
              {menuItems.map(item => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-11 rounded-xl text-slate-400 hover:bg-white/7 hover:text-white data-[active=true]:bg-cyan-400/12 data-[active=true]:text-cyan-200">
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <div className="rounded-2xl border border-white/8 bg-white/4 p-3 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-cyan-300/25"><AvatarFallback className="bg-cyan-300/10 text-sm font-bold text-cyan-100">{user.name?.slice(0, 1).toUpperCase() || "D"}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{user.name || "عضو الفريق"}</p><p className="truncate text-xs text-slate-500">{user.email || "مساحة عمل DevForge"}</p></div>
                <button onClick={logout} aria-label="تسجيل الخروج" className="text-slate-500 hover:text-rose-300"><LogOut className="h-4 w-4" /></button>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="min-w-0 w-full bg-transparent">
          <header className="relative flex h-16 items-center justify-between overflow-hidden border-b border-white/8 px-4 sm:h-20 sm:px-5 md:px-8">
            <div className="engineering-grid pointer-events-none absolute inset-0 opacity-45" />
            <div className="relative"><p className="command-label">{t("engineeringControlRoom")}</p><div className="mt-1 flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-white">{menuItems.find(item => item.path === location)?.label || t("workspace")}</h2><span className="signal-chip hidden sm:inline-flex"><span className="signal-dot" />مراجعة منظمة</span></div></div>
            <div className="relative flex items-center gap-2 sm:gap-3"><LanguageSelector compact />{isMobile && <SidebarTrigger className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-slate-300 hover:bg-white/8 hover:text-white" aria-label={t("openNavigation")}><Menu className="h-4 w-4" /></SidebarTrigger>}<button className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-slate-400 hover:bg-white/7 hover:text-white" aria-label={t("notifications")}><Bell className="h-4 w-4" /></button></div>
          </header>
          <main className="min-w-0 max-w-full overflow-x-hidden p-4 sm:p-5 md:p-8">{!isFullyTranslated && <p role="status" className="mb-4 rounded-xl border border-amber-300/20 bg-amber-300/5 px-4 py-3 text-xs leading-6 text-amber-100/85" dir="rtl">{t("languageFallback")}</p>}{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
    </OwnerCodeGate>
  );
}
