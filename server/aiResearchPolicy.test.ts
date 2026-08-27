import { describe, expect, it } from "vitest";
import { researchQualityInstruction, resolveResearchMode } from "./aiResearchPolicy";

describe("AI research policy", () => {
  it("keeps external research off unless it is selected", () => {
    expect(resolveResearchMode(undefined)).toMatchObject({ mode: "off", requested: false, executed: false, provider: "not-requested" });
    expect(researchQualityInstruction()).toContain("لم يطلب المالك بحثًا خارجيًا");
  });

  it("requests the embedded search without claiming a result or source before it returns", () => {
    expect(resolveResearchMode("trusted-web")).toMatchObject({ requested: true, executed: false, provider: "built-in-web-search" });
    expect(researchQualityInstruction("trusted-web")).toContain("لا تخترع مصادر أو روابط");
  });
});
