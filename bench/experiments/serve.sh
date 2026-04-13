#!/bin/bash
# Kill any previous server on port 6060
fuser -k 6060/tcp 2>/dev/null
sleep 0.3

# Find latest results dir
LATEST=$(ls -d /workspaces/worktrees/dagbench/bench/experiments/results/flow-* 2>/dev/null | sort | tail -1)
if [ -z "$LATEST" ]; then echo "No results found"; exit 1; fi

echo "Serving: $LATEST"
cd /workspaces/worktrees/dagbench
exec python3 -m http.server 6060 --bind 0.0.0.0 --directory "$LATEST"
