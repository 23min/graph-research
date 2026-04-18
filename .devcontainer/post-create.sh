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

echo "==> Wiring PDF symlink"
bash scripts/setup-pdfs.sh

if [ -f bench/package.json ]; then
  echo "==> Installing bench npm dependencies"
  (cd bench && npm install --silent)
fi

echo "==> Done. Happy hacking!"
