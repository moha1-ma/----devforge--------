import { desc, eq } from "drizzle-orm";
import { developerCenterProposals } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { developerCenterSafetyInstruction, developerCenterOutputSchema, inspectDeveloperCenterRequest, parseDeveloperCenterOutput, type DeveloperCenterMode } from "./developerCenterPolicy";
import { getDb } from "./db";

const modePrompt: Record<DeveloperCenterMode, string> = {
  software: "صمم نظام برمجي معقد: حدود النطاق، البنية، الوحدات، مخاطر الدمج، مخطط كود قصير، وخطة اختبار.",
  website: "صمم محرك موقع منظم: عنوان رئيسي، هيكل الصفحات، التسلسل الهرمي للمحتوى، الدعوة للإجراء، والبنية التقنية المقترحة.",
  titles: "ولّد نظام عناوين منظم: عنوان رئيسي وعناوين أقسام ورسائل CTA متسقة مع الهدف، ثم وضّح منطق التنظيم.",
};

export async function listDeveloperCenterProposals(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(developerCenterProposals).where(eq(developerCenterProposals.ownerId, ownerId)).orderBy(desc(developerCenterProposals.updatedAt)).limit(30);
}

export async function generateDeveloperCenterProposal(input: { ownerId: number; mode: DeveloperCenterMode; brief: string }) {
  const brief = input.brief.trim();
  const guard = inspectDeveloperCenterRequest(brief);
  if (!guard.allowed) throw new Error(guard.reason);

  const response = await invokeLLM({
    model: "gpt-5",
    maxCompletionTokens: 1800,
    reasoning: { effort: "medium" },
    response_format: developerCenterOutputSchema,
    messages: [
      { role: "system", content: developerCenterSafetyInstruction },
      { role: "system", content: `وضع العمل: ${modePrompt[input.mode]}` },
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
    brief,
    headline: proposal.headline.slice(0, 240),
    proposalJson: JSON.stringify(proposal),
    model: "gpt-5",
    reviewStatus: "draft",
  });
  const [saved] = await db.select().from(developerCenterProposals).where(eq(developerCenterProposals.ownerId, input.ownerId)).orderBy(desc(developerCenterProposals.id)).limit(1);
  if (!saved) throw new Error("تعذر حفظ مقترح مركز المطور");
  return { proposal: saved, output: proposal, usage: response.usage ?? null };
}
