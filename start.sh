#!/bin/bash
# start.sh — start both servers
cleanup(){ kill $BP $FP 2>/dev/null; exit 0; }
trap cleanup SIGINT SIGTERM

echo "=== Starting Kytes Dashboard v2 ==="
cd backend && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BP=$!; deactivate; cd ..
sleep 2
cd frontend && npm start & FP=$!; cd ..

echo ""
echo "✅ Running!"
echo "   Dashboard  →  http://localhost:3000"
echo "   API docs   →  http://localhost:8000/docs"
echo "   Upload login: admin / kytes@2024"
echo ""
echo "Press Ctrl+C to stop."
wait
