# Task 13 report — Accessibility, no-JavaScript, and performance gates

## Scope

- Added production E2E gates for all public routes: `/`, `/discover/`,
  `/setlist/`, `/goyang/`, `/sources/`, `/share/ticket/`, and
  `/share/setlist/`.
- Added a production-build budget walk and wired it into `verify` before E2E.
- Did not create Task 14 CI, Cloudflare, or header files.

## TDD / diagnostic evidence

The first focused run used Node `v22.14.0`:

```text
npm run build && npm run test:e2e -- accessibility.spec.ts no-js.spec.ts
26 passed, 2 failed
```

Both failures were `moves focus to main content when the skip link is activated`
(desktop and mobile): the `#content` hash moved the viewport but focus remained
on the skip link. The owner fix is `tabindex="-1"` on `BaseLayout`'s `<main>`;
the regression passes in both projects.

No axe rules were disabled or suppressed.

## Accessibility and enhancement coverage

- Axe serious/critical scans pass for all seven public routes in Desktop Chrome
  and Pixel 7 Chromium.
- Keyboard: the skip link focuses main content; native expected-song disclosure
  opens with Space.
- Media: every public route has no `video[autoplay]`; the official embed iframe
  is absent until explicit interaction.
- No JavaScript: home venue facts; expected label plus native `<details>`;
  Goyang transport and unpublished/pending guidance; Discover summary and
  source-link enhancement all remain server-rendered and usable.
- Reduced motion: the countdown enters `data-motion-state="reduced"`, retains
  readable primary text, and does not request the deferred Motion chunk.

## Built transfer budgets

`scripts/check-performance-budget.mjs` follows each generated HTML page's
initial module imports and browser-selected AVIF `<picture>` asset. It counts
each asset once per page and once in the aggregate, so responsive fallbacks and
shared assets are not double-counted.

| Route | Initial JS gzip | Raster | Limit |
| --- | ---: | ---: | --- |
| `/` | 2.3 KiB | 10.5 KiB | 75 KiB / 700 KiB |
| `/discover/` | 0.0 KiB | 0.0 KiB | 75 KiB / 400 KiB |
| `/setlist/` | 0.0 KiB | 0.0 KiB | 75 KiB / 400 KiB |
| `/goyang/` | 0.0 KiB | 0.0 KiB | 75 KiB / 400 KiB |
| `/sources/` | 0.0 KiB | 0.0 KiB | 75 KiB / 400 KiB |
| `/share/ticket/` | 2.6 KiB | 0.0 KiB | 75 KiB / 400 KiB |
| `/share/setlist/` | 1.6 KiB | 0.0 KiB | 75 KiB / 400 KiB |
| Aggregate rendered raster | — | 10.5 KiB | 1100 KiB |

## Reproducible mobile performance capture

Production preview, Chromium, `390×844`, fresh context with CDP
`Network.setCacheDisabled({ cacheDisabled: true })`, then 900 ms scene-settle
and a 500 px scroll:

```json
{
  "cls": 0,
  "longTasks": [],
  "rasterBytes": 11698,
  "javascriptBytes": 26795,
  "scrollY": 500
}
```

This is also asserted by the mobile Playwright visual gate: raster <= 700 KiB,
JavaScript <= 75 KiB, CLS < 0.1, no entry long task over 50 ms, and scrolling
moves the document.

## Verification

- `npm run verify` — lint, formatting, Astro check, 12 content-audit unit
  tests, 18 remaining unit tests, production build, budget gate, and all E2E.
- Fresh E2E rerun: `90 passed, 2 skipped` (desktop-only/mobile-only guarded
  visual checks).
- `npm run budget` — all seven route budgets and aggregate passed.
- `git diff --check` — passed.

Known pre-existing build notes remain non-failing: an empty `showRecords`
collection warning and the ESLint TypeScript deprecation hint.
