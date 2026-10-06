#!/bin/bash
# Trace-X Logs Script
# Interactive log viewer

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGS_DIR="$SCRIPT_DIR/logs"

clear
echo -e "${BLUE}${BOLD}📋 Trace-X Log Viewer${NC}"
echo -e "========================="
echo -e "1) View Backend Logs"
echo -e "2) View Frontend Logs"
echo -e "3) View Combined (Live)"
echo -e "4) Return to Menu"
echo -e "========================="
echo -ne "Choose an option [1-4]: "
read -r choice

case $choice in
    1)
        if [ -f "$LOGS_DIR/backend.log" ]; then
            echo -e "${GREEN}Showing backend.log (Press Ctrl+C to exit)...${NC}"
            tail -f -n 50 "$LOGS_DIR/backend.log"
        else
            echo -e "${RED}No backend logs found.${NC}"
            sleep 2
        fi
        ;;
    2)
        if [ -f "$LOGS_DIR/frontend.log" ]; then
            echo -e "${GREEN}Showing frontend.log (Press Ctrl+C to exit)...${NC}"
            tail -f -n 50 "$LOGS_DIR/frontend.log"
        else
            echo -e "${RED}No frontend logs found.${NC}"
            sleep 2
        fi
        ;;
    3)
        echo -e "${GREEN}Showing combined logs (Press Ctrl+C to exit)...${NC}"
        # We check which files exist to avoid errors
        FILES_TO_TAIL=""
        if [ -f "$LOGS_DIR/backend.log" ]; then
            FILES_TO_TAIL="$FILES_TO_TAIL $LOGS_DIR/backend.log"
        fi
        if [ -f "$LOGS_DIR/frontend.log" ]; then
            FILES_TO_TAIL="$FILES_TO_TAIL $LOGS_DIR/frontend.log"
        fi
        if [ -n "$FILES_TO_TAIL" ]; then
            tail -f -n 20 $FILES_TO_TAIL
        else
            echo -e "${RED}No logs found to view.${NC}"
            sleep 2
        fi
        ;;
    *)
        exit 0
        ;;
esac
