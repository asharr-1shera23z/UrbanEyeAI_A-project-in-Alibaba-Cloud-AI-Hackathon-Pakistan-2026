# UrbanEye AI — Backend

A FastAPI + SQLAlchemy backend for the existing UrbanEye AI React/Vite
frontend, implementing the AI Road & Drain Sentinel MVP scope: citizen
reporting, AI classification, priority/duplicate detection, ticket
management, maps/analytics, notifications, and JWT-based auth with RBAC.

SQLite is used by default (zero setup); swap `DATABASE_URL` for PostgreSQL
(ideally with PostGIS) in production — everything else stays the same.

## 1. Install

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Configure `.env`

```bash
cp .env.example .env
```

The defaults already work for local development (SQLite, local image
storage, mock AI, CORS open to `http://localhost:5173`). At minimum, change
`JWT_SECRET_KEY` before deploying anywhere real:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Key variables (see `.env.example` for the full list):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | `sqlite:///./urbaneye.db` by default, or a `postgresql+psycopg2://...` URL |
| `JWT_SECRET_KEY` | Signs auth tokens — must be a real secret outside dev |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins |
| `STORAGE_BACKEND` | `local` (default) or `s3` (see `app/services/storage.py`) |
| `AI_ENGINE` | `mock` (default, no model needed) or `yolo` (loads `AI_MODEL_PATH`) |

## 3. Initialize the database + demo data

Tables are created automatically on server startup, but you can also seed a
couple of demo accounts and sample tickets up front:

```bash
python -m app.seed
```

This creates:
- Citizen: `citizen@urbaneye.ai` / `demo1234`
- Officer (approved, Supervisor): `officer@urbaneye.ai` / `demo1234`
- Officer (pending approval, Field Officer): `bilal.ahmed@example.gov.pk` / `demo1234`

plus 15 sample tickets so the map/dashboard/analytics aren't empty.

## 4. Run the server

```bash
uvicorn app.main:app --reload --port 8000
```

- API root: `http://localhost:8000`
- Interactive docs: `http://localhost:8000/docs`
- Health check: `GET /api/health`

## 5. Connect the existing frontend

In `project_v2/`:

```bash
cp .env.example .env   # sets VITE_API_BASE_URL=http://localhost:8000
npm install
npm run dev
```

`src/services/api.ts` and `src/services/authService.ts` now call this
backend directly (same function names/signatures the pages already
imported, so no other frontend files needed to change their imports).
Run both processes side by side — backend on `:8000`, frontend on `:5173`.

## Architecture notes

- **Auth/RBAC** (`app/routers/auth.py`, `app/deps.py`): JWT bearer tokens,
  bcrypt password hashing. Roles: `CITIZEN`, `FIELD_OFFICER`, `SUPERVISOR`,
  `DEPARTMENT_ADMIN`, `SYSTEM_ADMIN`. Officer accounts start
  `PENDING_APPROVAL`; `POST /api/auth/officer/approve/{id}` is a clearly
  labeled **demo-only** stand-in for a real back-office approval tool (it
  mirrors the original prototype's demo button) — lock it behind
  `SYSTEM_ADMIN`/`SUPERVISOR` auth before shipping this for real.
- **AI inference** (`app/services/ai_inference.py`): pluggable
  `AIInferenceEngine` interface. `MockInferenceEngine` is deterministic
  (hash of the image bytes) so a citizen's "analyze" preview always matches
  what actually gets stored. `YOLOInferenceEngine` loads a real
  Ultralytics YOLOv8n/YOLOv11n `.pt` file from `AI_MODEL_PATH` when
  `AI_ENGINE=yolo`, and transparently falls back to the mock engine if the
  weights aren't present — the API never breaks for lack of a trained model.
- **Priority + duplicates** (`app/services/priority.py`): severity/priority
  scored from AI confidence, bounding-box size, a location-importance
  keyword heuristic, and a haversine-based search for other unresolved
  same-category reports within `DUPLICATE_RADIUS_METERS` /
  `DUPLICATE_WINDOW_DAYS`.
- **Storage** (`app/services/storage.py`): local disk by default, behind a
  `StorageBackend` interface — implement `S3StorageBackend.save()` with
  `boto3`/`oss2` and flip `STORAGE_BACKEND=s3` to move to Alibaba Cloud
  OSS / AWS S3 without touching any router.
- **Notifications** (`app/services/notifications.py`): simple in-app table,
  written whenever a ticket is created or its status changes. A single
  `notify()` call site makes it easy to also enqueue an email later.

## Known frontend follow-ups (not required for this backend, left as-is per scope)

- `ReportIssuePage.tsx` still uses a hardcoded demo location rather than the
  browser's Geolocation API — the backend already accepts and stores real
  `latitude`/`longitude`/`location`, so wiring that up is a frontend-only
  change whenever you're ready for it.
- `GET /api/auth/officer/status/{userId}` and the demo approval endpoint are
  intentionally open (no auth) to match the original prototype's
  no-back-office demo flow — restrict them before any real deployment.
