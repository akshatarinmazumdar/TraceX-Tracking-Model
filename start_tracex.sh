#!/bin/bash
# Wrapper to launch the Trace-X Control Center
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
chmod +x "$SCRIPT_DIR/launchpad/"*.sh 2>/dev/null
exec "$SCRIPT_DIR/launchpad/control.sh"
