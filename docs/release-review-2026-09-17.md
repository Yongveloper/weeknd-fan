# INTO:DAWN team review — 2026-09-17

This branch contains the current design for team review. It is not a production deployment or a claim that the complete release gate passes.

## Included changes

- INTO:DAWN branding and the concert-programme layout across the seven static routes.
- The approved v8 eclipse, cloud bodies and foreground mist. Clouds start revealing one second after page load and fade in linearly over three seconds. Directional illumination still follows the eclipse; the reading areas have independent clouds. Lower cover cloud density is reduced by 10% with a feathered boundary.
- Fine monochrome background grain. AFTER HOURS and outline TIL DAWN at 80% of their previous size, with the visible line gap, sharp outline, constant peak glow and mist reflection retained.
- Home grain opacity is 0.21735 (0.18 × 1.15 × 1.05). AFTER HOURS has a separate 11.5% monochrome ink-grain modulation (10% × 1.15), independent of its existing blur reveal.
- Matching ticket/poster artwork and browser-local JPEG export.
- Responsive layout, navigation and enlarged-text fixes made during the design review.

The approved visual source is documented in `DESIGN.md` and `docs/share-art-direction.md`. Runtime assets and fonts are included; no credentials, build output, local backups or generated working previews are included.

## Initial design checks at f78b52a

- `npm ci --ignore-scripts --no-audit --no-fund`: passed.
- Lint, full formatting check and Astro type check: passed. One existing TypeScript deprecation hint remains in the ESLint configuration.
- Unit tests excluding the separate content audit: 18 files, 59 tests passed. The browser-backed tests were rerun outside the OS sandbox after Chromium launch was denied there.
- Production build with the test site origin: seven static routes generated.
- Asset budget: JavaScript 23.3 KiB gzip / 75 KiB, raster 914.3 KiB / 1300 KiB.
- Targeted headless desktop/mobile browser suite against this checkout's separate preview: 100 passed, two intentional skips. It covers cloud reveal, title timing/glow, home flow, navigation, ticket/poster exports and share fallbacks. This is not a rerun of the entire browser suite.
- `git diff --check`: passed. No known credential patterns or files larger than 25 MB were found among the changed/new project files.

## Cloud and grain follow-up checks

- Lint, targeted formatting, Astro type check, production build, and asset budgets passed. JavaScript is now 26.0 KiB gzip / 75 KiB; raster remains 914.3 KiB / 1300 KiB.
- Six headless desktop/mobile cloud and title tests passed. The cloud regression test checks rendered brightness at quarter, half, and three-quarter reveal, plus the one-second delay and four-second completion independently of video light changes.
- Desktop/mobile captures confirmed the live page-clock reveal, unchanged title geometry and effects, no horizontal overflow, and no browser page errors. Reduced-motion/static cover clouds retain a matching lower-density mask.
- This follow-up does not clear the separate release gates below.

## Release gates still open

`npm run verify` stops at the content audit: 27 tests pass and one fails. Eight practical guides and their related sources exceed the seven-day verification window, producing 16 `volatile-content-stale` / `volatile-sources-stale` findings:

- `10-transport`
- `30-tips-standing`
- `31-tips-seating`
- `32-tips-entry`
- `33-tips-return`
- `34-tips-packing`
- `40-return`
- `50-packing`

No verification or SMS receipt dates were fabricated or moved forward. Follow `docs/content-update-runbook.md` and recheck the actual sources before production release. A build using `https://fan-guide.test` is for validation only; use the real production origin when deploying.

The earlier complete browser suite also left three mobile checks unresolved: the setlist keyboard route matrix timed out, a Goyang guide focus target was covered by sticky navigation, and a home-page long task exceeded 50 ms. Targeted passes do not clear those separate full-release findings. The CI gate and performance thresholds have not been disabled or relaxed.
