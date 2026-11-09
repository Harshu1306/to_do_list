"""FastAPI backend for the To-Do List app (PostgreSQL database).

Run with:
    uvicorn main:app --reload --port 8000

API endpoints:
    GET    /tasks                  List tasks
                                   (?filter=all|pending|completed
                                    &priority=all|low|medium|high
                                    &sort=created-desc|created-asc|due-asc|due-desc)
    POST   /tasks                  Create a task
    GET    /tasks/{id}             Get one task
    PUT    /tasks/{id}             Edit a task (full update)
    PATCH  /tasks/{id}             Edit a task (partial update, e.g. toggle)
    DELETE /tasks/{id}             Delete a task
    GET    /stats                  Total / completed / pending / completion %
"""

from typing import Literal

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware

from database import get_connection, init_db
from models import StatsResponse, TaskCreate, TaskResponse, TaskUpdate

app = FastAPI(title="To-Do List API")

# Allow the React dev server (Vite on port 5173) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Make sure the table exists when the app starts.
init_db()

# Fixed ORDER BY clauses keyed by the validated sort parameter —
# never built from raw user input, so this cannot be SQL-injected.
SORT_CLAUSES = {
    "created-desc": "id DESC",
    "created-asc": "id ASC",
    "due-asc": "due_date ASC NULLS LAST, id DESC",
    "due-desc": "due_date DESC NULLS LAST, id DESC",
}


def row_to_task(row: dict) -> TaskResponse:
    """Convert a PostgreSQL row (dict) into an API response model."""
    return TaskResponse(
        id=row["id"],
        title=row["title"],
        description=row["description"],
        completed=bool(row["completed"]),
        priority=row.get("priority") or "medium",
        due_date=row.get("due_date"),
        created_at=row["created_at"],
    )


def get_task_or_404(task_id: int) -> dict:
    """Fetch one task row or raise a 404 error."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM tasks WHERE id = %s", (task_id,))
            row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return row


@app.get("/")
def root() -> dict:
    return {"message": "To-Do List API is running", "docs": "/docs"}


@app.get("/tasks", response_model=list[TaskResponse])
def list_tasks(
    filter: Literal["all", "pending", "completed"] = Query(default="all"),
    priority: Literal["all", "low", "medium", "high"] = Query(default="all"),
    sort: Literal["created-desc", "created-asc", "due-asc", "due-desc"] = Query(
        default="created-desc"
    ),
):
    """Return tasks, optionally filtered by status/priority and sorted."""
    conditions: list[str] = []
    params: list = []
    if filter == "pending":
        conditions.append("completed = FALSE")
    elif filter == "completed":
        conditions.append("completed = TRUE")
    if priority != "all":
        conditions.append("priority = %s")
        params.append(priority)

    query = "SELECT * FROM tasks"
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += f" ORDER BY {SORT_CLAUSES[sort]}"

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            rows = cur.fetchall()
    return [row_to_task(row) for row in rows]


@app.post("/tasks", response_model=TaskResponse, status_code=201)
def create_task(task: TaskCreate):
    """Create a new task."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO tasks (title, description, priority, due_date) "
                "VALUES (%s, %s, %s, %s) RETURNING id",
                (task.title, task.description, task.priority, task.due_date),
            )
            new_id = cur.fetchone()["id"]
        conn.commit()

    row = get_task_or_404(new_id)
    return row_to_task(row)


@app.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task(task_id: int):
    """Return a single task by id."""
    return row_to_task(get_task_or_404(task_id))


@app.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task: TaskUpdate):
    """Edit an existing task. Only the fields sent are changed."""
    get_task_or_404(task_id)  # raises 404 if it does not exist

    updates = task.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Build the SET clause from the fields that were actually sent.
    # Keys come from the fixed Pydantic model above, never from raw user
    # input, so this cannot be used for SQL injection.
    # PostgreSQL placeholders are %s (SQLite used ?).
    set_clause = ", ".join(f"{key} = %s" for key in updates)
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE tasks SET {set_clause} WHERE id = %s",
                (*updates.values(), task_id),
            )
        conn.commit()

    return row_to_task(get_task_or_404(task_id))


@app.patch("/tasks/{task_id}", response_model=TaskResponse)
def patch_task(task_id: int, task: TaskUpdate):
    """Partially edit a task (same behaviour as PUT in this simple app)."""
    return update_task(task_id, task)


@app.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int):
    """Delete a task."""
    get_task_or_404(task_id)  # raises 404 if it does not exist
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM tasks WHERE id = %s", (task_id,))
        conn.commit()
    return Response(status_code=204)


@app.get("/stats", response_model=StatsResponse)
def get_stats():
    """Return total, completed, pending and completion percentage."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS c FROM tasks")
            total = cur.fetchone()["c"]
            cur.execute("SELECT COUNT(*) AS c FROM tasks WHERE completed = TRUE")
            completed = cur.fetchone()["c"]
    percentage = round((completed / total) * 100) if total else 0
    return StatsResponse(
        total=total,
        completed=completed,
        pending=total - completed,
        completion_percentage=percentage,
    )
