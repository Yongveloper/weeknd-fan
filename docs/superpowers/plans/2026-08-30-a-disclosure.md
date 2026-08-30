# Workstream A — Disclosure Component & Setlist Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every bare `<details>` in the site with one shared `Disclosure` component that animates open/close, shows a chevron anchor, swaps its label, and restructure the expanded setlist song detail into scannable blocks.

**Architecture:** `Disclosure.astro` wraps a native `<details>` (progressive enhancement — no JS means native toggle). `disclosure.ts` is one delegated click handler that animates `.disclosure__panel` height with WAAPI (`Element.animate`) because Safari lacks `interpolate-size`. Call sites pass a `label`/`openLabel` pair or a `summary` slot; setlist passes an aria-hidden album tag through the `meta` slot.

**Tech Stack:** Astro 6 components, TypeScript client script (`<script src>` bundled by Astro), CSS custom properties from `src/styles/tokens.css`, Playwright e2e, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-30-uiux-motion-guide-design.md` — §4 and §9 (items 5, 6, 8).

## Global Constraints

- Node: run every command with `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH`.
- You work in worktree `/Users/yong/dev/weeknd-fan-a` on branch `ws/a-disclosure`. Dev server port **4331** (`npm run dev -- --port 4331`). E2E via `npx playwright test -c .superpowers/tmp/playwright.4341.config.ts` (preview on 4341, already created).
- **Owned files only** (spec §3.4 + §9.6): `src/components/ui/Disclosure.astro`, `src/scripts/disclosure.ts`, `src/components/setlist/SetlistExplorer.astro`, `src/components/home/SetlistPreview.astro`, `src/pages/discover.astro`, `src/components/discover/CareerTimeline.astro`, `tests/e2e/disclosure.spec.ts`. Do NOT edit `tests/e2e/navigation.spec.ts`, `tests/e2e/no-js.spec.ts`, `tests/e2e/accessibility.spec.ts` — your markup must keep them green. If you need another file, stop and report.
- Existing tests that constrain you (must stay green without edits):
  - `navigation.spec.ts`: `.expected-setlist summary` first has accessible name exactly `01 Baptized in Fear`; `.expected-setlist details` count 38; headings `공연 전에 알면 좋은 한 문장`, `무대에서 볼 것`, `떼창 포인트`, `출처` visible after opening; keyboard Space/Enter on summary opens.
  - `no-js.spec.ts`: `getByRole('group', { name: '1분 입문 더 깊이 보기' })` has `open` and contains text `1분 입문 펼쳐보기`; `.expected-setlist details` visible without JS.
  - `accessibility.spec.ts`: axe no serious/critical on `/`, `/discover/`, `/setlist/`.
- Motion tokens available: `--motion-fast: 180ms`, `--motion-scene: 620ms`, `--ease-cinematic`, `--ease-out-expo`. Colors: `--amber`, `--ivory`, `--mist`, `--night`, `--ink-muted`.
- Reduced motion: when `(prefers-reduced-motion: reduce)` matches, the script must not intercept — native instant toggle.
- Budget: `npm run build && npm run budget` must pass (js ≤ 75KiB gz; you should add ≤ 1.5KiB).
- Add `data-enter`/`data-enter-group` attributes only where this plan says; do not write CSS/JS for them (workstream C owns that).
- Commit after each task with the message given. Do not push.

---

### Task 1: `Disclosure` component + animation script, wired into `/discover/`

**Files:**
- Create: `src/components/ui/Disclosure.astro`
- Create: `src/scripts/disclosure.ts`
- Modify: `src/pages/discover.astro` (three `<details>` blocks at lines ~46–52, ~91–97, ~104–110; styles at ~141–158)
- Test: `tests/e2e/disclosure.spec.ts`

**Interfaces:**
- Produces `Disclosure` props: `label?: string; openLabel?: string (default '접기'); ariaLabel?: string; id?: string; open?: boolean; class?: string`. Slots: default (panel body), `summary` (replaces label span entirely), `meta` (inline after label, before chevron).
- Produces DOM contract used by tests and later tasks: `details[data-disclosure]` → `summary > .disclosure__label[data-label-closed][data-label-open]` (when no summary slot) + `.disclosure__chevron` (svg, `aria-hidden="true"`) → `.disclosure__panel`. Script sets `details[data-state="open"|"closed"]` when an animation finishes.

- [ ] **Step 1: Write the failing e2e test**

```ts
// tests/e2e/disclosure.spec.ts
import { expect, test } from '@playwright/test';

const intro = (page: import('@playwright/test').Page) =>
  page.getByRole('group', { name: '1분 입문 더 깊이 보기' });

test('renders a chevron anchor and swaps the label when toggled', async ({
  page,
}) => {
  await page.goto('/discover/');
  const details = intro(page);
  await expect(details).toHaveAttribute('open', '');
  await expect(details.locator('summary .disclosure__chevron')).toHaveCount(1);
  await expect(details.locator('summary .disclosure__label')).toHaveText('접기');

  await details.locator('summary').click();
  await expect(details).toHaveAttribute('data-state', 'closed');
  await expect(details).not.toHaveAttribute('open', '');
  await expect(details.locator('summary .disclosure__label')).toHaveText(
    '1분 입문 펼쳐보기',
  );

  await details.locator('summary').click();
  await expect(details).toHaveAttribute('data-state', 'open');
  await expect(details).toHaveAttribute('open', '');
  await expect(details.locator('summary .disclosure__label')).toHaveText('접기');
});

test('leaves no inline height on the panel after the animation ends', async ({
  page,
}) => {
  await page.goto('/discover/');
  const glossary = page.getByRole('group', { name: '용어 한 장 더 깊이 보기' });
  await glossary.locator('summary').click();
  await expect(glossary).toHaveAttribute('data-state', 'open');
  await expect(glossary.locator('.disclosure__panel')).not.toHaveAttribute(
    'style',
    /height/,
  );
  await expect(glossary.locator('.disclosure__panel')).toBeVisible();
});

test('toggles instantly and natively under reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/discover/');
  const glossary = page.getByRole('group', { name: '용어 한 장 더 깊이 보기' });
  await glossary.locator('summary').click();
  await expect(glossary).toHaveAttribute('open', '');
  await expect(glossary).not.toHaveAttribute('data-state', /.+/);
});

test('opens from the keyboard', async ({ page }) => {
  await page.goto('/discover/');
  const glossary = page.getByRole('group', { name: '용어 한 장 더 깊이 보기' });
  await glossary.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(glossary).toHaveAttribute('open', '');
  await expect(glossary).toHaveAttribute('data-state', 'open');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run build && npx playwright test -c .superpowers/tmp/playwright.4341.config.ts tests/e2e/disclosure.spec.ts --project=desktop-chromium`
Expected: FAIL — `.disclosure__chevron` count 0 / `data-state` missing.

- [ ] **Step 3: Create the component**

```astro
---
// src/components/ui/Disclosure.astro
interface Props {
  label?: string;
  openLabel?: string;
  ariaLabel?: string;
  id?: string;
  open?: boolean;
  class?: string;
}

const {
  label,
  openLabel = '접기',
  ariaLabel,
  id,
  open = false,
  class: className,
} = Astro.props;
const hasSummarySlot = Astro.slots.has('summary');
---

<details
  class:list={['disclosure', className]}
  data-disclosure
  id={id}
  open={open || undefined}
  aria-label={ariaLabel}
>
  <summary>
    {
      hasSummarySlot ? (
        <slot name="summary" />
      ) : (
        <span
          class="disclosure__label"
          data-label-closed={label}
          data-label-open={openLabel}
        >
          {open ? openLabel : label}
        </span>
      )
    }
    <slot name="meta" />
    <svg
      class="disclosure__chevron"
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="16"
      height="16"
    >
      <path
        d="M3 6l5 5 5-5"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"></path>
    </svg>
  </summary>
  <div class="disclosure__panel"><slot /></div>
</details>

<script src="../../scripts/disclosure.ts"></script>

<style>
  .disclosure {
    border-top: 1px solid color-mix(in srgb, var(--ivory) 28%, transparent);
    border-bottom: 1px solid color-mix(in srgb, var(--ivory) 28%, transparent);
  }
  summary {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 44px;
    padding: 0.9rem 0.2rem;
    color: var(--ivory);
    cursor: pointer;
    font-weight: 800;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  .disclosure__chevron {
    flex: 0 0 auto;
    margin-inline-start: auto;
    color: var(--amber);
    transition: transform var(--motion-fast) var(--ease-cinematic);
  }
  .disclosure[open] > summary .disclosure__chevron {
    transform: rotate(180deg);
  }
  .disclosure__panel {
    padding-block: 0.2rem 1.5rem;
  }
</style>
```

- [ ] **Step 4: Create the script**

```ts
// src/scripts/disclosure.ts
export {};

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const running = new WeakMap<HTMLDetailsElement, Animation>();

function readToken(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

function setLabel(details: HTMLDetailsElement, open: boolean) {
  const label = details.querySelector<HTMLElement>(
    ':scope > summary .disclosure__label',
  );
  if (!label) return;
  const next = open ? label.dataset.labelOpen : label.dataset.labelClosed;
  if (next) label.textContent = next;
}

function finish(
  details: HTMLDetailsElement,
  panel: HTMLElement,
  willOpen: boolean,
) {
  running.delete(details);
  panel.style.removeProperty('height');
  panel.style.removeProperty('overflow');
  if (panel.getAttribute('style') === '') panel.removeAttribute('style');
  if (!willOpen) details.open = false;
  delete details.dataset.closing;
  details.dataset.state = willOpen ? 'open' : 'closed';
}

function animatePanel(
  details: HTMLDetailsElement,
  panel: HTMLElement,
  from: number,
  to: number,
  willOpen: boolean,
) {
  const fromOpacity = Number(getComputedStyle(panel).opacity) || 0;
  panel.style.overflow = 'hidden';
  panel.style.height = `${from}px`;
  const animation = panel.animate(
    [
      { height: `${from}px`, opacity: willOpen ? fromOpacity : 1 },
      { height: `${to}px`, opacity: willOpen ? 1 : 0 },
    ],
    {
      duration: parseFloat(readToken('--motion-scene', '620ms')),
      easing: readToken('--ease-cinematic', 'ease-out'),
    },
  );
  running.set(details, animation);
  animation.onfinish = () => finish(details, panel, willOpen);
  animation.oncancel = () => running.delete(details);
}

document.addEventListener('click', (event) => {
  if (reduceMotion.matches) return;
  const summary = (event.target as Element | null)?.closest('summary');
  const details = summary?.parentElement;
  if (
    !(details instanceof HTMLDetailsElement) ||
    !details.hasAttribute('data-disclosure') ||
    summary?.parentElement !== details
  )
    return;
  const panel = details.querySelector<HTMLElement>(
    ':scope > .disclosure__panel',
  );
  if (!panel) return;

  event.preventDefault();
  const currentHeight = panel.getBoundingClientRect().height;
  running.get(details)?.cancel();

  if (details.open && details.dataset.closing !== 'true') {
    details.dataset.closing = 'true';
    setLabel(details, false);
    animatePanel(details, panel, currentHeight, 0, false);
    return;
  }

  delete details.dataset.closing;
  details.open = true;
  setLabel(details, true);
  panel.style.height = 'auto';
  const target = panel.scrollHeight;
  animatePanel(details, panel, currentHeight, target, true);
});
```

Notes for the implementer: Enter/Space on a focused `<summary>` fires a synthetic `click`, so keyboard is covered by the same handler. `details.open = false` is deferred to the end of the close animation so the panel stays in flow while shrinking.

- [ ] **Step 5: Wire `/discover/`**

In `src/pages/discover.astro` add the import next to the other component imports:

```astro
import Disclosure from '../components/ui/Disclosure.astro';
```

Replace the three `<details>` blocks:

```astro
<Disclosure
  ariaLabel="1분 입문 더 깊이 보기"
  label="1분 입문 펼쳐보기"
  open
  class="discover__disclosure"
>
  <IntroContent />
  <SourceList sources={introSources} />
</Disclosure>
```

```astro
<Disclosure
  ariaLabel="용어 한 장 더 깊이 보기"
  label="더 깊이 보기"
  class="discover__disclosure"
>
  <GlossaryContent />
  <SourceList sources={glossarySources} />
</Disclosure>
```

```astro
<Disclosure
  ariaLabel="보는 음악 더 깊이 보기"
  label="더 깊이 보기"
  class="discover__disclosure"
>
  <VisualContent />
  <SourceList sources={visualSources} />
</Disclosure>
```

Replace the page's `details { … }`, `summary { … }`, `details > div { … }` rules with:

```css
.discover__disclosure {
  max-width: 42rem;
  color: var(--mist);
}
```

(The old `summary` rule made the label amber + underlined; the shared component now uses ivory label + amber chevron everywhere.)

- [ ] **Step 6: Run tests**

Run: `npm run build && npx playwright test -c .superpowers/tmp/playwright.4341.config.ts tests/e2e/disclosure.spec.ts tests/e2e/no-js.spec.ts tests/e2e/accessibility.spec.ts`
Expected: all PASS (both projects).

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/Disclosure.astro src/scripts/disclosure.ts src/pages/discover.astro tests/e2e/disclosure.spec.ts
git commit -m "feat(ui): add animated Disclosure component and adopt it on discover"
```

---

### Task 2: Adopt `Disclosure` in `CareerTimeline` and `SetlistPreview`

**Files:**
- Modify: `src/components/discover/CareerTimeline.astro` (details at ~51–57; `details`/`summary` style rules at ~103–115 and ~137)
- Modify: `src/components/home/SetlistPreview.astro` (details at ~46–58; style rules `details`, `summary, .setlist-preview__link`, `summary`, `details .setlist-preview__list, details p`, `.setlist-preview__empty, details p`)
- Test: `tests/e2e/disclosure.spec.ts` (append)

**Interfaces:**
- Consumes `Disclosure` from Task 1.

- [ ] **Step 1: Append failing tests**

```ts
test('animates the timeline and home setlist disclosures too', async ({
  page,
}) => {
  await page.goto('/discover/');
  const timeline = page.locator('.timeline details').first();
  await expect(timeline.locator('.disclosure__chevron')).toHaveCount(1);
  await timeline.locator('summary').click();
  await expect(timeline).toHaveAttribute('data-state', 'open');
  await expect(timeline.locator('summary .disclosure__label')).toHaveText(
    '접기',
  );

  await page.goto('/');
  const preview = page.getByRole('group', { name: '전체 예상 셋리스트' });
  await preview.scrollIntoViewIfNeeded();
  await expect(preview.locator('summary .disclosure__label')).toHaveText(
    '전체 목록 펼쳐보기',
  );
  await preview.locator('summary').click();
  await expect(preview).toHaveAttribute('data-state', 'open');
  await expect(preview.locator('ol li').first()).toBeVisible();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run build && npx playwright test -c .superpowers/tmp/playwright.4341.config.ts tests/e2e/disclosure.spec.ts --project=desktop-chromium -g "timeline"`
Expected: FAIL — chevron count 0.

- [ ] **Step 3: CareerTimeline**

Add import (path from `src/components/discover/`):

```astro
import Disclosure from '../ui/Disclosure.astro';
```

Replace the details block:

```astro
<Disclosure
  ariaLabel={`${entry.data.title} 더 깊이 보기`}
  label="더 깊이 보기"
  class="timeline__disclosure"
>
  <div class="timeline__detail">
    <Content />
    <SourceList sources={entrySources} />
  </div>
</Disclosure>
```

Remove the component's own `details { … }` and `summary { … }` rules (both occurrences). Keep `.timeline__detail` rules. If a removed rule set a `grid-column` or `max-width` on `details`, move that declaration onto `.timeline__disclosure`.

- [ ] **Step 4: SetlistPreview**

Add import:

```astro
import Disclosure from '../ui/Disclosure.astro';
```

Replace the details block:

```astro
<Disclosure
  ariaLabel="전체 예상 셋리스트"
  label="전체 목록 펼쳐보기"
  class="setlist-preview__more"
>
  {
    remainingEntries.length > 0 ? (
      <ol class="setlist-preview__list" start={previewEntries.length + 1}>
        {remainingEntries.map((entry) => (
          <li>{entry.data.songTitle}</li>
        ))}
      </ol>
    ) : (
      <p>전체 예상 셋리스트는 최신 공연 기록을 확인한 뒤 공개합니다.</p>
    )
  }
</Disclosure>
```

Style edits in the same file:
- Delete the `details { max-width: 52rem; border-top…; border-bottom…; }` rule and the `summary { cursor: pointer; }` rule.
- Change `summary, .setlist-preview__link { … }` to `.setlist-preview__link { … }` (keep its declarations).
- Change `.setlist-preview__empty, details p { … }` to `.setlist-preview__empty, .setlist-preview__more p { … }`.
- Change `details .setlist-preview__list, details p { margin-block: … }` to `.setlist-preview__more .setlist-preview__list, .setlist-preview__more p { margin-block: 0.75rem 1.25rem; }`.
- Add `.setlist-preview__more { max-width: 52rem; }`.

Astro appends the scoped class to a `class` prop passed to a child component, so these selectors keep working.

- [ ] **Step 5: Run tests**

Run: `npm run build && npx playwright test -c .superpowers/tmp/playwright.4341.config.ts tests/e2e/disclosure.spec.ts tests/e2e/navigation.spec.ts tests/e2e/no-js.spec.ts tests/e2e/visual.spec.ts`
Expected: PASS except any `navigation.spec.ts` test that hits `http://127.0.0.1:4321` literally (line ~221, pre-existing environment failure — report it, don't fix it).

- [ ] **Step 6: Commit**

```bash
git add src/components/discover/CareerTimeline.astro src/components/home/SetlistPreview.astro tests/e2e/disclosure.spec.ts
git commit -m "feat(ui): use Disclosure for career timeline and home setlist preview"
```

---

### Task 3: Adopt `Disclosure` in `SetlistExplorer` (summary slot, chevron replaces `+`)

**Files:**
- Modify: `src/components/setlist/SetlistExplorer.astro` (list markup ~87–131; styles `details, .actual-setlist article`, `summary`, `summary::-webkit-details-marker`, `summary::after`, `details[open] > summary::after`, `.expected-setlist__album-tag`, `.expected-setlist__detail`, `details[open] > .expected-setlist__detail`)
- Test: `tests/e2e/disclosure.spec.ts` (append)

**Interfaces:**
- Consumes `Disclosure` `summary` + `meta` slots.
- Keeps: `.expected-setlist details` (38 of them), `.expected-setlist summary` accessible name `NN Title`.

- [ ] **Step 1: Append failing test**

```ts
test('keeps the song summary name clean and animates the setlist explorer', async ({
  page,
}) => {
  await page.goto('/setlist/');
  const first = page.locator('.expected-setlist details').first();
  await expect(first.locator('summary')).toHaveAccessibleName(
    '01 Baptized in Fear',
  );
  await expect(first.locator('summary .disclosure__chevron')).toHaveCount(1);
  await expect(first.locator('summary')).not.toHaveAttribute(
    'data-affordance',
    /.+/,
  );
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('data-state', 'open');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run build && npx playwright test -c .superpowers/tmp/playwright.4341.config.ts tests/e2e/disclosure.spec.ts --project=desktop-chromium -g "explorer"`
Expected: FAIL — chevron count 0.

- [ ] **Step 3: Replace the per-song markup**

Add import:

```astro
import Disclosure from '../ui/Disclosure.astro';
```

Replace `<details> … </details>` inside the `entries.map` with:

```astro
<Disclosure class="expected-setlist__item">
  <span slot="summary" class="expected-setlist__song">
    {twoDigits(entry.data.expectedOrder)} {entry.data.songTitle}
  </span>
  {/* Visual density hint only — album is announced in the expanded metadata below. */}
  <span slot="meta" class="expected-setlist__album-tag" aria-hidden="true">
    {entry.data.album}
  </span>
  <div class="expected-setlist__detail">
    {/* unchanged detail body for now — Task 4 restructures it */}
    …existing children…
  </div>
</Disclosure>
```

Keep the existing `.expected-setlist__detail` children verbatim in this task.

- [ ] **Step 4: Style edits**

- `details, .actual-setlist article { border-top … }` → `.expected-setlist__item, .actual-setlist article { border-top … }`; the `li:last-child details` rule → `.expected-setlist__list li:last-child .expected-setlist__item`. Because `Disclosure` already draws top+bottom borders, add `.expected-setlist__item { border-bottom: 0; }` and keep the last-child bottom border rule.
- Delete `summary { … }`, `summary::-webkit-details-marker`, `summary::after`, `details[open] > summary::after` rules.
- Add `.expected-setlist__song { font-size: clamp(1.05rem, 2.4vw, 1.45rem); }` and `.expected-setlist__item :global(summary) { justify-content: space-between; }` is NOT needed — the chevron has `margin-inline-start: auto`. Keep `.expected-setlist__album-tag` but remove its `margin-inline-start: auto` (the tag now sits between label and chevron; give it `margin-inline-start: auto` back only if the chevron still hugs the label in the screenshot).
- `details[open] > .expected-setlist__detail { animation: detail-reveal … }` → delete (the panel animation now comes from the script). Delete `@keyframes detail-reveal`.

- [ ] **Step 5: Run tests**

Run: `npm run build && npx playwright test -c .superpowers/tmp/playwright.4341.config.ts tests/e2e/disclosure.spec.ts tests/e2e/navigation.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/no-js.spec.ts`
Expected: PASS (except the pre-existing 4321 literal-URL test).

- [ ] **Step 6: Commit**

```bash
git add src/components/setlist/SetlistExplorer.astro tests/e2e/disclosure.spec.ts
git commit -m "feat(setlist): use Disclosure chevron for expected songs"
```

---

### Task 4: Restructure the expanded song detail into scannable blocks

**Files:**
- Modify: `src/components/setlist/SetlistExplorer.astro` (`.expected-setlist__detail` children + styles `.expected-setlist__detail`, `.expected-setlist__detail h3`, `.expected-setlist__detail p`, `.expected-setlist__metadata`)
- Test: `tests/e2e/disclosure.spec.ts` (append)

**Interfaces:**
- Keeps headings `공연 전에 알면 좋은 한 문장`, `무대에서 볼 것`, `떼창 포인트`, `출처` as `<h3>` (navigation.spec).

- [ ] **Step 1: Append failing test**

```ts
test('lays out the song detail as meta header, three labelled blocks, then sources', async ({
  page,
}) => {
  await page.goto('/setlist/');
  const first = page.locator('.expected-setlist details').first();
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('data-state', 'open');

  const detail = first.locator('.expected-setlist__detail');
  await expect(detail.locator('.song-meta')).toHaveCount(1);
  await expect(detail.locator('.song-meta .status')).toHaveText('예상 · 보장 아님');
  await expect(detail.locator('.song-block .eyebrow')).toHaveText([
    'BEFORE',
    'ON STAGE',
    'SING ALONG',
  ]);
  await expect(detail.locator('.song-block h3')).toHaveText([
    '공연 전에 알면 좋은 한 문장',
    '무대에서 볼 것',
    '떼창 포인트',
  ]);
  await expect(detail.locator('.song-sources h3')).toHaveText('출처');
  await expect(detail.locator('.song-sources .source-list li').first()).toBeVisible();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run build && npx playwright test -c .superpowers/tmp/playwright.4341.config.ts tests/e2e/disclosure.spec.ts --project=desktop-chromium -g "meta header"`
Expected: FAIL — `.song-meta` count 0.

- [ ] **Step 3: Replace the detail body**

```astro
<div class="expected-setlist__detail">
  <div class="song-meta">
    {(() => {
      const album = findAlbumByTitle(albums, entry.data.album);
      return album ? <AlbumCover album={album} size={48} /> : null;
    })()}
    <span class="song-meta__album">{entry.data.album}</span>
    <span class="song-meta__pill">신뢰도 {entry.data.confidence}</span>
    <StatusBadge status={entry.data.status} />
  </div>

  <div class="song-block">
    <p class="eyebrow">BEFORE</p>
    <h3>공연 전에 알면 좋은 한 문장</h3>
    <p>{entry.data.summary}</p>
  </div>
  <div class="song-block">
    <p class="eyebrow">ON STAGE</p>
    <h3>무대에서 볼 것</h3>
    <p>{entry.data.liveNote}</p>
  </div>
  <div class="song-block">
    <p class="eyebrow">SING ALONG</p>
    <h3>떼창 포인트</h3>
    <p>{entry.data.singAlongNote}</p>
  </div>

  {entry.data.officialListenUrl && (
    <div class="song-embed">
      <OfficialEmbed
        url={entry.data.officialListenUrl}
        songTitle={entry.data.songTitle}
      />
    </div>
  )}

  <div class="song-sources">
    <h3>출처</h3>
    <SourceList
      sources={resolveSourceReferences(entry.data.observedIn, sources)}
    />
  </div>
</div>
```

- [ ] **Step 4: Styles**

Replace `.expected-setlist__detail`, `.expected-setlist__detail h3, .actual-setlist h3`, `.expected-setlist__detail p`, `.expected-setlist__metadata` with:

```css
.expected-setlist__detail {
  display: grid;
  gap: 1.25rem;
  padding: 0.2rem 0.2rem 1.5rem;
}
.actual-setlist h3 {
  margin: 0.85rem 0 0;
  color: var(--amber);
  font-size: 0.85rem;
}
.song-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 0.9rem;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid color-mix(in srgb, var(--ivory) 18%, transparent);
  color: var(--ivory);
  font-size: 0.84rem;
  font-weight: 800;
}
.song-meta__album {
  font-weight: 900;
}
.song-meta__pill {
  padding: 0.25rem 0.6rem;
  border: 1px solid color-mix(in srgb, var(--mist) 40%, transparent);
  border-radius: 999px;
  color: var(--mist);
  font-size: 0.76rem;
}
.song-block {
  display: grid;
  gap: 0.35rem;
  padding-inline-start: 0.9rem;
  border-inline-start: 2px solid var(--amber);
}
.song-block .eyebrow {
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 400;
  letter-spacing: 0.18em;
}
.song-block h3 {
  margin: 0;
  color: var(--ivory);
  font-size: 0.95rem;
  font-weight: 800;
}
.song-block p:not(.eyebrow) {
  margin: 0;
  color: var(--mist);
}
.song-embed {
  padding-inline-start: 0.9rem;
}
.song-sources {
  display: grid;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid color-mix(in srgb, var(--ivory) 18%, transparent);
}
.song-sources h3 {
  margin: 0;
  color: var(--ink-muted);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.song-sources :global(.source-list) {
  font-size: 0.78rem;
  color: color-mix(in srgb, var(--mist) 60%, transparent);
}
```

- [ ] **Step 5: Run tests + screenshot**

Run: `npm run build && npx playwright test -c .superpowers/tmp/playwright.4341.config.ts tests/e2e/disclosure.spec.ts tests/e2e/navigation.spec.ts tests/e2e/accessibility.spec.ts`
Expected: PASS (except the pre-existing 4321 literal-URL test).

Then take screenshots for review (dev server must be running on 4331):

```bash
npx playwright screenshot --viewport-size=412,915 --full-page "http://localhost:4331/setlist/" .superpowers/tmp/a-setlist-mobile.png
```

Open the first song before the screenshot by writing a tiny script if `playwright screenshot` cannot click: create `.superpowers/tmp/shot-a.mjs`:

```js
import { chromium, devices } from '@playwright/test';
const browser = await chromium.launch();
for (const [name, opts] of [
  ['mobile', devices['Pixel 7']],
  ['desktop', { viewport: { width: 1440, height: 900 } }],
]) {
  const page = await browser.newPage(opts);
  await page.goto('http://localhost:4331/setlist/');
  await page.locator('.expected-setlist summary').first().click();
  await page.waitForTimeout(900);
  await page.locator('.expected-setlist details').first().screenshot({
    path: `.superpowers/tmp/a-setlist-${name}.png`,
  });
  await page.goto('http://localhost:4331/discover/');
  await page.screenshot({ path: `.superpowers/tmp/a-discover-${name}.png`, fullPage: true });
}
await browser.close();
```

Run: `node .superpowers/tmp/shot-a.mjs` from the worktree root. Look at the PNGs. Report their paths.

- [ ] **Step 6: Commit**

```bash
git add src/components/setlist/SetlistExplorer.astro tests/e2e/disclosure.spec.ts
git commit -m "feat(setlist): restructure song detail into meta, labelled blocks, and sources"
```

---

### Task 5: Verification pass

**Files:** none new.

- [ ] **Step 1: Static checks**

Run: `npm run lint && npm run format:check && npm run check`
Expected: 0 errors. If prettier complains, run `npx prettier --write <file>` on files you own only.

- [ ] **Step 2: Unit + build + budget**

Run: `npm run test:unit && npm run build && npm run budget`
Expected: all pass; note the printed `js-gzip` figure (must be ≤ 75KiB; report the number).

- [ ] **Step 3: Full e2e on the worktree preview**

Run: `npx playwright test -c .superpowers/tmp/playwright.4341.config.ts`
Expected: everything green except `navigation.spec.ts` "keeps the ordered prediction and trust label usable without JavaScript" (hard-coded 4321 URL — pre-existing). List any other failure verbatim.

- [ ] **Step 4: Report**

Reply with: commits (hashes + subjects), test summary counts, budget numbers, screenshot paths, and any deviation from this plan.
