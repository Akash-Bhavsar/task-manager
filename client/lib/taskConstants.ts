// Canonical task vocabulary. Mirrored server-side in server/utils/taskConstants.ts
// (separate packages, so duplicated deliberately — keep the two in sync).

export const TASK_STATUSES = ["draft", "in-progress", "completed"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const DEFAULT_STATUS: TaskStatus = "draft";
export const DEFAULT_PRIORITY: TaskPriority = "medium";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  draft: "Draft",
  "in-progress": "In Progress",
  completed: "Completed",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

// Badge tone per status (maps to ui/Badge tones).
export const STATUS_TONE: Record<TaskStatus, "success" | "warning" | "muted"> = {
  draft: "muted",
  "in-progress": "warning",
  completed: "success",
};

// Left-border accent per priority (CSS color tokens).
export const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: "var(--muted-foreground)",
  medium: "var(--warning)",
  high: "var(--danger)",
};

export function normalizeStatus(value: unknown): TaskStatus {
  const v = typeof value === "string" ? value.trim().toLowerCase() : "";
  const aliases: Record<string, TaskStatus> = {
    draft: "draft",
    pending: "draft",
    todo: "draft",
    "in-progress": "in-progress",
    "in progress": "in-progress",
    doing: "in-progress",
    completed: "completed",
    done: "completed",
  };
  return aliases[v] ?? DEFAULT_STATUS;
}

export function statusLabel(value: string): string {
  return STATUS_LABELS[normalizeStatus(value)];
}
