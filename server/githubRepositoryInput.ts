export function normalizeGithubRepositoryInput(value: string) {
  const raw = value.trim();
  if (!raw) throw new Error("اكتب اسم المستودع بصيغة owner/repository أو رابط GitHub كامل");

  const normalized = raw
    .replace(/^https?:\/\/(?:www\.)?github\.com\//i, "")
    .replace(/^git@github\.com:/i, "")
    .replace(/\.git\/?$/i, "")
    .replace(/\/+$/, "");

  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(normalized)) {
    throw new Error("اكتب المستودع بصيغة owner/repository أو https://github.com/owner/repository");
  }
  return normalized;
}
