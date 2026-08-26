import { desc, eq } from "drizzle-orm";
import { developerCenterProposals, developerReviewTasks } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { developerCenterSafetyInstruction, developerCenterOutputSchema, inspectDeveloperCenterRequest, parseDeveloperCenterOutput, type DeveloperCenterFocus, type DeveloperCenterMode } from "./developerCenterPolicy";
import { getDb } from "./db";
import { getDeveloperLanguage } from "../shared/developerLanguageCatalog";

const modePrompt: Record<DeveloperCenterMode, string> = {
  software: "صمم نظام برمجي معقد: حدود النطاق، البنية، الوحدات، مخاطر الدمج، مخطط كود قصير، وخطة اختبار.",
  website: "صمم محرك موقع منظم: عنوان رئيسي، هيكل الصفحات، التسلسل الهرمي للمحتوى، الدعوة للإجراء، والبنية التقنية المقترحة.",
  titles: "ولّد نظام عناوين منظم: عنوان رئيسي وعناوين أقسام ورسائل CTA متسقة مع الهدف، ثم وضّح منطق التنظيم.",
  security: "حلّل تصميمًا أمنيًا دفاعيًا: نمذجة التهديدات، التحقق من المدخلات، حدود الصلاحيات، التسجيل الآمن، وخطة اختبارات دفاعية. لا تقدم استغلالات أو خطوات هجومية.",
  ai: "صمم قدرة ذكاء اصطناعي مسؤولة: جودة المدخلات والمخرجات، الخصوصية، التقييم، الرصد، وضوابط الاستخدام.",
  "self-improvement": "أنشئ دورة تحسين ذاتي مضبوطة: تشخيص من وصف المالك، تغييرات مقترحة، أثر أمني، اختبارات، وموافقات صريحة. لا تفترض الوصول إلى ملفات أو بيئات أو نشر.",
};

export async function listDeveloperCenterProposals(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(developerCenterProposals).where(eq(developerCenterProposals.ownerId, ownerId)).orderBy(desc(developerCenterProposals.updatedAt)).limit(30);
}

export async function listDeveloperReviewTasks(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(developerReviewTasks).where(eq(developerReviewTasks.ownerId, ownerId)).orderBy(desc(developerReviewTasks.updatedAt)).limit(40);
}

export async function generateDeveloperCenterProposal(input: { ownerId: number; mode: DeveloperCenterMode; languageKey: string; focus: DeveloperCenterFocus; brief: string }) {
  const brief = input.brief.trim();
  const guard = inspectDeveloperCenterRequest(brief);
  if (!guard.allowed) throw new Error(guard.reason);
  const language = getDeveloperLanguage(input.languageKey);
  if (!language) throw new Error("لغة البرمجة المختارة غير متاحة في الكتالوج.");

  const response = await invokeLLM({
    model: "gpt-5",
    maxCompletionTokens: 1800,
    reasoning: { effort: "medium" },
    response_format: developerCenterOutputSchema,
    messages: [
      { role: "system", content: developerCenterSafetyInstruction },
      { role: "system", content: `وضع العمل: ${modePrompt[input.mode]}\nاللغة المستهدفة: ${language.label}. القدرات: ${language.strengths.join("، ")}. الحد: ${language.reviewBoundary}\nتركيز المراجعة: ${input.focus}. أضف من 3 إلى 6 مهام مراجعة منظمة فقط.` },
      { role: "user", content: `طلب المالك:\n${brief}` },
    ],
  });
  const content = response.choices[0]?.message.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("لم يُرجع النموذج مقترحًا صالحًا. حاول وصفًا أقصر.");
  const proposal = parseDeveloperCenterOutput(content);
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  await db.insert(developerCenterProposals).values({
    ownerId: input.ownerId,
    mode: input.mode,
    languageKey: language.key,
    focus: input.focus,
    brief,
    headline: proposal.headline.slice(0, 240),
    proposalJson: JSON.stringify(proposal),
    model: "gpt-5",
    reviewStatus: "draft",
  });
  const [saved] = await db.select().from(developerCenterProposals).where(eq(developerCenterProposals.ownerId, input.ownerId)).orderBy(desc(developerCenterProposals.id)).limit(1);
  if (!saved) throw new Error("تعذر حفظ مقترح مركز المطور");
  const reviewTasks = proposal.reviewTasks.slice(0, 6).map((task, index) => ({ ownerId: input.ownerId, proposalId: saved.id, taskKey: `${saved.id}-${index + 1}`, category: task.category, title: task.title.slice(0, 180), objective: task.objective, requiresOwnerApproval: true, status: "proposed" as const }));
  if (reviewTasks.length) await db.insert(developerReviewTasks).values(reviewTasks).onDuplicateKeyUpdate({ set: { title: reviewTasks[0].title, objective: reviewTasks[0].objective, updatedAt: new Date() } });
  return { proposal: saved, output: proposal, usage: response.usage ?? null };
}
