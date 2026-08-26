import { describe, expect, it } from "vitest";
import { developerLanguageCatalog, getDeveloperLanguage } from "../shared/developerLanguageCatalog";

describe("developer language catalog", () => {
  it("offers a broad unique catalog including Python with a non-execution boundary", () => {
    expect(developerLanguageCatalog.length).toBeGreaterThanOrEqual(12);
    expect(new Set(developerLanguageCatalog.map(language => language.key)).size).toBe(developerLanguageCatalog.length);
    expect(getDeveloperLanguage("python")).toMatchObject({ label: "Python", reviewBoundary: expect.stringContaining("لا يشغّل Python") });
  });

  it("does not resolve unknown languages into a runnable capability", () => {
    expect(getDeveloperLanguage("unknown-command-language")).toBeNull();
  });
});
