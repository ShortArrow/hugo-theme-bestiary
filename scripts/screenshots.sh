#!/bin/sh
# Captures images/screenshot.png (1500x1000) and images/tn.png (900x600) for themes.gohugo.io
# from a page in the day scheme. Both are the same 1071x714 view at different device scales.
# Usage: sh scripts/screenshots.sh [URL]   (default: the demo site's home page)
# Needs Chrome or Chromium; set CHROME to its path if it is not found.
set -eu
root=$(cd "$(dirname "$0")/.." && pwd)
url=${1:-https://vhabitat.shortarrow.jp/}

if [ -z "${CHROME:-}" ]; then
  for candidate in google-chrome chromium chromium-browser "/c/Program Files/Google/Chrome/Application/chrome.exe" "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; do
    if command -v "$candidate" >/dev/null 2>&1 || [ -x "$candidate" ]; then CHROME=$candidate; break; fi
  done
fi
[ -n "${CHROME:-}" ] || { echo "Chrome not found; set CHROME" >&2; exit 1; }

native() { if command -v cygpath >/dev/null 2>&1; then cygpath -w "$1"; else echo "$1"; fi; }

capture() {
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --blink-settings=preferredColorScheme=1 --virtual-time-budget=3000 \
    --window-size=1071,714 --force-device-scale-factor="$2" \
    --screenshot="$(native "$root/images/$1.png")" "$url" 2>/dev/null
}

mkdir -p "$root/images"
capture screenshot 1.40056
capture tn 0.84034
echo "wrote images/screenshot.png and images/tn.png from $url"
