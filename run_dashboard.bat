@echo off
echo Starting FastAPI Backend using Uvicorn...
start "" http://127.0.0.1:8000/
uvicorn backend.main:app --reload
