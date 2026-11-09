"""PostgreSQL database setup for the To-Do List app.

The connection string comes from a `.env` file (see .env.example):

    DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/todo_db

Before running the app, create the `todo_db` database once in pgAdmin
(right-click "Databases" -> Create Database -> name: todo_db).
The `tasks` table itself is created automatically on startup.
"""

import os

import psycopg
from dotenv import load_dotenv
from psycopg.rows import dict_row

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/todo_db",
)


def get_connection() -> psycopg.Connection:
    """Open a connection that returns rows as dictionaries."""
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)


def init_db() -> None:
    """Create the tasks table if it does not exist yet.

    The ALTER TABLE statements are safe migrations for databases created
    before priority/due_date existed: existing rows get the defaults
    (priority 'medium', no due date).
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS tasks (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(200) NOT NULL,
                    description TEXT,
                    completed BOOLEAN NOT NULL DEFAULT FALSE,
                    priority VARCHAR(10) NOT NULL DEFAULT 'medium',
                    due_date DATE,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
            cur.execute(
                "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "
                "priority VARCHAR(10) NOT NULL DEFAULT 'medium'"
            )
            cur.execute(
                "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE"
            )
        conn.commit()
