export const developerCenterModes = ["software", "website", "titles", "security", "ai", "self-improvement"] as const;
export type DeveloperCenterMode = (typeof developerCenterModes)[number];
export const developerCenterFocuses = ["general", "security", "ai", "self-improvement"] as const;
export type DeveloperCenterFocus = (typeof developerCenterFocuses)[number];

type GuardResult = { allowed: true } | { allowed: false; reason: string };

const executionIntent = /(نف[ّذذ]|شغ[ّ]?ل|انشر|احذف|ادفع|حو[ّ]?ل|افتح حساب|سج[ّ]?ل دخول|استخرج.{0,20}(مفتاح|كلمة مرور)|(?:run|execute|deploy|publish|delete|pay|transfer|sign in|open account)\b)/i;
const unboundedIntent = /(لا\s*نهائي|غير\s*محدود|بلا\s*حدود|(?:infinite|unlimited)\s*(?:commands?|execution)?)/i;

export function inspectDeveloperCenterRequest(brief: string): GuardResult {
  if (executionIntent.test(brief)) {
    return { allowed: false, reason: "مركز المطور ينتج مقترحات للمراجعة فقط ولا ينفذ أوامر أو نشرًا أو مدفوعات أو عمليات حسابات." };
  }
  if (unboundedIntent.test(brief)) {
    return { allowed: false, reason: "مكتبة المهام منظمة ومحدودة للمراجعة؛ لا تدعم أوامر أو تنفيذًا غير محدود." };
  }
  return { allowed: true };
}

export const developerCenterSafetyInstruction = `أنت مركز مطور DevForge الخاص بالمالك. حوّل الطلب إلى مقترح هندسي منظم فقط. لا تنفذ أوامر، ولا تكتب أو تعدل ملفات، ولا تشغل كودًا، ولا تستدعي أدوات، ولا تنشر، ولا تدفع، ولا تدخل إلى حسابات أو أسرار. قدّم تحسينًا ذاتيًا مضبوطًا: التشخيص، التغيير المقترح، الأثر الأمني، وخطة الاختبار. يمكنك اقتراح مخطط تفاضلي أو أمثلة كود قصيرة بوضوح على أنها مسودة للمراجعة. لا تدّع أنك نفذت أي عمل خارجي. اجعل executionStatus دائمًا review-only، وأدرج موافقات مطلوبة قبل أي تطبيق لاحق.`;

export type DeveloperCenterOutput = {
  executionStatus: "review-only";
  headline: string;
  language: string;
  scope: string[];
  architecture: string[];
  websiteOutline: { title: string; pages: string[]; hierarchy: string[]; primaryCta: string };
  codeSketch: string[];
  testPlan: string[];
  risks: string[];
  securityReview: string[];
  aiReview: string[];
  reviewTasks: { title: string; objective: string; category: "analysis" | "security" | "testing" | "ai" | "architecture" }[];
  approvalsRequired: string[];
};

export const developerCenterOutputSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "developer_center_proposal",
    strict: true,
    schema: {
      type: "object",
      properties: {
        executionStatus: { type: "string", enum: ["review-only"] },
        headline: { type: "string" },
        language: { type: "string" },
        scope: { type: "array", items: { type: "string" } },
        architecture: { type: "array", items: { type: "string" } },
        websiteOutline: {
          type: "object",
          properties: {
            title: { type: "string" },
            pages: { type: "array", items: { type: "string" } },
            hierarchy: { type: "array", items: { type: "string" } },
            primaryCta: { type: "string" },
          },
          required: ["title", "pages", "hierarchy", "primaryCta"],
          additionalProperties: false,
        },
        codeSketch: { type: "array", items: { type: "string" } },
        testPlan: { type: "array", items: { type: "string" } },
        risks: { type: "array", items: { type: "string" } },
        securityReview: { type: "array", items: { type: "string" } },
        aiReview: { type: "array", items: { type: "string" } },
        reviewTasks: { type: "array", items: { type: "object", properties: { title: { type: "string" }, objective: { type: "string" }, category: { type: "string", enum: ["analysis", "security", "testing", "ai", "architecture"] } }, required: ["title", "objective", "category"], additionalProperties: false } },
        approvalsRequired: { type: "array", items: { type: "string" } },
      },
      required: ["executionStatus", "headline", "language", "scope", "architecture", "websiteOutline", "codeSketch", "testPlan", "risks", "securityReview", "aiReview", "reviewTasks", "approvalsRequired"],
      additionalProperties: false,
    },
  },
};

export function parseDeveloperCenterOutput(content: string): DeveloperCenterOutput {
  const parsed = JSON.parse(content) as DeveloperCenterOutput;
  if (parsed.executionStatus !== "review-only" || !parsed.headline?.trim() || !parsed.language?.trim() || !Array.isArray(parsed.scope) || !Array.isArray(parsed.approvalsRequired) || !Array.isArray(parsed.reviewTasks)) {
    throw new Error("تعذر التحقق من صيغة مقترح مركز المطور.");
  }
  return parsed;
}
