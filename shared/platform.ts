export type ProjectHealth = "on-track" | "watch" | "at-risk";

export type DeliverySignals = {
  failedChecks: number;
  overdueItems: number;
  waitingForReview: number;
};

export function calculateProjectHealth({
  failedChecks,
  overdueItems,
  waitingForReview,
}: DeliverySignals): ProjectHealth {
  if (failedChecks > 0 || overdueItems > 2) return "at-risk";
  if (overdueItems > 0 || waitingForReview > 4) return "watch";
  return "on-track";
}

export const projectHealthCopy: Record<ProjectHealth, { label: string; tone: string }> = {
  "on-track": { label: "على المسار", tone: "emerald" },
  watch: { label: "تحتاج متابعة", tone: "amber" },
  "at-risk": { label: "تحتاج تدخلًا", tone: "rose" },
};

export function formatWorkItemKey(projectKey: string, sequence: number): string {
  const normalized = projectKey.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "DEV";
  return `${normalized}-${Math.max(1, Math.floor(sequence))}`;
}
