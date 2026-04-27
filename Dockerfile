# ── Stage 1: Build React frontend ────────────────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /app/dashboard
COPY dashboard/package*.json ./
RUN npm install
COPY dashboard/ ./
RUN npm run build

# ── Stage 2: Python backend + serve static frontend ──────────────────
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/
COPY main.py .

# Copy built React frontend from Stage 1
COPY --from=frontend-builder /app/dashboard/dist ./dashboard/dist

# Expose port (Railway sets $PORT at runtime)
EXPOSE 8000

# Start FastAPI — reads $PORT from Railway environment
CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}
