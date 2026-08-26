import { createHash, timingSafeEqual } from "node:crypto";

const OWNER_CODE_SHA256 = "b6974fdacd2c385fb24b2ee450724c348f65f5c7f86370f2daf759053486e5a4";

export function normalizeOwnerRecoveryCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function verifyOwnerRecoveryCode(code: string): boolean {
  const candidate = createHash("sha256").update(normalizeOwnerRecoveryCode(code)).digest("hex");
  return timingSafeEqual(Buffer.from(candidate, "utf8"), Buffer.from(OWNER_CODE_SHA256, "utf8"));
}
