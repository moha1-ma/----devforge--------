import { normalizeGithubRepositoryInput } from "./githubRepositoryInput";
import { getGithubProjectLink, listPrivateSourceFiles } from "./privateWorkspace";

export async function verifyGithubImportForOwner(input: { ownerId: number; projectId: number; path: string; repositoryFullName: string }) {
  const repositoryFullName = normalizeGithubRepositoryInput(input.repositoryFullName);
  const [sourceFiles, githubLink] = await Promise.all([
    listPrivateSourceFiles(input.ownerId, input.projectId),
    getGithubProjectLink(input.ownerId, input.projectId),
  ]);
  const source = sourceFiles.find(file => file.path === input.path) ?? null;
  const repositoryMatches = githubLink?.repositoryFullName === repositoryFullName;
  return {
    verified: Boolean(source && repositoryMatches),
    source: source ? { id: source.id, path: source.path, language: source.language, sizeBytes: source.sizeBytes } : null,
    github: repositoryMatches && githubLink ? { repositoryFullName: githubLink.repositoryFullName, defaultBranch: githubLink.defaultBranch } : null,
  };
}
