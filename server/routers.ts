import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createProjectForOwner, createWorkItemForProject, getWorkspaceSummary, listProjectsForOwner } from "./db";
import { addPrivateAiMessage, createPrivateAiThread, createPrivateSourceFile, deletePrivateSourceFile, getPrivateAiMessages, listPrivateAiThreads, listPrivateSourceFiles, listPrivateSourceRevisions, readPrivateSourceFile, savePrivateSourceRevision } from "./privateWorkspace";
import { getGithubProjectLink, selectGithubRepository } from "./privateWorkspace";
import { verifyOwnerRecoveryCode } from "./ownerAccess";
import { createBuildPlan, getBuildPlan, listBuildPlans, updateBuildPlanStep } from "./buildPlans";
import { createPrivateAiImage, listPrivateAiImages } from "./imageStudio";
import { askPrivateAiAssistant } from "./aiAssistant";
import { verifyGithubImportForOwner } from "./githubImportVerification";
import { addSupabaseStarter, createWebsiteBuild, listWebsiteBuilds, prepareWebsiteDomain } from "./websiteBuilder";
import { listOwnerDomainCatalog, seedOwnerDomainCatalog, updateOwnerDomainStatus } from "./domainCatalog";
import { listIntegrationPreferences, requestIntegrationPreference } from "./integrationCenter";
import { listGlobalResearchSources, searchGlobalResearch, searchUnifiedGlobalResearch } from "./globalResearch";
import { researchModes } from "./aiResearchPolicy";
import { developerCenterFocuses, developerCenterModes } from "./developerCenterPolicy";
import { generateDeveloperCenterProposal, listDeveloperCenterProposals, listDeveloperReviewTasks } from "./developerCenter";
import { ENV } from "./_core/env";
import { TRPCError } from "@trpc/server";
import { developerLanguageKeys } from "../shared/developerLanguageCatalog";
import { getPrivateVisitorAttachment, listApprovedVisitorFeed, listVisitorSubmissionsForOwner, moderateVisitorSubmission, submitVisitorContribution } from "./visitorSubmissions";
import { visitorSubmissionPolicyCopy } from "../shared/visitorSubmissionPolicy";
import { closeVisitorConversation, listVisitorConversations, sendVisitorConversationMessage, startVisitorConversation } from "./visitorConversations";
import { createCommunityPost, createCommunityRequest, getMyMemberProfile, listApprovedCommunities, listCommunityPosts, listCommunityReviewQueue, listMyCommunityMemberships, listPublicCommunityFeed, moderateCommunityItem, reportCommunityTarget, requestCommunityMembership, saveMemberProfile, searchDiscoverableMembers } from "./communities";
import { createCodeSuggestion } from "./codeCompletion";
import { prepareVerifiedMergePlan, saveVerifiedMergePlan } from "./githubMergeService";
import { createHeartbeatJob, updateHeartbeatJob } from "./_core/heartbeat";
import { parse as parseCookie } from "cookie";
import { attachPeriodicDevelopmentSchedule, getPeriodicDevelopmentCron, getPeriodicDevelopmentJob, listPeriodicDevelopmentDrafts, recordPeriodicDevelopmentScheduleError, savePeriodicDevelopmentJob, updatePeriodicDevelopmentDraft } from "./periodicDevelopment";
import { listMarketplaceReviewQueue, listMyMarketplaceStores, listPublicMarketplaceStores, moderateMarketplaceStore, requestMarketplaceStore } from "./marketplace";
import { consolidateMiniWorkstationPaths, listMiniWorkstationPaths, runMiniWorkstation, updateMiniWorkstationPathReview } from "./miniWorkstations";
import { miniWorkstationKeys } from "./miniWorkstationPolicy";
import { getSiteNotificationPreferences, getUnreadSiteNotificationCount, listSiteNotifications, markAllSiteNotificationsRead, markSiteNotificationRead, updateSiteNotificationPreferences } from "./siteNotifications";

const projectInput = z.object({
  name: z.string().trim().min(2).max(160),
  key: z.string().trim().min(2).max(16).regex(/^[A-Za-z0-9-]+$/),
  description: z.string().trim().max(1200).optional(),
});

const workItemInput = z.object({
  projectId: z.number().int().positive(),
  title: z.string().trim().min(2).max(240),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

const sourceFileInput = z.object({
  projectId: z.number().int().positive(),
  path: z.string().trim().min(1).max(500),
  content: z.string().max(524288),
  note: z.string().trim().max(240).optional(),
});

const sourceUpdateInput = z.object({
  sourceFileId: z.number().int().positive(),
  content: z.string().max(524288),
  note: z.string().trim().max(240).optional(),
});

const ownerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.openId !== ENV.ownerOpenId) throw new TRPCError({ code: "FORBIDDEN", message: "هذه المساحة مخصصة للمالك فقط" });
  return next();
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    verifyOwnerCode: protectedProcedure.input(z.object({ code: z.string().trim().min(12).max(128) })).mutation(({ input }) => {
      if (!verifyOwnerRecoveryCode(input.code)) throw new Error("رمز المالك غير صحيح");
      return { approved: true } as const;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  workspace: router({
    summary: protectedProcedure.query(({ ctx }) => getWorkspaceSummary(ctx.user.id)),
  }),
  projects: router({
    list: protectedProcedure.query(({ ctx }) => listProjectsForOwner(ctx.user.id)),
    create: protectedProcedure.input(projectInput).mutation(({ ctx, input }) =>
      createProjectForOwner({ ownerId: ctx.user.id, ...input }),
    ),
  }),
  workItems: router({
    create: protectedProcedure.input(workItemInput).mutation(async ({ ctx, input }) => {
      const projects = await listProjectsForOwner(ctx.user.id);
      const project = projects.find(candidate => candidate.id === input.projectId);
      if (!project) throw new Error("المشروع غير متاح في مساحة العمل الحالية");
      return createWorkItemForProject({ ...input, projectKey: project.key });
    }),
  }),
  sourceFiles: router({
    list: protectedProcedure.input(z.object({ projectId: z.number().int().positive() })).query(({ ctx, input }) => listPrivateSourceFiles(ctx.user.id, input.projectId)),
    create: protectedProcedure.input(sourceFileInput).mutation(({ ctx, input }) => createPrivateSourceFile({ ownerId: ctx.user.id, ...input })),
    read: protectedProcedure.input(z.object({ sourceFileId: z.number().int().positive() })).query(({ ctx, input }) => readPrivateSourceFile(ctx.user.id, input.sourceFileId)),
    save: protectedProcedure.input(sourceUpdateInput).mutation(({ ctx, input }) => savePrivateSourceRevision({ ownerId: ctx.user.id, ...input })),
    revisions: protectedProcedure.input(z.object({ sourceFileId: z.number().int().positive() })).query(({ ctx, input }) => listPrivateSourceRevisions(ctx.user.id, input.sourceFileId)),
    remove: protectedProcedure.input(z.object({ sourceFileId: z.number().int().positive() })).mutation(({ ctx, input }) => deletePrivateSourceFile(ctx.user.id, input.sourceFileId)),
  }),
  aiWorkspace: router({
    listThreads: protectedProcedure.query(({ ctx }) => listPrivateAiThreads(ctx.user.id)),
    createThread: protectedProcedure.input(z.object({ title: z.string().trim().min(2).max(180), projectId: z.number().int().positive().optional() })).mutation(({ ctx, input }) => createPrivateAiThread({ ownerId: ctx.user.id, ...input })),
    messages: protectedProcedure.input(z.object({ threadId: z.number().int().positive() })).query(({ ctx, input }) => getPrivateAiMessages(ctx.user.id, input.threadId)),
    addMessage: protectedProcedure.input(z.object({ threadId: z.number().int().positive(), role: z.enum(["user", "assistant", "system"]), content: z.string().trim().min(1).max(12000) })).mutation(({ ctx, input }) => addPrivateAiMessage({ ownerId: ctx.user.id, ...input })),
    ask: protectedProcedure.input(z.object({ threadId: z.number().int().positive(), content: z.string().trim().min(1).max(4000), githubProjectId: z.number().int().positive().optional(), researchMode: z.enum(researchModes).optional() })).mutation(({ ctx, input }) => { if (input.researchMode === "trusted-web" && ctx.user.openId !== ENV.ownerOpenId) throw new TRPCError({ code: "FORBIDDEN", message: "البحث العالمي مخصص للمالك فقط." }); return askPrivateAiAssistant({ ownerId: ctx.user.id, ...input }); }),
  }),
  githubWorkspace: router({
    getLink: protectedProcedure.input(z.object({ projectId: z.number().int().positive() })).query(({ ctx, input }) => getGithubProjectLink(ctx.user.id, input.projectId)),
    selectRepository: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), repositoryFullName: z.string().trim().min(3).max(300), defaultBranch: z.string().trim().min(1).max(120).default("main") })).mutation(({ ctx, input }) => selectGithubRepository({ ownerId: ctx.user.id, ...input })),
    verifyImport: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), path: z.string().trim().min(1).max(500), repositoryFullName: z.string().trim().min(3).max(300) })).query(({ ctx, input }) => verifyGithubImportForOwner({ ownerId: ctx.user.id, ...input })),
  }),
  buildPlans: router({
    list: protectedProcedure.query(({ ctx }) => listBuildPlans(ctx.user.id)),
    get: protectedProcedure.input(z.object({ planId: z.number().int().positive() })).query(({ ctx, input }) => getBuildPlan(ctx.user.id, input.planId)),
    create: protectedProcedure.input(z.object({ blueprint: z.enum(["web", "mobile", "api", "product"]), title: z.string().trim().min(2).max(180).optional() })).mutation(({ ctx, input }) => createBuildPlan({ ownerId: ctx.user.id, ...input })),
    updateStep: protectedProcedure.input(z.object({ planId: z.number().int().positive(), stepId: z.number().int().positive(), status: z.enum(["not-started", "in-progress", "done"]) })).mutation(({ ctx, input }) => updateBuildPlanStep({ ownerId: ctx.user.id, ...input })),
  }),
  imageStudio: router({
    list: protectedProcedure.query(({ ctx }) => listPrivateAiImages(ctx.user.id)),
    generate: protectedProcedure.input(z.object({ prompt: z.string().trim().min(12).max(1800), projectId: z.number().int().positive().optional() })).mutation(({ ctx, input }) => createPrivateAiImage({ ownerId: ctx.user.id, ...input })),
  }),
  domainGallery: router({
    list: protectedProcedure.query(({ ctx }) => listOwnerDomainCatalog(ctx.user.id)),
    seed: protectedProcedure.mutation(({ ctx }) => seedOwnerDomainCatalog(ctx.user.id)),
    updateStatus: protectedProcedure.input(z.object({ domainId: z.number().int().positive(), status: z.enum(["proposed", "verification-needed", "shortlisted"]) })).mutation(({ ctx, input }) => updateOwnerDomainStatus({ ownerId: ctx.user.id, ...input })),
  }),
  integrationCenter: router({
    list: protectedProcedure.query(({ ctx }) => listIntegrationPreferences(ctx.user.id)),
    request: protectedProcedure.input(z.object({ providerKey: z.string().trim().min(2).max(80) })).mutation(({ ctx, input }) => requestIntegrationPreference({ ownerId: ctx.user.id, ...input })),
  }),
  notifications: router({
    list: protectedProcedure.query(({ ctx }) => listSiteNotifications(ctx.user.id)),
    unreadCount: protectedProcedure.query(({ ctx }) => getUnreadSiteNotificationCount(ctx.user.id)),
    preferences: protectedProcedure.query(({ ctx }) => getSiteNotificationPreferences(ctx.user.id)),
    updatePreferences: protectedProcedure.input(z.object({ inAppEnabled: z.boolean(), workspaceEnabled: z.boolean(), communityEnabled: z.boolean(), reviewEnabled: z.boolean(), systemEnabled: z.boolean() })).mutation(({ ctx, input }) => updateSiteNotificationPreferences({ userId: ctx.user.id, ...input })),
    markRead: protectedProcedure.input(z.object({ notificationId: z.number().int().positive() })).mutation(({ ctx, input }) => markSiteNotificationRead({ userId: ctx.user.id, notificationId: input.notificationId })),
    markAllRead: protectedProcedure.mutation(({ ctx }) => markAllSiteNotificationsRead(ctx.user.id)),
  }),
  globalResearch: router({
    catalog: ownerProcedure.query(() => listGlobalResearchSources()),
    search: ownerProcedure.input(z.object({ source: z.enum(["openalex", "crossref", "wikidata"]), query: z.string().trim().min(1).max(180) })).mutation(({ input }) => searchGlobalResearch(input)),
    searchUnified: ownerProcedure.input(z.object({ sources: z.array(z.enum(["openalex", "crossref", "wikidata"])).min(1).max(3), query: z.string().trim().min(1).max(180) })).mutation(({ input }) => searchUnifiedGlobalResearch(input)),
  }),
  websiteBuilder: router({
    list: protectedProcedure.query(({ ctx }) => listWebsiteBuilds(ctx.user.id)),
    create: protectedProcedure.input(z.object({
      title: z.string().trim().min(2).max(180),
      businessType: z.string().trim().min(2).max(120),
      brief: z.string().trim().min(24).max(2400),
      visualPreset: z.enum(["studio", "commerce", "portfolio", "launch"]),
      palette: z.enum(["cyan", "amber", "rose", "emerald"]),
      primaryCta: z.string().trim().min(2).max(120),
      desiredDomain: z.string().trim().max(253).optional(),
    })).mutation(({ ctx, input }) => createWebsiteBuild({ ownerId: ctx.user.id, ...input })),
    prepareDomain: protectedProcedure.input(z.object({ websiteBuildId: z.number().int().positive(), domain: z.string().trim().min(4).max(253) })).mutation(({ ctx, input }) => prepareWebsiteDomain({ ownerId: ctx.user.id, ...input })),
    addSupabaseStarter: protectedProcedure.input(z.object({ websiteBuildId: z.number().int().positive() })).mutation(({ ctx, input }) => addSupabaseStarter({ ownerId: ctx.user.id, ...input })),
  }),
  developerCenter: router({
    list: ownerProcedure.query(({ ctx }) => listDeveloperCenterProposals(ctx.user.id)),
    listTasks: ownerProcedure.query(({ ctx }) => listDeveloperReviewTasks(ctx.user.id)),
    generate: ownerProcedure.input(z.object({ mode: z.enum(developerCenterModes), languageKey: z.enum(developerLanguageKeys), focus: z.enum(developerCenterFocuses), brief: z.string().trim().min(24).max(6000) })).mutation(({ ctx, input }) => generateDeveloperCenterProposal({ ownerId: ctx.user.id, ...input })),
  }),
  miniWorkstations: router({
    paths: ownerProcedure.query(({ ctx }) => listMiniWorkstationPaths(ctx.user.id)),
    run: ownerProcedure.input(z.object({ stationKey: z.enum(miniWorkstationKeys), request: z.string().trim().min(24).max(4000) })).mutation(({ ctx, input }) => runMiniWorkstation({ ownerId: ctx.user.id, ...input })),
    consolidate: ownerProcedure.mutation(({ ctx }) => consolidateMiniWorkstationPaths(ctx.user.id)),
    reviewPath: ownerProcedure.input(z.object({ id: z.number().int().positive(), reviewStatus: z.enum(["reviewed", "archived"]) })).mutation(({ ctx, input }) => updateMiniWorkstationPathReview({ ownerId: ctx.user.id, ...input })),
  }),
  visitorSubmissions: router({
    policy: publicProcedure.query(() => ({ copy: visitorSubmissionPolicyCopy, status: "owner-moderated" as const })),
    approvedFeed: publicProcedure.input(z.object({ cursor: z.number().int().positive().optional(), limit: z.number().int().min(1).max(12).optional() }).optional()).query(({ input }) => listApprovedVisitorFeed(input)),
    submit: publicProcedure.input(z.object({
      visitorAlias: z.string().trim().max(80).optional(),
      category: z.enum(["opinion", "media", "code", "project"]),
      title: z.string().trim().min(3).max(180),
      content: z.string().trim().min(12).max(6000),
      mediaReferenceUrl: z.string().trim().max(1000).optional(),
      consentAccepted: z.literal(true),
      attachments: z.array(z.object({ name: z.string().trim().min(1).max(180), mimeType: z.string().trim().min(1).max(120), base64: z.string().min(1).max(24_000_000) })).max(4),
    })).mutation(({ input }) => submitVisitorContribution(input)),
    listForOwner: ownerProcedure.query(({ ctx }) => listVisitorSubmissionsForOwner(ctx.user.id)),
    moderate: ownerProcedure.input(z.object({ submissionId: z.number().int().positive(), status: z.enum(["approved", "rejected"]), moderationNote: z.string().trim().max(500).optional() })).mutation(({ ctx, input }) => moderateVisitorSubmission({ ownerId: ctx.user.id, ...input })),
    attachmentForOwner: ownerProcedure.input(z.object({ attachmentId: z.number().int().positive() })).query(({ ctx, input }) => getPrivateVisitorAttachment(ctx.user.id, input.attachmentId)),
  }),
  visitorConversations: router({
    mine: protectedProcedure.query(({ ctx }) => listVisitorConversations({ userId: ctx.user.id, isOwner: ctx.user.openId === ENV.ownerOpenId })),
    start: protectedProcedure.input(z.object({ subject: z.string().trim().min(3).max(180), content: z.string().trim().min(3).max(6000) })).mutation(({ ctx, input }) => startVisitorConversation({ visitorId: ctx.user.id, ...input })),
    send: protectedProcedure.input(z.object({ conversationId: z.number().int().positive(), content: z.string().trim().min(1).max(6000) })).mutation(({ ctx, input }) => sendVisitorConversationMessage({ userId: ctx.user.id, isOwner: ctx.user.openId === ENV.ownerOpenId, ...input })),
    close: ownerProcedure.input(z.object({ conversationId: z.number().int().positive() })).mutation(({ ctx, input }) => closeVisitorConversation({ userId: ctx.user.id, isOwner: true, ...input })),
  }),
  communityHub: router({
    publicFeed: publicProcedure.input(z.object({ cursor: z.number().int().positive().optional(), limit: z.number().int().min(1).max(12).optional() }).optional()).query(({ input }) => listPublicCommunityFeed(input)),
    myProfile: protectedProcedure.query(({ ctx }) => getMyMemberProfile(ctx.user.id)),
    saveProfile: protectedProcedure.input(z.object({ alias: z.string().trim().min(3).max(48), bio: z.string().trim().max(500).optional(), skills: z.string().trim().max(240).optional(), discoveryEnabled: z.boolean() })).mutation(({ ctx, input }) => saveMemberProfile({ userId: ctx.user.id, ...input })),
    memberSearch: protectedProcedure.input(z.object({ query: z.string().trim().max(80) })).query(({ input }) => searchDiscoverableMembers(input.query)),
    communities: protectedProcedure.query(() => listApprovedCommunities()),
    createCommunity: protectedProcedure.input(z.object({ name: z.string().trim().min(3).max(100), description: z.string().trim().min(12).max(3000) })).mutation(({ ctx, input }) => createCommunityRequest({ userId: ctx.user.id, ...input })),
    myMemberships: protectedProcedure.query(({ ctx }) => listMyCommunityMemberships(ctx.user.id)),
    requestMembership: protectedProcedure.input(z.object({ communityId: z.number().int().positive() })).mutation(({ ctx, input }) => requestCommunityMembership({ userId: ctx.user.id, ...input })),
    posts: protectedProcedure.input(z.object({ communityId: z.number().int().positive() })).query(({ ctx, input }) => listCommunityPosts({ userId: ctx.user.id, ...input })),
    createPost: protectedProcedure.input(z.object({ communityId: z.number().int().positive(), title: z.string().trim().min(3).max(180), content: z.string().trim().min(12).max(6000) })).mutation(({ ctx, input }) => createCommunityPost({ userId: ctx.user.id, ...input })),
    report: protectedProcedure.input(z.object({ targetType: z.enum(["community", "post", "member"]), targetId: z.number().int().positive(), reason: z.string().trim().min(6).max(500) })).mutation(({ ctx, input }) => reportCommunityTarget({ reporterId: ctx.user.id, ...input })),
    reviewQueue: ownerProcedure.query(() => listCommunityReviewQueue()),
    moderate: ownerProcedure.input(z.object({ target: z.enum(["community", "membership", "post", "report"]), id: z.number().int().positive(), status: z.enum(["approved", "rejected", "archived", "blocked", "resolved", "dismissed"]), note: z.string().trim().max(500).optional() })).mutation(({ ctx, input }) => moderateCommunityItem({ ownerId: ctx.user.id, ...input })),
  }),
  marketplace: router({
    publicStores: publicProcedure.query(() => listPublicMarketplaceStores()),
    mine: protectedProcedure.query(({ ctx }) => listMyMarketplaceStores(ctx.user.id)),
    requestStore: protectedProcedure.input(z.object({ slug: z.string().trim().min(3).max(72), name: z.string().trim().min(3).max(120), description: z.string().trim().min(20).max(700), category: z.string().trim().min(2).max(80) })).mutation(({ ctx, input }) => requestMarketplaceStore({ ownerId: ctx.user.id, ...input })),
    reviewQueue: ownerProcedure.query(() => listMarketplaceReviewQueue()),
    moderate: ownerProcedure.input(z.object({ storeId: z.number().int().positive(), status: z.enum(["approved", "rejected", "archived"]), note: z.string().trim().max(500).optional() })).mutation(({ ctx, input }) => moderateMarketplaceStore({ ownerId: ctx.user.id, ...input })),
  }),
  codeAssistant: router({
    suggest: ownerProcedure.input(z.object({ sourceFileId: z.number().int().positive(), content: z.string().max(12_000), cursorOffset: z.number().int().min(0), mode: z.enum(["complete", "improve", "diagnose"]) })).mutation(({ ctx, input }) => createCodeSuggestion({ ownerId: ctx.user.id, ...input })),
  }),
  githubMerge: router({
    prepare: ownerProcedure.input(z.object({ toolName: z.string().trim().min(3).max(120), repositories: z.array(z.string().trim().min(1).max(300)).min(1).max(12), brief: z.string().trim().max(2000).optional() })).mutation(async ({ ctx, input }) => saveVerifiedMergePlan(ctx.user.id, await prepareVerifiedMergePlan(input))),
  }),
  periodicDevelopment: router({
    status: ownerProcedure.query(({ ctx }) => getPeriodicDevelopmentJob(ctx.user.id)),
    drafts: ownerProcedure.query(({ ctx }) => listPeriodicDevelopmentDrafts(ctx.user.id)),
    configure: ownerProcedure.input(z.object({ cadence: z.enum(["hourly", "every-6-hours"]) })).mutation(async ({ ctx, input }) => {
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      const cron = getPeriodicDevelopmentCron(input.cadence);
      const current = await getPeriodicDevelopmentJob(ctx.user.id);
      try {
        if (current?.scheduleCronTaskUid) {
          await updateHeartbeatJob(current.scheduleCronTaskUid, { cron, enable: true, description: "مسودات تطوير DevForge للمراجعة فقط" }, sessionToken);
          return savePeriodicDevelopmentJob({ ownerId: ctx.user.id, cadence: input.cadence, status: "active" });
        }
        const job = await savePeriodicDevelopmentJob({ ownerId: ctx.user.id, cadence: input.cadence, status: "paused" });
        const schedule = await createHeartbeatJob({ name: `periodic-development-${job.id}`, cron, path: "/api/scheduled/periodic-development", description: "ينتج مسودات تطوير DevForge للمراجعة فقط" }, sessionToken);
        return attachPeriodicDevelopmentSchedule({ ownerId: ctx.user.id, taskUid: schedule.taskUid });
      } catch (error) {
        await recordPeriodicDevelopmentScheduleError({ ownerId: ctx.user.id, error });
        throw error;
      }
    }),
    pause: ownerProcedure.mutation(async ({ ctx }) => { const job = await getPeriodicDevelopmentJob(ctx.user.id); if (!job) throw new Error("لا توجد مهمة تطوير دورية مهيأة"); const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? ""; if (job.scheduleCronTaskUid) await updateHeartbeatJob(job.scheduleCronTaskUid, { enable: false }, sessionToken); return savePeriodicDevelopmentJob({ ownerId: ctx.user.id, cadence: job.cadence, status: "paused" }); }),
    reviewDraft: ownerProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["acknowledged", "dismissed"]) })).mutation(({ ctx, input }) => updatePeriodicDevelopmentDraft({ ownerId: ctx.user.id, ...input })),
  }),
});

export type AppRouter = typeof appRouter;
