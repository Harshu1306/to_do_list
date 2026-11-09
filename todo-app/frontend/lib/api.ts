import type { Task, TaskFilter, TaskInput, TaskStats } from "../types/task";

// Backend API URL from environment variables.
// - NEXT_PUBLIC_API_URL: direct backend URL (browser calls it; the backend
//   must allow this origin in CORS).
// - If unset, calls go to the same-origin "/api" path, which Next.js proxies
//   to API_PROXY_URL (see next.config.ts rewrites) — no CORS change needed
//   on the FastAPI backend. This is the default for local development.
export const API_URL: string = process.env.NEXT_PUBLIC_API_URL || "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (response.status === 204) return null as T; // No Content (DELETE)

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data && typeof data.detail === "string"
        ? data.detail
        : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  listTasks: (filter: TaskFilter = "all"): Promise<Task[]> =>
    request<Task[]>(`/tasks?filter=${filter}`),
  getStats: (): Promise<TaskStats> => request<TaskStats>("/stats"),
  createTask: (task: TaskInput): Promise<Task> =>
    request<Task>("/tasks", { method: "POST", body: JSON.stringify(task) }),
  updateTask: (id: number, task: Partial<TaskInput> & { completed?: boolean }): Promise<Task> =>
    request<Task>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(task) }),
  deleteTask: (id: number): Promise<null> =>
    request<null>(`/tasks/${id}`, { method: "DELETE" }),
};
