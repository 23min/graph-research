#!/usr/bin/env bash
# Wire docs/literature/pdfs → /workspaces/research-pdfs if the Dropbox mount
# exists. Otherwise leave an empty directory so fetch-pdfs.mjs has somewhere
# to write.

set -euo pipefail

MOUNT=/workspaces/research-pdfs
LINK=docs/literature/pdfs

if [ -d "$MOUNT" ]; then
  if [ -L "$LINK" ]; then
    echo "[setup-pdfs] symlink already present"
  elif [ -d "$LINK" ] && [ -z "$(ls -A "$LINK" 2>/dev/null)" ]; then
    rmdir "$LINK"
    ln -s "$MOUNT" "$LINK"
    echo "[setup-pdfs] linked $LINK -> $MOUNT"
  elif [ ! -e "$LINK" ]; then
    ln -s "$MOUNT" "$LINK"
    echo "[setup-pdfs] linked $LINK -> $MOUNT"
  else
    echo "[setup-pdfs] $LINK already exists with content; skipping symlink"
  fi
  count=$(find "$MOUNT" -maxdepth 1 -name '*.pdf' 2>/dev/null | wc -l | tr -d ' ')
  echo "[setup-pdfs] Dropbox mount has $count PDF(s)"
else
  mkdir -p "$LINK"
  echo "[setup-pdfs] Dropbox mount not found at $MOUNT"
  echo "[setup-pdfs] docs/literature/pdfs left empty; run scripts/fetch-pdfs.mjs for open-access papers"
fi
