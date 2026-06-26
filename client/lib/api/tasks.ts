export interface TasksQuery {
  status?: string;
  q?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
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

export async function deleteTask(taskId: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete task ${taskId}: ${response.status}`);
  }

  return response.json();
}
