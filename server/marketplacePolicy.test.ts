import { describe, expect, it } from "vitest";
import { canPublishMarketplaceStore, normalizeStoreSlug, validateMarketplaceStore } from "./marketplacePolicy";

describe("marketplace policy", () => {
  it("normalizes a user-owned store identifier and rejects unsafe forms", () => {
    expect(normalizeStoreSlug("  Learning Store!  ")).toBe("learning-store");
    expect(() => normalizeStoreSlug("متجر")).toThrow("معرّف المتجر");
  });
  it("accepts only bounded genuine store details and exposes only approved stores", () => {
    expect(validateMarketplaceStore({ slug: "learning-store", name: "متجر تعليمي", description: "متجر حقيقي تحت المراجعة يقدّم مواد تعليمية منظمة للمتعلمين.", category: "تعليم" })).toMatchObject({ slug: "learning-store" });
    expect(canPublishMarketplaceStore("approved")).toBe(true);
    expect(canPublishMarketplaceStore("pending")).toBe(false);
  });
});
