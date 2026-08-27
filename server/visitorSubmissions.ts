import { and, desc, eq, inArray, lt } from "drizzle-orm";
import { visitorSubmissionAttachments, visitorSubmissions } from "../drizzle/schema";
import { validateVisitorSubmission, type VisitorAttachmentInput } from "../shared/visitorSubmissionPolicy";
import { getDb } from "./db";
import { storageGet, storageGetSignedUrl, storagePut } from "./storage";
import { notifyOwnerOfVisitorSubmission } from "./siteNotifications";

export async function submitVisitorContribution(input: { visitorAlias?: string; category: "opinion" | "media" | "code" | "project"; title: string; content: string; mediaReferenceUrl?: string; consentAccepted: boolean; attachments: VisitorAttachmentInput[] }) {
  const validated = validateVisitorSubmission(input);
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const [created] = await db.insert(visitorSubmissions).values({ visitorAlias: validated.visitorAlias, category: input.category, title: validated.title, content: validated.content, mediaReferenceUrl: validated.mediaReferenceUrl, consentAccepted: true, status: "pending" }).$returningId();
  const submissionId = created?.id;
  if (!submissionId) throw new Error("تعذر حفظ المشاركة");
  for (const attachment of validated.attachments) {
    const uploaded = await storagePut(`visitor-submissions/pending/${submissionId}/${attachment.safeName}`, attachment.data, attachment.mimeType);
    await db.insert(visitorSubmissionAttachments).values({ submissionId, kind: attachment.kind, safeName: attachment.safeName, mimeType: attachment.mimeType, sizeBytes: attachment.sizeBytes, storageKey: uploaded.key });
  }
  await notifyOwnerOfVisitorSubmission();
  return { id: submissionId, status: "pending" as const };
}

export async function listVisitorSubmissionsForOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  const submissions = await db.select().from(visitorSubmissions).orderBy(desc(visitorSubmissions.updatedAt)).limit(100);
  return Promise.all(submissions.map(async submission => ({ ...submission, attachments: await db.select().from(visitorSubmissionAttachments).where(eq(visitorSubmissionAttachments.submissionId, submission.id)) })));
}

export async function listApprovedVisitorFeed(input: { cursor?: number; limit?: number } = {}) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const limit = Math.min(Math.max(input.limit ?? 6, 1), 12);
  const filter = input.cursor
    ? and(eq(visitorSubmissions.status, "approved"), lt(visitorSubmissions.id, input.cursor))
    : eq(visitorSubmissions.status, "approved");
  const page = await db.select().from(visitorSubmissions).where(filter).orderBy(desc(visitorSubmissions.createdAt), desc(visitorSubmissions.id)).limit(limit + 1);
  const items = page.filter(item => item.status === "approved").slice(0, limit);
  const attachmentRows = items.length
    ? await db.select().from(visitorSubmissionAttachments).where(inArray(visitorSubmissionAttachments.submissionId, items.map(item => item.id)))
    : [];
  const publicAttachments = await Promise.all(attachmentRows
    .filter(attachment => attachment.kind === "image" || attachment.kind === "video")
    .map(async attachment => ({ id: attachment.id, submissionId: attachment.submissionId, kind: attachment.kind as "image" | "video", mimeType: attachment.mimeType, safeName: attachment.safeName, url: (await storageGet(attachment.storageKey)).url })));
  return {
    items: items.map(item => ({
      id: item.id,
      visitorAlias: item.visitorAlias,
      category: item.category,
      title: item.title,
      content: item.content,
      mediaReferenceUrl: item.mediaReferenceUrl,
      createdAt: item.createdAt,
      attachments: publicAttachments
        .filter(attachment => attachment.submissionId === item.id)
        .map(({ submissionId: _submissionId, ...attachment }) => attachment),
    })),
    nextCursor: page.length > limit ? items.at(-1)?.id ?? null : null,
  };
}

export async function moderateVisitorSubmission(input: { ownerId: number; submissionId: number; status: "approved" | "rejected"; moderationNote?: string }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const note = input.moderationNote?.trim() || null;
  await db.update(visitorSubmissions).set({ status: input.status, moderationNote: note, moderatorId: input.ownerId, updatedAt: new Date() }).where(eq(visitorSubmissions.id, input.submissionId));
  const [updated] = await db.select().from(visitorSubmissions).where(and(eq(visitorSubmissions.id, input.submissionId), eq(visitorSubmissions.moderatorId, input.ownerId))).limit(1);
  if (!updated) throw new Error("المشاركة غير متاحة للمراجعة");
  return updated;
}

export async function getPrivateVisitorAttachment(ownerId: number, attachmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const [attachment] = await db.select().from(visitorSubmissionAttachments).where(eq(visitorSubmissionAttachments.id, attachmentId)).limit(1);
  if (!attachment) throw new Error("المرفق غير موجود");
  const signedUrl = await storageGetSignedUrl(attachment.storageKey);
  const response = await fetch(signedUrl);
  if (!response.ok) throw new Error("تعذر تحميل المرفق الخاص");
  const data = Buffer.from(await response.arrayBuffer());
  return { attachment, base64: data.toString("base64") };
}
