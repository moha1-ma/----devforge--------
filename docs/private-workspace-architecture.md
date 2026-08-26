# DevForge private workspace architecture

## Access model

DevForge uses the existing authenticated identity as the security boundary. Every project, source file, file revision, and AI conversation is linked to the signed-in user ID. All server procedures verify that a requested project belongs to that user before returning or changing data. This means another authenticated user receives neither a project listing nor a file listing for the owner's workspace.

The initial owner string supplied in the conversation is treated as a **private recovery reference**, not as a standalone password. A hard-coded client-side code would be publicly inspectable and would weaken the platform. The deployable access control therefore relies on authenticated identity and server-side ownership checks; any future recovery code must be stored only as a managed secret hash, never in client code or database plaintext.

## Code files and import policy

Text-based source files are stored as private objects in platform storage. The database stores only ownership metadata, file paths, revision metadata, and storage keys. Imports are limited to text-oriented formats and a constrained size. Uploading a file never executes it, installs dependencies, starts a process, or runs shell commands.

## AI policy

The first release provides an AI workspace and persistent chat data model, but no paid provider is enabled by default. A hosted model call can consume credits, and a truly free hosted model cannot be guaranteed. DevForge therefore supports a future owner-controlled **local AI endpoint** (for example an Ollama-compatible server on the owner's machine) and keeps the assistant disabled until that legal, user-operated endpoint is configured. The platform must not probe, bypass, or attack third-party AI infrastructure.

## Runtime boundary

The managed web application can safely manage and preview text source files. It cannot safely execute arbitrary uploaded Python, JavaScript, native binaries, containers, or dependency installers inside the production web process. Execution belongs in a separately isolated developer environment, not in the deployed application.
