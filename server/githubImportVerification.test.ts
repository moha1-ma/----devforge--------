import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ listPrivateSourceFiles: vi.fn(), getGithubProjectLink: vi.fn() }));
vi.mock("./privateWorkspace", () => ({ listPrivateSourceFiles: mocks.listPrivateSourceFiles, getGithubProjectLink: mocks.getGithubProjectLink }));

import { verifyGithubImportForOwner } from "./githubImportVerification";

describe("verifyGithubImportForOwner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listPrivateSourceFiles.mockResolvedValue([{ id: 12, path: "github-imports/repo/README.md", language: "markdown", sizeBytes: 400 }]);
    mocks.getGithubProjectLink.mockResolvedValue({ repositoryFullName: "owner/repo", defaultBranch: "main" });
  });

  it("uses the requesting owner for both source and GitHub checks", async () => {
    const result = await verifyGithubImportForOwner({ ownerId: 9, projectId: 4, path: "github-imports/repo/README.md", repositoryFullName: "https://github.com/owner/repo" });
    expect(mocks.listPrivateSourceFiles).toHaveBeenCalledWith(9, 4);
    expect(mocks.getGithubProjectLink).toHaveBeenCalledWith(9, 4);
    expect(result).toMatchObject({ verified: true, source: { path: "github-imports/repo/README.md" }, github: { repositoryFullName: "owner/repo" } });
  });

  it("does not verify an import when the owner-approved repository link differs", async () => {
    mocks.getGithubProjectLink.mockResolvedValue({ repositoryFullName: "owner/other-repo", defaultBranch: "main" });
    const result = await verifyGithubImportForOwner({ ownerId: 9, projectId: 4, path: "github-imports/repo/README.md", repositoryFullName: "owner/repo" });
    expect(result.verified).toBe(false);
    expect(result.github).toBeNull();
  });
});
