#!/bin/bash
# Stable comparison server on port 38567, serving from 'latest' symlink.
# URL: http://localhost:38567/latest/comparison.html
# Via Tailscale: ssh -L 38567:localhost:38567 <user>@100.92.162.20
# The 'latest' symlink auto-updates each time compare-flow.mjs runs.

PORT=38567
RESULTS_DIR="$(dirname "$0")/results"

# Kill any existing server on this port (best effort)
pkill -f "python3 -m http.server $PORT" 2>/dev/null
sleep 1

cd "$RESULTS_DIR" || exit 1
echo "Serving $RESULTS_DIR on port $PORT"
echo "URL: http://localhost:$PORT/latest/comparison.html"
exec python3 -m http.server $PORT --bind 0.0.0.0
