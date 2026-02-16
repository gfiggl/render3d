#!/bin/bash
set -euo pipefail

git add .
commitTitle="${1:-build ($(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)): $(date -u +"%Y-%m-%d %H:%M:%S")}"
git commit -m "$commitTitle"
git push