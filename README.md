# Bestiary

A Hugo theme for field guides to imaginary creatures: an old natural-history book, with ragged, stained pages and entries stamped by kind.

![The home page of a site using Bestiary](https://raw.githubusercontent.com/ShortArrow/hugo-theme-bestiary/main/images/screenshot.png)

The home page is an index of every entry, grouped by section in the order of the sections' `weight`, with the seals of each entry's choice fields beside it. Each section has a list page of the same form, and each entry has a page with its entry card. The site declares which fields an entry has; the theme names none of its own. A live example is [VHabitat](https://vhabitat.shortarrow.jp/).

## Requirements

Hugo 0.158.0 or later. The extended edition is not required.

## Installation

As a Hugo Module, add the import to your site's configuration:

```toml
[module]
  [[module.imports]]
    path = "github.com/ShortArrow/hugo-theme-bestiary"
```

As a theme directory, clone the repository into `themes/` and set `theme = "hugo-theme-bestiary"`.

## Entry fields

The site declares which fields an entry can have, in the order the entry card shows them:

```toml
[[params.bestiary.fields]]
  key = "kind"
  label = "Kind"
  type = "choice"
  [[params.bestiary.fields.choices]]
    value = "beast"
    label = "Beast"
    color = "#8b3a2b"

[[params.bestiary.fields]]
  key = "habitat"
  label = "Habitat"
  type = "text"
```

An entry sets its fields under `params` in front matter, so that a key such as `kind` does not collide with Hugo's own front matter. The card leaves out the fields an entry does not set.

```yaml
---
title: Inkwyrm
params:
  kind: beast
  habitat: Inkwells
---
```

| `type` | Front matter value | Card shows |
|---|---|---|
| `text` | a string | the string |
| `choice` | the `value` of one of the field's `choices` | the choice's `label`, coloured with its optional `color`, and at night with its optional `nightColor` (otherwise `color` brightened) |
| `links` | a list of `{label, url}` | the links |
| `date` | a date | the date in the site's locale |

The build fails when a field declares another `type`, and when a `choice` value is not one of the declared choices.

### Pages for each choice

A `choice` field with `pages = true` gets a page at `/<key>/` that lists its choices, and a page at `/<key>/<value>/` for each choice that lists the entries set to it. The seals on entry cards and in indexes link to these pages. The pages stay out of the home index and section lists. Without `pages = true`, no pages are made and seals are not links.

```toml
[[params.bestiary.fields]]
  key = "kind"
  label = "Kind"
  type = "choice"
  pages = true
```

## Plates

An entry gets a plate when its page bundle holds a `plate.svg`. The SVG is drawn inline, so it takes the page's ink colour and weathering: draw it with `currentColor` and no fill of its own. The plate's resource title becomes its caption.

```yaml
---
title: Inkwyrm
resources:
  - src: plate.svg
    title: The inkwyrm, coiled about the well it was found in
---
```

With `plates = true`, entries without a plate show the theme's plate of an unconfirmed creature, known only by its tracks, captioned "Not yet drawn. Sightings wanted." or the site's `wantedCaption`.

```toml
[params.bestiary]
  plates = true
  wantedCaption = "Not yet drawn. Sightings wanted."
```

## Weathering

By default the page is a worn leaf of handmade paper, uneven in tone, whose fibres show through, laid as Wang tiles so the pattern never repeats: headings and seals are printed in uneven ink, rules, index leaders and link underlines are drawn by hand, the leaf has ragged and browned edges, and the paper shows the wear of a book that has been looked after: now and then a mishap smoothed over (a corner turned down to keep the place, a page caught as the book was shut, a corner crushed in a fall, a tear mended with tape, a leaf folded to carry), a cup ring, a tide mark or a small scorch, faint foxing and thumb smudges, each placed and shaped differently on each page and the same on every build. Every letter on the leaf is set slightly askew by a small script and printed a little broken by the grain of the paper, the same way on every visit, never fainter than 4.5:1 against the darkest of the paper. To print on a clean sheet instead:

```toml
[params.bestiary]
  weathering = false
```

## Day and night

Pages follow the reader's system scheme. A moon in the header turns them to night, and a sun turns them back to day; the new scheme billows out from the button like a puff of smoke (at once, for readers who ask for reduced motion), and the choice is kept in the reader's browser and restored before the page is painted. Without JavaScript the button stays hidden and the system scheme applies. To leave the scheme to the system alone:

```toml
[params.bestiary]
  schemeToggle = false
```

## Where the leaf lies

The leaf lies on a wooden desk. A house in the header, opposite the moon or sun, shows that it is at home; pressing it takes the leaf out to the forest floor, then under the open sky, then home again, and the tree, the cloud or the house shows where it lies now. Each place has a day and a night: leaf litter and moss under dappled light or moonlight, a blue sky with clouds and the sun or a starry one with the moon, oak or dark walnut planks laid unevenly, as boards cut and nailed by hand. They are drawn in flat colours with outlines, out of focus behind the leaf and the farther things more so, the far sky, the sun or moon and the shade of the canopy stay put while the page scrolls past them. Where the browser supports scroll-driven animation, the ground beneath the leaf moves a little more slowly than the leaf and the nearer clouds more slowly still; elsewhere they stay put as well. The move billows out from the button as the turn between day and night does, and the choice is kept in the reader's browser apart from the scheme. Without JavaScript the button stays hidden and the leaf stays on the desk. To keep it there:

```toml
[params.bestiary]
  placeToggle = false
```

## Turning pages

Following a link to another page of the site turns the leaf over: it lifts at its right edge and turns to the left, and the next leaf lies beneath it. Going back through the browser's history turns the earlier leaf back over. The turn needs a browser with cross-document view transitions; in others, and for readers who ask for reduced motion, the next page appears at once.

## Favicon

When the site has `assets/favicon.svg`, every page links it as its icon, fingerprinted so a changed icon is not kept from a cache. An SVG icon can follow the reader's scheme with a `prefers-color-scheme` media query inside it. Without the file, pages link no icon.

## Footer links

Entries in the site's `footer` menu are listed at the foot of every page, in menu order. Without a footer menu, pages have no footer.

```toml
[[menus.footer]]
  name = "Privacy policy"
  pageRef = "/privacy"
```

## Analytics

When the site sets `services.googleAnalytics.ID`, every page loads Hugo's Google Analytics template, which follows the site's `privacy.googleAnalytics` settings. Without an ID, pages load no analytics.

## Development

`tests/run.sh` builds `exampleSite` with the theme and fails if a page does not render. It needs `hugo` on `PATH`.

## License

MIT
