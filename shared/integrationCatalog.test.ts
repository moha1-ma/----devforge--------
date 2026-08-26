import { describe, expect, it } from "vitest";
import { getIntegrationDefinition, integrationCatalog } from "./integrationCatalog";

describe("integration catalog", () => {
  it("contains unique provider keys and explicit protected boundaries", () => {
    expect(new Set(integrationCatalog.map(item => item.providerKey)).size).toBe(integrationCatalog.length);
    expect(integrationCatalog.every(item => item.protectedBoundary.length > 20)).toBe(true);
    expect(new Set(integrationCatalog.map(item => item.category)).size).toBeGreaterThanOrEqual(12);
    expect(integrationCatalog.length).toBeGreaterThanOrEqual(65);
  });

  it("does not treat unknown providers as connectable", () => {
    expect(getIntegrationDefinition("unknown-platform")).toBeNull();
    expect(getIntegrationDefinition("github")?.connectionMethod).toBe("session");
  });
});
