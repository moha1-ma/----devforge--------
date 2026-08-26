import { describe, expect, it } from "vitest";
import { mobileHomeSections } from "./homeSections";

describe("iOS educational and marketplace home sections", () => {
  it("opens the learning path inside DevForge", () => {
    expect(mobileHomeSections.education.route).toBe("/plans");
    expect(mobileHomeSections.education.action).toContain("خطط");
  });

  it("keeps the marketplace explicitly non-transactional until real commerce is approved", () => {
    expect(mobileHomeSections.marketplace.route).toBe("/domains");
    expect(mobileHomeSections.marketplace.description).toContain("لا توجد قوائم بيع عامة");
    expect(mobileHomeSections.marketplace.description).toContain("أو أسعار أو دفعات");
  });
});
