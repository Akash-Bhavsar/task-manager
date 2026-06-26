// Canonical task vocabulary. Mirrored client-side in client/lib/taskConstants.ts
// (separate packages, so duplicated deliberately — keep the two in sync).

export const TASK_STATUSES = ['draft', 'in-progress', 'completed'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const DEFAULT_STATUS: TaskStatus = 'draft';
export const DEFAULT_PRIORITY: TaskPriority = 'medium';

// Map legacy / mis-cased values to the canonical set (used by validation + backfill).
const STATUS_ALIASES: Record<string, TaskStatus> = {
  draft: 'draft',
  pending: 'draft',
  todo: 'draft',
  'in-progress': 'in-progress',
  'in progress': 'in-progress',
  inprogress: 'in-progress',
  doing: 'in-progress',
  completed: 'completed',
  complete: 'completed',
  done: 'completed',
};

export function normalizeStatus(value: unknown): TaskStatus | null {
  if (typeof value !== 'string') return null;
  return STATUS_ALIASES[value.trim().toLowerCase()] ?? null;
}

export function normalizePriority(value: unknown): TaskPriority | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  return (TASK_PRIORITIES as readonly string[]).includes(v)
    ? (v as TaskPriority)
    : null;
}
