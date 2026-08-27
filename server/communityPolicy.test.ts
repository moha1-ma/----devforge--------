import { describe, expect, it } from "vitest";
import { validateCommunityInput, validateCommunityPost, validateProfileInput } from "../shared/communityPolicy";
describe("community policy", () => {
  it("keeps discovery opt-in and removes contact data from public profile fields", () => { expect(validateProfileInput({ alias: "مطور آمن", bio: "أهتم بتجارب الويب التعليمية", skills: "TypeScript, Python", discoveryEnabled: true })).toEqual({ alias: "مطور آمن", bio: "أهتم بتجارب الويب التعليمية", skills: "TypeScript, Python", discoveryEnabled: true }); expect(() => validateProfileInput({ alias: "name@example.com", discoveryEnabled: true })).toThrow("بريد"); });
  it("keeps communities and posts reviewable with useful content limits", () => { expect(validateCommunityInput({ name: "نادي الويب", description: "مساحة منظمة لمناقشة تجربة بناء مواقع مفيدة." })).toMatchObject({ name: "نادي الويب" }); expect(() => validateCommunityInput({ name: "نادي", description: "راسلنا على https://example.com" })).toThrow("بيانات اتصال"); expect(validateCommunityPost({ title: "فكرة جلسة", content: "أقترح جلسة لمناقشة تحسين واجهات الاستخدام للمتطوعين." })).toMatchObject({ title: "فكرة جلسة" }); });
});
