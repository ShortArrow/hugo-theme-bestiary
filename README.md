# Bestiary

A Hugo theme for field guides to imaginary creatures.

The theme is at an early stage. It renders a home page that lists every entry, list pages for sections, and a page for each entry.

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

## Development

`tests/smoke.sh` builds `exampleSite` with the theme and fails if a page does not render. It needs `hugo` on `PATH`.

## License

MIT
