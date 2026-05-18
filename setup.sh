#!/bin/bash
# setup.sh — run once
set -e
echo "=== Kytes Dashboard v2 Setup ==="
echo "[1/2] Backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
echo "[2/2] Frontend..."
cd frontend && npm install && cd ..
echo ""
echo "✅ Setup complete! Run ./start.sh to launch."
