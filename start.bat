@echo off
setlocal
REM UrbanEye AI - one-click start (backend + frontend)
REM Requires Python 3.12 (py -3.12) and Node.js on PATH.

cd /d "%~dp0"

echo === UrbanEye AI: starting backend ===
cd backend

set CREATED=0
if not exist venv (
  echo Creating Python 3.12 virtualenv...
  py -3.12 -m venv venv || (echo ERROR: py -3.12 not found. Install Python 3.12. & exit /b 1)
  set CREATED=1
)

if "%CREATED%"=="1" (
  echo Installing backend dependencies...
  call venv\Scripts\python -m pip install -q -r requirements.txt
  if errorlevel 1 (echo ERROR: pip install failed. & exit /b 1)
)

if not exist urbaneye.db (
  echo Seeding database with demo accounts...
  call venv\Scripts\python -m app.seed
)

start "UrbanEye Backend" cmd /k "venv\Scripts\python -m uvicorn app.main:app --reload --port 8000"

cd ..

echo === UrbanEye AI: starting frontend ===
cd project_v2

if not exist node_modules (
  echo Installing frontend dependencies...
  call npm install
)

start "UrbanEye Frontend" cmd /k "npm run dev"

echo.
echo Backend : http://localhost:8000  (API docs at /docs)
echo Frontend: http://localhost:5173
echo Demo logins: citizen@urbaneye.ai / officer@urbaneye.ai  (password: demo1234)
echo.
echo Two windows opened. Close them to stop the servers.
pause
