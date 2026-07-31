#!/bin/bash
# Autonomous Activation System — Django + React 19 (Vite) one-command launcher
# Usage: ./run_platform.sh
# Starts Django server on :8000 (API + SPA + WebSocket ready via Daphne if installed)

set -e
echo "=== Autonomous Activation System ==="
echo "Backend  : Django 5 + DRF + Channels + PostgreSQL"
echo "Frontend : React 19 + Vite (SPA served by Django)"
echo "Data     : /app/django_project/aas (models, seed, API)"
echo "API docs : /api/health / /api/auth/login / /api/dashboard / /api/vehicles / /api/ai / /api/accidents ..."
echo "WebSocket: ws://localhost:8000/ws/vehicle/<id>/"
echo ""

# Build React if dist missing (Vite outputs to frontend/dist in production)
if [ ! -f "frontend/dist/index.html" ] && [ -d "frontend" ]; then
  echo "Building React 19 frontend (Vite)..."
  (cd frontend && npm install --quiet 2>/dev/null || true; npm run build 2>/dev/null || npx vite build 2>/dev/null || true)
fi

# Set PYTHONPATH for Django imports, then start server
export PYTHONPATH="django_project:${PYTHONPATH}"
export DJANGO_SETTINGS_MODULE="aas.settings"

echo "Starting Django server on 0.0.0.0:8000 ..."
python3 django_project/manage.py runserver 0.0.0.0:8000 2>&1 | tee /tmp/aas_server.log &
sleep 2

echo ""
echo "Platform live at:  http://localhost:8000/"
echo "API health:         http://localhost:8000/api/health/"
echo "Dashboard:          http://localhost:8000/dashboard/"
echo "Live Camera:        http://localhost:8000/camera/"
echo "Emergency:          http://localhost:8000/emergency/"
echo "Login (demo):       commuteer@aas.ai / Autonomy#2026"
echo ""
echo "Logs: /tmp/aas_server.log"
echo "Press Ctrl+C to stop."
wait
