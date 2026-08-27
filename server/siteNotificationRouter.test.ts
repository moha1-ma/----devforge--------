import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ list: vi.fn(), unread: vi.fn(), preferences: vi.fn(), update: vi.fn(), markRead: vi.fn(), markAllRead: vi.fn() }));
vi.mock("./siteNotifications", () => ({ getSiteNotificationPreferences: mocks.preferences, getUnreadSiteNotificationCount: mocks.unread, listSiteNotifications: mocks.list, markAllSiteNotificationsRead: mocks.markAllRead, markSiteNotificationRead: mocks.markRead, updateSiteNotificationPreferences: mocks.update }));
import { appRouter } from "./routers";

function context(id: number): TrpcContext {
  return { user: { id, openId: `user-${id}`, email: null, name: "User", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

describe("site notification router", () => {
  it("passes the authenticated recipient identity to every notification operation", async () => {
    mocks.list.mockResolvedValue([]);
    mocks.unread.mockResolvedValue({ count: 0 });
    mocks.preferences.mockResolvedValue({ inAppEnabled: true, workspaceEnabled: true, communityEnabled: true, reviewEnabled: true, systemEnabled: true });
    mocks.markRead.mockResolvedValue({ id: 7, read: true });
    const caller = appRouter.createCaller(context(7));
    await caller.notifications.list();
    await caller.notifications.unreadCount();
    await caller.notifications.preferences();
    await caller.notifications.markRead({ notificationId: 7 });
    expect(mocks.list).toHaveBeenCalledWith(7);
    expect(mocks.unread).toHaveBeenCalledWith(7);
    expect(mocks.preferences).toHaveBeenCalledWith(7);
    expect(mocks.markRead).toHaveBeenCalledWith({ userId: 7, notificationId: 7 });
  });
});
