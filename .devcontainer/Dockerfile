# graph-research development container
# Base: Microsoft Ubuntu 22.04 devcontainer image (ships vscode user, sudo,
# common dev tooling). Node, Python, and GitHub CLI come in via devcontainer
# features. This Dockerfile adds only the tools that aren't cleanly expressed
# as a feature: uv (Astral), Claude Code, and git-filter-repo.
FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

# uv — Astral Python package manager
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

USER vscode
ENV PATH="/home/vscode/.local/bin:${PATH}"

# Claude Code CLI (native installer)
RUN curl -fsSL https://claude.ai/install.sh | bash

# git-filter-repo for history migration work
RUN uv tool install git-filter-repo
