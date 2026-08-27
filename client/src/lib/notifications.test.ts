import { describe, expect, it } from "vitest";
import { getNotificationsUnavailableMessage } from "./notifications";

describe("notifications unavailable state", () => {
  it("returns a clear Arabic status instead of leaving the control silent", () => {
    expect(getNotificationsUnavailableMessage()).toMatch(/لا توجد تنبيهات/);
  });
});
