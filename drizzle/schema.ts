import { boolean, foreignKey, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

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

export const developerCenterProposals = mysqlTable("developerCenterProposals", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  mode: mysqlEnum("mode", ["software", "website", "titles", "security", "ai", "self-improvement"]).notNull(),
  languageKey: varchar("languageKey", { length: 48 }).default("python").notNull(),
  focus: mysqlEnum("focus", ["general", "security", "ai", "self-improvement"]).default("general").notNull(),
  brief: text("brief").notNull(),
  headline: varchar("headline", { length: 240 }).notNull(),
  proposalJson: text("proposalJson").notNull(),
  model: varchar("model", { length: 120 }).notNull(),
  reviewStatus: mysqlEnum("reviewStatus", ["draft", "reviewed", "archived"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const developerReviewTasks = mysqlTable("developerReviewTasks", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  proposalId: int("proposalId").references(() => developerCenterProposals.id, { onDelete: "cascade" }),
  taskKey: varchar("taskKey", { length: 80 }).notNull(),
  category: mysqlEnum("category", ["analysis", "security", "testing", "ai", "architecture"]).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  objective: text("objective").notNull(),
  requiresOwnerApproval: boolean("requiresOwnerApproval").default(true).notNull(),
  status: mysqlEnum("status", ["proposed", "reviewed", "archived"]).default("proposed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("developer_review_task_owner_key_unique").on(table.ownerId, table.taskKey)]);

export const miniWorkstationPaths = mysqlTable("miniWorkstationPaths", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  stationKey: varchar("stationKey", { length: 48 }).notNull(),
  request: text("request").notNull(),
  headline: varchar("headline", { length: 240 }).notNull(),
  outputJson: text("outputJson").notNull(),
  model: varchar("model", { length: 120 }).notNull(),
  reviewStatus: mysqlEnum("reviewStatus", ["completed", "reviewed", "archived"]).default("completed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("mini_workstation_owner_status_idx").on(table.ownerId, table.reviewStatus), index("mini_workstation_owner_station_idx").on(table.ownerId, table.stationKey)]);

export const siteNotificationPreferences = mysqlTable("siteNotificationPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  inAppEnabled: boolean("inAppEnabled").default(true).notNull(),
  workspaceEnabled: boolean("workspaceEnabled").default(true).notNull(),
  communityEnabled: boolean("communityEnabled").default(true).notNull(),
  reviewEnabled: boolean("reviewEnabled").default(true).notNull(),
  systemEnabled: boolean("systemEnabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("site_notification_preferences_user_unique").on(table.userId)]);

export const siteNotifications = mysqlTable("siteNotifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: mysqlEnum("category", ["workspace", "community", "review", "system"]).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: varchar("body", { length: 900 }).notNull(),
  link: varchar("link", { length: 160 }),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("site_notification_user_read_idx").on(table.userId, table.readAt), index("site_notification_user_created_idx").on(table.userId, table.createdAt)]);

export const visitorSubmissions = mysqlTable("visitorSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  visitorAlias: varchar("visitorAlias", { length: 80 }),
  category: mysqlEnum("category", ["opinion", "media", "code", "project"]).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  content: text("content").notNull(),
  consentAccepted: boolean("consentAccepted").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  moderatorId: int("moderatorId").references(() => users.id, { onDelete: "set null" }),
  moderationNote: varchar("moderationNote", { length: 500 }),
  mediaReferenceUrl: varchar("mediaReferenceUrl", { length: 1000 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const visitorSubmissionAttachments = mysqlTable("visitorSubmissionAttachments", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: int("submissionId").notNull().references(() => visitorSubmissions.id, { onDelete: "cascade" }),
  kind: mysqlEnum("kind", ["image", "video", "code"]).notNull(),
  safeName: varchar("safeName", { length: 180 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  storageKey: varchar("storageKey", { length: 600 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [foreignKey({ name: "vs_attachment_submission_fk", columns: [table.submissionId], foreignColumns: [visitorSubmissions.id] })]);

export const visitorConversations = mysqlTable("visitorConversations", {
  id: int("id").autoincrement().primaryKey(),
  visitorId: int("visitorId").notNull().references(() => users.id, { onDelete: "cascade" }),
  subject: varchar("subject", { length: 180 }).notNull(),
  status: mysqlEnum("status", ["open", "closed"]).default("open").notNull(),
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const visitorConversationMessages = mysqlTable("visitorConversationMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  senderId: int("senderId").notNull(),
  senderRole: mysqlEnum("senderRole", ["visitor", "owner"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  foreignKey({ name: "vcm_conv_fk", columns: [table.conversationId], foreignColumns: [visitorConversations.id] }).onDelete("cascade"),
  foreignKey({ name: "vcm_sender_fk", columns: [table.senderId], foreignColumns: [users.id] }).onDelete("cascade"),
]);

export const memberProfiles = mysqlTable("memberProfiles", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), alias: varchar("alias", { length: 48 }).notNull(), bio: varchar("bio", { length: 500 }), skills: varchar("skills", { length: 240 }), discoveryEnabled: boolean("discoveryEnabled").default(false).notNull(), status: mysqlEnum("status", ["active", "restricted"]).default("active").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("member_profile_user_unique").on(table.userId), foreignKey({ name: "mp_user_fk", columns: [table.userId], foreignColumns: [users.id] }).onDelete("cascade")]);

export const communities = mysqlTable("communities", {
  id: int("id").autoincrement().primaryKey(), ownerId: int("ownerId").notNull(), name: varchar("name", { length: 100 }).notNull(), description: text("description").notNull(), status: mysqlEnum("status", ["pending", "approved", "rejected", "archived"]).default("pending").notNull(), moderatorId: int("moderatorId"), moderationNote: varchar("moderationNote", { length: 500 }), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [foreignKey({ name: "comm_owner_fk", columns: [table.ownerId], foreignColumns: [users.id] }).onDelete("cascade"), foreignKey({ name: "comm_mod_fk", columns: [table.moderatorId], foreignColumns: [users.id] }).onDelete("set null")]);

export const communityMemberships = mysqlTable("communityMemberships", {
  id: int("id").autoincrement().primaryKey(), communityId: int("communityId").notNull(), userId: int("userId").notNull(), role: mysqlEnum("role", ["owner", "member"]).default("member").notNull(), status: mysqlEnum("status", ["pending", "approved", "rejected", "blocked"]).default("pending").notNull(), reviewerId: int("reviewerId"), moderationNote: varchar("moderationNote", { length: 500 }), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("comm_member_unique").on(table.communityId, table.userId), foreignKey({ name: "cm_comm_fk", columns: [table.communityId], foreignColumns: [communities.id] }).onDelete("cascade"), foreignKey({ name: "cm_user_fk", columns: [table.userId], foreignColumns: [users.id] }).onDelete("cascade"), foreignKey({ name: "cm_reviewer_fk", columns: [table.reviewerId], foreignColumns: [users.id] }).onDelete("set null")]);

export const communityPosts = mysqlTable("communityPosts", {
  id: int("id").autoincrement().primaryKey(), communityId: int("communityId").notNull(), authorId: int("authorId").notNull(), title: varchar("title", { length: 180 }).notNull(), content: text("content").notNull(), status: mysqlEnum("status", ["pending", "approved", "rejected", "archived"]).default("pending").notNull(), reviewerId: int("reviewerId"), moderationNote: varchar("moderationNote", { length: 500 }), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [foreignKey({ name: "cp_comm_fk", columns: [table.communityId], foreignColumns: [communities.id] }).onDelete("cascade"), foreignKey({ name: "cp_author_fk", columns: [table.authorId], foreignColumns: [users.id] }).onDelete("cascade"), foreignKey({ name: "cp_reviewer_fk", columns: [table.reviewerId], foreignColumns: [users.id] }).onDelete("set null")]);

export const communityReports = mysqlTable("communityReports", {
  id: int("id").autoincrement().primaryKey(), reporterId: int("reporterId").notNull(), targetType: mysqlEnum("targetType", ["community", "post", "member"]).notNull(), targetId: int("targetId").notNull(), reason: varchar("reason", { length: 500 }).notNull(), status: mysqlEnum("status", ["open", "resolved", "dismissed"]).default("open").notNull(), handlerId: int("handlerId"), resolutionNote: varchar("resolutionNote", { length: 500 }), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [foreignKey({ name: "cr_reporter_fk", columns: [table.reporterId], foreignColumns: [users.id] }).onDelete("cascade"), foreignKey({ name: "cr_handler_fk", columns: [table.handlerId], foreignColumns: [users.id] }).onDelete("set null")]);

export const periodicDevelopmentJobs = mysqlTable("periodicDevelopmentJobs", {
  id: int("id").autoincrement().primaryKey(), ownerId: int("ownerId").notNull(), cadence: mysqlEnum("cadence", ["hourly", "every-6-hours"]).default("every-6-hours").notNull(), status: mysqlEnum("status", ["active", "paused", "error"]).default("active").notNull(), scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }), lastRunKey: varchar("lastRunKey", { length: 80 }), lastRunAt: timestamp("lastRunAt"), lastError: varchar("lastError", { length: 500 }), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("pdj_owner_unique").on(table.ownerId), index("pdj_cron_uid_idx").on(table.scheduleCronTaskUid), foreignKey({ name: "pdj_owner_fk", columns: [table.ownerId], foreignColumns: [users.id] }).onDelete("cascade")]);

export const periodicDevelopmentDrafts = mysqlTable("periodicDevelopmentDrafts", {
  id: int("id").autoincrement().primaryKey(), jobId: int("jobId").notNull(), ownerId: int("ownerId").notNull(), kind: mysqlEnum("kind", ["architecture", "code", "tests", "conflicts"]).notNull(), status: mysqlEnum("status", ["proposed", "acknowledged", "dismissed"]).default("proposed").notNull(), title: varchar("title", { length: 180 }).notNull(), summary: text("summary").notNull(), proposedChanges: text("proposedChanges").notNull(), codeDraft: text("codeDraft").notNull(), testPlan: text("testPlan").notNull(), risks: text("risks").notNull(), approvalsRequired: text("approvalsRequired").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("pdd_job_idx").on(table.jobId), index("pdd_owner_status_idx").on(table.ownerId, table.status), foreignKey({ name: "pdd_job_fk", columns: [table.jobId], foreignColumns: [periodicDevelopmentJobs.id] }).onDelete("cascade"), foreignKey({ name: "pdd_owner_fk", columns: [table.ownerId], foreignColumns: [users.id] }).onDelete("cascade")]);

export const githubMergePlans = mysqlTable("githubMergePlans", {
  id: int("id").autoincrement().primaryKey(), ownerId: int("ownerId").notNull(), toolName: varchar("toolName", { length: 120 }).notNull(), brief: text("brief").notNull(), sourceJson: text("sourceJson").notNull(), planJson: text("planJson").notNull(), reviewStatus: mysqlEnum("reviewStatus", ["draft", "acknowledged", "dismissed"]).default("draft").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("gmp_owner_status_idx").on(table.ownerId, table.reviewStatus), foreignKey({ name: "gmp_owner_fk", columns: [table.ownerId], foreignColumns: [users.id] }).onDelete("cascade")]);

export const marketplaceStores = mysqlTable("marketplaceStores", {
  id: int("id").autoincrement().primaryKey(), ownerId: int("ownerId").notNull(), slug: varchar("slug", { length: 72 }).notNull(), name: varchar("name", { length: 120 }).notNull(), description: varchar("description", { length: 700 }).notNull(), category: varchar("category", { length: 80 }).notNull(), status: mysqlEnum("status", ["draft", "pending", "approved", "rejected", "archived"]).default("draft").notNull(), reviewerId: int("reviewerId"), moderationNote: varchar("moderationNote", { length: 500 }), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("marketplace_store_slug_unique").on(table.slug), index("marketplace_store_status_idx").on(table.status, table.updatedAt), index("marketplace_store_owner_idx").on(table.ownerId, table.updatedAt), foreignKey({ name: "marketplace_store_owner_fk", columns: [table.ownerId], foreignColumns: [users.id] }).onDelete("cascade"), foreignKey({ name: "marketplace_store_reviewer_fk", columns: [table.reviewerId], foreignColumns: [users.id] }).onDelete("set null")]);

export const azizDesignAssets = mysqlTable("azizDesignAssets", {
  id: int("id").autoincrement().primaryKey(), ownerId: int("ownerId").notNull(), collectionKey: mysqlEnum("collectionKey", ["aziz-1", "aziz-2", "aziz-3"]).notNull(), assetType: mysqlEnum("assetType", ["website-template", "business-card", "book-cover"]).notNull(), title: varchar("title", { length: 160 }).notNull(), brief: text("brief").notNull(), outputJson: text("outputJson").notNull(), sourceType: mysqlEnum("sourceType", ["ai-draft", "owner-upload", "licensed-reference"]).default("ai-draft").notNull(), mediaUrl: varchar("mediaUrl", { length: 1000 }), status: mysqlEnum("status", ["draft", "pending", "approved", "rejected", "archived"]).default("draft").notNull(), reviewerId: int("reviewerId"), moderationNote: varchar("moderationNote", { length: 500 }), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("aziz_asset_collection_status_idx").on(table.collectionKey, table.status, table.updatedAt), index("aziz_asset_owner_idx").on(table.ownerId, table.updatedAt), foreignKey({ name: "aziz_asset_owner_fk", columns: [table.ownerId], foreignColumns: [users.id] }).onDelete("cascade"), foreignKey({ name: "aziz_asset_reviewer_fk", columns: [table.reviewerId], foreignColumns: [users.id] }).onDelete("set null")]);

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
export type DeveloperCenterProposal = typeof developerCenterProposals.$inferSelect;
export type DeveloperReviewTask = typeof developerReviewTasks.$inferSelect;
export type MiniWorkstationPath = typeof miniWorkstationPaths.$inferSelect;
export type SiteNotificationPreference = typeof siteNotificationPreferences.$inferSelect;
export type SiteNotification = typeof siteNotifications.$inferSelect;
export type VisitorSubmission = typeof visitorSubmissions.$inferSelect;
export type VisitorSubmissionAttachment = typeof visitorSubmissionAttachments.$inferSelect;
export type VisitorConversation = typeof visitorConversations.$inferSelect;
export type VisitorConversationMessage = typeof visitorConversationMessages.$inferSelect;
export type MemberProfile = typeof memberProfiles.$inferSelect;
export type Community = typeof communities.$inferSelect;
export type CommunityMembership = typeof communityMemberships.$inferSelect;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type CommunityReport = typeof communityReports.$inferSelect;
export type PeriodicDevelopmentJob = typeof periodicDevelopmentJobs.$inferSelect;
export type PeriodicDevelopmentDraftRecord = typeof periodicDevelopmentDrafts.$inferSelect;
export type GithubMergePlan = typeof githubMergePlans.$inferSelect;
export type MarketplaceStore = typeof marketplaceStores.$inferSelect;
export type AzizDesignAsset = typeof azizDesignAssets.$inferSelect;
