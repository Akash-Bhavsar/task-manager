// Small date helpers for task due dates.

export function formatDueDate(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Overdue = due date is strictly before today (date-only) and task not completed.
export function isOverdue(value?: string | null, status?: string): boolean {
  if (!value || status === "completed") return false;
  const d = new Date(value);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}
