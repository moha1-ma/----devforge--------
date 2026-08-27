import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ list: vi.fn(), run: vi.fn(), consolidate: vi.fn(), review: vi.fn() }));
vi.mock("./miniWorkstations", () => ({ listMiniWorkstationPaths: mocks.list, runMiniWorkstation: mocks.run, consolidateMiniWorkstationPaths: mocks.consolidate, updateMiniWorkstationPathReview: mocks.review }));
import { ENV } from "./_core/env";
import { appRouter } from "./routers";

function context(openId: string, id: number): TrpcContext {
  return { user: { id, openId, email: null, name: "User", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

describe("mini workstations router", () => {
  it("rejects non-owner requests before reading paths or invoking an AI workstation", async () => {
    const visitor = appRouter.createCaller(context("visitor", 9));
    await expect(visitor.miniWorkstations.paths()).rejects.toThrow("مخصصة للمالك فقط");
    await expect(visitor.miniWorkstations.run({ stationKey: "architecture", request: "راجع تصميم منصة تعليمية تتضمن مساحات خاصة وحدود صلاحية واختبارات مقترحة." })).rejects.toThrow("مخصصة للمالك فقط");
    await expect(visitor.miniWorkstations.consolidate()).rejects.toThrow("مخصصة للمالك فقط");
    expect(mocks.list).not.toHaveBeenCalled();
    expect(mocks.run).not.toHaveBeenCalled();
    expect(mocks.consolidate).not.toHaveBeenCalled();
  });

  it("passes an explicit owner request to one selected workstation only", async () => {
    mocks.run.mockResolvedValue({ path: { id: 1 }, output: { executionStatus: "review-only" }, usage: null });
    const owner = appRouter.createCaller(context(ENV.ownerOpenId, 2));
    const request = "راجع تصميم منصة تعليمية تتضمن مساحات خاصة وحدود صلاحية واختبارات مقترحة.";
    await owner.miniWorkstations.run({ stationKey: "backend", request });
    expect(mocks.run).toHaveBeenCalledWith({ ownerId: 2, stationKey: "backend", request });
  });
});
