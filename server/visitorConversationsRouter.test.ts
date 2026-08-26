import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ startVisitorConversation: vi.fn(), listVisitorConversations: vi.fn(), sendVisitorConversationMessage: vi.fn(), closeVisitorConversation: vi.fn() }));
vi.mock("./visitorConversations", () => mocks);

import { ENV } from "./_core/env";
import { appRouter } from "./routers";

function context(openId: string | null, id = 44): TrpcContext {
  return { user: openId ? { id, openId, email: null, name: "User", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } : null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

describe("visitor conversations router", () => {
  it("binds a visitor conversation to the authenticated visitor identity", async () => {
    mocks.startVisitorConversation.mockResolvedValue({ id: 7 });
    const caller = appRouter.createCaller(context("visitor-open-id", 44));
    await caller.visitorConversations.start({ subject: "دعم المشروع", content: "أحتاج مساعدة آمنة بخصوص مشاركة مشروعي." });
    expect(mocks.startVisitorConversation).toHaveBeenCalledWith({ visitorId: 44, subject: "دعم المشروع", content: "أحتاج مساعدة آمنة بخصوص مشاركة مشروعي." });
    mocks.listVisitorConversations.mockResolvedValue([]);
    await caller.visitorConversations.mine();
    expect(mocks.listVisitorConversations).toHaveBeenCalledWith({ userId: 44, isOwner: false });
  });

  it("does not let a visitor close conversations while the owner can", async () => {
    const visitor = appRouter.createCaller(context("visitor-open-id", 44));
    await expect(visitor.visitorConversations.close({ conversationId: 7 })).rejects.toThrow("مخصصة للمالك فقط");
    mocks.closeVisitorConversation.mockResolvedValue({ conversationId: 7, status: "closed" });
    const owner = appRouter.createCaller(context(ENV.ownerOpenId, 2));
    await expect(owner.visitorConversations.close({ conversationId: 7 })).resolves.toEqual({ conversationId: 7, status: "closed" });
  });
});
