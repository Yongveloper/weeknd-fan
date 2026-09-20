# English Localization — Phase 1 (Infrastructure) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사이트를 두 로케일(ko/en)로 라우팅·렌더하되 콘텐츠 본문은 한국어로 폴백한 상태로 배포 가능하게 만든다.

**Architecture:** 모든 페이지를 `src/pages/[...locale]/` 아래 단일 파일로 옮기고 `getStaticPaths`가 `undefined`(한국어, 루트 유지)와 `'en'`을 낸다. UI 문자열은 `src/lib/i18n/ui/{ko,en}.ts` 타입 고정 사전으로 모으고, 고유명사는 `proper-nouns.ts` 단일 출처에서만 온다. 콘텐츠 데이터(`src/data/`)는 이 단계에서 전혀 건드리지 않는다.

**Tech Stack:** Astro 6 (`output: 'static'`), TypeScript (`strict` + `noUncheckedIndexedAccess`), Vitest, Playwright, Cloudflare Workers Static Assets.

**Spec:** `docs/superpowers/specs/2026-09-20-english-localization-design.md`

## Global Constraints

- Node **22.14.0**. 최초 1회 `npm ci && npx playwright install chromium`.
- dev/preview/test 포트는 **4323**. e2e는 `baseURL`을 쓰고 `http://127.0.0.1:4323`을 하드코딩하지 않는다.
- `wrangler.jsonc`는 `assets.directory: "./dist"` 와 `run_worker_first: false` 만 유지한다. `main`·SSR 어댑터·Functions·assets binding **추가 금지**. `tests/unit/static-delivery-config.test.ts`가 검사한다.
- `npm run deploy`는 실행하지 않는다. `npx wrangler deploy --dry-run` 까지만.
- `src/data/` 아래 117개 정본 파일은 **이 단계에서 한 글자도 수정하지 않는다.**
- 기존 한국어 URL(`/`, `/goyang/`, `/setlist/`, `/discover/`, `/sources/`, `/share/ticket/`, `/share/setlist/`)은 **그대로 유지된다.**
- 성능 예산: JS **75KiB gzip**, raster 합계 **1300KiB**, 홈 **700KiB**, 기타 페이지 **400KiB**, media 합계 **13MiB**, `-720` 합계 **3MiB**. 예산 수치를 바꾸면 `tests/unit/performance-budget.test.ts` fixture도 같이 갱신한다.
- 홈 long task 예산 **50ms**. 클라이언트 번들에서 `Intl.DateTimeFormat`을 `timeZone` 옵션과 함께 생성하지 않는다(첫 생성 20~60ms). 로케일 날짜 문자열은 빌드 타임에만 만든다.
- 클라이언트 번들(`src/scripts/*.ts`, `src/lib/share/canvas.ts`, `src/lib/share/buildTicketLayout.ts`)에 UI 사전을 import하지 않는다. 문자열은 `data-*` 속성이나 인자로 주입한다.
- 새 런타임 의존성을 추가하지 않는다. 새 폰트 패키지를 추가하지 않는다.
- 문장을 조립하지 않는다. 로케일별 **완성 문장**만 사전에 둔다. 보간은 숫자·날짜 같은 데이터 슬롯에만 허용한다. 영어 복수형은 `one`·`other` 두 변형을 사전에 직접 적는다.
- 고유명사는 두 로케일 모두 라틴 고정: `The Weeknd`, `After Hours Til Dawn`. 장소·역명은 영어판에서 `Goyang Stadium · 고양종합운동장` 형태로 한글을 병기한다.
- 커밋: Conventional Commits, 영어 소문자 subject ≤ 72자. 커밋 메시지 끝에 `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>` 를 붙인다.
- 각 태스크 마지막 커밋 전 최소한 `npm run check && npm run lint && npx prettier --check <변경 파일>` 을 통과시킨다.

### 기존 e2e 스펙이 한국어 회귀 테스트다

`tests/e2e/` 13개 스펙에 한국어 문자열 리터럴이 **316줄** 있다(`navigation.spec.ts` 116, `share.spec.ts` 76, `goyang.spec.ts` 33, `goyang-transport.spec.ts` 32, `disclosure.spec.ts` 23, `no-js.spec.ts` 22 …). 문자열을 사전으로 옮기는 태스크에서 **이 스펙들이 통과한다는 것이 곧 한국어 경로 무회귀 증명**이다. 이 단계에서는 해당 리터럴을 건드리지 않는다.

---

## File Structure

### 신규

| 파일 | 책임 |
|---|---|
| `src/lib/i18n/locales.ts` | 로케일 목록·타입·기본값·판별 |
| `src/lib/i18n/routes.ts` | 경로 접두사 계산, `getStaticPaths` 입력 |
| `src/lib/i18n/proper-nouns.ts` | 고유명사 단일 출처 + 병기 렌더 |
| `src/lib/i18n/ui/ko.ts` | 한국어 UI 사전(타입 원본) |
| `src/lib/i18n/ui/en.ts` | 영어 UI 사전 |
| `src/lib/i18n/ui/index.ts` | `ui(locale)` 조회 |
| `src/components/chrome/LocaleSwitcher.astro` | KO/EN 링크 |
| `tests/unit/i18n-routes.test.ts` | 로케일 기본형·경로 계산 |
| `tests/unit/i18n-dictionary.test.ts` | 사전 키 패리티·빈 문자열 금지 |
| `tests/e2e/i18n.spec.ts` | lang·hreflang·canonical·전환기·라우트 존재 |

### 이동

`src/pages/index.astro` `discover.astro` `setlist.astro` `goyang.astro` `sources.astro` `share/ticket.astro` `share/setlist.astro`
→ `src/pages/[...locale]/` 아래 같은 이름. 상대 import 깊이가 한 단계 깊어진다.

### 수정

`astro.config.mjs` · `src/layouts/BaseLayout.astro` · `src/components/chrome/navigation.ts` `SiteHeader.astro` `SiteFooter.astro` · `src/lib/seo/eventJsonLd.ts` · `src/lib/content/contracts.ts` · 한글이 있는 컴포넌트 29개 · 클라이언트 스크립트 4개 · `src/lib/share/canvas.ts` `buildTicketLayout.ts` · `scripts/check-performance-budget.mjs` · `tests/unit/performance-budget.test.ts` `header-fonts.test.ts` · `tests/e2e/no-js.spec.ts` · `src/assets/fonts/header/*` (재생성)

---

## Task 1: 로케일 기본형과 라우팅 검증

**이 태스크가 스펙의 최대 위험을 먼저 소거한다.** Astro의 `i18n` 설정과 `[...locale]` 동적 라우트를 함께 쓸 때 `/en/en/goyang/` 같은 이중 접두사가 생기지 않는지를 실제 빌드 산출물로 확인한다. 생기면 `i18n` 블록을 빼고 자체 헬퍼만 쓰는 쪽으로 선회한다(Step 8 참조).

**Files:**
- Create: `src/lib/i18n/locales.ts`
- Create: `src/lib/i18n/routes.ts`
- Create: `tests/unit/i18n-routes.test.ts`
- Modify: `astro.config.mjs`
- Move: `src/pages/goyang.astro` → `src/pages/[...locale]/goyang.astro`

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces:
  - `LOCALES: readonly ['ko', 'en']`, `type Locale = 'ko' | 'en'`, `DEFAULT_LOCALE: Locale`, `isLocale(value: unknown): value is Locale`
  - `type LocaleParam = string | undefined`
  - `localePaths(): Array<{ params: { locale: LocaleParam } }>`
  - `localeFromParam(param: LocaleParam): Locale`
  - `localeHref(locale: Locale, path: string): string`
  - `pathWithoutLocale(pathname: string): string`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`tests/unit/i18n-routes.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  LOCALES,
  isLocale,
} from '../../src/lib/i18n/locales';
import {
  localeFromParam,
  localeHref,
  localePaths,
  pathWithoutLocale,
} from '../../src/lib/i18n/routes';

describe('locales', () => {
  it('lists korean first and defaults to it', () => {
    expect(LOCALES).toEqual(['ko', 'en']);
    expect(DEFAULT_LOCALE).toBe('ko');
  });

  it('recognises only the locales the site ships', () => {
    expect(isLocale('ko')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('ja')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe('localePaths', () => {
  it('emits an undefined param for korean so it keeps the bare root', () => {
    expect(localePaths()).toEqual([
      { params: { locale: undefined } },
      { params: { locale: 'en' } },
    ]);
  });
});

describe('localeFromParam', () => {
  it('maps a missing segment to korean', () => {
    expect(localeFromParam(undefined)).toBe('ko');
  });

  it('maps a prefixed segment to its locale', () => {
    expect(localeFromParam('en')).toBe('en');
  });

  it('rejects a segment that is not a prefixed locale', () => {
    expect(() => localeFromParam('ja')).toThrow('Unknown locale segment: ja');
    expect(() => localeFromParam('ko')).toThrow('Unknown locale segment: ko');
  });
});

describe('localeHref', () => {
  it('leaves korean paths unprefixed', () => {
    expect(localeHref('ko', '/')).toBe('/');
    expect(localeHref('ko', '/goyang/')).toBe('/goyang/');
    expect(localeHref('ko', '/share/ticket/')).toBe('/share/ticket/');
  });

  it('prefixes english paths', () => {
    expect(localeHref('en', '/')).toBe('/en/');
    expect(localeHref('en', '/goyang/')).toBe('/en/goyang/');
    expect(localeHref('en', '/share/ticket/')).toBe('/en/share/ticket/');
  });
});

describe('pathWithoutLocale', () => {
  it('strips the english prefix', () => {
    expect(pathWithoutLocale('/en/')).toBe('/');
    expect(pathWithoutLocale('/en')).toBe('/');
    expect(pathWithoutLocale('/en/goyang/')).toBe('/goyang/');
  });

  it('leaves korean paths alone', () => {
    expect(pathWithoutLocale('/')).toBe('/');
    expect(pathWithoutLocale('/goyang/')).toBe('/goyang/');
  });

  it('does not strip a path that merely starts with the prefix letters', () => {
    expect(pathWithoutLocale('/entry/')).toBe('/entry/');
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

```bash
npx vitest run tests/unit/i18n-routes.test.ts
```
Expected: FAIL — `Failed to resolve import "../../src/lib/i18n/locales"`

- [ ] **Step 3: 최소 구현을 쓴다**

`src/lib/i18n/locales.ts`:

```ts
/** Korean is the source of record; English is derived from it. */
export const LOCALES = ['ko', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ko';

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
  );
}
```

`src/lib/i18n/routes.ts`:

```ts
import { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from './locales';

/** Korean keeps the bare root, so only the others carry a path prefix. */
const PREFIXED = LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);

export type LocaleParam = string | undefined;

/** `getStaticPaths` input for every `[...locale]` route. */
export function localePaths(): Array<{ params: { locale: LocaleParam } }> {
  return [undefined, ...PREFIXED].map((locale) => ({ params: { locale } }));
}

export function localeFromParam(param: LocaleParam): Locale {
  if (param === undefined) return DEFAULT_LOCALE;
  if (!isLocale(param) || param === DEFAULT_LOCALE)
    throw new Error(`Unknown locale segment: ${param}`);
  return param;
}

export function localeHref(locale: Locale, path: string): string {
  return locale === DEFAULT_LOCALE ? path : `/${locale}${path}`;
}

export function pathWithoutLocale(pathname: string): string {
  for (const locale of PREFIXED) {
    if (pathname === `/${locale}` || pathname === `/${locale}/`) return '/';
    if (pathname.startsWith(`/${locale}/`))
      return pathname.slice(locale.length + 1);
  }
  return pathname;
}
```

- [ ] **Step 4: 통과를 확인한다**

```bash
npx vitest run tests/unit/i18n-routes.test.ts
```
Expected: PASS — 11 tests

- [ ] **Step 5: `astro.config.mjs`에 i18n 블록을 더한다**

`defineConfig({ ... })` 안, `output: 'static'` 바로 아래에 넣는다. **`fallback`은 넣지 않는다** — 넣으면 Astro가 리다이렉트를 끼워 넣어 동적 라우트와 겹친다.

```js
  output: 'static',
  site: publicSiteUrl,
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'en'],
    // Korean keeps the bare root so every shared URL stays valid.
    routing: { prefixDefaultLocale: false },
  },
```

- [ ] **Step 6: `goyang.astro`를 동적 라우트로 옮긴다**

```bash
mkdir -p 'src/pages/[...locale]'
git mv src/pages/goyang.astro 'src/pages/[...locale]/goyang.astro'
```

frontmatter 최상단의 상대 import를 한 단계 깊게 고친다(`../` → `../../`). 전부 12줄이다:

```astro
---
import { getCollection } from 'astro:content';
import AccessMap from '../../components/guide/AccessMap.astro';
import AccessTable from '../../components/guide/AccessTable.astro';
import DirectionsLinks from '../../components/guide/DirectionsLinks.astro';
import GuideJumpNav from '../../components/guide/GuideJumpNav.astro';
import GuideOverview from '../../components/guide/GuideOverview.astro';
import GuideSection from '../../components/guide/GuideSection.astro';
import LiveMap from '../../components/guide/LiveMap.astro';
import SeatMap from '../../components/guide/SeatMap.astro';
import TipsTabs from '../../components/guide/TipsTabs.astro';
import TransportOperations from '../../components/guide/TransportOperations.astro';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getGuideContent } from '../../lib/content/queries';
import { localeFromParam, localePaths } from '../../lib/i18n/routes';

export const getStaticPaths = localePaths;

const locale = localeFromParam(Astro.params.locale);
```

`locale`은 아직 쓰이지 않는다. Task 4 이후 컴포넌트로 내려간다. ESLint가 미사용 변수를 잡으면 이 태스크에서만 `void locale;` 한 줄을 두고 Task 6에서 걷어낸다.

- [ ] **Step 7: 빌드하고 산출물을 확인한다**

```bash
npm run build
ls dist/goyang/index.html dist/en/goyang/index.html
test ! -e dist/en/en && echo "no double prefix"
```
Expected: 두 `index.html`이 모두 존재하고 `no double prefix` 가 출력된다.

- [ ] **Step 8: (Step 7이 실패할 때만) i18n 블록을 걷어낸다**

`dist/en/en/` 이 생기거나 `dist/en/goyang/index.html` 이 없으면 Step 5에서 넣은 `i18n` 블록을 **통째로 제거**하고 Step 7을 다시 돌린다. `localeHref`·`localeFromParam` 자체 헬퍼만으로 라우팅이 성립하므로 설계는 그대로 간다. `Astro.currentLocale` 은 쓰지 않는다. 결과를 커밋 메시지 본문에 한 줄로 남긴다.

- [ ] **Step 9: 커밋**

```bash
npx prettier --write src/lib/i18n tests/unit/i18n-routes.test.ts astro.config.mjs 'src/pages/[...locale]/goyang.astro'
npm run check && npm run lint
git add src/lib/i18n tests/unit/i18n-routes.test.ts astro.config.mjs 'src/pages/[...locale]'
git commit -m "$(cat <<'EOF'
feat(i18n): add locale primitives and move the guide route under [...locale]

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: 나머지 6개 라우트 전환

**Files:**
- Move: `src/pages/index.astro` `discover.astro` `setlist.astro` `sources.astro` `share/ticket.astro` `share/setlist.astro` → `src/pages/[...locale]/` 아래 같은 이름
- Create: `tests/e2e/i18n.spec.ts`

**Interfaces:**
- Consumes: `localePaths`, `localeFromParam` (Task 1)
- Produces: 14개 정적 라우트. 페이지 파일마다 `const locale = localeFromParam(Astro.params.locale);` 가 준비돼 있다.

- [ ] **Step 1: 실패하는 e2e 테스트를 쓴다**

`tests/e2e/i18n.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

const ROUTES = [
  '/',
  '/discover/',
  '/setlist/',
  '/goyang/',
  '/sources/',
  '/share/ticket/',
  '/share/setlist/',
] as const;

test.describe('locale routes', () => {
  for (const route of ROUTES) {
    test(`korean ${route} responds`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
    });

    test(`english ${route} responds`, async ({ page }) => {
      const response = await page.goto(`/en${route}`);
      expect(response?.status()).toBe(200);
    });
  }

  test('does not double the locale prefix', async ({ page }) => {
    const response = await page.goto('/en/en/goyang/');
    expect(response?.status()).toBe(404);
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

```bash
npm run build
npx playwright test tests/e2e/i18n.spec.ts --project=desktop-chromium
```
Expected: FAIL — `/en/`, `/en/discover/`, `/en/setlist/`, `/en/sources/`, `/en/share/ticket/`, `/en/share/setlist/` 가 404. `/en/goyang/` 만 통과.

- [ ] **Step 3: 6개 페이지를 옮긴다**

```bash
mkdir -p 'src/pages/[...locale]/share'
for f in index discover setlist sources; do
  git mv "src/pages/$f.astro" "src/pages/[...locale]/$f.astro"
done
for f in ticket setlist; do
  git mv "src/pages/share/$f.astro" "src/pages/[...locale]/share/$f.astro"
done
rmdir src/pages/share
```

- [ ] **Step 4: 각 파일의 상대 import 깊이와 `getStaticPaths`를 고친다**

`[...locale]/index.astro` `discover.astro` `setlist.astro` `sources.astro` 는 `../` 를 `../../` 로 바꾼다.
`[...locale]/share/ticket.astro` `setlist.astro` 는 이미 `../../` 였으므로 `../../../` 로 바꾼다.

각 파일 frontmatter 끝에 동일하게 더한다(share 하위는 `../../../`):

```astro
import { localeFromParam, localePaths } from '../../lib/i18n/routes';

export const getStaticPaths = localePaths;

const locale = localeFromParam(Astro.params.locale);
void locale;
```

깨진 import를 한 번에 찾는다:

```bash
npm run check
```
Expected: `Cannot find module` 오류가 0건이 될 때까지 반복한다.

- [ ] **Step 5: 통과를 확인한다**

```bash
npm run build
npx playwright test tests/e2e/i18n.spec.ts --project=desktop-chromium
```
Expected: PASS — 15 tests

- [ ] **Step 6: 한국어 경로 무회귀를 확인한다**

```bash
npx playwright test tests/e2e/navigation.spec.ts tests/e2e/goyang.spec.ts --project=desktop-chromium
```
Expected: PASS. 실패하면 상대 경로나 `href` 가 어긋난 것이다 — 예산·문자열이 아니라 경로만 고친다.

- [ ] **Step 7: 커밋**

```bash
npx prettier --write 'src/pages' tests/e2e/i18n.spec.ts
npm run check && npm run lint
git add src/pages tests/e2e/i18n.spec.ts
git commit -m "$(cat <<'EOF'
feat(i18n): route every page through the [...locale] segment

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: UI 사전 골격과 고유명사 상수

**Files:**
- Create: `src/lib/i18n/proper-nouns.ts`
- Create: `src/lib/i18n/ui/ko.ts`
- Create: `src/lib/i18n/ui/en.ts`
- Create: `src/lib/i18n/ui/index.ts`
- Create: `tests/unit/i18n-dictionary.test.ts`

**Interfaces:**
- Consumes: `Locale`, `DEFAULT_LOCALE` (Task 1)
- Produces:
  - `type UiStrings = typeof ko` — 한국어 사전이 타입 원본
  - `ui(locale: Locale): UiStrings`
  - `ARTIST: 'The Weeknd'`, `TOUR: 'After Hours Til Dawn'`
  - `type ProperNoun = { latin: string; ko: string }`
  - `VENUE`, `STATION_DAEHWA`: `ProperNoun`
  - `bilingual(noun: ProperNoun, locale: Locale): string`

이 태스크는 사전의 **뼈대와 규칙**만 만든다. 실제 문자열 이관은 Task 6~9에서 영역별로 한다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`tests/unit/i18n-dictionary.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { LOCALES } from '../../src/lib/i18n/locales';
import {
  ARTIST,
  STATION_DAEHWA,
  TOUR,
  VENUE,
  bilingual,
} from '../../src/lib/i18n/proper-nouns';
import { ui } from '../../src/lib/i18n/ui';

function flatten(value: unknown, prefix = ''): Array<[string, string]> {
  if (typeof value === 'string') return [[prefix, value]];
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([key, child]) =>
      flatten(child, prefix ? `${prefix}.${key}` : key),
    );
  throw new Error(`Dictionary values must be strings: ${prefix}`);
}

describe('ui dictionaries', () => {
  it('exposes the same key set in every locale', () => {
    const [first, ...rest] = LOCALES.map((locale) =>
      flatten(ui(locale)).map(([key]) => key).sort(),
    );
    for (const keys of rest) expect(keys).toEqual(first);
  });

  it('has no empty string anywhere', () => {
    for (const locale of LOCALES)
      for (const [key, value] of flatten(ui(locale)))
        expect(value.trim(), `${locale}.${key}`).not.toBe('');
  });

  it('never embeds the artist or tour name in a dictionary value', () => {
    for (const locale of LOCALES)
      for (const [key, value] of flatten(ui(locale))) {
        expect(value, `${locale}.${key}`).not.toContain(ARTIST);
        expect(value, `${locale}.${key}`).not.toContain(TOUR);
      }
  });
});

describe('proper nouns', () => {
  it('keeps the artist and tour in latin for both locales', () => {
    expect(ARTIST).toBe('The Weeknd');
    expect(TOUR).toBe('After Hours Til Dawn');
  });

  it('shows korean alone to korean readers', () => {
    expect(bilingual(VENUE, 'ko')).toBe('고양종합운동장');
    expect(bilingual(STATION_DAEHWA, 'ko')).toBe('대화역');
  });

  it('pairs the latin name with the korean original for english readers', () => {
    expect(bilingual(VENUE, 'en')).toBe('Goyang Stadium · 고양종합운동장');
    expect(bilingual(STATION_DAEHWA, 'en')).toBe('Daehwa Station · 대화역');
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

```bash
npx vitest run tests/unit/i18n-dictionary.test.ts
```
Expected: FAIL — `Failed to resolve import "../../src/lib/i18n/proper-nouns"`

- [ ] **Step 3: 고유명사 상수를 쓴다**

`src/lib/i18n/proper-nouns.ts`:

```ts
import { DEFAULT_LOCALE, type Locale } from './locales';

/**
 * Proper nouns never go through the UI dictionaries. English carries a
 * definite article ("The Weeknd") that Korean particles attach to
 * differently, so any sentence assembled from fragments breaks in one
 * locale or the other.
 */
export const ARTIST = 'The Weeknd';
export const TOUR = 'After Hours Til Dawn';

export type ProperNoun = { latin: string; ko: string };

export const VENUE: ProperNoun = {
  latin: 'Goyang Stadium',
  ko: '고양종합운동장',
};

export const STATION_DAEHWA: ProperNoun = {
  latin: 'Daehwa Station',
  ko: '대화역',
};

/**
 * Visiting fans type the Korean string into a map app or show it to a taxi
 * driver, so the English page keeps it beside the translated name.
 */
export function bilingual(noun: ProperNoun, locale: Locale): string {
  return locale === DEFAULT_LOCALE ? noun.ko : `${noun.latin} · ${noun.ko}`;
}
```

- [ ] **Step 4: 사전 뼈대를 쓴다**

`src/lib/i18n/ui/ko.ts`:

```ts
/**
 * Korean is the type source for every dictionary: a key missing from
 * `en.ts` fails `astro check` rather than rendering blank.
 *
 * Rules
 * - Whole sentences only. Never assemble a sentence from fragments.
 * - Interpolate data slots (numbers, dates) only; the words around the slot
 *   belong to the locale.
 * - English plurals get explicit `one` / `other` variants.
 * - Proper nouns come from `../proper-nouns`, never from here.
 */
export const ko = {
  chrome: {
    skipToContent: '본문으로 건너뛰기',
    primaryMenu: '주요 메뉴',
    menu: '메뉴',
    localeSwitcher: '언어',
    localeKo: '한국어',
    localeEn: 'English',
  },
} as const;
```

`src/lib/i18n/ui/en.ts`:

```ts
import type { UiStrings } from './index';

export const en: UiStrings = {
  chrome: {
    skipToContent: 'Skip to content',
    primaryMenu: 'Primary',
    menu: 'Menu',
    localeSwitcher: 'Language',
    localeKo: '한국어',
    localeEn: 'English',
  },
};
```

`src/lib/i18n/ui/index.ts`:

```ts
import type { Locale } from '../locales';
import { en } from './en';
import { ko } from './ko';

/**
 * Korean is the shape of record; `en.ts` is checked against it. The mapping
 * recurses because groups nest (`guide.directions.heading`), and it widens
 * every leaf to `string` so English may differ from the Korean literal.
 */
type SameShape<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : SameShape<T[K]>;
};

export type UiStrings = SameShape<typeof ko>;

const DICTIONARIES: Record<Locale, UiStrings> = { ko, en };

export function ui(locale: Locale): UiStrings {
  return DICTIONARIES[locale];
}
```

- [ ] **Step 5: 통과를 확인한다**

```bash
npx vitest run tests/unit/i18n-dictionary.test.ts
npm run check
```
Expected: PASS — 6 tests, `astro check` 0 errors

- [ ] **Step 6: 키 누락이 실제로 잡히는지 확인한다**

`en.ts`의 `menu: 'Menu',` 줄을 임시로 지우고:

```bash
npm run check
```
Expected: FAIL — `Property 'menu' is missing`. 확인했으면 줄을 되돌린다.

- [ ] **Step 7: 커밋**

```bash
npx prettier --write src/lib/i18n tests/unit/i18n-dictionary.test.ts
npm run check && npm run lint
git add src/lib/i18n tests/unit/i18n-dictionary.test.ts
git commit -m "$(cat <<'EOF'
feat(i18n): add the ui dictionary skeleton and proper-noun constants

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: chrome 로케일화와 언어 전환기

**Files:**
- Modify: `src/components/chrome/navigation.ts`
- Modify: `src/components/chrome/SiteHeader.astro`
- Modify: `src/components/chrome/SiteFooter.astro`
- Modify: `src/layouts/BaseLayout.astro`
- Create: `src/components/chrome/LocaleSwitcher.astro`
- Modify: `tests/unit/header-fonts.test.ts`
- Regenerate: `src/assets/fonts/header/*`

**Interfaces:**
- Consumes: `ui`, `Locale`, `localeHref`, `pathWithoutLocale` (Task 1·3)
- Produces:
  - `navigationFor(locale: Locale): ReadonlyArray<{ href: string; label: string }>` — `href`가 이미 로케일 접두사를 포함한다
  - `footerNavigationFor(locale: Locale): ReadonlyArray<{ href: string; label: string }>`
  - `chromeText: { display: string; body: string }` — **두 로케일 라벨의 합집합**
  - `BaseLayout` 이 `locale: Locale` prop을 받는다

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`tests/e2e/i18n.spec.ts` 에 더한다:

```ts
test.describe('chrome', () => {
  test('marks the document language', async ({ page }) => {
    await page.goto('/goyang/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
    await page.goto('/en/goyang/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('switches locale without javascript state', async ({ page }) => {
    await page.goto('/goyang/');
    await page.getByRole('link', { name: 'English' }).click();
    await expect(page).toHaveURL(/\/en\/goyang\/$/);
    await page.getByRole('link', { name: '한국어' }).click();
    await expect(page).toHaveURL(/(?<!\/en)\/goyang\/$/);
  });

  test('marks the current locale for assistive tech', async ({ page }) => {
    await page.goto('/en/goyang/');
    await expect(
      page.getByRole('link', { name: 'English' }),
    ).toHaveAttribute('aria-current', 'true');
  });

  test('translates the skip link', async ({ page }) => {
    await page.goto('/en/goyang/');
    await expect(page.locator('.skip-link')).toHaveText('Skip to content');
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

```bash
npm run build
npx playwright test tests/e2e/i18n.spec.ts --project=desktop-chromium
```
Expected: FAIL — `lang` 이 `/en/goyang/` 에서도 `ko`, `English` 링크 없음

- [ ] **Step 3: `navigation.ts`를 로케일 함수로 바꾼다**

`src/components/chrome/navigation.ts` 전체를 바꾼다. `wordmark`는 그대로 둔다.

```ts
import { DEFAULT_LOCALE, LOCALES, type Locale } from '../../lib/i18n/locales';
import { localeHref } from '../../lib/i18n/routes';

/** Header/footer chrome text. Kept in one place so the header font preload
 *  (src/lib/fonts) can compute exactly which font slices the chrome needs. */
export const wordmark = {
  name: 'INTO:DAWN',
  edition: 'THE WEEKND · GOYANG 26',
} as const;

type NavItem = { path: string; label: Record<Locale, string> };

const NAV: readonly NavItem[] = [
  { path: '/', label: { ko: '홈', en: 'Home' } },
  { path: '/discover/', label: { ko: 'The Weeknd', en: 'The Weeknd' } },
  { path: '/setlist/', label: { ko: '예상 셋리스트', en: 'Expected setlist' } },
  { path: '/goyang/', label: { ko: '콘서트 가이드', en: 'Concert guide' } },
] as const;

const FOOTER_ONLY: readonly NavItem[] = [
  { path: '/sources/', label: { ko: '출처·업데이트', en: 'Sources & updates' } },
] as const;

function resolve(items: readonly NavItem[], locale: Locale) {
  return items.map(({ path, label }) => ({
    href: localeHref(locale, path),
    label: label[locale],
  }));
}

export function navigationFor(locale: Locale) {
  return resolve(NAV, locale);
}

export function footerNavigationFor(locale: Locale) {
  return resolve([...NAV, ...FOOTER_ONLY], locale);
}

/** Every character the chrome can render, across all locales, so one
 *  committed subset serves both. */
export const chromeText = {
  display: wordmark.name,
  body: [
    wordmark.edition,
    ...LOCALES.flatMap((locale) =>
      [...NAV, ...FOOTER_ONLY].map(({ label }) => label[locale]),
    ),
  ].join(''),
};

export const navigation = navigationFor(DEFAULT_LOCALE);
```

마지막 `navigation` export는 아직 이 심볼을 쓰는 곳이 남아 있을 때를 위한 다리다. Step 5에서 `SiteHeader`·`SiteFooter`를 고치고 나면 지운다.

- [ ] **Step 4: 언어 전환기를 만든다**

`src/components/chrome/LocaleSwitcher.astro`:

```astro
---
import { LOCALES, type Locale } from '../../lib/i18n/locales';
import { localeHref, pathWithoutLocale } from '../../lib/i18n/routes';
import { ui } from '../../lib/i18n/ui';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
const strings = ui(locale);
const bare = pathWithoutLocale(Astro.url.pathname);
const labels: Record<Locale, string> = {
  ko: strings.chrome.localeKo,
  en: strings.chrome.localeEn,
};
---

<nav class="locale-switcher" aria-label={strings.chrome.localeSwitcher}>
  <ul>
    {
      LOCALES.map((candidate) => (
        <li>
          <a
            href={localeHref(candidate, bare)}
            hreflang={candidate}
            lang={candidate}
            aria-current={candidate === locale ? 'true' : undefined}
          >
            {labels[candidate]}
          </a>
        </li>
      ))
    }
  </ul>
</nav>

<style>
  .locale-switcher ul {
    display: flex;
    gap: 0.75rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .locale-switcher a[aria-current='true'] {
    text-decoration: underline;
  }
</style>
```

- [ ] **Step 5: `SiteHeader`·`SiteFooter`가 로케일을 받게 한다**

`SiteHeader.astro` frontmatter를 바꾼다:

```astro
---
import type { Locale } from '../../lib/i18n/locales';
import { localeHref } from '../../lib/i18n/routes';
import { ui } from '../../lib/i18n/ui';
import LocaleSwitcher from './LocaleSwitcher.astro';
import { navigationFor, wordmark } from './navigation';
import Wordmark from './Wordmark.astro';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
const strings = ui(locale);
const navigation = navigationFor(locale);
const pathname = Astro.url.pathname;
---
```

마크업에서 한국어 리터럴 5곳을 바꾼다:

| 위치 | 이전 | 이후 |
|---|---|---|
| 17행 워드마크 `aria-label` | `` `${wordmark.name} · The Weeknd 고양 팬 가이드 홈` `` | `strings.chrome.homeLabel` |
| 16행 워드마크 `href` | `"/"` | `localeHref(locale, '/')` |
| 26행 `<nav aria-label>` | `"주요 메뉴"` | `strings.chrome.primaryMenu` |
| 28행 `<details aria-label>` | `"주요 메뉴"` | `strings.chrome.primaryMenu` |
| 29행 `<summary aria-label>` | `"메뉴"` | `strings.chrome.menu` |
| 30행 summary 본문 | `메뉴` | `{strings.chrome.menu}` |

`</mobile-navigation>` 다음 줄에 전환기를 넣는다:

```astro
      </mobile-navigation>
      <LocaleSwitcher locale={locale} />
```

`SiteFooter.astro`도 같은 방식으로 `locale` prop을 받고 `footerNavigationFor(locale)` 을 쓴다. 한국어 리터럴 4줄을 `strings.chrome.*` 키로 옮긴다 — 실제 문구는 다음으로 확인한다:

```bash
grep -n '[가-힣]' src/components/chrome/SiteFooter.astro
```

발견한 문구마다 `ko.ts` 의 `chrome` 그룹에 키를 더하고 `en.ts` 에 영어를 채운다. `homeLabel` 도 여기서 더한다:

```ts
// ko.ts chrome 그룹에 추가
homeLabel: `${wordmark.name} · The Weeknd 고양 팬 가이드 홈`,
```

는 **쓰지 않는다** — 사전 값에 `ARTIST`를 넣으면 Task 3의 단위 테스트가 실패한다. 대신 `SiteHeader.astro` 에서 조립한다:

```ts
const homeLabel = `${wordmark.name} · ${strings.chrome.homeSuffix}`;
```
`ko.chrome.homeSuffix = '고양 팬 가이드 홈'`, `en.chrome.homeSuffix = 'Goyang fan guide home'`.

- [ ] **Step 6: `BaseLayout`이 로케일을 받아 내려보낸다**

`src/layouts/BaseLayout.astro`:

```astro
import type { Locale } from '../lib/i18n/locales';
import { ui } from '../lib/i18n/ui';

interface Props {
  locale: Locale;
  title: string;
  // … 나머지 기존 prop 그대로
}

const {
  locale,
  title,
  // … 나머지 기존 구조분해 그대로
} = Astro.props;
const strings = ui(locale);
```

세 줄을 바꾼다:

```astro
<html lang={locale}>
```

```astro
<a class="skip-link" href="#content">{strings.chrome.skipToContent}</a>
<SiteHeader locale={locale} />
```

```astro
<SiteFooter locale={locale} />
```

- [ ] **Step 7: 7개 페이지가 `locale`을 넘기게 한다**

각 페이지의 `<BaseLayout ...>` 에 `locale={locale}` 을 더하고 Task 1·2에서 둔 `void locale;` 를 지운다.

```bash
grep -rn 'void locale;' 'src/pages'
```
Expected: 고친 뒤 0건

- [ ] **Step 8: 헤더 폰트 서브셋을 재생성한다**

```bash
npm run fonts:header
npx vitest run tests/unit/header-fonts.test.ts
```
Expected: PASS. `manifest.json` 의 `text` 가 새 `chromeText` 와 일치한다.

`tests/unit/header-fonts.test.ts` 는 `chromeText` 를 import해 비교하므로 **수정이 필요 없을 가능성이 높다.** 실패하면 실패 메시지가 가리키는 단언만 합집합 기준으로 고친다.

- [ ] **Step 9: 통과를 확인한다**

```bash
npm run build
npx playwright test tests/e2e/i18n.spec.ts tests/e2e/navigation.spec.ts tests/e2e/header-menu.spec.ts --project=desktop-chromium
```
Expected: PASS — i18n 19 tests + 기존 navigation·header-menu 스펙 무회귀

- [ ] **Step 10: 커밋**

```bash
npx prettier --write src/components/chrome src/layouts src/lib/i18n src/pages tests
npm run check && npm run lint
git add src/components/chrome src/layouts src/lib/i18n src/pages src/assets/fonts/header tests
git commit -m "$(cat <<'EOF'
feat(chrome): localize the header, footer and skip link, add a locale switcher

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: SEO 메타

**Files:**
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/lib/seo/eventJsonLd.ts`
- Modify: `astro.config.mjs`
- Create: `tests/unit/hreflang.test.ts`
- Modify: `tests/unit/event-json-ld.test.ts`

**Interfaces:**
- Consumes: `LOCALES`, `Locale`, `localeHref`, `pathWithoutLocale` (Task 1)
- Produces:
  - `alternateLinks(pathname: string, site: URL): Array<{ hreflang: string; href: string }>` — `src/lib/seo/alternates.ts`
  - `buildEventJsonLd(...)` 가 `locale: Locale` 을 더 받고 `inLanguage` 를 낸다

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`tests/unit/hreflang.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { alternateLinks } from '../../src/lib/seo/alternates';

const site = new URL('https://fan-guide.test');

describe('alternateLinks', () => {
  it('lists every locale plus x-default for a korean path', () => {
    expect(alternateLinks('/goyang/', site)).toEqual([
      { hreflang: 'ko', href: 'https://fan-guide.test/goyang/' },
      { hreflang: 'en', href: 'https://fan-guide.test/en/goyang/' },
      { hreflang: 'x-default', href: 'https://fan-guide.test/goyang/' },
    ]);
  });

  it('produces the identical set from the english path', () => {
    expect(alternateLinks('/en/goyang/', site)).toEqual(
      alternateLinks('/goyang/', site),
    );
  });

  it('handles the site root', () => {
    expect(alternateLinks('/en/', site)).toEqual([
      { hreflang: 'ko', href: 'https://fan-guide.test/' },
      { hreflang: 'en', href: 'https://fan-guide.test/en/' },
      { hreflang: 'x-default', href: 'https://fan-guide.test/' },
    ]);
  });
});
```

`tests/e2e/i18n.spec.ts` 에 더한다:

```ts
test.describe('seo', () => {
  for (const path of ['/goyang/', '/en/goyang/']) {
    test(`${path} carries canonical and three alternates`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
      await expect(
        page.locator('link[rel="alternate"][hreflang]'),
      ).toHaveCount(3);
      await expect(
        page.locator('link[rel="alternate"][hreflang="x-default"]'),
      ).toHaveAttribute('href', /\/goyang\/$/);
    });
  }

  test('canonical points at the locale being viewed', async ({ page }) => {
    await page.goto('/en/goyang/');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/en\/goyang\/$/,
    );
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

```bash
npx vitest run tests/unit/hreflang.test.ts
```
Expected: FAIL — `Failed to resolve import "../../src/lib/seo/alternates"`

- [ ] **Step 3: `alternates.ts`를 쓴다**

`src/lib/seo/alternates.ts`:

```ts
import { DEFAULT_LOCALE, LOCALES } from '../i18n/locales';
import { localeHref, pathWithoutLocale } from '../i18n/routes';

export type AlternateLink = { hreflang: string; href: string };

/**
 * Every locale of one page, plus x-default. The site never negotiates by
 * Accept-Language (it is static), so x-default points at Korean — the
 * source of record.
 */
export function alternateLinks(pathname: string, site: URL): AlternateLink[] {
  const bare = pathWithoutLocale(pathname);
  const links: AlternateLink[] = LOCALES.map((locale) => ({
    hreflang: locale,
    href: new URL(localeHref(locale, bare), site).toString(),
  }));
  links.push({
    hreflang: 'x-default',
    href: new URL(localeHref(DEFAULT_LOCALE, bare), site).toString(),
  });
  return links;
}
```

- [ ] **Step 4: 통과를 확인한다**

```bash
npx vitest run tests/unit/hreflang.test.ts
```
Expected: PASS — 3 tests

- [ ] **Step 5: `BaseLayout`이 메타를 내게 한다**

`src/layouts/BaseLayout.astro` frontmatter에 더한다:

```ts
import { alternateLinks } from '../lib/seo/alternates';

const alternates = alternateLinks(Astro.url.pathname, site);
const ogLocale = locale === 'ko' ? 'ko_KR' : 'en_US';
const ogAlternates = locale === 'ko' ? ['en_US'] : ['ko_KR'];
```

`<link rel="canonical" href={canonical} />` 바로 아래에 넣는다:

```astro
    {
      alternates.map(({ hreflang, href }) => (
        <link rel="alternate" hreflang={hreflang} href={href} />
      ))
    }
```

`<meta property="og:type" ... />` 아래에 넣는다:

```astro
    <meta property="og:locale" content={ogLocale} />
    {
      ogAlternates.map((value) => (
        <meta property="og:locale:alternate" content={value} />
      ))
    }
```

- [ ] **Step 6: JSON-LD에 `inLanguage`를 더한다**

`src/lib/seo/eventJsonLd.ts` 의 `buildEventJsonLd()` 시그니처에 `locale: Locale` 을 더하고 반환 객체에 한 줄을 더한다:

```ts
  inLanguage: locale === 'ko' ? 'ko-KR' : 'en',
```

`location.name` 은 `bilingual(VENUE, locale)` 로 바꾼다. `tests/unit/event-json-ld.test.ts` 의 기존 단언에 두 로케일 케이스를 더한다:

```ts
it('declares the rendered language', () => {
  expect(buildEventJsonLd({ ...input, locale: 'ko' }).inLanguage).toBe('ko-KR');
  expect(buildEventJsonLd({ ...input, locale: 'en' }).inLanguage).toBe('en');
});

it('pairs the venue name with its korean original in english', () => {
  expect(buildEventJsonLd({ ...input, locale: 'en' }).location.name).toBe(
    'Goyang Stadium · 고양종합운동장',
  );
});
```

`buildEventJsonLd` 호출부(`src/pages/[...locale]/index.astro` 또는 `goyang.astro`)에 `locale` 을 넘긴다. 호출부는 다음으로 찾는다:

```bash
grep -rn 'buildEventJsonLd' src/
```

- [ ] **Step 7: 사이트맵에 i18n을 준다**

`astro.config.mjs` 의 `sitemap()` 호출을 바꾼다:

```js
    ...(publicSiteUrl
      ? [
          sitemap({
            i18n: {
              defaultLocale: 'ko',
              locales: { ko: 'ko-KR', en: 'en' },
            },
          }),
        ]
      : []),
```

- [ ] **Step 8: 사이트맵 산출물을 확인한다**

```bash
PUBLIC_SITE_URL=https://fan-guide.test npm run build
grep -c '<url>' dist/sitemap-0.xml
grep -c 'xhtml:link' dist/sitemap-0.xml
```
Expected: `<url>` 14개. `xhtml:link` 가 0보다 크다.

- [ ] **Step 9: e2e를 확인한다**

```bash
npx playwright test tests/e2e/i18n.spec.ts --project=desktop-chromium
```
Expected: PASS — 22 tests

- [ ] **Step 10: 커밋**

```bash
npx prettier --write src/lib/seo src/layouts astro.config.mjs tests
npm run check && npm run lint
git add src/lib/seo src/layouts astro.config.mjs src/pages tests
git commit -m "$(cat <<'EOF'
feat(seo): emit per-locale canonical, hreflang alternates and sitemap entries

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: guide 컴포넌트 문자열 이관

**Files:**
- Modify: `src/components/guide/AccessMap.astro` (7줄) `AccessTable.astro` (12) `DirectionsLinks.astro` (7) `GuideJumpNav.astro` (1) `GuideOverview.astro` (5) `GuideSection.astro` (10) `LiveMap.astro` (3) `SeatMap.astro` (7) `TipsTabs.astro` (6) `TransportOperations.astro` (27)
- Modify: `src/pages/[...locale]/goyang.astro` (6)
- Modify: `src/lib/i18n/ui/ko.ts` `en.ts`

**Interfaces:**
- Consumes: `ui`, `Locale`, `bilingual`, `VENUE`, `STATION_DAEHWA` (Task 1·3)
- Produces: `ui(locale).guide.*` 키 그룹. 각 컴포넌트가 `locale: Locale` prop을 받는다.

총 91줄. 기계적이지만 규칙이 있다.

**이관 규칙**
1. 한 컴포넌트의 문자열은 `ko.ts` 의 `guide` 그룹 아래 **컴포넌트 이름 하위 그룹**에 모은다 — `guide.accessTable.header`, `guide.transport.shuttleNote` 등.
2. **문장을 쪼개지 않는다.** 마크업에서 `{a}에서 {b}까지` 처럼 조립하고 있다면 완성 문장 하나로 합쳐 슬롯만 남긴다.
3. 장소·역명 리터럴은 사전에 넣지 말고 `bilingual(VENUE, locale)` · `bilingual(STATION_DAEHWA, locale)` 로 바꾼다.
4. `aria-label`·`title`·`alt` 도 전부 대상이다.
5. **콘텐츠 데이터에서 온 값은 건드리지 않는다.** `entry.data.title` 같은 값은 2단계에서 다룬다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`tests/e2e/i18n.spec.ts` 에 더한다:

```ts
test.describe('guide page', () => {
  test('renders korean chrome on the korean route', async ({ page }) => {
    await page.goto('/goyang/');
    await expect(page.locator('main')).toContainText('고양종합운동장');
  });

  test('renders english chrome with the korean venue name kept', async ({
    page,
  }) => {
    await page.goto('/en/goyang/');
    const main = page.locator('main');
    await expect(main).toContainText('Goyang Stadium · 고양종합운동장');
    await expect(main).not.toContainText('오는 길');
  });
});
```

`오는 길` 은 `goyang.astro`/`GuideJumpNav` 계열의 UI 라벨이다. 실제 라벨이 다르면 `grep -n '[가-힣]' src/pages/'[...locale]'/goyang.astro` 로 확인해 그 문자열로 바꾼다.

- [ ] **Step 2: 실패를 확인한다**

```bash
npm run build
npx playwright test tests/e2e/i18n.spec.ts --project=desktop-chromium -g 'guide page'
```
Expected: FAIL — 영어 라우트에 한국어 UI 라벨이 그대로 남아 있다

- [ ] **Step 3: 이관 대상 전체 목록을 뽑는다**

```bash
for f in src/components/guide/*.astro 'src/pages/[...locale]/goyang.astro'; do
  echo "── $f"
  grep -n '[가-힣]' "$f"
done
```

이 출력이 이 태스크의 작업 목록이다. 91줄 전부가 여기 나온다.

- [ ] **Step 4: 사전에 키를 더한다**

`ko.ts` 에 `guide` 그룹을 더한다. 예(`DirectionsLinks.astro:6,9,13,17` 기준):

```ts
  guide: {
    directions: {
      heading: '오는 길',
      kakaoMap: '카카오맵에서 열기',
      naverMap: '네이버지도에서 열기',
      openInNewTab: '새 탭에서 열립니다',
    },
    overview: {
      beforeArrival: '도착 전',
      entry: '입장',
      show: '관람',
      goingHome: '귀가',
    },
  },
```

`en.ts` 에 대응을 채운다:

```ts
  guide: {
    directions: {
      heading: 'Getting there',
      kakaoMap: 'Open in KakaoMap',
      naverMap: 'Open in Naver Map',
      openInNewTab: 'Opens in a new tab',
    },
    overview: {
      beforeArrival: 'Before you arrive',
      entry: 'Entry',
      show: 'The show',
      goingHome: 'Getting home',
    },
  },
```

Step 3 출력의 나머지 문자열도 같은 형태로 전부 옮긴다. `astro check` 가 `en.ts` 의 누락을 잡아 준다.

- [ ] **Step 5: 컴포넌트가 로케일을 받게 한다**

각 컴포넌트 frontmatter에 더한다:

```astro
import type { Locale } from '../../lib/i18n/locales';
import { ui } from '../../lib/i18n/ui';

interface Props {
  locale: Locale;
  // … 기존 prop 그대로
}

const { locale, /* … */ } = Astro.props;
const strings = ui(locale);
```

`goyang.astro` 가 각 컴포넌트에 `locale={locale}` 을 넘긴다. `goyang.astro:26` 의 `{ id: 'tips', label: '현장 팁', … }` 처럼 페이지 안에서 만드는 라벨도 `strings.guide.*` 로 바꾼다.

- [ ] **Step 6: 남은 한글이 없는지 확인한다**

```bash
grep -rn '[가-힣]' src/components/guide/ 'src/pages/[...locale]/goyang.astro'
```
Expected: `bilingual()` 이 처리하지 않는 한글 UI 문자열이 0건. `ko.ts` 로 옮겨진 것만 남지 않아야 한다.

- [ ] **Step 7: 통과와 무회귀를 확인한다**

```bash
npm run check
npm run build
npx playwright test tests/e2e/i18n.spec.ts tests/e2e/goyang.spec.ts tests/e2e/goyang-transport.spec.ts tests/e2e/live-map-loading.spec.ts --project=desktop-chromium
```
Expected: PASS. `goyang.spec.ts`(33줄 한글)·`goyang-transport.spec.ts`(32줄 한글)가 통과하는 것이 한국어 무회귀 증명이다.

- [ ] **Step 8: 커밋**

```bash
npx prettier --write src/components/guide src/lib/i18n src/pages tests
npm run check && npm run lint
git add src/components/guide src/lib/i18n src/pages tests
git commit -m "$(cat <<'EOF'
feat(guide): move guide ui strings into the locale dictionaries

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: home·ui·visual 컴포넌트 문자열 이관

**Files:**
- Modify: `src/components/home/FanNote.astro` (4) `GuideShortcuts.astro` (7) `IntroSummary.astro` (5) `PamphletContents.astro` (11) `SetlistPreview.astro` (8)
- Modify: `src/components/ui/BackToTop.astro` (1) `Disclosure.astro` (1)
- Modify: `src/components/visual/EclipseCountdown.astro` (2)
- Modify: `src/pages/[...locale]/index.astro` (2)
- Modify: `src/lib/i18n/ui/ko.ts` `en.ts`

**Interfaces:**
- Consumes: `ui`, `Locale`, `bilingual` (Task 1·3)
- Produces: `ui(locale).home.*`, `ui(locale).ui.*` 키 그룹

총 41줄.

**이관 규칙**

1. 한 컴포넌트의 문자열은 사전의 그룹 아래 **컴포넌트 이름 하위 그룹**에 모은다 — `home.shortcuts.heading` 등.
2. **문장을 쪼개지 않는다.** 마크업에서 조각을 이어 붙이고 있다면 완성 문장 하나로 합치고 슬롯만 남긴다.
3. 장소·역명 리터럴은 사전에 넣지 말고 `bilingual(VENUE, locale)` · `bilingual(STATION_DAEHWA, locale)` 로 바꾼다.
4. `aria-label`·`title`·`alt` 도 전부 대상이다.
5. **콘텐츠 데이터에서 온 값은 건드리지 않는다.** `entry.data.title` 같은 값은 2단계에서 다룬다.

**추가 규칙 — 카운트다운**

`EclipseCountdown.astro` 는 홈의 long task 50ms 예산 아래에 있다. 남은 일수 표시에 영어 복수형이 필요하다. `Intl.PluralRules` 를 만들지 말고 사전의 두 변형을 쓴다:

```ts
  // ko.ts
  countdown: { days: { one: 'D-{n}', other: 'D-{n}' } },
  // en.ts
  countdown: { days: { one: '{n} day to go', other: '{n} days to go' } },
```

선택은 값이 정확히 1일 때만 `one` 이다:

```ts
const template = n === 1 ? strings.countdown.days.one : strings.countdown.days.other;
const label = template.replace('{n}', String(n));
```

`src/lib/countdown.ts` 는 고정 UTC+9 그대로 둔다. `Intl.DateTimeFormat` 을 새로 만들지 않는다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`tests/e2e/i18n.spec.ts` 에 더한다:

```ts
test.describe('home page', () => {
  test('renders english shortcuts on the english route', async ({ page }) => {
    await page.goto('/en/');
    const main = page.locator('main');
    await expect(main).toContainText('Concert guide');
    await expect(main).not.toContainText('콘서트 가이드');
  });

  test('keeps the korean home intact', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main')).toContainText('콘서트 가이드');
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

```bash
npm run build
npx playwright test tests/e2e/i18n.spec.ts --project=desktop-chromium -g 'home page'
```
Expected: FAIL — 영어 홈에 한국어 라벨이 남아 있다

- [ ] **Step 3: 이관 대상 전체 목록을 뽑는다**

```bash
for f in src/components/home/*.astro src/components/ui/*.astro \
         src/components/visual/EclipseCountdown.astro \
         'src/pages/[...locale]/index.astro'; do
  echo "── $f"
  grep -n '[가-힣]' "$f"
done
```

- [ ] **Step 4: 사전에 키를 더하고 컴포넌트를 고친다**

`home` 과 `ui` 두 그룹으로 나눈다. `BackToTop.astro` 와 `Disclosure.astro` 는 각 1줄이므로 `ui` 그룹에 둔다.

`ko.ts` 에 더하는 형태:

```ts
  home: {
    shortcuts: {
      heading: '바로가기',
      guide: '콘서트 가이드',
      setlist: '예상 셋리스트',
    },
    countdown: { days: { one: 'D-{n}', other: 'D-{n}' } },
  },
  ui: {
    backToTop: '맨 위로',
    expand: '펼치기',
  },
```

`en.ts` 에 대응을 채우는 형태:

```ts
  home: {
    shortcuts: {
      heading: 'Jump to',
      guide: 'Concert guide',
      setlist: 'Expected setlist',
    },
    countdown: { days: { one: '{n} day to go', other: '{n} days to go' } },
  },
  ui: {
    backToTop: 'Back to top',
    expand: 'Expand',
  },
```

컴포넌트 frontmatter에 더하는 형태:

```astro
import type { Locale } from '../../lib/i18n/locales';
import { ui } from '../../lib/i18n/ui';

interface Props {
  locale: Locale;
  // … 기존 prop 그대로
}

const { locale, /* … */ } = Astro.props;
const strings = ui(locale);
```

부모 페이지·컴포넌트가 `locale={locale}` 을 넘긴다. `aria-label`·`title`·`alt` 도 전부 대상이다. **콘텐츠 데이터에서 온 값(`entry.data.title` 등)은 건드리지 않는다** — 2단계에서 다룬다.

Step 3 출력의 41줄을 전부 이렇게 옮긴다. `astro check` 가 `en.ts` 의 누락을 잡아 준다.

- [ ] **Step 5: 남은 한글이 없는지 확인한다**

```bash
grep -rn '[가-힣]' src/components/home src/components/ui src/components/visual 'src/pages/[...locale]/index.astro'
```
Expected: 0건

- [ ] **Step 6: 통과와 무회귀를 확인한다**

```bash
npm run check
npm run build
npx playwright test tests/e2e/i18n.spec.ts tests/e2e/home-flow.spec.ts tests/e2e/back-to-top.spec.ts tests/e2e/disclosure.spec.ts --project=desktop-chromium
```
Expected: PASS

- [ ] **Step 7: 홈 long task 예산을 확인한다**

```bash
npx playwright test tests/e2e/visual.spec.ts --project=mobile-chromium
```
Expected: PASS — long task 50ms 단언이 유지된다

- [ ] **Step 8: 커밋**

```bash
npx prettier --write src/components src/lib/i18n src/pages tests
npm run check && npm run lint
git add src/components src/lib/i18n src/pages tests
git commit -m "$(cat <<'EOF'
feat(home): move home and shared ui strings into the locale dictionaries

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: discover·setlist·content·sources 문자열 이관

**Files:**
- Modify: `src/components/discover/CareerTimeline.astro` (6) `TrilogyExplainer.astro` (14)
- Modify: `src/components/setlist/SetlistExplorer.astro` (18)
- Modify: `src/components/content/AlbumCover.astro` (1) `OfficialEmbed.astro` (3) `SourceList.astro` (3)
- Modify: `src/pages/[...locale]/discover.astro` (16) `setlist.astro` (6) `sources.astro` (39)
- Modify: `src/lib/content/contracts.ts`
- Modify: `src/lib/i18n/ui/ko.ts` `en.ts`
- Modify: `tests/unit/content-audit.test.ts`

**Interfaces:**
- Consumes: `ui`, `Locale` (Task 1·3)
- Produces:
  - `STATUS_LABELS: Record<Locale, Record<TrustStatus, string>>` — `contracts.ts`
  - `ui(locale).discover.*`, `ui(locale).setlist.*`, `ui(locale).sources.*`

총 106줄. 가장 양이 많고 `sources.astro` 39줄이 그중 절반 가까이다.

**추가 규칙 — 신뢰 상태 라벨**

`src/lib/content/contracts.ts:14-21` 의 `STATUS_LABELS` 를 로케일 맵으로 바꾼다. **불변 규칙이 걸린 두 값의 의미를 바꾸지 않는다:** `expected` 는 "예상이며 보장이 아니다", `unpublished` 는 "미공개이며 확인이 필요하다" 를 두 로케일 모두에서 말해야 한다.

```ts
export const STATUS_LABELS: Record<Locale, Record<TrustStatus, string>> = {
  ko: {
    official: '공식 확정',
    practical: '실용 안내',
    'post-show': '공연 후 확인',
    pattern: '반복 패턴',
    expected: '예상 · 보장 아님',
    unpublished: '미공개 · 확인 필요',
  },
  en: {
    official: 'Confirmed by the promoter',
    practical: 'Practical guidance',
    'post-show': 'Verified after the show',
    pattern: 'Recurring pattern',
    expected: 'Expected · not guaranteed',
    unpublished: 'Not announced · needs checking',
  },
};
```

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`tests/unit/content-audit.test.ts` 에 더한다:

```ts
import { LOCALES } from '../../src/lib/i18n/locales';
import { STATUS_LABELS, TRUST_STATUSES } from '../../src/lib/content/contracts';

describe('status labels', () => {
  it('covers every status in every locale', () => {
    for (const locale of LOCALES)
      for (const status of TRUST_STATUSES)
        expect(STATUS_LABELS[locale][status]?.trim()).toBeTruthy();
  });

  it('keeps the expected label honest in both locales', () => {
    expect(STATUS_LABELS.ko.expected).toContain('보장 아님');
    expect(STATUS_LABELS.en.expected).toContain('not guaranteed');
  });

  it('keeps the unpublished label honest in both locales', () => {
    expect(STATUS_LABELS.ko.unpublished).toContain('확인 필요');
    expect(STATUS_LABELS.en.unpublished).toContain('needs checking');
  });
});
```

`tests/e2e/i18n.spec.ts` 에 더한다:

```ts
test.describe('trust labels', () => {
  test('korean setlist keeps the guarantee disclaimer', async ({ page }) => {
    await page.goto('/setlist/');
    await expect(page.locator('main')).toContainText('예상 · 보장 아님');
  });

  test('english setlist carries the same disclaimer', async ({ page }) => {
    await page.goto('/en/setlist/');
    await expect(page.locator('main')).toContainText(
      'Expected · not guaranteed',
    );
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

```bash
npx vitest run tests/unit/content-audit.test.ts
```
Expected: FAIL — `STATUS_LABELS.ko` is undefined (현재는 평평한 맵이다)

- [ ] **Step 3: `contracts.ts`를 고친다**

위 `STATUS_LABELS` 로 바꾸고 `import type { Locale } from '../i18n/locales';` 를 더한다.

```bash
grep -rn 'STATUS_LABELS' src/
```
호출부를 전부 `STATUS_LABELS[locale][status]` 로 고친다.

- [ ] **Step 4: 통과를 확인한다**

```bash
npx vitest run tests/unit/content-audit.test.ts
npm run check
```
Expected: PASS

- [ ] **Step 5: 이관 대상 전체 목록을 뽑는다**

```bash
for f in src/components/discover/*.astro src/components/setlist/*.astro \
         src/components/content/*.astro \
         'src/pages/[...locale]/discover.astro' \
         'src/pages/[...locale]/setlist.astro' \
         'src/pages/[...locale]/sources.astro'; do
  echo "── $f"
  grep -n '[가-힣]' "$f"
done
```

- [ ] **Step 6: 사전에 키를 더하고 컴포넌트를 고친다**

`discover`·`setlist`·`sources` 세 그룹으로 나눈다.

`sources.astro` 39줄 중 상당수가 출처 종류(`official`·`public-agency`·`crowd-sourced`·`editorial-reference`) 라벨과 표 헤더다. `ui(locale).sources.kind.*` 에 넣는다:

```ts
// ko.ts
  sources: {
    kind: {
      official: '공식',
      'public-agency': '공공기관',
      'crowd-sourced': '이용자 제보',
      'editorial-reference': '편집 참고',
    },
    table: { name: '출처', lastChecked: '확인 날짜', usedIn: '쓰인 곳' },
  },
// en.ts
  sources: {
    kind: {
      official: 'Official',
      'public-agency': 'Public agency',
      'crowd-sourced': 'Crowd-sourced',
      'editorial-reference': 'Editorial reference',
    },
    table: { name: 'Source', lastChecked: 'Last checked', usedIn: 'Used in' },
  },
```

컴포넌트 frontmatter에 더하는 형태:

```astro
import type { Locale } from '../../lib/i18n/locales';
import { ui } from '../../lib/i18n/ui';

interface Props {
  locale: Locale;
  // … 기존 prop 그대로
}

const { locale, /* … */ } = Astro.props;
const strings = ui(locale);
```

부모 페이지가 `locale={locale}` 을 넘긴다. `aria-label`·`title`·`alt` 도 전부 대상이다. **콘텐츠 데이터에서 온 값은 건드리지 않는다** — 2단계에서 다룬다.

Step 5 출력의 106줄을 전부 이렇게 옮긴다.

- [ ] **Step 7: 남은 한글이 없는지 확인한다**

```bash
grep -rn '[가-힣]' src/components/discover src/components/setlist src/components/content \
  'src/pages/[...locale]/discover.astro' 'src/pages/[...locale]/setlist.astro' \
  'src/pages/[...locale]/sources.astro'
```
Expected: 0건

- [ ] **Step 8: 통과와 무회귀를 확인한다**

```bash
npm run check
npm run build
npx playwright test tests/e2e/i18n.spec.ts tests/e2e/navigation.spec.ts --project=desktop-chromium
npm run audit:content
```
Expected: PASS. `navigation.spec.ts`(116줄 한글)가 통과하는 것이 이 태스크의 한국어 무회귀 증명이다.

- [ ] **Step 9: 커밋**

```bash
npx prettier --write src/components src/lib src/pages tests
npm run check && npm run lint
git add src/components src/lib src/pages tests
git commit -m "$(cat <<'EOF'
feat(content): localize trust labels and the discover, setlist and sources ui

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: 공유 빌더와 클라이언트 스크립트 문자열 주입

**Files:**
- Modify: `src/components/share/TicketBuilder.astro` (33) `SetlistCardBuilder.astro` (33)
- Modify: `src/pages/[...locale]/share/ticket.astro` (2) `setlist.astro` (2)
- Modify: `src/lib/share/canvas.ts` (3) `buildTicketLayout.ts` (1)
- Modify: `src/scripts/disclosure.ts` (4) `reveal.ts` (2) `setlist-filter.ts` (1) `venue-map.ts` (6)
- Modify: `src/lib/i18n/ui/ko.ts` `en.ts`

**Interfaces:**
- Consumes: `ui`, `Locale` (Task 1·3)
- Produces:
  - `renderCommands(canvas, commands, messages: CanvasMessages): Promise<Blob>` — `CanvasMessages = { imageLoadFailed: string; canvasUnavailable: string; exportFailed: string }`
  - `buildTicketLayout(input)` 의 `TicketLayoutInput` 에 `emptySongLabel: string` 이 추가된다
  - `ui(locale).share.*`

**핵심 제약:** `canvas.ts`·`buildTicketLayout.ts`·`src/scripts/*.ts` 는 클라이언트 번들이다. **사전을 import하지 않는다.** 문자열은 인자 또는 `data-*` 속성으로 들어간다. 사전 두 벌이 번들에 들어가면 JS 75KiB gzip 예산에 직접 부딪힌다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`tests/e2e/i18n.spec.ts` 에 더한다:

```ts
test.describe('share builders', () => {
  test('english ticket builder has no korean form labels', async ({ page }) => {
    await page.goto('/en/share/ticket/');
    await expect(page.locator('main')).not.toHaveText(/[가-힣]/);
  });

  test('korean ticket builder is unchanged', async ({ page }) => {
    await page.goto('/share/ticket/');
    await expect(page.locator('main')).toHaveText(/[가-힣]/);
  });

  test('english setlist card builder has no korean form labels', async ({
    page,
  }) => {
    await page.goto('/en/share/setlist/');
    await expect(page.locator('main')).not.toHaveText(/[가-힣]/);
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

```bash
npm run build
npx playwright test tests/e2e/i18n.spec.ts --project=desktop-chromium -g 'share builders'
```
Expected: FAIL — 영어 빌더에 한국어 폼 라벨이 남아 있다

- [ ] **Step 3: `canvas.ts`가 메시지를 인자로 받게 한다**

`src/lib/share/canvas.ts` 상단에 타입을 더한다:

```ts
/** Localized failure text. Passed in so this client module never imports a
 *  dictionary — two of them would land in the JS budget. */
export type CanvasMessages = {
  imageLoadFailed: string;
  canvasUnavailable: string;
  exportFailed: string;
};
```

17·61·208행의 한국어 리터럴을 각각 `messages.imageLoadFailed` · `messages.canvasUnavailable` · `messages.exportFailed` 로 바꾸고, `renderCommands` 시그니처와 이미지 로더에 `messages` 를 전달한다.

```ts
export async function renderCommands(
  canvas: HTMLCanvasElement,
  commands: DrawCommand[],
  messages: CanvasMessages,
): Promise<Blob> {
```

- [ ] **Step 4: `buildTicketLayout.ts`가 플레이스홀더를 받게 한다**

```ts
export type TicketLayoutInput = {
  showDate: string;
  dDayLabel: string;
  songs: [string, string, string] | string[];
  /** Shown in a slot the reader has not filled yet. */
  emptySongLabel: string;
};
```

69행을 바꾼다:

```ts
      value: input.songs[i] || input.emptySongLabel,
```

- [ ] **Step 5: 빌더 컴포넌트를 고친다**

`TicketBuilder.astro` · `SetlistCardBuilder.astro` 가 `locale: Locale` prop을 받고 `ui(locale)` 로 폼 UI 66줄을 바꾼다. 인라인 `<script>` 에는 문자열을 `data-*` 로 넘긴다:

```astro
<div
  class="ticket-builder"
  data-msg-image-load-failed={strings.share.errors.imageLoadFailed}
  data-msg-canvas-unavailable={strings.share.errors.canvasUnavailable}
  data-msg-export-failed={strings.share.errors.exportFailed}
  data-empty-song-label={strings.share.emptySong}
>
```

스크립트 쪽에서 읽는다:

```ts
const root = document.querySelector<HTMLElement>('.ticket-builder');
const messages = {
  imageLoadFailed: root?.dataset.msgImageLoadFailed ?? '',
  canvasUnavailable: root?.dataset.msgCanvasUnavailable ?? '',
  exportFailed: root?.dataset.msgExportFailed ?? '',
};
```

`share/ticket.astro` · `share/setlist.astro` 가 `locale={locale}` 을 넘긴다.

- [ ] **Step 6: 클라이언트 스크립트 4개를 고친다**

```bash
grep -n '[가-힣]' src/scripts/disclosure.ts src/scripts/reveal.ts \
  src/scripts/setlist-filter.ts src/scripts/venue-map.ts
```

각 문자열을 해당 스크립트가 붙는 요소의 `data-*` 속성으로 옮긴다. 속성을 내보내는 컴포넌트에서 `ui(locale)` 로 값을 채운다. **`src/scripts/` 에서 `src/lib/i18n` 을 import하지 않는다.**

- [ ] **Step 7: JS 예산을 확인한다**

```bash
npm run build
npm run budget
```
Expected: PASS — `javascript` 항목이 75KiB gzip 아래. 초과하면 사전이 클라이언트 번들에 새어 들어간 것이다:

```bash
grep -rl 'skipToContent' dist/_astro/*.js
```
Expected: 0건

- [ ] **Step 8: 통과와 무회귀를 확인한다**

```bash
npx playwright test tests/e2e/i18n.spec.ts tests/e2e/share.spec.ts tests/e2e/disclosure.spec.ts tests/e2e/setlist-filter.spec.ts --project=desktop-chromium
```
Expected: PASS. `share.spec.ts`(76줄 한글)가 통과하는 것이 한국어 무회귀 증명이다. 해당 스펙 파일명이 없으면 `ls tests/e2e/` 로 확인한다.

- [ ] **Step 9: 커밋**

```bash
npx prettier --write src tests
npm run check && npm run lint
git add src tests
git commit -m "$(cat <<'EOF'
feat(share): inject localized copy into the card builders and client scripts

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: 예산 스크립트와 전체 검증

**Files:**
- Modify: `scripts/check-performance-budget.mjs`
- Modify: `tests/unit/performance-budget.test.ts`
- Modify: `tests/e2e/no-js.spec.ts`
- Modify: `tests/e2e/accessibility.spec.ts`

**Interfaces:**
- Consumes: 앞선 모든 태스크
- Produces: 14개 라우트 전부가 예산·접근성·no-JS 검사를 통과한다

- [ ] **Step 1: 예산 스크립트가 어떻게 라우트를 나누는지 확인한다**

```bash
sed -n '45,100p' scripts/check-performance-budget.mjs
```

`pageRasterBudgets = { home: 700 * 1024, other: 400 * 1024 }` 를 고르는 지점을 찾는다. 지금은 홈을 경로로 판별한다.

- [ ] **Step 2: 실패하는 테스트를 쓴다**

`tests/unit/performance-budget.test.ts` 에 더한다. 기존 fixture 패턴을 따른다:

```ts
it('gives the english home the home budget, not the other-page budget', () => {
  expect(rasterBudgetFor('en/index.html')).toBe(700 * 1024);
  expect(rasterBudgetFor('index.html')).toBe(700 * 1024);
  expect(rasterBudgetFor('en/goyang/index.html')).toBe(400 * 1024);
  expect(rasterBudgetFor('goyang/index.html')).toBe(400 * 1024);
});
```

`rasterBudgetFor` 가 아직 export되지 않았다면 이 태스크에서 스크립트에서 꺼낸다.

- [ ] **Step 3: 실패를 확인한다**

```bash
npx vitest run tests/unit/performance-budget.test.ts
```
Expected: FAIL — `en/index.html` 이 `other` 예산(400KiB)을 받는다

- [ ] **Step 4: 스크립트를 고친다**

라우트 판별에서 로케일 접두사를 먼저 벗긴다:

```js
const LOCALE_PREFIXES = ['en/'];

function bareRoute(relativePath) {
  for (const prefix of LOCALE_PREFIXES)
    if (relativePath.startsWith(prefix))
      return relativePath.slice(prefix.length);
  return relativePath;
}

export function rasterBudgetFor(relativePath) {
  return bareRoute(relativePath) === 'index.html'
    ? pageRasterBudgets.home
    : pageRasterBudgets.other;
}
```

- [ ] **Step 5: 통과를 확인한다**

```bash
npx vitest run tests/unit/performance-budget.test.ts
npm run build
npm run budget
```
Expected: PASS — 14개 라우트가 출력되고 예산 초과가 없다

- [ ] **Step 6: no-JS 전환기 케이스를 더한다**

`tests/e2e/no-js.spec.ts` 에 더한다. 기존 파일의 JS 비활성 컨텍스트 패턴을 그대로 쓴다:

```ts
test('switches locale without javascript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/goyang/');
  await page.getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/en\/goyang\/$/);
  await context.close();
});
```

- [ ] **Step 7: 접근성·가로 넘침 매트릭스를 두 로케일로 넓힌다**

`tests/e2e/accessibility.spec.ts` 의 라우트 목록을 두 로케일로 확장한다. 기존 목록이 `const ROUTES = ['/', '/discover/', …]` 형태라면:

```ts
const ROUTES = [
  '/',
  '/discover/',
  '/setlist/',
  '/goyang/',
  '/sources/',
  '/share/ticket/',
  '/share/setlist/',
];
const LOCALIZED = ROUTES.flatMap((route) => [route, `/en${route}`]);
```

320px·200% 텍스트 확대 가로 넘침 검사도 `LOCALIZED` 를 돌게 한다. **영어가 이번 작업의 최대 시각 위험이다** — 단어가 길고 끊을 자리가 적어 좁은 컬럼에서 넘친다.

- [ ] **Step 8: 전체 체인을 돌린다**

```bash
npm run verify
```
Expected: PASS — lint → format:check → check → audit:content → test:unit → build → budget → test:e2e

- [ ] **Step 9: 배포 구성을 확인한다**

```bash
PUBLIC_SITE_URL=https://fan-guide.test npm run build
npx wrangler deploy --dry-run
```
Expected: PASS. **실제 배포는 하지 않는다.**

- [ ] **Step 10: 남은 한글 UI 문자열이 없는지 최종 확인한다**

```bash
grep -rn '[가-힣]' src/components src/scripts src/pages src/layouts src/lib \
  | grep -v 'src/lib/i18n/ui/ko.ts' \
  | grep -v 'src/lib/i18n/proper-nouns.ts' \
  | grep -v 'src/lib/content/contracts.ts'
```
Expected: 0건. 남은 것이 있으면 사전으로 옮긴다.

- [ ] **Step 11: 커밋**

```bash
npx prettier --write scripts tests
npm run lint
git add scripts tests
git commit -m "$(cat <<'EOF'
test(i18n): cover both locales in the budget, a11y and no-js matrices

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 1 완료 기준

- `/`, `/discover/`, `/setlist/`, `/goyang/`, `/sources/`, `/share/ticket/`, `/share/setlist/` 가 전부 이전과 같은 URL·같은 한국어 문구로 뜬다.
- 같은 7개가 `/en/` 접두사로도 뜨며, **UI는 영어, 본문 콘텐츠는 한국어**다.
- `/en/en/` 같은 이중 접두사 라우트가 없다.
- 모든 페이지가 canonical 1개와 `hreflang` 3개(`ko`·`en`·`x-default`)를 낸다.
- 언어 전환기가 JavaScript 없이 동작한다.
- `npm run verify` 와 `npx wrangler deploy --dry-run` 이 통과한다.
- `src/data/` 는 수정되지 않았다: `git diff --stat main -- src/data` 가 빈 출력.

다음: `docs/superpowers/plans/2026-09-20-english-localization-phase-2-content.md`
