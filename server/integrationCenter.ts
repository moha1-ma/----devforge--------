import { and, asc, eq } from "drizzle-orm";
import { integrationPreferences } from "../drizzle/schema";
import { getIntegrationDefinition } from "../shared/integrationCatalog";
import { getDb } from "./db";

export async function listIntegrationPreferences(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(integrationPreferences).where(eq(integrationPreferences.ownerId, ownerId)).orderBy(asc(integrationPreferences.providerKey));
}

export async function requestIntegrationPreference(input: { ownerId: number; providerKey: string }) {
  const definition = getIntegrationDefinition(input.providerKey);
  if (!definition) throw new Error("هذه المنصة غير مدعومة في مركز التكاملات حاليًا");
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  await db.insert(integrationPreferences).values({
    ownerId: input.ownerId,
    providerKey: definition.providerKey,
    status: "request-recorded",
    requestedScope: definition.requestedScope,
  }).onDuplicateKeyUpdate({
    set: { status: "request-recorded", requestedScope: definition.requestedScope, updatedAt: new Date() },
  });
  const [preference] = await db.select().from(integrationPreferences).where(and(eq(integrationPreferences.ownerId, input.ownerId), eq(integrationPreferences.providerKey, definition.providerKey))).limit(1);
  return preference;
}
