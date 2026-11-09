// Small helper for talking to the FastAPI backend.
// Change VITE_API_URL in a .env file if the backend runs elsewhere.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (response.status === 204) return null; // No Content (DELETE)

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.detail || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  listTasks: (filter = "all") => request(`/tasks?filter=${filter}`),
  getStats: () => request("/stats"),
  createTask: (task) =>
    request("/tasks", { method: "POST", body: JSON.stringify(task) }),
  updateTask: (id, task) =>
    request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(task) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
};
