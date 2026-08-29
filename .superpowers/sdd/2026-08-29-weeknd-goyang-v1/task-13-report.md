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
  "rasterBytes": 58562,
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

## Fix round 1 — complete built-asset inventory

The original aggregate gate counted only page-selected assets, which omitted
the emitted PNG fallbacks and the unreferenced default OG image. A fresh full
`walk(dist)` inventory measured `15,033,080` raster bytes before this fix.

- The aggregate gate now scans every built `.js` (gzip size) and every
  `.avif`, `.webp`, `.png`, `.jpg`, and `.jpeg` file, including
  `dist/og/default.jpg` whether or not an HTML page references it.
- The page gate resolves the `390px × DPR 3` AVIF candidate from `srcset` and
  `sizes`, and rejects missing, remote, malformed, or unparseable image
  references instead of discarding them.
- Hero visual assets now use six explicit, small `public/visual` AVIF/WebP
  derivatives. This prevents Astro from emitting large PNG fallback families
  while retaining the responsive semantic `<picture>` AVIF/WebP contract.
- Regression tests use isolated temporary build fixtures: an unreferenced
  raster exceeding 1100 KiB fails the aggregate gate, and a missing `<img>`
  candidate fails the page gate.

Fresh production build values: aggregate JavaScript gzip `28.3 KiB`, aggregate
raster `128.8 KiB`; home initial JavaScript gzip `2.3 KiB` and selected mobile
raster `56.3 KiB`. All non-home routes have zero raster bytes and at most
`2.6 KiB` initial JavaScript gzip.

## Fix round 2 — responsive visual density

The first bounded assets used one 720px moon and 480px fog candidate, which
upscaled on Pixel 7. The scene now ships AVIF and WebP ladders generated from
the approved originals: moon `320–1254w`; each fog layer `480–1536w`. Mobile
fog `sizes` accounts for `object-fit: cover` (`150vw`), so the Pixel 7 DPR
selects the native-capped 1536px fog while the moon selects 960px AVIF. The
Pixel-only E2E gate asserts those exact `currentSrc` filenames.

The full-dist budgets remain green: aggregate raster `739.0 KiB`; home selected
mobile raster `144.1 KiB`.

### Final verification (Node 22.14.0)

`npm run verify`, `npm run budget`, and `git diff --check` passed on the final
head. The production Pixel 7 Playwright check passed and observed
`moon-960.avif`, `fog-night-1536.avif`, and `fog-dawn-1536.avif` as the active
`currentSrc` candidates.
