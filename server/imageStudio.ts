import { and, desc, eq } from "drizzle-orm";
import { aiImageAssets, projects } from "../drizzle/schema";
import { generateImage } from "./_core/imageGeneration";
import { getDb } from "./db";

export async function listPrivateAiImages(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiImageAssets).where(eq(aiImageAssets.ownerId, ownerId)).orderBy(desc(aiImageAssets.createdAt)).limit(36);
}

export async function createPrivateAiImage(input: { ownerId: number; prompt: string; projectId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  if (input.projectId) {
    const [project] = await db.select().from(projects).where(and(eq(projects.id, input.projectId), eq(projects.ownerId, input.ownerId))).limit(1);
    if (!project) throw new Error("المشروع غير متاح في مساحة العمل الحالية");
  }
  const prompt = input.prompt.trim();
  if (prompt.length < 12) throw new Error("اكتب وصفًا أوضح للصورة المطلوبة");
  const enrichedPrompt = `Create a professional, original visual asset for a software project. ${prompt}. Do not include text, watermarks, brand logos, or UI screenshots unless explicitly requested.`;
  const result = await generateImage({ prompt: enrichedPrompt });
  if (!result.url) throw new Error("لم تُرجع خدمة الصور رابطًا صالحًا");
  await db.insert(aiImageAssets).values({ ownerId: input.ownerId, projectId: input.projectId, prompt, imageUrl: result.url, model: "MODEL_GPT_IMAGE_2" });
  const [asset] = await db.select().from(aiImageAssets).where(eq(aiImageAssets.ownerId, input.ownerId)).orderBy(desc(aiImageAssets.id)).limit(1);
  return asset;
}
