import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ listDeveloperCenterProposals: vi.fn(), generateDeveloperCenterProposal: vi.fn() }));
vi.mock("./developerCenter", () => ({ listDeveloperCenterProposals: mocks.listDeveloperCenterProposals, generateDeveloperCenterProposal: mocks.generateDeveloperCenterProposal }));

import { ENV } from "./_core/env";
import { appRouter } from "./routers";

function createContext(openId: string): TrpcContext {
  return {
    user: { id: 19, openId, email: null, name: "Owner", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("developerCenter router", () => {
  it("returns proposals only to the provisioned owner identity", async () => {
    mocks.listDeveloperCenterProposals.mockResolvedValue([]);
    const caller = appRouter.createCaller(createContext(ENV.ownerOpenId));

    await expect(caller.developerCenter.list()).resolves.toEqual([]);
    expect(mocks.listDeveloperCenterProposals).toHaveBeenCalledWith(19);
  });

  it("rejects a different authenticated identity before reading any proposal", async () => {
    const caller = appRouter.createCaller(createContext("another-authenticated-user"));

    await expect(caller.developerCenter.list()).rejects.toThrow("مخصصة للمالك فقط");
    expect(mocks.listDeveloperCenterProposals).toHaveBeenCalledTimes(1);
  });
});
