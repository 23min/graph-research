#!/usr/bin/env bash
# Runs after the devcontainer is created.
set -euo pipefail

echo "==> Setting up graph-research development environment"

echo "==> Updating submodules"
git submodule update --init --recursive

if [ -f .ai/sync.sh ]; then
  echo "==> Running .ai/sync.sh"
  bash .ai/sync.sh
else
  echo "==> .ai/sync.sh not found — skipping"
fi

echo "==> Wiring private mount symlinks (pdfs + private notes)"
bash scripts/setup-private-mounts.sh

if [ -f bench/package.json ]; then
  echo "==> Installing bench npm dependencies"
  (cd bench && npm install --silent)
fi

echo "==> Done. Happy hacking!"
