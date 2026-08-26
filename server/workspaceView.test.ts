import { describe, expect, it } from "vitest";
import { canSubmitWorkItem, groupWorkItemsByColumn, matchesWorkspaceQuery } from "../shared/workspaceView";

describe("workspace view helpers", () => {
  it("filters records by Arabic or engineering key context", () => {
    expect(matchesWorkspaceQuery({ key: "DEV-12", title: "تحسين المصادقة" }, "dev")).toBe(true);
    expect(matchesWorkspaceQuery({ key: "DEV-12", title: "تحسين المصادقة" }, "مصادقة")).toBe(true);
    expect(matchesWorkspaceQuery({ key: "DEV-12", title: "تحسين المصادقة" }, "إصدار")).toBe(false);
  });

  it("groups a board into its four rendered columns", () => {
    const groups = groupWorkItemsByColumn([{ status: "backlog", id: 1 }, { status: "review", id: 2 }, { status: "review", id: 3 }]);
    expect(groups.backlog).toHaveLength(1);
    expect(groups.review).toHaveLength(2);
    expect(groups.done).toHaveLength(0);
  });

  it("requires a project and meaningful title before work-item submission", () => {
    expect(canSubmitWorkItem("3", "إصلاح واجهة الدخول")).toBe(true);
    expect(canSubmitWorkItem("", "إصلاح واجهة الدخول")).toBe(false);
    expect(canSubmitWorkItem("3", " ")).toBe(false);
  });
});
