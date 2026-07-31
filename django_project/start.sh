#!/bin/bash
# One-command entry point for the Autonomous Activation Django platform
# 1) Build React 19 frontend (Vite) into frontend/dist
# 2) Apply DRF routes / Channels / DB seed (if needed)
# 3) Start Django + Daphne (WebSocket) on :8000
# 4) Serve React SPA from Django templates

set -e

echo "=== AAS — Building React 19 frontend ==="
(cd frontend && npm ci 2>/dev/null || npm install --quiet)
(cd frontend && npm run build 2>&1 | tail -4)

echo "=== AAS — Applying DB migrations (if needed) ==="
python3 manage.py migrate --run-syncdb 2>&1 | tail -2 || true

echo "=== AAS — Seeding sample fleet ==="
python3 manage.py seed_data 2>/dev/null || true

echo "=== AAS — Starting Django + Channels (WebSocket) ==="
echo "API: http://localhost:8000/api/"
echo "SSO: ws://localhost:8000/ws/vehicle/<id>/"
echo "SPA:  http://localhost:8000/"

daphne -b 0.0.0.0 -p 8000 aas.asgi:application &
sleep 2
echo "Daphne started (PID $!). Open http://localhost:8000/"
wait
