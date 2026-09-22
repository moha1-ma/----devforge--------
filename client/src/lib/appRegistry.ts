import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Bell,
  Braces,
  BrainCircuit,
  Cable,
  Code2,
  Cpu,
  FolderKanban,
  GitPullRequest,
  Github,
  Globe2,
  Grid2X2,
  Handshake,
  HeartPulse,
  ImagePlus,
  LayoutDashboard,
  ListChecks,
  Network,
  Paintbrush,
  Palette,
  PanelsTopLeft,
  RefreshCw,
  Rocket,
  Route,
  SearchCode,
  ServerCog,
  ShieldCheck,
  Sparkles,
  SquareTerminal,
  Store,
  TimerReset,
  UsersRound,
  MessageSquareHeart,
} from "lucide-react";
import {
  appCategories,
  appRegistry,
  findAppByPath,
  primaryAppKeys,
  type AppCategory,
  type AppKey,
} from "@shared/appRegistry";

const icons: Record<string, LucideIcon> = {
  "badge-check": BadgeCheck,
  bell: Bell,
  braces: Braces,
  "brain-circuit": BrainCircuit,
  cable: Cable,
  "code-2": Code2,
  cpu: Cpu,
  "folder-kanban": FolderKanban,
  "git-pull-request": GitPullRequest,
  github: Github,
  "globe-2": Globe2,
  "grid-2x2": Grid2X2,
  handshake: Handshake,
  "heart-pulse": HeartPulse,
  "image-plus": ImagePlus,
  "layout-dashboard": LayoutDashboard,
  "list-checks": ListChecks,
  network: Network,
  paintbrush: Paintbrush,
  palette: Palette,
  "panels-top-left": PanelsTopLeft,
  "refresh-cw": RefreshCw,
  rocket: Rocket,
  route: Route,
  "search-code": SearchCode,
  "server-cog": ServerCog,
  "shield-check": ShieldCheck,
  sparkles: Sparkles,
  "square-terminal": SquareTerminal,
  store: Store,
  "timer-reset": TimerReset,
  "users-round": UsersRound,
  "message-square-heart": MessageSquareHeart,
};

export type LocalizedApp = (typeof appRegistry)[number] & {
  Icon: LucideIcon;
  title: string;
  summary: string;
};

// Resolves each shared app definition's icon name to a Lucide component and
// its label/description to the requested language (falling back to English).
export function getLocalizedApps(language: string): LocalizedApp[] {
  const locale = language === "ar" ? "ar" : "en";
  return appRegistry.map(app => ({
    ...app,
    Icon: icons[app.icon] ?? Grid2X2,
    title: app.label[locale],
    summary: app.description[locale],
  }));
}

// Returns the display label for an app category in the requested language.
export function getCategoryLabel(category: AppCategory, language: string) {
  return appCategories[category][language === "ar" ? "ar" : "en"];
}

export { appCategories, appRegistry, findAppByPath, primaryAppKeys };
export type { AppCategory, AppKey };
