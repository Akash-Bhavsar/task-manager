import { Label } from "./labels";

export interface TasksQuery {
  status?: string;
  q?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  label?: number;
}

export interface TaskRecord {
  id: number;
  title: string;
  description: string;
  status: string;
  priority?: string;
  dueDate?: string | null;
  position?: number;
  createdAt?: string;
  updatedAt?: string;
  labels?: Label[];
}

export interface TasksPage {
  items: TaskRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function fetchTasks(params: TasksQuery = {}): Promise<TasksPage> {
  const sp = new URLSearchParams();
  if (params.status && params.status !== "all") sp.set("status", params.status);
  if (params.q) sp.set("q", params.q);
  if (params.sort) sp.set("sort", params.sort);
  if (params.label) sp.set("label", String(params.label));
  sp.set("page", String(params.page ?? 1));
  sp.set("pageSize", String(params.pageSize ?? 10));

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/tasks?${sp.toString()}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch tasks: ${response.status}`);
  }

  return response.json();
}

export async function fetchMyTasks() {
  // If you prefer a "my-tasks" route, for example:
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/my-tasks`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch my tasks: ${response.status}`);
  }

  return response.json();
}

export interface TaskData {
  title: string;
  description: string;
  status: string;
  priority?: string;
  dueDate?: string | null;
  position?: number;
  labelIds?: number[];
}

export async function createTask(taskData: TaskData) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create task: ${response.status}`);
  }

  return response.json();
}

export async function updateTask(taskId: string, updatedData: Partial<TaskData>) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedData),
  });

  if (!response.ok) {
    throw new Error(`Failed to update task ${taskId}: ${response.status}`);
  }

  return response.json();
}

// Set the same status on many tasks at once. Returns the number updated.
export async function bulkUpdateStatus(
  ids: number[],
  status: string
): Promise<{ count: number }> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/bulk`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, status }),
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => null);
    throw new Error(msg?.error ?? `Failed to update tasks: ${res.status}`);
  }
  return res.json();
}

// Delete many tasks at once (ADMIN-only on the server). Returns the count deleted.
export async function bulkDeleteTasks(ids: number[]): Promise<{ count: number }> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/bulk-delete`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => null);
    throw new Error(msg?.error ?? `Failed to delete tasks: ${res.status}`);
  }
  return res.json();
}

export async function deleteTask(taskId: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}`, {
    method: "DELETE",
    credentials: "include",
  });

  // 404 means the task is already gone — treat delete as idempotent so a stale
  // view or double-click doesn't surface a spurious error.
  if (response.status === 404) {
    return { message: "Task already deleted" };
  }

  if (!response.ok) {
    throw new Error(`Failed to delete task ${taskId}: ${response.status}`);
  }

  return response.json();
}
