import { normalizeGithubRepositoryInput } from "./githubRepositoryInput";

export const mergePlanLimits = { maxRepositories: 12, toolNameMax: 120, briefMax: 2000 } as const;
export type MergePlanDraft = { toolName: string; repositories: string[]; brief: string; mergeOrder: string[]; safeguards: string[]; reviewChecklist: string[]; };
export function prepareMergePlan(input: { toolName: string; repositories: string[]; brief?: string }): MergePlanDraft {
  const toolName = input.toolName.trim(); if (toolName.length < 3 || toolName.length > mergePlanLimits.toolNameMax) throw new Error("اسم الأداة الموحدة يجب أن يكون بين 3 و120 حرفًا");
  if (!input.repositories.length || input.repositories.length > mergePlanLimits.maxRepositories) throw new Error(`اختر من 1 إلى ${mergePlanLimits.maxRepositories} مستودعًا في خطة واحدة`);
  const repositories = Array.from(new Set(input.repositories.map(normalizeGithubRepositoryInput))); if (repositories.length !== input.repositories.length) throw new Error("لا تضف المستودع نفسه أكثر من مرة");
  const brief = input.brief?.trim() ?? ""; if (brief.length > mergePlanLimits.briefMax) throw new Error("وصف الدمج أطول من الحد المسموح");
  return { toolName, repositories, brief, mergeOrder: repositories.map((repo, index) => `${index + 1}. مراجعة ${repo}: الرخصة، الهيكل، نقطة الدخول، والاعتماديات.`), safeguards: ["لا تستنسخ أو تكتب إلى GitHub تلقائيًا.", "لا تُدمج الأسرار أو ملفات البيئة أو مفاتيح الوصول.", "اعرض تعارضات المسارات والحزم قبل تجهيز مسودة الدمج.", "يتطلب الحفظ المحلي أو التصدير اعتمادًا صريحًا لاحقًا."], reviewChecklist: ["تحقق من توافق التراخيص وحقوق إعادة الاستخدام.", "حدد نقطة دخول واحدة وواجهات واضحة بين الوحدات.", "قارن نسخ الاعتماديات وابحث عن التعارضات.", "اطلب مراجعة بشرية قبل دمج أي شفرة أو إجراء اختبار." ] };
}
