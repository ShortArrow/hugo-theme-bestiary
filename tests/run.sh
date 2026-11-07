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
icon=$(grep -o '<link rel="icon" type="image/svg+xml" href="[^"]*"' "$home" | sed 's/.*href="//; s/"$//')
[ -n "$icon" ] || fail "home links no favicon"
[ -s "$out/site$icon" ] || fail "favicon $icon was not published"
has "$home" 'href="[^"]*/creatures/inkwyrm/"'

sections() { grep -o 'class="bestiary-index-section"[^>]*>[^<]*<a [^>]*>[^<]*' "$1" | sed 's/.*>//' | paste -sd, -; }
[ "$(sections "$home")" = "Creatures,Apparitions" ] || fail "home index sections are not in weight order: $(sections "$home")"
grep -A3 'href="[^"]*/apparitions/hollowbell/"' "$home" | grep -q 'data-choice="spirit"' || fail "home index shows no seal beside Hollow Bell"
has "$ink" 'Inkwyrm'
grep -q '<a class="bestiary-running-head" href="[^"]*/creatures/">Creatures</a>' "$ink" || fail "Inkwyrm names no way back to the Creatures it is listed under"
lacks "$home" 'class="bestiary-running-head"'
has "$home" '<p>Creatures of ink and lamplight, and where to find them.</p>'
has "$out/site/creatures/index.html" '<p>Things that breathe, after a fashion.</p>'
grep -A3 '<footer' "$ink" | grep -q '<a href="https://example.org/colophon/">Colophon</a>' || fail "Inkwyrm has no footer link to the colophon"

css=$(grep -o '<link rel="stylesheet" href="[^"]*"' "$ink" | sed 's/.*href="//; s/"$//') || fail "Inkwyrm links no stylesheet"
[ -s "$out/site$css" ] || fail "stylesheet $css was not published"
grep -q -- '--bestiary-choice-color' "$out/site$css" || fail "stylesheet does not colour choices"

[ "$(labels "$ink")" = "Kind,Habitat,Sightings,Last seen" ] || fail "Inkwyrm fields are not in declared order: $(labels "$ink")"
has "$ink" 'data-choice="beast"'
has "$ink" '--bestiary-choice-color: #8b3a2b'
lacks "$ink" 'data-night'
has "$moth" 'data-night style="--bestiary-choice-night: #6aa3d7; --bestiary-choice-color: #2b5d8b'
grep -q 'data-night]{[^}]*--bestiary-seal-light:brightness(1)' "$out/site$css" || fail "stylesheet brightens seals that have a night colour"
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
grep -q '\.bestiary-glyph-speckled{mask-image:var(--bestiary-speckle)' "$out/site$css" || fail "stylesheet does not wear the letters of the text"
speckle=$(grep -o -- '--bestiary-speckle:url([^)]*)' "$out/site$css" | head -1 | sed 's/^--bestiary-speckle:url(//; s/)$//; s/^"//; s/"$//')
case $speckle in *.png) [ -s "$out/site$speckle" ] || fail "the speckle $speckle was not published" ;; *) fail "every speckled letter draws the speckle afresh from its filter, which a weak GPU feels on every scroll" ;; esac
grep -q 'var(--bestiary-mottle)' "$out/site$css" || fail "stylesheet leaves the paper an even tone"
tiles() { grep -o "<image href=\"[^\"]*/paper/${2:-day}-t[01]\{4\}[.\"]" "$1" | sed 's/.*-t\([01]*\).*/\1/'; }
! grep -q '<use href="[^"]*paper' "$ink" || fail "Inkwyrm lays its fibres with <use>, which copies every fibre into the page and makes each style recalculation walk ten thousand of them"
[ "$(tiles "$ink" | wc -l)" -eq 160 ] || fail "Inkwyrm's paper is not four tiles by forty"
[ "$(tiles "$ink" night)" = "$(tiles "$ink")" ] || fail "Inkwyrm's paper is laid differently by night"
for scheme in day night; do
  for tile in $(grep -o "<image href=\"[^\"]*/paper/$scheme-t[01]*[^\"]*\"" "$ink" | sed 's/<image href="//; s/"$//' | sort -u); do
    [ -s "$out/site$tile" ] || fail "paper tile $tile was not published"
  done
done
day_tile=$(grep -o '<image href="[^"]*/paper/day-t[^"]*"' "$ink" | head -1 | sed 's/<image href="//; s/"$//')
night_tile=$(grep -o "<image href=\"[^\"]*/paper/night-t$(tiles "$ink" | head -1)[^\"]*\"" "$ink" | head -1 | sed 's/<image href="//; s/"$//')
! grep -q 'var(' "$out/site$day_tile" || fail "paper tile $day_tile colours its fibres with page variables, which do not reach into an image"
[ "$(grep -o "d='[^']*'" "$out/site$day_tile")" = "$(grep -o "d='[^']*'" "$out/site$night_tile")" ] || fail "a paper tile lays its fibres differently by night"
[ "$(grep -o 'stroke:[^;]*' "$out/site$day_tile" | sort -u)" != "$(grep -o 'stroke:[^;]*' "$out/site$night_tile" | sort -u)" ] || fail "the paper's fibres keep their day colours by night"
grep -q -- '--bestiary-paper-night:visible' "$out/site$css" || fail "the night paper tiles are never shown"
tiles "$ink" | awk 'NR > 1 && (NR - 1) % 4 != 0 && substr($0, 4, 1) != right { bad = 1 }
  NR > 4 && substr($0, 1, 1) != bottom[(NR - 1) % 4] { bad = 1 }
  { right = substr($0, 2, 1); bottom[(NR - 1) % 4] = substr($0, 3, 1) }
  END { exit bad }' || fail "Inkwyrm's paper tiles do not meet edge to edge"
[ "$(tiles "$ink")" != "$(tiles "$moth")" ] || fail "Inkwyrm and Lanternmoth are laid on the same paper"
for mark in stain-ink foxing; do grep -q "var(--$mark)" "$out/site$css" || fail "stylesheet leaves no $mark on the leaf"; done
has "$ink" '<button type="button" class="bestiary-scheme" hidden'
grep -q 'localStorage.getItem("bestiary-scheme")' "$ink" || fail "Inkwyrm does not restore the reader's chosen scheme"
grep -q '::view-transition-new(root)' "$out/site$css" || fail "stylesheet does not shape the turn between day and night"
scheme_js=$(grep -o '<script src="[^"]*bestiary-turn[^"]*"' "$ink" | sed 's/.*src="//; s/"$//')
grep -q 'startViewTransition' "$out/site$scheme_js" || fail "the scheme turns without a transition"
grep -q 'prefers-reduced-motion' "$out/site$scheme_js" || fail "the scheme turn ignores a request for reduced motion"
puff=$(grep -o '::view-transition-new(root){[^}]*}' "$out/site$css" | grep -o 'url([^)]*billow[^)]*\.png)' | sed 's/^url(//; s/)$//')
[ -n "$puff" ] && [ -s "$out/site$puff" ] || fail "the billow is drawn afresh at every size as it grows, so a slow machine skips it"
grep -q 'requestAnimationFrame' "$out/site$scheme_js" || fail "the billow's clock starts before the new pages are first drawn, so a slow first frame swallows it"
grep -q '\.decode()' "$out/site$scheme_js" || fail "the billow's clock starts before the new place's drawings have loaded, so a slow load swallows it"
tr -d ' \r\n' < "$out/site$css" | grep -q '@media(prefers-reduced-motion:no-preference){@view-transition{navigation:auto;types:page-turn;\?}' || fail "going to another page does not turn the leaf, or turns it for readers who ask for reduced motion"
grep -q ':active-view-transition-type(page-turn) .bestiary-leaf{view-transition-name:bestiary-leaf}' "$out/site$css" || fail "the page turn does not lift the leaf from what lies behind it"
grep -q '::view-transition-old(bestiary-leaf)' "$out/site$css" || fail "the page turn does not shape the leaf turning over"
has "$ink" 'addEventListener("pagereveal"'
has "$ink" 'addEventListener("pageswap"'
grep -q 'height:min(var(--bestiary-turned' "$out/site$css" || fail "a short leaf turns over from the bottom of the window, where it has no paper"
grep -o 'radial-gradient([^)]*)[^,;]*' "$out/site$css" | grep -q 'fixed' || fail "the shade at the edges of the window ends where a short page ends"
has "$ink" '<div class="bestiary-fold" id="bestiary-fold" aria-hidden="true"></div>'
has "$ink" '<link rel="expect" href="#bestiary-fold" blocking="render">'
[ "$(grep -n 'rel="expect"' "$ink" | cut -d: -f1)" -lt "$(grep -n '<body' "$ink" | cut -d: -f1)" ] || fail "Inkwyrm asks to wait for its flap only after its body has begun, so a slow page is revealed and turned before the flap is parsed"
grep -q 'bestiary-revealing:active-view-transition-type(page-turn) .bestiary-fold{view-transition-name:bestiary-fold' "$out/site$css" || fail "the page turn has no flap to curl over"
grep -q '.bestiary-weathered:active-view-transition-type(page-turn) .bestiary-fold{filter:url(#bestiary-edge)}' "$out/site$css" || fail "the flap of the page turn is cut clean while the leaf is ragged"
grep -q ':root\[data-theme=.\?dark.\?\]' "$out/site$css" || fail "stylesheet has no dark scheme a reader can choose"
grep -q ':root:not(\[data-theme=.\?light.\?\])' "$out/site$css" || fail "stylesheet does not follow the system scheme when the reader chose none"
has "$ink" '<button type="button" class="bestiary-place" hidden'
grep -q 'localStorage.getItem("bestiary-place")' "$ink" || fail "Inkwyrm does not restore the reader's chosen place"
grep -q 'bestiary-place' "$out/site$scheme_js" || fail "the place button turns nothing"
for place in forest sky; do
  grep -q ":root\[data-place=.\?$place.\?\] body" "$out/site$css" || fail "stylesheet lays the leaf nowhere in the $place"
  grep -q -- "--bestiary-$place:" "$out/site$css" || fail "stylesheet paints no $place"
done
for drawing in desk-day desk-night forest-day forest-night sky-day sky-night sky-day-sun sky-night-moon; do
  url=$(grep -o "/images/bestiary/places/$drawing[^\")]*\.svg" "$out/site$css" | head -1)
  [ -n "$url" ] || fail "stylesheet draws no $drawing"
  [ -s "$out/site$url" ] || fail "drawing $url was not published"
done
for drawing in sky-day-near sky-night-near desk-day desk-night forest-day-floor forest-night-floor; do
  grep -q "$drawing[^,]*var(--bestiary-scroll)[^,]*fixed" "$out/site$css" || fail "$drawing scrolls with the leaf instead of drifting behind it"
done
grep -q "animation-timeline:scroll(root)" "$out/site$css" || fail "nothing drifts the places as the page scrolls"
for place in desk forest-floor forest-canopy sky-near; do
  day=$root/assets/images/bestiary/places/$(echo "$place" | sed 's/^\([a-z]*\)/\1-day/').svg
  night=$(echo "$day" | sed 's/-day/-night/')
  [ -s "$day" ] && [ -s "$night" ] || fail "no drawing of $place by day and by night"
  grep -o " \(d\|transform\)='[^']*'" "$day" | sort > "$out/day-shapes"
  grep -o " \(d\|transform\)='[^']*'" "$night" | sort > "$out/night-shapes"
  [ -z "$(comm -13 "$out/day-shapes" "$out/night-shapes" | head -1)" ] || fail "$place lays out its shapes differently by day and by night"
done
for drawing in "$root"/assets/images/bestiary/places/*.svg; do
  twice=$(grep -o "id='[^']*'" "$drawing" | sort | uniq -d | head -1)
  [ -z "$twice" ] || fail "drawing $drawing names $twice twice, so its copies clip or fill by the wrong shape"
done
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
has "$out/fixed-scheme/still/index.html" 'class="bestiary-place"'

build "$root/tests/fixtures/fixed-place" ../../../.. "$out/fixed-place"
lacks "$out/fixed-place/still/index.html" 'class="bestiary-place"'
lacks "$out/fixed-place/still/index.html" 'bestiary-place")'
has "$out/fixed-place/still/index.html" 'class="bestiary-scheme"'

build "$root/tests/fixtures/plain" ../../../.. "$out/plain"
lacks "$out/plain/clean/index.html" 'bestiary-weathered'
lacks "$out/plain/clean/index.html" '<filter id='
lacks "$out/plain/clean/index.html" 'bestiary-hand'
lacks "$out/plain/clean/index.html" '<div class="bestiary-leaf" style='
lacks "$out/plain/clean/index.html" 'bestiary-stains'
lacks "$out/plain/clean/index.html" '<footer'
lacks "$out/plain/clean/index.html" 'rel="icon"'
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
