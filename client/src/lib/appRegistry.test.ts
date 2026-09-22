import { describe, expect, it } from "vitest";
import { appRegistry, findAppByPath, getLocalizedApps, primaryAppKeys } from "./appRegistry";

describe("app registry", () => {
  it("keeps stable, unique app keys and routes", () => {
    expect(new Set(appRegistry.map(app => app.key)).size).toBe(appRegistry.length);
    expect(new Set(appRegistry.map(app => app.path)).size).toBe(appRegistry.length);
    expect(appRegistry.every(app => app.path.startsWith("/") && app.label.ar && app.label.en)).toBe(true);
  });

  it("exposes the five primary daily-development destinations", () => {
    expect(primaryAppKeys).toEqual(["overview", "projects", "code", "ai", "apps"]);
    expect(primaryAppKeys.map(key => appRegistry.find(app => app.key === key)?.path)).toEqual(["/workspace", "/projects", "/code", "/ai", "/apps"]);
  });

  it("localizes labels and resolves the current route", () => {
    expect(getLocalizedApps("ar").find(app => app.key === "apps")?.title).toBe("التطبيقات");
    expect(getLocalizedApps("en").find(app => app.key === "apps")?.title).toBe("Apps");
    expect(findAppByPath("/github")?.key).toBe("github");
  });
});
