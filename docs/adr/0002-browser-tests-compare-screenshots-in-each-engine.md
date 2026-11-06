# ADR-0002: Browser tests compare screenshots in each engine

- Status: accepted

## Context

Much of the theme is drawing: SVG filters, masks, view transitions and scroll-driven animation. Each browser engine supports these differently, and some faults show in one engine only. In Firefox the paper's fibres were filled black, because Firefox does not apply a stylesheet inside an external sprite brought in with `<use>`. Faults of this kind render without error, so `tests/run.sh`, which checks the built HTML and CSS, cannot see them.

## Decision

- `tests/visual` runs exampleSite with Playwright in Chromium, Firefox and WebKit. Each page in each scheme and place is compared with a reference screenshot made in the same engine.
- The references are made in Playwright's Linux Docker image, and CI runs the tests in the same image. `scripts/visual.sh` runs that image locally.
- A page is not compared across engines.
- `tests/visual` has its own `go.mod`, so the theme's Hugo module leaves out the tests and their screenshots.
- Behaviour that only a browser shows, such as the page turn and the billow, is checked in the engines that support it.

## Reasons

- Fonts and antialiasing differ between operating systems, so references made on one operating system fail on another. One image for both making and checking references removes that difference.
- Two engines render the same page with small differences everywhere, so a comparison across engines would need a tolerance loose enough to miss a fault like the black fibres. Each engine against its own reference keeps the tolerance tight.

## Consequences

- A change meant to alter how pages look also updates the references, made with `scripts/visual.sh --update-snapshots` and reviewed before they are committed.
- Running the browser tests needs Docker locally, and CI spends a few minutes on them.
- Every update of the references adds their size, about 13 MB, to the repository's history.
