import { and, desc, eq } from "drizzle-orm";
import { miniWorkstationPaths } from "../drizzle/schema";
import { getMiniWorkstationRole, type MiniWorkstationKey } from "../shared/miniWorkstationCatalog";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { inspectMiniWorkstationRequest, miniWorkstationOutputSchema, miniWorkstationSafetyInstruction, parseMiniWorkstationOutput } from "./miniWorkstationPolicy";

export async function listMiniWorkstationPaths(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(miniWorkstationPaths).where(eq(miniWorkstationPaths.ownerId, ownerId)).orderBy(desc(miniWorkstationPaths.updatedAt)).limit(50);
}

export async function runMiniWorkstation(input: { ownerId: number; stationKey: MiniWorkstationKey; request: string }) {
  const request = input.request.trim();
  const guard = inspectMiniWorkstationRequest({ stationKey: input.stationKey, request });
  if (!guard.allowed) throw new Error(guard.reason);
  const role = getMiniWorkstationRole(input.stationKey);
  if (!role) throw new Error("دور المحطة غير متاح.");

  const response = await invokeLLM({
    model: "gpt-5-mini",
    maxCompletionTokens: 1200,
    reasoning: { effort: "low" },
    response_format: miniWorkstationOutputSchema,
    messages: [
      { role: "system", content: miniWorkstationSafetyInstruction },
      { role: "system", content: `دور المحطة: ${role.title}. نطاقها: ${role.summary} ركز على هذا الدور فقط، ولا تضف مهامًا أو ادعاءات خارج النطاق.` },
      { role: "user", content: `طلب المالك:\n${request}` },
    ],
  });
  const content = response.choices[0]?.message.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("لم يُرجع محرك الذكاء نتيجة صالحة. أعد المحاولة بطلب أقصر.");
  const output = parseMiniWorkstationOutput(content);
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  await db.insert(miniWorkstationPaths).values({
    ownerId: input.ownerId,
    stationKey: input.stationKey,
    request,
    headline: output.headline,
    outputJson: JSON.stringify(output),
    model: "gpt-5-mini",
    reviewStatus: "completed",
  });
  const [saved] = await db.select().from(miniWorkstationPaths).where(eq(miniWorkstationPaths.ownerId, input.ownerId)).orderBy(desc(miniWorkstationPaths.id)).limit(1);
  if (!saved) throw new Error("تعذر حفظ مسار المحطة المصغرة.");
  return { path: saved, output, usage: response.usage ?? null };
}

export async function consolidateMiniWorkstationPaths(ownerId: number) {
  const existing = await listMiniWorkstationPaths(ownerId);
  const latestByStation = new Map<string, (typeof existing)[number]>();
  for (const path of existing) if (getMiniWorkstationRole(path.stationKey) && !latestByStation.has(path.stationKey)) latestByStation.set(path.stationKey, path);
  const missing = ["architecture", "requirements", "experience", "frontend", "backend", "security", "testing", "javascript-diagnostics", "research-provenance", "release-readiness"].filter(key => !latestByStation.has(key));
  if (missing.length) throw new Error(`تحتاج مسودة التجميع إلى مسار واحد على الأقل من كل المحطات العشر. المتبقي: ${missing.length}.`);
  const context = Array.from(latestByStation.values()).map(path => {
    const output = parseMiniWorkstationOutput(path.outputJson);
    const role = getMiniWorkstationRole(path.stationKey);
    return `${role?.title ?? path.stationKey}: ${output.summary}\nالنتائج: ${output.findings.slice(0, 3).join(" | ")}`;
  }).join("\n\n").slice(0, 12_000);
  const response = await invokeLLM({
    model: "gpt-5-mini",
    maxCompletionTokens: 1200,
    reasoning: { effort: "low" },
    response_format: miniWorkstationOutputSchema,
    messages: [
      { role: "system", content: miniWorkstationSafetyInstruction },
      { role: "system", content: "أنت منسق مراجعة الفريق. اجمع مخرجات المحطات العشر إلى مسودة قرار هندسية موجزة. لا تدمج شيفرة ولا تحذف محطات ولا تعدل ملفات أو بنية أو حسابات. اجعل كل التوصيات خطوات يوافق عليها المالك." },
      { role: "user", content: `مخرجات المحطات العشر للمراجعة اليدوية:\n${context}` },
    ],
  });
  const content = response.choices[0]?.message.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("لم يُرجع محرك الذكاء مسودة تجميع صالحة. حاول لاحقًا.");
  const output = parseMiniWorkstationOutput(content);
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  await db.insert(miniWorkstationPaths).values({
    ownerId,
    stationKey: "team-consolidation",
    request: "مسودة تجميع يدوية لمخرجات المحطات العشر.",
    headline: output.headline,
    outputJson: JSON.stringify(output),
    model: "gpt-5-mini",
    reviewStatus: "completed",
  });
  const [saved] = await db.select().from(miniWorkstationPaths).where(eq(miniWorkstationPaths.ownerId, ownerId)).orderBy(desc(miniWorkstationPaths.id)).limit(1);
  if (!saved) throw new Error("تعذر حفظ مسودة تجميع الفريق.");
  return { path: saved, output, usage: response.usage ?? null };
}

export async function updateMiniWorkstationPathReview(input: { ownerId: number; id: number; reviewStatus: "reviewed" | "archived" }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const ownerPath = and(eq(miniWorkstationPaths.id, input.id), eq(miniWorkstationPaths.ownerId, input.ownerId));
  const [current] = await db.select({ id: miniWorkstationPaths.id }).from(miniWorkstationPaths).where(ownerPath).limit(1);
  if (!current) throw new Error("مسار المحطة غير موجود.");
  const updated = await db.update(miniWorkstationPaths).set({ reviewStatus: input.reviewStatus }).where(ownerPath);
  if (!updated[0]?.affectedRows) throw new Error("مسار المحطة غير متاح في مساحة المالك.");
  return { id: input.id, reviewStatus: input.reviewStatus } as const;
}
