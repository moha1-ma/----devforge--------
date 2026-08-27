import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ publicStores: vi.fn(), mine: vi.fn(), request: vi.fn(), queue: vi.fn(), moderate: vi.fn() }));
vi.mock("./marketplace", () => ({ listPublicMarketplaceStores: mocks.publicStores, listMyMarketplaceStores: mocks.mine, requestMarketplaceStore: mocks.request, listMarketplaceReviewQueue: mocks.queue, moderateMarketplaceStore: mocks.moderate }));
import { ENV } from "./_core/env";
import { appRouter } from "./routers";

function context(openId: string | null, id = 41): TrpcContext { return { user: openId ? { id, openId, email: null, name: "User", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } : null, req: { headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] }; }

describe("marketplace router", () => {
  it("exposes only public listings anonymously and binds a store request to the signed-in user", async () => {
    mocks.publicStores.mockResolvedValue([]); mocks.request.mockResolvedValue({ id: 9, status: "pending" });
    await expect(appRouter.createCaller(context(null)).marketplace.publicStores()).resolves.toEqual([]);
    await appRouter.createCaller(context("visitor", 41)).marketplace.requestStore({ slug: "learning-store", name: "متجر تعلم", description: "متجر حقيقي تحت المراجعة ولا يتضمن منتجات أو مدفوعات في هذا الأساس.", category: "تعليم" });
    expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 41, slug: "learning-store" }));
  });
  it("reserves review actions for the owner", async () => {
    await expect(appRouter.createCaller(context("visitor")).marketplace.reviewQueue()).rejects.toThrow("مخصصة للمالك فقط");
    mocks.moderate.mockResolvedValue({ id: 7, status: "approved", publiclyVisible: true });
    await appRouter.createCaller(context(ENV.ownerOpenId, 2)).marketplace.moderate({ storeId: 7, status: "approved" });
    expect(mocks.moderate).toHaveBeenCalledWith({ ownerId: 2, storeId: 7, status: "approved" });
  });
});
