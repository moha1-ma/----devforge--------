import { and, asc, eq } from "drizzle-orm";
import { domainCatalogItems } from "../drizzle/schema";
import { domainCatalogSeed } from "../shared/domainCatalog";
import { getDb } from "./db";

export async function listOwnerDomainCatalog(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(domainCatalogItems).where(eq(domainCatalogItems.ownerId, ownerId)).orderBy(asc(domainCatalogItems.domainName));
}

export async function seedOwnerDomainCatalog(ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const existing = await listOwnerDomainCatalog(ownerId);
  if (existing.length) return { items: existing, created: false };
  await db.insert(domainCatalogItems).values(domainCatalogSeed.map(([domainName, category, intendedUse]) => ({ ownerId, domainName, category, intendedUse, status: "proposed" as const })));
  return { items: await listOwnerDomainCatalog(ownerId), created: true };
}

export async function updateOwnerDomainStatus(input: { ownerId: number; domainId: number; status: "proposed" | "verification-needed" | "shortlisted" }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const [item] = await db.select().from(domainCatalogItems).where(and(eq(domainCatalogItems.id, input.domainId), eq(domainCatalogItems.ownerId, input.ownerId))).limit(1);
  if (!item) throw new Error("اسم النطاق غير متاح في مساحة العمل الحالية");
  await db.update(domainCatalogItems).set({ status: input.status, updatedAt: new Date() }).where(eq(domainCatalogItems.id, item.id));
  return { ...item, status: input.status };
}
