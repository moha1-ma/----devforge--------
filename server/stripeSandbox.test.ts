import { describe, expect, it } from "vitest";
import { maskStripeId, requireStripeSandboxKey, stripeFormBody } from "./stripeSandbox";

describe("Stripe sandbox guard", () => {
  it("accepts only a Stripe test-mode secret key", () => {
    expect(requireStripeSandboxKey("sk_test_demo_key")).toBe("sk_test_demo_key");
    expect(() => requireStripeSandboxKey("sk_live_not_allowed")).toThrow("حي");
    expect(() => requireStripeSandboxKey(undefined)).toThrow("التجريبي");
  });

  it("serializes API form fields without exposing secret values", () => {
    const body = stripeFormBody({ amount: 1099, currency: "usd", "metadata[demo]": true });
    expect(body.toString()).toContain("amount=1099");
    expect(body.toString()).toContain("metadata%5Bdemo%5D=true");
  });

  it("masks identifiers for safe logs", () => {
    expect(maskStripeId("pi_3NsExample1234")).toBe("pi_3NsE…1234");
  });
});
