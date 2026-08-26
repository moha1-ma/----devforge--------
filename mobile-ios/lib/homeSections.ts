import type { DevForgeRoute } from "./devforgeRoutes";

export type MobileHomeSection = {
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  route: DevForgeRoute;
  targetTitle: string;
  targetSubtitle: string;
  accent: string;
  icon: string;
};

export const mobileHomeSections = {
  education: {
    eyebrow: "مسار تعليمي",
    title: "من الفكرة إلى موقعك الأول",
    description: "ابدأ بخطة بناء واضحة، ثم أنشئ موقعك، واحتفظ بالكود والملفات داخل مساحة DevForge الخاصة بك.",
    action: "فتح خطط البناء",
    route: "/plans",
    targetTitle: "أكاديمية البناء",
    targetSubtitle: "خطط عملية داخل DevForge",
    accent: "#B79CFF",
    icon: "LEARN",
  },
  marketplace: {
    eyebrow: "سوق المواقع",
    title: "اعرض مشاريع ومقترحاتك قبل البيع",
    description: "هذه المرحلة تتيح لك مراجعة مواقعك ومقترحات النطاقات الخاصة بك. لا توجد قوائم بيع عامة أو أسعار أو دفعات أو تأكيد لتوفر نطاقات داخل التطبيق حاليًا.",
    action: "استكشاف المعرض",
    route: "/domains",
    targetTitle: "معرض النطاقات",
    targetSubtitle: "مقترحات خاصة قبل التحقق",
    accent: "#D787FF",
    icon: "DNS",
  },
} as const satisfies Record<string, MobileHomeSection>;
