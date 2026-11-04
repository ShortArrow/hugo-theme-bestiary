#!/bin/sh
# Builds exampleSite and the fixture sites with the theme and checks what they render.
# Needs hugo on PATH. Exits non-zero on the first failed check.
set -eu
root=$(cd "$(dirname "$0")/.." && pwd)
out=$(mktemp -d)
trap 'rm -rf "$out"' EXIT

fail() { echo "FAIL: $1" >&2; exit 1; }
build() { hugo --panicOnWarning -s "$1" --themesDir "$2" -d "$3" >/dev/null; }
has() { grep -q -- "$2" "$1" || fail "$1 lacks $2"; }
lacks() { ! grep -q -- "$2" "$1" || fail "$1 has $2"; }
labels() { grep -o 'class="bestiary-field-label">[^<]*' "$1" | sed 's/.*>//' | paste -sd, -; }

build "$root/exampleSite" ../.. "$out/site"
home=$out/site/index.html
ink=$out/site/creatures/inkwyrm/index.html
moth=$out/site/creatures/lanternmoth/index.html

has "$home" '<title>Example Bestiary</title>'
has "$home" 'href="[^"]*/creatures/inkwyrm/"'

sections() { grep -o 'class="bestiary-index-section"[^>]*>[^<]*<a [^>]*>[^<]*' "$1" | sed 's/.*>//' | paste -sd, -; }
[ "$(sections "$home")" = "Creatures,Apparitions" ] || fail "home index sections are not in weight order: $(sections "$home")"
grep -A3 'href="[^"]*/apparitions/hollowbell/"' "$home" | grep -q 'data-choice="spirit"' || fail "home index shows no seal beside Hollow Bell"
has "$ink" 'Inkwyrm'

css=$(grep -o '<link rel="stylesheet" href="[^"]*"' "$ink" | sed 's/.*href="//; s/"$//') || fail "Inkwyrm links no stylesheet"
[ -s "$out/site$css" ] || fail "stylesheet $css was not published"
grep -q -- '--bestiary-choice-color' "$out/site$css" || fail "stylesheet does not colour choices"

[ "$(labels "$ink")" = "Kind,Habitat,Sightings,Last seen" ] || fail "Inkwyrm fields are not in declared order: $(labels "$ink")"
has "$ink" 'data-choice="beast"'
has "$ink" '--bestiary-choice-color: #8b3a2b'
has "$ink" '>Beast<'
has "$ink" '>Inkwells<'
has "$ink" '<a href="https://example.org/notes/inkwyrm">Field notes</a>'
has "$ink" '<time datetime="2026-01-02">January 2, 2026</time>'

[ "$(labels "$moth")" = "Kind" ] || fail "Lanternmoth shows fields it does not have: $(labels "$moth")"

has "$ink" '<html [^>]*class="bestiary-weathered"'
has "$ink" '<filter id="bestiary-ink"'
grep -q 'url(#bestiary-ink)' "$out/site$css" || fail "stylesheet does not apply the ink filter"

build "$root/tests/fixtures/plain" ../../../.. "$out/plain"
lacks "$out/plain/clean/index.html" 'bestiary-weathered'
lacks "$out/plain/clean/index.html" '<filter id='

expect_error() {
  if err=$(build "$root/tests/fixtures/$1" ../../../.. "$out/$1" 2>&1); then fail "$1 built without error"; fi
  echo "$err" | grep -q -- "$2" || fail "$1 failed without naming the cause: $err"
}
expect_error unknown-choice 'kind: "baest" is not one of the declared choices'
expect_error unknown-type 'habitat: field type "paragraph" is not one of text, choice, links, date'

echo ok
