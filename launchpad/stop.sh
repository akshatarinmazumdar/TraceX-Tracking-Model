#!/bin/bash
# Trace-X Stop Script
# Stops both Backend and Frontend processes

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGS_DIR="$SCRIPT_DIR/logs"

echo -e "${BLUE}${BOLD}🛑 Stopping Trace-X System...${NC}"

# Stop Backend
if [ -f "$LOGS_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$LOGS_DIR/backend.pid")
    if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
        echo -e "${BLUE}Stopping Backend (PID: $BACKEND_PID)...${NC}"
        kill "$BACKEND_PID" 2>/dev/null
        sleep 1
        if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
            kill -9 "$BACKEND_PID" 2>/dev/null
        fi
        echo -e "${GREEN}✓ Backend stopped${NC}"
    else
        echo -e "${YELLOW}Backend process (PID: $BACKEND_PID) is not running.${NC}"
    fi
    rm "$LOGS_DIR/backend.pid"
else
    # Try finding and killing process on port 5000
    BACKEND_PID_PORT=$(lsof -t -i:5000 2>/dev/null)
    if [ -n "$BACKEND_PID_PORT" ]; then
        echo -e "${BLUE}Stopping process on port 5000 (PID: $BACKEND_PID_PORT)...${NC}"
        kill -9 "$BACKEND_PID_PORT" 2>/dev/null
        echo -e "${GREEN}✓ Backend on port 5000 stopped${NC}"
    else
        echo -e "${YELLOW}No backend process file found and port 5000 is free.${NC}"
    fi
fi

# Stop Frontend
if [ -f "$LOGS_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$LOGS_DIR/frontend.pid")
    if ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
        echo -e "${BLUE}Stopping Frontend (PID: $FRONTEND_PID)...${NC}"
        # Kill children first (since npm run dev spawns vite)
        pkill -P "$FRONTEND_PID" 2>/dev/null
        kill "$FRONTEND_PID" 2>/dev/null
        sleep 1
        if ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
            kill -9 "$FRONTEND_PID" 2>/dev/null
        fi
        echo -e "${GREEN}✓ Frontend stopped${NC}"
    else
        echo -e "${YELLOW}Frontend process (PID: $FRONTEND_PID) is not running.${NC}"
    fi
    rm "$LOGS_DIR/frontend.pid"
else
    # Try finding and killing processes on 5173/5174
    for PORT in 5173 5174; do
        FRONTEND_PID_PORT=$(lsof -t -i:$PORT 2>/dev/null)
        if [ -n "$FRONTEND_PID_PORT" ]; then
            echo -e "${BLUE}Stopping process on port $PORT (PID: $FRONTEND_PID_PORT)...${NC}"
            kill -9 "$FRONTEND_PID_PORT" 2>/dev/null
            echo -e "${GREEN}✓ Frontend on port $PORT stopped${NC}"
        fi
    done
fi

echo -e "${GREEN}${BOLD}✓ Cleaned up Trace-X processes.${NC}"
