import { describe, expect, it } from "vitest";
import { normalizeOwnerRecoveryCode, verifyOwnerRecoveryCode } from "./ownerAccess";

describe("owner recovery code verifier", () => {
  it("accepts the provisioned owner code and rejects a different code", () => {
    expect(verifyOwnerRecoveryCode("DF-OWNER-9K7M-2QX4-VT8R")).toBe(true);
    expect(verifyOwnerRecoveryCode("df owner 9k7m 2qx4 vt8r")).toBe(true);
    expect(verifyOwnerRecoveryCode("DF-OWNER-0000-0000-0000")).toBe(false);
  });

  it("normalizes copied code formatting without persisting the plaintext value", () => {
    expect(normalizeOwnerRecoveryCode(" df-owner-9k7m-2qx4-vt8r ")).toBe("DFOWNER9K7M2QX4VT8R");
  });
});
