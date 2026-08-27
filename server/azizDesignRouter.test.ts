import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ collections: vi.fn(), publicAssets: vi.fn(), mine: vi.fn(), createDraft: vi.fn(), review: vi.fn() }));
vi.mock("./azizDesigns", () => ({ listAzizMarketCollections: mocks.collections, listPublicAzizDesignAssets: mocks.publicAssets, listOwnerAzizDesignAssets: mocks.mine, createAzizDesignDraft: mocks.createDraft, updateAzizDesignReview: mocks.review }));
import { ENV } from "./_core/env";
import { appRouter } from "./routers";

function context(openId: string, id: number): TrpcContext {
  return { user: { id, openId, email: null, name: "User", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

describe("Aziz market router", () => {
  it("keeps drafts and review actions owner-scoped before service or AI work", async () => {
    const visitor = appRouter.createCaller(context("visitor", 9));
    await expect(visitor.azizMarket.mine()).rejects.toThrow("مخصصة للمالك فقط");
    await expect(visitor.azizMarket.createDraft({ collectionKey: "aziz-1", title: "موقع تعليمي", brief: "تصميم موقع عربي للمؤسسة التعليمية مع صفحات برامج وتسجيل ومعلومات تواصل واضحة." })).rejects.toThrow("مخصصة للمالك فقط");
    await expect(visitor.azizMarket.review({ id: 1, status: "approved", mediaUrl: "https://example.com/design.png" })).rejects.toThrow("مخصصة للمالك فقط");
    expect(mocks.mine).not.toHaveBeenCalled();
    expect(mocks.createDraft).not.toHaveBeenCalled();
    expect(mocks.review).not.toHaveBeenCalled();
  });

  it("allows an explicit owner to create one bounded draft", async () => {
    mocks.createDraft.mockResolvedValue({ id: 1, output: { executionStatus: "review-only" }, usage: null });
    const owner = appRouter.createCaller(context(ENV.ownerOpenId, 2));
    const request = { collectionKey: "aziz-3" as const, title: "غلاف قصصي", brief: "غلاف كتاب عربي هادئ يوضح العنوان الرئيسي واسم المؤلف مع تباين قابل للقراءة." };
    await owner.azizMarket.createDraft(request);
    expect(mocks.createDraft).toHaveBeenCalledWith({ ownerId: 2, ...request });
  });

  it("keeps public reads separate from owner draft access", async () => {
    mocks.collections.mockResolvedValue([]); mocks.publicAssets.mockResolvedValue([]);
    const visitor = appRouter.createCaller(context("visitor", 9));
    await expect(visitor.azizMarket.collections()).resolves.toEqual([]);
    await expect(visitor.azizMarket.publicAssets()).resolves.toEqual([]);
    expect(mocks.publicAssets).toHaveBeenCalledWith(undefined);
  });
});
