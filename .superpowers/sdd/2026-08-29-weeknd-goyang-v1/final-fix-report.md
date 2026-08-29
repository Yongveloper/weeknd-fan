# Final fix report — broad integration review

## Scope and TDD evidence

Node `v22.14.0` was used throughout. Focused RED ran before implementation:

```text
npm test -- content-audit.test.ts countdown.test.ts
5 failed, 20 passed
```

The failures covered partial archive validation, exact expected-setlist shape,
source freshness/laundering, and selected-show ticket labels. The focused GREEN
run after implementation passed `27` tests across content audit, countdown,
and setlist editorial metadata. Browser regressions then passed for desktop and
mobile, including reduced-motion synchronization, day-one target crossing, and
interval cleanup.

## Findings resolved

1. `src/lib/content/audit.ts` validates every supplied archive record before
   publication, only permits Oct. 7/8 records, and preserves the two-date
   publication gate. `SetlistExplorer.astro` renders each record's typed
   `status`. Regression coverage is in `content-audit.test.ts`.
2. `EclipseCountdown.astro` always polls, synchronizes immediately on connect,
   only changes accessible copy when its meaningful label changes, and clears
   its interval when disconnected. `visual.spec.ts` covers stale server markup,
   reduced-motion day-one crossing, and cleanup.
3. Home `FanNote` links to ticket sharing; `SetlistPreview` and the setlist
   explorer link to the poster. `navigation.spec.ts` proves both routes are
   reached through visible product UI; the five-item header and four home
   blocks remain untouched.
4. `getSetlistEditorialMetadata()` derives update version and unique observed
   source count from setlist records. Home, setlist, and the poster route use
   it. `setlist-editorial-metadata.test.ts` proves a setlist-only refresh
   advances both values.
5. The current-data audit enforces exactly 38 records with unique integer
   expected orders `1..38`; gap/out-of-range and count checks have deterministic
   `setlist-expected-orders-invalid` output.
6. `getSelectedShowLabel()` calculates from the chosen show only and returns
   stable `SHOW DAY` at/after that show's start. Unit boundaries cover both
   dates.
7. Both share builders always show the default OG link and text-copy fallback;
   failure UI retains those alternatives. Share E2E covers `toBlob(null)` for
   ticket and setlist cards without adding storage or API calls.
8. `40-starboy.md` now distinguishes label marketing's full-length convention
   from this guide's six-studio-album taxonomy, correctly placing *Starboy*
   third after *Kiss Land* and *Beauty Behind the Madness*.
9. The current-data adapter now retains source IDs and checks dates. Volatile
   practical content rejects stale referenced sources and sources older than
   the content claim, preventing timestamp laundering.
10. `playwright.config.ts` sets `workers: 1`; the strict cache-disabled
    long-task, byte, CLS, and scroll performance gate remains active. Budget
    was run twice with identical output.

## Visual inspection

Inspected fresh production-preview screenshots on desktop and Pixel 7:

- Home preserves the DAWNFOLD CTA hierarchy and mobile countdown placement.
- The ticket fallback is visible and readable on mobile beneath the private
  export controls.
- Reduced-motion countdown browser tests verify no Motion chunk, live polling,
  and readable D-DAY/D-1 state transitions.

## Verification

```text
PUBLIC_SITE_URL=https://fan-guide.test npm run verify
  lint + prettier + Astro check + audit (17) + remaining unit tests (29)
  + build + budget + full Playwright suite (102 tests, workers: 1)

npm run budget
npm run budget
  aggregate 28.6 KiB gzip JS / 739.0 KiB raster;
  home 2.3 KiB / 144.1 KiB; all configured gates pass twice

npx wrangler deploy --dry-run
  Read 189 static assets; no bindings; dry-run exited without publishing

git diff --check
  pass
```

Known non-failing build note: the intentionally empty `showRecords` collection
is reported during static generation. The pre-existing corrected Task 13 report
was preserved and excluded from this fix wave.
