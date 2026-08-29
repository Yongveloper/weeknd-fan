# Task 10 report — Sources, Updates, and Publication Audit

## Scope

- Added the Task 10 provenance page, deterministic publication audit, audit script, update runbook, and focused browser coverage.
- Did not add post-show records, mark any future checkpoint complete, or implement Task 11+.

## Audit contract

- `practical` content is audited as its own trust status: volatile practical guidance becomes stale after more than seven days.
- Every non-`unpublished` entry needs a source; concert core facts need two primary sources.
- The setlist remains `expected`, and every record needs three observations.
- `archivePublished` requires both actual Goyang dates with `post-show` status, a non-empty ordered song list, and at least two sources.
- `npm run audit:content` executes deterministic failure cases plus the current concert, setlist, discover, and guide data rather than an empty fixture.

## Page and runbook checks

- `/sources/` has exactly the public groups `공식`, `공공 교통`, `공연 기록`, and `보조 참고`; rendered records link outward and show their last-check dates.
- NamuWiki is reference-only under `보조 참고` as `누락 탐색용·핵심 사실 근거 아님`; no local source-file path is rendered.
- The page keeps planned Tokyo, Jakarta, Singapore, Goyang official-check, day-one, and day-two checkpoints as future work.
- `docs/content-update-runbook.md` specifies source-first updates, unknown-state retention, Asia snapshot comparison, audit/build gates, the four required refresh messages, and the two-file post-show archive gate.

## TDD

- RED: `npm test -- content-audit.test.ts` failed with `TypeError: auditPublishedContent is not a function` for all three new audit cases.
- GREEN: `npm run audit:content` passed 8 tests, including stale-practical, source, concert, setlist, archive, representative, and current-data coverage.
- Browser coverage was written before the route and passed in both desktop and Pixel 7 projects after the page was added.

## Visual checks

- Inspected full-page `/sources/` screenshots in Desktop Chrome and Pixel 7.
- The information remains text-first and scan-friendly, external links retain visible focus behavior, and the mobile grouping collapses to one readable column without dashboard cards.

## Verification

- Node `v22.14.0`
- `npm run verify` — passed: lint, formatting, Astro check, audit (8 tests), unit tests (17), build, E2E (39 passed, 1 mobile-only duplicate skipped).
- `git diff --check` — clean.

## Concerns

- Astro reports the existing empty `showRecords` collection during check/build. This is expected before either real post-show archive file exists; `archivePublished` remains false.
- Astro check retains the pre-existing ESLint config deprecation hint; it reports no diagnostics errors or warnings.
