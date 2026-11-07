#!/bin/sh
# Draws assets/images/bestiary/speckle.png from speckle.svg beside it, the mask that wears the letters.
# The stylesheet uses the picture rather than the SVG so that a browser does not run the SVG's filter again for every speckled letter.
# Usage: sh scripts/speckle.sh   (run it after editing speckle.svg, and commit both)
# Needs Chrome or Chromium; set CHROME to its path if it is not found.
set -eu
root=$(cd "$(dirname "$0")/.." && pwd)
svg=$root/assets/images/bestiary/speckle.svg
png=$root/assets/images/bestiary/speckle.png

if [ -z "${CHROME:-}" ]; then
  for candidate in google-chrome chromium chromium-browser "/c/Program Files/Google/Chrome/Application/chrome.exe" "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; do
    if command -v "$candidate" >/dev/null 2>&1 || [ -x "$candidate" ]; then CHROME=$candidate; break; fi
  done
fi
[ -n "${CHROME:-}" ] || { echo "Chrome not found; set CHROME" >&2; exit 1; }

native() { if command -v cygpath >/dev/null 2>&1; then cygpath -w "$1"; else echo "$1"; fi; }
url() { if command -v cygpath >/dev/null 2>&1; then echo "file:///$(cygpath -m "$1")"; else echo "file://$1"; fi; }

size=$(grep -o "width='[0-9]*'" "$svg" | head -1 | tr -dc 0-9)
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --default-background-color=00000000 \
  --window-size="$size,$size" --force-device-scale-factor=1 \
  --screenshot="$(native "$png")" "$(url "$svg")" 2>/dev/null
echo "wrote assets/images/bestiary/speckle.png from speckle.svg"
