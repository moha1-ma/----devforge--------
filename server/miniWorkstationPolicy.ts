import { inspectDeveloperCenterRequest } from "./developerCenterPolicy";
import { getMiniWorkstationRole, miniWorkstationKeys, type MiniWorkstationKey } from "../shared/miniWorkstationCatalog";

export { miniWorkstationKeys, type MiniWorkstationKey };

export const miniWorkstationSafetyInstruction = `أنت محطة عمل مصغرة خاصة بمالك DevForge. أنجز تحليلًا هندسيًا محدودًا للمراجعة فقط بناءً على طلب المالك ودور المحطة. لا تنفذ أوامر، ولا تشغل كودًا، ولا تكتب أو تعدل ملفات، ولا تنشئ أو تنسخ وكلاء، ولا تنفذ دمجًا، ولا تنشر، ولا تدخل حسابات، ولا تصل إلى GitHub أو أي خدمة خارجية، ولا تطلب أو تكشف أسرارًا أو بيانات شخصية. لا تدعِ تنفيذ أي عمل. احفظ مخرجاتك في صيغة منظمة للمراجعة: ملخص، نتائج، أسئلة مفتوحة، مخاطر، وخطوات يوافق عليها المالك. اجعل executionStatus دائمًا review-only.`;

export function inspectMiniWorkstationRequest(input: { stationKey: MiniWorkstationKey; request: string }) {
  if (!getMiniWorkstationRole(input.stationKey)) return { allowed: false as const, reason: "دور المحطة غير متاح." };
  const baseGuard = inspectDeveloperCenterRequest(input.request.trim());
  if (!baseGuard.allowed) return baseGuard;
  if (/(انسخ.{0,40}(نفسك|محطة|حاسوب)|تكاثر|دمج.{0,40}تلقائي|auto(?:matic)?\s*(?:merge|replicat)|self[-\s]?replicat)/i.test(input.request)) {
    return { allowed: false as const, reason: "المحطات ثابتة بعدد عشرة ولا تنسخ نفسها أو تدمج نتائج أو تغييرات تلقائيًا." };
  }
  return { allowed: true as const };
}

export type MiniWorkstationOutput = {
  executionStatus: "review-only";
  headline: string;
  summary: string;
  findings: string[];
  openQuestions: string[];
  risks: string[];
  ownerNextSteps: string[];
};

export const miniWorkstationOutputSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "mini_workstation_path",
    strict: true,
    schema: {
      type: "object",
      properties: {
        executionStatus: { type: "string", enum: ["review-only"] },
        headline: { type: "string" },
        summary: { type: "string" },
        findings: { type: "array", items: { type: "string" } },
        openQuestions: { type: "array", items: { type: "string" } },
        risks: { type: "array", items: { type: "string" } },
        ownerNextSteps: { type: "array", items: { type: "string" } },
      },
      required: ["executionStatus", "headline", "summary", "findings", "openQuestions", "risks", "ownerNextSteps"],
      additionalProperties: false,
    },
  },
};

export function parseMiniWorkstationOutput(content: string): MiniWorkstationOutput {
  const parsed = JSON.parse(content) as MiniWorkstationOutput;
  if (parsed.executionStatus !== "review-only" || !parsed.headline?.trim() || !parsed.summary?.trim() || !Array.isArray(parsed.findings) || !Array.isArray(parsed.openQuestions) || !Array.isArray(parsed.risks) || !Array.isArray(parsed.ownerNextSteps)) {
    throw new Error("تعذر التحقق من مخرج المحطة المصغرة.");
  }
  return {
    ...parsed,
    headline: parsed.headline.trim().slice(0, 240),
    summary: parsed.summary.trim().slice(0, 3000),
    findings: parsed.findings.filter(item => typeof item === "string").map(item => item.trim().slice(0, 700)).filter(Boolean).slice(0, 8),
    openQuestions: parsed.openQuestions.filter(item => typeof item === "string").map(item => item.trim().slice(0, 700)).filter(Boolean).slice(0, 6),
    risks: parsed.risks.filter(item => typeof item === "string").map(item => item.trim().slice(0, 700)).filter(Boolean).slice(0, 6),
    ownerNextSteps: parsed.ownerNextSteps.filter(item => typeof item === "string").map(item => item.trim().slice(0, 700)).filter(Boolean).slice(0, 6),
  };
}
