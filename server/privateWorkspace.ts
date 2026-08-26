import { and, desc, eq } from "drizzle-orm";
import { aiMessages, aiThreads, githubProjectLinks, projects, sourceFileRevisions, sourceFiles } from "../drizzle/schema";
import { validateSourceFile } from "../shared/sourceFilePolicy";
import { getDb } from "./db";
import { normalizeGithubRepositoryInput } from "./githubRepositoryInput";
import { storageGetSignedUrl, storagePut } from "./storage";

async function getOwnedProject(ownerId: number, projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const result = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId))).limit(1);
  const project = result[0];
  if (!project) throw new Error("المشروع غير متاح في مساحة العمل الحالية");
  return { db, project };
}

async function getOwnedSourceFile(ownerId: number, sourceFileId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const result = await db.select().from(sourceFiles).where(and(eq(sourceFiles.id, sourceFileId), eq(sourceFiles.ownerId, ownerId))).limit(1);
  const file = result[0];
  if (!file) throw new Error("الملف غير متاح في مساحة العمل الحالية");
  return { db, file };
}

export async function listPrivateSourceFiles(ownerId: number, projectId: number) {
  const { db } = await getOwnedProject(ownerId, projectId);
  return db.select().from(sourceFiles).where(and(eq(sourceFiles.projectId, projectId), eq(sourceFiles.ownerId, ownerId))).orderBy(sourceFiles.path);
}

export async function createPrivateSourceFile(input: { ownerId: number; projectId: number; path: string; content: string; note?: string }) {
  const { db } = await getOwnedProject(input.ownerId, input.projectId);
  const validation = validateSourceFile(input.path, input.content);
  const upload = await storagePut(`private-source/${input.ownerId}/${input.projectId}/${validation.path}`, input.content, "text/plain; charset=utf-8");
  await db.insert(sourceFiles).values({
    ownerId: input.ownerId,
    projectId: input.projectId,
    path: validation.path,
    language: validation.language,
    storageKey: upload.key,
    sizeBytes: validation.sizeBytes,
    revisionCount: 1,
  });
  const [created] = await db.select().from(sourceFiles).where(and(eq(sourceFiles.ownerId, input.ownerId), eq(sourceFiles.projectId, input.projectId), eq(sourceFiles.path, validation.path))).limit(1);
  if (!created) throw new Error("تعذر إنشاء سجل الملف");
  await db.insert(sourceFileRevisions).values({
    sourceFileId: created.id,
    authorId: input.ownerId,
    revisionNumber: 1,
    storageKey: upload.key,
    sizeBytes: validation.sizeBytes,
    note: input.note?.trim() || "الاستيراد الأول",
  });
  return created;
}

export async function readPrivateSourceFile(ownerId: number, sourceFileId: number) {
  const { file } = await getOwnedSourceFile(ownerId, sourceFileId);
  const signedUrl = await storageGetSignedUrl(file.storageKey);
  const response = await fetch(signedUrl);
  if (!response.ok) throw new Error("تعذر قراءة محتوى الملف الخاص");
  return { file, content: await response.text() };
}

export async function savePrivateSourceRevision(input: { ownerId: number; sourceFileId: number; content: string; note?: string }) {
  const { db, file } = await getOwnedSourceFile(input.ownerId, input.sourceFileId);
  const validation = validateSourceFile(file.path, input.content);
  const nextRevision = file.revisionCount + 1;
  const upload = await storagePut(`private-source/${input.ownerId}/${file.projectId}/${validation.path}`, input.content, "text/plain; charset=utf-8");
  await db.insert(sourceFileRevisions).values({
    sourceFileId: file.id,
    authorId: input.ownerId,
    revisionNumber: nextRevision,
    storageKey: upload.key,
    sizeBytes: validation.sizeBytes,
    note: input.note?.trim() || "حفظ من المحرر",
  });
  await db.update(sourceFiles).set({ storageKey: upload.key, language: validation.language, sizeBytes: validation.sizeBytes, revisionCount: nextRevision }).where(eq(sourceFiles.id, file.id));
  return { ...file, storageKey: upload.key, language: validation.language, sizeBytes: validation.sizeBytes, revisionCount: nextRevision };
}

export async function listPrivateSourceRevisions(ownerId: number, sourceFileId: number) {
  const { db } = await getOwnedSourceFile(ownerId, sourceFileId);
  return db.select().from(sourceFileRevisions).where(eq(sourceFileRevisions.sourceFileId, sourceFileId)).orderBy(desc(sourceFileRevisions.revisionNumber));
}

export async function deletePrivateSourceFile(ownerId: number, sourceFileId: number) {
  const { db, file } = await getOwnedSourceFile(ownerId, sourceFileId);
  await db.delete(sourceFiles).where(eq(sourceFiles.id, file.id));
  return { success: true } as const;
}

export async function listPrivateAiThreads(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiThreads).where(eq(aiThreads.ownerId, ownerId)).orderBy(desc(aiThreads.updatedAt));
}

export async function createPrivateAiThread(input: { ownerId: number; title: string; projectId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  if (input.projectId) await getOwnedProject(input.ownerId, input.projectId);
  await db.insert(aiThreads).values({ ownerId: input.ownerId, projectId: input.projectId, title: input.title, provider: "managed" });
  const [thread] = await db.select().from(aiThreads).where(eq(aiThreads.ownerId, input.ownerId)).orderBy(desc(aiThreads.id)).limit(1);
  return thread;
}

export async function getPrivateAiMessages(ownerId: number, threadId: number) {
  const db = await getDb();
  if (!db) return [];
  const [thread] = await db.select().from(aiThreads).where(and(eq(aiThreads.id, threadId), eq(aiThreads.ownerId, ownerId))).limit(1);
  if (!thread) throw new Error("محادثة الذكاء الاصطناعي غير متاحة");
  return db.select().from(aiMessages).where(eq(aiMessages.threadId, threadId)).orderBy(aiMessages.createdAt);
}

export async function addPrivateAiMessage(input: { ownerId: number; threadId: number; role: "user" | "assistant" | "system"; content: string }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const [thread] = await db.select().from(aiThreads).where(and(eq(aiThreads.id, input.threadId), eq(aiThreads.ownerId, input.ownerId))).limit(1);
  if (!thread) throw new Error("محادثة الذكاء الاصطناعي غير متاحة");
  await db.insert(aiMessages).values({ threadId: input.threadId, role: input.role, content: input.content });
  await db.update(aiThreads).set({ updatedAt: new Date() }).where(eq(aiThreads.id, input.threadId));
  const [message] = await db.select().from(aiMessages).where(eq(aiMessages.threadId, input.threadId)).orderBy(desc(aiMessages.id)).limit(1);
  return message;
}

export async function markPrivateAiThreadManaged(ownerId: number, threadId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const [thread] = await db.select().from(aiThreads).where(and(eq(aiThreads.id, threadId), eq(aiThreads.ownerId, ownerId))).limit(1);
  if (!thread) throw new Error("محادثة الذكاء الاصطناعي غير متاحة");
  await db.update(aiThreads).set({ provider: "managed", updatedAt: new Date() }).where(eq(aiThreads.id, thread.id));
}

export async function getGithubProjectLink(ownerId: number, projectId: number) {
  const { db } = await getOwnedProject(ownerId, projectId);
  const [link] = await db.select().from(githubProjectLinks).where(and(eq(githubProjectLinks.ownerId, ownerId), eq(githubProjectLinks.projectId, projectId))).limit(1);
  return link ?? null;
}

export async function selectGithubRepository(input: { ownerId: number; projectId: number; repositoryFullName: string; defaultBranch: string }) {
  const { db } = await getOwnedProject(input.ownerId, input.projectId);
  const repositoryFullName = normalizeGithubRepositoryInput(input.repositoryFullName);
  const defaultBranch = input.defaultBranch.trim() || "main";
  await db.insert(githubProjectLinks).values({ ownerId: input.ownerId, projectId: input.projectId, repositoryFullName, defaultBranch, syncState: "not-connected" }).onDuplicateKeyUpdate({ set: { repositoryFullName, defaultBranch, syncState: "not-connected", updatedAt: new Date() } });
  return getGithubProjectLink(input.ownerId, input.projectId);
}
