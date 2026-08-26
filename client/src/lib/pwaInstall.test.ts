import { describe, expect, it } from "vitest";
import { isIosUserAgent, shouldShowIosInstallGuide } from "./pwaInstall";

describe("iPhone PWA install guidance", () => {
  it("recognizes iPhone and iPad user agents", () => {
    expect(isIosUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe(true);
    expect(isIosUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)")).toBe(false);
  });

  it("shows the guide only before the app is installed", () => {
    expect(shouldShowIosInstallGuide("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", false)).toBe(true);
    expect(shouldShowIosInstallGuide("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", true)).toBe(false);
  });
});
