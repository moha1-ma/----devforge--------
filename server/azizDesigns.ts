import { and, count, desc, eq } from "drizzle-orm";
import { azizDesignAssets } from "../drizzle/schema";
import { azizDesignCollections, findAzizCollection, type AzizCollectionKey } from "../shared/azizDesignCatalog";
import { invokeLLM } from "./_core/llm";
import { validateAzizDesignBrief } from "./azizDesignPolicy";
import { getDb } from "./db";

type AzizDraftOutput = { executionStatus: "review-only"; headline: string; concept: string; layout: string[]; palette: string[]; ownerReview: string[]; rightsReminder: string };

const outputSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "aziz_design_draft",
    strict: true,
    schema: {
      type: "object",
      properties: {
        executionStatus: { type: "string", enum: ["review-only"] }, headline: { type: "string" }, concept: { type: "string" },
        layout: { type: "array", items: { type: "string" } }, palette: { type: "array", items: { type: "string" } },
        ownerReview: { type: "array", items: { type: "string" } }, rightsReminder: { type: "string" },
      },
      required: ["executionStatus", "headline", "concept", "layout", "palette", "ownerReview", "rightsReminder"],
      additionalProperties: false,
    },
  },
};

function parseOutput(content: string): AzizDraftOutput {
  const parsed = JSON.parse(content) as AzizDraftOutput;
  if (parsed.executionStatus !== "review-only" || !parsed.headline?.trim() || !parsed.concept?.trim() || !Array.isArray(parsed.layout) || !Array.isArray(parsed.palette) || !Array.isArray(parsed.ownerReview) || !parsed.rightsReminder?.trim()) throw new Error("تعذر التحقق من مسودة التصميم.");
  return {
    executionStatus: "review-only",
    headline: parsed.headline.trim().slice(0, 160), concept: parsed.concept.trim().slice(0, 2600),
    layout: parsed.layout.filter(item => typeof item === "string").map(item => item.trim().slice(0, 500)).filter(Boolean).slice(0, 8),
    palette: parsed.palette.filter(item => typeof item === "string").map(item => item.trim().slice(0, 120)).filter(Boolean).slice(0, 8),
    ownerReview: parsed.ownerReview.filter(item => typeof item === "string").map(item => item.trim().slice(0, 500)).filter(Boolean).slice(0, 6),
    rightsReminder: parsed.rightsReminder.trim().slice(0, 800),
  };
}

export async function listAzizMarketCollections() {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const rows = await db.select({ collectionKey: azizDesignAssets.collectionKey, approvedCount: count() }).from(azizDesignAssets).where(eq(azizDesignAssets.status, "approved")).groupBy(azizDesignAssets.collectionKey);
  const counts = new Map(rows.map(row => [row.collectionKey, Number(row.approvedCount)]));
  return azizDesignCollections.map(collection => ({ ...collection, approvedCount: counts.get(collection.key) ?? 0 }));
}

export async function listPublicAzizDesignAssets(collectionKey?: AzizCollectionKey) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const where = collectionKey ? and(eq(azizDesignAssets.status, "approved"), eq(azizDesignAssets.collectionKey, collectionKey)) : eq(azizDesignAssets.status, "approved");
  return db.select({ id: azizDesignAssets.id, collectionKey: azizDesignAssets.collectionKey, assetType: azizDesignAssets.assetType, title: azizDesignAssets.title, outputJson: azizDesignAssets.outputJson, sourceType: azizDesignAssets.sourceType, mediaUrl: azizDesignAssets.mediaUrl, updatedAt: azizDesignAssets.updatedAt }).from(azizDesignAssets).where(where).orderBy(desc(azizDesignAssets.updatedAt)).limit(120);
}

export async function listOwnerAzizDesignAssets(ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  return db.select().from(azizDesignAssets).where(eq(azizDesignAssets.ownerId, ownerId)).orderBy(desc(azizDesignAssets.updatedAt)).limit(100);
}

export async function createAzizDesignDraft(input: { ownerId: number; collectionKey: string; title: string; brief: string }) {
  const values = validateAzizDesignBrief(input);
  const response = await invokeLLM({
    model: "gpt-5-mini", maxCompletionTokens: 1200, response_format: outputSchema,
    messages: [
      { role: "system", content: "أنت مصمم مسودات محترف لسوق عزوز. أنشئ تصورًا نصيًا منظمًا للمراجعة فقط. لا تنشئ ملفًا أو صورة أو موقعًا أو رابطًا، ولا تدعِ تنفيذًا أو ملكية أو ترخيصًا. لا تستخدم علامات تجارية أو أسماء أعمال محمية دون نص صريح من المالك. ذكّر المالك بأن عليه تأكيد حق استخدام أي نص أو صورة قبل النشر. اجعل executionStatus دائمًا review-only." },
      { role: "system", content: `المجموعة: ${values.collection.name}؛ النوع: ${values.collection.assetType}؛ السعة المنشورة القصوى: ${values.collection.capacity}. المطلوب هو مسودة واحدة فقط.` },
      { role: "user", content: `عنوان المسودة: ${values.title}\nطلب المالك: ${values.brief}` },
    ],
  });
  const content = response.choices[0]?.message.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("لم يُرجع الذكاء مسودة تصميم صالحة. حاول طلبًا أوضح وأقصر.");
  const output = parseOutput(content);
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const [created] = await db.insert(azizDesignAssets).values({ ownerId: input.ownerId, collectionKey: values.collection.key, assetType: values.collection.assetType, title: values.title, brief: values.brief, outputJson: JSON.stringify(output), sourceType: "ai-draft", status: "draft" }).$returningId();
  return { id: created.id, output, usage: response.usage ?? null };
}

export async function updateAzizDesignReview(input: { ownerId: number; id: number; status: "pending" | "approved" | "rejected" | "archived"; moderationNote?: string; mediaUrl?: string }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const [asset] = await db.select().from(azizDesignAssets).where(and(eq(azizDesignAssets.id, input.id), eq(azizDesignAssets.ownerId, input.ownerId))).limit(1);
  if (!asset) throw new Error("مسودة التصميم غير متاحة في مساحة المالك.");
  const mediaUrl = input.mediaUrl?.trim() || asset.mediaUrl;
  if (input.status === "approved" && (!mediaUrl || !/^https:\/\//i.test(mediaUrl))) throw new Error("يتطلب النشر رابط وسائط HTTPS يثبت أصل التصميم قبل اعتماده.");
  if (input.status === "approved" && asset.status !== "approved") {
    const collection = findAzizCollection(asset.collectionKey);
    if (!collection) throw new Error("مجموعة التصميم غير معروفة.");
    const [row] = await db.select({ approvedCount: count() }).from(azizDesignAssets).where(and(eq(azizDesignAssets.collectionKey, asset.collectionKey), eq(azizDesignAssets.status, "approved")));
    if (Number(row?.approvedCount ?? 0) >= collection.capacity) throw new Error("بلغت هذه المجموعة سعتها المنشورة؛ راجع العناصر الحالية قبل اعتماد المزيد.");
  }
  await db.update(azizDesignAssets).set({ status: input.status, reviewerId: input.ownerId, moderationNote: input.moderationNote?.trim().slice(0, 500) || null, mediaUrl: mediaUrl || null, updatedAt: new Date() }).where(eq(azizDesignAssets.id, asset.id));
  return { id: asset.id, status: input.status, publiclyVisible: input.status === "approved" };
}
