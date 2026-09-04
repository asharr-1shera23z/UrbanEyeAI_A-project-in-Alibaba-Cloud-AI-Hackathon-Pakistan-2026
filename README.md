# UrbanEye AI — Integrated (Frontend + Backend + Real AI Models)

One package: the team's UrbanEye Flux web app (React frontend + FastAPI backend)
with the trained AI detection system fully wired in. Three frozen ONNX models
(pothole / road crack / garbage) run locally on CPU via ONNX Runtime — no GPU,
no cloud, no API keys.

---

## 1. Quick Start (Windows)

```
start.bat
```

That single script will, on first run:
1. create a Python 3.12 virtualenv in `backend/venv` and install requirements,
2. seed the SQLite database with demo accounts and sample tickets,
3. start the API on http://localhost:8000,
4. install frontend npm dependencies and start Vite on http://localhost:5173.

Open **http://localhost:5173** and log in with a demo account below.

> Python **3.12** is required (Pillow/pydantic wheels do not build on 3.13+).
> If `py -3.12` is not on PATH, install it from python.org first.
>
> If you are using the ready-to-run zip (`UrbanEye-AI-ReadyToRun.zip`), `venv`,
> `node_modules`, and the seeded `urbaneye.db` are already included, so `start.bat`
> opens the app immediately with no downloads or installs.

## 2. Demo Accounts

| Portal  | URL                    | Login                  | Password    |
|---------|------------------------|------------------------|-------------|
| Citizen | `/citizen/login`       | `citizen@urbaneye.ai`  | `demo1234`  |
| Officer | `/admin/login`         | `officer@urbaneye.ai`  | `demo1234`  |

- Citizen/officer logins show a math captcha (type the answer).
- Officer login adds a demo 2FA step — the 6-digit code is shown on screen.
- New citizens can self-register through the 4-step signup (identity check and
  OTP are demo-mode: codes are displayed on screen).

## 3. What Was Integrated

**AI engine (the frozen models)**

- `backend/models/{pothole,crack,garbage}/best.onnx` — the three YOLOv8 models,
  thresholds frozen at 0.50 / 0.25 / 0.20 (75% on the 20-image demo suite).
- `backend/app/services/urban_eye.py` — ensemble wrapper (Ultralytics API on
  ONNX Runtime CPU).
- `backend/app/services/ai_inference.py` — `UrbanEyeInferenceEngine`, which
  adapts the ensemble to the backend's `AIInferenceEngine` interface:
  - maps ensemble classes to backend categories
    (`pothole → Pothole`, `road_crack → Road Damage`, `garbage → Garbage`),
  - picks the highest-confidence detection as primary, converts its bounding
    box to normalized percentages,
  - falls back to the mock engine only if the model files are missing.
- `backend/.env` → `AI_ENGINE=urbaneye` activates it (also supports `mock`
  and `yolo` for testing without models).

**Backend**

- `POST /api/ai/analyze` now runs real inference (~0.3–2.5 s on CPU).
- Submitted reports persist the real detected class, confidence, severity,
  priority, bounding box and the uploaded image (served from `/media`).

**Frontend**

- Report flow: upload photo → live AI analysis card (class, confidence,
  severity, priority, detection box) → submit → ticket created.
- Bug fix: removed `AnimatePresence mode="wait"` in 7 files — it deadlocked
  page/phase transitions whenever the browser tab was occluded/minimized.
- Everything else (auth, tickets, tracking, maps, admin portal, analytics)
  talks to the real API as before.

## 4. Manual Run (if you prefer not to use start.bat)

Backend (use `python -m ...` so commands work even after moving the folder):

```
cd backend
venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

If you started from a clean clone instead of the ready-to-run zip:

```
cd backend
py -3.12 -m venv venv
venv\Scripts\python -m pip install -r requirements.txt
venv\Scripts\python -m app.seed        # demo accounts + sample tickets
venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

Frontend:

```
cd project_v2
npm run dev
```

If `node_modules` is missing (it is already included in the ready-to-run zip):

```
cd project_v2
npm install
npm run dev
```

## 5. Handy Test Assets

- `project_v2/public/test_pothole.jpg` — a known pothole image for quick demo
  of the AI flow (expects ~79% Pothole confidence).

## 6. Config Reference (`backend/.env`)

| Key                        | Purpose                                                       |
|----------------------------|---------------------------------------------------------------|
| `AI_ENGINE`                | `urbaneye` (real 3-model ensemble) / `mock` / `yolo`          |
| `DATABASE_URL`             | SQLite by default; PostgreSQL/PostGIS also supported          |
| `JWT_SECRET_KEY`           | change for anything beyond local development                  |
| `DUPLICATE_RADIUS_METERS`  | duplicate-report detection radius (60 m default)              |

## 7. Port Map

| Service | Port |
|---------|------|
| FastAPI | 8000 |
| Vite    | 5173 |
