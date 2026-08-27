import { and, desc, eq } from "drizzle-orm";
import { marketplaceStores } from "../drizzle/schema";
import { canPublishMarketplaceStore, type MarketplaceStoreStatus, validateMarketplaceStore } from "./marketplacePolicy";
import { getDb } from "./db";

export async function listPublicMarketplaceStores() {
  const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  return db.select({ id: marketplaceStores.id, slug: marketplaceStores.slug, name: marketplaceStores.name, description: marketplaceStores.description, category: marketplaceStores.category, updatedAt: marketplaceStores.updatedAt }).from(marketplaceStores).where(eq(marketplaceStores.status, "approved")).orderBy(desc(marketplaceStores.updatedAt)).limit(100);
}

export async function listMyMarketplaceStores(ownerId: number) {
  const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  return db.select().from(marketplaceStores).where(eq(marketplaceStores.ownerId, ownerId)).orderBy(desc(marketplaceStores.updatedAt)).limit(100);
}

export async function requestMarketplaceStore(input: { ownerId: number; slug: string; name: string; description: string; category: string }) {
  const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const values = validateMarketplaceStore(input);
  const [existing] = await db.select({ id: marketplaceStores.id }).from(marketplaceStores).where(eq(marketplaceStores.slug, values.slug)).limit(1);
  if (existing) throw new Error("معرّف المتجر مستخدم بالفعل. اختر معرّفًا مختلفًا.");
  const [created] = await db.insert(marketplaceStores).values({ ownerId: input.ownerId, ...values, status: "pending" }).$returningId();
  return { id: created.id, status: "pending" as const };
}

export async function listMarketplaceReviewQueue() {
  const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  return db.select().from(marketplaceStores).where(eq(marketplaceStores.status, "pending")).orderBy(desc(marketplaceStores.createdAt)).limit(100);
}

export async function moderateMarketplaceStore(input: { ownerId: number; storeId: number; status: Extract<MarketplaceStoreStatus, "approved" | "rejected" | "archived">; note?: string }) {
  const db = await getDb(); if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const note = input.note?.trim() || null;
  await db.update(marketplaceStores).set({ status: input.status, reviewerId: input.ownerId, moderationNote: note, updatedAt: new Date() }).where(and(eq(marketplaceStores.id, input.storeId), eq(marketplaceStores.status, "pending")));
  return { id: input.storeId, status: input.status, publiclyVisible: canPublishMarketplaceStore(input.status) };
}
