# Bestiary

A Hugo theme for field guides to imaginary creatures.

The theme is at an early stage. The home page is an index of every entry, grouped by section in the order of the sections' `weight`, with the seals of each entry's choice fields beside it. Each section has a list page of the same form, and each entry has a page with its entry card.

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
| `choice` | the `value` of one of the field's `choices` | the choice's `label`, coloured with its optional `color` |
| `links` | a list of `{label, url}` | the links |
| `date` | a date | the date in the site's locale |

The build fails when a field declares another `type`, and when a `choice` value is not one of the declared choices.

## Development

`tests/run.sh` builds `exampleSite` with the theme and fails if a page does not render. It needs `hugo` on `PATH`.

## License

MIT
