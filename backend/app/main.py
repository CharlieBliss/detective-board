from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import board, nodes, threads

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables on startup
    await init_db()
    yield

app = FastAPI(
    title="Detective Investigation Board API",
    description="Backend API for managing crazy wall investigation boards",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS setup
origins = list(settings.allowed_origins)
if not origins or settings.ENVIRONMENT == "development":
    dev_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    for d in dev_origins:
        if d not in origins:
            origins.append(d)

if settings.VERCEL_URL:
    v_url = settings.VERCEL_URL.strip()
    full_v_url = v_url if v_url.startswith("http") else f"https://{v_url}"
    if full_v_url not in origins:
        origins.append(full_v_url)

is_wildcard = "*" in origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if is_wildcard else origins,
    allow_origin_regex=None if is_wildcard else r"https://.*\.vercel\.app",
    allow_credentials=not is_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.get("/health", tags=["system"])
@app.get("/api/health", tags=["system"])
async def health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}

app.include_router(board.router, prefix="/api")
app.include_router(nodes.router, prefix="/api")
app.include_router(threads.router, prefix="/api")
