@echo off
echo ============================================
echo   Obsidian Lens - Road Accident Dashboard
echo ============================================
echo.
echo Starting FastAPI Backend on port 8000...
start "Backend" cmd /c "cd /d %~dp0 && .venv\Scripts\python.exe -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000"

echo Starting React Dashboard on port 5173...
start "Dashboard" cmd /c "cd /d %~dp0dashboard && npm run dev"

echo.
echo  Backend:   http://127.0.0.1:8000
echo  Dashboard: http://localhost:5173
echo.
pause
