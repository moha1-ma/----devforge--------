export type ReliabilityService = {
  providerKey: "uptimerobot" | "better-stack" | "healthchecks" | "sentry";
  name: string;
  focus: string;
  description: string;
  documentationUrl: string;
  activationBoundary: string;
};

export const reliabilityServiceCatalog: ReliabilityService[] = [
  { providerKey: "uptimerobot", name: "UptimeRobot", focus: "إتاحة الموقع وواجهات API", description: "مراقبة خارجية لعنوان موقع أو واجهة API يحدده المالك، مع إعداد وحصة يراجعان في حساب المزود.", documentationUrl: "https://uptimerobot.com/api/", activationBoundary: "لا ينشئ DevForge مراقبًا ولا يرسل بريدًا أو عنوانًا أو مفتاح API تلقائيًا." },
  { providerKey: "better-stack", name: "Better Stack Uptime", focus: "مراقبة وحوادث", description: "مراقبات وتنبيهات وصفحات حالة يختار المالك إعدادها داخل حسابه لدى المزود.", documentationUrl: "https://betterstack.com/docs/uptime/", activationBoundary: "لا ينشئ DevForge مراقبًا أو مناوبة أو تنبيهًا أو اتصالًا تلقائيًا." },
  { providerKey: "healthchecks", name: "Healthchecks.io", focus: "الوظائف الدورية", description: "مراقبة إشارات نجاح المهام المجدولة التي يحددها المالك، منفصلة عن مراقبة إتاحة الموقع.", documentationUrl: "https://healthchecks.io/docs/", activationBoundary: "لا يرسل DevForge روابط ping أو مفاتيح مشروع ولا ينشئ فحوصًا تلقائيًا." },
  { providerKey: "sentry", name: "Sentry", focus: "الأخطاء والأداء", description: "رصد أخطاء وأداء التطبيقات بعد تفويض منفصل ومراجعة ما قد يصل إلى مزود المراقبة.", documentationUrl: "https://docs.sentry.io/", activationBoundary: "لا يثبت DevForge حزمة مراقبة أو يغيّر إعدادات التنبيه أو يرسل بيانات تلقائيًا." },
];
