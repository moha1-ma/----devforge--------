import { and, asc, desc, eq } from "drizzle-orm";
import { userAppPreferences } from "../drizzle/schema";
import type { AppKey } from "../shared/appRegistry";
import { getDb } from "./db";

// Lists a user's app preferences, pinned apps first (in display order),
// then unpinned apps by most recently opened.
export async function listUserAppPreferences(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(userAppPreferences)
    .where(eq(userAppPreferences.userId, userId))
    .orderBy(
      desc(userAppPreferences.isPinned),
      asc(userAppPreferences.displayOrder),
      desc(userAppPreferences.lastOpenedAt)
    );
}

// Pins or unpins an app for a user. Newly pinned apps are appended to the
// end of the pinned order; unpinning resets the display order to 0.
export async function setUserAppPinned(input: {
  userId: number;
  appKey: AppKey;
  isPinned: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const [lastPinned] = input.isPinned
    ? await db
        .select({ displayOrder: userAppPreferences.displayOrder })
        .from(userAppPreferences)
        .where(
          and(
            eq(userAppPreferences.userId, input.userId),
            eq(userAppPreferences.isPinned, true)
          )
        )
        .orderBy(desc(userAppPreferences.displayOrder))
        .limit(1)
    : [];
  const displayOrder = input.isPinned
    ? (lastPinned?.displayOrder ?? -1) + 1
    : 0;
  await db
    .insert(userAppPreferences)
    .values({ ...input, displayOrder })
    .onDuplicateKeyUpdate({
      set: { isPinned: input.isPinned, displayOrder, updatedAt: new Date() },
    });
  return listUserAppPreferences(input.userId);
}

// Sets the pinned display order for a user to match the given app key
// sequence, pinning every listed app.
export async function reorderPinnedApps(input: {
  userId: number;
  appKeys: AppKey[];
}) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  await db.transaction(async transaction => {
    for (
      let displayOrder = 0;
      displayOrder < input.appKeys.length;
      displayOrder += 1
    ) {
      const appKey = input.appKeys[displayOrder];
      await transaction
        .insert(userAppPreferences)
        .values({ userId: input.userId, appKey, isPinned: true, displayOrder })
        .onDuplicateKeyUpdate({
          set: { isPinned: true, displayOrder, updatedAt: new Date() },
        });
    }
  });
  return listUserAppPreferences(input.userId);
}

// Records that a user opened an app, updating its `lastOpenedAt` timestamp
// without changing pin state.
export async function touchUserApp(input: { userId: number; appKey: AppKey }) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  await db
    .insert(userAppPreferences)
    .values({ userId: input.userId, appKey: input.appKey, lastOpenedAt: now })
    .onDuplicateKeyUpdate({
      set: { lastOpenedAt: now, updatedAt: now },
    });
  return listUserAppPreferences(input.userId);
}
