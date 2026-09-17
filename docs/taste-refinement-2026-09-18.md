# Taste refinement — 2026-09-18

The user approved the Taste review recommendations. Preserve the cinematic home cover, cloud rendering, title timing, brand, routes, factual content and exported artwork. Improve the detail pages' information hierarchy and the ticket editor's mobile layout using the existing Astro/CSS system.

## Changes

- Detail page H1 scale: `clamp(2.25rem, 4.5vw, 4.5rem)`. Detail section H2 scale: `clamp(1.8rem, 3.2vw, 2.75rem)`, excluding headings inside guide prose. Intro padding and section spacing reduced by about 25%.
- Discover introduction starts collapsed; the explanation and sources remain accessible with and without JavaScript. Its time label now agrees with the home's three-minute introduction. Duplicate decorative English labels were removed; chronological labels remain.
- Setlist search and album filters share a desktop row. Result count and reset share a footer. The view switcher appears only when there is an alternative essential-song view. The undefined input background token was replaced with an explicit translucent warm-black surface.
- Guide overview uses four columns on desktop, two on ordinary mobile widths, and one when available width or enlarged text requires it. Sticky navigation behavior is unchanged.
- The ticket editor uses a compact preview on narrow containers with a keyboard-operable expand/collapse control. Date choices sit side by side when they fit. Exported JPEG dimensions and artwork remain unchanged.
- Native date selection and Trilogy comparison accents use the existing amber palette.

## Measurements

At 1440×900, the setlist filter height went from about 309px to 128px; the song list starts around 550px instead of 894px. At 390×844, the ticket's first song selector moved from about 1,031px to 601px. These are local browser measurements, not usability study results.

## Validation scope

Checked desktop and mobile layouts, source disclosure access, search/reset and browser history, ticket preview resizing and selection preservation, JPEG export, keyboard interaction, text zoom, sticky guide heading clearance, and automated accessibility scans on the affected detail/tool pages. Build, type checking, lint, formatting, unit tests and asset budgets were also checked.

All 59 unit tests passed. The targeted browser runs covered 34 distinct desktop/mobile cases and passed, including the final ticket text-zoom correction. A fresh pre-upload `npm run verify` passed lint, formatting and Astro checks, then stopped at the existing content audit (27 passed, one failed): eight practical guides and their sources need actual freshness verification. The full browser suite was not rerun for this refinement.

This change does not refresh concert sources, run a production deployment or resolve the separate full-release content freshness gate. The local preview is served from `weeknd-release` at port 4325.
