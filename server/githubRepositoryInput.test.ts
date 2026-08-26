import { describe, expect, it } from "vitest";
import { normalizeGithubRepositoryInput } from "./githubRepositoryInput";

describe("normalizeGithubRepositoryInput", () => {
  it("keeps the compact owner/repository form", () => {
    expect(normalizeGithubRepositoryInput("owner/repository")).toBe("owner/repository");
  });

  it("normalizes canonical HTTPS and SSH GitHub repository links", () => {
    expect(normalizeGithubRepositoryInput("https://github.com/owner/repository.git")).toBe("owner/repository");
    expect(normalizeGithubRepositoryInput("git@github.com:owner/repository.git")).toBe("owner/repository");
  });

  it("rejects incomplete or non-GitHub-style repository inputs", () => {
    expect(() => normalizeGithubRepositoryInput("https://git")).toThrow("owner/repository");
    expect(() => normalizeGithubRepositoryInput("https://example.com/owner/repository")).toThrow("owner/repository");
  });
});
