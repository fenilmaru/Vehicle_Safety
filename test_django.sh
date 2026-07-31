#!/bin/bash
set -e
pkill -9 -f "manage.py runserver" 2>/dev/null || true
sleep 1

export PYTHONPATH=django_project
export DJANGO_SETTINGS_MODULE=aas.settings

# Start Django in background
python3 django_project/manage.py runserver 0.0.0.0:8000 --noreload &
DJ_PID=$!
sleep 3

echo "=== Health ===" 
curl -sf http://127.0.0.1:8000/api/health

echo ""
echo "=== Login ==="
LOGIN=$(curl -sf -X POST http://127.0.0.1:8000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"identifier":"commander@aas.ai","password":"Autonomy#2026"}')
echo "$LOGIN" | head -c 200
TOKEN=$(echo "$LOGIN" | python3 -c "import json,sys;print(json.load(sys.stdin)['data']['token'])")

echo ""
echo "=== Dashboard ===" 
curl -sf -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/api/dashboard | python3 -c "import json,sys;d=json.load(sys.stdin);print('Success:',d['success'],'Fleet:',d['data']['kpis']['fleetSize'])"

echo ""
echo "=== Vehicles ==="
curl -sf -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/api/vehicles | python3 -c "import json,sys;d=json.load(sys.stdin);print('Vehicles:',len(d['data']))"

echo ""
echo "=== Camera ==="
curl -sf -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/api/camera | python3 -c "import json,sys;d=json.load(sys.stdin);print('Camera feeds:',len(d['data']['feeds']))"

echo ""
echo "=== AI Detection ==="
curl -sf -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/api/ai | python3 -c "import json,sys;d=json.load(sys.stdin);print('AI modules:',len(d['data']['modules']))"

echo ""
echo "=== Emergency ==="
curl -sf -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/api/emergency | python3 -c "import json,sys;d=json.load(sys.stdin);print('Emergency contacts:',len(d['data']['contacts']))"

echo ""
echo "=== ALL DJANGO API TESTS PASSED ==="

kill $DJ_PID 2>/dev/null || true
