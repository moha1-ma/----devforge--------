import crypto from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { githubAggregationJobs, githubConnections } from "../drizzle/schema";
import { getDb } from "./db";
import { ENV } from "./_core/env";

type Source = { fullName: string; defaultBranch: string; canDelete: boolean };
type FileEntry = {
  path: string;
  sha: string;
  source: string;
  mode: "100644" | "100755" | "120000";
};
type Conflict = { path: string; sources: string[]; reason: string };
const api = "https://api.github.com";
class GithubRequestError extends Error {
  constructor(readonly status: number) {
    super(`GitHub request failed (${status})`);
  }
}
// Derives a fixed-length AES-256 key from the configured encryption secret.
function key() {
  const raw = ENV.githubTokenEncryptionKey;
  if (!raw) throw new Error("GITHUB_TOKEN_ENCRYPTION_KEY is required");
  return crypto.createHash("sha256").update(raw).digest();
}
// Encrypts a GitHub access token with AES-256-GCM for storage; the result
// packs the IV, auth tag, and ciphertext as base64url segments.
function encrypt(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${body.toString("base64url")}`;
}
// Reverses `encrypt`, returning the original plaintext access token.
function decrypt(value: string) {
  const [iv, tag, body] = value.split(".");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(iv, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(body, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
// Performs an authenticated GitHub REST API request and parses the JSON
// response, throwing `GithubRequestError` on a non-OK status.
async function github<T>(
  token: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${api}${path}`, {
    ...init,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    signal: init?.signal ?? AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new GithubRequestError(response.status);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
// Like `github`, but returns null instead of throwing on 404/409 so callers
// can treat "not found"/"conflict" as an expected outcome.
async function githubOrNull<T>(token: string, path: string): Promise<T | null> {
  try {
    return await github<T>(token, path);
  } catch (error) {
    if (
      error instanceof GithubRequestError &&
      (error.status === 404 || error.status === 409)
    )
      return null;
    throw error;
  }
}

// Runs `worker` over `items` with at most `limit` requests in flight at
// once, preserving each result at its original index.
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const run = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await worker(items[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}
// Looks up and decrypts the stored GitHub access token for the given owner.
async function tokenFor(ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const [connection] = await db
    .select()
    .from(githubConnections)
    .where(eq(githubConnections.ownerId, ownerId))
    .limit(1);
  if (!connection) throw new Error("اربط حساب GitHub أولًا");
  return decrypt(connection.encryptedToken);
}
// Persists (or updates) a user's GitHub connection, encrypting the access
// token before storage.
export async function saveGithubConnection(
  ownerId: number,
  login: string,
  token: string
) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  await db
    .insert(githubConnections)
    .values({ ownerId, githubLogin: login, encryptedToken: encrypt(token) })
    .onDuplicateKeyUpdate({
      set: {
        githubLogin: login,
        encryptedToken: encrypt(token),
        updatedAt: new Date(),
      },
    });
}
// Returns the connected GitHub login for an owner, or null if unconnected.
export async function getGithubConnection(ownerId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select({ login: githubConnections.githubLogin })
    .from(githubConnections)
    .where(eq(githubConnections.ownerId, ownerId))
    .limit(1);
  return row ?? null;
}
// Lists every repository the connected GitHub account can access (owned,
// collaborator, or org member), paging through the GitHub API as needed.
export async function listAccessibleRepositories(
  ownerId: number
): Promise<Source[]> {
  const token = await tokenFor(ownerId);
  const result: Source[] = [];
  for (let page = 1; page < 101; page++) {
    const rows = await github<
      Array<{
        full_name: string;
        default_branch: string;
        permissions?: { admin?: boolean };
      }>
    >(
      token,
      `/user/repos?affiliation=owner,collaborator,organization_member&visibility=all&per_page=100&page=${page}`
    );
    result.push(
      ...rows.map(row => ({
        fullName: row.full_name,
        defaultBranch: row.default_branch,
        canDelete: Boolean(row.permissions?.admin),
      }))
    );
    if (rows.length < 100) break;
  }
  return result;
}
// Builds a preview of merging every accessible repository into one
// destination: walks each source's file tree, records the winning file for
// each path, and flags submodules/unsupported modes/differing content as
// conflicts requiring manual review before publishing.
export async function createAggregationPreview(
  ownerId: number,
  destinationName: string
) {
  const token = await tokenFor(ownerId);
  const sources = await listAccessibleRepositories(ownerId);
  const files = new Map<string, FileEntry>();
  const conflicts: Conflict[] = [];
  for (const source of sources) {
    const tree = await github<{
      truncated?: boolean;
      tree: Array<{ path: string; type: string; sha: string; mode: string }>;
    }>(
      token,
      `/repos/${source.fullName}/git/trees/${encodeURIComponent(source.defaultBranch)}?recursive=1`
    );
    if (tree.truncated)
      throw new Error(
        `تعذر نسخ كل ملفات ${source.fullName}: أعاد GitHub شجرة ملفات مقتطعة.`
      );
    for (const item of tree.tree) {
      if (item.type === "commit") {
        conflicts.push({
          path: item.path,
          sources: [source.fullName],
          reason: "Git submodule requires review before it can be copied",
        });
        continue;
      }
      if (item.type !== "blob") continue;
      if (
        item.mode !== "100644" &&
        item.mode !== "100755" &&
        item.mode !== "120000"
      ) {
        conflicts.push({
          path: item.path,
          sources: [source.fullName],
          reason: `Unsupported Git mode ${item.mode}`,
        });
        continue;
      }
      const existing = files.get(item.path);
      if (!existing)
        files.set(item.path, {
          path: item.path,
          sha: item.sha,
          source: source.fullName,
          mode: item.mode,
        });
      else if (existing.sha !== item.sha || existing.mode !== item.mode)
        conflicts.push({
          path: item.path,
          sources: [existing.source, source.fullName],
          reason: "Different file contents or modes require review",
        });
    }
  }
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const [created] = await db
    .insert(githubAggregationJobs)
    .values({
      ownerId,
      destinationName,
      status: conflicts.length ? "needs-review" : "preview",
      sourcesJson: JSON.stringify(sources),
      filesJson: JSON.stringify(Array.from(files.values())),
      conflictsJson: JSON.stringify(conflicts),
    })
    .$returningId();
  return getAggregationJob(ownerId, created.id);
}
// Fetches an aggregation job (a specific one by `id`, or the most recently
// updated one for the owner) and parses its stored JSON columns back into
// structured sources/files/conflicts/deletion results.
export async function getAggregationJob(ownerId: number, id?: number) {
  const db = await getDb();
  if (!db) return null;
  const where = id
    ? and(
        eq(githubAggregationJobs.ownerId, ownerId),
        eq(githubAggregationJobs.id, id)
      )
    : eq(githubAggregationJobs.ownerId, ownerId);
  const [job] = await db
    .select()
    .from(githubAggregationJobs)
    .where(where)
    .orderBy(desc(githubAggregationJobs.updatedAt))
    .limit(1);
  if (!job) return null;
  const storedFiles = JSON.parse(job.filesJson) as Array<
    Omit<FileEntry, "mode"> & { mode?: FileEntry["mode"] }
  >;
  return {
    ...job,
    sources: JSON.parse(job.sourcesJson) as Source[],
    files: storedFiles.map(file => ({
      ...file,
      mode: file.mode ?? ("100644" as const),
    })),
    conflicts: JSON.parse(job.conflictsJson) as Conflict[],
    deletion: job.deletionJson ? JSON.parse(job.deletionJson) : null,
  };
}
// Publishes an aggregation job: creates (or reuses) the destination
// repository, copies every source blob's bytes into it, and creates a
// single commit/ref, verifying the resulting tree's file count matches
// before marking the job "published".
export async function publishAggregation(ownerId: number, id: number) {
  const job = await getAggregationJob(ownerId, id);
  if (!job) throw new Error("عملية التجميع غير موجودة");
  if (job.status === "published" || job.status === "sources-deleted")
    return job;
  if (job.conflicts.length) throw new Error("حل تعارضات الملفات قبل النشر");
  const token = await tokenFor(ownerId);
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  let destination: { full_name: string; html_url: string };
  if (job.destinationFullName) {
    destination = {
      full_name: job.destinationFullName,
      html_url:
        job.destinationUrl ?? `https://github.com/${job.destinationFullName}`,
    };
  } else {
    destination = await github<{ full_name: string; html_url: string }>(
      token,
      "/user/repos",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: job.destinationName,
          private: true,
          auto_init: false,
        }),
      }
    );
    try {
      await db
        .update(githubAggregationJobs)
        .set({
          status: "publishing",
          destinationFullName: destination.full_name,
          destinationUrl: destination.html_url,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(githubAggregationJobs.id, id),
            eq(githubAggregationJobs.ownerId, ownerId)
          )
        );
    } catch (error) {
      try {
        await github(token, `/repos/${destination.full_name}`, {
          method: "DELETE",
        });
      } catch {
        /* Best-effort compensation for a repository that was not persisted. */
      }
      throw error;
    }
  }
  const existingRef = await githubOrNull<{ object: { sha: string } }>(
    token,
    `/repos/${destination.full_name}/git/ref/heads/main`
  );
  if (existingRef) {
    const existingCommit = await github<{ tree: { sha: string } }>(
      token,
      `/repos/${destination.full_name}/git/commits/${existingRef.object.sha}`
    );
    const existingTree = await github<{
      truncated?: boolean;
      tree: Array<{ type: string }>;
    }>(
      token,
      `/repos/${destination.full_name}/git/trees/${existingCommit.tree.sha}?recursive=1`
    );
    const existingFileCount = existingTree.tree.filter(
      item => item.type === "blob"
    ).length;
    if (existingTree.truncated || existingFileCount !== job.files.length)
      throw new Error(
        `المستودع الوجهة موجود لكنه غير مكتمل: المتوقع ${job.files.length} ملفًا، وُجد ${existingFileCount}.`
      );
    await db
      .update(githubAggregationJobs)
      .set({
        status: "published",
        destinationFullName: destination.full_name,
        destinationUrl: destination.html_url,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(githubAggregationJobs.id, id),
          eq(githubAggregationJobs.ownerId, ownerId)
        )
      );
    return getAggregationJob(ownerId, id);
  }
  // GitHub accepts source blob SHA only within its source repository, so copy each blob's bytes before creating the destination tree.
  const copied = await mapWithConcurrency(job.files, 4, async file => {
    const content = await github<{ content: string; encoding: string }>(
      token,
      `/repos/${file.source}/git/blobs/${file.sha}`
    );
    return github<{ sha: string }>(
      token,
      `/repos/${destination.full_name}/git/blobs`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          content: content.content,
          encoding: content.encoding,
        }),
      }
    );
  });
  const tree = await github<{ sha: string }>(
    token,
    `/repos/${destination.full_name}/git/trees`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        tree: job.files.map((file, index) => ({
          path: file.path,
          mode: file.mode,
          type: "blob",
          sha: copied[index].sha,
        })),
      }),
    }
  );
  const commit = await github<{ sha: string }>(
    token,
    `/repos/${destination.full_name}/git/commits`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: "Aggregate accessible GitHub repositories",
        tree: tree.sha,
        parents: [],
      }),
    }
  );
  await github(token, `/repos/${destination.full_name}/git/refs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ref: "refs/heads/main", sha: commit.sha }),
  });
  const verifiedTree = await github<{
    truncated?: boolean;
    tree: Array<{ type: string }>;
  }>(
    token,
    `/repos/${destination.full_name}/git/trees/${tree.sha}?recursive=1`
  );
  const copiedFileCount = verifiedTree.tree.filter(
    item => item.type === "blob"
  ).length;
  if (verifiedTree.truncated || copiedFileCount !== job.files.length)
    throw new Error(
      `فشل التحقق من اكتمال النسخ: المتوقع ${job.files.length} ملفًا، وُجد ${copiedFileCount}.`
    );
  await db
    .update(githubAggregationJobs)
    .set({
      status: "published",
      destinationFullName: destination.full_name,
      destinationUrl: destination.html_url,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(githubAggregationJobs.id, id),
        eq(githubAggregationJobs.ownerId, ownerId)
      )
    );
  return getAggregationJob(ownerId, id);
}
// Deletes the source repositories of a published aggregation job that the
// caller has admin rights on, skipping (rather than failing) any source
// that cannot be deleted, and records the outcome on the job.
export async function deleteAggregationSources(ownerId: number, id: number) {
  const job = await getAggregationJob(ownerId, id);
  if (!job || job.status !== "published")
    throw new Error("لا يمكن حذف المصادر قبل نشر المستودع الوجهة");
  const token = await tokenFor(ownerId);
  const deleted: string[] = [];
  const skipped: string[] = [];
  for (const source of job.sources) {
    if (!source.canDelete) {
      skipped.push(source.fullName);
      continue;
    }
    try {
      await github(token, `/repos/${source.fullName}`, { method: "DELETE" });
      deleted.push(source.fullName);
    } catch {
      skipped.push(source.fullName);
    }
  }
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  await db
    .update(githubAggregationJobs)
    .set({
      status: "sources-deleted",
      deletionJson: JSON.stringify({ deleted, skipped }),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(githubAggregationJobs.id, id),
        eq(githubAggregationJobs.ownerId, ownerId)
      )
    );
  return getAggregationJob(ownerId, id);
}
