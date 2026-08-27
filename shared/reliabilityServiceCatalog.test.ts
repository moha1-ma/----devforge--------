import { describe, expect, it } from "vitest";
import { reliabilityServiceCatalog } from "./reliabilityServiceCatalog";

describe("reliability service catalog", () => {
  it("uses a bounded documented catalog and states no automatic activation boundary", () => {
    expect(reliabilityServiceCatalog.map(service => service.providerKey)).toEqual(["uptimerobot", "better-stack", "healthchecks", "sentry"]);
    expect(reliabilityServiceCatalog.every(service => service.documentationUrl.startsWith("https://"))).toBe(true);
    expect(reliabilityServiceCatalog.every(service => service.activationBoundary.includes("لا"))).toBe(true);
  });
});
