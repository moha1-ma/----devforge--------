import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function createContext(role: "admin" | "user", openId = `owner-${role}`): TrpcContext {
  return {
    user: { id: 42, openId, email: null, name: "Owner", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("auth.verifyOwnerCode", () => {
  it("approves the provisioned code for every authenticated personal workspace", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.auth.verifyOwnerCode({ code: "df owner 9k7m 2qx4 vt8r" })).resolves.toEqual({ approved: true });
  });

  it("rejects an invalid owner code for an authenticated workspace", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.auth.verifyOwnerCode({ code: "DF-OWNER-0000-0000-0000" })).rejects.toThrow("رمز المالك");
  });
});
