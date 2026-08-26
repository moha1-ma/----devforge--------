import { describe, expect, it } from "vitest";
import { makeWorkspaceUrl } from "./devforgeRoutes";

describe("makeWorkspaceUrl", () => {
  it("keeps the hosted origin and creates a hash route for the assistant", () => {
    expect(makeWorkspaceUrl("/ai")).toBe("https://devforge-acdjkepw.manus.space/?ios=1#/ai");
  });

  it("creates the hash root without a duplicate slash", () => {
    expect(makeWorkspaceUrl("/")).toBe("https://devforge-acdjkepw.manus.space/?ios=1#/");
  });

  it("supports educational and marketplace routes without leaving the trusted DevForge origin", () => {
    expect(makeWorkspaceUrl("/plans")).toBe("https://devforge-acdjkepw.manus.space/?ios=1#/plans");
    expect(makeWorkspaceUrl("/domains")).toBe("https://devforge-acdjkepw.manus.space/?ios=1#/domains");
  });
});
