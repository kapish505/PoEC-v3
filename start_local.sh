#!/bin/bash

# Configuration
PORT_BACKEND=8000
PORT_FRONTEND=3000

echo "=========================================="
echo "🚀 Starting PoEC (Native Mode)"
echo "=========================================="

# Trap Ctrl+C to kill child processes
trap 'kill 0' SIGINT

# 1. Start Backend
echo ""
echo "🐍 [1/2] Initializing Backend..."
cd backend || exit

# Setup Virtual Environment if missing
if [ ! -d "venv" ]; then
    echo "   Creating venv..."
    python3 -m venv venv
fi

echo "   Activating venv..."
source venv/bin/activate

echo "   Installing dependencies..."
pip install -r requirements.txt > /dev/null

echo "   Starting FastAPI (Port $PORT_BACKEND)..."
# Using python -m uvicorn to ensure it uses venv context
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT_BACKEND --reload &
BACKEND_PID=$!

# Wait for backend to be ready (naive check)
sleep 2

cd ..

# 2. Start Frontend
echo ""
echo "⚛️  [2/2] Initializing Frontend..."

# Detect Package Manager
if command -v bun &> /dev/null; then
    PKG_MGR="bun"
else
    PKG_MGR="npm"
fi
echo "   Using $PKG_MGR"

echo "   Installing dependencies..."
$PKG_MGR install > /dev/null

echo "   Starting Next.js..."
if [ "$PKG_MGR" == "bun" ]; then
    $PKG_MGR dev &
else
    $PKG_MGR run dev &
fi
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "✅ App Running!"
echo "   Backend:  http://localhost:$PORT_BACKEND"
echo "   Frontend: http://localhost:$PORT_FRONTEND"
echo "=========================================="
echo "Press Ctrl+C to stop everything."

# Wait for processes
wait
