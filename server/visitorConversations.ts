import { and, desc, eq } from "drizzle-orm";
import { visitorConversationMessages, visitorConversations } from "../drizzle/schema";
import { getDb } from "./db";

type ConversationScope = { userId: number; isOwner: boolean };

function cleanText(value: string, field: string, minimum: number, maximum: number) {
  const normalized = value.trim();
  if (normalized.length < minimum || normalized.length > maximum) throw new Error(`${field} يجب أن يتكون من ${minimum} إلى ${maximum} حرفًا`);
  return normalized;
}

async function getConversationInScope(input: ConversationScope & { conversationId: number }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const where = input.isOwner ? eq(visitorConversations.id, input.conversationId) : and(eq(visitorConversations.id, input.conversationId), eq(visitorConversations.visitorId, input.userId));
  const [conversation] = await db.select().from(visitorConversations).where(where).limit(1);
  if (!conversation) throw new Error("المحادثة غير متاحة لهذه الهوية");
  return { db, conversation };
}

export async function startVisitorConversation(input: { visitorId: number; subject: string; content: string }) {
  const subject = cleanText(input.subject, "عنوان الرسالة", 3, 180);
  const content = cleanText(input.content, "نص الرسالة", 3, 6000);
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  await db.insert(visitorConversations).values({ visitorId: input.visitorId, subject, status: "open", lastMessageAt: new Date() });
  const [conversation] = await db.select().from(visitorConversations).where(eq(visitorConversations.visitorId, input.visitorId)).orderBy(desc(visitorConversations.id)).limit(1);
  if (!conversation) throw new Error("تعذر بدء المحادثة");
  await db.insert(visitorConversationMessages).values({ conversationId: conversation.id, senderId: input.visitorId, senderRole: "visitor", content });
  return conversation;
}

export async function listVisitorConversations(scope: ConversationScope) {
  const db = await getDb();
  if (!db) return [];
  const conversations = await db.select().from(visitorConversations).where(scope.isOwner ? undefined : eq(visitorConversations.visitorId, scope.userId)).orderBy(desc(visitorConversations.lastMessageAt)).limit(100);
  return Promise.all(conversations.map(async conversation => ({ ...conversation, messages: await db.select().from(visitorConversationMessages).where(eq(visitorConversationMessages.conversationId, conversation.id)).orderBy(visitorConversationMessages.createdAt).limit(200) })));
}

export async function sendVisitorConversationMessage(input: ConversationScope & { conversationId: number; content: string }) {
  const content = cleanText(input.content, "نص الرسالة", 1, 6000);
  const { db, conversation } = await getConversationInScope(input);
  const senderRole = input.isOwner ? "owner" : "visitor";
  await db.insert(visitorConversationMessages).values({ conversationId: conversation.id, senderId: input.userId, senderRole, content });
  await db.update(visitorConversations).set({ status: "open", lastMessageAt: new Date(), updatedAt: new Date() }).where(eq(visitorConversations.id, conversation.id));
  return { conversationId: conversation.id, senderRole, status: "open" as const };
}

export async function closeVisitorConversation(input: ConversationScope & { conversationId: number }) {
  if (!input.isOwner) throw new Error("إغلاق المحادثات متاح للمالك فقط");
  const { db, conversation } = await getConversationInScope(input);
  await db.update(visitorConversations).set({ status: "closed", updatedAt: new Date() }).where(eq(visitorConversations.id, conversation.id));
  return { conversationId: conversation.id, status: "closed" as const };
}
