#!/bin/bash
echo "==========================================="
echo "   TraceX Frontend Launcher"
echo "==========================================="
echo "Starting local HTTP server..."

# Find an available port starting from 8080
PORT=8080
while netstat -an | grep $PORT | grep LISTEN > /dev/null; do
    PORT=$((PORT+1))
done

echo "Server running on http://localhost:$PORT"
echo ""
echo "Press Ctrl+C to stop the server."

# Open the browser if xdg-open or open is available
if command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:$PORT/index.html" &
elif command -v open &> /dev/null; then
    open "http://localhost:$PORT/index.html" &
else
    echo "--> Please open your web browser and go to: http://localhost:$PORT/index.html"
fi

# Run the python server
python3 -m http.server $PORT
