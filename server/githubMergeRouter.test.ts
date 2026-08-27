import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
const mocks = vi.hoisted(() => ({ prepare: vi.fn(), save: vi.fn() }));
vi.mock("./githubMergeService", () => ({ prepareVerifiedMergePlan: mocks.prepare, saveVerifiedMergePlan: mocks.save }));
import { ENV } from "./_core/env";
import { appRouter } from "./routers";
function context(openId: string, id: number): TrpcContext { return { user: { id, openId, email: null, name: "User", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] }; }
describe("github merge router", () => { it("keeps planning owner-only and forwards selected repositories without writes", async () => { await expect(appRouter.createCaller(context("visitor", 9)).githubMerge.prepare({ toolName: "أداة موحدة", repositories: ["acme/a"] })).rejects.toThrow("مخصصة للمالك فقط"); const plan = { toolName: "أداة موحدة", repositories: [{ fullName: "acme/a" }] }; mocks.prepare.mockResolvedValue(plan); mocks.save.mockResolvedValue({ ...plan, recordId: 3 }); await appRouter.createCaller(context(ENV.ownerOpenId, 2)).githubMerge.prepare({ toolName: "أداة موحدة", repositories: ["acme/a"], brief: "تجميع مراجَع" }); expect(mocks.prepare).toHaveBeenCalledWith({ toolName: "أداة موحدة", repositories: ["acme/a"], brief: "تجميع مراجَع" }); expect(mocks.save).toHaveBeenCalledWith(2, plan); }); });
