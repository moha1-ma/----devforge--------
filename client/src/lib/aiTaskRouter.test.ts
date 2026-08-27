import { describe, expect, it } from "vitest";
import { AI_ROUTER_MAX_LENGTH, createAiRoutingPlan, normalizeAiTask, vettedAiProviderReferences } from "./aiTaskRouter";

describe("AI task router", () => {
  it("creates bounded review-only workstreams without an external action", () => {
    const plan = createAiRoutingPlan("أصلح خطأ API في منصة تعليمية وابحث في التوثيق قبل اقتراح التكامل المناسب.");
    expect(plan?.workstreams.map((stream) => stream.id)).toEqual(expect.arrayContaining(["architecture", "code", "research", "integration", "sandbox"]));
    expect(plan?.boundaries.join(" ")).toMatch(/ليست تنفيذًا تلقائيًا/);
  });
  it("rejects underspecified tasks and bounds retained input", () => {
    expect(createAiRoutingPlan("أصلح الخطأ")).toBeNull();
    expect(normalizeAiTask("x".repeat(AI_ROUTER_MAX_LENGTH + 100))).toHaveLength(AI_ROUTER_MAX_LENGTH);
  });
  it("uses only HTTPS official references", () => {
    expect(vettedAiProviderReferences.every((provider) => provider.url.startsWith("https://"))).toBe(true);
  });
});
