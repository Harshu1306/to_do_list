
"""PostgreSQL database setup for the To-Do List app.

Local development:
    DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/todo_db

For deployment, set DATABASE_URL in your hosting provider's
environment variables (for example, Vercel).
"""

import os

import psycopg
from dotenv import load_dotenv
from psycopg.rows import dict_row

# Load .env for local development.
# On Vercel, DATABASE_URL is supplied through environment variables.
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL is not set. Add it to your .env file "
        "or deployment environment variables."
    )


def get_connection() -> psycopg.Connection:
    """Open a PostgreSQL connection that returns rows as dictionaries."""
    return psycopg.connect(
        DATABASE_URL,
        row_factory=dict_row,
    )


def init_db() -> None:
    """Create the tasks table and add missing columns if needed."""
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
                """
                ALTER TABLE tasks
                ADD COLUMN IF NOT EXISTS
                priority VARCHAR(10) NOT NULL DEFAULT 'medium'
                """
            )

            cur.execute(
                """
                ALTER TABLE tasks
                ADD COLUMN IF NOT EXISTS due_date DATE
                """
            )

        conn.commit()
