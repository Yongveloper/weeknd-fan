# The Weeknd Goyang Fan Guide v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a fast, accessible, noncommercial Korean fan-made digital pamphlet for The Weeknd's 2026 Goyang concerts, centered on artist context, an explicitly predicted setlist, practical concert guidance, Eclipse Count, and private browser-only share cards.

**Architecture:** Astro 6 generates a static multi-page site from schema-validated local content. Server-rendered Astro components provide all essential reading and navigation without JavaScript; small browser scripts enhance the countdown, setlist exploration, page choreography, and Canvas share cards. Native CSS and cross-document View Transitions handle common motion, while the vanilla `motion` package is loaded only for the moon/Eclipse choreography that needs sequenced transforms, masks, and CSS-variable animation.

**Tech Stack:** Node.js 22.12+, npm, Astro 6, TypeScript strict mode, Astro Content Collections with Zod, Motion for vanilla JavaScript, Vitest, Playwright, axe-core, ESLint, Prettier, Netlify static hosting.

**Spec:** `docs/superpowers/specs/2026-08-29-weeknd-goyang-fan-guide-design.md`

## Global Constraints

- Use Node.js `>=22.12.0`; commit `package-lock.json`; do not add a server adapter, database, login, or user-content API.
- Generate a static multi-page site. Essential text, official links, transport guidance, source labels, and the collapsed setlist must remain usable with JavaScript disabled.
- The canonical time zone is `Asia/Seoul`; store all event instants as ISO 8601 strings with the `+09:00` offset.
- Trust states are exactly `official`, `post-show`, `pattern`, `expected`, and `unpublished`; render the Korean labels defined in Task 2.
- The expected setlist is never labeled official. Baseline entries cite at least three 2026 crowd-sourced snapshots and display `예상 · 보장 아님`.
- Do not copy album artwork, official tour artwork, press photos, fan footage, NamuWiki prose, or long lyrics. Original generated assets may contain no person, logo, album title, tour title, or recognizable official composition.
- Use CSS for static styling, hover/focus feedback, simple fades, and cross-document transitions. Load `motion` only on pages containing `data-motion-scene`.
- Entry and section transitions finish within `450–700ms`; no infinite decorative animation; no sound.
- `prefers-reduced-motion: reduce` removes large transforms, parallax, mask travel, and automatic choreography while preserving opacity and immediate state changes.
- Target WCAG AA contrast, visible focus, 44px touch targets, semantic landmarks, keyboard-operable disclosure controls, and no per-second screen-reader announcements.
- Performance budgets on a production build: initial JavaScript `<=75KB` gzip per page, home raster payload `<=700KB`, other-page raster payload `<=400KB`, CLS `<0.1`, and no autoplay video.
- Use responsive Astro image output with AVIF and WebP. Lazy-load below-fold generated textures and all official media embeds.
- D-day ticket and setlist poster selections stay in memory. Do not store selections on a server, in cookies, or in analytics identifiers.
- v1 includes no analytics. Revisit anonymous aggregate analytics only after launch demand exists.
- Netlify is the first hosting target; the static output remains portable to another host without application changes.

## File Structure

```text
.
├── .github/workflows/ci.yml                 # repeatable quality gate
├── astro.config.mjs                         # static output, site URL, sitemap, image policy
├── eslint.config.js                         # JS/TS/Astro lint rules
├── netlify.toml                             # build, publish, security/cache headers
├── package.json                             # scripts and pinned dependency ranges
├── playwright.config.ts                     # production-preview E2E matrix
├── tsconfig.json                            # Astro strict TypeScript
├── vitest.config.ts                         # unit tests through Astro/Vite config
├── public/
│   ├── favicon.svg                          # original DAWNFOLD eclipse mark
│   └── og/default.jpg                       # 1200×630 original share preview
├── scripts/
│   └── check-performance-budget.mjs         # built-asset gzip/image budget gate
├── src/
│   ├── assets/visual/
│   │   ├── moon-surface.png                 # generated transparent source
│   │   ├── fog-night.png                    # generated transparent source
│   │   ├── fog-dawn.png                     # generated transparent source
│   │   ├── grain.png                        # generated seamless source
│   │   └── README.md                        # prompt, date, provenance, usage
│   ├── components/
│   │   ├── chrome/SiteFooter.astro
│   │   ├── chrome/SiteHeader.astro
│   │   ├── content/OfficialEmbed.astro
│   │   ├── content/SourceList.astro
│   │   ├── content/StatusBadge.astro
│   │   ├── discover/CareerTimeline.astro
│   │   ├── discover/TrilogyExplainer.astro
│   │   ├── guide/GuideSection.astro
│   │   ├── guide/VenueMap.astro
│   │   ├── home/FanNote.astro
│   │   ├── home/GuideShortcuts.astro
│   │   ├── home/HomeHero.astro
│   │   ├── home/IntroSummary.astro
│   │   ├── home/SetlistPreview.astro
│   │   ├── setlist/SetlistExplorer.astro
│   │   ├── share/SetlistCardBuilder.astro
│   │   ├── share/TicketBuilder.astro
│   │   └── visual/EclipseCountdown.astro
│   ├── content.config.ts                    # all content schemas and loaders
│   ├── data/
│   │   ├── archive/*.json                   # post-show day-one/day-two records
│   │   ├── concert/goyang-2026.json
│   │   ├── discover/*.md                    # eras, trilogy, glossary, visual work
│   │   ├── guides/*.md                      # transport, arrival, return, packing
│   │   ├── setlist/*.json                   # ordered expected entries
│   │   └── sources/*.json                   # reusable primary/crowd source records
│   ├── layouts/BaseLayout.astro
│   ├── lib/
│   │   ├── content/audit.ts
│   │   ├── content/contracts.ts
│   │   ├── content/queries.ts
│   │   ├── countdown.ts
│   │   ├── seo/eventJsonLd.ts
│   │   └── share/
│   │       ├── buildSetlistCardLayout.ts
│   │       ├── buildTicketLayout.ts
│   │       ├── canvas.ts
│   │       └── download.ts
│   ├── pages/
│   │   ├── discover.astro
│   │   ├── goyang.astro
│   │   ├── index.astro
│   │   ├── setlist.astro
│   │   ├── share/setlist.astro
│   │   ├── share/ticket.astro
│   │   └── sources.astro
│   └── styles/
│       ├── global.css
│       ├── motion.css
│       └── tokens.css
└── tests/
    ├── e2e/
    │   ├── accessibility.spec.ts
    │   ├── no-js.spec.ts
    │   ├── navigation.spec.ts
    │   ├── share.spec.ts
    │   └── visual.spec.ts
    └── unit/
        ├── content-audit.test.ts
        ├── countdown.test.ts
        ├── setlist-layout.test.ts
        └── ticket-layout.test.ts
```

---

### Task 1: Static Astro Foundation and Quality Gate

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `eslint.config.js`
- Create: `.prettierrc.json`
- Create: `.prettierignore`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/pages/index.astro`
- Create: `tests/e2e/navigation.spec.ts`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: Node.js `>=22.12.0` and the approved spec.
- Produces: `npm run dev`, `npm run build`, `npm run lint`, `npm run check`, `npm test`, `npm run test:e2e`, and `npm run verify`; static files in `dist/`.

- [ ] **Step 1: Write the failing production smoke test**

```ts
// tests/e2e/navigation.spec.ts
import { expect, test } from '@playwright/test';

test('serves the Korean fan-guide shell', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/The Weeknd 고양 팬 가이드/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('AFTER HOURS TIL DAWN');
});
```

- [ ] **Step 2: Run the test and verify the project is not scaffolded**

Run: `npm run test:e2e -- navigation.spec.ts`

Expected: FAIL because `package.json`, Playwright configuration, and the site do not exist.

- [ ] **Step 3: Install the static-site and test toolchain**

Run:

```bash
npm init -y
npm install astro@^6 motion @astrojs/sitemap @fontsource/bebas-neue @fontsource-variable/noto-sans-kr
npm install -D @astrojs/check @playwright/test @axe-core/playwright vitest typescript eslint @eslint/js typescript-eslint eslint-plugin-astro prettier prettier-plugin-astro
npx playwright install chromium
```

Set these exact scripts and engine constraints in `package.json`:

```json
{
  "type": "module",
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "lint": "eslint .",
    "format:check": "prettier --check .",
    "check": "astro check",
    "test": "vitest run --passWithNoTests",
    "test:e2e": "playwright test",
    "verify": "npm run lint && npm run format:check && npm run check && npm test && npm run build && npm run test:e2e"
  }
}
```

Use these exact static-analysis configurations:

```js
// eslint.config.js
import eslint from '@eslint/js';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['.astro/**', '.superpowers/**', 'dist/**'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs['flat/recommended'],
);
```

```json
// tsconfig.json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": { "noUncheckedIndexedAccess": true }
}
```

`.prettierrc.json` sets `{ "plugins": ["prettier-plugin-astro"], "singleQuote": true }`. `.prettierignore` contains `.astro/`, `.superpowers/`, `dist/`, and `docs/superpowers/` so generated previews and approved planning prose do not enter the source formatter gate.

- [ ] **Step 4: Configure strict static output and test runners**

```js
// astro.config.mjs
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321',
  integrations: [sitemap()],
  image: {
    layout: 'constrained',
    responsiveStyles: true,
  },
});
```

```ts
// vitest.config.ts
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: { include: ['tests/unit/**/*.test.ts'] },
});
```

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI,
  },
  use: { baseURL: 'http://127.0.0.1:4321', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
});
```

- [ ] **Step 5: Add the smallest accessible page shell**

```astro
---
// src/pages/index.astro
const title = 'The Weeknd 고양 팬 가이드';
---

<!doctype html>
<html lang="ko">
  <head><meta charset="utf-8" /><title>{title}</title></head>
  <body><main><h1>AFTER HOURS TIL DAWN</h1></main></body>
</html>
```

- [ ] **Step 6: Run the complete foundation gate**

Run: `npm run lint && npm run format:check && npm run check && npm test && npm run build && npm run test:e2e -- navigation.spec.ts`

Expected: all commands exit `0`; the smoke test reports `1 passed` in both configured projects.

- [ ] **Step 7: Commit**

```bash
git add .gitignore package.json package-lock.json astro.config.mjs tsconfig.json eslint.config.js .prettierrc.json .prettierignore vitest.config.ts playwright.config.ts src/pages/index.astro tests/e2e/navigation.spec.ts
git commit -m "chore: scaffold static Astro site"
```

---

### Task 2: Typed Editorial Content and Trust Model

**Files:**
- Create: `src/lib/content/contracts.ts`
- Create: `src/content.config.ts`
- Create: `src/lib/content/queries.ts`
- Create: `src/lib/content/audit.ts`
- Create: `src/data/archive/.gitkeep`
- Create: `src/data/concert/goyang-2026.json`
- Create: `src/data/sources/the-weeknd-tour.json`
- Create: `src/data/sources/live-nation-goyang.json`
- Create: `src/data/sources/nol-notice.json`
- Create: `src/data/sources/hyundai-card-announcement.json`
- Create: `src/data/sources/goyang-bis.json`
- Create: `src/data/sources/setlist-manchester-2026-06-12.json`
- Create: `src/data/sources/setlist-london-2026-08-14.json`
- Create: `src/data/sources/setlist-london-2026-08-15.json`
- Create: `tests/unit/content-audit.test.ts`

**Interfaces:**
- Consumes: source URLs and verified facts in the approved spec.
- Produces: `TrustStatus`, `SourceRecord`, `ConcertRecord`, `SetlistRecord`, `ShowRecord`, `getConcert()`, `getExpectedSetlist()`, `getShowRecords()`, `getDiscoverContent()`, `getGuideContent()`, and `auditCoreContent()`.

- [ ] **Step 1: Write failing tests for labels and editorial safety**

```ts
// tests/unit/content-audit.test.ts
import { describe, expect, it } from 'vitest';
import { auditCoreContent } from '../../src/lib/content/audit';
import { STATUS_LABELS } from '../../src/lib/content/contracts';

describe('content trust contract', () => {
  it('keeps expected content visibly non-official', () => {
    expect(STATUS_LABELS.expected).toBe('예상 · 보장 아님');
  });

  it('requires two primary sources for concert facts', () => {
    const issues = auditCoreContent({
      concertPrimarySourceCount: 1,
      setlistSnapshotCount: 3,
      setlistStatus: 'expected',
    });
    expect(issues).toContain('concert:primary-sources-below-2');
  });

  it('requires three snapshots and an expected status for the setlist', () => {
    const issues = auditCoreContent({
      concertPrimarySourceCount: 2,
      setlistSnapshotCount: 2,
      setlistStatus: 'official',
    });
    expect(issues).toEqual([
      'setlist:snapshots-below-3',
      'setlist:must-not-be-official',
    ]);
  });
});
```

- [ ] **Step 2: Run the unit test and verify missing contracts fail**

Run: `npm test -- content-audit.test.ts`

Expected: FAIL with unresolved imports from `src/lib/content`.

- [ ] **Step 3: Define stable public types and trust labels**

```ts
// src/lib/content/contracts.ts
export const TRUST_STATUSES = [
  'official',
  'post-show',
  'pattern',
  'expected',
  'unpublished',
] as const;

export type TrustStatus = (typeof TRUST_STATUSES)[number];

export const STATUS_LABELS: Record<TrustStatus, string> = {
  official: '공식 확정',
  'post-show': '공연 후 확인',
  pattern: '반복 패턴',
  expected: '예상 · 보장 아님',
  unpublished: '미공개 · 확인 필요',
};

export type ContentAuditInput = {
  concertPrimarySourceCount: number;
  setlistSnapshotCount: number;
  setlistStatus: TrustStatus;
};

export type AuditIssue = { id: string; code: string };
```

```ts
// src/lib/content/audit.ts
import type { ContentAuditInput } from './contracts';

export function auditCoreContent(input: ContentAuditInput): string[] {
  const issues: string[] = [];
  if (input.concertPrimarySourceCount < 2) issues.push('concert:primary-sources-below-2');
  if (input.setlistSnapshotCount < 3) issues.push('setlist:snapshots-below-3');
  if (input.setlistStatus === 'official') issues.push('setlist:must-not-be-official');
  return issues;
}
```

- [ ] **Step 4: Define Astro 6 loaders and Zod schemas**

```ts
// src/content.config.ts
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const status = z.enum(['official', 'post-show', 'pattern', 'expected', 'unpublished']);
const spoilerLevel = z.enum(['none', 'titles', 'full']);

const sources = defineCollection({
  loader: glob({ base: './src/data/sources', pattern: '**/*.json' }),
  schema: z.object({
    name: z.string(),
    url: z.url(),
    kind: z.enum(['official', 'public-agency', 'crowd-sourced', 'editorial-reference']),
    lastCheckedAt: z.coerce.date(),
  }),
});

const common = z.object({
  title: z.string(),
  summary: z.string(),
  body: z.string().optional(),
  status,
  lastVerifiedAt: z.coerce.date(),
  sources: z.array(reference('sources')).min(1),
  relatedAlbums: z.array(z.string()).default([]),
  relatedSongs: z.array(z.string()).default([]),
  spoilerLevel,
});

const concert = defineCollection({
  loader: glob({ base: './src/data/concert', pattern: '**/*.json' }),
  schema: common.extend({
    venue: z.string(),
    ageRestriction: z.string(),
    opener: z.object({ name: z.string() }),
    shows: z.array(z.object({
      dateLabel: z.string(),
      openerStartsAt: z.iso.datetime({ offset: true }),
      startsAt: z.iso.datetime({ offset: true }),
    })).length(2),
    archivePublished: z.boolean(),
  }),
});

const showRecords = defineCollection({
  loader: glob({ base: './src/data/archive', pattern: '**/*.json' }),
  schema: common.extend({
    showDate: z.iso.date(),
    songs: z.array(z.object({ order: z.number().int().positive(), title: z.string(), note: z.string().optional() })).min(1),
  }),
});

const discover = defineCollection({
  loader: glob({ base: './src/data/discover', pattern: '**/*.md' }),
  schema: common.extend({ order: z.number().int().positive(), section: z.enum(['intro', 'era', 'trilogy', 'glossary', 'visual']) }),
});

const guides = defineCollection({
  loader: glob({ base: './src/data/guides', pattern: '**/*.md' }),
  schema: common.extend({ order: z.number().int().positive(), section: z.enum(['official', 'transport', 'arrival', 'return', 'packing', 'pending']) }),
});

const setlist = defineCollection({
  loader: glob({ base: './src/data/setlist', pattern: '**/*.json' }),
  schema: common.extend({
    expectedOrder: z.number().int().positive(),
    songTitle: z.string(),
    album: z.string(),
    liveNote: z.string(),
    singAlongNote: z.string(),
    confidence: z.enum(['high', 'medium', 'low']),
    officialListenUrl: z.url().optional(),
    observedIn: z.array(reference('sources')).min(3),
  }),
});

export const collections = { concert, discover, guides, setlist, showRecords, sources };
```

- [ ] **Step 5: Seed the verified concert record and reusable sources**

Create `src/data/concert/goyang-2026.json` with these exact machine-readable values:

```json
{
  "title": "The Weeknd: After Hours Til Dawn Tour — Goyang",
  "summary": "2026년 10월 7–8일 고양종합운동장 주경기장에서 열리는 내한 공연",
  "status": "official",
  "lastVerifiedAt": "2026-08-29",
  "sources": ["live-nation-goyang", "nol-notice", "hyundai-card-announcement", "the-weeknd-tour"],
  "relatedAlbums": ["After Hours", "Dawn FM", "Hurry Up Tomorrow"],
  "relatedSongs": [],
  "spoilerLevel": "none",
  "venue": "고양종합운동장 주경기장",
  "ageRestriction": "만 19세 이상",
  "opener": { "name": "Creepy Nuts" },
  "shows": [
    { "dateLabel": "2026.10.07 WED", "openerStartsAt": "2026-10-07T18:45:00+09:00", "startsAt": "2026-10-07T19:45:00+09:00" },
    { "dateLabel": "2026.10.08 THU", "openerStartsAt": "2026-10-08T18:45:00+09:00", "startsAt": "2026-10-08T19:45:00+09:00" }
  ],
  "archivePublished": false
}
```

Source JSON records use the names, URLs, kinds, and `2026-08-29` check date from the spec. The three setlist snapshot source URLs are:

```text
https://www.setlist.fm/setlist/the-weeknd/2026/etihad-stadium-manchester-england-334e2421.html
https://www.setlist.fm/setlist/the-weeknd/2026/wembley-stadium-london-england-73403ef9.html
https://www.setlist.fm/setlist/the-weeknd/2026/wembley-stadium-london-england-73403ef1.html
```

- [ ] **Step 6: Add typed collection queries**

```ts
// src/lib/content/queries.ts
import { getCollection } from 'astro:content';

export async function getConcert() {
  const entries = await getCollection('concert');
  const concert = entries.find((entry) => entry.id === 'goyang-2026');
  if (!concert) throw new Error('Missing concert record: goyang-2026');
  return concert;
}

export async function getExpectedSetlist() {
  return (await getCollection('setlist')).sort((a, b) => a.data.expectedOrder - b.data.expectedOrder);
}

export async function getShowRecords() {
  return (await getCollection('showRecords')).sort((a, b) => a.data.showDate.localeCompare(b.data.showDate));
}

export async function getDiscoverContent() {
  return (await getCollection('discover')).sort((a, b) => a.data.order - b.data.order);
}

export async function getGuideContent() {
  return (await getCollection('guides')).sort((a, b) => a.data.order - b.data.order);
}
```

- [ ] **Step 7: Verify schema generation and editorial guards**

Run: `npx astro sync && npm test -- content-audit.test.ts && npm run check && npm run build`

Expected: all commands exit `0`; the unit suite reports `3 passed`; Astro accepts every source reference.

- [ ] **Step 8: Commit**

```bash
git add src/content.config.ts src/lib/content src/data/archive src/data/concert src/data/sources tests/unit/content-audit.test.ts
git commit -m "feat(content): add verified editorial model"
```

---

### Task 3: DAWNFOLD Visual Foundation and Original Assets

**Files:**
- Create: `src/assets/visual/moon-surface.png`
- Create: `src/assets/visual/fog-night.png`
- Create: `src/assets/visual/fog-dawn.png`
- Create: `src/assets/visual/grain.png`
- Create: `src/assets/visual/README.md`
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Create: `src/styles/motion.css`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/chrome/SiteHeader.astro`
- Create: `src/components/chrome/SiteFooter.astro`
- Create: `public/favicon.svg`
- Modify: `src/pages/index.astro`
- Modify: `tests/e2e/navigation.spec.ts`

**Interfaces:**
- Consumes: static Astro foundation and the approved DAWNFOLD art direction.
- Produces: `<BaseLayout title description ogImage?>`, design tokens, original layered assets, semantic navigation, disclaimer, and native reduced-motion rules.

- [ ] **Step 1: Extend the E2E test for the shared shell**

```ts
test('exposes navigation and the unofficial disclaimer', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: '주요 메뉴' })).toBeVisible();
  await expect(page.getByText('비공식·비영리 팬 가이드', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '예상 셋리스트' })).toHaveAttribute('href', '/setlist/');
  await expect(page.getByRole('link', { name: '고양 가이드' })).toHaveAttribute('href', '/goyang/');
});
```

- [ ] **Step 2: Run the shell test and verify it fails**

Run: `npm run build && npm run test:e2e -- navigation.spec.ts`

Expected: FAIL because shared navigation and disclaimer are absent.

- [ ] **Step 3: Generate four original raster layers with the imagegen skill**

Use `imagegen` with each prompt separately, retaining transparent backgrounds where specified:

```text
moon-surface.png — A single cinematic full moon disc, centered, highly detailed but original crater texture, subtle deep-red rim light on the left and cobalt-blue rim light on the right, transparent background, no stars, no text, no logo, no person, no album-art composition, square 2048×2048.

fog-night.png — Wide transparent atmospheric fog layer for a black-and-deep-red concert-night scene, soft volumetric wisps concentrated along the lower third, empty upper field, no skyline, no person, no text, 2400×1400.

fog-dawn.png — Wide transparent atmospheric mist layer for a cobalt-to-amber dawn horizon, fine luminous haze along the lower third, empty upper field, no skyline, no person, no text, 2400×1400.

grain.png — Seamless monochrome fine film-grain texture, neutral gray, even density, no scratches, no vignette, no text, square 1024×1024.
```

Inspect each image before accepting it. Reject and regenerate any output containing faces, text, recognizable album/tour artwork, hard rectangular edges, or a baked background gradient. Record prompt, generation date, and intended layer in `src/assets/visual/README.md`.

- [ ] **Step 4: Define color, type, spacing, and motion tokens**

```css
/* src/styles/tokens.css */
:root {
  --night: #050507;
  --red: #a61f27;
  --blue: #2f63d8;
  --amber: #e6a359;
  --ivory: #f0e8da;
  --mist: #d7d8dc;
  --ink-muted: color-mix(in srgb, var(--ivory) 70%, transparent);
  --font-display: 'Bebas Neue', Impact, sans-serif;
  --font-body: 'Noto Sans KR Variable', system-ui, sans-serif;
  --content-max: 74rem;
  --gutter: clamp(1rem, 4vw, 4rem);
  --section-space: clamp(5rem, 13vw, 11rem);
  --motion-fast: 180ms;
  --motion-scene: 620ms;
  --ease-cinematic: cubic-bezier(0.22, 1, 0.36, 1);
}
```

Global CSS imports the two local font packages, resets margins, gives body a black-to-red-to-blue-to-amber section flow, styles `:focus-visible`, sets `min-height:44px` on interactive controls, and uses horizontal light/horizon gradients instead of repeated bordered cards.

- [ ] **Step 5: Build the shared layout and navigation**

```astro
---
// src/layouts/BaseLayout.astro
import '@fontsource/bebas-neue';
import '@fontsource-variable/noto-sans-kr';
import '../styles/tokens.css';
import '../styles/global.css';
import '../styles/motion.css';
import SiteFooter from '../components/chrome/SiteFooter.astro';
import SiteHeader from '../components/chrome/SiteHeader.astro';

interface Props { title: string; description: string; ogImage?: string }
const { title, description, ogImage = '/og/default.jpg' } = Astro.props;
const site = Astro.site ?? Astro.url;
const canonical = new URL(Astro.url.pathname, site);
---

<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <meta property="og:image" content={new URL(ogImage, site)} />
    <title>{title}</title>
  </head>
  <body>
    <a class="skip-link" href="#content">본문으로 건너뛰기</a>
    <SiteHeader />
    <main id="content"><slot /></main>
    <SiteFooter />
  </body>
</html>
```

Navigation labels are `홈`, `The Weeknd`, `예상 셋리스트`, `고양 가이드`, `출처·업데이트`. Footer text includes `비공식·비영리 팬 가이드` and a direct official ticket notice link.

- [ ] **Step 6: Add native transition and reduced-motion rules**

```css
/* src/styles/motion.css */
@view-transition { navigation: auto; }
::view-transition-old(root), ::view-transition-new(root) {
  animation-duration: var(--motion-scene);
  animation-timing-function: var(--ease-cinematic);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 7: Verify responsive shell and asset constraints**

Run: `npm run lint && npm run check && npm run build && npm run test:e2e -- navigation.spec.ts`

Expected: all commands exit `0`; both desktop and mobile projects pass; generated source assets have the provenance file.

- [ ] **Step 8: Commit**

```bash
git add src/assets src/styles src/layouts src/components/chrome public/favicon.svg src/pages/index.astro tests/e2e/navigation.spec.ts
git commit -m "feat(ui): establish DAWNFOLD visual system"
```

---

### Task 4: Eclipse Count and Moon Entrance Choreography

**Files:**
- Create: `src/lib/countdown.ts`
- Create: `tests/unit/countdown.test.ts`
- Create: `src/components/visual/EclipseCountdown.astro`
- Create: `src/components/home/HomeHero.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/styles/motion.css`
- Create: `tests/e2e/visual.spec.ts`

**Interfaces:**
- Consumes: `shows[].startsAt`, `archivePublished`, generated moon/fog layers, and reduced-motion preference.
- Produces: `getCountdownState(input: CountdownInput): CountdownState`, `<EclipseCountdown dayOneStart dayTwoStart archivePublished />`, and `<HomeHero concert />`.

- [ ] **Step 1: Write failing clock-state tests**

```ts
// tests/unit/countdown.test.ts
import { describe, expect, it } from 'vitest';
import { getCountdownState } from '../../src/lib/countdown';

const schedule = {
  dayOneStart: '2026-10-07T19:45:00+09:00',
  dayTwoStart: '2026-10-08T19:45:00+09:00',
  archivePublished: false,
};

describe('getCountdownState', () => {
  it('counts toward day one before the first show', () => {
    const state = getCountdownState({ ...schedule, now: new Date('2026-08-29T19:45:00+09:00') });
    expect(state.phase).toBe('before-day-one');
    expect(state.primaryLabel).toBe('D-39');
    expect(state.showClock).toBe(false);
  });

  it('switches to day two as soon as day one starts', () => {
    const state = getCountdownState({ ...schedule, now: new Date('2026-10-07T20:00:00+09:00') });
    expect(state.phase).toBe('before-day-two');
    expect(state.primaryLabel).toBe('D-1');
    expect(state.showClock).toBe(true);
  });

  it('uses D-DAY on the Seoul calendar date before showtime', () => {
    const state = getCountdownState({ ...schedule, now: new Date('2026-10-07T09:00:00+09:00') });
    expect(state.primaryLabel).toBe('D-DAY');
  });

  it('does not claim the archive before the editor publishes it', () => {
    const state = getCountdownState({ ...schedule, now: new Date('2026-10-08T20:00:00+09:00') });
    expect(state.phase).toBe('day-two-live');
    expect(state.primaryLabel).toBe('TONIGHT');
  });

  it('changes to the archive only after publication', () => {
    const state = getCountdownState({ ...schedule, archivePublished: true, now: new Date('2026-10-08T23:00:00+09:00') });
    expect(state.phase).toBe('archive');
    expect(state.primaryLabel).toBe('WE WERE HERE');
  });
});
```

- [ ] **Step 2: Run the clock tests and verify they fail**

Run: `npm test -- countdown.test.ts`

Expected: FAIL because `getCountdownState` is missing.

- [ ] **Step 3: Implement the pure countdown state machine**

```ts
// src/lib/countdown.ts
const DAY_MS = 86_400_000;
const seoulDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function calendarDaysUntil(now: Date, target: Date): number {
  const toUtcDay = (date: Date) => {
    const parts = Object.fromEntries(seoulDate.formatToParts(date).map(({ type, value }) => [type, value]));
    return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
  };
  return Math.max(0, Math.round((toUtcDay(target) - toUtcDay(now)) / DAY_MS));
}

export type CountdownPhase = 'before-day-one' | 'before-day-two' | 'day-two-live' | 'archive';
export type CountdownInput = {
  now: Date;
  dayOneStart: string;
  dayTwoStart: string;
  archivePublished: boolean;
};
export type CountdownState = {
  phase: CountdownPhase;
  primaryLabel: string;
  showClock: boolean;
  hours: number;
  minutes: number;
  seconds: number;
  accessibleLabel: string;
};

export function getCountdownState(input: CountdownInput): CountdownState {
  const now = input.now.getTime();
  const dayOneDate = new Date(input.dayOneStart);
  const dayTwoDate = new Date(input.dayTwoStart);
  const dayOne = dayOneDate.getTime();
  const dayTwo = dayTwoDate.getTime();

  if (input.archivePublished) return { phase: 'archive', primaryLabel: 'WE WERE HERE', showClock: false, hours: 0, minutes: 0, seconds: 0, accessibleLabel: '양일 공연 기록 보기' };
  if (now >= dayTwo) return { phase: 'day-two-live', primaryLabel: 'TONIGHT', showClock: false, hours: 0, minutes: 0, seconds: 0, accessibleLabel: '두 번째 고양 공연이 시작되었습니다' };

  const targetDate = now < dayOne ? dayOneDate : dayTwoDate;
  const target = targetDate.getTime();
  const phase = now < dayOne ? 'before-day-one' : 'before-day-two';
  const remaining = Math.max(0, target - now);
  const days = calendarDaysUntil(input.now, targetDate);
  const hours = Math.floor((remaining % DAY_MS) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);
  return {
    phase,
    primaryLabel: days === 0 ? 'D-DAY' : `D-${days}`,
    showClock: remaining <= DAY_MS,
    hours,
    minutes,
    seconds,
    accessibleLabel: `고양 공연까지 ${days}일 남았습니다`,
  };
}
```

- [ ] **Step 4: Run the clock tests and verify they pass**

Run: `npm test -- countdown.test.ts`

Expected: `5 passed`.

- [ ] **Step 5: Build semantic countdown markup before enhancement**

`EclipseCountdown.astro` renders the initial state on the server, keeps the changing visual digits inside `aria-hidden="true"`, and exposes one visually-hidden sentence with `aria-live="off"`. The element API is:

```astro
<eclipse-countdown
  data-day-one={dayOneStart}
  data-day-two={dayTwoStart}
  data-archive-published={String(archivePublished)}
  data-motion-scene
>
  <span class="sr-only" data-accessible-countdown aria-live="off">{initial.accessibleLabel}</span>
  <span class="eclipse-countdown__moon" aria-hidden="true">
    <span data-primary>{initial.primaryLabel}</span>
    <span data-shadow></span>
  </span>
  <time data-clock hidden={!initial.showClock} aria-hidden="true"></time>
</eclipse-countdown>
```

The browser script updates visual seconds every second but updates the hidden sentence only on initial load, target switch, and archive switch.

- [ ] **Step 6: Add the retained moon entrance and Eclipse transition**

On first viewport entry, dynamically import `animate` from `motion`; run one `620ms` sequence that moves the moon from `translate3d(18vw, 18vh, 0) scale(.86)` to its resting position while fog fades in. On the date label change, move the shadow once across the disc and replace the label at the midpoint. If `matchMedia('(prefers-reduced-motion: reduce)').matches`, skip the import and update text immediately.

Use only `transform`, `opacity`, and the shadow mask position. Stop controls and clear the one-second interval in `disconnectedCallback()`.

- [ ] **Step 7: Add motion and reduced-motion E2E assertions**

```ts
// tests/e2e/visual.spec.ts
import { expect, test } from '@playwright/test';

test('renders Eclipse Count inside the retained moon scene', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('eclipse-countdown')).toBeVisible();
  await expect(page.locator('[data-primary]')).toContainText(/^D-|TONIGHT|WE WERE HERE/);
});

test('reduced motion leaves the moon readable without a running animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('eclipse-countdown')).toHaveAttribute('data-motion-state', 'reduced');
  await expect(page.locator('[data-primary]')).toBeVisible();
});
```

- [ ] **Step 8: Run the visual prototype checkpoint**

Run: `npm run dev -- --host 127.0.0.1`, open the mobile and desktop home page, and capture the initial, resting, and reduced-motion states. Confirm the approved behavior: the original moon movement remains; Eclipse Count changes only the number/shadow; no split-flap panel appears; movement stops after entry.

- [ ] **Step 9: Verify and commit**

Run: `npm run lint && npm run check && npm test -- countdown.test.ts && npm run build && npm run test:e2e -- visual.spec.ts`

Expected: all commands exit `0`; unit suite reports `5 passed`; visual tests pass in both projects.

```bash
git add src/lib/countdown.ts src/components/visual/EclipseCountdown.astro src/components/home/HomeHero.astro src/pages/index.astro src/styles/motion.css tests/unit/countdown.test.ts tests/e2e/visual.spec.ts
git commit -m "feat(home): add Eclipse Count moon scene"
```

---

### Task 5: Pamphlet Home and Progressive Entry Points

**Files:**
- Create: `src/components/content/StatusBadge.astro`
- Create: `src/components/content/SourceList.astro`
- Create: `src/components/home/IntroSummary.astro`
- Create: `src/components/home/SetlistPreview.astro`
- Create: `src/components/home/GuideShortcuts.astro`
- Create: `src/components/home/FanNote.astro`
- Modify: `src/pages/index.astro`
- Modify: `tests/e2e/navigation.spec.ts`

**Interfaces:**
- Consumes: `getConcert()`, `getExpectedSetlist()`, trust labels, and `<HomeHero>`.
- Produces: a four-block home page and reusable `<StatusBadge status />` and `<SourceList sourceRefs />`.

- [ ] **Step 1: Write failing home-priority tests**

```ts
test('shows concert facts and four lightweight entry blocks', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('2026.10.07—08')).toBeVisible();
  await expect(page.getByText('고양종합운동장 주경기장')).toBeVisible();
  await expect(page.getByRole('heading', { name: '3분 만에 The Weeknd 알기' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '예상 셋리스트' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '고양 가이드' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '팬의 한마디' })).toBeVisible();
});

test('keeps the complete predicted list collapsed by default', async ({ page }) => {
  await page.goto('/');
  const disclosure = page.getByRole('group', { name: '전체 예상 셋리스트' });
  await expect(disclosure).not.toHaveAttribute('open', '');
  await expect(page.getByText('예상 · 보장 아님').first()).toBeVisible();
});
```

- [ ] **Step 2: Run the tests and verify missing blocks fail**

Run: `npm run build && npm run test:e2e -- navigation.spec.ts`

Expected: FAIL on the four headings and setlist disclosure.

- [ ] **Step 3: Build reusable trust and source components**

`StatusBadge.astro` accepts `status: TrustStatus`, maps through `STATUS_LABELS`, and renders `<span class="status" data-status={status}>`. `SourceList.astro` accepts resolved source entries, opens external links in a new tab, includes `rel="noreferrer"`, and prints `마지막 확인 YYYY.MM.DD`.

- [ ] **Step 4: Compose the home page with only four editorial blocks**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import FanNote from '../components/home/FanNote.astro';
import GuideShortcuts from '../components/home/GuideShortcuts.astro';
import HomeHero from '../components/home/HomeHero.astro';
import IntroSummary from '../components/home/IntroSummary.astro';
import SetlistPreview from '../components/home/SetlistPreview.astro';
import { getConcert, getExpectedSetlist } from '../lib/content/queries';

const concert = await getConcert();
const setlist = await getExpectedSetlist();
---

<BaseLayout title="The Weeknd 고양 팬 가이드" description="공연을 더 깊이 즐기기 위한 비공식·비영리 디지털 팜플렛">
  <HomeHero concert={concert} />
  <IntroSummary />
  <SetlistPreview entries={setlist} previewCount={6} />
  <GuideShortcuts />
  <FanNote />
</BaseLayout>
```

`SetlistPreview` uses native `<details aria-label="전체 예상 셋리스트">`; its summary says `전체 목록 펼쳐보기`. The first six titles remain visible before the disclosure. Guide shortcuts are `가는 길`, `준비물`, and `귀가 확인`, all linking to anchored sections on `/goyang/`.

- [ ] **Step 5: Verify the 10-second information path**

Run: `npm run check && npm run build && npm run test:e2e -- navigation.spec.ts`

Expected: both viewports pass; date, venue, discover, setlist, and guide entry points are present without opening a menu.

- [ ] **Step 6: Commit**

```bash
git add src/components/content src/components/home src/pages/index.astro tests/e2e/navigation.spec.ts
git commit -m "feat(home): compose fan pamphlet entry page"
```

---

### Task 6: Discover The Weeknd Without Encyclopedia Weight

**Files:**
- Create: `src/data/discover/01-intro.md`
- Create: `src/data/discover/10-2011-mixtapes.md`
- Create: `src/data/discover/20-kiss-land.md`
- Create: `src/data/discover/30-pop-breakthrough.md`
- Create: `src/data/discover/40-starboy.md`
- Create: `src/data/discover/50-my-dear-melancholy.md`
- Create: `src/data/discover/60-after-hours.md`
- Create: `src/data/discover/70-dawn-fm.md`
- Create: `src/data/discover/80-hurry-up-tomorrow.md`
- Create: `src/data/discover/90-glossary.md`
- Create: `src/data/discover/95-visual-language.md`
- Create: `src/components/discover/CareerTimeline.astro`
- Create: `src/components/discover/TrilogyExplainer.astro`
- Create: `src/pages/discover.astro`
- Modify: `tests/e2e/navigation.spec.ts`

**Interfaces:**
- Consumes: `getDiscoverContent()`, source references, and official artist sources from the spec.
- Produces: a one-minute summary, progressive career timeline, six-album discography distinction, two-trilogy distinction, glossary, and separately labeled fan interpretation.

- [ ] **Step 1: Write failing factual-structure tests**

```ts
test('distinguishes the six studio albums from both trilogies', async ({ page }) => {
  await page.goto('/discover/');
  await expect(page.getByRole('heading', { name: '정규 앨범 6장' })).toBeVisible();
  await expect(page.getByText('House of Balloons → Thursday → Echoes of Silence')).toBeVisible();
  await expect(page.getByText('After Hours → Dawn FM → Hurry Up Tomorrow')).toBeVisible();
  await expect(page.getByText('한 가지 해석')).toBeVisible();
});
```

- [ ] **Step 2: Run the test and verify the route is missing**

Run: `npm run build && npm run test:e2e -- navigation.spec.ts`

Expected: FAIL because `/discover/` returns `404`.

- [ ] **Step 3: Author concise, sourced entries**

Each Markdown file uses the common schema. Keep `summary` to one sentence and body to three short paragraphs or fewer. Cover these exact distinctions:

```text
2011: three original mixtapes
2012: Trilogy is a compilation of the mixtapes, not a studio album
2013: Kiss Land begins the six studio-album sequence
2015: Beauty Behind the Madness
2016: Starboy
2018: My Dear Melancholy, is an EP
2020: After Hours, recent trilogy part 1
2022: Dawn FM, recent trilogy part 2
2025: Hurry Up Tomorrow, recent trilogy part 3
```

Use official label/artist sources for classification. Put `사망 → 연옥 → 환생` only inside a block labeled `한 가지 해석`; do not state it as a canonical plot. The NamuWiki PDF may guide term selection but is never listed as the sole source for a fact.

- [ ] **Step 4: Render progressive depth**

`CareerTimeline.astro` shows the one-sentence summaries by default and places the rendered Markdown body inside native `<details>`. `TrilogyExplainer.astro` renders the early mixtape trilogy and recent album trilogy side by side on wide screens, as one reading sequence on mobile, without rounded cards.

- [ ] **Step 5: Verify factual hierarchy and reading weight**

Run: `npm run check && npm run build && npm run test:e2e -- navigation.spec.ts`

Expected: route passes in both projects; every deep section is keyboard operable; the six studio albums and two trilogy definitions are visible.

- [ ] **Step 6: Commit**

```bash
git add src/data/discover src/components/discover src/pages/discover.astro tests/e2e/navigation.spec.ts
git commit -m "feat(discover): add progressive artist guide"
```

---

### Task 7: Expected Setlist Editorial Dataset

**Files:**
- Create: `src/data/setlist/01-baptized-in-fear.json`
- Create: `src/data/setlist/02-open-hearts.json`
- Create: `src/data/setlist/03-wake-me-up.json`
- Create: `src/data/setlist/04-after-hours.json`
- Create: `src/data/setlist/05-starboy.json`
- Create: `src/data/setlist/06-heartless.json`
- Create: `src/data/setlist/07-faith.json`
- Create: `src/data/setlist/08-cry-for-me.json`
- Create: `src/data/setlist/09-sao-paulo.json`
- Create: `src/data/setlist/10-until-were-skin-and-bones.json`
- Create: `src/data/setlist/11-take-my-breath.json`
- Create: `src/data/setlist/12-sacrifice.json`
- Create: `src/data/setlist/13-how-do-i-make-you-love-me.json`
- Create: `src/data/setlist/14-cant-feel-my-face.json`
- Create: `src/data/setlist/15-lost-in-the-fire.json`
- Create: `src/data/setlist/16-often.json`
- Create: `src/data/setlist/17-given-up-on-me.json`
- Create: `src/data/setlist/18-i-was-never-there.json`
- Create: `src/data/setlist/19-the-hills.json`
- Create: `src/data/setlist/20-timeless.json`
- Create: `src/data/setlist/21-rather-lie.json`
- Create: `src/data/setlist/22-creepin.json`
- Create: `src/data/setlist/23-niagara-falls.json`
- Create: `src/data/setlist/24-one-of-the-girls.json`
- Create: `src/data/setlist/25-stargirl-interlude.json`
- Create: `src/data/setlist/26-out-of-time.json`
- Create: `src/data/setlist/27-i-feel-it-coming.json`
- Create: `src/data/setlist/28-die-for-you.json`
- Create: `src/data/setlist/29-is-there-someone-else.json`
- Create: `src/data/setlist/30-wicked-games.json`
- Create: `src/data/setlist/31-call-out-my-name.json`
- Create: `src/data/setlist/32-the-abyss.json`
- Create: `src/data/setlist/33-save-your-tears.json`
- Create: `src/data/setlist/34-less-than-zero.json`
- Create: `src/data/setlist/35-blinding-lights.json`
- Create: `src/data/setlist/36-without-a-warning.json`
- Create: `src/data/setlist/37-house-of-balloons.json`
- Create: `src/data/setlist/38-moth-to-a-flame.json`
- Modify: `src/lib/content/audit.ts`
- Modify: `tests/unit/content-audit.test.ts`

**Interfaces:**
- Consumes: `getExpectedSetlist()`, three setlist snapshot sources, song metadata, and verified official listen URLs.
- Produces: 38 sequential `SetlistRecord` entries and `auditSetlistRecords(records): AuditIssue[]`.

- [ ] **Step 1: Write failing dataset-safety tests**

```ts
import { auditSetlistRecords } from '../../src/lib/content/audit';

it('rejects duplicate orders, official status, and fewer than three observations', () => {
  const issues = auditSetlistRecords([
    { id: 'one', expectedOrder: 1, status: 'expected', observedInCount: 3 },
    { id: 'two', expectedOrder: 1, status: 'official', observedInCount: 2 },
  ]);
  expect(issues).toEqual([
    { id: 'two', code: 'duplicate-expected-order' },
    { id: 'two', code: 'setlist-must-be-expected' },
    { id: 'two', code: 'setlist-observations-below-3' },
  ]);
});
```

- [ ] **Step 2: Run the audit test and verify the new function is missing**

Run: `npm test -- content-audit.test.ts`

Expected: FAIL because `auditSetlistRecords` is not exported.

- [ ] **Step 3: Implement the pure ordered-record audit**

`auditSetlistRecords` walks records in file order, tracks seen `expectedOrder` values, requires status `expected`, requires at least three `observedIn` references, and returns issues in duplicate/status/observation order for each record. It does not perform I/O, so the unit test remains deterministic.

- [ ] **Step 4: Populate the ordered baseline from three snapshots**

Start from the 42-position Manchester 2026-06-12 sequence, compare London 2026-08-14 and 2026-08-15, and create the 38 listed performed-song records. Do not create standalone song entries for tape-only transitions such as `I Can't Fucking Sing`, `Eva`, `Professional`, or `Given Up on Me` part-two tape. Keep `RATHER LIE` in position 21 only as a `low`-confidence guest-dependent possibility; its summary must say Playboi Carti's presence drove the European performance and that Goyang inclusion is uncertain.

Every included record follows this exact shape:

```json
{
  "title": "Baptized in Fear",
  "summary": "Hurry Up Tomorrow의 불안과 정화 이미지를 여는 곡",
  "body": "공연의 첫 장면과 최근 앨범 3부작의 마지막 장을 연결해 듣는다.",
  "status": "expected",
  "lastVerifiedAt": "2026-08-29",
  "sources": ["setlist-manchester-2026-06-12", "setlist-london-2026-08-14", "setlist-london-2026-08-15"],
  "relatedAlbums": ["Hurry Up Tomorrow"],
  "relatedSongs": [],
  "spoilerLevel": "titles",
  "expectedOrder": 1,
  "songTitle": "Baptized in Fear",
  "album": "Hurry Up Tomorrow",
  "liveNote": "오프닝의 어둠과 첫 조명 전환을 본다.",
  "singAlongNote": "곡 제목이 반복되는 짧은 구간만 안내하고 가사를 길게 싣지 않는다.",
  "confidence": "high",
  "officialListenUrl": "https://www.youtube.com/@TheWeeknd",
  "observedIn": ["setlist-manchester-2026-06-12", "setlist-london-2026-08-14", "setlist-london-2026-08-15"]
}
```

Replace the channel-level listen URL with an exact official song URL only after opening and verifying it. If an exact official URL is unavailable, omit `officialListenUrl`; never substitute an unofficial upload.

- [ ] **Step 5: Verify all 38 records**

Run: `npx astro sync && npm test -- content-audit.test.ts && npm run check && npm run build`

Expected: all commands exit `0`; files have unique orders `1–38`; every record is `expected`; each record references all three snapshots.

- [ ] **Step 6: Commit**

```bash
git add src/data/setlist src/lib/content/audit.ts tests/unit/content-audit.test.ts
git commit -m "content: add expected setlist baseline"
```

---

### Task 8: Setlist Explorer and Post-show Comparison

**Files:**
- Create: `src/components/content/OfficialEmbed.astro`
- Create: `src/components/setlist/SetlistExplorer.astro`
- Create: `src/pages/setlist.astro`
- Modify: `src/components/home/SetlistPreview.astro`
- Modify: `tests/e2e/navigation.spec.ts`

**Interfaces:**
- Consumes: `getExpectedSetlist()`, `getShowRecords()`, three setlist snapshot sources, song metadata, and official listen URLs.
- Produces: an ordered, collapsed-by-default predicted setlist with album, context, live note, sing-along note, confidence, status, lazy official-media fallback, and a post-show actual-setlist section when records exist.

- [ ] **Step 1: Write failing setlist-behavior tests**

```ts
test('presents the setlist as a prediction with expandable song context', async ({ page }) => {
  await page.goto('/setlist/');
  await expect(page.getByRole('heading', { name: '예상 셋리스트' })).toBeVisible();
  await expect(page.getByText('예상 · 보장 아님').first()).toBeVisible();
  await expect(page.getByText('최근 2026년 공연 3회 비교')).toBeVisible();
  const firstSong = page.getByRole('button', { name: /01.*Baptized in Fear/ });
  await firstSong.click();
  await expect(page.getByText('공연 전에 알면 좋은 한 문장')).toBeVisible();
  await expect(page.getByText('떼창 포인트')).toBeVisible();
});
```

- [ ] **Step 2: Run the test and verify the route is missing**

Run: `npm run build && npm run test:e2e -- navigation.spec.ts`

Expected: FAIL because `/setlist/` is absent.

- [ ] **Step 3: Build the no-JavaScript-first explorer**

`SetlistExplorer.astro` renders an ordered list of native `<details>` elements. The summary accessible name is `${String(expectedOrder).padStart(2, '0')} ${songTitle}`. The open panel contains headings `공연 전에 알면 좋은 한 문장`, `무대에서 볼 것`, `떼창 포인트`, and `출처`. Optional enhancement closes the previously open item when another opens, but native multiple-open behavior remains when JavaScript is unavailable.

When `getShowRecords()` returns records, render them above the prediction under `공연 후 확인된 셋리스트`. Keep the prediction below for comparison. Only when `archivePublished` is true does the page heading change to `WE WERE HERE`; before that, an incomplete day-one record is labeled `1일차 공연 후 확인` without implying the second night is known.

- [ ] **Step 4: Add lazy official-media enhancement and fallback**

`OfficialEmbed.astro` renders a normal official link first. Only after the user selects `공식 영상 불러오기` does it create an iframe with `loading="lazy"`, a descriptive title, and the provider allowlist. On iframe error or timeout after eight seconds, remove it and keep the direct official link visible.

- [ ] **Step 5: Verify setlist order, trust, and keyboard access**

Run: `npx astro sync && npm run check && npm run build && npm run test:e2e -- navigation.spec.ts`

Expected: the route passes; records are strictly ordered with no duplicate `expectedOrder`; no entry uses `official`; disclosures work with Enter and Space.

- [ ] **Step 6: Commit**

```bash
git add src/components/content/OfficialEmbed.astro src/components/setlist src/components/home/SetlistPreview.astro src/pages/setlist.astro tests/e2e/navigation.spec.ts
git commit -m "feat(setlist): add sourced expected show guide"
```

---

### Task 9: Goyang Day-of Guide and Honest Unknowns

**Files:**
- Create: `src/data/guides/01-official-info.md`
- Create: `src/data/guides/10-transport.md`
- Create: `src/data/guides/20-arrival.md`
- Create: `src/data/guides/30-return.md`
- Create: `src/data/guides/40-packing.md`
- Create: `src/data/guides/50-pending-operations.md`
- Create: `src/components/guide/GuideSection.astro`
- Create: `src/components/guide/VenueMap.astro`
- Create: `src/pages/goyang.astro`
- Modify: `tests/e2e/navigation.spec.ts`

**Interfaces:**
- Consumes: concert data, official/public transit sources, and `getGuideContent()`.
- Produces: anchored transport, arrival, return, packing, and unpublished-operation sections plus an original schematic venue map.

- [ ] **Step 1: Write failing two-action guide tests**

```ts
test('opens transport and return information within two actions', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '가는 길' }).click();
  await expect(page).toHaveURL(/\/goyang\/#transport$/);
  await expect(page.getByRole('heading', { name: '가는 길' })).toBeVisible();
  await expect(page.getByText('대화역')).toBeVisible();
  await expect(page.getByText('공연 직전 막차 재확인')).toBeVisible();
});
```

- [ ] **Step 2: Run the test and verify the route is missing**

Run: `npm run build && npm run test:e2e -- navigation.spec.ts`

Expected: FAIL on `/goyang/#transport`.

- [ ] **Step 3: Author official, practical, and pending sections**

Use `official` only for date, venue, opener, show time, age restriction, and ticket source. Describe 대화역, GTX-A, and buses as route options with links to public transport services, not guaranteed travel times. Place `공연 직전 막차 재확인` beside the return section.

The pending section must list these items with `unpublished` status: entry gates, prohibited items, shuttle/traffic control, accessibility support, standing/Early Entry operation. Do not copy rules from other concerts.

- [ ] **Step 4: Draw an original schematic SVG map**

`VenueMap.astro` contains semantic SVG with `<title>대화역과 고양종합운동장 위치 관계 개략도</title>` and `<desc>실제 입장 게이트가 아닌 이동 방향 참고용 개략도</desc>`. Show only the station, pedestrian direction, main stadium silhouette, and `입장 게이트 추후 공식 확인` label. Provide direct external links to the public map and Goyang BIS below the SVG.

- [ ] **Step 5: Compose the anchored guide route**

Each `GuideSection` gets a stable `id` matching `official`, `transport`, `arrival`, `return`, `packing`, or `pending`, renders the status and last verification date before the Markdown body, and keeps headings visible above any atmospheric art.

- [ ] **Step 6: Verify unknown-state honesty and mobile navigation**

Run: `npm run check && npm run build && npm run test:e2e -- navigation.spec.ts`

Expected: transport test passes in both projects; all five pending items show `미공개 · 확인 필요`; map description explicitly says it is schematic.

- [ ] **Step 7: Commit**

```bash
git add src/data/guides src/components/guide src/pages/goyang.astro tests/e2e/navigation.spec.ts
git commit -m "feat(guide): add Goyang concert day guide"
```

---

### Task 10: Sources, Update History, and Publication Audit

**Files:**
- Create: `src/pages/sources.astro`
- Modify: `src/lib/content/audit.ts`
- Modify: `tests/unit/content-audit.test.ts`
- Modify: `package.json`
- Create: `docs/content-update-runbook.md`

**Interfaces:**
- Consumes: all collections, trust statuses, and the approved update calendar.
- Produces: a public source/update page, `auditPublishedContent(input): AuditIssue[]`, `npm run audit:content`, and an operator runbook.

- [ ] **Step 1: Add failing audit cases for stale and missing update metadata**

```ts
it('flags changing practical information older than seven days', () => {
  const issues = auditPublishedContent({
    now: new Date('2026-10-05T00:00:00+09:00'),
    entries: [{ id: 'transport', status: 'official', lastVerifiedAt: new Date('2026-09-20'), sourceCount: 2, volatile: true }],
  });
  expect(issues).toContainEqual({ id: 'transport', code: 'volatile-content-stale' });
});
```

- [ ] **Step 2: Run the audit test and verify the new function is missing**

Run: `npm test -- content-audit.test.ts`

Expected: FAIL with `auditPublishedContent is not exported`.

- [ ] **Step 3: Implement deterministic publication checks**

`auditPublishedContent` checks: volatile guide entries are no more than seven days old; every non-`unpublished` entry has at least one source; concert core facts have two primary sources; setlist status is `expected`; every setlist record has three `observedIn` references; and `archivePublished` cannot be true until actual day-one and day-two records exist.

Add `"audit:content": "vitest run tests/unit/content-audit.test.ts"` and place it before build in `verify`.

- [ ] **Step 4: Render public provenance and update checkpoints**

`/sources/` groups sources into `공식`, `공공 교통`, `공연 기록`, and `보조 참고`. It displays last-check dates and this update schedule: Tokyo Sep 19–20, Jakarta Sep 26–27, Singapore Oct 2–3, final Goyang official check Oct 4–6, day-one archive Oct 7, day-two archive Oct 8. The NamuWiki PDF appears only under `보조 참고` with the wording `누락 탐색용·핵심 사실 근거 아님`.

- [ ] **Step 5: Write the exact content update runbook**

`docs/content-update-runbook.md` instructs the operator to: open official sources first; update `lastCheckedAt`; keep unknown operational facts unpublished; add each Asia setlist snapshot as a new source; change `observedIn` and confidence only after comparison; run `npm run audit:content && npm run build`; and use the exact refresh commits `content: refresh Tokyo verification`, `content: refresh Jakarta verification`, `content: refresh Singapore verification`, and `content: refresh Goyang operations`.

After each Goyang show, add `src/data/archive/goyang-2026-10-07.json` or `src/data/archive/goyang-2026-10-08.json` with `post-show` status, ordered performed songs, at least two verification sources, and the actual check date. Set `archivePublished` to `true` only after both records exist and pass the audit.

- [ ] **Step 6: Verify and commit**

Run: `npm run audit:content && npm run check && npm run build`

Expected: all commands exit `0`; the sources page is emitted to `dist/sources/index.html`.

```bash
git add src/pages/sources.astro src/lib/content/audit.ts tests/unit/content-audit.test.ts package.json package-lock.json docs/content-update-runbook.md
git commit -m "feat(content): add source audit and runbook"
```

---

### Task 11: Browser-only D-day Ticket and Setlist Card

**Files:**
- Create: `src/lib/share/buildTicketLayout.ts`
- Create: `src/lib/share/buildSetlistCardLayout.ts`
- Create: `src/lib/share/canvas.ts`
- Create: `src/lib/share/download.ts`
- Create: `src/components/share/TicketBuilder.astro`
- Create: `src/components/share/SetlistCardBuilder.astro`
- Create: `src/pages/share/ticket.astro`
- Create: `src/pages/share/setlist.astro`
- Create: `tests/unit/ticket-layout.test.ts`
- Create: `tests/unit/setlist-layout.test.ts`
- Create: `tests/e2e/share.spec.ts`

**Interfaces:**
- Consumes: concert dates, expected setlist, DAWNFOLD colors/fonts, current setlist version, and browser Canvas.
- Produces: `buildTicketLayout(payload): DrawCommand[]`, `buildSetlistCardLayout(payload): DrawCommand[]`, `renderCommands(canvas, commands): Promise<Blob>`, and downloadable 1080×1350 JPEG images without network storage.

- [ ] **Step 1: Write failing pure-layout tests**

```ts
// tests/unit/ticket-layout.test.ts
import { expect, test } from 'vitest';
import { buildTicketLayout } from '../../src/lib/share/buildTicketLayout';

test('includes the show date, three songs, and fan-made disclaimer', () => {
  const commands = buildTicketLayout({
    showDate: '2026-10-07',
    dDayLabel: 'D-39',
    songs: ['After Hours', 'Wake Me Up', 'Blinding Lights'],
  });
  const text = commands.filter((command) => command.kind === 'text').map((command) => command.value);
  expect(text).toEqual(expect.arrayContaining(['2026.10.07', 'D-39', 'After Hours', 'Wake Me Up', 'Blinding Lights', 'UNOFFICIAL FAN GUIDE']));
});
```

```ts
// tests/unit/setlist-layout.test.ts
import { expect, test } from 'vitest';
import { buildSetlistCardLayout } from '../../src/lib/share/buildSetlistCardLayout';

test('prints version and prediction warning on the poster', () => {
  const commands = buildSetlistCardLayout({ version: '2026-08-29', songs: ['Baptized in Fear', 'Open Hearts'] });
  const text = commands.filter((command) => command.kind === 'text').map((command) => command.value);
  expect(text).toEqual(expect.arrayContaining(['UPDATED 2026.08.29', '예상 · 보장 아님']));
});
```

- [ ] **Step 2: Run the unit tests and verify missing render models fail**

Run: `npm test -- ticket-layout.test.ts setlist-layout.test.ts`

Expected: FAIL with unresolved share modules.

- [ ] **Step 3: Implement testable draw-command contracts**

```ts
export type DrawCommand =
  | { kind: 'fill'; color: string }
  | { kind: 'line'; from: [number, number]; to: [number, number]; color: string; width: number }
  | { kind: 'text'; value: string; x: number; y: number; font: string; color: string; align?: CanvasTextAlign };
```

`buildTicketLayout` and `buildSetlistCardLayout` return commands only; no browser global appears in these modules. Use 1080×1350 coordinates, black background, one diagonal red/blue light division, amber date accent, and no copied logos.

- [ ] **Step 4: Implement browser Canvas rendering and safe download**

`renderCommands` waits for `document.fonts.ready`, draws commands to a 1080×1350 canvas, and resolves a JPEG Blob at quality `0.92`. `download.ts` creates an object URL, clicks a temporary `<a download>`, revokes the URL, and throws a visible error when Blob creation fails.

- [ ] **Step 5: Build semantic selection forms**

`TicketBuilder` uses a radio group for Oct 7/Oct 8 and three required `<select>` controls for songs. Disable duplicate choices and the download button until three unique songs exist. `SetlistCardBuilder` requires no personal input and prints the current update version. Both builders state `이미지는 이 브라우저 안에서만 생성되며 선택값을 저장하지 않습니다.`

- [ ] **Step 6: Add browser tests for private download behavior**

```ts
// tests/e2e/share.spec.ts
import { expect, test } from '@playwright/test';

test('creates a ticket download without a submission request', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/share/ticket/');
  await page.getByLabel('첫 번째 곡').selectOption({ index: 1 });
  await page.getByLabel('두 번째 곡').selectOption({ index: 2 });
  await page.getByLabel('세 번째 곡').selectOption({ index: 3 });
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'D-day 티켓 저장' }).click();
  expect((await download).suggestedFilename()).toBe('weeknd-goyang-dday-ticket.jpg');
  expect(requests.some((url) => /\/api\//.test(url))).toBe(false);
});
```

- [ ] **Step 7: Verify and commit**

Run: `npm test -- ticket-layout.test.ts setlist-layout.test.ts && npm run check && npm run build && npm run test:e2e -- share.spec.ts`

Expected: both unit files and both E2E projects pass; no API request occurs.

```bash
git add src/lib/share src/components/share src/pages/share tests/unit/ticket-layout.test.ts tests/unit/setlist-layout.test.ts tests/e2e/share.spec.ts
git commit -m "feat(share): add private fan card exports"
```

---

### Task 12: Search, Structured Event Data, and Share Preview

**Files:**
- Create: `src/lib/seo/eventJsonLd.ts`
- Create: `tests/unit/event-json-ld.test.ts`
- Create: `public/og/default.jpg`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/index.astro`
- Modify: `astro.config.mjs`

**Interfaces:**
- Consumes: concert data, `PUBLIC_SITE_URL`, and original DAWNFOLD visuals.
- Produces: `buildEventJsonLd(concert, siteUrl)`, canonical/OG/Twitter metadata, two `MusicEvent` JSON-LD objects, sitemap, and a 1200×630 preview image.

- [ ] **Step 1: Write the failing event metadata test**

```ts
import { expect, test } from 'vitest';
import { buildEventJsonLd } from '../../src/lib/seo/eventJsonLd';

test('emits one MusicEvent per Goyang date', () => {
  const events = buildEventJsonLd({
    venue: '고양종합운동장 주경기장',
    shows: [
      { startsAt: '2026-10-07T19:45:00+09:00' },
      { startsAt: '2026-10-08T19:45:00+09:00' },
    ],
  }, 'https://fan-guide.test');
  expect(events).toHaveLength(2);
  expect(events[0]).toMatchObject({ '@type': 'MusicEvent', eventStatus: 'https://schema.org/EventScheduled' });
});
```

- [ ] **Step 2: Run the test and verify the SEO module is missing**

Run: `npm test -- event-json-ld.test.ts`

Expected: FAIL with unresolved `eventJsonLd` import.

- [ ] **Step 3: Implement conservative JSON-LD**

Each event includes `name`, `startDate`, `eventStatus`, `eventAttendanceMode`, `location` with venue and `Goyang-si, Gyeonggi-do, KR`, performer `The Weeknd`, organizer `현대카드`, and the official NOL ticket URL. Do not invent ticket prices, availability, door time, end time, or coordinates.

- [ ] **Step 4: Generate the original default OG image**

Use the approved moon texture and DAWNFOLD layers to create a 1200×630 image with text `THE WEEKND · GOYANG`, `2026.10.07—08`, `UNOFFICIAL FAN GUIDE`, and `고양종합운동장`. Do not include the XO logo, official tour lockup, artist portrait, album artwork, or sponsor marks. Save as `public/og/default.jpg` under `220KB`.

- [ ] **Step 5: Complete metadata in BaseLayout**

Add `og:title`, `og:description`, `og:type=website`, `og:url`, `twitter:card=summary_large_image`, and the absolute OG image URL. Home injects JSON-LD with `<script type="application/ld+json" set:html={JSON.stringify(events)} />`. `astro.config.mjs` keeps sitemap generation tied to `PUBLIC_SITE_URL`.

- [ ] **Step 6: Verify and commit**

Run: `npm test -- event-json-ld.test.ts && PUBLIC_SITE_URL=https://fan-guide.test npm run build`

Expected: test passes; `dist/sitemap-index.xml` exists; built home contains two `MusicEvent` records and absolute OG URLs.

```bash
git add src/lib/seo src/layouts/BaseLayout.astro src/pages/index.astro public/og/default.jpg astro.config.mjs tests/unit/event-json-ld.test.ts
git commit -m "feat(seo): add event metadata and OG preview"
```

---

### Task 13: Accessibility, No-JavaScript, and Performance Gates

**Files:**
- Create: `tests/e2e/accessibility.spec.ts`
- Create: `tests/e2e/no-js.spec.ts`
- Modify: `tests/e2e/visual.spec.ts`
- Create: `scripts/check-performance-budget.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: the complete production build.
- Produces: automated axe, keyboard, no-JavaScript, reduced-motion, JS gzip, and raster payload gates.

- [ ] **Step 1: Add failing accessibility and no-JavaScript tests**

```ts
// tests/e2e/accessibility.spec.ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const path of ['/', '/discover/', '/setlist/', '/goyang/', '/sources/']) {
  test(`${path} has no serious axe violations`, async ({ page }) => {
    await page.goto(path);
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations.filter((item) => ['critical', 'serious'].includes(item.impact ?? ''))).toEqual([]);
  });
}
```

```ts
// tests/e2e/no-js.spec.ts
import { expect, test } from '@playwright/test';

test.use({ javaScriptEnabled: false });

test('keeps essential guide content available', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('고양종합운동장 주경기장')).toBeVisible();
  await page.goto('/setlist/');
  await expect(page.getByText('예상 · 보장 아님').first()).toBeVisible();
  await page.goto('/goyang/');
  await expect(page.getByRole('heading', { name: '가는 길' })).toBeVisible();
});
```

- [ ] **Step 2: Run the new gates and record real failures**

Run: `npm run build && npm run test:e2e -- accessibility.spec.ts no-js.spec.ts visual.spec.ts`

Expected: any semantic, contrast, focus, or enhancement-only content defects fail with exact selectors; fix each defect at its owning component instead of suppressing axe rules.

- [ ] **Step 3: Add a built-asset budget script**

```js
// scripts/check-performance-budget.mjs
import { gzipSync } from 'node:zlib';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = new URL('../dist/', import.meta.url);
const files = await walk(root.pathname);
const scripts = files.filter((file) => file.endsWith('.js'));
const rasters = files.filter((file) => /\.(avif|webp|png|jpe?g)$/.test(file));
const jsGzip = scripts.reduce(async (sumPromise, file) => (await sumPromise) + gzipSync(await readFile(file)).byteLength, Promise.resolve(0));
const rasterBytes = rasters.reduce(async (sumPromise, file) => (await sumPromise) + (await stat(file)).size, Promise.resolve(0));

if ((await jsGzip) > 75 * 1024) throw new Error(`JavaScript gzip budget exceeded: ${await jsGzip}`);
if ((await rasterBytes) > 1100 * 1024) throw new Error(`Site raster budget exceeded: ${await rasterBytes}`);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : path.join(directory, entry.name)))).flat();
}
```

This aggregate build gate complements page-level browser inspection. Add `"budget": "node scripts/check-performance-budget.mjs"` after `build` in `verify`.

- [ ] **Step 4: Perform manual mobile performance evidence capture**

Against `npm run preview`, inspect the home page at 390×844 with network cache disabled. Record in the implementation task notes: total transferred raster bytes, total transferred JavaScript, CLS from the Performance panel, whether any long task exceeds 50ms during the moon entry, and whether scrolling remains responsive while the scene settles. Optimize or remove layers until Global Constraints pass.

- [ ] **Step 5: Run the full local quality gate**

Run: `npm run verify && npm run budget`

Expected: lint, format, Astro check, unit tests, build, all E2E projects, axe, no-JavaScript, and budget checks exit `0`.

- [ ] **Step 6: Commit**

```bash
git add tests/e2e scripts/check-performance-budget.mjs package.json package-lock.json
git commit -m "test: enforce access and performance budgets"
```

---

### Task 14: CI, Netlify Static Delivery, and Launch Verification

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `netlify.toml`
- Modify: `README.md`
- Modify: `docs/content-update-runbook.md`

**Interfaces:**
- Consumes: `npm run verify`, static `dist/`, and `PUBLIC_SITE_URL`.
- Produces: repeatable CI, preview/production hosting configuration, security headers, cache policy, and launch checklist.

- [ ] **Step 1: Add CI that proves a clean clone can build**

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22.12.0'
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run verify
      - run: npm run budget
```

- [ ] **Step 2: Configure portable Netlify static hosting**

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22.12.0"

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"

[[headers]]
  for = "/_astro/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

Set `PUBLIC_SITE_URL` in Netlify to the final HTTPS origin before the production build. No Netlify adapter is installed because output is fully static.

- [ ] **Step 3: Document local and launch operations**

README commands are exactly `npm ci`, `npm run dev`, `npm run verify`, and `PUBLIC_SITE_URL=https://fan-guide.test npm run build` for local production-shape verification. Netlify's production environment replaces `PUBLIC_SITE_URL` with the HTTPS origin assigned to the deployed site. The launch checklist requires: official disclaimer visible; Oct 7/8 dates correct; ticket link official; expected label visible on page and generated poster; pending guide facts unpublished; OG preview inspected in Kakao/X tools; mobile and reduced-motion smoke tests; content audit check date current.

- [ ] **Step 4: Verify production output from a clean install**

Run:

```bash
npm ci
npx playwright install chromium
PUBLIC_SITE_URL=https://fan-guide.test npm run verify
npm run budget
git status --short
```

Expected: all checks exit `0`; `git status --short` is empty; built canonical and OG URLs use the HTTPS origin.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml netlify.toml README.md docs/content-update-runbook.md
git commit -m "ci: add static launch pipeline"
```

---

## Execution Checkpoints

1. After Task 4, review the real moon/Eclipse motion on mobile and desktop before building the remaining visual pages.
2. After Task 8, re-open the three current setlist sources and inspect prediction labels before publishing song order.
3. After Tokyo, Jakarta, and Singapore, follow the update runbook; these are content refreshes, not architecture changes.
4. Before deployment, run the complete Task 14 clean-install verification and inspect Kakao/X previews using the deployed HTTPS URL.

## Implementation References

- [Astro 6 installation and Node requirement](https://v6.docs.astro.build/en/install-and-setup/)
- [Astro 6 Content Collections](https://v6.docs.astro.build/en/guides/content-collections/)
- [Astro View Transitions](https://docs.astro.build/en/guides/view-transitions/)
- [Astro testing with Vitest and Playwright](https://v6.docs.astro.build/en/guides/testing/)
- [Motion JavaScript `animate()`](https://motion.dev/docs/animate)
- [Motion reduced-motion guidance](https://motion.dev/docs/react-accessibility)
- [Netlify static Astro deployment](https://v6.docs.astro.build/en/guides/deploy/netlify/)
