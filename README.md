# 🕵️‍♂️ Detective Investigation Board ("The Crazy Wall")

A single-page application (SPA) modeling a classic noir detective's "crazy wall" investigation board. Users interact with an interactive visual graph of **Evidence Nodes** (People, Places, Concepts) connected by **Threads**. A single Thread acts as a **hyperedge**, connecting multiple Evidence Nodes simultaneously with realistic red yarn strings pinned to a central corkboard hub.

The application includes an ambient noir audio player, bulk-import JSON functionality with transactional upsert logic, and a lightweight honor system for edit tracking.

---

## 🏛 Architecture & Tech Stack

```
                     ┌────────────────────────────────────────────────┐
                     │              Vercel (Production)               │
                     │          React + TypeScript + Tailwind         │
                     │          @xyflow/react (Graph Visualizer)      │
                     └───────────────────────┬────────────────────────┘
                                             │ HTTP / REST (X-User-Name)
                                             ▼
                     ┌────────────────────────────────────────────────┐
                     │           AWS App Runner (Production)          │
                     │                 FastAPI + Uvicorn              │
                     │               SQLAlchemy 2.0 Async             │
                     └───────────────────────┬────────────────────────┘
                                             │ asyncpg
                                             ▼
                     ┌────────────────────────────────────────────────┐
                     │           AWS RDS / Postgres 15 Alpine         │
                     │        Relational Schema + Hyperedge Links     │
                     └────────────────────────────────────────────────┘
```

- **Frontend**: React (TypeScript), React Flow (`@xyflow/react`), Tailwind CSS, Lucide Icons, Web Audio API.
- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.0 (async), asyncpg, Uvicorn, Gunicorn.
- **Database**: PostgreSQL 15 (Docker / RDS).
- **Local Dev**: Docker Compose (containerizing FastAPI hot-reload and Postgres).
- **Production**: Frontend on Vercel, Backend on AWS App Runner, DB on AWS RDS Postgres.

---

## 📌 Hyperedges & Graph Translation

React Flow and classical graph theory edges connect exactly two nodes. In criminal investigations, however, a single lead or event (Thread) naturally links 3 or more suspects, crime scenes, and evidence items.

To represent this visually without breaking graph integrity:
1. **Entity Nodes**: Rendered as Polaroid photographs, crime scene cards, and aged sticky notes.
2. **Thread Hubs**: For every Thread in the API response, a custom React Flow node is generated representing a central pushpin and labeled case file tag.
3. **Connecting Red Strings**: Edges connect each constituent Entity Node to its central Thread Hub.
4. **Interactive Dimming**: Clicking a node or thread hub illuminates the connection cluster and dims the remainder of the board (`opacity: 0.25`).

---

## 🗄 Relational Database Schema

```
 ┌──────────────────────┐         ┌────────────────────────┐         ┌──────────────────────┐
 │        nodes         │         │   thread_node_links    │         │       threads        │
 ├──────────────────────┤         ├────────────────────────┤         ├──────────────────────┤
 │ id (UUID, PK)        │◄───────┤ node_id (UUID, PK, FK)  │         │ id (UUID, PK)        │
 │ title (VARCHAR)      │         │ thread_id (UUID, PK, FK)├────────►│ title (VARCHAR)      │
 │ type (ENUM)          │         └────────────────────────┘         │ description (TEXT)   │
 │ description (TEXT)   │                                            │ last_edited_by (STR) │
 │ image_url (VARCHAR)  │                                            └──────────────────────┘
 │ last_edited_by (STR) │
 └──────────────────────┘
```

- **`nodes`**: `person`, `place`, `concept`.
- **`threads`**: Hyperedge representations linking multiple nodes.
- **`thread_node_links`**: Composite primary key `(thread_id, node_id)` with cascading foreign keys and indexes.

---

## 🚀 Quick Start (Docker Compose)

The easiest way to run the entire backend and database with hot reloading is Docker Compose:

```bash
# Start FastAPI and PostgreSQL
docker compose up --build
```

The FastAPI backend will be available at `http://localhost:8000`.
Swagger interactive API docs: `http://localhost:8000/docs`.

In a separate terminal, launch the frontend:

```bash
cd frontend
npm install
npm run dev
```

Visit the frontend at `http://localhost:5173`.

---

## 💻 Running Without Docker (Local Development)

### 1. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run with PostgreSQL (or fallback SQLite database)
export DATABASE_URL="sqlite+aiosqlite:///./detective.db"
export PYTHONPATH=.
uvicorn app.main:app --port 8000 --reload
```

### 2. Run Backend Tests

```bash
PYTHONPATH=backend pytest backend/tests -v
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 📡 API Specification

All mutating endpoints accept the `X-User-Name` header to record the detective identity under the honor system.

### Aggregated Board State
- **`GET /api/board`**
  Returns `{ "nodes": [...], "threads": [{ "id": "...", "title": "...", "connected_nodes": [...] }] }`.

### Bulk JSON Import (Upsert)
- **`POST /api/board/import`**
  Imports flat arrays of `nodes` and `threads`. If IDs exist, updates existing records; if new, inserts them. Rebuilds junction links in a single atomic transaction.

### CRUD Endpoints
- **`POST /api/nodes`**, **`PUT /api/nodes/{id}`**, **`DELETE /api/nodes/{id}`**
- **`POST /api/threads`**, **`PUT /api/threads/{id}`**, **`DELETE /api/threads/{id}`**

---

## ☁️ Production Deployment

### Frontend (Vercel)
- Connect GitHub repository to Vercel.
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables:
  - `VITE_API_URL`: URL of your AWS App Runner backend (e.g. `https://xxx.us-east-1.awsapprunner.com/api`).

### Backend (AWS App Runner)
- Repository contains a production-ready `backend/Dockerfile`.
- Uses `gunicorn -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:8000 app.main:app`.
- Port: `8000`.
- Health check path: `/api/health` or `/health`.
- Environment Variables:
  - `DATABASE_URL`: `postgresql+asyncpg://<USER>:<PASS>@<RDS_HOST>:5432/<DB_NAME>`
  - `CORS_ORIGINS`: Vercel frontend URL (e.g. `https://your-app.vercel.app`)
  - `ENVIRONMENT`: `production`

### Database (AWS RDS PostgreSQL)
- Engine: PostgreSQL 15+.
- Tables are initialized automatically upon application startup.
