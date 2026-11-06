#!/bin/sh
# Runs the browser tests in Playwright's Linux image, the one CI uses, so screenshots match the references.
# Usage: sh scripts/visual.sh [arguments for playwright test, such as --update-snapshots or --project=firefox]
# Needs Docker.
set -eu
root=$(cd "$(dirname "$0")/.." && pwd)
image=mcr.microsoft.com/playwright:v1.64.1-noble
hugo=0.169.0

native() { if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else echo "$1"; fi; }

MSYS_NO_PATHCONV=1 docker run --rm --ipc=host \
  -v "$(native "$root"):/work/hugo-theme-bestiary" -w /work/hugo-theme-bestiary \
  -v bestiary-node-modules:/work/hugo-theme-bestiary/node_modules \
  "$image" sh -c "
    curl -fsSL https://github.com/gohugoio/hugo/releases/download/v$hugo/hugo_${hugo}_linux-amd64.tar.gz | tar -xz -C /usr/local/bin hugo &&
    npm ci --no-audit --no-fund &&
    npx playwright test $*"
