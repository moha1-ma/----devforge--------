import { describe, expect, it } from "vitest";
import { researchQualityInstruction, resolveResearchMode } from "./aiResearchPolicy";

describe("AI research policy", () => {
  it("keeps external research off unless it is selected", () => {
    expect(resolveResearchMode(undefined)).toMatchObject({ mode: "off", requested: false, executed: false, provider: "not-requested" });
    expect(researchQualityInstruction()).toContain("لم يطلب المالك بحثًا خارجيًا");
  });

  it("never claims a search happened when research is requested without an app provider", () => {
    expect(resolveResearchMode("trusted-web")).toMatchObject({ requested: true, executed: false, provider: "not-configured" });
    expect(researchQualityInstruction("trusted-web")).toContain("لا تدّع إجراء بحث");
  });
});
