import { and, desc, eq } from "drizzle-orm";
import { projects, sourceFiles, websiteBuilds } from "../drizzle/schema";
import { createWebsiteStarterFiles, type WebsiteStarterInput } from "../shared/websiteStarter";
import { createSupabaseStarterFiles } from "../shared/supabaseStarter";
import { getDb } from "./db";
import { createPrivateSourceFile } from "./privateWorkspace";

function createProjectKey() {
  return `SITE-${Date.now().toString(36).toUpperCase()}`.slice(0, 16);
}

function normalizeDomain(value: string) {
  const domain = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) throw new Error("اكتب اسم نطاق صالحًا مثل example.com");
  return domain;
}

export async function listWebsiteBuilds(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(websiteBuilds).where(eq(websiteBuilds.ownerId, ownerId)).orderBy(desc(websiteBuilds.updatedAt));
}

export async function createWebsiteBuild(input: WebsiteStarterInput & { ownerId: number }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const title = input.title.trim();
  const desiredDomain = input.desiredDomain?.trim() ? normalizeDomain(input.desiredDomain) : undefined;
  await db.insert(projects).values({
    ownerId: input.ownerId,
    name: title,
    key: createProjectKey(),
    description: input.brief.trim(),
    defaultBranch: "main",
    health: "on-track",
  });
  const [project] = await db.select().from(projects).where(and(eq(projects.ownerId, input.ownerId), eq(projects.name, title))).orderBy(desc(projects.id)).limit(1);
  if (!project) throw new Error("تعذر إنشاء مشروع الموقع");

  await db.insert(websiteBuilds).values({
    ownerId: input.ownerId,
    projectId: project.id,
    title,
    businessType: input.businessType.trim(),
    brief: input.brief.trim(),
    visualPreset: input.visualPreset,
    palette: input.palette,
    primaryCta: input.primaryCta.trim(),
    domainCandidate: desiredDomain,
    domainStatus: desiredDomain ? "verification-ready" : "not-requested",
    generationStatus: "generated",
  });
  const files = createWebsiteStarterFiles({ ...input, desiredDomain });
  await Promise.all(Object.entries(files).map(([path, content]) => createPrivateSourceFile({ ownerId: input.ownerId, projectId: project.id, path, content, note: "قالب موقع أنشأه Website Studio" })));
  const [build] = await db.select().from(websiteBuilds).where(eq(websiteBuilds.projectId, project.id)).limit(1);
  return { build, project, files: Object.keys(files) };
}

export async function prepareWebsiteDomain(input: { ownerId: number; websiteBuildId: number; domain: string }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const [build] = await db.select().from(websiteBuilds).where(and(eq(websiteBuilds.id, input.websiteBuildId), eq(websiteBuilds.ownerId, input.ownerId))).limit(1);
  if (!build) throw new Error("الموقع غير متاح في مساحة العمل الحالية");
  const domainCandidate = normalizeDomain(input.domain);
  await db.update(websiteBuilds).set({ domainCandidate, domainStatus: "verification-ready", updatedAt: new Date() }).where(eq(websiteBuilds.id, build.id));
  return { success: true, domainCandidate, domainStatus: "verification-ready" as const };
}

export async function addSupabaseStarter(input: { ownerId: number; websiteBuildId: number }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const [build] = await db.select().from(websiteBuilds).where(and(eq(websiteBuilds.id, input.websiteBuildId), eq(websiteBuilds.ownerId, input.ownerId))).limit(1);
  if (!build) throw new Error("الموقع غير متاح في مساحة العمل الحالية");
  const existing = await db.select({ path: sourceFiles.path }).from(sourceFiles).where(and(eq(sourceFiles.ownerId, input.ownerId), eq(sourceFiles.projectId, build.projectId)));
  const files = createSupabaseStarterFiles(build.title);
  const pending = Object.entries(files).filter(([path]) => !existing.some(file => file.path === path));
  await Promise.all(pending.map(([path, content]) => createPrivateSourceFile({ ownerId: input.ownerId, projectId: build.projectId, path, content, note: "حزمة Supabase آمنة من Website Studio" })));
  await db.update(websiteBuilds).set({ supabaseStarterStatus: "starter-added", updatedAt: new Date() }).where(eq(websiteBuilds.id, build.id));
  return { success: true, projectId: build.projectId, files: Object.keys(files), alreadyPrepared: pending.length === 0 };
}
