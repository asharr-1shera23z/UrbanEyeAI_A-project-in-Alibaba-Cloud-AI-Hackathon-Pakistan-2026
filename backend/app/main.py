from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db
from app.routers import ai, analytics, auth, dashboard, map as map_router, notifications, tickets

app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    # Vite shifts ports (5173 -> 5174/5176...) when a port is busy; accept any
    # local dev origin so login/signup never breaks with "Disallowed CORS origin".
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    Path(settings.STORAGE_DIR).mkdir(parents=True, exist_ok=True)


# Serve uploaded report images locally (swap for a CDN/OSS URL in production).
app.mount(settings.MEDIA_URL_PREFIX, StaticFiles(directory=settings.STORAGE_DIR), name="media")

app.include_router(auth.router)
app.include_router(ai.router)
app.include_router(tickets.router)
app.include_router(map_router.router)
app.include_router(dashboard.router)
app.include_router(analytics.router)
app.include_router(notifications.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
