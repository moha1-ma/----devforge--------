import { and, asc, desc, eq } from "drizzle-orm";
import { buildPlans, buildPlanSteps } from "../drizzle/schema";
import { buildBlueprints, BuildBlueprintKey, isBuildBlueprintKey } from "../shared/buildBlueprints";
import { getDb } from "./db";

async function getOwnedPlan(ownerId: number, planId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const [plan] = await db.select().from(buildPlans).where(and(eq(buildPlans.id, planId), eq(buildPlans.ownerId, ownerId))).limit(1);
  if (!plan) throw new Error("الخطة غير متاحة في مساحة العمل الحالية");
  return { db, plan };
}

export async function listBuildPlans(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(buildPlans).where(eq(buildPlans.ownerId, ownerId)).orderBy(desc(buildPlans.updatedAt));
}

export async function getBuildPlan(ownerId: number, planId: number) {
  const { db, plan } = await getOwnedPlan(ownerId, planId);
  const steps = await db.select().from(buildPlanSteps).where(eq(buildPlanSteps.planId, planId)).orderBy(asc(buildPlanSteps.stepOrder));
  return { plan, steps };
}

export async function createBuildPlan(input: { ownerId: number; blueprint: BuildBlueprintKey; title?: string }) {
  if (!isBuildBlueprintKey(input.blueprint)) throw new Error("نوع الخطة غير مدعوم");
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const blueprint = buildBlueprints[input.blueprint];
  await db.insert(buildPlans).values({ ownerId: input.ownerId, blueprint: input.blueprint, title: input.title?.trim() || blueprint.title, status: "active" });
  const [plan] = await db.select().from(buildPlans).where(eq(buildPlans.ownerId, input.ownerId)).orderBy(desc(buildPlans.id)).limit(1);
  if (!plan) throw new Error("تعذر إنشاء الخطة");
  await db.insert(buildPlanSteps).values(blueprint.steps.map((step, index) => ({ planId: plan.id, stepKey: step.key, title: step.title, description: step.description, deliverable: step.deliverable, stepOrder: index + 1, status: index === 0 ? ("in-progress" as const) : ("not-started" as const) })));
  return getBuildPlan(input.ownerId, plan.id);
}

export async function updateBuildPlanStep(input: { ownerId: number; planId: number; stepId: number; status: "not-started" | "in-progress" | "done" }) {
  const { db } = await getOwnedPlan(input.ownerId, input.planId);
  const [step] = await db.select().from(buildPlanSteps).where(and(eq(buildPlanSteps.id, input.stepId), eq(buildPlanSteps.planId, input.planId))).limit(1);
  if (!step) throw new Error("خطوة الخطة غير متاحة");
  await db.update(buildPlanSteps).set({ status: input.status }).where(eq(buildPlanSteps.id, step.id));
  const updatedSteps = await db.select().from(buildPlanSteps).where(eq(buildPlanSteps.planId, input.planId));
  const complete = updatedSteps.every(candidate => candidate.id === step.id ? input.status === "done" : candidate.status === "done");
  await db.update(buildPlans).set({ status: complete ? "complete" : "active", updatedAt: new Date() }).where(eq(buildPlans.id, input.planId));
  return { success: true, status: input.status } as const;
}
