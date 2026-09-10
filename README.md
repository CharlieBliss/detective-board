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
                     │          Amazon ECS Express Mode (Prod)        │
                     │          Fargate + Auto-ALB + SSL + Logs       │
                     │          FastAPI + Gunicorn / Uvicorn ASGI     │
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
- **Production**: Frontend on Vercel, Backend on Amazon ECS Express Mode, DB on AWS RDS Postgres.


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

### Backend (Amazon ECS Express Mode)
- **Container Registry (ECR)**: Build and push the production Docker image to Amazon ECR:
  ```bash
  aws ecr create-repository --repository-name detective-board-api
  docker build -t detective-board-api ./backend
  docker tag detective-board-api:latest <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/detective-board-api:latest
  docker push <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/detective-board-api:latest
  ```
- **Launch in ECS Console**:
  1. Open the [Amazon ECS Console](https://console.aws.amazon.com/ecs/v2) and choose **Express mode** in the left navigation pane.
  2. Click **Create** service.
  3. Enter **Service Name** (e.g. `detective-board-api`).
  4. Provide the **Image URI** from ECR.
  5. Port: `8000`. Health check path: `/api/health`.
  6. Environment Variables:
     - `DATABASE_URL`: `postgresql+asyncpg://<USER>:<PASS>@<RDS_ENDPOINT>:5432/<DB_NAME>`
     - `CORS_ORIGINS`: `https://your-frontend.vercel.app`
     - `ENVIRONMENT`: `production`
  7. Roles: Select or click **Create new role** for Task Execution and Infrastructure roles.
  8. Click **Deploy**. Express Mode automatically provisions the Fargate tasks, Application Load Balancer, SSL certificate, and provides a secure HTTPS URL.

### Frontend (Vercel)
- Connect GitHub repository to Vercel.
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables:
  - `VITE_API_URL`: The HTTPS URL provided by your ECS Express Mode service (e.g. `https://xxx.ecs.us-east-1.amazonaws.com/api`).

### Database (AWS RDS PostgreSQL)
- Engine: PostgreSQL 15+.
- Set Security Group inbound rule: Allow PostgreSQL (Port 5432) from the ECS VPC / task security group.
- Tables (`nodes`, `threads`, `thread_node_links`, `board_meta`) are created automatically on startup.

