import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ submitVisitorContribution: vi.fn(), listVisitorSubmissionsForOwner: vi.fn(), moderateVisitorSubmission: vi.fn(), getPrivateVisitorAttachment: vi.fn() }));
vi.mock("./visitorSubmissions", () => mocks);

import { ENV } from "./_core/env";
import { appRouter } from "./routers";

function createContext(openId: string | null): TrpcContext {
  return { user: openId ? { id: 23, openId, email: null, name: "Owner", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } : null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

describe("visitor submissions router", () => {
  it("permits anonymous submission but requires the provisioned owner for moderation data", async () => {
    mocks.submitVisitorContribution.mockResolvedValue({ id: 4, status: "pending" });
    const publicCaller = appRouter.createCaller(createContext(null));
    await expect(publicCaller.visitorSubmissions.submit({ category: "opinion", title: "رأي مفيد", content: "هذه مشاركة عامة تمر أولًا بطابور المراجعة الخاص.", consentAccepted: true, attachments: [] })).resolves.toEqual({ id: 4, status: "pending" });

    mocks.listVisitorSubmissionsForOwner.mockResolvedValue([]);
    const ownerCaller = appRouter.createCaller(createContext(ENV.ownerOpenId));
    await expect(ownerCaller.visitorSubmissions.listForOwner()).resolves.toEqual([]);
    expect(mocks.listVisitorSubmissionsForOwner).toHaveBeenCalledWith(23);
  });

  it("blocks a different signed-in identity before it can see or moderate pending content", async () => {
    const otherCaller = appRouter.createCaller(createContext("another-authenticated-user"));
    await expect(otherCaller.visitorSubmissions.listForOwner()).rejects.toThrow("مخصصة للمالك فقط");
    await expect(otherCaller.visitorSubmissions.moderate({ submissionId: 4, status: "approved" })).rejects.toThrow("مخصصة للمالك فقط");
    expect(mocks.moderateVisitorSubmission).not.toHaveBeenCalled();
  });
});
