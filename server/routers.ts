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
import { researchModes } from "./aiResearchPolicy";
import { developerCenterModes } from "./developerCenterPolicy";
import { generateDeveloperCenterProposal, listDeveloperCenterProposals } from "./developerCenter";
import { ENV } from "./_core/env";
import { TRPCError } from "@trpc/server";

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
    ask: protectedProcedure.input(z.object({ threadId: z.number().int().positive(), content: z.string().trim().min(1).max(4000), githubProjectId: z.number().int().positive().optional(), researchMode: z.enum(researchModes).optional() })).mutation(({ ctx, input }) => askPrivateAiAssistant({ ownerId: ctx.user.id, ...input })),
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
    generate: ownerProcedure.input(z.object({ mode: z.enum(developerCenterModes), brief: z.string().trim().min(24).max(6000) })).mutation(({ ctx, input }) => generateDeveloperCenterProposal({ ownerId: ctx.user.id, ...input })),
  }),
});

export type AppRouter = typeof appRouter;
