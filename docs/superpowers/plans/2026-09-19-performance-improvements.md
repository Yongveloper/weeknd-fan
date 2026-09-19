# Performance Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut the home page's unconditional 9.2MiB hero video download on constrained devices, make the shared LCP texture discoverable with high priority on every page, shrink the header font preload payload, and move the WebGL renderer boot out of the LCP window.

**Architecture:** Four independent tracks touch disjoint files so they can run in parallel worktrees. Track A adds a pure media policy (`src/lib/media-policy.ts`) consumed by the `moon-light` custom element plus a compact 720px encode and a media budget. Track B adds `<head>` resource hints in `BaseLayout.astro` and fixes the `fetchpriority` on `DawnSky.astro`. Track C subsets the six Noto Sans KR header slices to the chrome glyphs at build time. Track D defers the dawn renderer import until after `load`. A final integration task merges, documents, and re-measures.

**Tech Stack:** Astro 6 static, TypeScript (`strict`, `noUncheckedIndexedAccess`), vitest, Playwright (desktop-chromium 1280×720 + mobile-chromium Pixel 7 412×915), ffmpeg 8 (local, `/opt/homebrew/bin/ffmpeg`), `subset-font` (harfbuzzjs, new devDependency in Track C only).

**Spec:** `docs/performance-audit-2026-09-18.md` (sections 2.4, 2.5, 3, 4). The plan argues from that audit; executors read both.

## Global Constraints

- Node `22.14.0`. `npm run verify` must pass before every commit (`lint → format:check → check → audit:content → test:unit → build → budget → test:e2e`).
- `wrangler.jsonc` untouched. No SSR adapter, no `main`, no Functions.
- Client JS aggregate gzip budget `75 KiB`; current usage `74.0 KiB`. Tracks A and D add client code — each must keep the aggregate under budget (`npm run budget` after `npm run build`). Track A's `media-policy.ts` must stay under `0.4 KiB` gzip.
- Raster budgets unchanged: aggregate `1300 KiB`, home `700 KiB`, others `400 KiB`.
- Home long-task budget `50ms` (`tests/e2e/visual.spec.ts:85`).
- Do not re-encode or redraw user-supplied images (Interpark seat map, access map). The moon video is project-generated, so a compact encode is allowed once approved (see Approval gates).
- Design breakpoint for "compact" is the existing `42rem` (672px) used in `src/components/home/HomeHero.astro:165` and `src/components/visual/DawnSky.astro` (`min-width: 42.001rem`).
- e2e uses `baseURL`; never hardcode `http://127.0.0.1:4323`.
- Conventional Commits, lowercase English subject ≤ 72 chars, scope = directory/page name. Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Content is Korean, code and commits are English.

## Approval gates (AGENTS.md: 기존 기능 변경은 승인 후 진행)

Confirm with the user before starting the marked track. Track B needs no approval (markup hints only, no visual change).

| Track | Behavior change visible to users | Decision needed |
| --- | --- | --- |
| A | Viewports ≤ 672px play a 720×720 re-encode of the moon video instead of 1440×1440. Browsers reporting `saveData` or `effectiveType` of `slow-2g`/`2g`/`3g` show the poster with the static title (same presentation as `prefers-reduced-motion`). | Approve compact encode (CRF 27) and the poster fallback policy. |
| C | Header font files become project-built subsets committed under `src/assets/fonts/header/`. New devDependency `subset-font`. Changing header/navigation copy requires re-running the build script (a unit test fails otherwise). | Approve new devDependency and committed font binaries. |
| D | The animated cloud renderer starts after the `load` event instead of during HTML parse — the CSS still cover is visible up to a few hundred ms longer on slow devices. | Approve boot deferral. |

## Excluded from this plan (with reasons)

- **Async body font CSS** (audit P1 "렌더 블로킹 CSS"): loading the 124-slice `@font-face` sheet asynchronously would apply cached fonts after first paint on repeat visits, re-introducing the relayout/CLS the `font-display: optional` patch exists to prevent (`astro.config.mjs:24-32`). Revisit only with an HTTP/2 measurement showing the CSS on the critical path.
- **Lighthouse `image-aspect-ratio`**: `DawnSky.astro:182-193` stretches the texture on purpose (`object-fit: fill`, `width: 130%`). Intentional.
- **Lighthouse `label-content-name-mismatch`**: rule carries zero weight (a11y score is 100), and the only robust fix moves the edition text out of the wordmark link, which is a header structure change. Defer.
- **`filter: blur()` title keyframes**: Chromium composites `filter` animations on their own layer; not shown to be the 54ms task's cause. Track D addresses the renderer boot, which is the measured chain.

## Parallel execution map

| Track | Branch | Files owned (no other track touches these) |
| --- | --- | --- |
| A | `perf/hero-video-policy` | `src/lib/media-policy.ts`, `tests/unit/media-policy.test.ts`, `src/scripts/moon-light.ts`, `src/components/visual/MoonLight.astro`, `scripts/build-compact-moon-video.mjs`, `public/visual/moon-v8/intro-720.mp4`, `public/visual/moon-v8/loop-720.mp4`, `scripts/check-performance-budget.mjs`, `tests/unit/performance-budget.test.ts`, `tests/e2e/dawn-sky.spec.ts`, `tests/e2e/hero-video-policy.spec.ts` |
| B | `perf/lcp-critical-path` | `src/components/visual/DawnSky.astro`, `src/layouts/BaseLayout.astro`, `src/pages/index.astro`, `src/pages/discover.astro`, `tests/e2e/critical-path.spec.ts` |
| C | `perf/header-font-subsets` | `package.json`, `package-lock.json`, `scripts/build-header-font-subsets.mjs`, `src/assets/fonts/header/*`, `src/lib/fonts/headerFonts.ts`, `src/lib/fonts/headerFontAssets.ts`, `tests/unit/header-fonts.test.ts` |
| D | `perf/renderer-boot` | `src/scripts/dawn-sky.ts`, `tests/e2e/renderer-boot.spec.ts` |
| Integration | `main` | `AGENTS.md`, `docs/performance-audit-2026-09-18.md` |

Create each worktree with `superpowers:using-git-worktrees` from `main` at `6de61df` or later. Each track ends with `npm run verify` green inside its worktree. `package.json` is owned by Track C only; Track A runs its ffmpeg script with `node scripts/...` and gets its npm alias in the integration task.

---

## Track A — Hero video policy (P0)

### Task A1: Pure media policy

**Files:**
- Create: `src/lib/media-policy.ts`
- Test: `tests/unit/media-policy.test.ts`

**Interfaces:**
- Produces: `type HeroVideoVariant = 'full' | 'compact' | 'none'`, `interface MediaPolicyInput { saveData: boolean; effectiveType?: string; compactViewport: boolean }`, `heroVideoVariant(input: MediaPolicyInput): HeroVideoVariant`, `readMediaPolicy(): MediaPolicyInput` (browser only). Task A2 consumes all four.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/media-policy.test.ts
import { describe, expect, it } from 'vitest';
import { heroVideoVariant } from '../../src/lib/media-policy';

describe('heroVideoVariant', () => {
  it('serves the full encode on wide viewports with no constraints', () => {
    expect(
      heroVideoVariant({ saveData: false, compactViewport: false }),
    ).toBe('full');
    expect(
      heroVideoVariant({
        saveData: false,
        effectiveType: '4g',
        compactViewport: false,
      }),
    ).toBe('full');
  });

  it('serves the compact encode on viewports at or below the 42rem breakpoint', () => {
    expect(heroVideoVariant({ saveData: false, compactViewport: true })).toBe(
      'compact',
    );
  });

  it('shows the poster when the browser asks to save data', () => {
    expect(heroVideoVariant({ saveData: true, compactViewport: false })).toBe(
      'none',
    );
    expect(heroVideoVariant({ saveData: true, compactViewport: true })).toBe(
      'none',
    );
  });

  it('shows the poster on slow-2g, 2g and 3g connections', () => {
    for (const effectiveType of ['slow-2g', '2g', '3g']) {
      expect(
        heroVideoVariant({ saveData: false, effectiveType, compactViewport: false }),
      ).toBe('none');
    }
  });

  it('ignores unknown effectiveType values', () => {
    expect(
      heroVideoVariant({
        saveData: false,
        effectiveType: 'wifi',
        compactViewport: true,
      }),
    ).toBe('compact');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/media-policy.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/lib/media-policy"`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/media-policy.ts
/**
 * Decides which hero video the home page may stream. The intro is 5.6MiB and
 * the loop 3.6MiB at 1440×1440; phones never display more than ~800 device
 * pixels of it, and data-saver users should not pay for it at all.
 */
export type HeroVideoVariant = 'full' | 'compact' | 'none';

export interface MediaPolicyInput {
  saveData: boolean;
  effectiveType?: string;
  compactViewport: boolean;
}

const SLOW_CONNECTIONS = new Set(['slow-2g', '2g', '3g']);

export function heroVideoVariant({
  saveData,
  effectiveType,
  compactViewport,
}: MediaPolicyInput): HeroVideoVariant {
  if (saveData) return 'none';
  if (effectiveType && SLOW_CONNECTIONS.has(effectiveType)) return 'none';
  return compactViewport ? 'compact' : 'full';
}

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

/** Browser-only. Reads Network Information (Chromium) and the design breakpoint. */
export function readMediaPolicy(): MediaPolicyInput {
  const connection = (
    navigator as Navigator & { connection?: NetworkInformationLike }
  ).connection;
  return {
    saveData: connection?.saveData === true,
    effectiveType: connection?.effectiveType,
    compactViewport: matchMedia('(max-width: 42rem)').matches,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/media-policy.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/media-policy.ts tests/unit/media-policy.test.ts
git commit -m "feat(lib): add hero video media policy

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task A2: Compact encode + budget

**Files:**
- Create: `scripts/build-compact-moon-video.mjs`
- Create: `public/visual/moon-v8/intro-720.mp4`, `public/visual/moon-v8/loop-720.mp4` (generated, committed)
- Modify: `scripts/check-performance-budget.mjs:6-29` (add media bucket), `:209-211` (add `isMediaAsset`)
- Test: `tests/unit/performance-budget.test.ts`

**Interfaces:**
- Produces: dist files `/visual/moon-v8/intro-720.mp4`, `/visual/moon-v8/loop-720.mp4` referenced by Task A3. Budget output line `media\ttotal=…/13312.0KiB\tcompact=…/3072.0KiB`.

- [ ] **Step 1: Write the failing budget tests**

Append to `tests/unit/performance-budget.test.ts`:

```ts
test('rejects built media that exceeds the aggregate media budget', async () => {
  const fixture = await createFixture(
    '<!doctype html><html><body></body></html>',
  );
  await mkdir(path.join(fixture, 'visual'));
  await writeFile(
    path.join(fixture, 'visual/intro.mp4'),
    Buffer.alloc(13 * 1024 * 1024 + 1),
  );

  await expect(runBudget(fixture)).rejects.toThrow(
    'Aggregate media budget exceeded',
  );
});

test('rejects compact media variants that exceed the compact media budget', async () => {
  const fixture = await createFixture(
    '<!doctype html><html><body></body></html>',
  );
  await mkdir(path.join(fixture, 'visual'));
  await writeFile(
    path.join(fixture, 'visual/intro-720.mp4'),
    Buffer.alloc(3 * 1024 * 1024 + 1),
  );

  await expect(runBudget(fixture)).rejects.toThrow(
    'Compact media budget exceeded',
  );
});

test('reports media usage without counting it as raster', async () => {
  const fixture = await createFixture(
    '<!doctype html><html><body></body></html>',
  );
  await mkdir(path.join(fixture, 'visual'));
  await writeFile(path.join(fixture, 'visual/loop.mp4'), Buffer.alloc(2048));

  const { stdout } = await runBudget(fixture);
  expect(stdout).toMatch(/^media\ttotal=2\.0KiB\/13312\.0KiB\tcompact=0\.0KiB\/3072\.0KiB$/m);
  expect(stdout).toMatch(/^aggregate\tjs-gzip=0\.0KiB\/75\.0KiB\traster=0\.0KiB\/1300\.0KiB$/m);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/performance-budget.test.ts`
Expected: 3 new tests FAIL (the two `rejects` resolve instead; the `stdout` match has no `media` line).

- [ ] **Step 3: Add the media bucket to the budget script**

In `scripts/check-performance-budget.mjs`, after line 11 (`const viewport = …`) add:

```js
// Hero video: 1440×1440 intro/loop plus the ≤42rem compact encodes. Not
// raster, not JS — tracked separately so growth is never invisible.
const mediaBudgets = { aggregate: 13 * 1024 * 1024, compact: 3 * 1024 * 1024 };
```

After line 29 (the `download-originals` stdout write) add:

```js
const builtMedia = files.filter(isMediaAsset);
const compactMedia = builtMedia.filter((file) => /-720\.mp4$/i.test(file));
const [mediaBytes, compactMediaBytes] = await Promise.all([
  byteSize(builtMedia),
  byteSize(compactMedia),
]);
assertWithinBudget('Aggregate media', mediaBytes, mediaBudgets.aggregate);
assertWithinBudget('Compact media', compactMediaBytes, mediaBudgets.compact);
process.stdout.write(
  `media\ttotal=${formatBytes(mediaBytes)}/${formatBytes(mediaBudgets.aggregate)}\tcompact=${formatBytes(compactMediaBytes)}/${formatBytes(mediaBudgets.compact)}\n`,
);
```

After `isRasterAsset` (line 211) add:

```js
function isMediaAsset(file) {
  return /\.(?:mp4|webm)$/i.test(file);
}
```

- [ ] **Step 4: Run the budget tests**

Run: `npx vitest run tests/unit/performance-budget.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Write the encode script**

```js
// scripts/build-compact-moon-video.mjs
// Re-encodes the moon hero video for viewports at or below 42rem (672px). The
// moon occupies 0.68 × viewport width there, so 720×720 covers 3× DPR phones.
// Run once after the source videos change:  node scripts/build-compact-moon-video.mjs
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('public/visual/moon-v8');
const encodes = [
  ['intro.mp4', 'intro-720.mp4'],
  ['loop.mp4', 'loop-720.mp4'],
];

for (const [source, target] of encodes) {
  const input = path.join(root, source);
  const output = path.join(root, target);
  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-i', input,
      '-vf', 'scale=720:720:flags=lanczos',
      '-c:v', 'libx264',
      '-profile:v', 'high',
      '-preset', 'slow',
      '-crf', '27',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-an',
      output,
    ],
    { stdio: 'inherit' },
  );
  const kib = (statSync(output).size / 1024).toFixed(1);
  process.stdout.write(`${target}\t${kib}KiB\n`);
}
```

- [ ] **Step 6: Run the encode and check sizes**

Run: `node scripts/build-compact-moon-video.mjs && ls -la public/visual/moon-v8/`
Expected: `intro-720.mp4` and `loop-720.mp4` present; combined size under `3072 KiB` (expect roughly 1.0–1.6 MiB and 0.6–1.0 MiB). If the pair exceeds 3 MiB, raise `-crf` to `29` and re-run; do not raise the budget.

- [ ] **Step 7: Verify the real build passes the budget**

Run: `PUBLIC_SITE_URL=https://fan-guide.test npm run build && npm run budget`
Expected: a `media` line with `total` under `13312.0KiB` and `compact` under `3072.0KiB`; no error.

- [ ] **Step 8: Commit**

```bash
npx prettier --write scripts/check-performance-budget.mjs scripts/build-compact-moon-video.mjs tests/unit/performance-budget.test.ts
git add scripts/build-compact-moon-video.mjs scripts/check-performance-budget.mjs tests/unit/performance-budget.test.ts public/visual/moon-v8/intro-720.mp4 public/visual/moon-v8/loop-720.mp4
git commit -m "feat(budget): add compact moon encodes and a media budget

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task A3: Apply the policy in `moon-light`

**Files:**
- Modify: `src/components/visual/MoonLight.astro:21,32`
- Modify: `src/scripts/moon-light.ts:1-14,104-105,123-130,153-160`
- Modify: `tests/e2e/dawn-sky.spec.ts:311-347`
- Create: `tests/e2e/hero-video-policy.spec.ts`

**Interfaces:**
- Consumes: `heroVideoVariant`, `readMediaPolicy`, `HeroVideoVariant` from `src/lib/media-policy.ts`; `/visual/moon-v8/intro-720.mp4`, `/visual/moon-v8/loop-720.mp4` from Task A2.
- Produces: `<moon-light data-variant="full|compact|none">` for tests; `<source data-src data-src-compact>`.

- [ ] **Step 1: Write the failing e2e spec**

```ts
// tests/e2e/hero-video-policy.spec.ts
import { expect, test } from '@playwright/test';

const FULL_INTRO = '/visual/moon-v8/intro.mp4';
const COMPACT_INTRO = '/visual/moon-v8/intro-720.mp4';

function mockConnection(saveData: boolean, effectiveType: string) {
  return `Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: { saveData: ${saveData}, effectiveType: ${JSON.stringify(effectiveType)} },
  });`;
}

test('streams the compact intro at or below 42rem and the full intro above', async ({
  page,
}) => {
  await page.goto('/');
  const moon = page.locator('moon-light');
  const compact = (page.viewportSize()?.width ?? 0) <= 672;
  await expect(moon).toHaveAttribute('data-variant', compact ? 'compact' : 'full');
  await expect(moon).toHaveAttribute('data-phase', 'intro');
  await expect(moon.locator('[data-intro] source')).toHaveAttribute(
    'src',
    compact ? COMPACT_INTRO : FULL_INTRO,
  );
});

test('keeps the poster and downloads no video when the browser saves data', async ({
  page,
}) => {
  await page.addInitScript(mockConnection(true, '4g'));
  await page.goto('/');
  const moon = page.locator('moon-light');
  await expect(moon).toHaveAttribute('data-variant', 'none');
  await expect(moon).toHaveAttribute('data-phase', 'poster');
  await expect(page.locator('.home-hero')).toHaveAttribute(
    'data-title-phase',
    'static',
  );
  await expect(moon.locator('[data-intro] source')).not.toHaveAttribute(
    'src',
    /.+/,
  );
  await page.waitForTimeout(500);
  const videoRequests = await page.evaluate(
    () =>
      performance
        .getEntriesByType('resource')
        .filter((entry) => entry.name.endsWith('.mp4')).length,
  );
  expect(videoRequests).toBe(0);
});

test('treats a 3g connection like save-data', async ({ page }) => {
  await page.addInitScript(mockConnection(false, '3g'));
  await page.goto('/');
  await expect(page.locator('moon-light')).toHaveAttribute(
    'data-variant',
    'none',
  );
  await expect(page.locator('moon-light')).toHaveAttribute(
    'data-phase',
    'poster',
  );
});
```

- [ ] **Step 2: Run the spec to verify it fails**

Run: `npx playwright test tests/e2e/hero-video-policy.spec.ts`
Expected: FAIL on `data-variant` (attribute absent) in all three tests, both projects.

- [ ] **Step 3: Add compact sources to the markup**

`src/components/visual/MoonLight.astro` lines 21 and 32:

```astro
    <source
      data-src="/visual/moon-v8/intro.mp4"
      data-src-compact="/visual/moon-v8/intro-720.mp4"
      type="video/mp4"
    />
```

```astro
    <source
      data-src="/visual/moon-v8/loop.mp4"
      data-src-compact="/visual/moon-v8/loop-720.mp4"
      type="video/mp4"
    />
```

- [ ] **Step 4: Apply the policy in the element**

`src/scripts/moon-light.ts`:

Line 1, add the import:

```ts
import {
  heroVideoVariant,
  readMediaPolicy,
  type HeroVideoVariant,
} from '../lib/media-policy';
import { moonLightAt, type MoonPhase } from '../lib/moon-light';
```

After line 14 (`private visible = true;`) add:

```ts
  private variant: HeroVideoVariant = 'full';
```

At the top of `connectedCallback()` (after `this.abort = new AbortController();`, line 17) add:

```ts
    this.variant = heroVideoVariant(readMediaPolicy());
    this.dataset.variant = this.variant;
```

Replace `load()` (lines 123-130) with:

```ts
  private load(video: HTMLVideoElement) {
    const source = video.querySelector('source');
    if (!source || source.hasAttribute('src')) return;
    const compact =
      this.variant === 'compact' ? source.dataset.srcCompact : undefined;
    source.src = compact ?? source.dataset.src ?? '';
    video.muted = true;
    video.preload = 'auto';
    video.load();
  }
```

In `start()` (line 153) insert the policy check right after the existing early return (after line 160):

```ts
    if (this.variant === 'none') {
      this.poster();
      return;
    }
```

Nothing else changes: `poster()` already parks the title (`titlePhase = 'static'`), sets `data-fallback`, and pauses both videos. `switchToLoop()` and the `timeupdate` preload keep calling `load()`, which now picks the compact file for the `compact` variant.

- [ ] **Step 5: Update the existing v8 media assertion for the compact project**

`tests/e2e/dawn-sky.spec.ts` test `'restores the original v8 media and keeps cloud light synchronized'` (starts line 311). Replace the two hard-coded source assertions:

```ts
  const compact = (page.viewportSize()?.width ?? 0) <= 672;
  await expect(moon.locator('[data-intro] source')).toHaveAttribute(
    'src',
    compact ? '/visual/moon-v8/intro-720.mp4' : '/visual/moon-v8/intro.mp4',
  );
```

and further down:

```ts
  await expect(moon.locator('[data-loop] source')).toHaveAttribute(
    'src',
    compact ? '/visual/moon-v8/loop-720.mp4' : '/visual/moon-v8/loop.mp4',
  );
```

Declare `compact` once, immediately after `const moon = page.locator('moon-light');`.

- [ ] **Step 6: Run the two specs**

Run: `PUBLIC_SITE_URL=https://fan-guide.test npm run build && npx playwright test tests/e2e/hero-video-policy.spec.ts tests/e2e/dawn-sky.spec.ts`
Expected: PASS on both projects. On `mobile-chromium` (412px) the intro source is `intro-720.mp4`; on `desktop-chromium` it is `intro.mp4`.

- [ ] **Step 7: Check the JS budget**

Run: `npm run budget`
Expected: `aggregate js-gzip` at most `74.4KiB/75.0KiB`. If over, inline `SLOW_CONNECTIONS` as a regex literal `/^(slow-2g|2g|3g)$/` in `media-policy.ts` and re-run.

- [ ] **Step 8: Full verify and commit**

Run: `npm run verify`
Expected: all stages green.

```bash
git add src/components/visual/MoonLight.astro src/scripts/moon-light.ts tests/e2e/dawn-sky.spec.ts tests/e2e/hero-video-policy.spec.ts
git commit -m "feat(home): gate the hero video on data saver, network and viewport

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## Track B — LCP texture discovery and resource hints (P1)

### Task B1: High-priority texture on every page

**Files:**
- Modify: `src/components/visual/DawnSky.astro:22-30`
- Modify: `src/layouts/BaseLayout.astro:17-38,57-68`
- Modify: `src/pages/index.astro:34-39`, `src/pages/discover.astro:36-40`
- Create: `tests/e2e/critical-path.spec.ts`

**Interfaces:**
- Produces: `BaseLayout` prop `coverCdn?: boolean`; `<link rel="preload" as="image" href="/visual/atmosphere/golden-cloud-bank-v3.webp" fetchpriority="high">` on `/`, `/discover/`, `/setlist/`, `/goyang/`; `<link rel="preconnect" href="https://image-cdn-ak.spotifycdn.com">` on `/` and `/discover/`.

- [ ] **Step 1: Write the failing e2e spec**

```ts
// tests/e2e/critical-path.spec.ts
import { expect, test } from '@playwright/test';

const TEXTURE = '/visual/atmosphere/golden-cloud-bank-v3.webp';
const COVER_CDN = 'https://image-cdn-ak.spotifycdn.com';

for (const route of ['/', '/discover/', '/setlist/', '/goyang/']) {
  test(`${route} preloads the sky texture and marks it high priority`, async ({
    page,
  }) => {
    await page.goto(route);
    const preload = page.locator('head link[rel="preload"][as="image"]');
    await expect(preload).toHaveCount(1);
    await expect(preload).toHaveAttribute('href', TEXTURE);
    await expect(preload).toHaveAttribute('fetchpriority', 'high');
    await expect(
      page.locator('dawn-sky .dawn-sky__still img').first(),
    ).toHaveAttribute('fetchpriority', 'high');
  });
}

test('/sources/ has no sky texture to preload', async ({ page }) => {
  await page.goto('/sources/');
  await expect(page.locator('head link[rel="preload"][as="image"]')).toHaveCount(0);
});

for (const route of ['/', '/discover/']) {
  test(`${route} preconnects to the album cover CDN`, async ({ page }) => {
    await page.goto(route);
    await expect(
      page.locator(`head link[rel="preconnect"][href="${COVER_CDN}"]`),
    ).toHaveCount(1);
  });
}

test('/goyang/ does not preconnect to the album cover CDN', async ({ page }) => {
  await page.goto('/goyang/');
  await expect(page.locator('head link[rel="preconnect"]')).toHaveCount(0);
});
```

- [ ] **Step 2: Run the spec to verify it fails**

Run: `npx playwright test tests/e2e/critical-path.spec.ts --project=desktop-chromium`
Expected: FAIL — preload count 0 on every route; `/discover/`, `/setlist/`, `/goyang/` img has `fetchpriority="auto"`.

- [ ] **Step 3: Make the still texture high priority unconditionally**

`src/components/visual/DawnSky.astro` lines 22-30 — replace the conditional attribute:

```astro
    <img
      src="/visual/atmosphere/golden-cloud-bank-v3.webp"
      alt=""
      width="1536"
      height="1024"
      fetchpriority="high"
      decoding="async"
    />
```

`readingOnly` is still used for the surface attribute and the second layer; only the `fetchpriority` expression goes.

- [ ] **Step 4: Add the head hints in `BaseLayout.astro`**

Extend `Props` (line 17-24):

```ts
interface Props {
  title: string;
  description: string;
  ogImage?: string;
  spaceSky?: boolean;
  lunarSky?: boolean;
  cloudSky?: boolean;
  /** Page renders hotlinked Spotify album covers. */
  coverCdn?: boolean;
}
```

Destructure with `coverCdn = false` (line 26-33), then after line 37 add:

```ts
// Both sky variants paint the same texture first; it is the LCP element on
// every page that has a sky (audit 2026-09-18 §3).
const preloadSkyTexture = cloudSky || lunarSky;
```

In `<head>`, insert **before** the font preload block (line 58) so the image request is queued first:

```astro
    {
      preloadSkyTexture && (
        <link
          rel="preload"
          as="image"
          href="/visual/atmosphere/golden-cloud-bank-v3.webp"
          fetchpriority="high"
        />
      )
    }
    {coverCdn && <link rel="preconnect" href="https://image-cdn-ak.spotifycdn.com" />}
```

No `crossorigin` on the preconnect: `AlbumCover.astro` and `IntroSummary.astro` render plain `<img>` without `crossorigin`, so the images use the non-CORS connection.

- [ ] **Step 5: Opt the two cover pages in**

`src/pages/index.astro` line 34-39:

```astro
<BaseLayout
  title={title}
  description="The Weeknd 2026 고양 공연을 위한 비공식·비영리 팬 가이드"
  spaceSky
  lunarSky
  coverCdn
>
```

`src/pages/discover.astro` line 36-40:

```astro
<BaseLayout
  cloudSky
  coverCdn
  title="The Weeknd 알기 | The Weeknd 고양 팬 가이드"
  description="공연 전 3분에 훑는 The Weeknd의 커리어, 앨범 구분, 그리고 두 3부작"
>
```

(Keep the existing `description` string exactly as it is in the file; only add `coverCdn`.)

- [ ] **Step 6: Run the spec on both projects**

Run: `PUBLIC_SITE_URL=https://fan-guide.test npm run build && npx playwright test tests/e2e/critical-path.spec.ts`
Expected: PASS, 8 tests × 2 projects.

- [ ] **Step 7: Confirm the budget is untouched**

Run: `npm run budget`
Expected: identical numbers to `main` (preload is not an `<img>`, so raster totals do not change).

- [ ] **Step 8: Full verify and commit**

Run: `npm run verify`
Expected: green. `tests/e2e/visual.spec.ts` `'shares one lightweight WebP texture…'` still passes because the texture is still fetched once.

```bash
git add src/components/visual/DawnSky.astro src/layouts/BaseLayout.astro src/pages/index.astro src/pages/discover.astro tests/e2e/critical-path.spec.ts
git commit -m "perf(layout): preload the sky texture and preconnect the cover cdn

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## Track C — Header font subsets (P2)

### Task C1: Per-face glyph coverage helper

**Files:**
- Modify: `src/lib/fonts/headerFonts.ts` (append after `facesCovering`)
- Test: `tests/unit/header-fonts.test.ts`

**Interfaces:**
- Produces: `charactersCoveredBy(face: FontFace, text: string): string` — the distinct non-space characters of `text` whose code point falls in `face.ranges`, in first-seen order. Used by Task C2 (subset text) and Task C3 (narrow `unicode-range`).

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/header-fonts.test.ts`:

```ts
import { charactersCoveredBy } from '../../src/lib/fonts/headerFonts';

test('charactersCoveredBy returns the distinct characters a face can render', () => {
  const face = {
    file: 'slice.woff2',
    format: 'woff2-variations',
    weight: '100 900',
    ranges: [[0x41, 0x5a] as [number, number], [0xac00, 0xd7a3] as [number, number]],
  };
  expect(charactersCoveredBy(face, 'THE WEEKND 홈 the')).toBe('THEWKND홈');
  expect(charactersCoveredBy(face, '· 26')).toBe('');
});
```

Merge the new `import` into the existing import from `../../src/lib/fonts/headerFonts` at the top of the file.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/header-fonts.test.ts`
Expected: FAIL — `charactersCoveredBy is not a function` / no export.

- [ ] **Step 3: Implement**

Append to `src/lib/fonts/headerFonts.ts` after `facesCovering`:

```ts
/** Distinct non-space characters of `text` that `face` declares in its ranges. */
export function charactersCoveredBy(face: FontFace, text: string): string {
  const covered: string[] = [];
  for (const char of new Set(text.replace(/\s+/g, ''))) {
    const point = char.codePointAt(0) ?? 0;
    if (face.ranges.some(([from, to]) => from <= point && point <= to))
      covered.push(char);
  }
  return covered.join('');
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/header-fonts.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/fonts/headerFonts.ts tests/unit/header-fonts.test.ts
git commit -m "feat(fonts): expose per-face glyph coverage for header subsets

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task C2: Build script and committed subsets

**Files:**
- Modify: `package.json` (devDependency `subset-font`, script `fonts:header`)
- Create: `scripts/build-header-font-subsets.mjs`
- Create: `src/assets/fonts/header/manifest.json`, `src/assets/fonts/header/*.woff2` (generated, committed)
- Test: `tests/unit/header-fonts.test.ts`

**Interfaces:**
- Consumes: `parseFontFaces`, `facesCovering`, `charactersCoveredBy` from `src/lib/fonts/headerFonts.ts`; `chromeText` from `src/components/chrome/navigation.ts`.
- Produces: `manifest.json` shape `{ "text": { "display": string, "body": string }, "files": Array<{ "file": string, "family": "display" | "body", "characters": string, "bytes": number }> }`. Subset files keep the fontsource basename (e.g. `noto-sans-kr-111-wght-normal.woff2`). Task C3 reads the manifest.

- [ ] **Step 1: Install the subsetter**

Run: `npm install --save-dev subset-font@^2`
Expected: `package.json` gains `"subset-font": "^2.x"`; `package-lock.json` updated. `subset-font` bundles harfbuzzjs (wasm); no native build.

- [ ] **Step 2: Write the failing freshness test**

Append to `tests/unit/header-fonts.test.ts`:

```ts
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import manifest from '../../src/assets/fonts/header/manifest.json';

const HEADER_FONT_DIR = path.resolve('src/assets/fonts/header');

test('the committed header subsets were built from the current chrome text', () => {
  expect(manifest.text).toEqual(chromeText);
});

test('every header subset exists and is a fraction of its fontsource slice', () => {
  expect(manifest.files.length).toBeGreaterThan(0);
  for (const entry of manifest.files) {
    const file = path.join(HEADER_FONT_DIR, entry.file);
    expect(existsSync(file), `${entry.file} missing`).toBe(true);
    expect(statSync(file).size).toBe(entry.bytes);
    expect(entry.bytes).toBeLessThan(6 * 1024);
    expect(entry.characters.length).toBeGreaterThan(0);
  }
});
```

Merge `existsSync`/`statSync` into the existing `node:fs` import. `resolveJsonModule` is on in Astro's base tsconfig; if `astro check` complains about the JSON import, add `import type` ignore: `// @ts-expect-error json module` is **not** acceptable — instead read with `JSON.parse(readFileSync(path.join(HEADER_FONT_DIR, 'manifest.json'), 'utf8'))` and type it as `{ text: typeof chromeText; files: Array<{ file: string; family: string; characters: string; bytes: number }> }`.

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run tests/unit/header-fonts.test.ts`
Expected: FAIL — manifest file does not exist.

- [ ] **Step 4: Write the build script**

```js
// scripts/build-header-font-subsets.mjs
// Subsets the fontsource slices that the site header needs down to the exact
// chrome glyphs. Re-run whenever src/components/chrome/navigation.ts changes:
//   npm run fonts:header
// Requires Node 22 type stripping to import the .ts helpers.
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import subsetFont from 'subset-font';
import { chromeText } from '../src/components/chrome/navigation.ts';
import {
  charactersCoveredBy,
  facesCovering,
  parseFontFaces,
} from '../src/lib/fonts/headerFonts.ts';

const require = createRequire(import.meta.url);
const outDir = path.resolve('src/assets/fonts/header');

const sources = [
  {
    family: 'display',
    css: '@fontsource/bebas-neue/index.css',
    files: '@fontsource/bebas-neue/files/',
    text: chromeText.display,
  },
  {
    family: 'body',
    css: '@fontsource-variable/noto-sans-kr/index.css',
    files: '@fontsource-variable/noto-sans-kr/files/',
    text: chromeText.body,
  },
];

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const files = [];
for (const { family, css, files: filesSpecifier, text } of sources) {
  const faces = parseFontFaces(await readFile(require.resolve(css), 'utf8'));
  for (const face of facesCovering(faces, text)) {
    const characters = charactersCoveredBy(face, text);
    const input = await readFile(
      require.resolve(`${filesSpecifier}${face.file}`),
    );
    const output = await subsetFont(input, characters, {
      targetFormat: 'woff2',
    });
    await writeFile(path.join(outDir, face.file), output);
    files.push({ file: face.file, family, characters, bytes: output.length });
    process.stdout.write(
      `${face.file}\t${input.length}→${output.length} bytes\t${characters}\n`,
    );
  }
}

await writeFile(
  path.join(outDir, 'manifest.json'),
  `${JSON.stringify({ text: chromeText, files }, null, 2)}\n`,
);
process.stdout.write(`wrote ${(await readdir(outDir)).length} files to ${outDir}\n`);
```

Add the npm script to `package.json` `scripts`:

```json
"fonts:header": "node --experimental-strip-types --no-warnings=ExperimentalWarning scripts/build-header-font-subsets.mjs"
```

- [ ] **Step 5: Run the build script**

Run: `npm run fonts:header && ls -la src/assets/fonts/header/`
Expected: 7 `.woff2` files (1 Bebas Neue latin + 6 Noto slices, matching today's preload list) plus `manifest.json`; every subset under 6 KiB (the originals are 12–17 KiB). If `subset-font` rejects the variable slices, pass `{ targetFormat: 'woff2', preserveNameIds: [] }` — do **not** pass `variationAxes`, which would flatten the weight axis the header relies on (`font-weight: 100 900`).

- [ ] **Step 6: Run the unit tests**

Run: `npx vitest run tests/unit/header-fonts.test.ts`
Expected: PASS including the two new tests.

- [ ] **Step 7: Commit**

```bash
npx prettier --write scripts/build-header-font-subsets.mjs tests/unit/header-fonts.test.ts package.json
git add package.json package-lock.json scripts/build-header-font-subsets.mjs src/assets/fonts/header tests/unit/header-fonts.test.ts
git commit -m "feat(fonts): build committed header font subsets

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task C3: Serve the subsets from the header alias faces

**Files:**
- Modify: `src/lib/fonts/headerFontAssets.ts:17-53`
- Test: `tests/unit/header-fonts.test.ts` (existing `alias faces block` test still applies)

**Interfaces:**
- Consumes: `src/assets/fonts/header/*.woff2`, `manifest.json` from Task C2; `charactersCoveredBy` from Task C1.
- Produces: unchanged `headerFontAssets = { preloads: string[]; css: string }` consumed by `BaseLayout.astro:59,69`. Preload hrefs now point at hashed copies of the subset files; `unicode-range` lists exactly the subset characters.

- [ ] **Step 1: Point the hashed URL glob at the subsets**

Replace lines 17-28 of `src/lib/fonts/headerFontAssets.ts`:

```ts
// Hashed asset URLs of the committed header subsets (npm run fonts:header).
// Each file keeps its fontsource basename so `face.file` still resolves.
const hashedUrls = import.meta.glob<string>(
  '/src/assets/fonts/header/*.woff2',
  { query: '?url', import: 'default', eager: true },
);
```

- [ ] **Step 2: Narrow `unicode-range` to the subset characters**

Replace `aliasFor` (lines 43-53):

```ts
function aliasFor(family: string, specifier: string, text: string) {
  return facesCovering(parseFontFaces(readPackageCss(specifier)), text).map(
    (face) => ({
      family,
      weight: face.weight,
      url: urlFor(face),
      format: face.format,
      ranges: formatUnicodeRange(
        [...charactersCoveredBy(face, text)].map((char) => {
          const point = char.codePointAt(0) ?? 0;
          return [point, point] as [number, number];
        }),
      ),
    }),
  );
}
```

Add `charactersCoveredBy` to the import from `./headerFonts`.

- [ ] **Step 3: Build and inspect the output**

Run: `PUBLIC_SITE_URL=https://fan-guide.test npm run build && grep -o '<link rel="preload"[^>]*>' dist/index.html && grep -o "font-family:'Noto Sans KR Header'[^}]*unicode-range:[^}]*" dist/index.html | head -1 && ls -la dist/_astro/ | grep -c woff2`
Expected: 7 preload links with new hashes; each preloaded file exists in `dist/_astro/` and is under 6 KiB; the `unicode-range` of the header alias is a short comma list (tens of code points, not hundreds); `dist/_astro/` still contains the full fontsource slice set for the body family (count ≥ 127).

- [ ] **Step 4: Check the header renders in the right font**

Run: `npx playwright test tests/e2e/header-menu.spec.ts tests/e2e/navigation.spec.ts tests/e2e/no-js.spec.ts`
Expected: PASS on both projects (these specs exercise the header text and layout).

- [ ] **Step 5: Full verify and commit**

Run: `npm run verify`
Expected: green.

```bash
git add src/lib/fonts/headerFontAssets.ts
git commit -m "perf(fonts): preload subset header fonts instead of full slices

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## Track D — Renderer boot after `load` (P3)

### Task D1: Defer the dawn renderer import

**Files:**
- Modify: `src/scripts/dawn-sky.ts:61-87`
- Create: `tests/e2e/renderer-boot.spec.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `dawn-sky` still transitions `still → loading → (renderer) `; `data-renderer="webgl"` appears after the window `load` event.

- [ ] **Step 1: Write the failing e2e spec**

```ts
// tests/e2e/renderer-boot.spec.ts
import { expect, test } from '@playwright/test';

test('boots the WebGL renderer only after the load event and the LCP texture', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('dawn-sky')).toHaveAttribute('data-renderer', 'webgl');
  const timing = await page.evaluate(() => {
    const [navigation] = performance.getEntriesByType(
      'navigation',
    ) as PerformanceNavigationTiming[];
    const resources = performance.getEntriesByType(
      'resource',
    ) as PerformanceResourceTiming[];
    const renderer = resources.find((entry) =>
      /dawn-sky-renderer\.[\w-]+\.js$/.test(entry.name),
    );
    const texture = resources.find((entry) =>
      entry.name.endsWith('/visual/atmosphere/golden-cloud-bank-v3.webp'),
    );
    return {
      loadEventStart: navigation?.loadEventStart ?? Number.NaN,
      rendererFetchStart: renderer?.fetchStart ?? Number.NaN,
      textureResponseEnd: texture?.responseEnd ?? Number.NaN,
    };
  });
  expect(timing.rendererFetchStart).toBeGreaterThanOrEqual(timing.loadEventStart);
  expect(timing.rendererFetchStart).toBeGreaterThanOrEqual(timing.textureResponseEnd);
});
```

- [ ] **Step 2: Run the spec to verify it fails**

Run: `npx playwright test tests/e2e/renderer-boot.spec.ts --project=desktop-chromium`
Expected: FAIL — today the renderer chunk is fetched during module evaluation, before `loadEventStart`.

- [ ] **Step 3: Defer the import**

In `src/scripts/dawn-sky.ts`, add a module-level helper above `class DawnSky`:

```ts
/** Resolves after the window `load` event, then on the next idle slot. */
function afterLoadIdle(signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const idle = () => {
      if (signal.aborted) return;
      if ('requestIdleCallback' in window)
        requestIdleCallback(() => resolve(), { timeout: 1500 });
      else setTimeout(resolve, 0);
    };
    if (document.readyState === 'complete') idle();
    else window.addEventListener('load', idle, { once: true, signal });
  });
}
```

In `configure()` (line 61), between `this.dataset.state = 'loading';` (line 68) and the `try` (line 69), insert:

```ts
    if (this.abort) await afterLoadIdle(this.abort.signal);
    if (generation !== this.generation || !this.isConnected) return;
```

The `generation` guard already exists on line 62; the new check simply repeats it after the wait so a reduced-motion change during the wait still wins.

- [ ] **Step 4: Run the renderer specs**

Run: `PUBLIC_SITE_URL=https://fan-guide.test npm run build && npx playwright test tests/e2e/renderer-boot.spec.ts tests/e2e/dawn-sky.spec.ts tests/e2e/cloud-reveal.spec.ts tests/e2e/visual.spec.ts`
Expected: PASS on both projects. `dawn-sky.spec.ts` waits for `data-renderer="webgl"` with the default 5s expect timeout, which covers the deferral.

- [ ] **Step 5: Check the JS budget**

Run: `npm run budget`
Expected: `aggregate js-gzip` at most `74.3KiB/75.0KiB`.

- [ ] **Step 6: Full verify and commit**

Run: `npm run verify`
Expected: green.

```bash
git add src/scripts/dawn-sky.ts tests/e2e/renderer-boot.spec.ts
git commit -m "perf(dawn-sky): boot the renderer after load

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## Integration — merge, document, re-measure

### Task I1: Merge the tracks into `main`

**Files:**
- Modify: none directly (merges only)

- [ ] **Step 1: Merge in dependency-free order**

```bash
git checkout main
git merge --no-ff perf/lcp-critical-path
git merge --no-ff perf/renderer-boot
git merge --no-ff perf/header-font-subsets
git merge --no-ff perf/hero-video-policy
```

Expected: no conflicts (file ownership is disjoint). If `package-lock.json` conflicts against an unrelated `main` change, take `main`'s lock and re-run `npm install --save-dev subset-font@^2`.

- [ ] **Step 2: Verify the merged tree**

Run: `npm ci && npm run verify`
Expected: green. Record the `npm run budget` output lines for `aggregate` and `media`.

### Task I2: Document the new build steps and traps

**Files:**
- Modify: `AGENTS.md` (sections `## 명령`, `## 함정`)

- [ ] **Step 1: Add the commands**

In `AGENTS.md` `## 명령` code block, after the `npm run budget` line add:

```bash
node scripts/build-compact-moon-video.mjs        # 720px 히어로 비디오 재인코딩 (ffmpeg). 원본 mp4 변경 시 1회
npm run fonts:header                             # 헤더 폰트 서브셋 재생성. src/components/chrome/navigation.ts 변경 시 필수
```

- [ ] **Step 2: Add the traps**

In `## 함정`, append two bullets:

```markdown
- 히어로 비디오: `src/lib/media-policy.ts`가 `saveData`·`effectiveType`(slow-2g/2g/3g) → 포스터, `≤42rem` → `-720.mp4`, 그 외 원본을 선택. 예산 스크립트가 mp4 합계 13MiB, `-720` 합계 3MiB를 검사한다. 원본 mp4를 바꾸면 `node scripts/build-compact-moon-video.mjs`를 다시 돌린다.
- 헤더 폰트는 `src/assets/fonts/header/`의 서브셋을 preload한다. `navigation.ts`의 워드마크·메뉴 문구를 바꾸면 `npm run fonts:header`를 실행하고 결과를 커밋한다 — `tests/unit/header-fonts.test.ts`가 manifest와 `chromeText` 불일치를 실패로 잡는다.
```

- [ ] **Step 3: Format and commit**

```bash
npx prettier --write AGENTS.md
git add AGENTS.md
git commit -m "docs(agents): document video encode and header font subset steps

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task I3: Re-measure and append results to the audit

**Files:**
- Modify: `docs/performance-audit-2026-09-18.md` (append `## 7. 개선 후 재측정`)

- [ ] **Step 1: Build and serve**

```bash
PUBLIC_SITE_URL=https://fan-guide.test npm run build
npx astro preview --port 4323 --host 127.0.0.1
```

- [ ] **Step 2: Trace with chrome-devtools MCP (same profile as §1)**

For `/`, `/goyang/`, `/setlist/`: `emulate` (`390x844x3,mobile,touch`, `cpuThrottlingRate: 4`, `networkConditions: "Slow 4G"`) → `navigate_page` → `performance_start_trace(reload: true)`. Record LCP, LCP load delay, CLS. On `/` additionally run `evaluate_script` returning `performance.getEntriesByType('resource').filter(r => r.name.endsWith('.mp4')).map(r => [r.name.split('/').pop(), r.encodedBodySize])` and the buffered `longtask` entries. Then `emulate` desktop `1440x900x1` and trace `/` once.

- [ ] **Step 3: Append the comparison table**

```markdown
## 7. 개선 후 재측정 — YYYY-MM-DD (커밋 `xxxxxxx`)

| 지표 | 이전 | 이후 |
| --- | --- | --- |
| `/` 모바일 LCP | 2,433ms | … |
| `/` 모바일 LCP 로드 지연 | 610ms | … |
| `/goyang/` 모바일 LCP | 2,407ms | … |
| `/setlist/` 모바일 LCP | 2,345ms | … |
| `/` 모바일 mp4 전송 | 5,866,428 B (`intro.mp4`) | … (`intro-720.mp4`) |
| `/` 모바일 롱태스크 최대 | 54ms @477ms | … |
| 헤더 폰트 preload 합계 | ~90KB / 7 파일 | … |
| `npm run budget` JS | 74.0 / 75.0 KiB | … |
| `npm run budget` media | 미집계 | … / 13312 KiB, compact … / 3072 KiB |
```

Fill every `…` with the measured value; if a metric regressed, say so in a line under the table.

- [ ] **Step 4: Commit and push**

```bash
npx prettier --check docs/performance-audit-2026-09-18.md
git add docs/performance-audit-2026-09-18.md
git commit -m "docs(perf): record post-improvement measurements

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push origin main
```

---

## Self-review

**Spec coverage** (audit §4): P0 video → Track A. P1 LCP `fetchpriority`/preload → Track B. P1 render-blocking CSS → excluded with reason. P2 header preload → Track C. P2 JS headroom → no task; Tracks A and D each verify the aggregate stays under 75 KiB, and the integration records the new value. P3 long task → Track D (moves the boot out of the LCP window; the integration re-measures). P3 aspect-ratio and wordmark label → excluded with reasons. P3 preconnect → Track B.

**Placeholder scan:** every code step carries the code; the only `…` cells are in the results table that the executor fills from measurements.

**Type consistency:** `HeroVideoVariant`, `MediaPolicyInput`, `heroVideoVariant`, `readMediaPolicy` (A1 → A3); `data-variant` (A3 impl and specs); `charactersCoveredBy(face, text): string` (C1 → C2 script → C3); manifest shape `{ text, files[{ file, family, characters, bytes }] }` (C2 script → C2 test); `coverCdn` prop (B1 layout → B1 pages); `afterLoadIdle(signal)` (D1). `isMediaAsset` and `mediaBudgets` (A2 script) match the test's expected `13312.0KiB` / `3072.0KiB` strings.
