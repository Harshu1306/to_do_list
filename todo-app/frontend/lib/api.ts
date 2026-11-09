import type { Task, TaskFilter, TaskInput, TaskStats } from "../types/task";

// Browser API base — always same-origin "/api".
// Production (Vercel multi-service): the top-level vercel.json routes
// "/api/(.*)" to the backend service and strips the "/api" prefix via a
// request.path transform, so "/api/tasks" reaches FastAPI as "/tasks".
// Local development: Next.js rewrites (next.config.ts) proxy "/api/*" to
// API_PROXY_URL (see .env.example), so "/api/tasks" reaches FastAPI
// as "/tasks" as well. No NEXT_PUBLIC_API_URL is used, so the browser
// never calls a direct backend origin.
export const API_URL: string = "/api";

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
