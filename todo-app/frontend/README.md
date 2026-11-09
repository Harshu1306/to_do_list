# My To-Do List — Frontend (Next.js)

The Vite + React frontend was migrated to **Next.js (App Router) + TypeScript**,
preserving the UI, styling, components and behaviour exactly:

- `app/globals.css` is byte-identical to the old Vite `src/index.css`
  (same colors `#eef2f7` / `#6366f1`, spacing, cards, pills, animations).
- `app/page.tsx` is a 1:1 port of the old `src/App.jsx` (same JSX, classNames,
  placeholders, aria labels, state logic).
- `lib/api.ts` ports `src/api.js` — same FastAPI endpoints
  (`GET/POST /tasks`, `PUT/DELETE /tasks/{id}`, `GET /stats`).
  There is no authentication in this app (none existed in the Vite version),
  so there was no auth logic to port.
- The original Vite code is preserved untouched in `../frontend-vite-backup/`
  until you delete it after verifying this version.

## Run locally

```bash
cd todo-app/frontend
npm install
npm run dev        # http://localhost:3000
```

The FastAPI backend must be running (`uvicorn main:app --host 0.0.0.0 --port 8000`
in `../backend`). By default the browser calls `/api/*` on the Next.js origin and
Next.js proxies to `API_PROXY_URL` (see `.env.example`) — so no backend CORS
change is needed for local development.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `API_PROXY_URL` | `.env.local` / Vercel | Server-side target for the `/api` rewrite proxy (default `http://localhost:8000`) |
| `NEXT_PUBLIC_API_URL` | `.env.local` / Vercel | Optional direct backend URL used by the browser (backend CORS must allow the frontend origin) |

## Deploy on Vercel

1. Push this repo to GitHub.
2. In Vercel: **Add New → Project**, set **Root Directory** to `todo-app/frontend`.
   Vercel auto-detects Next.js from `package.json` — no `vercel.json` needed.
3. Add environment variables in Vercel (project settings):
   - `API_PROXY_URL` = your deployed FastAPI backend URL (e.g. `https://your-backend.onrender.com`)
   - Leave `NEXT_PUBLIC_API_URL` unset to use the proxy, **or** set it to the backend
     URL and allow your Vercel origin in the backend CORS.
4. Deploy. Note: Vercel hosts only this Next.js frontend — the FastAPI backend
   needs its own host (e.g. Render/Railway) and PostgreSQL stays wherever it is.
