import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import React from "react";
import { DeveloperCenterProposalCard } from "./DeveloperCenterProposalCard";

const proposalJson = JSON.stringify({ executionStatus: "review-only", headline: "منصة تعليمية", language: "Python", scope: ["لوحة مدير"], architecture: ["واجهة React"], websiteOutline: { title: "تعلم بثقة", pages: ["الرئيسية", "المسارات"], hierarchy: ["الرئيسية > المسارات"], primaryCta: "ابدأ التعلم" }, codeSketch: ["type Course = {}"], testPlan: ["اختبار العزل"], risks: ["الخصوصية"], securityReview: ["صلاحيات محددة"], aiReview: ["حماية المدخلات"], reviewTasks: [{ title: "مراجعة الصلاحيات", objective: "تحقق من الفصل بين الأدوار", category: "security" }], approvalsRequired: ["اعتماد المالك"] });

describe("DeveloperCenterProposalCard", () => {
  it("renders a visible review-only boundary and structured proposal sections", () => {
    const html = renderToStaticMarkup(<DeveloperCenterProposalCard headline="منصة تعليمية" mode="website" proposalJson={proposalJson} />);
    expect(html).toContain("للمراجعة فقط");
    expect(html).toContain("بنية الموقع والعناوين");
    expect(html).toContain("لا تغيّر ملفات أو تشغّل كودًا أو تنشر أي شيء");
    expect(html).toContain("اعتماد المالك");
    expect(html).toContain("Python");
    expect(html).toContain("مهام المراجعة");
    expect(html).toContain("sm:grid-cols-2");
  });
});
