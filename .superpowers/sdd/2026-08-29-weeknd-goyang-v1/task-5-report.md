# Task 5 — Pamphlet Home and Progressive Entry Points

## Result

Implemented Task 5 only. The retained Eclipse Count hero now flows into four
lightweight editorial sections: a discovery introduction, predicted-setlist
preview, Goyang guide shortcuts, and a fan note. Reusable status and source
components use the existing typed content contracts.

## TDD evidence

All commands used Node `v22.14.0` via
`PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH`.

- **RED:** `npm run build && npm run test:e2e -- navigation.spec.ts` failed
  exactly because the four new headings and `전체 예상 셋리스트` disclosure
  were absent (`4 failed`, `6 passed`).
- **GREEN:** after composition, the same command passed `10/10` across the
  configured desktop and mobile projects.

## Implementation

- `src/components/content/StatusBadge.astro` — typed status-to-label mapping
  through `STATUS_LABELS`.
- `src/components/content/SourceList.astro` — resolved-source links with
  `target="_blank"`, `rel="noreferrer"`, and Korean `YYYY.MM.DD` dates.
- `src/components/home/{IntroSummary,SetlistPreview,GuideShortcuts,FanNote}.astro`
  — the four ordered, responsive pamphlet sections.
- `src/pages/index.astro` — loads `getConcert()` and `getExpectedSetlist()`
  once, retains `HomeHero`, and composes only the four Task 5 blocks.
- `tests/e2e/navigation.spec.ts` — home facts/section and closed-native-details
  regression coverage.

`SetlistPreview` always renders native closed `<details
aria-label="전체 예상 셋리스트">`, with summary `전체 목록 펼쳐보기` and the typed
`예상 · 보장 아님` badge. When entries are present, it exposes the first six
before disclosure and the remainder inside it.

## Visual checkpoint

Captured and inspected `/tmp/goyang-task5-desktop.png` and
`/tmp/goyang-task5-mobile.png`.

- **Desktop:** date and venue remain legible in the hero, followed by the four
  intended sections in the approved editorial sequence. No repeated dashboard
  card grid appeared; the disclosure remained closed.
- **Mobile:** the hero, headings, guide anchors, and fan note stack without
  clipping; shortcuts and disclosure summary keep 44px minimum targets; the
  closed disclosure reveals no hidden content.

## Verification

- `npm run verify` → passed: lint, format, Astro check, `10` unit tests,
  build, and `17` desktop/mobile E2E tests (`1` desktop-inapplicable mobile
  test skipped).
- `git diff --check` → passed.

Astro continues to report the established empty/deferred collection notices
for `discover`, `guides`, `setlist`, and `archive`; Astro check also emits the
pre-existing ESLint deprecation hint. Neither is introduced by Task 5.

## Deferred acceptance

Task 7 exclusively owns `src/data/setlist/` and its canonical 38-record
dataset; that directory is intentionally absent at Task 5 time. To avoid
inventing or duplicating songs, this task delivers a typed, data-driven
preview and an honest staged empty state. Task 7 must populate the dataset
and confirm six real titles are visible before the disclosure while the full
list remains populated inside it.

## Commit

`feat(home): compose fan pamphlet entry page`
