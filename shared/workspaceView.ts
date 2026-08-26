export type SearchableWorkspaceRecord = {
  key: string | number;
  title?: string;
  name?: string;
};

export type WorkItemColumn = "backlog" | "in-progress" | "review" | "done";

export function matchesWorkspaceQuery(record: SearchableWorkspaceRecord, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return true;
  return `${record.key} ${record.title ?? ""} ${record.name ?? ""}`.toLocaleLowerCase().includes(needle);
}

export function groupWorkItemsByColumn<T extends { status: WorkItemColumn }>(items: T[]): Record<WorkItemColumn, T[]> {
  const groups: Record<WorkItemColumn, T[]> = { backlog: [], "in-progress": [], review: [], done: [] };
  items.forEach(item => groups[item.status].push(item));
  return groups;
}

export function canSubmitWorkItem(projectId: string, title: string): boolean {
  return Boolean(projectId.trim()) && title.trim().length >= 2;
}
