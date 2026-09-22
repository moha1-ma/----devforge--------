export type AppCategory = "delivery" | "development" | "ai" | "creation" | "connections" | "community" | "platform";
export type AppAccess = "public" | "authenticated" | "owner";

export type AppDefinition = {
  key: string;
  path: string;
  icon: string;
  category: AppCategory;
  access: AppAccess;
  primary?: boolean;
  label: { ar: string; en: string };
  description: { ar: string; en: string };
  keywords: readonly string[];
};

export const appCategories: Record<AppCategory, { ar: string; en: string }> = {
  delivery: { ar: "التسليم", en: "Delivery" },
  development: { ar: "التطوير", en: "Development" },
  ai: { ar: "الذكاء الاصطناعي", en: "AI" },
  creation: { ar: "الإنشاء والتصميم", en: "Creation & design" },
  connections: { ar: "الربط والتكامل", en: "Connections" },
  community: { ar: "المجتمع والأسواق", en: "Community" },
  platform: { ar: "إدارة المنصة", en: "Platform" },
};

export const appRegistry = [
  { key: "overview", path: "/workspace", icon: "layout-dashboard", category: "delivery", access: "authenticated", primary: true, label: { ar: "الرئيسية", en: "Overview" }, description: { ar: "نظرة موحدة على المشاريع والتسليم والنشاط.", en: "A unified view of projects, delivery, and activity." }, keywords: ["home", "dashboard", "workspace"] },
  { key: "projects", path: "/projects", icon: "folder-kanban", category: "delivery", access: "authenticated", primary: true, label: { ar: "المشاريع", en: "Projects" }, description: { ar: "إدارة المشاريع وسياق العمل النشط.", en: "Manage projects and active delivery context." }, keywords: ["project", "work"] },
  { key: "work-items", path: "/work-items", icon: "list-checks", category: "delivery", access: "authenticated", label: { ar: "عناصر العمل", en: "Work items" }, description: { ar: "متابعة المهام من التخطيط حتى الإنجاز.", en: "Track work from planning through completion." }, keywords: ["tasks", "issues", "backlog"] },
  { key: "pull-requests", path: "/pull-requests", icon: "git-pull-request", category: "delivery", access: "authenticated", label: { ar: "طلبات السحب", en: "Pull requests" }, description: { ar: "عرض المراجعات والفحوصات وحالة الدمج.", en: "Review checks, approvals, and merge status." }, keywords: ["pr", "review", "merge"] },
  { key: "releases", path: "/releases", icon: "rocket", category: "delivery", access: "authenticated", label: { ar: "الإصدارات", en: "Releases" }, description: { ar: "متابعة الإصدارات وعمليات النشر.", en: "Track releases and deployments." }, keywords: ["deploy", "release"] },
  { key: "plans", path: "/plans", icon: "route", category: "delivery", access: "authenticated", label: { ar: "خطط البناء", en: "Build plans" }, description: { ar: "تحويل الأفكار إلى خطوات تنفيذ قابلة للمراجعة.", en: "Turn ideas into reviewable implementation steps." }, keywords: ["plan", "blueprint"] },
  { key: "code", path: "/code", icon: "code-2", category: "development", access: "owner", primary: true, label: { ar: "الكود", en: "Code" }, description: { ar: "مساحة خاصة للملفات والمراجعات البرمجية.", en: "A private workspace for source files and revisions." }, keywords: ["source", "editor", "files"] },
  { key: "javascript-lab", path: "/javascript-lab", icon: "square-terminal", category: "development", access: "owner", label: { ar: "محطة JavaScript", en: "JavaScript lab" }, description: { ar: "محطة متخصصة لتطوير ومراجعة JavaScript.", en: "A focused JavaScript development and review station." }, keywords: ["javascript", "typescript", "node"] },
  { key: "javascript-migration", path: "/javascript-migration", icon: "refresh-cw", category: "development", access: "owner", label: { ar: "انتقال JavaScript", en: "JavaScript migration" }, description: { ar: "تخطيط انتقالات JavaScript ضمن حدود واضحة.", en: "Plan bounded JavaScript migrations." }, keywords: ["migration", "javascript"] },
  { key: "mini-workstations", path: "/mini-workstations", icon: "cpu", category: "development", access: "owner", label: { ar: "المحطات المصغرة", en: "Mini workstations" }, description: { ar: "مسارات مراجعة متخصصة لمهام التطوير.", en: "Specialized review paths for development tasks." }, keywords: ["workstation", "review"] },
  { key: "periodic-development", path: "/periodic-development", icon: "timer-reset", category: "development", access: "owner", label: { ar: "التطوير الدوري", en: "Periodic development" }, description: { ar: "مسودات تطوير دورية تخضع لمراجعة المالك.", en: "Owner-reviewed periodic development drafts." }, keywords: ["schedule", "drafts"] },
  { key: "developer-center", path: "/developer-center", icon: "brain-circuit", category: "development", access: "owner", label: { ar: "مركز المطور", en: "Developer center" }, description: { ar: "اقتراحات هندسية واختبارات ومراجعات منظمة.", en: "Structured engineering proposals, tests, and reviews." }, keywords: ["developer", "quality"] },
  { key: "ai", path: "/ai", icon: "sparkles", category: "ai", access: "authenticated", primary: true, label: { ar: "الذكاء الاصطناعي", en: "AI" }, description: { ar: "مساعد خاص مرتبط بسياق مشاريعك.", en: "A private assistant grounded in project context." }, keywords: ["assistant", "chat", "ai"] },
  { key: "ai-router", path: "/ai-router", icon: "network", category: "ai", access: "owner", label: { ar: "موجّه الذكاء", en: "AI router" }, description: { ar: "تقسيم طلبات التطوير إلى مسارات واضحة.", en: "Route development requests into clear workstreams." }, keywords: ["router", "tasks", "ai"] },
  { key: "global-research", path: "/global-research", icon: "search-code", category: "ai", access: "owner", label: { ar: "البحث العالمي", en: "Global research" }, description: { ar: "بحث موثق مع إظهار المصادر والحدود.", en: "Documented research with visible sources and boundaries." }, keywords: ["research", "search", "sources"] },
  { key: "image-studio", path: "/image-studio", icon: "image-plus", category: "creation", access: "authenticated", label: { ar: "استوديو الصور", en: "Image studio" }, description: { ar: "إنشاء أصول مرئية خاصة بالمشاريع.", en: "Create private visual assets for projects." }, keywords: ["image", "design", "asset"] },
  { key: "website-studio", path: "/website-studio", icon: "panels-top-left", category: "creation", access: "authenticated", label: { ar: "استوديو المواقع", en: "Website studio" }, description: { ar: "بناء مخططات مواقع قابلة للتطوير.", en: "Build extensible website blueprints." }, keywords: ["website", "builder", "web"] },
  { key: "domains", path: "/domains", icon: "globe-2", category: "creation", access: "authenticated", label: { ar: "النطاقات", en: "Domains" }, description: { ar: "تنظيم النطاقات المرشحة وحالاتها.", en: "Organize domain candidates and statuses." }, keywords: ["domain", "dns"] },
  { key: "github", path: "/github", icon: "github", category: "connections", access: "authenticated", label: { ar: "GitHub", en: "GitHub" }, description: { ar: "ربط المستودعات وتجميعها ومراجعة تعارضاتها.", en: "Connect, aggregate, and review repositories." }, keywords: ["git", "repository", "merge"] },
  { key: "integrations", path: "/integrations", icon: "cable", category: "connections", access: "authenticated", label: { ar: "التكاملات", en: "Integrations" }, description: { ar: "اكتشاف الخدمات والموصلات الخارجية بأمان.", en: "Safely discover external services and connectors." }, keywords: ["mcp", "connect", "api"] },
  { key: "partners", path: "/partners", icon: "handshake", category: "connections", access: "owner", label: { ar: "الشركاء التقنيون", en: "Technical partners" }, description: { ar: "تنظيم علاقات التكامل والتسليم التقني.", en: "Organize technical integration and delivery relationships." }, keywords: ["partners", "vendors"] },
  { key: "api-reference", path: "/api", icon: "braces", category: "connections", access: "public", label: { ar: "مرجع API", en: "API reference" }, description: { ar: "مرجع نقاط الوصول وحدود الصلاحيات.", en: "Reference endpoints and permission boundaries." }, keywords: ["api", "docs", "reference"] },
  { key: "api-control", path: "/api-control", icon: "server-cog", category: "platform", access: "owner", label: { ar: "تحكم API", en: "API control" }, description: { ar: "مراجعة سياسات واجهات المنصة وتشغيلها.", en: "Review platform API policies and operation." }, keywords: ["api", "control"] },
  { key: "continuity", path: "/continuity", icon: "heart-pulse", category: "platform", access: "owner", label: { ar: "استمرارية المنصة", en: "Platform continuity" }, description: { ar: "متابعة الجاهزية والمخاطر وخطط الاستعادة.", en: "Track readiness, risks, and recovery plans." }, keywords: ["health", "continuity", "recovery"] },
  { key: "notifications", path: "/notifications", icon: "bell", category: "platform", access: "authenticated", label: { ar: "الإشعارات", en: "Notifications" }, description: { ar: "إدارة التنبيهات الداخلية وتفضيلاتها.", en: "Manage in-product notifications and preferences." }, keywords: ["alerts", "notifications"] },
  { key: "community", path: "/community", icon: "users-round", category: "community", access: "public", label: { ar: "المجتمعات", en: "Communities" }, description: { ar: "مجتمعات تقنية خاضعة للمراجعة.", en: "Moderated technical communities." }, keywords: ["community", "members"] },
  { key: "community-review", path: "/community-review", icon: "shield-check", category: "community", access: "owner", label: { ar: "مراجعة المجتمعات", en: "Community review" }, description: { ar: "مراجعة العضويات والمنشورات والبلاغات.", en: "Review memberships, posts, and reports." }, keywords: ["moderation", "community"] },
  { key: "visitor-review", path: "/visitor-review", icon: "message-square-heart", category: "community", access: "owner", label: { ar: "مراجعة المشاركات", en: "Submission review" }, description: { ar: "مراجعة مساهمات الزوار قبل نشرها.", en: "Review visitor contributions before publishing." }, keywords: ["visitor", "submissions", "moderation"] },
  { key: "marketplace", path: "/marketplace", icon: "store", category: "community", access: "public", label: { ar: "السوق", en: "Marketplace" }, description: { ar: "اكتشاف الأدوات والمتاجر المعتمدة.", en: "Discover approved tools and stores." }, keywords: ["market", "store"] },
  { key: "marketplace-review", path: "/marketplace-review", icon: "badge-check", category: "community", access: "owner", label: { ar: "مراجعة السوق", en: "Marketplace review" }, description: { ar: "مراجعة طلبات المتاجر ومحتواها.", en: "Review store requests and content." }, keywords: ["market", "review"] },
  { key: "aziz-market", path: "/aziz-market", icon: "palette", category: "community", access: "public", label: { ar: "سوق عزوز", en: "Aziz market" }, description: { ar: "مجموعات تصميم وأصول مرئية منظمة.", en: "Curated design collections and visual assets." }, keywords: ["aziz", "design", "market"] },
  { key: "aziz-market-review", path: "/aziz-market-review", icon: "paintbrush", category: "community", access: "owner", label: { ar: "مراجعة سوق عزوز", en: "Aziz review" }, description: { ar: "مراجعة أصول ومجموعات سوق عزوز.", en: "Review Aziz market assets and collections." }, keywords: ["aziz", "review"] },
  { key: "apps", path: "/apps", icon: "grid-2x2", category: "platform", access: "authenticated", primary: true, label: { ar: "التطبيقات", en: "Apps" }, description: { ar: "كل أدوات DevForge في مركز واحد قابل للتخصيص.", en: "Every DevForge tool in one customizable hub." }, keywords: ["apps", "tools", "all"] },
] as const satisfies readonly AppDefinition[];

export type AppKey = typeof appRegistry[number]["key"];

export const primaryAppKeys = ["overview", "projects", "code", "ai", "apps"] as const satisfies readonly AppKey[];

const appKeySet = new Set<string>(appRegistry.map(app => app.key));

export function isAppKey(value: string): value is AppKey {
  return appKeySet.has(value);
}

export function findAppByPath(path: string) {
  return appRegistry.find(app => app.path === path);
}
