import { describe, expect, it } from "vitest";
import { isTrustedDevForgeNavigation, makeWorkspaceUrl, normalizeDevForgeOrigin } from "./devforgeRoutes";

const independentOrigin = "https://devforge-copy.manus.space";

describe("makeWorkspaceUrl", () => {
  it("uses the configured independent origin and creates a hash route for the assistant", () => {
    expect(makeWorkspaceUrl("/ai", independentOrigin)).toBe("https://devforge-copy.manus.space/?ios=1#/ai");
  });

  it("creates the hash root without a duplicate slash", () => {
    expect(makeWorkspaceUrl("/", independentOrigin)).toBe("https://devforge-copy.manus.space/?ios=1#/");
  });

  it("supports educational and marketplace routes without leaving the trusted DevForge origin", () => {
    expect(makeWorkspaceUrl("/plans", independentOrigin)).toBe("https://devforge-copy.manus.space/?ios=1#/plans");
    expect(makeWorkspaceUrl("/domains", independentOrigin)).toBe("https://devforge-copy.manus.space/?ios=1#/domains");
  });

  it("accepts only a clean HTTPS origin for the independently deployed platform", () => {
    expect(normalizeDevForgeOrigin("https://devforge-copy.manus.space/")).toBe(independentOrigin);
    expect(normalizeDevForgeOrigin("http://devforge-copy.manus.space")).toBeNull();
    expect(normalizeDevForgeOrigin("https://user:secret@devforge-copy.manus.space")).toBeNull();
    expect(normalizeDevForgeOrigin("https://devforge-copy.manus.space/#/ai")).toBeNull();
  });

  it("allows only the configured platform and official Manus OAuth pages inside the embedded browser", () => {
    expect(isTrustedDevForgeNavigation("https://devforge-copy.manus.space/?ios=1#/ai", independentOrigin)).toBe(true);
    expect(isTrustedDevForgeNavigation("https://oauth.manus.im/login", independentOrigin)).toBe(true);
    expect(isTrustedDevForgeNavigation("https://example.com/redirect", independentOrigin)).toBe(false);
    expect(isTrustedDevForgeNavigation("javascript:alert(1)", independentOrigin)).toBe(false);
  });
});
