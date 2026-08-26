import { describe, expect, it } from "vitest";
import { calculateProjectHealth, formatWorkItemKey } from "./platform";

describe("calculateProjectHealth", () => {
  it("marks failed checks as at risk", () => {
    expect(calculateProjectHealth({ failedChecks: 1, overdueItems: 0, waitingForReview: 0 })).toBe("at-risk");
  });

  it("marks review congestion as watch", () => {
    expect(calculateProjectHealth({ failedChecks: 0, overdueItems: 0, waitingForReview: 5 })).toBe("watch");
  });

  it("marks a clear delivery flow as on track", () => {
    expect(calculateProjectHealth({ failedChecks: 0, overdueItems: 0, waitingForReview: 1 })).toBe("on-track");
  });
});

describe("formatWorkItemKey", () => {
  it("normalizes project keys and protects against invalid sequence values", () => {
    expect(formatWorkItemKey(" dev forge ", 0)).toBe("DEVFORGE-1");
  });
});
