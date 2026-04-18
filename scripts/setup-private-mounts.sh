#!/usr/bin/env bash
# Wire in-repo symlinks to private Dropbox bind-mounts when present.
# Both targets are gitignored regardless. If a mount is absent
# (CI, remote Codespaces, collaborators without the folder), the
# symlink target is left as an empty directory.
#
#   /workspaces/research-pdfs     ← ~/Dropbox/graph-research-pdfs/
#       symlinked at docs/literature/pdfs/
#
#   /workspaces/research-private  ← ~/Dropbox/graph-research-private/
#       symlinked at docs/private/

set -euo pipefail

link_mount() {
  local mount=$1
  local link=$2
  local label=$3

  if [ -d "$mount" ]; then
    if [ -L "$link" ]; then
      echo "[setup-private-mounts] $label symlink already present"
    elif [ -d "$link" ] && [ -z "$(ls -A "$link" 2>/dev/null)" ]; then
      rmdir "$link"
      ln -s "$mount" "$link"
      echo "[setup-private-mounts] linked $link -> $mount"
    elif [ ! -e "$link" ]; then
      mkdir -p "$(dirname "$link")"
      ln -s "$mount" "$link"
      echo "[setup-private-mounts] linked $link -> $mount"
    else
      echo "[setup-private-mounts] $link already exists with content; skipping symlink"
    fi
    local count
    count=$(find "$mount" -maxdepth 1 -type f 2>/dev/null | wc -l | tr -d ' ')
    echo "[setup-private-mounts] $label mount has $count file(s)"
  else
    mkdir -p "$link"
    echo "[setup-private-mounts] $label mount not found at $mount"
    echo "[setup-private-mounts] $link left empty"
  fi
}

link_mount /workspaces/research-pdfs    docs/literature/pdfs  pdfs
link_mount /workspaces/research-private docs/private          private
