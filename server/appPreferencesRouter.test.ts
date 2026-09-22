import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  listUserAppPreferences: vi.fn(),
  setUserAppPinned: vi.fn(),
  reorderPinnedApps: vi.fn(),
  touchUserApp: vi.fn(),
}));

vi.mock("./appPreferences", () => mocks);

import { appRouter } from "./routers";

function context(id: number | null): TrpcContext {
  return {
    user: id === null ? null : {
      id,
      openId: `user-${id}`,
      email: null,
      name: `User ${id}`,
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("app preferences router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listUserAppPreferences.mockResolvedValue([]);
    mocks.setUserAppPinned.mockResolvedValue([]);
    mocks.reorderPinnedApps.mockResolvedValue([]);
    mocks.touchUserApp.mockResolvedValue([]);
  });

  it("scopes every preference operation to the authenticated user", async () => {
    const first = appRouter.createCaller(context(11));
    const second = appRouter.createCaller(context(22));

    await first.appPreferences.list();
    await first.appPreferences.setPinned({ appKey: "github", isPinned: true });
    await first.appPreferences.reorder({ appKeys: ["github", "integrations"] });
    await second.appPreferences.touch({ appKey: "github" });

    expect(mocks.listUserAppPreferences).toHaveBeenCalledWith(11);
    expect(mocks.setUserAppPinned).toHaveBeenCalledWith({ userId: 11, appKey: "github", isPinned: true });
    expect(mocks.reorderPinnedApps).toHaveBeenCalledWith({ userId: 11, appKeys: ["github", "integrations"] });
    expect(mocks.touchUserApp).toHaveBeenCalledWith({ userId: 22, appKey: "github" });
  });

  it("rejects anonymous access, unknown app keys, and duplicate ordering", async () => {
    await expect(appRouter.createCaller(context(null)).appPreferences.list()).rejects.toThrow();
    const caller = appRouter.createCaller(context(11));
    await expect(caller.appPreferences.setPinned({ appKey: "unknown" as "github", isPinned: true })).rejects.toThrow();
    await expect(caller.appPreferences.reorder({ appKeys: ["github", "github"] })).rejects.toThrow("لا يمكن تكرار التطبيق");
    expect(mocks.setUserAppPinned).not.toHaveBeenCalled();
    expect(mocks.reorderPinnedApps).not.toHaveBeenCalled();
  });
});
