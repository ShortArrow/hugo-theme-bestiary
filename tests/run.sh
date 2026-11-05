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
has "$home" '<p>Creatures of ink and lamplight, and where to find them.</p>'
has "$out/site/creatures/index.html" '<p>Things that breathe, after a fashion.</p>'
grep -A3 '<footer' "$ink" | grep -q '<a href="https://example.org/colophon/">Colophon</a>' || fail "Inkwyrm has no footer link to the colophon"

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
has "$ink" '<figure class="bestiary-plate">'
has "$ink" '<filter id="bestiary-plate"'
grep -q 'plate svg{filter:url(#bestiary-plate)' "$out/site$css" || fail "stylesheet does not redraw plates by hand"
grep -A40 '<figure class="bestiary-plate">' "$ink" | grep -q '<title>Inkwyrm coiled about an inkwell</title>' || fail "Inkwyrm's plate is not drawn inline"
has "$ink" '<figcaption>The inkwyrm, coiled about the well it was found in</figcaption>'
has "$moth" '<figure class="bestiary-plate bestiary-plate-wanted">'
lacks "$home" '<figure class="bestiary-plate'

spirit=$out/site/kind/spirit/index.html
has "$spirit" '<h1>Spirit</h1>'
has "$spirit" 'href="/creatures/lanternmoth/"'
has "$spirit" 'href="/apparitions/hollowbell/"'
lacks "$spirit" 'href="/creatures/inkwyrm/"'
grep -A2 'href="/apparitions/hollowbell/"' "$spirit" | grep -q 'Apparitions' || fail "Spirit page does not name Hollow Bell's section"
has "$out/site/kind/index.html" '<h1>Kind</h1>'
has "$out/site/kind/index.html" 'href="/kind/beast/"'
has "$out/site/kind/index.html" 'href="/kind/spirit/"'
has "$ink" '<a class="bestiary-choice" href="/kind/beast/"'
grep -A3 'href="/apparitions/hollowbell/"' "$home" | grep -q '<a class="bestiary-choice" href="/kind/spirit/"' || fail "home index seal does not link to its kind"

has "$ink" '<html [^>]*class="bestiary-weathered"'
has "$ink" '<filter id="bestiary-ink"'
grep -q 'url(#bestiary-ink)' "$out/site$css" || fail "stylesheet does not apply the ink filter"
marks() { grep -o '<div class="bestiary-leaf" style="[^"]*"' "$1"; }
[ -n "$(marks "$ink")" ] || fail "Inkwyrm's leaf carries no marks of its own"
[ "$(marks "$ink")" != "$(marks "$moth")" ] || fail "Inkwyrm and Lanternmoth carry the same marks"
fox() { marks "$1" | grep -o -- '--mark-fox-[0-9]*-[xy]: [0-9]*%' | sed 's/.*: //' | paste -sd, -; }
[ -n "$(fox "$ink")" ] || fail "Inkwyrm's foxing is not placed spot by spot"
[ "$(fox "$ink")" != "$(fox "$moth")" ] || fail "Inkwyrm and Lanternmoth share one foxing pattern"
stains() { sed -n '/<svg class="bestiary-stains"/,$p' "$1"; }
grep -q '<svg class="bestiary-stains"' "$ink" || fail "Inkwyrm's leaf has no stain layer"
[ "$(stains "$ink")" != "$(stains "$moth")" ] || fail "Inkwyrm and Lanternmoth carry the same stains"
! grep -l '%!' "$out"/site/index.html "$out"/site/*/index.html "$out"/site/*/*/index.html || fail "a page carries a malformed number from a template's printf"
mishap() { grep -o 'data-mishap="[a-z-]*"' "$1" || echo none; }
[ "$(for page in "$out"/site/index.html "$out"/site/*/index.html "$out"/site/*/*/index.html; do mishap "$page"; done | sort -u | wc -l)" -gt 1 ] || fail "every example page met the same mishap"
for mark in stain-ink foxing; do grep -q "var(--$mark)" "$out/site$css" || fail "stylesheet leaves no $mark on the leaf"; done
has "$ink" '<button type="button" class="bestiary-scheme" hidden'
grep -q 'localStorage.getItem("bestiary-scheme")' "$ink" || fail "Inkwyrm does not restore the reader's chosen scheme"
grep -q '::view-transition-new(root)' "$out/site$css" || fail "stylesheet does not shape the turn between day and night"
scheme_js=$(grep -o '<script src="[^"]*bestiary-scheme[^"]*"' "$ink" | sed 's/.*src="//; s/"$//')
grep -q 'startViewTransition' "$out/site$scheme_js" || fail "the scheme turns without a transition"
grep -q 'prefers-reduced-motion' "$out/site$scheme_js" || fail "the scheme turn ignores a request for reduced motion"
grep -q ':root\[data-theme=.\?dark.\?\]' "$out/site$css" || fail "stylesheet has no dark scheme a reader can choose"
grep -q ':root:not(\[data-theme=.\?light.\?\])' "$out/site$css" || fail "stylesheet does not follow the system scheme when the reader chose none"
has "$ink" '<filter id="bestiary-wear"'
js=$(grep -o '<script src="[^"]*bestiary-hand[^"]*"' "$ink" | sed 's/.*src="//; s/"$//')
[ -n "$js" ] || fail "Inkwyrm loads no script for its weathered letters"
grep -q 'bestiary-glyph' "$out/site$js" || fail "script $js does not set letters"
for mark in low high wet; do grep -q "bestiary-glyph-$mark" "$out/site$js" || fail "script $js prints no letter $mark"; done
for mark in low high wet; do grep -q "\.bestiary-glyph-$mark{" "$out/site$css" || fail "stylesheet does not draw $mark letters"; done
lacks "$ink" '<filter id="bestiary-hand"'
lacks "$ink" '<filter id="bestiary-rule"'
for line in underline leader rule-line rule-double; do
  grep -q "var(--bestiary-$line)" "$out/site$css" || fail "stylesheet draws no $line"
done
seal_style() { grep -A3 "href=\"[^\"]*$2\"" "$1" | grep -o 'class="bestiary-choice"[^>]*' | grep -o -- '--bestiary-tilt: [^;"]*'; }
[ -n "$(seal_style "$home" /apparitions/hollowbell/)" ] || fail "Hollow Bell's seal has no tilt of its own"
[ "$(seal_style "$home" /apparitions/hollowbell/)" != "$(seal_style "$home" /creatures/lanternmoth/)" ] || fail "seals of different entries share one tilt"

build "$root/tests/fixtures/unpaged-choice" ../../../.. "$out/unpaged-choice"
has "$out/unpaged-choice/plain/index.html" '<span class="bestiary-choice"'
[ ! -e "$out/unpaged-choice/mood" ] || fail "a choice field without pages = true got pages"

build "$root/tests/fixtures/fixed-scheme" ../../../.. "$out/fixed-scheme"
lacks "$out/fixed-scheme/still/index.html" 'class="bestiary-scheme"'
lacks "$out/fixed-scheme/still/index.html" 'bestiary-scheme")'

build "$root/tests/fixtures/plain" ../../../.. "$out/plain"
lacks "$out/plain/clean/index.html" 'bestiary-weathered'
lacks "$out/plain/clean/index.html" '<filter id='
lacks "$out/plain/clean/index.html" 'bestiary-hand'
lacks "$out/plain/clean/index.html" '<div class="bestiary-leaf" style='
lacks "$out/plain/clean/index.html" 'bestiary-stains'
lacks "$out/plain/clean/index.html" '<footer'
lacks "$out/plain/clean/index.html" '<figure class="bestiary-plate'

lacks "$ink" 'googletagmanager'
build "$root/tests/fixtures/analytics" ../../../.. "$out/analytics"
has "$out/analytics/counted/index.html" 'googletagmanager.com/gtag/js?id=G-TEST123'

expect_error() {
  if err=$(build "$root/tests/fixtures/$1" ../../../.. "$out/$1" 2>&1); then fail "$1 built without error"; fi
  echo "$err" | grep -q -- "$2" || fail "$1 failed without naming the cause: $err"
}
expect_error unknown-choice 'kind: "baest" is not one of the declared choices'
expect_error unknown-type 'habitat: field type "paragraph" is not one of text, choice, links, date'

echo ok
