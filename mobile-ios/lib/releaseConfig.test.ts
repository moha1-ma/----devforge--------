import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const projectRoot = new URL("..", import.meta.url);
const appConfig = JSON.parse(readFileSync(new URL("app.json", projectRoot), "utf8"));
const easConfig = JSON.parse(readFileSync(new URL("eas.json", projectRoot), "utf8"));

describe("iOS release configuration", () => {
  it("uses a unique independent bundle identifier rather than the copied project identifier", () => {
    expect(appConfig.expo.ios.bundleIdentifier).toBe("space.manus.devforgeapp.grp92cnd");
    expect(appConfig.expo.ios.bundleIdentifier).not.toBe("com.devforge.platform");
  });

  it("defines explicit preview and production profiles that both target this independent deployment", () => {
    expect(easConfig.build.preview).toMatchObject({ distribution: "internal" });
    expect(easConfig.build.preview.env.EXPO_PUBLIC_DEVFORGE_ORIGIN).toBe("https://devforgeapp-grp92cnd.manus.space");
    expect(easConfig.build.production.env.EXPO_PUBLIC_DEVFORGE_ORIGIN).toBe("https://devforgeapp-grp92cnd.manus.space");
  });
});
