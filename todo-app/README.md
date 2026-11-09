# My To-Do List

A basic, functional to-do list web application built with **Next.js (App Router) + TypeScript + CSS** on the frontend and **Python FastAPI + PostgreSQL** on the backend. Tasks are stored in PostgreSQL, so they remain saved after refreshing the page. (The frontend was migrated from Vite + React; the original Vite code is preserved in `frontend-vite-backup/`.)

## Project structure

```text
todo-app/
├── frontend/            Next.js (App Router) frontend
│   ├── app/
│   │   ├── page.tsx     Main UI: add / edit / delete / toggle / filter
│   │   ├── layout.tsx   Root layout (title/meta, global CSS)
│   │   └── globals.css  All styling (identical to the old Vite index.css)
│   ├── lib/api.ts       Fetch helpers for the FastAPI backend
│   ├── types/task.ts    Task types mirroring the API models
│   ├── next.config.ts   /api rewrite proxy to the backend
│   ├── package.json
│   └── .env.example     API_PROXY_URL / NEXT_PUBLIC_API_URL
├── frontend-vite-backup/  Original Vite + React frontend (preserved)
├── backend/
│   ├── main.py          FastAPI app and REST API endpoints
│   ├── database.py      PostgreSQL connection and table creation
│   ├── models.py        Request/response data models (Pydantic)
│   ├── requirements.txt Python dependencies
│   ├── .env.example     Example database connection string
│   └── .env             Your real connection string (do not commit)
└── README.md
```

## Features

1. Add a task with a title and optional description.
2. Display all tasks in a clean list.
3. Mark tasks as completed or pending (checkbox, with strikethrough).
4. Edit existing tasks (inline edit form).
5. Delete tasks (with a small fade-out animation).
6. Filter tasks by All, Pending, and Completed.
7. Show total, completed, and pending counts.
8. Tasks persist in PostgreSQL across page refreshes and restarts.

## Database setup (PostgreSQL)

The app connects to PostgreSQL using a connection string stored in a `.env` file.

1. Make sure PostgreSQL is running (in pgAdmin you should see your server connected).
2. Create the database once in **pgAdmin**: right-click **Databases → Create Database…**, name it `todo_db`, and save.
3. In the `backend` folder, copy `.env.example` to `.env` and replace `YOUR_PASSWORD` with the password of your PostgreSQL user (the one you use in pgAdmin):

   ```ini
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/todo_db
   ```

4. The app creates the `tasks` table automatically on startup — you do **not** need to create any table or file manually. After the first run, you can see it in pgAdmin under `todo_db → Schemas → public → Tables → tasks`.

## API endpoints

| Method | Endpoint               | Description                                    |
|--------|------------------------|------------------------------------------------|
| GET    | `/tasks?filter=all`    | List tasks (`all` / `pending` / `completed`)   |
| POST   | `/tasks`               | Create a task `{title, description?}`          |
| GET    | `/tasks/{id}`          | Get one task                                   |
| PUT    | `/tasks/{id}`          | Edit a task (partial updates allowed)          |
| PATCH  | `/tasks/{id}`          | Edit a task (same as PUT here)                 |
| DELETE | `/tasks/{id}`          | Delete a task                                  |
| GET    | `/stats`               | Total / completed / pending counts             |

Interactive API docs are available at http://localhost:8000/docs while the backend is running.

## How to run

You need Python 3.9+, Node.js 18+, and PostgreSQL installed. Run the backend and frontend in two separate terminals.

### 1. Backend (FastAPI + PostgreSQL)

```bash
cd todo-app/backend
python -m venv .venv
# Windows:  .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The backend runs at http://localhost:8000.

### 2. Frontend (Next.js)

```bash
cd todo-app/frontend
npm install
npm run dev
```

The frontend runs at http://localhost:3000. The browser calls `/api/*` on the
Next.js origin and Next.js proxies to the backend (`API_PROXY_URL`, see
`frontend/.env.example`), so no backend CORS change is needed. For Vercel
deployment see `frontend/README.md`.

> Keep the backend terminal running while you use the app. If a task request fails, the UI shows an error message instead of crashing.

## Production build (frontend)

```bash
cd todo-app/frontend
npm run build
```
