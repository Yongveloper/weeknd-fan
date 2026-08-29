# Task 8 Report — Setlist Explorer and Post-show Comparison

## Delivered behavior

- Added `/setlist/` with a 38-song, strictly ordered, native `<details>` explorer. Every disclosure is closed initially and its accessible summary name is `NN Song Title`.
- Each expanded prediction shows album, confidence, `예상 · 보장 아님`, one-sentence context, stage note, sing-along point, and three checked setlist sources. The page and home preview both state `최근 2026년 공연 3회 비교`.
- The home preview remains six visible titles plus 32 titles in its closed disclosure.
- The page renders post-show records above the prediction when they exist. It uses `1일차 공연 후 확인` for a partial day-one archive and only changes the page title/heading to `WE WERE HERE` after `archivePublished` is true.
- Added `OfficialEmbed.astro`: direct official link first, user-triggered lazy iframe only, HTTPS YouTube/YouTube-nocookie/Spotify allowlist, descriptive title, 8-second/error cleanup, and retained link fallback. Current records have no verified official URL, so production renders no media controls or invented URLs.

## RED/GREEN

- RED: with the new `/setlist/` behavior tests and no route, `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm run build && npm run test:e2e -- navigation.spec.ts` failed in both browser projects because the `예상 셋리스트` heading was absent.
- GREEN: after implementation, focused route/context, keyboard/order, and JavaScript-disabled tests passed in desktop and mobile: `6 passed`.

## Visual checks

- Inspected desktop (1440px) and mobile (393px) in collapsed and first-expanded states.
- Verified vertical mobile reading order, 44px disclosure controls, expected-status visibility, source readability, and no dashboard-card treatment.

## Verification

- Node: `v22.14.0`.
- `npx astro sync` → completed.
- `npm run verify` → passed: lint, formatting, Astro check, 11 unit tests, build, and 31 E2E tests; 1 desktop-only mobile test skipped by design.
- `git diff --check` → passed.

## Concerns

- Existing repository content warnings remain: missing `src/data/guides/` and empty `src/data/archive/`; the new archive UI intentionally handles the latter. Astro check also retains the pre-existing ESLint config deprecation hint.
