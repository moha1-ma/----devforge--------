import { describe, expect, it } from "vitest";
import { shouldSidebarStartOpen } from "./layoutNavigation";

describe("dashboard navigation defaults", () => {
  it("keeps the navigation drawer closed on a phone-sized viewport", () => {
    expect(shouldSidebarStartOpen(390)).toBe(false);
  });

  it("keeps the desktop sidebar available on a wide viewport", () => {
    expect(shouldSidebarStartOpen(1280)).toBe(true);
  });
});
