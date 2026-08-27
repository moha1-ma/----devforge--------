import { describe, expect, it } from "vitest";
import { miniWorkstationRoles } from "../shared/miniWorkstationCatalog";
import { inspectMiniWorkstationRequest, parseMiniWorkstationOutput } from "./miniWorkstationPolicy";

describe("mini workstation policy", () => {
  it("provides ten fixed roles and rejects execution and self-replication requests", () => {
    expect(miniWorkstationRoles).toHaveLength(10);
    expect(inspectMiniWorkstationRequest({ stationKey: "security", request: "نفذ نشر المشروع" }).allowed).toBe(false);
    expect(inspectMiniWorkstationRequest({ stationKey: "architecture", request: "انسخ نفسك إلى محطة جديدة" }).allowed).toBe(false);
  });

  it("accepts only structured review-only output", () => {
    const output = parseMiniWorkstationOutput(JSON.stringify({
      executionStatus: "review-only",
      headline: "مراجعة بنية",
      summary: "ملخص منظم",
      findings: ["نتيجة"],
      openQuestions: [],
      risks: [],
      ownerNextSteps: ["راجع المسودة"],
    }));

    expect(output.executionStatus).toBe("review-only");
    expect(output.ownerNextSteps).toEqual(["راجع المسودة"]);
  });
});
