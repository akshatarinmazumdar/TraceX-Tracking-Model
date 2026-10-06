#!/bin/bash
# Trace-X Launchpad Interactive Control Center

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

show_menu() {
    clear
    echo -e "${BLUE}====================================================${NC}"
    echo -e "${GREEN}${BOLD}          Trace-X AI Surveillance Launchpad        ${NC}"
    echo -e "${BLUE}====================================================${NC}"
    echo ""
    "$SCRIPT_DIR/status.sh"
    echo ""
    echo -e "${BOLD}Select an action:${NC}"
    echo -e "  [1] 🚀 ${GREEN}Start All Servers${NC} (Backend + Frontend)"
    echo -e "  [2] 🛑 ${RED}Stop All Servers${NC}"
    echo -e "  [3] 🔄 ${YELLOW}Restart All Servers${NC}"
    echo -e "  [4] 📋 View Logs"
    echo -e "  [5] 📊 Check Status Detail"
    echo -e "  [6] ❌ Exit Control Panel"
    echo ""
    echo -ne "Option [1-6]: "
}

while true; do
    show_menu
    read -r choice
    case $choice in
        1)
            "$SCRIPT_DIR/start.sh"
            echo -ne "\nPress Enter to continue..."
            read -r _
            ;;
        2)
            "$SCRIPT_DIR/stop.sh"
            echo -ne "\nPress Enter to continue..."
            read -r _
            ;;
        3)
            "$SCRIPT_DIR/stop.sh"
            sleep 1
            "$SCRIPT_DIR/start.sh"
            echo -ne "\nPress Enter to continue..."
            read -r _
            ;;
        4)
            "$SCRIPT_DIR/logs.sh"
            ;;
        5)
            clear
            "$SCRIPT_DIR/status.sh"
            echo -ne "\nPress Enter to continue..."
            read -r _
            ;;
        6)
            echo -e "\n${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "\n${RED}Invalid option. Press Enter to retry...${NC}"
            read -r _
            ;;
    esac
done
