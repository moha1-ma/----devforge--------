import { int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  key: varchar("key", { length: 16 }).notNull(),
  description: text("description"),
  repositoryUrl: varchar("repositoryUrl", { length: 500 }),
  defaultBranch: varchar("defaultBranch", { length: 120 }).default("main").notNull(),
  health: mysqlEnum("health", ["on-track", "watch", "at-risk"]).default("on-track").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const workItems = mysqlTable("workItems", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  key: varchar("key", { length: 32 }).notNull(),
  title: varchar("title", { length: 240 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["backlog", "in-progress", "review", "done"]).default("backlog").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  assigneeId: int("assigneeId").references(() => users.id, { onDelete: "set null" }),
  dueAt: timestamp("dueAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const pullRequests = mysqlTable("pullRequests", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  number: int("number").notNull(),
  title: varchar("title", { length: 240 }).notNull(),
  status: mysqlEnum("status", ["open", "approved", "merged", "changes-requested"]).default("open").notNull(),
  authorId: int("authorId").references(() => users.id, { onDelete: "set null" }),
  reviewerCount: int("reviewerCount").default(0).notNull(),
  checksPassed: int("checksPassed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const releases = mysqlTable("releases", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  version: varchar("version", { length: 64 }).notNull(),
  environment: mysqlEnum("environment", ["development", "staging", "production"]).notNull(),
  status: mysqlEnum("status", ["queued", "deploying", "success", "failed", "rolled-back"]).default("queued").notNull(),
  deployedAt: timestamp("deployedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const deployments = mysqlTable("deployments", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  releaseId: int("releaseId").references(() => releases.id, { onDelete: "set null" }),
  environment: mysqlEnum("environment", ["development", "staging", "production"]).notNull(),
  status: mysqlEnum("status", ["queued", "running", "success", "failed", "rolled-back"]).default("queued").notNull(),
  commitSha: varchar("commitSha", { length: 64 }),
  triggeredById: int("triggeredById").references(() => users.id, { onDelete: "set null" }),
  startedAt: timestamp("startedAt"),
  finishedAt: timestamp("finishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const activityEvents = mysqlTable("activityEvents", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  actorId: int("actorId").references(() => users.id, { onDelete: "set null" }),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  subjectType: varchar("subjectType", { length: 64 }).notNull(),
  subjectId: int("subjectId"),
  summary: varchar("summary", { length: 500 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const sourceFiles = mysqlTable("sourceFiles", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  path: varchar("path", { length: 500 }).notNull(),
  language: varchar("language", { length: 64 }).notNull(),
  storageKey: varchar("storageKey", { length: 600 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  revisionCount: int("revisionCount").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("source_file_project_path_unique").on(table.projectId, table.path)]);

export const sourceFileRevisions = mysqlTable("sourceFileRevisions", {
  id: int("id").autoincrement().primaryKey(),
  sourceFileId: int("sourceFileId").notNull().references(() => sourceFiles.id, { onDelete: "cascade" }),
  authorId: int("authorId").notNull().references(() => users.id, { onDelete: "cascade" }),
  revisionNumber: int("revisionNumber").notNull(),
  storageKey: varchar("storageKey", { length: 600 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  note: varchar("note", { length: 240 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("source_file_revision_unique").on(table.sourceFileId, table.revisionNumber)]);

export const aiThreads = mysqlTable("aiThreads", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: int("projectId").references(() => projects.id, { onDelete: "set null" }),
  title: varchar("title", { length: 180 }).notNull(),
  provider: mysqlEnum("provider", ["local", "managed", "disabled"]).default("disabled").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const aiMessages = mysqlTable("aiMessages", {
  id: int("id").autoincrement().primaryKey(),
  threadId: int("threadId").notNull().references(() => aiThreads.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const githubProjectLinks = mysqlTable("githubProjectLinks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  repositoryFullName: varchar("repositoryFullName", { length: 300 }).notNull(),
  defaultBranch: varchar("defaultBranch", { length: 120 }).default("main").notNull(),
  syncState: mysqlEnum("syncState", ["not-connected", "connected", "attention"]).default("not-connected").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("github_project_link_unique").on(table.projectId)]);

export const buildPlans = mysqlTable("buildPlans", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: int("projectId").references(() => projects.id, { onDelete: "set null" }),
  blueprint: mysqlEnum("blueprint", ["web", "mobile", "api", "product"]).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  status: mysqlEnum("status", ["active", "complete", "archived"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const buildPlanSteps = mysqlTable("buildPlanSteps", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").notNull().references(() => buildPlans.id, { onDelete: "cascade" }),
  stepKey: varchar("stepKey", { length: 64 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description").notNull(),
  deliverable: varchar("deliverable", { length: 240 }).notNull(),
  stepOrder: int("stepOrder").notNull(),
  status: mysqlEnum("status", ["not-started", "in-progress", "done"]).default("not-started").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("build_plan_step_unique").on(table.planId, table.stepKey)]);

export const aiImageAssets = mysqlTable("aiImageAssets", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: int("projectId").references(() => projects.id, { onDelete: "set null" }),
  prompt: text("prompt").notNull(),
  imageUrl: varchar("imageUrl", { length: 1000 }).notNull(),
  model: varchar("model", { length: 120 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const websiteBuilds = mysqlTable("websiteBuilds", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 180 }).notNull(),
  businessType: varchar("businessType", { length: 120 }).notNull(),
  brief: text("brief").notNull(),
  visualPreset: mysqlEnum("visualPreset", ["studio", "commerce", "portfolio", "launch"]).notNull(),
  palette: varchar("palette", { length: 64 }).notNull(),
  primaryCta: varchar("primaryCta", { length: 120 }).notNull(),
  domainCandidate: varchar("domainCandidate", { length: 253 }),
  domainStatus: mysqlEnum("domainStatus", ["not-requested", "verification-ready", "connected"]).default("not-requested").notNull(),
  generationStatus: mysqlEnum("generationStatus", ["generated", "updated"]).default("generated").notNull(),
  supabaseStarterStatus: mysqlEnum("supabaseStarterStatus", ["not-prepared", "starter-added"]).default("not-prepared").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("website_build_project_unique").on(table.projectId)]);

export const domainCatalogItems = mysqlTable("domainCatalogItems", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  domainName: varchar("domainName", { length: 253 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  intendedUse: varchar("intendedUse", { length: 180 }).notNull(),
  status: mysqlEnum("status", ["proposed", "verification-needed", "shortlisted"]).default("proposed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("domain_catalog_owner_name_unique").on(table.ownerId, table.domainName)]);

export const integrationPreferences = mysqlTable("integrationPreferences", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  providerKey: varchar("providerKey", { length: 80 }).notNull(),
  status: mysqlEnum("status", ["not-connected", "request-recorded"]).default("not-connected").notNull(),
  requestedScope: varchar("requestedScope", { length: 120 }).default("metadata-only").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("integration_preference_owner_provider_unique").on(table.ownerId, table.providerKey)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type WorkItem = typeof workItems.$inferSelect;
export type PullRequest = typeof pullRequests.$inferSelect;
export type Release = typeof releases.$inferSelect;
export type Deployment = typeof deployments.$inferSelect;
export type ActivityEvent = typeof activityEvents.$inferSelect;
export type SourceFile = typeof sourceFiles.$inferSelect;
export type SourceFileRevision = typeof sourceFileRevisions.$inferSelect;
export type AiThread = typeof aiThreads.$inferSelect;
export type AiMessage = typeof aiMessages.$inferSelect;
export type GithubProjectLink = typeof githubProjectLinks.$inferSelect;
export type BuildPlan = typeof buildPlans.$inferSelect;
export type BuildPlanStep = typeof buildPlanSteps.$inferSelect;
export type AiImageAsset = typeof aiImageAssets.$inferSelect;
export type WebsiteBuild = typeof websiteBuilds.$inferSelect;
export type DomainCatalogItem = typeof domainCatalogItems.$inferSelect;
export type IntegrationPreference = typeof integrationPreferences.$inferSelect;
