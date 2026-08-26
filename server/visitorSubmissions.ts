import { and, desc, eq } from "drizzle-orm";
import { visitorSubmissionAttachments, visitorSubmissions } from "../drizzle/schema";
import { validateVisitorSubmission, type VisitorAttachmentInput } from "../shared/visitorSubmissionPolicy";
import { getDb } from "./db";
import { storageGetSignedUrl, storagePut } from "./storage";

export async function submitVisitorContribution(input: { visitorAlias?: string; category: "opinion" | "media" | "code" | "project"; title: string; content: string; consentAccepted: boolean; attachments: VisitorAttachmentInput[] }) {
  const validated = validateVisitorSubmission(input);
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  await db.insert(visitorSubmissions).values({ visitorAlias: validated.visitorAlias, category: input.category, title: validated.title, content: validated.content, consentAccepted: true, status: "pending" });
  const [submission] = await db.select().from(visitorSubmissions).orderBy(desc(visitorSubmissions.id)).limit(1);
  if (!submission) throw new Error("تعذر حفظ المشاركة");
  for (const attachment of validated.attachments) {
    const uploaded = await storagePut(`visitor-submissions/pending/${submission.id}/${attachment.safeName}`, attachment.data, attachment.mimeType);
    await db.insert(visitorSubmissionAttachments).values({ submissionId: submission.id, kind: attachment.kind, safeName: attachment.safeName, mimeType: attachment.mimeType, sizeBytes: attachment.sizeBytes, storageKey: uploaded.key });
  }
  return { id: submission.id, status: "pending" as const };
}

export async function listVisitorSubmissionsForOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  const submissions = await db.select().from(visitorSubmissions).orderBy(desc(visitorSubmissions.updatedAt)).limit(100);
  return Promise.all(submissions.map(async submission => ({ ...submission, attachments: await db.select().from(visitorSubmissionAttachments).where(eq(visitorSubmissionAttachments.submissionId, submission.id)) })));
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
