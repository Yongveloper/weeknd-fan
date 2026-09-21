# English Localization — Phase 2 (Content) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 영어 라우트가 영어 본문을 렌더하게 하고, 한국어 정본이 바뀌면 번역이 stale로 판정돼 빌드가 서는 게이트를 세운다.

**Architecture:** `src/data/` 정본은 그대로 두고 `src/data/i18n/en/` 오버레이에 번역만 쌓는다. 오버레이는 `sourceHash` 를 들고 있고, `audit:content` 가 정본에서 다시 계산한 해시와 비교한다. `src/lib/content/queries.ts` 가 단일 병합 지점이며 `locale === 'ko'` 일 때는 오버레이 조회 자체를 건너뛴다.

**Tech Stack:** Astro 6 content collections (`glob` loader), Zod, `node:crypto`, Vitest. 시각 확인만 Playwright MCP.

**Spec:** `docs/superpowers/specs/2026-09-20-english-localization-design.md`

**전제:** Phase 1(`docs/superpowers/plans/2026-09-20-english-localization-phase-1-infrastructure.md`)이 완료돼 있다. 14개 라우트가 뜨고 UI는 두 로케일, 본문은 한국어다.

**`audit:content` 기준선:** 이 작업 이전부터 16건 실패한다(8개 휘발성 가이드 × 2코드).
Phase 2가 더하는 번역 규칙은 `auditTranslations()` 단위 테스트와 디스크 기반 계약 테스트로
따로 검증하므로 이 기준선에 가리지 않는다. 기준선이 **커지면** 이 작업이 깨뜨린 것이다.

**검증 수단:** `tests/e2e/` 의 13개 스펙은 이 작업 이전부터 관리되지 않아 현재 전부 실패한다. **`npm run test:e2e` 와 `npx playwright test` 를 실행하지 않는다.** Phase 1 Task 2에서 만든 `scripts/check-dist-i18n.mjs`(`npm run check:dist`)가 빌드 산출물을 정적으로 검사하고, 게이트는 `npm run verify:core` 다. 레이아웃 확인만 **Playwright MCP** 헤디드 투어로 한다.

## Global Constraints

- Phase 1의 Global Constraints가 전부 그대로 적용된다. 특히: Node 22.14.0, 포트 4323, `wrangler.jsonc` 불변, `npm run deploy` 금지, 성능 예산, 클라이언트 번들에 사전 import 금지.
- **`src/data/` 아래 117개 정본 파일은 이 단계에서도 수정하지 않는다.** 새 파일은 전부 `src/data/i18n/en/` 아래에만 만든다.
- 오버레이는 `status`·`lastVerifiedAt`·`sources`·`order`·`section` 을 **복제하지 않는다.** 신뢰 계약은 정본 한 곳에만 있다.
- 해시 대상은 `title` + `summary` + 본문뿐이다. `lastVerifiedAt`·`sources`·`status` 는 해시에 **넣지 않는다** — 출처 날짜 갱신이 번역을 stale로 만들면 게이트가 무의미해진다.
- 번역 중 정보를 더하거나 보정하지 않는다. 정본이 "미공개"면 번역도 미공개다.
- 불확실성의 강도를 보존한다. "~로 보입니다"를 "is"로 옮기지 않는다.
- 고유명사는 `src/lib/i18n/proper-nouns.ts` 만 사용한다. 번역문에 `The Weeknd`·`After Hours Til Dawn` 을 직접 적지 않는다. 장소·역명은 영어판에서 한글을 병기한다.
- 번역 본문의 URL 집합은 정본과 **완전히 같아야 한다.** 링크를 흘리면 근거 없는 주장이 된다.
- `expected` 항목은 두 로케일 모두 "예상이며 보장이 아니다", `unpublished` 는 "미공개이며 확인이 필요하다"를 말해야 한다.
- 커밋: Conventional Commits, 영어 소문자 subject ≤ 72자. 번역 커밋은 `content(i18n): …` 형식. 끝에 `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>` 를 붙인다.

---

## File Structure

### 신규 — 코드

| 파일 | 책임 |
|---|---|
| `src/lib/i18n/content/source-text.ts` | 정본 파일에서 번역 대상 텍스트만 뽑는 파서 |
| `src/lib/i18n/content/hash.ts` | `translatableHash`, `urlsIn` |
| `src/lib/i18n/content/overlays.ts` | JSON 번들 로드 + Zod 검증 |
| `src/lib/i18n/content/merge.ts` | 정본 + 오버레이 병합 타입과 함수 |
| `src/components/content/SourceLanguageNotice.astro` | 폴백 고지 |
| `scripts/i18n-status.mjs` | 로케일별 ok/missing/stale 표 |
| `scripts/i18n-hash.mjs` | 정본 id의 현재 해시 출력 |
| `tests/unit/i18n-hash.test.ts` | 파서·해시·URL 추출 |
| `tests/unit/i18n-overlays.test.ts` | 번들 스키마 |

### 신규 — 번역문 25개

```
src/data/i18n/en/guides/*.md        11
src/data/i18n/en/discover/*.md      11
src/data/i18n/en/setlist.json        1
src/data/i18n/en/sources.json        1
src/data/i18n/en/concert.json        1
```

### 수정

`src/content.config.ts` · `src/lib/content/queries.ts` · `src/lib/content/audit.ts` · `src/lib/content/contracts.ts` · `src/lib/i18n/ui/ko.ts` `en.ts` · `src/pages/[...locale]/*.astro` · `src/components/guide/GuideSection.astro` `TipsTabs.astro` · `tests/unit/content-audit.test.ts` · `scripts/check-dist-i18n.mjs` · `package.json` · `docs/content-update-runbook.md`

---

## Task 1: 정본 파서와 해시

**Files:**
- Create: `src/lib/i18n/content/source-text.ts`
- Create: `src/lib/i18n/content/hash.ts`
- Create: `tests/unit/i18n-hash.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `type TranslatableText = { title: string; summary: string; body?: string }`
  - `parseMarkdownSource(raw: string, id: string): TranslatableText`
  - `translatableHash(text: TranslatableText): string` — sha256 앞 16자
  - `urlsIn(body: string): string[]` — 정렬된 마크다운 링크 URL

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`tests/unit/i18n-hash.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { translatableHash, urlsIn } from '../../src/lib/i18n/content/hash';
import { parseMarkdownSource } from '../../src/lib/i18n/content/source-text';

const RAW = `---
title: 입장
summary: 타 공연 후기에서 반복된 경험입니다.
status: practical
lastVerifiedAt: 2026-08-29
sources:
  - news-ohmynews-2025-04
order: 32
section: tips
---

- 대화역 3번 출구. — [오마이뉴스](https://example.test/a)
- 보관함 부족. — [후기](https://example.test/b)
`;

describe('parseMarkdownSource', () => {
  it('takes only the translatable fields and the body', () => {
    const parsed = parseMarkdownSource(RAW, 'guides/32-tips-entry');
    expect(parsed.title).toBe('입장');
    expect(parsed.summary).toBe('타 공연 후기에서 반복된 경험입니다.');
    expect(parsed.body).toContain('대화역 3번 출구');
    expect(parsed.body).not.toContain('lastVerifiedAt');
  });

  it('fails loudly when a field is not a single-line scalar', () => {
    expect(() =>
      parseMarkdownSource('---\ntitle: >\n  folded\nsummary: x\n---\n', 'x'),
    ).toThrow('Expected a single-line title in x');
  });

  it('fails loudly without frontmatter', () => {
    expect(() => parseMarkdownSource('no fences', 'y')).toThrow(
      'Missing frontmatter: y',
    );
  });
});

describe('translatableHash', () => {
  it('is stable across trailing whitespace and line endings', () => {
    const a = translatableHash({ title: 'x', summary: 'y', body: 'a\nb' });
    const b = translatableHash({ title: 'x', summary: 'y', body: 'a  \r\nb\n' });
    expect(a).toBe(b);
  });

  it('changes when the prose changes', () => {
    const a = translatableHash({ title: 'x', summary: 'y', body: 'a' });
    const b = translatableHash({ title: 'x', summary: 'y', body: 'A' });
    expect(a).not.toBe(b);
  });

  it('does not depend on fields outside the translatable set', () => {
    const parsed = parseMarkdownSource(RAW, 'id');
    const withNewDate = parseMarkdownSource(
      RAW.replace('2026-08-29', '2026-09-30'),
      'id',
    );
    expect(translatableHash(parsed)).toBe(translatableHash(withNewDate));
  });

  it('is short enough to paste into frontmatter', () => {
    expect(translatableHash({ title: 'x', summary: 'y' })).toHaveLength(16);
  });
});

describe('urlsIn', () => {
  it('collects markdown link targets in a stable order', () => {
    expect(urlsIn('[b](https://example.test/b) [a](https://example.test/a)'))
      .toEqual(['https://example.test/a', 'https://example.test/b']);
  });

  it('ignores relative links', () => {
    expect(urlsIn('[x](/goyang/)')).toEqual([]);
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

```bash
npx vitest run tests/unit/i18n-hash.test.ts
```
Expected: FAIL — `Failed to resolve import ".../source-text"`

- [ ] **Step 3: 파서를 쓴다**

`src/lib/i18n/content/source-text.ts`:

```ts
export type TranslatableText = {
  title: string;
  summary: string;
  body?: string;
};

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/**
 * Pulls only what a translator rewrites. Trust-contract fields
 * (status, lastVerifiedAt, sources, order, section) are deliberately
 * excluded so a routine source-date refresh never marks a translation
 * stale.
 */
export function parseMarkdownSource(
  raw: string,
  id: string,
): TranslatableText {
  const match = FRONTMATTER.exec(raw);
  if (!match) throw new Error(`Missing frontmatter: ${id}`);
  const frontmatter = match[1] ?? '';
  return {
    title: scalar(frontmatter, 'title', id),
    summary: scalar(frontmatter, 'summary', id),
    body: match[2] ?? '',
  };
}

function scalar(frontmatter: string, key: string, id: string): string {
  const line = new RegExp(`^${key}: (\\S.*)$`, 'm').exec(frontmatter);
  const value = line?.[1]?.trim();
  if (!value) throw new Error(`Expected a single-line ${key} in ${id}`);
  return value;
}
```

- [ ] **Step 4: 해시를 쓴다**

`src/lib/i18n/content/hash.ts`:

```ts
import { createHash } from 'node:crypto';
import type { TranslatableText } from './source-text';

const MARKDOWN_LINK = /\]\((https?:\/\/[^)\s]+)\)/g;

/** Build-time only. Never import this from a client bundle. */
export function translatableHash(text: TranslatableText): string {
  const normalized = [text.title, text.summary, text.body ?? '']
    .map((part) =>
      part.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim(),
    )
    .join('\n\u0000\n');
  return createHash('sha256')
    .update(normalized, 'utf8')
    .digest('hex')
    .slice(0, 16);
}

/**
 * Every citation a body carries. The Korean source attaches a link to each
 * claim, so a translation that drops one turns a sourced statement into an
 * unsourced one.
 */
export function urlsIn(body: string): string[] {
  return [...body.matchAll(MARKDOWN_LINK)]
    .map((match) => match[1] ?? '')
    .filter(Boolean)
    .sort();
}
```

- [ ] **Step 5: 통과를 확인한다**

```bash
npx vitest run tests/unit/i18n-hash.test.ts
```
Expected: PASS — 10 tests

- [ ] **Step 6: 커밋**

```bash
npx prettier --write src/lib/i18n tests/unit/i18n-hash.test.ts
npm run check && npm run lint
git add src/lib/i18n tests/unit/i18n-hash.test.ts
git commit -m "$(cat <<'EOF'
feat(i18n): hash only the translatable part of a source entry

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `i18n:status` 와 `i18n:hash` 스크립트

**Files:**
- Create: `scripts/i18n-status.mjs`
- Create: `scripts/i18n-hash.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `parseMarkdownSource`, `translatableHash` (Task 1)
- Produces:
  - `npm run i18n:status` — 종료 코드 0(전부 ok) 또는 1
  - `npm run i18n:hash <collection>/<id>` — 16자 해시를 표준출력으로

두 스크립트 모두 `node --experimental-strip-types` 로 돌려 `hash.ts` 를 그대로 import한다. `fonts:header` 가 이미 같은 방식이다. 해시 계산이 앱과 스크립트에서 **같은 코드 한 벌**이어야 하기 때문이다.

- [ ] **Step 1: `i18n-hash.mjs` 를 쓴다**

```js
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { translatableHash } from '../src/lib/i18n/content/hash.ts';
import { parseMarkdownSource } from '../src/lib/i18n/content/source-text.ts';

const target = process.argv[2];
if (!target) {
  process.stderr.write('usage: npm run i18n:hash -- guides/32-tips-entry\n');
  process.exit(2);
}

const [collection, ...rest] = target.split('/');
const id = rest.join('/');

if (collection === 'guides' || collection === 'discover') {
  const raw = await readFile(`src/data/${collection}/${id}.md`, 'utf8');
  process.stdout.write(`${translatableHash(parseMarkdownSource(raw, target))}\n`);
} else {
  const file = JSON.parse(
    await readFile(`src/data/${collection}/${id}.json`, 'utf8'),
  );
  process.stdout.write(
    `${translatableHash({
      title: file.title,
      summary: file.summary,
      body: JSON.stringify(translatableJsonFields(collection, file)),
    })}\n`,
  );
}

/** The JSON fields a translator rewrites, in a fixed order. */
export function translatableJsonFields(collection, file) {
  if (collection === 'setlist')
    return [file.liveNote, file.singAlongNote];
  if (collection === 'sources') return [file.name];
  if (collection === 'concert')
    return [
      file.venue,
      file.ageRestriction,
      ...file.shows.map((show) => show.dateLabel),
    ];
  throw new Error(`Unknown collection: ${collection}`);
}
```

`sources` 는 `title`/`summary` 가 없으므로 `file.title ?? file.name` 처럼 읽는다. 실제 필드는 다음으로 확인한다:

```bash
cat src/data/sources/news-ohmynews-2025-04.json
```

- [ ] **Step 2: `i18n-status.mjs` 를 쓴다**

정본과 오버레이를 훑어 표를 낸다.

```js
import { readFile, readdir } from 'node:fs/promises';
import process from 'node:process';
import { translatableHash } from '../src/lib/i18n/content/hash.ts';
import { parseMarkdownSource } from '../src/lib/i18n/content/source-text.ts';

const LOCALES = ['en'];
const MARKDOWN = ['guides', 'discover'];

let failed = false;

for (const locale of LOCALES) {
  for (const collection of MARKDOWN) {
    const sources = (await readdir(`src/data/${collection}`))
      .filter((name) => name.endsWith('.md'))
      .sort();
    for (const name of sources) {
      const id = name.replace(/\.md$/, '');
      const raw = await readFile(`src/data/${collection}/${name}`, 'utf8');
      const current = translatableHash(
        parseMarkdownSource(raw, `${collection}/${id}`),
      );
      const overlayPath = `src/data/i18n/${locale}/${collection}/${name}`;
      let state = 'ok';
      try {
        const overlay = await readFile(overlayPath, 'utf8');
        const recorded = /^sourceHash: (\S+)$/m.exec(overlay)?.[1];
        if (recorded !== current) state = 'stale';
      } catch {
        state = 'missing';
      }
      if (state !== 'ok') failed = true;
      process.stdout.write(
        `${locale}\t${collection}/${id}\t${state}\t${current}\n`,
      );
    }
  }
}

process.exit(failed ? 1 : 0);
```

JSON 번들(`setlist`·`sources`·`concert`)도 같은 방식으로 훑는다. 번들은 파일 하나 안에 id별 `sourceHash` 가 있으므로 `JSON.parse` 후 키를 돈다.

- [ ] **Step 3: `package.json` 에 스크립트를 더한다**

```json
    "i18n:status": "node --experimental-strip-types --no-warnings=ExperimentalWarning scripts/i18n-status.mjs",
    "i18n:hash": "node --experimental-strip-types --no-warnings=ExperimentalWarning scripts/i18n-hash.mjs",
```

- [ ] **Step 4: 실행을 확인한다**

```bash
npm run i18n:status
```
Expected: 22줄 이상이 `missing` 으로 출력되고 종료 코드 1. 아직 번역이 하나도 없으므로 정상이다.

```bash
npm run i18n:hash -- guides/32-tips-entry
```
Expected: 16자 16진 문자열 한 줄

- [ ] **Step 5: 커밋**

```bash
npx prettier --write scripts package.json
npm run lint
git add scripts package.json
git commit -m "$(cat <<'EOF'
feat(i18n): add the translation status and hash scripts

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: 오버레이 컬렉션과 번들 로더

**Files:**
- Modify: `src/content.config.ts`
- Create: `src/lib/i18n/content/overlays.ts`
- Create: `tests/unit/i18n-overlays.test.ts`
- Create: `src/data/i18n/en/guides/32-tips-entry.md` (단 하나, 파이프라인 증명용)
- Create: `src/data/i18n/en/setlist.json` `sources.json` `concert.json` (빈 객체 `{}`)

**Interfaces:**
- Consumes: 없음
- Produces:
  - 컬렉션 `guidesI18n`, `discoverI18n` — id가 `en/<name>` 형태
  - `type OverlayMeta = { sourceHash: string; translatedAt: string }`
  - `setlistOverlay(locale: Locale): Record<string, SetlistOverlay>`
  - `sourcesOverlay(locale: Locale): Record<string, SourceOverlay>`
  - `concertOverlay(locale: Locale): Record<string, ConcertOverlay>`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`tests/unit/i18n-overlays.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  concertOverlay,
  setlistOverlay,
  sourcesOverlay,
} from '../../src/lib/i18n/content/overlays';

describe('json overlays', () => {
  it('parses each bundle without throwing', () => {
    expect(() => setlistOverlay('en')).not.toThrow();
    expect(() => sourcesOverlay('en')).not.toThrow();
    expect(() => concertOverlay('en')).not.toThrow();
  });

  it('returns an empty map for korean, which needs no overlay', () => {
    expect(setlistOverlay('ko')).toEqual({});
    expect(sourcesOverlay('ko')).toEqual({});
    expect(concertOverlay('ko')).toEqual({});
  });

  it('requires a sourceHash on every translated entry', () => {
    for (const entry of Object.values(setlistOverlay('en')))
      expect(entry.sourceHash).toMatch(/^[0-9a-f]{16}$/);
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

```bash
npx vitest run tests/unit/i18n-overlays.test.ts
```
Expected: FAIL — `Failed to resolve import ".../overlays"`

- [ ] **Step 3: 빈 번들과 예시 오버레이 하나를 만든다**

```bash
mkdir -p src/data/i18n/en/guides src/data/i18n/en/discover
printf '{}\n' > src/data/i18n/en/setlist.json
printf '{}\n' > src/data/i18n/en/sources.json
printf '{}\n' > src/data/i18n/en/concert.json
npm run i18n:hash -- guides/32-tips-entry
```

출력된 해시를 `sourceHash` 에 넣어 `src/data/i18n/en/guides/32-tips-entry.md` 를 만든다. 정본 4개 링크를 **모두 그대로** 옮긴다:

```markdown
---
title: Entry
summary: Walking route, prohibited items and locker notes that recur across reviews of other shows at this venue.
sourceHash: <npm run i18n:hash 출력>
translatedAt: 2026-09-20
---

- Cross one crosswalk from Exit 3 of Daehwa Station · 대화역 and you are at the stadium (about a 3-minute walk). — [OhmyNews, 2025-04](https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0003119116)
- The notice for the Lim Young-woong Goyang shows (2026-09) listed umbrellas, large cameras, selfie sticks, outside food and drink, banners and laser pointers as prohibited, said a screenshot of a ticket QR is not accepted, and required photo ID. It said the merchandise booth is set up outside, before entry. — [Show review, 2026-07](https://www.tndlrs.com/2026/07/herolanding3.html)
- Lockers at Daehwa Station · 대화역 ran well short on show days; one review describes using a reservation-based storage service near Exit 4. — [Community review, 2026-08](https://gall.dcinside.com/mgallery/board/view/?id=bigbangvip&no=270100)
- At the BTS shows (2026-04) police and stewards were posted along the entry and exit routes, and the venue emptied section by section. — [Community review, 2026-04](https://www.clien.net/service/board/park/19176744)
```

정본 본문은 다음으로 확인한다:

```bash
cat src/data/guides/32-tips-entry.md
```

- [ ] **Step 4: 컬렉션을 더한다**

`src/content.config.ts` 에 더한다. **기존 컬렉션 정의는 건드리지 않는다.**

```ts
const overlayCommon = z.object({
  title: z.string(),
  summary: z.string(),
  sourceHash: z.string().regex(/^[0-9a-f]{16}$/),
  translatedAt: z.iso.date(),
});

const guidesI18n = defineCollection({
  loader: glob({ base: './src/data/i18n', pattern: '*/guides/**/*.md' }),
  schema: overlayCommon,
});

const discoverI18n = defineCollection({
  loader: glob({ base: './src/data/i18n', pattern: '*/discover/**/*.md' }),
  schema: overlayCommon,
});
```

`collections` export에 `guidesI18n, discoverI18n` 을 더한다.

- [ ] **Step 5: 번들 로더를 쓴다**

`src/lib/i18n/content/overlays.ts`:

```ts
import { z } from 'astro/zod';
import { DEFAULT_LOCALE, type Locale } from '../locales';
import enConcert from '../../../data/i18n/en/concert.json';
import enSetlist from '../../../data/i18n/en/setlist.json';
import enSources from '../../../data/i18n/en/sources.json';

const meta = {
  sourceHash: z.string().regex(/^[0-9a-f]{16}$/),
  translatedAt: z.iso.date(),
};

const setlistSchema = z.record(
  z.string(),
  z.object({
    title: z.string(),
    summary: z.string(),
    liveNote: z.string(),
    singAlongNote: z.string(),
    ...meta,
  }),
);

const sourcesSchema = z.record(
  z.string(),
  z.object({ name: z.string(), ...meta }),
);

const concertSchema = z.record(
  z.string(),
  z.object({
    title: z.string(),
    summary: z.string(),
    ageRestriction: z.string(),
    shows: z.array(z.object({ dateLabel: z.string() })).length(2),
    ...meta,
  }),
);

export type SetlistOverlay = z.infer<typeof setlistSchema>[string];
export type SourceOverlay = z.infer<typeof sourcesSchema>[string];
export type ConcertOverlay = z.infer<typeof concertSchema>[string];

const BUNDLES = { en: { setlist: enSetlist, sources: enSources, concert: enConcert } };

function bundle<T>(schema: z.ZodType<T>, locale: Locale, key: 'setlist' | 'sources' | 'concert'): T {
  if (locale === DEFAULT_LOCALE) return schema.parse({});
  return schema.parse(BUNDLES[locale as 'en'][key]);
}

export const setlistOverlay = (locale: Locale) =>
  bundle(setlistSchema, locale, 'setlist');
export const sourcesOverlay = (locale: Locale) =>
  bundle(sourcesSchema, locale, 'sources');
export const concertOverlay = (locale: Locale) =>
  bundle(concertSchema, locale, 'concert');
```

- [ ] **Step 6: 통과를 확인한다**

```bash
npx vitest run tests/unit/i18n-overlays.test.ts
npm run check
npm run build
```
Expected: PASS. 빌드가 새 컬렉션을 로드하고 `32-tips-entry` 오버레이 하나를 인식한다.

- [ ] **Step 7: 상태 스크립트로 확인한다**

```bash
npm run i18n:status | grep 32-tips-entry
```
Expected: `en	guides/32-tips-entry	ok	<hash>`

- [ ] **Step 8: 커밋**

```bash
npx prettier --write src tests
npm run check && npm run lint
git add src tests
git commit -m "$(cat <<'EOF'
feat(i18n): add the overlay collections and json bundle loaders

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: 병합 레이어와 폴백 고지

**Files:**
- Create: `src/lib/i18n/content/merge.ts`
- Create: `src/components/content/SourceLanguageNotice.astro`
- Modify: `src/lib/content/queries.ts`
- Modify: `src/components/guide/GuideSection.astro` `TipsTabs.astro`
- Modify: `src/pages/[...locale]/goyang.astro` `discover.astro` `setlist.astro` `sources.astro` `index.astro`
- Modify: `src/lib/i18n/ui/ko.ts` `en.ts`

**Interfaces:**
- Consumes: 오버레이 컬렉션·번들 (Task 3)
- Produces:
  - `type Localized<D, R> = { data: D; renderEntry: R; translated: boolean }`
  - `getGuideContent(locale?: Locale)` — 기본값 `DEFAULT_LOCALE`
  - `getDiscoverContent(locale?)`, `getExpectedSetlist(locale?)`, `getConcert(locale?)`
  - `resolveSourceReferences(refs, sources, locale?)`
  - `ui(locale).content.koreanSourceNotice`

**설계 핵심:** `locale === 'ko'` 이면 오버레이 조회를 **건너뛴다.** 한국어 경로의 코드 경로가 현재와 사실상 같아지므로 회귀 위험이 여기서 끊긴다. 모든 `locale` 인자가 `= DEFAULT_LOCALE` 기본값을 가지므로 기존 호출부는 그대로 컴파일된다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`scripts/check-dist-i18n.mjs` 의 `checkPage()` 에 블록을 더한다:

```js
  // Phase 2 Task 4 — translated bodies land, untranslated ones say so
  if (locale === 'en' && route === 'goyang/') {
    if (!html.includes('Cross one crosswalk from Exit 3'))
      fail(relative, 'the translated guide body did not render');
  }
  if (locale === 'ko' && html.includes('This section is shown in Korean.'))
    fail(relative, 'the fallback notice leaked onto a korean page');
```

폴백 고지가 **영어 페이지에 실제로 뜨는지**는 이 시점에 번역이 하나뿐이라 개수로 잰다:

```js
  // Every untranslated section carries the notice. Phase 2 Task 10 tightens
  // this to zero once all 25 overlays exist.
  if (locale === 'en') {
    const notices = (html.match(/This section is shown in Korean\./g) ?? []).length;
    if (route === 'goyang/' && notices === 0)
      fail(relative, 'no fallback notice on a page with untranslated sections');
  }
```


- [ ] **Step 2: 실패를 확인한다**

```bash
npm run build
npm run check:dist
```
Expected: FAIL — 영어 가이드가 아직 한국어 본문이다

- [ ] **Step 3: 병합 타입을 쓴다**

`src/lib/i18n/content/merge.ts`:

```ts
import type { Locale } from '../locales';

export type Localized<D, R> = {
  /** Translated where a translation exists, source of record otherwise. */
  data: D;
  /** Passed to `render()`. The overlay entry when translated. */
  renderEntry: R;
  translated: boolean;
};

/** Overlay ids are `<locale>/<id>`; source ids are bare. */
export function overlayId(locale: Locale, id: string): string {
  return `${locale}/${id}`;
}
```

- [ ] **Step 4: 고지 컴포넌트를 쓴다**

`src/components/content/SourceLanguageNotice.astro`:

```astro
---
import type { Locale } from '../../lib/i18n/locales';
import { DEFAULT_LOCALE } from '../../lib/i18n/locales';
import { localeHref } from '../../lib/i18n/routes';
import { pathWithoutLocale } from '../../lib/i18n/routes';
import { ui } from '../../lib/i18n/ui';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
const strings = ui(locale);
const koreanHref = localeHref(
  DEFAULT_LOCALE,
  pathWithoutLocale(Astro.url.pathname),
);
---

<p class="source-language-notice" lang={locale}>
  {strings.content.koreanSourceNotice}
  <a href={koreanHref} hreflang={DEFAULT_LOCALE}>
    {strings.content.koreanSourceLink}
  </a>
</p>

<style>
  .source-language-notice {
    font-size: 0.875rem;
    opacity: 0.8;
  }
</style>
```

사전에 키를 더한다:

```ts
// ko.ts — 한국어 경로에서는 렌더되지 않지만 타입 원본이라 값이 필요하다
  content: {
    koreanSourceNotice: '이 항목은 한국어 원문입니다.',
    koreanSourceLink: '한국어판 보기',
  },
// en.ts
  content: {
    koreanSourceNotice:
      'This section is shown in Korean. The Korean text is the source of record.',
    koreanSourceLink: 'Read the Korean page',
  },
```

- [ ] **Step 5: `queries.ts` 에 병합을 넣는다**

`getGuideContent` 를 바꾼다. 나머지 함수도 같은 형태다.

```ts
import { getCollection } from 'astro:content';
import { DEFAULT_LOCALE, type Locale } from '../i18n/locales';
import { overlayId, type Localized } from '../i18n/content/merge';

type GuideEntry = Awaited<ReturnType<typeof getCollection<'guides'>>>[number];
type GuideOverlayEntry = Awaited<
  ReturnType<typeof getCollection<'guidesI18n'>>
>[number];

export type LocalizedGuide = Localized<
  GuideEntry['data'],
  GuideEntry | GuideOverlayEntry
> & { entry: GuideEntry };

export async function getGuideContent(
  locale: Locale = DEFAULT_LOCALE,
): Promise<LocalizedGuide[]> {
  const entries = (await getCollection('guides')).sort(
    (a, b) => a.data.order - b.data.order,
  );

  // Korean is the source of record; skip the overlay lookup entirely so its
  // code path stays what it was before translation existed.
  if (locale === DEFAULT_LOCALE)
    return entries.map((entry) => ({
      entry,
      data: entry.data,
      renderEntry: entry,
      translated: false,
    }));

  const overlays = new Map(
    (await getCollection('guidesI18n')).map((entry) => [entry.id, entry]),
  );

  return entries.map((entry) => {
    const overlay = overlays.get(overlayId(locale, entry.id));
    if (!overlay)
      return { entry, data: entry.data, renderEntry: entry, translated: false };
    return {
      entry,
      data: { ...entry.data, title: overlay.data.title, summary: overlay.data.summary },
      renderEntry: overlay,
      translated: true,
    };
  });
}
```

`getExpectedSetlist`·`getConcert`·`resolveSourceReferences` 는 번들 오버레이를 쓴다. 예:

```ts
export async function getExpectedSetlist(locale: Locale = DEFAULT_LOCALE) {
  const entries = (await getCollection('setlist')).sort(
    (a, b) => a.data.expectedOrder - b.data.expectedOrder,
  );
  if (locale === DEFAULT_LOCALE)
    return entries.map((entry) => ({ entry, data: entry.data, translated: false }));

  const overlay = setlistOverlay(locale);
  return entries.map((entry) => {
    const translation = overlay[entry.id];
    if (!translation)
      return { entry, data: entry.data, translated: false };
    return {
      entry,
      data: {
        ...entry.data,
        title: translation.title,
        summary: translation.summary,
        liveNote: translation.liveNote,
        singAlongNote: translation.singAlongNote,
      },
      translated: true,
    };
  });
}
```

- [ ] **Step 6: 호출부를 고친다**

`GuideSection.astro` 와 `TipsTabs.astro` 가 `render(entry)` 대신 `render(renderEntry)` 를 쓰게 하고, `translated === false` 이고 `locale !== 'ko'` 일 때 `<SourceLanguageNotice locale={locale} />` 를 본문 위에 렌더한다.

각 페이지가 `getGuideContent(locale)` 처럼 로케일을 넘기게 한다:

```bash
grep -rn 'getGuideContent\|getDiscoverContent\|getExpectedSetlist\|getConcert\|resolveSourceReferences' src/
```

- [ ] **Step 7: 통과와 무회귀를 확인한다**

```bash
npm run check
npm run build
npm run check:dist
```
Expected: PASS

- [ ] **Step 8: 커밋**

```bash
npx prettier --write src tests
npm run check && npm run lint
git add src tests
git commit -m "$(cat <<'EOF'
feat(i18n): merge translation overlays into the content queries

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: audit 규칙

**Files:**
- Modify: `src/lib/content/audit.ts`
- Modify: `src/lib/content/contracts.ts`
- Modify: `tests/unit/content-audit.test.ts`

**Interfaces:**
- Consumes: `translatableHash`, `urlsIn` (Task 1)
- Produces:
  - `type TranslationAuditRecord = { id: string; locale: string; sourceExists: boolean; sourceHash: string; currentHash: string; sourceUrls: readonly string[]; translatedUrls: readonly string[] }`
  - `auditTranslations(records: TranslationAuditRecord[]): AuditIssue[]`
  - 코드: `translation-stale`, `translation-url-mismatch`, `translation-orphan`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`tests/unit/content-audit.test.ts` 에 더한다:

```ts
import { auditTranslations } from '../../src/lib/content/audit';

const base = {
  id: 'guides/32-tips-entry',
  locale: 'en',
  sourceExists: true,
  sourceHash: 'aaaaaaaaaaaaaaaa',
  currentHash: 'aaaaaaaaaaaaaaaa',
  sourceUrls: ['https://a.test'],
  translatedUrls: ['https://a.test'],
};

describe('translation audit', () => {
  it('passes a translation that matches its source', () => {
    expect(auditTranslations([base])).toEqual([]);
  });

  it('fails a translation whose source prose has moved on', () => {
    expect(auditTranslations([{ ...base, currentHash: 'bbbbbbbbbbbbbbbb' }]))
      .toEqual([{ id: 'en/guides/32-tips-entry', code: 'translation-stale' }]);
  });

  it('fails a translation that dropped a citation', () => {
    expect(auditTranslations([{ ...base, translatedUrls: [] }])).toEqual([
      { id: 'en/guides/32-tips-entry', code: 'translation-url-mismatch' },
    ]);
  });

  it('fails a translation that invented a citation', () => {
    expect(
      auditTranslations([
        { ...base, translatedUrls: ['https://a.test', 'https://b.test'] },
      ]),
    ).toEqual([
      { id: 'en/guides/32-tips-entry', code: 'translation-url-mismatch' },
    ]);
  });

  it('fails an overlay with no source entry', () => {
    expect(auditTranslations([{ ...base, sourceExists: false }])).toEqual([
      { id: 'en/guides/32-tips-entry', code: 'translation-orphan' },
    ]);
  });
});
```

정본 파일을 실제로 읽는 계약 테스트도 더한다. 기존 파일의 `readdir`/`readFile` 패턴을 따른다:

```ts
it('has no stale, orphaned or under-cited translation on disk', async () => {
  const records = await collectTranslationRecords();
  expect(auditTranslations(records)).toEqual([]);
});
```

`collectTranslationRecords()` 는 `scripts/i18n-status.mjs` 와 같은 순회를 하는 테스트 헬퍼다. 순회 로직을 `src/lib/i18n/content/collect.ts` 로 빼고 스크립트와 테스트가 함께 쓰면 중복이 없다.

- [ ] **Step 2: 실패를 확인한다**

```bash
npx vitest run tests/unit/content-audit.test.ts
```
Expected: FAIL — `auditTranslations is not a function`

- [ ] **Step 3: 구현을 쓴다**

`src/lib/content/audit.ts` 에 더한다:

```ts
export type TranslationAuditRecord = {
  id: string;
  locale: string;
  sourceExists: boolean;
  sourceHash: string;
  currentHash: string;
  sourceUrls: readonly string[];
  translatedUrls: readonly string[];
};

/**
 * Korean is the source of record. A translation that has drifted from it
 * would publish wrong gate, time or prohibited-item information, so a
 * mismatch stops the build rather than reaching a reader.
 */
export function auditTranslations(
  records: TranslationAuditRecord[],
): AuditIssue[] {
  const issues: AuditIssue[] = [];
  for (const record of records) {
    const id = `${record.locale}/${record.id}`;
    if (!record.sourceExists) {
      issues.push({ id, code: 'translation-orphan' });
      continue;
    }
    if (record.sourceHash !== record.currentHash)
      issues.push({ id, code: 'translation-stale' });
    const same =
      record.sourceUrls.length === record.translatedUrls.length &&
      record.sourceUrls.every((url, i) => url === record.translatedUrls[i]);
    if (!same) issues.push({ id, code: 'translation-url-mismatch' });
  }
  return issues;
}
```

- [ ] **Step 4: 통과를 확인한다**

```bash
npx vitest run tests/unit/content-audit.test.ts
npm run audit:content
```
Expected: PASS

- [ ] **Step 5: 게이트가 실제로 서는지 증명한다**

```bash
# 정본 산문을 한 줄 고친다
sed -i '' 's/^summary: 타 공연 후기에서/summary: 타 공연 후기에서 정말/' src/data/guides/32-tips-entry.md
npm run audit:content
```
Expected: **FAIL** — `translation-stale` 이 `en/guides/32-tips-entry` 를 지목한다

```bash
git checkout src/data/guides/32-tips-entry.md
npm run audit:content
```
Expected: PASS

- [ ] **Step 6: 출처 날짜 갱신은 게이트를 건드리지 않음을 증명한다**

```bash
SOURCE=src/data/sources/news-ohmynews-2025-04.json
sed -i '' 's/"lastCheckedAt": "[^"]*"/"lastCheckedAt": "2026-09-20"/' "$SOURCE"
npm run audit:content
```
Expected: **PASS** — 해시 범위가 산문으로 한정돼 있다는 증명

```bash
git checkout "$SOURCE"
```

- [ ] **Step 7: 커밋**

```bash
npx prettier --write src tests
npm run check && npm run lint
git add src tests
git commit -m "$(cat <<'EOF'
feat(audit): fail the build on stale or under-cited translations

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: guides 11개 번역

**Files:**
- Create: `src/data/i18n/en/guides/*.md` — 10개 (Task 3에서 `32-tips-entry.md` 하나는 이미 있다)

**Interfaces:**
- Consumes: Task 1~5 전부
- Produces: `guides` 컬렉션 전체가 `translated: true`

대상 목록:

```bash
ls src/data/guides/
```

**번역 절차 — 파일 하나마다 반복**

1. 정본을 읽는다: `cat src/data/guides/<name>.md`
2. 해시를 얻는다: `npm run i18n:hash -- guides/<id>`
3. 오버레이를 쓴다. frontmatter는 `title`·`summary`·`sourceHash`·`translatedAt` **네 필드만.**
4. 본문을 번역한다. **정본의 URL을 하나도 빠짐없이, 순서와 무관하게 전부** 옮긴다.
5. 장소·역명은 `Goyang Stadium · 고양종합운동장`, `Daehwa Station · 대화역` 형태로 한글을 병기한다.
6. 불확실성 표현을 보존한다: "~라는 후기가 있습니다" → "one review describes …", "~로 보입니다" → "appears to …". **"is" 로 단정하지 않는다.**
7. 정본에 없는 사실을 더하지 않는다.

- [ ] **Step 1: 한 파일을 번역하고 검사를 돌린다**

가장 짧은 파일부터 시작한다:

```bash
wc -c src/data/guides/*.md | sort -n | head -3
```

첫 파일을 번역한 뒤:

```bash
npm run i18n:status | grep guides
npm run audit:content
```
Expected: 해당 id가 `ok`. audit 통과.

- [ ] **Step 2: URL 패리티가 실제로 걸리는지 확인한다**

방금 쓴 오버레이에서 링크 하나를 지우고:

```bash
npm run audit:content
```
Expected: **FAIL** — `translation-url-mismatch`. 링크를 되돌린다.

- [ ] **Step 3: 나머지 9개를 같은 절차로 번역한다**

각 파일 뒤에:

```bash
npm run i18n:status | grep guides
```

- [ ] **Step 4: 전체를 확인한다**

```bash
npm run i18n:status | grep guides | grep -v '\tok\t'
```
Expected: 출력 없음 — 11개 전부 `ok`

```bash
npm run audit:content
npm run build
npm run check:dist
```
Expected: PASS

- [ ] **Step 5: 영어 가이드를 눈으로 확인한다**

```bash
npm run preview &
```
**Playwright MCP**로 `http://127.0.0.1:4323/en/goyang/` 를 1440×960, 390×844, 320×720+텍스트 200% 에서 본다. 가로 넘침·잘린 문장·한국어 잔존이 없는지 확인한다.

- [ ] **Step 6: 커밋**

```bash
npx prettier --write src/data/i18n
git add src/data/i18n
git commit -m "$(cat <<'EOF'
content(i18n): translate the goyang concert guide into english

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: discover 11개 번역

**Files:**
- Create: `src/data/i18n/en/discover/*.md` — 11개

**Interfaces:**
- Consumes: Task 6와 동일
- Produces: `discover` 컬렉션 전체가 `translated: true`

**번역 절차 — 파일 하나마다 반복**

1. 정본을 읽는다: `cat src/data/discover/<name>.md`
2. 해시를 얻는다: `npm run i18n:hash -- discover/<id>`
3. 오버레이를 쓴다. frontmatter는 `title`·`summary`·`sourceHash`·`translatedAt` **네 필드만.**
4. 본문을 번역한다. **정본의 URL을 하나도 빠짐없이** 옮긴다.
5. 장소·역명은 `Goyang Stadium · 고양종합운동장` 형태로 한글을 병기한다.
6. 불확실성 표현을 보존한다. **"is" 로 단정하지 않는다.**
7. 정본에 없는 사실을 더하지 않는다.

추가 규칙:

- 앨범명·곡명·시대 명칭(`After Hours`, `Dawn FM`, `Starboy` 등)은 **번역하지 않는다.** 원어 그대로 쓴다.
- `The Weeknd` 를 본문에 직접 쓰지 않고 정본이 쓰는 자리에 그대로 둔다 — 이미 라틴이므로 두 로케일이 같다.
- 스포일러 수위(`spoilerLevel`)는 오버레이에 복제하지 않는다. 정본에서 온다.

- [ ] **Step 1: 대상을 확인한다**

```bash
ls src/data/discover/
wc -c src/data/discover/*.md | sort -n
```

- [ ] **Step 2: 11개를 번역한다**

가장 짧은 파일부터 시작하고, 각 파일 뒤에 검사를 돌린다:

```bash
npm run i18n:status | grep discover
npm run audit:content
```

- [ ] **Step 3: 전체를 확인한다**

```bash
npm run i18n:status | grep discover | grep -v '\tok\t'
```
Expected: 출력 없음

```bash
npm run audit:content
npm run build
npm run check:dist
```
Expected: PASS

- [ ] **Step 4: 눈으로 확인한다**

`http://127.0.0.1:4323/en/discover/` — 타임라인·트릴로지 설명의 가로 넘침을 특히 본다. 영어 문장이 길어 좁은 컬럼에서 넘치기 쉬운 곳이다.

- [ ] **Step 5: 커밋**

```bash
npx prettier --write src/data/i18n
git add src/data/i18n
git commit -m "$(cat <<'EOF'
content(i18n): translate the discover pages into english

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: setlist 38곡 번역

**Files:**
- Modify: `src/data/i18n/en/setlist.json`

**Interfaces:**
- Consumes: `setlistOverlay` (Task 3), `getExpectedSetlist(locale)` (Task 4)
- Produces: 38개 키가 채워진 번들

**번역 대상은 4필드뿐이다:** `title`, `summary`, `liveNote`, `singAlongNote`.
`songTitle`·`album`·`confidence`·`expectedOrder`·`observedIn` 은 오버레이에 **넣지 않는다.**

**가장 중요한 제약:** 이 페이지 전체가 `expected` 상태다. 영어판에도 `Expected · not guaranteed` 가 반드시 보여야 한다(Phase 1 Task 8의 `STATUS_LABELS.en.expected`). 곡 노트를 번역하면서 확신도를 올리지 않는다 — "자주 불렀습니다" 를 "always plays" 로 옮기지 않는다.

- [ ] **Step 1: 대상과 현재 해시를 뽑는다**

```bash
for f in src/data/setlist/*.json; do
  id=$(basename "$f" .json)
  printf '%s\t%s\n' "$id" "$(npm run --silent i18n:hash -- setlist/$id)"
done
```

이 출력이 번들의 키와 `sourceHash` 값이다.

- [ ] **Step 2: 번들을 채운다**

`src/data/i18n/en/setlist.json` 형태:

```json
{
  "01-take-my-breath": {
    "title": "Take My Breath",
    "summary": "Opened the first half at every 2026 stop where a setlist was reported.",
    "liveNote": "Reported as the opener in the observed 2026 shows; the extended intro ran before the first chorus.",
    "singAlongNote": "The crowd carried the chorus; the verses stayed quiet in the reports.",
    "sourceHash": "0123456789abcdef",
    "translatedAt": "2026-09-20"
  }
}
```

정본의 어투를 대조하며 옮긴다:

```bash
cat src/data/setlist/01-take-my-breath.json
```

- [ ] **Step 3: 10곡마다 검사를 돌린다**

```bash
npm run i18n:status | grep setlist | grep -v '\tok\t'
npm run audit:content
```

38개를 한 번에 쓰고 마지막에 검사하지 않는다. 중간 검사가 형식 오류를 일찍 잡는다.

- [ ] **Step 4: 전체를 확인한다**

```bash
npm run i18n:status | grep setlist | grep -v '\tok\t'
```
Expected: 출력 없음 — 38개 전부 `ok`

```bash
npm run audit:content
npm run build
npm run check:dist
```
Expected: PASS. `trust labels` 테스트가 영어 `Expected · not guaranteed` 를 확인한다.

- [ ] **Step 5: 공유 카드를 확인한다**

`http://127.0.0.1:4323/en/share/setlist/` 와 `/en/share/ticket/` 에서 카드를 생성한다. 카드 픽셀은 두 로케일이 같아야 한다 — 포스터는 아트워크이고 티켓 텍스트는 라틴이다. 달라 보이면 Phase 1 Task 9의 주입이 어긋난 것이다.

- [ ] **Step 6: 커밋**

```bash
npx prettier --write src/data/i18n
git add src/data/i18n
git commit -m "$(cat <<'EOF'
content(i18n): translate the expected setlist notes into english

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: sources 45개와 concert 번역

**Files:**
- Modify: `src/data/i18n/en/sources.json`
- Modify: `src/data/i18n/en/concert.json`

**Interfaces:**
- Consumes: `sourcesOverlay`, `concertOverlay` (Task 3)
- Produces: 46개 키가 채워진 두 번들

**`sources` 번역 규칙 — `name` 한 필드뿐이다.**
- 한국 언론사는 **공식 영문명**을 쓴다: 오마이뉴스 → `OhmyNews`, 연합뉴스 → `Yonhap News`. 공식 영문명이 없으면 로마자 표기 + 한글 병기: `Clien · 클리앙`.
- 커뮤니티 후기는 플랫폼명 + 성격: `DCInside community review`, `Clien community review`.
- **URL·`kind`·`lastCheckedAt` 은 오버레이에 넣지 않는다.**

**`concert` 번역 규칙.**
- `venue` 는 **오버레이에 넣지 않는다.** 공연장 이름은 `src/lib/i18n/proper-nouns.ts` 의
  `VENUE`(길찾기 라벨용 짧은 이름)와 `VENUE_FULL`(구조화 데이터용 정식 명칭)에서
  `bilingual()` 로 나오고, `VENUE_FULL.ko` 는 단위 테스트가 정본 `concert.venue` 와
  같은지 검사한다. 즉 이미 정본에 묶여 있으므로 오버레이가 중복 관리할 이유가 없다.
  정본 JSON의 `venue` 필드는 그 테스트의 기준값으로 계속 쓰인다.
- `ageRestriction` 「만 19세 이상」 → `Ages 19 and over`. `만`은 이미 국제 통용 나이 계산(만 나이)을 뜻하므로 괄호 설명을 덧붙이면 존재하지 않는 별도 규정이 있다는 오해를 부른다.
- `shows[].dateLabel` 「2026.10.07 WED」 → `Wed 7 Oct 2026`. 배열 길이는 정본과 같아야 하며(`.length(2)`), 순서도 같다.

- [ ] **Step 1: sources 대상과 해시를 뽑는다**

```bash
for f in src/data/sources/*.json; do
  id=$(basename "$f" .json)
  printf '%s\t%s\t%s\n' "$id" \
    "$(node -p "require('./src/data/sources/$id.json').name")" \
    "$(npm run --silent i18n:hash -- sources/$id)"
done
```

- [ ] **Step 2: `sources.json` 을 채운다**

```json
{
  "news-ohmynews-2025-04": {
    "name": "OhmyNews",
    "sourceHash": "0123456789abcdef",
    "translatedAt": "2026-09-20"
  }
}
```

- [ ] **Step 3: 15개마다 검사를 돌린다**

```bash
npm run i18n:status | grep sources | grep -v '\tok\t'
```

- [ ] **Step 4: `concert.json` 을 채운다**

```bash
cat src/data/concert/goyang-2026.json
npm run i18n:hash -- concert/goyang-2026
```

```json
{
  "goyang-2026": {
    "title": "The Weeknd: After Hours Til Dawn Tour — Goyang",
    "summary": "Two nights at Goyang Stadium · 고양종합운동장 on 7–8 October 2026.",
    "ageRestriction": "Ages 19 and over",
    "shows": [
      { "dateLabel": "Wed 7 Oct 2026" },
      { "dateLabel": "Thu 8 Oct 2026" }
    ],
    "sourceHash": "0123456789abcdef",
    "translatedAt": "2026-09-20"
  }
}
```

- [ ] **Step 5: 전체를 확인한다**

```bash
npm run i18n:status | grep -v '\tok\t'
```
Expected: **출력 없음** — 모든 로케일·모든 엔트리가 `ok`

```bash
npm run audit:content
npm run build
npm run check:dist
```
Expected: PASS

- [ ] **Step 6: 눈으로 확인한다**

`http://127.0.0.1:4323/en/sources/` — 45개 출처명이 전부 영어이고 표가 넘치지 않는지 본다.

- [ ] **Step 7: 커밋**

```bash
npx prettier --write src/data/i18n
git add src/data/i18n
git commit -m "$(cat <<'EOF'
content(i18n): translate the source records and concert metadata

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: runbook 갱신과 전체 검증

**Files:**
- Modify: `docs/content-update-runbook.md`
- Modify: `scripts/check-dist-i18n.mjs`

**Interfaces:**
- Consumes: Task 1~9 전부
- Produces: 배포 가능한 두 로케일 사이트

- [ ] **Step 1: 폴백 경로를 e2e로 못 박는다**

Task 4의 `content fallback` 테스트 중 "마크되지 않은 항목" 케이스는 이제 번역이 전부 있어 실패한다. 오버레이를 일시 제거해 폴백이 살아 있는지 확인하는 테스트로 바꾼다 — 파일을 지우는 대신, **번역이 없는 컬렉션이 없다는 사실 자체**를 단언한다:

```ts
test('has no untranslated section left on the english route', async ({
  page,
}) => {
  for (const route of ['/en/goyang/', '/en/discover/', '/en/setlist/']) {
    await page.goto(route);
    await expect(
      page.getByText('This section is shown in Korean.'),
    ).toHaveCount(0);
  }
});
```

- [ ] **Step 2: 긴급 우회로를 실제로 검증한다**

```bash
mv src/data/i18n/en/guides/32-tips-entry.md /tmp/overlay-backup.md
npm run audit:content
npm run build
```
Expected: **PASS** — 오버레이 삭제는 stale이 아니라 missing이고, missing은 폴백으로 처리돼 배포를 막지 않는다.

```bash
npm run preview &
```
`http://127.0.0.1:4323/en/goyang/` 에서 해당 섹션이 한국어 + `This section is shown in Korean.` 고지로 뜨는지 확인한다.

```bash
mv /tmp/overlay-backup.md src/data/i18n/en/guides/32-tips-entry.md
```

> 이 동작이 확인돼야 runbook의 긴급 절차가 실제로 쓸 수 있는 것이 된다. `audit:content` 가 missing까지 실패시키면 우회로가 막히므로, 여기서 실패하면 Task 5의 감사를 **stale·orphan·url-mismatch 만** 실패시키도록 고친다.

- [ ] **Step 3: runbook을 갱신한다**

`docs/content-update-runbook.md` 에 절을 더한다:

```markdown
## 번역 (영어판)

한국어가 정본이다. 영어는 `src/data/i18n/en/` 오버레이에만 있고 `sourceHash` 로 정본에 묶여 있다.

### 정본 산문을 고쳤을 때

1. `npm run i18n:status` — stale로 떨어진 항목을 확인한다.
2. 해당 오버레이의 번역을 갱신한다.
3. `npm run i18n:hash -- <collection>/<id>` 출력으로 `sourceHash` 를 다시 적는다.
4. `npm run verify:core`.

출처의 `lastCheckedAt` 만 고쳤다면 stale이 되지 않는다. 해시는 `title`·`summary`·본문만 덮는다.

### 번역 규칙

- 정보를 더하거나 보정하지 않는다. 정본이 "미공개"면 번역도 미공개다.
- 불확실성의 강도를 보존한다. "~로 보입니다"를 "is"로 옮기지 않는다.
- 정본 본문의 URL을 하나도 빠짐없이 옮긴다. `audit:content` 가 검사한다.
- 고유명사는 `src/lib/i18n/proper-nouns.ts` 만 쓴다. 장소·역명은 한글을 병기한다.
- 초안 생성 후 사람이 검수한다. 검수하지 않은 번역은 커밋하지 않는다.
- 커밋 형식: `content(i18n): translate <what> into english`

### 공연 임박 시 긴급 정정

번역을 갱신할 시간이 없으면 해당 오버레이 파일을 **삭제한다.** 한국어 폴백과 고지로 즉시 배포된다. 나중에 번역을 복구한다.
```

- [ ] **Step 4: 전체 체인을 돌린다**

```bash
npm run verify:core
```
Expected: PASS — lint → format:check → check → test:unit → build → budget → check:dist

- [ ] **Step 5: 사이트맵과 배포 구성을 확인한다**

```bash
PUBLIC_SITE_URL=https://fan-guide.test npm run build
grep -c '<url>' dist/sitemap-0.xml
npx wrangler deploy --dry-run
```
Expected: `<url>` 14개. dry-run 통과. **실제 배포는 하지 않는다.**

- [ ] **Step 6: 정본이 손대지지 않았음을 증명한다**

```bash
git diff --stat main -- src/data ':!src/data/i18n'
```
Expected: **빈 출력.** 한 줄이라도 나오면 정본을 건드린 것이다 — 되돌린다.

- [ ] **Step 7: 두 로케일 전 라우트를 눈으로 확인한다**

`npm run preview` 후 **Playwright MCP**로 1440×960, 390×844, 320×720+텍스트 200% 에서 14개 라우트를 전부 본다. 확인 항목:

- 가로 넘침 0
- 영어 페이지에 남은 한국어 UI 문자열 0 (고유명사 병기와 고지는 제외)
- `Expected · not guaranteed` 가 `/en/setlist/` 에 보인다
- 언어 전환기가 같은 페이지의 다른 로케일로 간다

- [ ] **Step 8: 커밋**

```bash
npx prettier --write docs tests
npm run lint
git add docs tests
git commit -m "$(cat <<'EOF'
docs(runbook): document the translation gate and the emergency fallback

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 완료 기준

- `npm run i18n:status` 가 stale 0, missing 0을 내고 종료 코드 0.
- 정본 산문을 한 줄 고치면 `npm run audit:content` 가 실패하고 해당 id·로케일을 지목한다.
- 출처 `lastCheckedAt` 만 고치면 `audit:content` 가 통과한다.
- 번역 본문에서 링크를 하나 지우면 URL 패리티가 실패한다.
- 오버레이 하나를 지우면 빌드가 통과하고 해당 섹션이 한국어 + 고지로 렌더된다.
- `/setlist/` 와 `/en/setlist/` 가 각각 `예상 · 보장 아님` 과 `Expected · not guaranteed` 를 노출한다.
- 두 로케일 전 라우트에서 320px·200% 확대 시 가로 넘침이 없다.
- `npm run verify:core` 와 `npx wrangler deploy --dry-run` 이 통과한다.
- `git diff --stat main -- src/data ':!src/data/i18n'` 가 빈 출력.
