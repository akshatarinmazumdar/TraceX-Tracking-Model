#!/bin/bash
# Trace-X Status Script
# Checks running state of Backend and Frontend

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGS_DIR="$SCRIPT_DIR/logs"

echo -e "${BLUE}${BOLD}📊 Trace-X System Status${NC}"
echo -e "${BLUE}=========================${NC}"

# Check Backend
BACKEND_RUNNING=false
if [ -f "$LOGS_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$LOGS_DIR/backend.pid")
    if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
        BACKEND_RUNNING=true
    fi
fi

# Double check via port 5000
BACKEND_PID_PORT=$(lsof -t -i:5000 2>/dev/null)
if [ -n "$BACKEND_PID_PORT" ]; then
    BACKEND_RUNNING=true
    BACKEND_PID=$BACKEND_PID_PORT
fi

if [ "$BACKEND_RUNNING" = true ]; then
    # Get RAM/CPU usage of PID
    USAGE=$(ps -p "$BACKEND_PID" -o %cpu,%mem --no-headers 2>/dev/null)
    echo -e "Backend:  ${GREEN}🟢 RUNNING${NC} (PID: $BACKEND_PID, CPU%/RAM%: $USAGE)"
    curl -s http://localhost:5000/api/health > /dev/null
    if [ $? -eq 0 ]; then
        echo -e "          Health check: ${GREEN}OK${NC} (http://localhost:5000/api/health)"
    else
        echo -e "          Health check: ${RED}NOT RESPONDING / INITIALIZING${NC}"
    fi
else
    echo -e "Backend:  ${RED}🔴 STOPPED${NC}"
fi

# Check Frontend
FRONTEND_RUNNING=false
if [ -f "$LOGS_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$LOGS_DIR/frontend.pid")
    if ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
        FRONTEND_RUNNING=true
    fi
fi

# Double check via port 5173/5174
FRONTEND_PORT=""
for PORT in 5173 5174; do
    FRONTEND_PID_PORT=$(lsof -t -i:$PORT 2>/dev/null)
    if [ -n "$FRONTEND_PID_PORT" ]; then
        FRONTEND_RUNNING=true
        FRONTEND_PID=$FRONTEND_PID_PORT
        FRONTEND_PORT=$PORT
    fi
done

if [ "$FRONTEND_RUNNING" = true ]; then
    USAGE=$(ps -p "$FRONTEND_PID" -o %cpu,%mem --no-headers 2>/dev/null)
    PORT_INFO=""
    if [ -n "$FRONTEND_PORT" ]; then
        PORT_INFO=" on port $FRONTEND_PORT"
    fi
    echo -e "Frontend: ${GREEN}🟢 RUNNING${NC} (PID: $FRONTEND_PID$PORT_INFO, CPU%/RAM%: $USAGE)"
else
    echo -e "Frontend: ${RED}🔴 STOPPED${NC}"
fi

echo -e "${BLUE}=========================${NC}"
