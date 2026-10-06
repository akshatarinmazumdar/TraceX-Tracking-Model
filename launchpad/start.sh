#!/bin/bash
# Trace-X Start Script
# Starts both Backend and Frontend in the background

# Setup color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Resolve root project directory relative to the script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOGS_DIR="$SCRIPT_DIR/logs"

mkdir -p "$LOGS_DIR"

echo -e "${BLUE}${BOLD}🚀 Starting Trace-X System...${NC}"

# Check and kill existing processes on Backend port (5000)
BACKEND_PORT=5000
BACKEND_PID_PORT=$(lsof -t -i:$BACKEND_PORT 2>/dev/null)
if [ -n "$BACKEND_PID_PORT" ]; then
    echo -e "${YELLOW}⚠️  Port $BACKEND_PORT is already in use by PID $BACKEND_PID_PORT. Terminating it...${NC}"
    kill -9 "$BACKEND_PID_PORT" 2>/dev/null
    sleep 1
fi

# Check and kill existing processes on Frontend ports (5173, 5174)
for PORT in 5173 5174; do
    FRONTEND_PID_PORT=$(lsof -t -i:$PORT 2>/dev/null)
    if [ -n "$FRONTEND_PID_PORT" ]; then
        echo -e "${YELLOW}⚠️  Port $PORT is already in use by PID $FRONTEND_PID_PORT. Terminating it...${NC}"
        kill -9 "$FRONTEND_PID_PORT" 2>/dev/null
        sleep 1
    fi
done

# Clear previous logs
> "$LOGS_DIR/backend.log"
> "$LOGS_DIR/frontend.log"

# Start Backend
echo -e "${BLUE}⚡ Starting Backend Server (Flask)...${NC}"
cd "$PROJECT_DIR"
if [ -d ".venv" ]; then
    source .venv/bin/activate
    python backend.py > "$LOGS_DIR/backend.log" 2>&1 &
    BACKEND_PID=$!
    deactivate 2>/dev/null
else
    python3 backend.py > "$LOGS_DIR/backend.log" 2>&1 &
    BACKEND_PID=$!
fi
echo "$BACKEND_PID" > "$LOGS_DIR/backend.pid"
echo -e "${GREEN}✓ Backend process started (PID: $BACKEND_PID)${NC}"

# Start Frontend
echo -e "${BLUE}⚡ Starting Frontend Server (Vite)...${NC}"
cd "$PROJECT_DIR/FrontEnd"
npm run dev > "$LOGS_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "$FRONTEND_PID" > "$LOGS_DIR/frontend.pid"
echo -e "${GREEN}✓ Frontend process started (PID: $FRONTEND_PID)${NC}"

# Verify Backend is running
echo -ne "${YELLOW}⏳ Waiting for Backend to respond...${NC}"
BACKEND_OK=false
for i in {1..20}; do
    if curl -s http://localhost:5000/api/health > /dev/null; then
        echo -e " ${GREEN}[READY]${NC}"
        BACKEND_OK=true
        break
    fi
    echo -n "."
    sleep 1
done
if [ "$BACKEND_OK" = false ]; then
    echo -e " ${RED}[FAILED]${NC}"
    echo -e "${RED}Backend did not start in time. Check logs at: $LOGS_DIR/backend.log${NC}"
fi

# Verify Frontend is running
echo -ne "${YELLOW}⏳ Waiting for Frontend to respond...${NC}"
FRONTEND_OK=false
FRONTEND_URL="http://localhost:5173"
for i in {1..20}; do
    if grep -q "Local:" "$LOGS_DIR/frontend.log" 2>/dev/null; then
        EXTRACTED_URL=$(grep -o "http://localhost:[0-9]*" "$LOGS_DIR/frontend.log" | head -n 1)
        if [ -n "$EXTRACTED_URL" ]; then
            FRONTEND_URL=$EXTRACTED_URL
        fi
        echo -e " ${GREEN}[READY] at $FRONTEND_URL${NC}"
        FRONTEND_OK=true
        break
    fi
    if curl -s http://localhost:5173 > /dev/null; then
        FRONTEND_URL="http://localhost:5173"
        echo -e " ${GREEN}[READY] at $FRONTEND_URL${NC}"
        FRONTEND_OK=true
        break
    elif curl -s http://localhost:5174 > /dev/null; then
        FRONTEND_URL="http://localhost:5174"
        echo -e " ${GREEN}[READY] at $FRONTEND_URL${NC}"
        FRONTEND_OK=true
        break
    fi
    echo -n "."
    sleep 1
done
if [ "$FRONTEND_OK" = false ]; then
    echo -e " ${RED}[FAILED]${NC}"
    echo -e "${RED}Frontend did not start in time. Check logs at: $LOGS_DIR/frontend.log${NC}"
fi

# Launch browser if everything succeeded
if [ "$BACKEND_OK" = true ] && [ "$FRONTEND_OK" = true ]; then
    echo -e "${GREEN}${BOLD}🎉 Trace-X is fully active! Opening browser...${NC}"
    if command -v xdg-open &> /dev/null; then
        xdg-open "$FRONTEND_URL" &
    elif command -v open &> /dev/null; then
        open "$FRONTEND_URL" &
    else
        echo -e "${YELLOW}Please open your browser and navigate to: $FRONTEND_URL${NC}"
    fi
else
    echo -e "${RED}⚠️  System started with errors. Check logs in $LOGS_DIR${NC}"
fi
