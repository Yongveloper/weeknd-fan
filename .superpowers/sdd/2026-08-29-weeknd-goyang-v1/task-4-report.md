# Task 4 — Eclipse Count and Moon Entrance Choreography

## Result

Implemented the Task 4 home hero only. The server renders a semantic Eclipse
Count state immediately, then browser enhancement updates visual time while
keeping screen-reader announcements stable. The retained original moon and
fog sources are consumed through Astro image derivatives at or below their
native dimensions.

## TDD evidence

All commands used Node `v22.14.0` via
`PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH`.

- **RED:** `npm test -- countdown.test.ts` failed because
  `../../src/lib/countdown` did not exist.
- **GREEN:** after the state machine implementation, the same focused command
  passed `5/5` tests: day one, day-two switch, Seoul D-DAY, live day two, and
  editor-gated archive.
- **Visual regression:** `npm run build && npm run test:e2e -- visual.spec.ts`
  passed `4/4` across the configured desktop and mobile projects, including
  reduced motion.

## Implementation

- `src/lib/countdown.ts` — Seoul calendar-day state machine with day-one,
  day-two, live, and editor-published archive phases.
- `src/components/visual/EclipseCountdown.astro` — semantic initial markup,
  visual-only digit updates, dynamic Motion import, one-shot entrance,
  eclipse-mask transition, reduced-motion branch, and disconnected cleanup.
- `src/components/home/HomeHero.astro` — retained moon entrance plus local
  moon/night-fog/dawn-fog Astro image derivatives and responsive hero layout.
- `src/pages/index.astro` — loads the existing concert record and composes the
  Task 4 hero.
- `src/styles/motion.css` — scoped scene `will-change` hint.
- `tests/unit/countdown.test.ts`, `tests/e2e/visual.spec.ts` — required pure
  state and rendered/reduced-motion coverage.

## Visual checkpoint

Captured and inspected local Playwright screenshots after a 900ms resting
state at `/tmp/weeknd-goyang-task4/{desktop-resting,mobile-resting,reduced-desktop}.png`.

- **Desktop:** the moon rests on the right side of the hero, with `D-39`
  overlaid inside the disc; fog creates a red/blue lower horizon and no
  split-flap/dashboard panel is present.
- **Mobile:** the header remains horizontally scrollable, while the text,
  moon, and countdown stack without clipping the countdown itself.
- **Reduced motion:** browser inspection returned
  `data-motion-state=reduced`; the static moon/countdown remains visible and
  the Motion import/entrance path is skipped.

During inspection, the first desktop version exposed the counter as a second
clipped disc. It was corrected so the counter overlays the original moon,
then the focused visual suite and final screenshots were rerun.

## Verification

- `npm test -- countdown.test.ts` → `5 passed`
- `npm run verify` → lint, format, Astro check, `8` unit tests, build, and
  `10` desktop/mobile E2E tests passed.
- `git diff --check` → passed.

Astro still reports the existing deferred-content collection notices
(`discover`, `guides`, `setlist`, `archive`) and one pre-existing ESLint
deprecation hint; neither is introduced by Task 4.

## Commit

`feat(home): add Eclipse Count moon scene`

## Fix round 1

Reviewer findings were fixed in a separate follow-up commit.

### TDD evidence

- **RED:** the two new early-publication countdown cases failed because
  `archivePublished: true` returned `archive` before either show threshold.
- **GREEN:** archive now requires both editor publication and the second-show
  threshold. `npm test -- countdown.test.ts` passed `7/7`.
- **Visual/image regressions:** `npm run build && npm run test:e2e --
  visual.spec.ts` passed `7`, skipped the desktop-inapplicable mobile bounds
  assertion, and produced AVIF plus WebP `<picture>` sources for all three
  scene images.

### Fixes

- Archive publication cannot override the pending day-one or day-two
  countdown.
- The mobile countdown group now reserves a positive in-hero bottom offset;
  decorative moon art remains independently cropped while the 24-hour clock
  stays inside the hero and viewport.
- Moon and both fog layers use Astro `Picture` with `['avif', 'webp']`, while
  retaining the native source-size caps and Night Black composition.

### Visual recheck

At a controlled `2026-10-07T19:40:00+09:00` mobile clock, inspected
`/tmp/weeknd-goyang-task4/mobile-near-term.png`. The visible clock bbox was
`y=719.875–757`, inside the hero bbox `y=105–777` and the Pixel 7 viewport
height `839`; `00 : 05 : 00` is fully readable.

### Final verification

- `npm run verify` → passed: lint, format, Astro check, `10` unit tests,
  build, and `13` desktop/mobile E2E tests (`1` desktop-inapplicable mobile
  bounds test skipped).
- `git diff --check` → passed.
