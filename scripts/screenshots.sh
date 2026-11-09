#!/bin/sh
# Draws images/screenshot.png (1500x1000) and images/tn.png (900x600) for themes.gohugo.io, in Playwright's Linux image.
# Usage: sh scripts/screenshots.sh [URL]   (default: the demo site's home page)
# Needs Docker.
set -eu
root=$(cd "$(dirname "$0")/.." && pwd)
url=${1:-https://vhabitat.shortarrow.jp/}
image=mcr.microsoft.com/playwright:v1.64.1-noble

native() { if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else echo "$1"; fi; }

MSYS_NO_PATHCONV=1 docker run --rm \
  -v "$(native "$root"):/work/hugo-theme-bestiary" -w /work/hugo-theme-bestiary \
  -v bestiary-node-modules:/work/hugo-theme-bestiary/node_modules \
  "$image" sh -c 'npm ci --no-audit --no-fund >/dev/null && node scripts/screenshots.mjs "$0"' "$url"
