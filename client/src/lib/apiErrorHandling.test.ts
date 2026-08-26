import { TRPCClientError } from "@trpc/client";
import { describe, expect, it } from "vitest";
import { shouldLogUnhandledApiError } from "./apiErrorHandling";

describe("shouldLogUnhandledApiError", () => {
  it("does not classify handled tRPC validation failures as runtime errors", () => {
    expect(shouldLogUnhandledApiError(new TRPCClientError("رمز المالك غير صحيح"))).toBe(false);
  });

  it("keeps unexpected non-tRPC errors observable", () => {
    expect(shouldLogUnhandledApiError(new Error("unexpected failure"))).toBe(true);
  });
});
