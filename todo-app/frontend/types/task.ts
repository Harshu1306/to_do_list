// Mirrors the FastAPI models in backend/models.py.
// The website UI only uses title/description/completed, but the API
// also returns priority/due_date — typed here so nothing breaks.
export type TaskFilter = "all" | "pending" | "completed";

export interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  created_at: string;
}

export interface TaskInput {
  title: string;
  description?: string | null;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  completion_percentage: number;
}
