import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ list: vi.fn(), search: vi.fn() }));
vi.mock("./globalResearch", () => ({ listGlobalResearchSources: mocks.list, searchGlobalResearch: mocks.search }));
import { ENV } from "./_core/env";
import { appRouter } from "./routers";

function context(openId: string, id: number): TrpcContext {
  return { user: { id, openId, email: null, name: "User", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

describe("global research router", () => {
  it("rejects visitors and permits owner-scoped read-only searches", async () => {
    await expect(appRouter.createCaller(context("visitor", 9)).globalResearch.catalog()).rejects.toThrow("مخصصة للمالك فقط");
    mocks.list.mockReturnValue([{ key: "openalex" }]);
    expect(await appRouter.createCaller(context(ENV.ownerOpenId, 2)).globalResearch.catalog()).toEqual([{ key: "openalex" }]);
    mocks.search.mockResolvedValue({ results: [], disclosure: "قراءة فقط" });
    await appRouter.createCaller(context(ENV.ownerOpenId, 2)).globalResearch.search({ source: "crossref", query: "اختبار" });
    expect(mocks.search).toHaveBeenCalledWith({ source: "crossref", query: "اختبار" });
  });
});
