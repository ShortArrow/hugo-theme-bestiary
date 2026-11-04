# ADR-0001: The theme stands alone and takes its entry fields from the site

- Status: accepted

## Context

The theme is written for vhabitat.shortarrow.jp, a field guide to software that is operated with Vim keys, and is meant to be listed on themes.gohugo.io for any site that catalogues things as a field guide would. vhabitat classifies each entry into kinds named after its own subject, and another site will have different kinds and different fields.

## Decision

- The theme does not depend on another theme. Its templates, styles and scripts are its own.
- The theme does not name any kind or field. A site declares the fields its entries have, and the theme renders the declared fields as the entry card.
- The theme is a Hugo Module at `github.com/ShortArrow/hugo-theme-bestiary` and supports the Hugo versions from `module.hugoVersion.min` in `hugo.toml` onwards. CI builds `exampleSite` with that minimum and with the latest release.

## Reasons

- A theme built on another theme makes its users pin a pair of versions, and an update to the parent can break it without a change here.
- If the theme named vhabitat's kinds, no other site could use it without overriding its templates.

## Consequences

- vhabitat is the theme's first user and is migrated off Blowfish when the theme can render its pages.
- Raising the minimum Hugo version is a breaking change for users of the theme.
