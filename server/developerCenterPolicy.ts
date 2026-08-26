export const developerCenterModes = ["software", "website", "titles"] as const;
export type DeveloperCenterMode = (typeof developerCenterModes)[number];

type GuardResult = { allowed: true } | { allowed: false; reason: string };

const executionIntent = /(نف[ّذذ]|شغ[ّ]?ل|انشر|احذف|ادفع|حو[ّ]?ل|افتح حساب|سج[ّ]?ل دخول|استخرج.{0,20}(مفتاح|كلمة مرور)|(?:run|execute|deploy|publish|delete|pay|transfer|sign in|open account)\b)/i;

export function inspectDeveloperCenterRequest(brief: string): GuardResult {
  if (executionIntent.test(brief)) {
    return { allowed: false, reason: "مركز المطور ينتج مقترحات للمراجعة فقط ولا ينفذ أوامر أو نشرًا أو مدفوعات أو عمليات حسابات." };
  }
  return { allowed: true };
}

export const developerCenterSafetyInstruction = `أنت مركز مطور DevForge الخاص بالمالك. حوّل الطلب إلى مقترح هندسي منظم فقط. لا تنفذ أوامر، ولا تكتب أو تعدل ملفات، ولا تشغل كودًا، ولا تستدعي أدوات، ولا تنشر، ولا تدفع، ولا تدخل إلى حسابات أو أسرار. يمكنك اقتراح مخطط تفاضلي أو أمثلة كود قصيرة بوضوح على أنها مسودة للمراجعة. لا تدّع أنك نفذت أي عمل خارجي. اجعل executionStatus دائمًا review-only، وأدرج موافقات مطلوبة قبل أي تطبيق لاحق.`;

export type DeveloperCenterOutput = {
  executionStatus: "review-only";
  headline: string;
  scope: string[];
  architecture: string[];
  websiteOutline: { title: string; pages: string[]; hierarchy: string[]; primaryCta: string };
  codeSketch: string[];
  testPlan: string[];
  risks: string[];
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
        approvalsRequired: { type: "array", items: { type: "string" } },
      },
      required: ["executionStatus", "headline", "scope", "architecture", "websiteOutline", "codeSketch", "testPlan", "risks", "approvalsRequired"],
      additionalProperties: false,
    },
  },
};

export function parseDeveloperCenterOutput(content: string): DeveloperCenterOutput {
  const parsed = JSON.parse(content) as DeveloperCenterOutput;
  if (parsed.executionStatus !== "review-only" || !parsed.headline?.trim() || !Array.isArray(parsed.scope) || !Array.isArray(parsed.approvalsRequired)) {
    throw new Error("تعذر التحقق من صيغة مقترح مركز المطور.");
  }
  return parsed;
}
