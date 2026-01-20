#!/bin/bash

# PoEC v2 - Local Startup Script

echo "🚀 Starting PoEC v2 Local Environment..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if backend dependencies installed
echo -e "${YELLOW}📦 Step 1: Checking backend dependencies...${NC}"
cd backend
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    pip3 install -r requirements.txt --quiet
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Backend dependencies already installed${NC}"
fi

# Step 2: Start backend
echo ""
echo -e "${YELLOW}🔧 Step 2: Starting backend server...${NC}"
cd ..
python3 -m uvicorn backend.app.main:app --reload --port 8000 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend starting (PID: $BACKEND_PID)${NC}"
echo "   URL: http://localhost:8000"

# Wait for backend to be ready
sleep 3

# Step 3: Test backend
echo ""
echo -e "${YELLOW}🧪 Step 3: Testing backend...${NC}"
if curl -s http://localhost:8000/ > /dev/null; then
    echo -e "${GREEN}✅ Backend is ready!${NC}"
else
    echo -e "${RED}❌ Backend not responding. Check logs above.${NC}"
fi

# Step 4: Check frontend dependencies
echo ""
echo -e "${YELLOW}📦 Step 4: Checking frontend dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Frontend dependencies already installed${NC}"
fi

# Step 5: Start frontend
echo ""
echo -e "${YELLOW}🎨 Step 5: Starting frontend...${NC}"
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend starting (PID: $FRONTEND_PID)${NC}"
echo "   URL: http://localhost:3000"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ PoEC v2 is running!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo "📍 Services:"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo "   Docs:     http://localhost:8000/docs"
echo ""
echo "📱 Pages to test:"
echo "   Dashboard:     http://localhost:3000/dashboard"
echo "   Verify:        http://localhost:3000/verify"
echo "   Agent Sim:     http://localhost:3000/agent_sim"
echo ""
echo "📋 Testing:"
echo "   See TEST_CHECKLIST.md for comprehensive tests"
echo ""
echo "🛑 To stop servers:"
echo "   Press Ctrl+C or run: kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Keep script running
wait
