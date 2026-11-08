#!/bin/sh
# Draws assets/images/bestiary/places/*.webp from the SVGs beside them, in Playwright's Linux image, so that every machine draws the same pictures.
# Usage: sh scripts/places.sh   (run it after editing a place's SVG, and commit both)
# Needs Docker.
set -eu
root=$(cd "$(dirname "$0")/.." && pwd)
image=mcr.microsoft.com/playwright:v1.64.1-noble

native() { if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else echo "$1"; fi; }

MSYS_NO_PATHCONV=1 docker run --rm \
  -v "$(native "$root"):/work/hugo-theme-bestiary" -w /work/hugo-theme-bestiary \
  -v bestiary-node-modules:/work/hugo-theme-bestiary/node_modules \
  "$image" sh -c "npm ci --no-audit --no-fund >/dev/null && node scripts/places.mjs"
