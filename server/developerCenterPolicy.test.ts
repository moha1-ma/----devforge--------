import { describe, expect, it } from "vitest";
import { developerCenterOutputSchema, developerCenterSafetyInstruction, inspectDeveloperCenterRequest, parseDeveloperCenterOutput } from "./developerCenterPolicy";

describe("Developer Center review-only policy", () => {
  it("rejects requests that explicitly seek external or mutating execution", () => {
    expect(inspectDeveloperCenterRequest("شغّل أمر pnpm وانشر الموقع الآن")).toMatchObject({ allowed: false });
    expect(inspectDeveloperCenterRequest("deploy the generated site now")).toMatchObject({ allowed: false });
    expect(inspectDeveloperCenterRequest("أنشئ infinite commands للتنفيذ")).toMatchObject({ allowed: false });
  });

  it("allows planning requests and requires review-only output safeguards", () => {
    expect(inspectDeveloperCenterRequest("صمم منصة تعليمية ذات وحدات معقدة")).toEqual({ allowed: true });
    expect(developerCenterSafetyInstruction).toContain("لا تنفذ أوامر");
    expect(developerCenterOutputSchema.json_schema.schema.required).toContain("approvalsRequired");
    expect(developerCenterOutputSchema.json_schema.schema.required).toContain("reviewTasks");
  });

  it("accepts only structured review-only proposals", () => {
    const valid = JSON.stringify({ executionStatus: "review-only", headline: "منصة تعليمية", language: "Python", scope: ["لوحة"], architecture: ["واجهة"], websiteOutline: { title: "تعلم", pages: ["الرئيسية"], hierarchy: ["الرئيسية > مسار"], primaryCta: "ابدأ" }, codeSketch: ["interface Course {}"], testPlan: ["اختبار العزل"], risks: ["الخصوصية"], securityReview: ["صلاحيات"], aiReview: ["مدخلات"], reviewTasks: [{ title: "مراجعة", objective: "فحص", category: "security" }], approvalsRequired: ["اعتماد المالك"] });
    expect(parseDeveloperCenterOutput(valid).headline).toBe("منصة تعليمية");
    expect(() => parseDeveloperCenterOutput(JSON.stringify({ executionStatus: "applied" }))).toThrow();
  });
});
