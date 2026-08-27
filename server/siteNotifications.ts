import { and, desc, eq, isNull } from "drizzle-orm";
import { siteNotificationPreferences, siteNotifications, users } from "../drizzle/schema";
import { normalizeSiteNotification, type SiteNotificationCategory } from "../shared/siteNotificationPolicy";
import { ENV } from "./_core/env";
import { getDb } from "./db";

const defaultPreferences: { inAppEnabled: boolean; workspaceEnabled: boolean; communityEnabled: boolean; reviewEnabled: boolean; systemEnabled: boolean } = { inAppEnabled: true, workspaceEnabled: true, communityEnabled: true, reviewEnabled: true, systemEnabled: true };
type PreferenceKey = keyof typeof defaultPreferences;

function categoryPreferenceKey(category: SiteNotificationCategory): PreferenceKey {
  return category === "workspace" ? "workspaceEnabled" : category === "community" ? "communityEnabled" : category === "review" ? "reviewEnabled" : "systemEnabled";
}

export async function getSiteNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) return { userId, ...defaultPreferences };
  const [preferences] = await db.select().from(siteNotificationPreferences).where(eq(siteNotificationPreferences.userId, userId)).limit(1);
  return preferences ?? { userId, ...defaultPreferences };
}

export async function updateSiteNotificationPreferences(input: { userId: number } & Partial<typeof defaultPreferences>) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const { userId, ...changes } = input;
  const next = { ...defaultPreferences, ...changes };
  await db.insert(siteNotificationPreferences).values({ userId, ...next }).onDuplicateKeyUpdate({ set: { ...next, updatedAt: new Date() } });
  return getSiteNotificationPreferences(input.userId);
}

export async function listSiteNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteNotifications).where(eq(siteNotifications.userId, userId)).orderBy(desc(siteNotifications.createdAt), desc(siteNotifications.id)).limit(60);
}

export async function getUnreadSiteNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return { count: 0 };
  const rows = await db.select({ id: siteNotifications.id }).from(siteNotifications).where(and(eq(siteNotifications.userId, userId), isNull(siteNotifications.readAt))).limit(61);
  return { count: Math.min(rows.length, 60) };
}

export async function markSiteNotificationRead(input: { userId: number; notificationId: number }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const result = await db.update(siteNotifications).set({ readAt: new Date() }).where(and(eq(siteNotifications.id, input.notificationId), eq(siteNotifications.userId, input.userId), isNull(siteNotifications.readAt)));
  if (!result[0]?.affectedRows) {
    const [existing] = await db.select({ id: siteNotifications.id }).from(siteNotifications).where(and(eq(siteNotifications.id, input.notificationId), eq(siteNotifications.userId, input.userId))).limit(1);
    if (!existing) throw new Error("الإشعار غير متاح لهذا المستخدم.");
  }
  return { id: input.notificationId, read: true } as const;
}

export async function markAllSiteNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  await db.update(siteNotifications).set({ readAt: new Date() }).where(and(eq(siteNotifications.userId, userId), isNull(siteNotifications.readAt)));
  return { success: true } as const;
}

export async function createSiteNotification(input: { userId: number; category: SiteNotificationCategory; title: string; body: string; link?: string | null }) {
  const db = await getDb();
  if (!db) return null;
  const normalized = normalizeSiteNotification(input);
  const preferences = await getSiteNotificationPreferences(input.userId);
  if (!preferences.inAppEnabled || !preferences[categoryPreferenceKey(normalized.category)]) return null;
  await db.insert(siteNotifications).values({ userId: input.userId, ...normalized });
  const [saved] = await db.select().from(siteNotifications).where(eq(siteNotifications.userId, input.userId)).orderBy(desc(siteNotifications.id)).limit(1);
  return saved ?? null;
}

export async function notifyOwnerOfVisitorSubmission() {
  const db = await getDb();
  if (!db) return null;
  const [owner] = await db.select({ id: users.id }).from(users).where(eq(users.openId, ENV.ownerOpenId)).limit(1);
  if (!owner) return null;
  return createSiteNotification({
    userId: owner.id,
    category: "review",
    title: "مشاركة زائر جديدة بانتظار المراجعة",
    body: "وصلت مشاركة جديدة إلى طابور المراجعة. افتح مركز مراجعة مشاركات الزوار للاطلاع واتخاذ قرارك.",
    link: "/visitor-review",
  });
}
