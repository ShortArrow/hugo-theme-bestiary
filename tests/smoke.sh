#!/bin/sh
# Builds exampleSite with the theme and checks that the home page and an entry page render.
set -eu
root=$(cd "$(dirname "$0")/.." && pwd)
out=$(mktemp -d)
trap 'rm -rf "$out"' EXIT
hugo --quiet --panicOnWarning -s "$root/exampleSite" --themesDir ../.. -d "$out"
fail() { echo "FAIL: $1" >&2; exit 1; }
grep -q '<title>Example Bestiary</title>' "$out/index.html" || fail "home page has no site title"
grep -q 'href="[^"]*/creatures/inkwyrm/"' "$out/index.html" || fail "home page does not link to the entry"
grep -q 'Inkwyrm' "$out/creatures/inkwyrm/index.html" || fail "entry page has no title"
echo ok
