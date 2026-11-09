import { useCallback, useEffect, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { api } from "./api.js";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "completed", label: "Completed" },
];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [filter, setFilter] = useState("all");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setError("");
      const [taskList, taskStats] = await Promise.all([
        api.listTasks(filter),
        api.getStats(),
      ]);
      setTasks(taskList);
      setStats(taskStats);
    } catch (err) {
      setError(
        "Could not load tasks. Is the backend running on http://localhost:8000 ?"
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  // ---------- Actions ----------

  async function handleAdd(event) {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      setError("");
      await api.createTask({ title: title.trim(), description: description.trim() || null });
      setTitle("");
      setDescription("");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggle(task) {
    try {
      setError("");
      const updated = await api.updateTask(task.id, { completed: !task.completed });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      setStats(await api.getStats());
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
  }

  async function handleSaveEdit(event) {
    event.preventDefault();
    if (!editTitle.trim()) return;
    try {
      setError("");
      const updated = await api.updateTask(editingId, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
      });
      setTasks((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(task) {
    // Play the fade-out animation first, then remove the task.
    setDeletingId(task.id);
    try {
      await api.deleteTask(task.id);
      setTimeout(async () => {
        setDeletingId(null);
        await loadData();
      }, 250);
    } catch (err) {
      setDeletingId(null);
      setError(err.message);
    }
  }

  // ---------- Render ----------

  return (
    <div className="page">
      <main className="container">
        <h1>My To-Do List</h1>

        <p className="stats">
          {stats.total} total · {stats.completed} completed · {stats.pending} pending
        </p>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <form className="add-form" onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Task title"
            maxLength={200}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-label="Task description"
            maxLength={1000}
            className="description-input"
          />
          <button type="submit" className="add-button">
            <Plus size={18} /> Add Task
          </button>
        </form>

        <div className="filters" role="tablist" aria-label="Filter tasks">
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={filter === id ? "filter active" : "filter"}
              aria-pressed={filter === id}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="empty">Loading tasks…</p>
        ) : tasks.length === 0 ? (
          <p className="empty">
            {stats.total === 0
              ? "No tasks yet. Add your first task above!"
              : "No tasks in this view."}
          </p>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li
                key={task.id}
                className={`task-item ${task.completed ? "completed" : ""} ${
                  deletingId === task.id ? "deleting" : ""
                }`}
              >
                {editingId === task.id ? (
                  <form className="edit-form" onSubmit={handleSaveEdit}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      aria-label="Edit task title"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      aria-label="Edit task description"
                      placeholder="Description (optional)"
                    />
                    <div className="edit-actions">
                      <button type="submit" className="save-button">
                        <Check size={16} /> Save
                      </button>
                      <button
                        type="button"
                        className="cancel-button"
                        onClick={() => setEditingId(null)}
                      >
                        <X size={16} /> Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggle(task)}
                      aria-label={
                        task.completed ? "Mark as pending" : "Mark as completed"
                      }
                    />
                    <div className="task-text">
                      <span className="task-title">{task.title}</span>
                      {task.description && (
                        <span className="task-description">{task.description}</span>
                      )}
                    </div>
                    <div className="task-actions">
                      <button
                        type="button"
                        onClick={() => startEdit(task)}
                        aria-label={`Edit ${task.title}`}
                        title="Edit"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(task)}
                        aria-label={`Delete ${task.title}`}
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
