# DevForge and GitHub: optional free workflow

DevForge does not create repositories, upload code, or connect an account silently. These actions change an external service and must remain under the owner's explicit control.

## Safe free workflow

1. Create a private repository from the GitHub account you control.
2. Open the GitHub area in DevForge and choose the repository only after authenticating with GitHub.
3. Export selected text files as a commit after reviewing the exact path list and commit message.
4. Import only a selected branch and review paths before accepting any changes.

## Scope for the first connector

The future connector stores repository metadata and status only. A GitHub access token must be held as a managed server secret; it must never be written into source files, browser storage, AI prompts, or source-file revisions. Import never executes workflows, package scripts, Actions, Dockerfiles, or any downloaded code.

## Current DevForge state

The platform has an owner-scoped `githubProjectLinks` table ready for repository metadata. The user interface should present the link as optional until an explicit GitHub authentication flow is configured.
