import { describe, expect, it } from "vitest";
import { domainCatalogSeed, isDomainCandidate } from "./domainCatalog";

describe("domain catalog candidates", () => {
  it("contains 20 distinct domain-shaped proposals", () => {
    expect(domainCatalogSeed).toHaveLength(20);
    expect(new Set(domainCatalogSeed.map(item => item[0])).size).toBe(20);
    expect(domainCatalogSeed.every(item => isDomainCandidate(item[0]))).toBe(true);
  });
});
