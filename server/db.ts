import { desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { activityEvents, deployments, InsertUser, projects, pullRequests, releases, users, workItems } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: new Date() };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listProjectsForOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).where(eq(projects.ownerId, ownerId)).orderBy(desc(projects.updatedAt));
}

export async function createProjectForOwner(input: { ownerId: number; name: string; key: string; description?: string }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  await db.insert(projects).values({ ...input, key: input.key.toUpperCase() });
  const created = await db.select().from(projects).where(eq(projects.ownerId, input.ownerId)).orderBy(desc(projects.id)).limit(1);
  return created[0];
}

export async function createWorkItemForProject(input: {
  projectId: number;
  projectKey: string;
  title: string;
  priority: "low" | "medium" | "high" | "urgent";
}) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const existing = await db.select({ id: workItems.id }).from(workItems).where(eq(workItems.projectId, input.projectId));
  const key = `${input.projectKey.toUpperCase()}-${existing.length + 1}`;
  await db.insert(workItems).values({
    projectId: input.projectId,
    key,
    title: input.title,
    priority: input.priority,
    status: "backlog",
  });
  const created = await db.select().from(workItems).where(eq(workItems.projectId, input.projectId)).orderBy(desc(workItems.id)).limit(1);
  return created[0];
}

export async function getWorkspaceSummary(ownerId: number) {
  const db = await getDb();
  if (!db) return { projects: [], workItems: [], pullRequests: [], releases: [], deployments: [], activity: [] };
  const ownerProjects = await listProjectsForOwner(ownerId);
  const projectIds = ownerProjects.map(project => project.id);
  if (projectIds.length === 0) return { projects: ownerProjects, workItems: [], pullRequests: [], releases: [], deployments: [], activity: [] };

  const [items, prs, deploymentReleases, deploymentEvents, activity] = await Promise.all([
    db.select().from(workItems).where(inArray(workItems.projectId, projectIds)).orderBy(desc(workItems.updatedAt)).limit(12),
    db.select().from(pullRequests).where(inArray(pullRequests.projectId, projectIds)).orderBy(desc(pullRequests.updatedAt)).limit(12),
    db.select().from(releases).where(inArray(releases.projectId, projectIds)).orderBy(desc(releases.createdAt)).limit(12),
    db.select().from(deployments).where(inArray(deployments.projectId, projectIds)).orderBy(desc(deployments.createdAt)).limit(12),
    db.select().from(activityEvents).where(inArray(activityEvents.projectId, projectIds)).orderBy(desc(activityEvents.createdAt)).limit(16),
  ]);
  return { projects: ownerProjects, workItems: items, pullRequests: prs, releases: deploymentReleases, deployments: deploymentEvents, activity };
}
