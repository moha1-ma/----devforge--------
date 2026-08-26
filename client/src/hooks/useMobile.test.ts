import { describe, expect, it } from "vitest";
import { getEffectiveViewportWidth, isMobileViewport } from "./useMobile";

describe("mobile viewport detection", () => {
  it("uses the physical iPhone screen width when a standalone container reports a wide innerWidth", () => {
    expect(getEffectiveViewportWidth({ innerWidth: 1170, screenWidth: 390, visualViewportWidth: 390 })).toBe(390);
    expect(isMobileViewport(getEffectiveViewportWidth({ innerWidth: 1170, screenWidth: 390, visualViewportWidth: 390 }))).toBe(true);
  });

  it("keeps a normal desktop viewport wide", () => {
    expect(getEffectiveViewportWidth({ innerWidth: 1280, screenWidth: 1280 })).toBe(1280);
    expect(isMobileViewport(1280)).toBe(false);
  });
});
