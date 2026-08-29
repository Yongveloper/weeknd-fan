# DAWNFOLD 시각 충실도·이해도 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈이 "The Weeknd 고양 공연 비공식 팬 팜플렛"임을 첫 화면에서 말하고, 스크롤하는 동안 하늘이 밤에서 새벽으로 바뀌며, 한글 제목이 제대로 렌더되고, 앨범이 언급되는 자리에 Spotify 공식 커버가 붙는다.

**Architecture:** Astro 6 정적 사이트. 시각 변화는 `<body>` 첫 자식 고정 `.dawn-sky` 레이어 하나가 CSS scroll-driven animation으로 담당하고(미지원 브라우저는 정적 tall gradient), 섹션은 전부 투명 + 대각선 접힘 면으로 구분한다. 한글 제목은 `global.css` 전역 규칙(Noto Sans KR 900)으로 통일하고 컴포넌트 스코프 규칙을 제거한다. 앨범 커버는 새 `albums` 콘텐츠 컬렉션(Spotify oEmbed 커버 URL 캐시)과 `AlbumCover.astro` 하나로 공급한다. 장면 전환은 `src/scripts/home-motion.ts`가 `motion`의 `inView`로 `data-motion-state="entered"`만 찍고 CSS `@keyframes`가 재생한다.

**Tech Stack:** Astro 6.4, TypeScript strict, Vitest, Playwright, `motion` 13, `@fontsource-variable/noto-sans-kr`, `@fontsource/bebas-neue`, Spotify oEmbed(무인증), Cloudflare Static Assets.

**Spec:** `docs/superpowers/specs/2026-08-29-dawnfold-home-visual-fidelity-design.md` (상위: `2026-08-29-weeknd-goyang-fan-guide-design.md`)

## Global Constraints

- Node: 모든 명령 앞에 `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH` (기본 셸 Node 20.12.2는 미지원).
- 전체 검증: `npm run verify` = lint → format:check → check → audit:content → test:unit → build → budget → test:e2e. 커밋 전 최소 `npm run lint && npm run format:check && npm run check && npm run test:unit`.
- Prettier: `singleQuote: true`, `prettier-plugin-astro`. 커밋 전 `npx prettier --write <changed files>`.
- 성능 예산(변경 금지): JS gzip ≤ 75 KiB(현 28.7), 홈 로컬 raster ≤ 700 KiB, 전체 raster ≤ 1100 KiB, CLS < 0.1, long task ≤ 50 ms.
- 새 래스터 에셋 없음. 새 폰트 없음. 서버·API·저장소 없음.
- `prefers-reduced-motion: reduce`에서 `motion` 청크가 로드되면 안 된다(e2e `reduced motion does not load the deferred Motion chunk`).
- no-JS에서 모든 정보가 보여야 한다. 애니메이션 시작 상태는 `html[data-motion-ready]`가 있을 때만 적용한다.
- 반드시 유지되는 e2e 셀렉터/문구: `getByText('고양종합운동장 주경기장')`, `getByText('2026.10.07—08')`, `getByText('비공식·비영리 팬 가이드', { exact: true })`(푸터 1곳만), h1 `toContainText('AFTER HOURS TIL DAWN')`, `eclipse-countdown`/`[data-primary]`/`[data-clock]`/`[data-accessible-countdown]`/`data-motion-state="reduced"`, `.expected-setlist details`, `getByText('예상 · 보장 아님')`, `getByRole('heading', { name: '예상 셋리스트' })`(홈), `getByRole('group', { name: '1분 입문 더 깊이 보기' })`, 링크 `나만의 D-day 티켓 만들기`, `셋리스트 포스터 만들기`, 헤더 링크 44×44px.
- 커밋 메시지는 Conventional Commits, 본문에 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- 원격 push·PR·배포는 하지 않는다.

## Spec 대비 조정 (계획 단계에서 확정)

1. **`setlist.album`·`relatedAlbums`를 `reference('albums')`로 승격하지 않는다.** 실제 데이터에 `Heroes & Villains`, `Lost in the Fire`, `MUSIC`, `Paradise Again`, `The Highlights`, `Trilogy`처럼 The Weeknd 정규 디스코그래피 밖의 값이 8종 있어 reference 승격은 49개 파일 수정 + 외부 앨범 커버까지 요구한다. 대신 `findAlbumByTitle()`로 제목 정규화 매칭해 **일치하는 앨범만 커버를 보인다**(외부 앨범은 텍스트 유지). Task 1에서 spec §7을 이 문장으로 수정한다.
2. Spotify 앨범 ID는 2026-08-29 oEmbed로 제목 일치 검증 완료(아래 Task 1 표). 믹스테이프 3장은 `(Original)` 판.
3. 고양 arrival horizon은 `.dawn-sky` 전역 pulse 대신 `GuideShortcuts` 섹션 자체의 상단 지평선 라인이 그려지는 로컬 애니메이션으로 구현한다(scroll timeline 애니메이션과 같은 요소에 두 번째 애니메이션을 얹는 복잡성 회피).

## 파일 구조

| 파일 | 책임 |
|---|---|
| `src/data/albums/*.json` (10) | 앨범 메타 + 캐시된 Spotify 커버 URL |
| `src/data/sources/spotify-*.json` (9 신규) | 앨범 Spotify 링크를 출처 체계에 등록 |
| `src/content.config.ts` | `albums` 컬렉션 스키마 |
| `src/lib/content/albums.ts` | 제목 정규화·조회(순수 함수, 단위 테스트) |
| `src/lib/content/queries.ts` | `getAlbums()` |
| `src/lib/content/audit.ts` | `auditAlbums()` |
| `scripts/lib/album-cover.mjs` | oEmbed 응답 → cover 변환(순수, 테스트) |
| `scripts/refresh-album-covers.mjs` | 커버 URL 갱신 CLI(네트워크, 빌드와 무관) |
| `src/components/content/AlbumCover.astro` | 커버 링크 + 시대 색 fallback 타일 |
| `src/lib/countdown.ts` | `captionLabel` 추가 |
| `src/components/visual/EclipseCountdown.astro` | 캡션, 진입 숫자 전환 |
| `src/scripts/home-motion.ts` | 섹션 진입 감지 → `data-motion-state` |
| `src/styles/tokens.css`, `global.css`, `motion.css` | 폰트 토큰, 전역 제목 규칙, 하늘 레이어, 접힘 면, reduced-motion |
| `src/layouts/BaseLayout.astro` | `.dawn-sky` 마운트 |
| 홈 컴포넌트 5 + chrome 2 + setlist/discover/guide 컴포넌트 + 페이지 4 | 카피·마크업·스코프 스타일 정리 |
| `tests/unit/*.test.ts`, `tests/e2e/*.spec.ts` | 회귀 방지 |

---

### Task 1: `albums` 컬렉션, 데이터 10개, 제목 조회 함수

**Files:**
- Create: `src/lib/content/albums.ts`
- Create: `src/data/albums/{house-of-balloons,thursday,echoes-of-silence,kiss-land,beauty-behind-the-madness,starboy,my-dear-melancholy,after-hours,dawn-fm,hurry-up-tomorrow}.json`
- Create: `src/data/sources/spotify-{house-of-balloons,thursday,echoes-of-silence,kiss-land,beauty-behind-the-madness,starboy,after-hours,dawn-fm,hurry-up-tomorrow}.json`
- Modify: `src/content.config.ts:107-128`
- Modify: `src/lib/content/queries.ts` (끝에 추가)
- Modify: `src/lib/content/contracts.ts:23-26`
- Modify: `docs/superpowers/specs/2026-08-29-dawnfold-home-visual-fidelity-design.md` §7 데이터 절
- Test: `tests/unit/albums.test.ts`

**Interfaces:**
- Produces: `normalizeAlbumTitle(title: string): string`, `findAlbumByTitle<T extends { data: { title: string } }>(albums: T[], title: string): T | undefined` (`src/lib/content/albums.ts`); `getAlbums(): Promise<AlbumRecord[]>` (`queries.ts`); `type AlbumRecord = CollectionEntry<'albums'>` (`contracts.ts`); 컬렉션 `albums` 데이터 형태 `{ title, year, kind: 'mixtape'|'studio'|'ep', era: 'night'|'red'|'blue'|'amber', spotifyUrl, cover: { url, width, height, fetchedAt } }`.

- [ ] **Step 1: 실패하는 단위 테스트 작성**

`tests/unit/albums.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  findAlbumByTitle,
  normalizeAlbumTitle,
} from '../../src/lib/content/albums';

describe('normalizeAlbumTitle', () => {
  it('ignores case, punctuation, and spacing', () => {
    expect(normalizeAlbumTitle('My Dear Melancholy,')).toBe('mydearmelancholy');
    expect(normalizeAlbumTitle('my dear melancholy')).toBe('mydearmelancholy');
    expect(normalizeAlbumTitle('Beauty Behind The Madness')).toBe(
      'beautybehindthemadness',
    );
  });
});

describe('findAlbumByTitle', () => {
  const albums = [
    { data: { title: 'After Hours' } },
    { data: { title: 'My Dear Melancholy,' } },
  ];

  it('matches setlist album strings written without the trailing comma', () => {
    expect(findAlbumByTitle(albums, 'My Dear Melancholy')?.data.title).toBe(
      'My Dear Melancholy,',
    );
  });

  it('returns undefined for releases outside the core discography', () => {
    expect(findAlbumByTitle(albums, 'Heroes & Villains')).toBeUndefined();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npx vitest run tests/unit/albums.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/lib/content/albums"`

- [ ] **Step 3: 순수 함수 구현**

`src/lib/content/albums.ts`:
```ts
export function normalizeAlbumTitle(title: string): string {
  return title
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

export function findAlbumByTitle<T extends { data: { title: string } }>(
  albums: T[],
  title: string,
): T | undefined {
  const key = normalizeAlbumTitle(title);
  return albums.find((album) => normalizeAlbumTitle(album.data.title) === key);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npx vitest run tests/unit/albums.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: 컬렉션 스키마 추가**

`src/content.config.ts` — `const setlist = ...` 블록 뒤, `export const collections` 앞에 추가:
```ts
const albums = defineCollection({
  loader: glob({ base: './src/data/albums', pattern: '**/*.json' }),
  schema: z.object({
    title: z.string(),
    year: z.number().int().min(2011),
    kind: z.enum(['mixtape', 'studio', 'ep']),
    era: z.enum(['night', 'red', 'blue', 'amber']),
    spotifyUrl: z
      .url()
      .regex(/^https:\/\/open\.spotify\.com\/album\/[A-Za-z0-9]+$/),
    cover: z.object({
      url: z
        .url()
        .regex(/^https:\/\/(image-cdn-[a-z]+\.spotifycdn\.com|i\.scdn\.co)\//),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      fetchedAt: editorialDate,
    }),
  }),
});
```
`export const collections = { albums, concert, discover, guides, setlist, showRecords, sources };`

- [ ] **Step 6: 데이터 파일 10개 작성**

모든 파일 공통: `"cover.fetchedAt": "2026-08-29"`, width/height 300. 검증된 값:

| 파일 | title | year | kind | era | spotifyUrl id | cover.url |
|---|---|---|---|---|---|---|
| house-of-balloons | House of Balloons | 2011 | mixtape | night | `7zCODUHkfuRxsUjtuzNqbd` | `https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02274b406a7e18acebcf743079` |
| thursday | Thursday | 2011 | mixtape | night | `6F87lH0I09qlrzvCCKc7lz` | `https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02e01c2631218e2de27765b7d5` |
| echoes-of-silence | Echoes of Silence | 2011 | mixtape | night | `04hy4jb1GDD00otiwzsFUB` | `https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e0236fb79728dbb379579cef97e` |
| kiss-land | Kiss Land | 2013 | studio | night | `3hhDpPtCFuQbppwYgsVhMO` | `https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02e4860d5331509e2c9ee4de10` |
| beauty-behind-the-madness | Beauty Behind the Madness | 2015 | studio | red | `0P3oVJBFOv3TDXlYRhGL7s` | `https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e027fcead687e99583072cc217b` |
| starboy | Starboy | 2016 | studio | red | `2ODvWsOgouMbaA5xf0RkJe` | `https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e024718e2b124f79258be7bc452` |
| my-dear-melancholy | My Dear Melancholy, | 2018 | ep | red | `3N88bRVAwQrtKqSV0UgU69` | `https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02f38e946900c89c38a070227b` |
| after-hours | After Hours | 2020 | studio | red | `4yP0hdKOZPNshxUOjY0cZj` | `https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e028863bc11d2aa12b54f5aeb36` |
| dawn-fm | Dawn FM | 2022 | studio | blue | `2nLOHgzXzwFEpl62zAgCEC` | `https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e024ab2520c2c77a1d66b9ee21d` |
| hurry-up-tomorrow | Hurry Up Tomorrow | 2025 | studio | amber | `3OxfaVgvTxUTy7276t7SPU` | `https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02de79f330bc297af3fae736da` |

예시 `src/data/albums/after-hours.json`:
```json
{
  "title": "After Hours",
  "year": 2020,
  "kind": "studio",
  "era": "red",
  "spotifyUrl": "https://open.spotify.com/album/4yP0hdKOZPNshxUOjY0cZj",
  "cover": {
    "url": "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e028863bc11d2aa12b54f5aeb36",
    "width": 300,
    "height": 300,
    "fetchedAt": "2026-08-29"
  }
}
```

- [ ] **Step 7: 출처 파일 9개 작성**

`spotify-my-dear-melancholy.json`은 이미 있다. 나머지 9개, 예시 `src/data/sources/spotify-after-hours.json`:
```json
{
  "name": "Spotify — After Hours 앨범",
  "url": "https://open.spotify.com/album/4yP0hdKOZPNshxUOjY0cZj",
  "kind": "official",
  "lastCheckedAt": "2026-08-29"
}
```
`name`은 `Spotify — {title} 앨범`, `url`은 위 표의 spotifyUrl.

- [ ] **Step 8: 타입·쿼리 추가**

`src/lib/content/contracts.ts` 23행 뒤에:
```ts
export type AlbumRecord = CollectionEntry<'albums'>;
```
`src/lib/content/queries.ts` 끝에:
```ts
export async function getAlbums() {
  return (await getCollection('albums')).sort(
    (a, b) => a.data.year - b.data.year,
  );
}
```

- [ ] **Step 9: spec §7 조정 문장 반영**

`docs/superpowers/specs/2026-08-29-dawnfold-home-visual-fidelity-design.md`에서
`- \`setlist.album: z.string()\` → \`reference('albums')\`, \`common.relatedAlbums\` → \`z.array(reference('albums'))\`. 기존 38+11개 파일의 문자열을 slug로 일괄 치환(스크립트 1회).`
를 다음으로 교체:
`- \`setlist.album\`·\`relatedAlbums\`는 문자열을 유지한다. 실제 데이터에 정규 디스코그래피 밖 발매(\`Heroes & Villains\`, \`The Highlights\` 등)가 있어 \`findAlbumByTitle()\`(제목 정규화 매칭)로 일치하는 앨범만 커버를 붙이고, 나머지는 텍스트로 남긴다.`

- [ ] **Step 10: 타입 체크·감사 통과 확인**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm run check && PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm run audit:content`
Expected: `0 errors`, 콘텐츠 감사 통과(albums 컬렉션은 zod로 로드 검증됨)

- [ ] **Step 11: 커밋**

```bash
npx prettier --write src/content.config.ts src/lib/content src/data/albums src/data/sources tests/unit/albums.test.ts
git add src/content.config.ts src/lib/content src/data/albums src/data/sources tests/unit/albums.test.ts docs/superpowers/specs
git commit -m "feat: add albums collection with verified Spotify covers

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: 커버 갱신 스크립트

**Files:**
- Create: `scripts/lib/album-cover.mjs`
- Create: `scripts/refresh-album-covers.mjs`
- Test: `tests/unit/album-cover.test.ts`
- Modify: `package.json` scripts

**Interfaces:**
- Produces: `coverFromOEmbed(payload: { title?: string; thumbnail_url?: string; thumbnail_width?: number; thumbnail_height?: number }, expectedTitle: string): { url: string; width: number; height: number }` — 호스트·제목 불일치 시 throw. CLI `npm run covers:verify`(변경 없음) / `npm run covers:refresh`(파일 갱신).

- [ ] **Step 1: 실패하는 테스트**

`tests/unit/album-cover.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain ESM script module without type declarations
import { coverFromOEmbed } from '../../scripts/lib/album-cover.mjs';

const payload = {
  title: 'House Of Balloons (Original)',
  thumbnail_url:
    'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02274b406a7e18acebcf743079',
  thumbnail_width: 300,
  thumbnail_height: 300,
};

describe('coverFromOEmbed', () => {
  it('accepts a Spotify CDN cover whose title matches ignoring case and "(Original)"', () => {
    expect(coverFromOEmbed(payload, 'House of Balloons')).toEqual({
      url: payload.thumbnail_url,
      width: 300,
      height: 300,
    });
  });

  it('rejects a title mismatch so a wrong album id cannot slip in', () => {
    expect(() => coverFromOEmbed(payload, 'Hurry Up Tomorrow')).toThrow(
      /title mismatch/,
    );
  });

  it('rejects covers hosted outside Spotify', () => {
    expect(() =>
      coverFromOEmbed(
        { ...payload, thumbnail_url: 'https://example.com/x.jpg' },
        'House of Balloons',
      ),
    ).toThrow(/cover host/);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npx vitest run tests/unit/album-cover.test.ts`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 순수 모듈 구현**

`scripts/lib/album-cover.mjs`:
```js
const COVER_HOST = /^https:\/\/(image-cdn-[a-z]+\.spotifycdn\.com|i\.scdn\.co)\//;

export function normalizeTitle(title) {
  return String(title)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\(original\)/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

export function coverFromOEmbed(payload, expectedTitle) {
  if (!payload || typeof payload.thumbnail_url !== 'string') {
    throw new Error('oEmbed payload has no thumbnail_url');
  }
  if (!COVER_HOST.test(payload.thumbnail_url)) {
    throw new Error(`unexpected cover host: ${payload.thumbnail_url}`);
  }
  if (normalizeTitle(payload.title ?? '') !== normalizeTitle(expectedTitle)) {
    throw new Error(
      `title mismatch: expected "${expectedTitle}", got "${payload.title}"`,
    );
  }
  return {
    url: payload.thumbnail_url,
    width: Number(payload.thumbnail_width),
    height: Number(payload.thumbnail_height),
  };
}
```

- [ ] **Step 4: 테스트 통과**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npx vitest run tests/unit/album-cover.test.ts`
Expected: PASS (3)

- [ ] **Step 5: CLI 작성**

`scripts/refresh-album-covers.mjs`:
```js
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { coverFromOEmbed } from './lib/album-cover.mjs';

const albumsDirectory = path.resolve('src/data/albums');
const verifyOnly = process.argv.includes('--verify');
const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
}).format(new Date());

const files = (await readdir(albumsDirectory)).filter((file) =>
  file.endsWith('.json'),
);

for (const file of files) {
  const filePath = path.join(albumsDirectory, file);
  const album = JSON.parse(await readFile(filePath, 'utf8'));
  const endpoint = `https://open.spotify.com/oembed?url=${encodeURIComponent(album.spotifyUrl)}`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`${file}: oEmbed responded ${response.status}`);
  }
  const cover = coverFromOEmbed(await response.json(), album.title);
  if (verifyOnly) {
    const changed = cover.url !== album.cover?.url ? 'CHANGED' : 'same';
    console.log(`${file}\t${changed}\t${cover.url}`);
    continue;
  }
  album.cover = { ...cover, fetchedAt: today };
  await writeFile(filePath, `${JSON.stringify(album, null, 2)}\n`);
  console.log(`${file}\tupdated`);
}
```
`package.json` scripts에 추가:
```json
"covers:verify": "node scripts/refresh-album-covers.mjs --verify",
"covers:refresh": "node scripts/refresh-album-covers.mjs"
```

- [ ] **Step 6: 실제 실행으로 데이터 검증**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm run covers:verify`
Expected: 10줄 모두 `same`. `CHANGED`가 나오면 Task 1 데이터의 URL이 틀린 것 — 출력된 URL로 교정.

- [ ] **Step 7: 커밋**

```bash
npx prettier --write scripts tests/unit/album-cover.test.ts package.json
git add scripts package.json tests/unit/album-cover.test.ts
git commit -m "feat: add Spotify cover refresh script with title verification

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: 앨범 감사 규칙

**Files:**
- Modify: `src/lib/content/audit.ts` (끝에 추가)
- Test: `tests/unit/content-audit.test.ts` (끝에 `describe` 추가)

**Interfaces:**
- Produces: `auditAlbums(input: { now: Date; albums: Array<{ id: string; spotifyUrl: string; coverUrl: string; coverFetchedAt: Date }>; officialSourceUrls: string[] }): AuditIssue[]` — codes `album-cover-host-invalid`, `album-cover-fetched-in-future`, `album-cover-stale`(90일 초과), `album-spotify-source-missing`.

- [ ] **Step 1: 실패하는 테스트**

`tests/unit/content-audit.test.ts` 맨 끝에 추가(import 줄에 `auditAlbums` 추가):
```ts
describe('album cover contract', () => {
  const now = new Date('2026-10-01T00:00:00+09:00');

  it('flags foreign hosts, stale or future fetches, and unregistered Spotify links', () => {
    const issues = auditAlbums({
      now,
      officialSourceUrls: ['https://open.spotify.com/album/ok'],
      albums: [
        {
          id: 'foreign',
          spotifyUrl: 'https://open.spotify.com/album/ok',
          coverUrl: 'https://example.com/cover.jpg',
          coverFetchedAt: new Date('2026-09-01T00:00:00+09:00'),
        },
        {
          id: 'stale',
          spotifyUrl: 'https://open.spotify.com/album/ok',
          coverUrl: 'https://image-cdn-ak.spotifycdn.com/image/abc',
          coverFetchedAt: new Date('2026-06-01T00:00:00+09:00'),
        },
        {
          id: 'future',
          spotifyUrl: 'https://open.spotify.com/album/ok',
          coverUrl: 'https://i.scdn.co/image/abc',
          coverFetchedAt: new Date('2026-10-02T00:00:00+09:00'),
        },
        {
          id: 'unregistered',
          spotifyUrl: 'https://open.spotify.com/album/missing',
          coverUrl: 'https://image-cdn-fa.spotifycdn.com/image/abc',
          coverFetchedAt: new Date('2026-09-01T00:00:00+09:00'),
        },
      ],
    });

    expect(issues).toEqual([
      { id: 'foreign', code: 'album-cover-host-invalid' },
      { id: 'stale', code: 'album-cover-stale' },
      { id: 'future', code: 'album-cover-fetched-in-future' },
      { id: 'unregistered', code: 'album-spotify-source-missing' },
    ]);
  });

  it('audits the committed album data against the committed sources', async () => {
    const dataDirectory = join(process.cwd(), 'src/data');
    const readJsonDirectory = async (directory: string) =>
      Promise.all(
        (await readdir(join(dataDirectory, directory)))
          .filter((file) => file.endsWith('.json'))
          .map(async (file) => ({
            id: file.replace(/\.json$/, ''),
            data: JSON.parse(
              await readFile(join(dataDirectory, directory, file), 'utf8'),
            ),
          })),
      );
    const albums = await readJsonDirectory('albums');
    const sources = await readJsonDirectory('sources');

    expect(albums).toHaveLength(10);
    expect(
      auditAlbums({
        now: new Date(),
        albums: albums.map(({ id, data }) => ({
          id,
          spotifyUrl: data.spotifyUrl,
          coverUrl: data.cover.url,
          coverFetchedAt: parseSeoulDate(data.cover.fetchedAt),
        })),
        officialSourceUrls: sources
          .filter(({ data }) => data.kind === 'official')
          .map(({ data }) => data.url),
      }),
    ).toEqual([]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npx vitest run tests/unit/content-audit.test.ts`
Expected: FAIL — `auditAlbums is not a function`

- [ ] **Step 3: 구현**

`src/lib/content/audit.ts` 끝에:
```ts
type AlbumAuditRecord = {
  id: string;
  spotifyUrl: string;
  coverUrl: string;
  coverFetchedAt: Date;
};

const COVER_HOST = /^https:\/\/(image-cdn-[a-z]+\.spotifycdn\.com|i\.scdn\.co)\//;
const COVER_STALE_AFTER_MS = 90 * 24 * 60 * 60 * 1000;

export function auditAlbums(input: {
  now: Date;
  albums: AlbumAuditRecord[];
  officialSourceUrls: string[];
}): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const registered = new Set(input.officialSourceUrls);

  for (const album of input.albums) {
    if (!COVER_HOST.test(album.coverUrl)) {
      issues.push({ id: album.id, code: 'album-cover-host-invalid' });
    }
    const fetchedAt = album.coverFetchedAt.getTime();
    if (Number.isNaN(fetchedAt) || fetchedAt > input.now.getTime()) {
      issues.push({ id: album.id, code: 'album-cover-fetched-in-future' });
    } else if (input.now.getTime() - fetchedAt > COVER_STALE_AFTER_MS) {
      issues.push({ id: album.id, code: 'album-cover-stale' });
    }
    if (!registered.has(album.spotifyUrl)) {
      issues.push({ id: album.id, code: 'album-spotify-source-missing' });
    }
  }

  return issues;
}
```

- [ ] **Step 4: 통과 확인**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npx vitest run tests/unit/content-audit.test.ts`
Expected: PASS. 두 번째 테스트가 실패하면 Task 1의 `spotify-*.json` url과 `albums/*.json` spotifyUrl이 문자 단위로 같은지 확인.

- [ ] **Step 5: 커밋**

```bash
npx prettier --write src/lib/content/audit.ts tests/unit/content-audit.test.ts
git add src/lib/content/audit.ts tests/unit/content-audit.test.ts
git commit -m "feat: audit album cover freshness, host, and source registration

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: `AlbumCover.astro` + 배지 폭 수정 + discover 정규 6장에 첫 적용

**Files:**
- Create: `src/components/content/AlbumCover.astro`
- Modify: `src/components/content/StatusBadge.astro:13-24`
- Modify: `src/pages/discover.astro:1-30, 51-67, 168-192`
- Test: `tests/e2e/navigation.spec.ts` (끝에 추가)

**Interfaces:**
- Consumes: `getAlbums()`, `findAlbumByTitle()`, `AlbumRecord` (Task 1)
- Produces: `<AlbumCover album={AlbumRecord} size={32 | 72 | 120} />` — `a.album-cover[href=spotifyUrl][data-era]` 안에 `img` + `.album-cover__fallback`.

- [ ] **Step 1: 실패하는 e2e 테스트**

`tests/e2e/navigation.spec.ts` 끝에:
```ts
test('shows Spotify-linked official covers for the six studio albums', async ({
  page,
}) => {
  await page.goto('/discover/');

  const covers = page
    .getByRole('list', { name: '정규 앨범 6장' })
    .locator('a.album-cover');
  await expect(covers).toHaveCount(6);
  await expect(covers.first()).toHaveAttribute(
    'href',
    /^https:\/\/open\.spotify\.com\/album\//,
  );
  await expect(covers.first().locator('img')).toHaveAttribute(
    'alt',
    /앨범 커버 — Spotify에서 열기$/,
  );
  await expect(covers.first().locator('img')).toHaveAttribute(
    'referrerpolicy',
    'no-referrer',
  );
});
```

- [ ] **Step 2: 실패 확인**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm run build && PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npx playwright test tests/e2e/navigation.spec.ts -g "official covers" --project=desktop-chromium`
Expected: FAIL — `toHaveCount(6)` received 0

- [ ] **Step 3: 컴포넌트 작성**

`src/components/content/AlbumCover.astro`:
```astro
---
import type { AlbumRecord } from '../../lib/content/contracts';

interface Props {
  album: AlbumRecord;
  size: 32 | 72 | 120;
}

const { album, size } = Astro.props;
const { title, era, spotifyUrl, cover } = album.data;
---

<a
  class="album-cover"
  href={spotifyUrl}
  target="_blank"
  rel="noreferrer"
  data-era={era}
  style={`--size: ${size}px`}
>
  <span class="album-cover__fallback" aria-hidden="true">{title}</span>
  <img
    src={cover.url}
    width={cover.width}
    height={cover.height}
    alt={`${title} 앨범 커버 — Spotify에서 열기`}
    loading="lazy"
    decoding="async"
    referrerpolicy="no-referrer"
  />
</a>

<style>
  .album-cover {
    position: relative;
    display: grid;
    flex: 0 0 auto;
    width: var(--size);
    height: var(--size);
    min-height: 0;
    overflow: hidden;
    color: var(--ivory);
    background: var(--era-color, var(--night));
    text-decoration: none;
  }

  .album-cover[data-era='night'] {
    --era-color: #15151c;
  }
  .album-cover[data-era='red'] {
    --era-color: color-mix(in srgb, var(--red) 55%, var(--night));
  }
  .album-cover[data-era='blue'] {
    --era-color: color-mix(in srgb, var(--blue) 50%, var(--night));
  }
  .album-cover[data-era='amber'] {
    --era-color: color-mix(in srgb, var(--amber) 45%, var(--night));
  }

  .album-cover__fallback {
    display: grid;
    place-items: center;
    padding: 0.35em;
    font-family: var(--font-display);
    font-size: calc(var(--size) * 0.16);
    line-height: 1;
    text-align: center;
    text-transform: uppercase;
    word-break: break-word;
  }

  .album-cover__fallback,
  .album-cover img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .album-cover img {
    object-fit: cover;
  }

  .album-cover:focus-visible {
    outline-offset: 2px;
  }
</style>
```
이미지 로드 실패 시 `img`는 alt 텍스트 없이(빈 영역) 투명하게 남고 아래 fallback 타일이 보인다. 별도 JS 없음.

- [ ] **Step 4: 배지 폭 수정**

`src/components/content/StatusBadge.astro` `.status` 규칙에 `width: fit-content;` 추가(grid 자식 stretch 방지).

- [ ] **Step 5: discover 정규 6장에 커버 삽입**

`src/pages/discover.astro` frontmatter에 추가:
```ts
import AlbumCover from '../components/content/AlbumCover.astro';
import { findAlbumByTitle } from '../lib/content/albums';
import { getAlbums } from '../lib/content/queries';

const albums = await getAlbums();
const studioAlbums = albums.filter((album) => album.data.kind === 'studio');
```
`<ol>` 블록(54–61행)을 교체:
```astro
<ol aria-label="정규 앨범 6장">
  {
    studioAlbums.map((album) => (
      <li>
        <AlbumCover album={album} size={72} />
        <span>
          {album.data.year} · <em>{album.data.title}</em>
        </span>
      </li>
    ))
  }
</ol>
```
스타일 `.discover__albums li`를 다음으로 교체:
```css
.discover__albums li {
  display: flex;
  gap: 0.9rem;
  align-items: center;
  color: var(--mist);
}
```
`findAlbumByTitle`는 이 Task에서는 미사용이므로 import하지 않는다(다음 Task에서 추가). 위 import 줄에서 `findAlbumByTitle` 줄은 제외.

- [ ] **Step 6: 통과 확인**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm run build && PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npx playwright test tests/e2e/navigation.spec.ts --project=desktop-chromium`
Expected: 전부 PASS(기존 `distinguishes the six studio albums` 포함 — 제목 `정규 앨범 6장` heading은 유지됨)

- [ ] **Step 7: 커밋**

```bash
npx prettier --write src/components/content src/pages/discover.astro tests/e2e/navigation.spec.ts
git add src/components/content src/pages/discover.astro tests/e2e/navigation.spec.ts
git commit -m "feat: show Spotify covers for the six studio albums

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: 커버 노출 확대 — 홈 입문, 연표, 두 Trilogy, 셋리스트 곡 메타, 출처 고지

**Files:**
- Modify: `src/components/home/IntroSummary.astro`
- Modify: `src/pages/index.astro:8-18, 35`
- Modify: `src/components/discover/CareerTimeline.astro:1-43, 62-66`
- Modify: `src/components/discover/TrilogyExplainer.astro:1-30`
- Modify: `src/pages/discover.astro` (TrilogyExplainer/CareerTimeline에 `albums` 전달)
- Modify: `src/components/setlist/SetlistExplorer.astro:1-27, 87-92`
- Modify: `src/pages/setlist.astro:11-16, 41-46`
- Modify: `src/pages/sources.astro` (checkpoints 섹션 `sources-page__note` 뒤)
- Test: `tests/e2e/navigation.spec.ts`

**Interfaces:**
- Consumes: `AlbumCover`, `getAlbums`, `findAlbumByTitle`, `AlbumRecord`
- Produces: `IntroSummary`·`CareerTimeline`·`TrilogyExplainer`·`SetlistExplorer`가 `albums: AlbumRecord[]` prop을 받는다.

- [ ] **Step 1: 실패하는 e2e**

`tests/e2e/navigation.spec.ts` 끝에:
```ts
test('places covers beside every album mention on home, discover, and setlist', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.locator('.home-entry--intro a.album-cover'),
  ).toHaveCount(3);

  await page.goto('/discover/');
  await expect(
    page.locator('.trilogies__sequence a.album-cover'),
  ).toHaveCount(6);
  const kissLand = page.locator('.timeline__entry', {
    hasText: '2013 · Kiss Land',
  });
  await expect(kissLand.locator('a.album-cover')).toHaveCount(1);

  await page.goto('/setlist/');
  const firstSong = page.locator('.expected-setlist__list details').first();
  await firstSong.locator('summary').click();
  await expect(firstSong.locator('a.album-cover')).toHaveCount(1);

  await page.goto('/sources/');
  await expect(
    page.getByText('앨범 커버는 Spotify CDN에서 직접 불러옵니다'),
  ).toBeVisible();
});
```

- [ ] **Step 2: 실패 확인**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm run build && PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npx playwright test tests/e2e/navigation.spec.ts -g "covers beside" --project=desktop-chromium`
Expected: FAIL — 홈 count 0

- [ ] **Step 3: 홈 입문 3장**

`src/pages/index.astro`: import에 `getAlbums` 추가, `const albums = await getAlbums();`, `<IntroSummary albums={albums} />`.

`src/components/home/IntroSummary.astro` 전체 교체:
```astro
---
import AlbumCover from '../content/AlbumCover.astro';
import type { AlbumRecord } from '../../lib/content/contracts';
import { findAlbumByTitle } from '../../lib/content/albums';

interface Props {
  albums: AlbumRecord[];
}

const { albums } = Astro.props;
const trilogy = ['After Hours', 'Dawn FM', 'Hurry Up Tomorrow']
  .map((title) => findAlbumByTitle(albums, title))
  .filter((album): album is AlbumRecord => Boolean(album));
---

<section class="home-entry home-entry--intro" aria-labelledby="intro-title">
  <div class="shell-content home-entry__inner">
    <p class="eyebrow">START HERE / 03 MINUTES</p>
    <h2 id="intro-title">
      3분 만에 <span class="latin">The Weeknd</span> 알기
    </h2>
    <p>
      밤의 충동과 후회를 영화처럼 노래하던 인물이, 새벽을 향해 자신을 마주하는
      이야기. 이번 공연 전에는 이 세 장의 앨범만 이어 들어도 충분해요.
    </p>
    <ul class="home-entry__albums" aria-label="이번 공연 전에 들을 세 장">
      {
        trilogy.map((album) => (
          <li>
            <AlbumCover album={album} size={120} />
            <span>{album.data.year}</span>
          </li>
        ))
      }
    </ul>
    <a href="/discover/"
      >The Weeknd의 밤으로 들어가기 <span aria-hidden="true">→</span></a
    >
  </div>
</section>

<style>
  .home-entry {
    padding-block: var(--section-space);
  }

  .home-entry__inner {
    display: grid;
    gap: 1.25rem;
    max-width: 48rem;
  }

  .home-entry__albums {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem 1.25rem;
    margin: 0.5rem 0 0;
    padding: 0;
    list-style: none;
  }

  .home-entry__albums li {
    display: grid;
    gap: 0.35rem;
    justify-items: start;
    color: var(--mist);
    font-size: 0.8rem;
    font-weight: 800;
  }

  p:not(.eyebrow) {
    color: var(--mist);
    font-size: clamp(1rem, 2vw, 1.15rem);
  }

  a {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    min-height: 44px;
    color: var(--ivory);
    font-weight: 800;
  }
</style>
```
(h2 스코프 스타일은 제거 — Task 6 전역 규칙이 담당. `<span class="latin">`도 Task 6에서 스타일 정의. e2e `getByRole('heading', { name: '3분 만에 The Weeknd 알기' })`는 accessible name이 공백 정규화되어 유지된다.)

- [ ] **Step 4: 연표**

`src/components/discover/CareerTimeline.astro`: Props에 `albums: AlbumRecord[]` 추가, import `AlbumCover`, `findAlbumByTitle`, `AlbumRecord`. `renderedEntries` 매핑에 추가:
```ts
covers: entry.data.relatedAlbums
  .map((title) => findAlbumByTitle(albums, title))
  .filter((album): album is AlbumRecord => Boolean(album)),
```
`.timeline__summary` 안 `<StatusBadge>` 앞에:
```astro
{covers.length > 0 && (
  <ul class="timeline__covers" aria-label={`${entry.data.title} 앨범`}>
    {covers.map((album) => (
      <li>
        <AlbumCover album={album} size={72} />
      </li>
    ))}
  </ul>
)}
```
(구조 분해에 `covers` 추가: `renderedEntries.map(({ entry, Content, sources: entrySources, covers }) => ...)`)
스타일 추가:
```css
.timeline__covers {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin: 0.25rem 0 0;
  padding: 0;
  list-style: none;
}
```
`discover.astro`: `<CareerTimeline entries={eras} sources={sources} albums={albums} />`.

- [ ] **Step 5: 두 Trilogy**

`src/components/discover/TrilogyExplainer.astro` frontmatter:
```astro
---
import AlbumCover from '../content/AlbumCover.astro';
import type { AlbumRecord } from '../../lib/content/contracts';
import { findAlbumByTitle } from '../../lib/content/albums';

interface Props {
  albums: AlbumRecord[];
}

const { albums } = Astro.props;
const pick = (titles: string[]) =>
  titles
    .map((title) => findAlbumByTitle(albums, title))
    .filter((album): album is AlbumRecord => Boolean(album));
const early = pick(['House of Balloons', 'Thursday', 'Echoes of Silence']);
const recent = pick(['After Hours', 'Dawn FM', 'Hurry Up Tomorrow']);
---
```
각 `<section>` 안 시퀀스 문단(`<p>House of Balloons → Thursday → Echoes of Silence</p>`, `<p>After Hours → Dawn FM → Hurry Up Tomorrow</p>`) **바로 앞에**(문단은 e2e가 텍스트로 검증하므로 유지):
```astro
<ul class="trilogies__covers" aria-label="초기 3부작 앨범">
  {early.map((album) => (<li><AlbumCover album={album} size={120} /></li>))}
</ul>
```
두 번째는 `aria-label="최근 앨범 3부작 앨범"`, `recent`. 스타일 추가:
```css
.trilogies__covers {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 0 0 0.75rem;
  padding: 0;
  list-style: none;
}
```
`discover.astro`: `<TrilogyExplainer albums={albums} />`.

- [ ] **Step 6: 셋리스트 곡 메타 32px**

`src/pages/setlist.astro`: `Promise.all`에 `getAlbums()` 추가 → `const [concert, entries, showRecords, sources, albums] = ...`, `<SetlistExplorer ... albums={albums} />`.

`src/components/setlist/SetlistExplorer.astro`: Props에 `albums: AlbumRecord[]`, import `AlbumCover`, `findAlbumByTitle`, `AlbumRecord`. `.expected-setlist__metadata` 문단을 교체:
```astro
<p class="expected-setlist__metadata">
  {(() => {
    const album = findAlbumByTitle(albums, entry.data.album);
    return album ? <AlbumCover album={album} size={32} /> : null;
  })()}
  <span>{entry.data.album}</span>
  <span>신뢰도 {entry.data.confidence}</span>
  <StatusBadge status={entry.data.status} />
</p>
```

- [ ] **Step 7: 출처 고지**

`src/pages/sources.astro` `sources-page__note` 문단 뒤에:
```astro
<p class="sources-page__note">
  앨범 커버는 Spotify CDN에서 직접 불러옵니다(쿠키 없음). 자체 저장·재가공하지
  않으며 커버를 누르면 Spotify 앨범 페이지로 이동합니다.
</p>
```

- [ ] **Step 8: 통과 확인**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm run check && PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm run build && PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npx playwright test tests/e2e/navigation.spec.ts tests/e2e/no-js.spec.ts`
Expected: 전부 PASS

- [ ] **Step 9: 커밋**

```bash
npx prettier --write src/components src/pages tests/e2e/navigation.spec.ts
git add src/components src/pages tests/e2e/navigation.spec.ts
git commit -m "feat: place album covers beside every album mention

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: 타이포 전역 규칙 — 한글 900, 히어로 2줄, 셋리스트 heading, h1 언어 규칙

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/global.css:55-60`
- Modify: `src/components/home/HomeHero.astro:84-90, 154-183, 185-205`
- Modify: `src/components/home/SetlistPreview.astro:18-22, 77-90`
- Modify: `src/components/home/GuideShortcuts.astro:27-34`
- Modify: `src/components/home/FanNote.astro:31-37`
- Modify: `src/components/discover/CareerTimeline.astro` (h2 규칙), `TrilogyExplainer.astro` (h3 규칙 55-60행 근처)
- Modify: `src/components/setlist/SetlistExplorer.astro:141-148`
- Modify: `src/components/guide/GuideSection.astro:73-79`
- Modify: `src/pages/discover.astro:39, 73, 127-141`, `src/pages/setlist.astro:31-35, 63-70`, `src/pages/goyang.astro:22-25, 52-`, `src/pages/sources.astro:50, 163-`
- Test: `tests/e2e/visual.spec.ts` (끝에 추가)

**Interfaces:**
- Produces: 전역 클래스 `.display-latin`(Bebas 영문 전용 제목), `.latin`(한글 제목 안 라틴 조각). 토큰 `--font-display-ko`.

- [ ] **Step 1: 실패하는 e2e**

`tests/e2e/visual.spec.ts` 끝에:
```ts
test('keeps the hero title on two lines and renders Korean headings in Noto Sans KR', async ({
  page,
}) => {
  await page.goto('/');

  const metrics = await page.evaluate(() => {
    const lineCount = (element: Element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return new Set(
        Array.from(range.getClientRects()).map((rect) => Math.round(rect.top)),
      ).size;
    };
    const h1 = document.querySelector('h1')!;
    const intro = document.getElementById('intro-title')!;
    const introStyle = getComputedStyle(intro);
    return {
      heroLines: lineCount(h1),
      introFont: introStyle.fontFamily,
      introWeight: introStyle.fontWeight,
      introLineHeight:
        parseFloat(introStyle.lineHeight) / parseFloat(introStyle.fontSize),
    };
  });

  expect(metrics.heroLines).toBe(2);
  expect(metrics.introFont).toMatch(/Noto Sans KR/);
  expect(metrics.introWeight).toBe('900');
  expect(metrics.introLineHeight).toBeGreaterThan(1);
});
```

- [ ] **Step 2: 실패 확인**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm run build && PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npx playwright test tests/e2e/visual.spec.ts -g "two lines"`
Expected: FAIL — mobile-chromium에서 `heroLines` 4, desktop에서 `introFont` Bebas

- [ ] **Step 3: 토큰·전역 규칙**

`src/styles/tokens.css` `--font-body` 줄 뒤에:
```css
--font-display-ko: 'Noto Sans KR Variable', system-ui, sans-serif;
```
`src/styles/global.css` 55–60행(`h1, h2, h3, p { margin: 0 }`) 뒤에 추가:
```css
h1,
h2,
h3 {
  font-family: var(--font-display-ko);
  font-weight: 900;
  letter-spacing: -0.02em;
  line-height: 1.08;
  word-break: keep-all;
  text-wrap: balance;
}

h1 {
  font-size: clamp(2.6rem, 7.5vw, 5.4rem);
}

h2 {
  font-size: clamp(2.1rem, 5.5vw, 4rem);
}

h3 {
  font-size: clamp(1.2rem, 2.4vw, 1.5rem);
}

.display-latin,
.latin {
  font-family: var(--font-display);
  font-weight: 400;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.latin {
  font-size: 1.08em;
}

.display-latin {
  line-height: 0.82;
}
```

- [ ] **Step 4: 컴포넌트 스코프 제목 규칙 제거**

다음 파일에서 `h2`(또는 `h1`/`h3`) 셀렉터 블록 중 `font-family: var(--font-display)`, `font-size`, `font-weight: 400`, `letter-spacing`, `line-height` 선언을 **삭제**하고 `margin`·`color`·`max-width`만 남긴다(블록이 비면 블록 삭제):
- `src/components/home/GuideShortcuts.astro` h2 (27–34행: `margin-top: 0.75rem`만 남김)
- `src/components/home/FanNote.astro` h2 (31–37행: 블록 삭제)
- `src/components/home/SetlistPreview.astro` h2 (84–90행: 블록 삭제)
- `src/components/discover/CareerTimeline.astro` h2 (68–74행: 블록 삭제) — 연표 항목 제목은 h2 전역 크기보다 작아야 하므로 `h2 { font-size: clamp(1.6rem, 3.2vw, 2.4rem); }`만 남김
- `src/components/discover/TrilogyExplainer.astro` h3 블록: `font-family`, `font-weight`, `letter-spacing`, `line-height` 삭제, `font-size`는 유지
- `src/components/setlist/SetlistExplorer.astro` h2 (141–148행: `margin: 0`만 남김)
- `src/components/guide/GuideSection.astro` h2 (73–79행: 블록 삭제). `.guide-section__body :global(h2)`(109–117행)은 본문 소제목이므로 그대로 둔다.
- `src/pages/discover.astro` 127–141행(`h1, h2 {...}`, `h1 {...}`, `h2 {...}`) 삭제
- `src/pages/setlist.astro` 63–70행 h1 블록: `margin: 0`만 남김
- `src/pages/goyang.astro` h1 블록(52행 근처): `font-family`, `font-weight`, `letter-spacing`, `line-height`, `font-size` 삭제
- `src/pages/sources.astro` 163행 근처 `h1, h2 {...}`, `h1 {...}`, `h2 {...}`: `font-family`, `font-weight`, `letter-spacing`, `line-height`, `font-size` 삭제

- [ ] **Step 5: h1 언어 규칙·`<br />` 제거**

- `src/pages/setlist.astro` 33–35행:
  ```astro
  <h1 id="setlist-page-title">
    {archivePublished ? '우리는 그곳에 있었다' : '예상 셋리스트'}
  </h1>
  ```
  eyebrow는 `{archivePublished ? 'WE WERE HERE' : 'EXPECTED SETLIST'}`로 교체.
- `src/pages/goyang.astro` 23–25행: eyebrow `GOYANG DAY-OF GUIDE`, h1 `고양 당일 가이드`. (`aria-labelledby`·id 유지)
- `src/pages/discover.astro` 39행: `<h1><span class="latin">The Weeknd</span>를 한 장씩 넘겨 보기</h1>`; 73행: `<h2 id="timeline-title">연표는 가볍게, 필요하면 더 깊게</h2>`
- `src/pages/sources.astro` 50행: `<h1>출처와 업데이트</h1>`
- `src/components/setlist/SetlistExplorer.astro` 90행 근처 `<h2 id="expected-setlist-title">예상 셋리스트</h2>` → `이번 투어의 반복 패턴` (페이지 h1과 중복 제거. e2e는 `.expected-setlist` 클래스와 배지 텍스트로 검증하므로 영향 없음.)
- `src/components/guide/GuideSection.astro` 32행 eyebrow `GOYANG DAY-OF GUIDE` 유지.

- [ ] **Step 6: 히어로 h1 2줄 고정**

`src/components/home/HomeHero.astro` 87행:
```astro
<h1 id="home-title" class="display-latin">
  <span>AFTER HOURS</span>
  <span class="home-hero__dawn">TIL DAWN</span>
</h1>
```
스타일 154–175행을 교체:
```css
h1 {
  margin-top: 0.8rem;
  font-size: clamp(3.8rem, 16.5vw, 15rem);
  letter-spacing: 0.01em;
  line-height: 0.82;
  text-wrap: initial;
}

h1 span {
  display: block;
  white-space: nowrap;
}

.home-hero__dawn {
  background: linear-gradient(90deg, var(--red), var(--blue) 64%, var(--amber));
  background-clip: text;
  color: transparent;
}
```
(`max-width: 11ch` 삭제. `toContainText('AFTER HOURS TIL DAWN')`는 두 span 텍스트를 공백으로 이어 매칭한다.)

- [ ] **Step 7: 셋리스트 미리보기 heading 2단**

`src/components/home/SetlistPreview.astro` 18–22행:
```astro
<div class="setlist-preview__heading">
  <p class="eyebrow">A PATTERN, NOT A PROMISE</p>
  <div class="setlist-preview__title-row">
    <h2 id="setlist-preview-title">예상 셋리스트</h2>
    <StatusBadge status="expected" />
  </div>
</div>
```
스타일 77–82행 교체:
```css
.setlist-preview__heading {
  display: grid;
  gap: 0.5rem;
}

.setlist-preview__title-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1.25rem;
  align-items: baseline;
}
```

- [ ] **Step 8: 통과 확인**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm run check && PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm run build && PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npx playwright test`
Expected: 전부 PASS(기존 105 + 신규). `serves the Korean fan-guide shell`, `shows concert facts and four lightweight entry blocks` 반드시 통과.

- [ ] **Step 9: 시각 확인**

Run: 아래 스크립트를 `.visual-probe.tmp.mjs`로 프로젝트 루트에 저장 후 `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH node .visual-probe.tmp.mjs` (preview 서버 `npm run preview -- --host 127.0.0.1 --port 4323`를 먼저 백그라운드로), 스크린샷을 Read로 열어 확인 후 파일 삭제:
```js
import { chromium } from '@playwright/test';
const browser = await chromium.launch();
for (const [w, h] of [[375, 812], [390, 844], [572, 863], [1440, 900]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  for (const path of ['/', '/discover/', '/setlist/', '/goyang/']) {
    await page.goto(`http://127.0.0.1:4323${path}`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `/private/tmp/claude-501/-Users-yong-dev-weeknd-fan/1c25aed2-e691-49da-8c7e-b8b26c7b3dd4/scratchpad/shots/t6-${w}${path.replace(/\//g, '_')}.png`, fullPage: true });
  }
  await page.close();
}
await browser.close();
```
판정: 히어로 2줄, 모든 한글 제목 굵고 줄바꿈 자연스러움, 고아 글자 없음, `The Weeknd` 비분리.

- [ ] **Step 10: 커밋**

```bash
npx prettier --write src tests/e2e/visual.spec.ts
git add src tests/e2e/visual.spec.ts
git commit -m "feat: unify Korean display typography and fix hero line breaks

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: §0 이해도 — 히어로 정체 문구, 공식 공지, Eclipse 캡션, 워드마크, 셋리스트 affordance, 입문 기본 열림, 공유 링크 설명

**Files:**
- Modify: `src/lib/countdown.ts:36-44, 58-98`
- Modify: `src/components/visual/EclipseCountdown.astro:22-40, update()`
- Modify: `src/components/home/HomeHero.astro:5-14, 84-90, 177-183`
- Modify: `src/pages/index.astro`
- Modify: `src/components/chrome/SiteHeader.astro:20`
- Modify: `src/components/setlist/SetlistExplorer.astro` (summary, 안내 문장, 스타일)
- Modify: `src/pages/discover.astro:42`
- Modify: `src/components/home/FanNote.astro:9-11`, `SetlistPreview.astro:56-58`
- Test: `tests/unit/countdown.test.ts`, `tests/e2e/navigation.spec.ts:334-357` 수정 + 신규

**Interfaces:**
- Produces: `CountdownState.captionLabel: string` ('첫 공연까지' | '둘째 날 공연까지' | ''); `HomeHero` prop `officialNoticeUrl: string`, `ageRestriction: string`.

- [ ] **Step 1: 실패하는 단위 테스트**

`tests/unit/countdown.test.ts` `describe('getCountdownState')` 안에 추가:
```ts
it('captions the moon with which show the count points at', () => {
  expect(
    getCountdownState({
      ...schedule,
      now: new Date('2026-08-29T19:45:00+09:00'),
    }).captionLabel,
  ).toBe('첫 공연까지');
  expect(
    getCountdownState({
      ...schedule,
      now: new Date('2026-10-07T20:00:00+09:00'),
    }).captionLabel,
  ).toBe('둘째 날 공연까지');
  expect(
    getCountdownState({
      ...schedule,
      now: new Date('2026-10-08T20:00:00+09:00'),
    }).captionLabel,
  ).toBe('');
});
```

- [ ] **Step 2: 실패 확인**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npx vitest run tests/unit/countdown.test.ts`
Expected: FAIL — `undefined` !== '첫 공연까지'

- [ ] **Step 3: countdown.ts**

`CountdownState`에 `captionLabel: string;` 추가. 세 return 객체에: archive → `captionLabel: ''`, day-two-live → `captionLabel: ''`, 마지막 → `captionLabel: now < dayOne ? '첫 공연까지' : '둘째 날 공연까지'`.

- [ ] **Step 4: 통과 확인**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npx vitest run tests/unit/countdown.test.ts`
Expected: PASS

- [ ] **Step 5: 실패하는 e2e**

`tests/e2e/navigation.spec.ts` — `shows checked primary sources when discover disclosures open` 테스트의 `await intro.locator('summary').click();` 줄을 다음으로 교체(기본 열림 반영):
```ts
await expect(intro).toHaveAttribute('open', '');
```
끝에 신규:
```ts
test('states what the site is, who it is for, and where the official notice lives', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByText('THE WEEKND · 비공식 팬 팜플렛')).toBeVisible();
  await expect(page.getByText('만 19세 이상')).toBeVisible();
  await expect(page.getByRole('link', { name: '공식 공지 ↗' })).toHaveAttribute(
    'href',
    'https://tickets.interpark.com/contents/notice/detail/14180',
  );
  await expect(page.locator('eclipse-countdown [data-caption]')).toHaveText(
    /공연까지$/,
  );
  await expect(page.getByText('THE WEEKND · GOYANG 26')).toBeVisible();
  await expect(
    page.getByText('브라우저에서만 만들어지는 이미지 한 장').first(),
  ).toBeVisible();

  await page.goto('/setlist/');
  await expect(
    page.getByText('곡을 누르면 관람 포인트·떼창·공식 듣기가 열립니다.'),
  ).toBeVisible();
  const firstSummary = page.locator('.expected-setlist__list summary').first();
  await expect(firstSummary).toHaveAttribute('data-affordance', '+');
});
```

- [ ] **Step 6: 실패 확인**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm run build && PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npx playwright test tests/e2e/navigation.spec.ts -g "states what|discover disclosures" --project=desktop-chromium`
Expected: 2개 FAIL

- [ ] **Step 7: 히어로 정체 문구·공식 공지·연령**

`src/pages/index.astro`: `import { getCollection } from 'astro:content';` 추가,
```ts
const sources = await getCollection('sources');
const officialNoticeUrl = sources.find((source) => source.id === 'nol-notice')?.data.url;
if (!officialNoticeUrl) throw new Error('Missing source record: nol-notice');
```
`<HomeHero concert={concert} officialNoticeUrl={officialNoticeUrl} />`.

`src/components/home/HomeHero.astro` Props에 `officialNoticeUrl: string;`, 구조분해에 추가. 84–90행 교체:
```astro
<div class="home-hero__content shell-content">
  <div class="home-hero__heading">
    <p class="eyebrow">THE WEEKND · 비공식 팬 팜플렛</p>
    <h1 id="home-title" class="display-latin">
      <span>AFTER HOURS</span>
      <span class="home-hero__dawn">TIL DAWN</span>
    </h1>
    <p class="home-hero__facts">
      <span>2026.10.07—08</span>
      <span aria-hidden="true">·</span>
      <span>{concert.data.venue}</span>
      <span aria-hidden="true">·</span>
      <span>{concert.data.ageRestriction}</span>
      <a href={officialNoticeUrl} rel="noreferrer">공식 공지 ↗</a>
    </p>
  </div>
</div>
```
`h1 + p` 스타일 셀렉터를 `.home-hero__facts`로 바꾸고 다음 추가:
```css
.home-hero__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.6rem;
  align-items: center;
  text-shadow: 0 1px 12px var(--night);
}

.home-hero__facts a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: var(--amber);
  font-weight: 800;
}
```
모바일 `@media (max-width: 42rem)` 블록에 `.home-hero__moon-art { inset: auto -10vw -9rem auto !important; }`, `eclipse-countdown { bottom: -3.75rem; }`로 달을 아래로 내려 facts와 겹치지 않게 한다(e2e `getByText('2026.10.07—08')`, `getByText('고양종합운동장 주경기장')` 는 각 span에 매칭).

- [ ] **Step 8: Eclipse 캡션**

`src/components/visual/EclipseCountdown.astro` 마크업의 `<time data-clock ...>` 앞에:
```astro
<p data-caption aria-hidden="true" hidden={!initial.captionLabel}>
  {initial.captionLabel}
</p>
```
클래스 내부 `update()`의 `this.clock.textContent = ...` 뒤에:
```ts
const caption = this.querySelector<HTMLElement>('[data-caption]');
if (caption) {
  caption.hidden = !state.captionLabel;
  caption.textContent = state.captionLabel;
}
```
스타일:
```css
[data-caption] {
  margin: -0.35rem 0 0;
  color: var(--mist);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}
```

- [ ] **Step 9: 워드마크·공유 링크 설명**

- `SiteHeader.astro` 20행: `GOYANG 26` → `THE WEEKND · GOYANG 26`.
- `FanNote.astro` 링크 뒤에 `<p class="fan-note__hint">브라우저에서만 만들어지는 이미지 한 장. 서버 저장 없음.</p>`, 스타일 `.fan-note__hint { color: var(--mist); font-size: 0.85rem; }`.
- `SetlistPreview.astro` `셋리스트 포스터 만들기` 링크 뒤에 같은 문장의 `<p class="setlist-preview__hint">`, 스타일 `.setlist-preview__hint { margin-top: -0.75rem; color: var(--mist); font-size: 0.85rem; }`.

- [ ] **Step 10: 셋리스트 affordance·안내**

`SetlistExplorer.astro`: `<p class="expected-setlist__comparison">` 뒤에
```astro
<p class="expected-setlist__hint">곡을 누르면 관람 포인트·떼창·공식 듣기가 열립니다.</p>
```
`<summary>`에 `data-affordance="+"` 속성 추가. summary 스타일에 추가:
```css
summary {
  justify-content: space-between;
  gap: 1rem;
  list-style: none;
}

summary::-webkit-details-marker {
  display: none;
}

summary::after {
  content: attr(data-affordance);
  color: var(--amber);
  font-family: var(--font-display);
  font-size: 1.4em;
  line-height: 1;
  transition: transform var(--motion-fast) var(--ease-cinematic);
}

details[open] > summary::after {
  transform: rotate(45deg);
}

.expected-setlist__hint {
  margin: -1rem 0 1rem;
  color: var(--amber);
  font-size: 0.9rem;
  font-weight: 800;
}
```
(`+`를 45° 회전하면 `×`, 닫기 의미. 별도 문자 교체 JS 없음.)

- [ ] **Step 11: Discover 입문 기본 열림**

`src/pages/discover.astro` 42행: `<details aria-label="1분 입문 더 깊이 보기" open>`.

- [ ] **Step 12: 통과 확인**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm run check && PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm run test:unit && PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm run build && PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npx playwright test`
Expected: 전부 PASS. `exposes navigation and the unofficial disclaimer`의 `getByText('비공식·비영리 팬 가이드', { exact: true })`가 여전히 1개(푸터)인지 확인 — 히어로 문구는 `비공식 팬 팜플렛`이라 충돌 없음.

- [ ] **Step 13: 커밋**

```bash
npx prettier --write src tests
git add src tests
git commit -m "feat: state the guide's identity and surface hidden affordances

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: 하늘 레이어 — 밤→새벽 스크롤 연동, 섹션 투명화, 대각선 접힘, 푸터

**Files:**
- Modify: `src/layouts/BaseLayout.astro:41-46`
- Modify: `src/styles/global.css:5-53` (body/body::before 재작성 + 하늘 레이어 + 접힘 면)
- Modify: `src/styles/motion.css:17-26`
- Modify: `src/components/home/HomeHero.astro:94-132`
- Modify: `src/components/home/IntroSummary.astro`, `SetlistPreview.astro:63-70`, `GuideShortcuts.astro:16-18`, `FanNote.astro:16-23` (섹션 태그에 `fold` 클래스, 배경 제거)
- Modify: `src/components/chrome/SiteFooter.astro:18-27`
- Test: `tests/e2e/visual.spec.ts`

**Interfaces:**
- Produces: `.dawn-sky` 요소(`aria-hidden`), 전역 클래스 `.fold`, `.fold--reverse`.

- [ ] **Step 1: 실패하는 e2e**

`tests/e2e/visual.spec.ts` 끝에:
```ts
test('turns the fixed sky from night to dawn as the home page scrolls', async ({
  page,
}) => {
  await page.goto('/');
  const sky = page.locator('.dawn-sky');
  await expect(sky).toHaveAttribute('aria-hidden', 'true');

  const supportsScrollTimeline = await page.evaluate(() =>
    CSS.supports('animation-timeline: scroll()'),
  );
  test.skip(!supportsScrollTimeline, 'static fallback browser');

  const sample = () =>
    page.evaluate(() => {
      const element = document.querySelector('.dawn-sky')!;
      return getComputedStyle(element).backgroundColor;
    });
  const top = await sample();
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await page.waitForTimeout(200);
  const bottom = await sample();

  expect(top).not.toBe(bottom);
  const [r, g, b] = bottom.match(/\d+/g)!.map(Number);
  expect(r).toBeGreaterThan(b);
});

test('keeps every home section transparent so the sky shows through', async ({
  page,
}) => {
  await page.goto('/');
  const opaqueSections = await page.evaluate(() =>
    Array.from(document.querySelectorAll('main > section')).filter((section) => {
      const { backgroundColor, backgroundImage } = getComputedStyle(section);
      return backgroundImage !== 'none' || !/rgba\(0, 0, 0, 0\)|transparent/.test(backgroundColor);
    }).length,
  );
  expect(opaqueSections).toBe(0);
});
```

- [ ] **Step 2: 실패 확인**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm run build && PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npx playwright test tests/e2e/visual.spec.ts -g "sky|transparent"`
Expected: FAIL — `.dawn-sky` 없음, opaqueSections 3

- [ ] **Step 3: 레이아웃에 하늘 마운트**

`src/layouts/BaseLayout.astro` `<body>` 첫 줄에 `<div class="dawn-sky" aria-hidden="true"></div>`.

- [ ] **Step 4: global.css 재작성 (5–53행 교체)**

```css
html {
  background: var(--night);
  color-scheme: dark;
  scroll-behavior: smooth;
}

body {
  position: relative;
  min-width: 20rem;
  min-height: 100vh;
  margin: 0;
  overflow-x: hidden;
  isolation: isolate;
  background: linear-gradient(
    180deg,
    var(--night) 0 18%,
    #1a080c 38%,
    #0b1633 64%,
    #2a1a10 100%
  );
  color: var(--ivory);
  font-family: var(--font-body);
  font-optical-sizing: auto;
  line-height: 1.6;
}

/* 하늘 레이어: scroll-driven animation 지원 브라우저에서만 켠다 */
.dawn-sky {
  display: none;
}

@property --dawn-sky {
  syntax: '<color>';
  inherits: true;
  initial-value: #050507;
}
@property --dawn-horizon-y {
  syntax: '<length-percentage>';
  inherits: true;
  initial-value: 64%;
}
@property --dawn-horizon-color {
  syntax: '<color>';
  inherits: true;
  initial-value: #d7d8dc;
}
@property --dawn-glow-red {
  syntax: '<number>';
  inherits: true;
  initial-value: 0;
}
@property --dawn-glow-blue {
  syntax: '<number>';
  inherits: true;
  initial-value: 0;
}

@keyframes dawn-progress {
  0% {
    --dawn-sky: #050507;
    --dawn-horizon-y: 64%;
    --dawn-horizon-color: #d7d8dc;
    --dawn-glow-red: 0;
    --dawn-glow-blue: 0;
  }
  30% {
    --dawn-sky: #1a080c;
    --dawn-horizon-y: 60%;
    --dawn-horizon-color: #a61f27;
    --dawn-glow-red: 1;
    --dawn-glow-blue: 0;
  }
  62% {
    --dawn-sky: #0b1633;
    --dawn-horizon-y: 52%;
    --dawn-horizon-color: #2f63d8;
    --dawn-glow-red: 0.25;
    --dawn-glow-blue: 1;
  }
  100% {
    --dawn-sky: #2a1a10;
    --dawn-horizon-y: 40%;
    --dawn-horizon-color: #e6a359;
    --dawn-glow-red: 0;
    --dawn-glow-blue: 0.2;
  }
}

@keyframes dawn-progress-reduced {
  0% {
    --dawn-sky: #050507;
    --dawn-horizon-color: #d7d8dc;
  }
  30% {
    --dawn-sky: #1a080c;
    --dawn-horizon-color: #a61f27;
  }
  62% {
    --dawn-sky: #0b1633;
    --dawn-horizon-color: #2f63d8;
  }
  100% {
    --dawn-sky: #2a1a10;
    --dawn-horizon-color: #e6a359;
  }
}

@supports (animation-timeline: scroll()) {
  body {
    background: none;
  }

  .dawn-sky {
    position: fixed;
    z-index: -1;
    inset: 0;
    display: block;
    background-color: var(--dawn-sky);
    background-image: linear-gradient(
      180deg,
      transparent calc(var(--dawn-horizon-y) - 1px),
      color-mix(in srgb, var(--dawn-horizon-color) 60%, transparent)
        var(--dawn-horizon-y),
      color-mix(in srgb, var(--dawn-horizon-color) 22%, transparent)
        calc(var(--dawn-horizon-y) + 2px),
      transparent calc(var(--dawn-horizon-y) + 16vh)
    );
    animation: dawn-progress linear both;
    animation-timeline: scroll(root block);
    pointer-events: none;
  }

  .dawn-sky::before,
  .dawn-sky::after {
    position: absolute;
    inset: 0;
    content: '';
  }

  .dawn-sky::before {
    background: radial-gradient(
      ellipse 70% 55% at 18% 30%,
      color-mix(in srgb, var(--red) 34%, transparent),
      transparent 70%
    );
    opacity: var(--dawn-glow-red);
  }

  .dawn-sky::after {
    background: linear-gradient(
      112deg,
      transparent 42%,
      color-mix(in srgb, var(--blue) 30%, transparent) 58%,
      transparent 74%
    );
    opacity: var(--dawn-glow-blue);
  }

  @media (prefers-reduced-motion: reduce) {
    .dawn-sky {
      animation-name: dawn-progress-reduced;
    }
  }
}

main {
  min-height: 60vh;
}

/* 팜플렛 접힘 면: 섹션 경계를 수평선 대신 대각선 빛 면으로 */
.fold {
  position: relative;
}

.fold::before {
  position: absolute;
  inset: 0 0 auto;
  height: clamp(3rem, 8vw, 7rem);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--ivory) 5%, transparent),
    transparent
  );
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 32%);
  content: '';
  pointer-events: none;
}

.fold--reverse::before {
  clip-path: polygon(0 0, 100% 0, 100% 32%, 0 100%);
}
```
(기존 `body::before` 블록과 `main { min-height }` 블록은 위로 대체되므로 삭제.)

- [ ] **Step 5: motion.css reduce 블록 보강**

`src/styles/motion.css` `@media (prefers-reduced-motion: reduce)` 블록 안에 추가:
```css
.dawn-sky {
  animation-duration: auto !important;
}
```

- [ ] **Step 6: 섹션 투명화·접힘 클래스**

- `HomeHero.astro` `.home-hero { background: var(--night) }` → `background: transparent;`. `.home-hero__visual`에 추가:
  ```css
  background: var(--night);
  mask-image: linear-gradient(180deg, #000 78%, transparent);
  ```
- `IntroSummary.astro` `<section class="home-entry home-entry--intro fold" ...>`
- `SetlistPreview.astro` `<section class="setlist-preview fold fold--reverse" ...>`, 63–70행 `.setlist-preview` 블록에서 `background: linear-gradient(...)` 삭제
- `GuideShortcuts.astro` `<section class="guide-shortcuts fold" ...>`
- `FanNote.astro` `<section class="fan-note fold fold--reverse" ...>`, `.fan-note` 블록의 `background` 삭제
- `SiteFooter.astro` `.site-footer`: `background` gradient 삭제, `border-top: 1px solid color-mix(in srgb, var(--amber) 55%, transparent);`

- [ ] **Step 7: 통과 확인**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm run build && PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npx playwright test`
Expected: 전부 PASS. CLS 테스트(`records 390 by 844 home transfer...`) 유지 — fixed 레이어는 레이아웃에 영향 없음.

- [ ] **Step 8: 시각 확인**

Task 6 Step 9의 probe 스크립트를 재사용해 `/` 4해상도 전체 스크린샷 + 다음 스크롤 위치 뷰포트 스크린샷(1440): `scrollTo(0, 0)`, `scrollHeight*0.5`, `scrollHeight`. 판정: 수평 직선 경계 0개, 상단 밤·중간 코발트·하단 앰버, 히어로 하단이 하늘에 녹음, 푸터가 앰버로 끝남.

- [ ] **Step 9: Firefox fallback 확인**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npx playwright install firefox` 후 probe 스크립트의 `chromium`을 `firefox`로 바꿔 1440 `/` 스크린샷 1장. 판정: `.dawn-sky` 미표시, body tall gradient가 밤→레드→코발트→앰버로 보임, 텍스트 대비 정상.

- [ ] **Step 10: 커밋**

```bash
npx prettier --write src tests/e2e/visual.spec.ts
git add src tests/e2e/visual.spec.ts
git commit -m "feat: add scroll-driven dawn sky and transparent folded sections

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: 장면 전환 4개 — 히어로 sweep, Eclipse 숫자 전환, 셋리스트 runway, 고양 horizon

**Files:**
- Create: `src/scripts/home-motion.ts`
- Modify: `src/pages/index.astro` (script 태그)
- Modify: `src/components/home/HomeHero.astro` (`data-motion-scene-enter`, sweep 스타일)
- Modify: `src/components/home/SetlistPreview.astro` (`data-motion-scene-enter`, `--i`, runway 스타일)
- Modify: `src/components/home/GuideShortcuts.astro` (`data-motion-scene-enter`, horizon 스타일)
- Modify: `src/components/visual/EclipseCountdown.astro:60-70, 150-170, 스타일`
- Test: `tests/e2e/visual.spec.ts`

**Interfaces:**
- Produces: `html[data-motion-ready="true"]`(JS + no-preference일 때만), 섹션 `[data-motion-scene-enter]` → 진입 시 `data-motion-state="entered"`; `eclipse-countdown[data-reveal="pending"|"done"]`.

- [ ] **Step 1: 실패하는 e2e**

`tests/e2e/visual.spec.ts` 끝에:
```ts
test('plays each scene transition once and leaves nothing running afterwards', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-motion-ready', 'true');
  await expect(page.locator('[data-home-hero]')).toHaveAttribute(
    'data-motion-state',
    'entered',
  );
  await expect(page.locator('eclipse-countdown')).toHaveAttribute(
    'data-reveal',
    'done',
    { timeout: 5000 },
  );

  await page.locator('.setlist-preview').scrollIntoViewIfNeeded();
  await expect(page.locator('.setlist-preview')).toHaveAttribute(
    'data-motion-state',
    'entered',
  );
  await page.locator('.guide-shortcuts').scrollIntoViewIfNeeded();
  await expect(page.locator('.guide-shortcuts')).toHaveAttribute(
    'data-motion-state',
    'entered',
  );

  await page.waitForTimeout(900);
  const running = await page.evaluate(
    () =>
      document
        .getAnimations()
        .filter(
          (animation) =>
            animation.playState === 'running' &&
            !(animation.effect as KeyframeEffect | null)?.target?.classList.contains('dawn-sky'),
        ).length,
  );
  expect(running).toBe(0);
});

test('reduced motion never marks the document motion-ready', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForTimeout(500);
  await expect(page.locator('html')).not.toHaveAttribute('data-motion-ready', /.+/);
  await expect(page.locator('[data-primary]')).toBeVisible();
});
```

- [ ] **Step 2: 실패 확인**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm run build && PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npx playwright test tests/e2e/visual.spec.ts -g "scene transition|motion-ready"`
Expected: 첫 테스트 FAIL(`data-motion-ready` 없음), 둘째 PASS

- [ ] **Step 3: home-motion.ts**

`src/scripts/home-motion.ts`:
```ts
const scenes = document.querySelectorAll<HTMLElement>('[data-motion-scene-enter]');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduce && scenes.length > 0) {
  const { inView } = await import('motion');
  document.documentElement.dataset.motionReady = 'true';

  for (const scene of scenes) {
    const stop = inView(
      scene,
      () => {
        scene.dataset.motionState = 'entered';
        stop();
      },
      { amount: 0.35 },
    );
  }
}
```
`src/pages/index.astro` `</BaseLayout>` 직전(슬롯 내부)에 `<script src="../scripts/home-motion.ts"></script>`.

- [ ] **Step 4: 히어로 light sweep**

`HomeHero.astro` `<section class="home-hero" data-home-hero data-motion-scene-enter ...>`. `.home-hero__heading`에 `position: relative; overflow: hidden;` 추가 후:
```css
.home-hero__heading::after {
  position: absolute;
  inset: -20% -60%;
  background: linear-gradient(
    112deg,
    transparent 40%,
    color-mix(in srgb, var(--ivory) 22%, transparent) 50%,
    transparent 60%
  );
  content: '';
  opacity: 0;
  pointer-events: none;
}

:global(html[data-motion-ready]) .home-hero[data-motion-state='entered'] .home-hero__heading::after {
  animation: hero-light-sweep 620ms var(--ease-cinematic) both;
}

@keyframes hero-light-sweep {
  0% {
    opacity: 0;
    transform: translateX(-60%);
  }
  25% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(60%);
  }
}
```

- [ ] **Step 5: Eclipse 진입 숫자 전환**

`EclipseCountdown.astro` `connectedCallback` — `this.startEntrance();` 직전에 `this.dataset.reveal = 'pending';`. `animateEntrance()`의 `await this.entranceControls.finished;` 뒤:
```ts
if (!this.isConnected) return;
this.shadow.classList.remove('is-crossing');
void this.shadow.offsetWidth;
this.shadow.classList.add('is-crossing');
window.setTimeout(() => {
  this.dataset.reveal = 'done';
}, 220);
this.dataset.motionState = 'resting';
```
`animateEntrance()` 초반 `if (!moon || !fog || !this.isConnected) return;`를 `if (!moon || !fog || !this.isConnected) { this.dataset.reveal = 'done'; return; }`로. 스타일:
```css
eclipse-countdown[data-reveal='pending'] [data-primary] {
  opacity: 0;
}

[data-primary] {
  transition: opacity 180ms var(--ease-cinematic);
}
```
서버 마크업에는 `data-reveal`이 없으므로 no-JS·reduced-motion에서 숫자는 항상 보인다(reduced 경로는 `startEntrance` 전에 return).

- [ ] **Step 6: 셋리스트 runway / blue sweep**

`SetlistPreview.astro` `<section class="setlist-preview fold fold--reverse" data-motion-scene-enter ...>`. 곡 `li`에 인덱스: `previewEntries.map((entry, index) => (<li style={`--i: ${index}`}>{entry.data.songTitle}</li>))`. 스타일:
```css
.setlist-preview {
  overflow: hidden;
}

.setlist-preview::after {
  position: absolute;
  inset: 46% -30% auto;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--blue), transparent);
  content: '';
  opacity: 0;
  pointer-events: none;
}

.setlist-preview__list {
  perspective: 900px;
}

:global(html[data-motion-ready]) .setlist-preview:not([data-motion-state='entered']) .setlist-preview__list li {
  opacity: 0;
  transform: translateY(14px) rotateX(6deg);
}

:global(html[data-motion-ready]) .setlist-preview[data-motion-state='entered']::after {
  animation: runway-sweep 560ms var(--ease-cinematic) both;
}

:global(html[data-motion-ready]) .setlist-preview[data-motion-state='entered'] .setlist-preview__list li {
  animation: runway-rise 480ms var(--ease-cinematic) both;
  animation-delay: calc(var(--i, 0) * 30ms);
}

@keyframes runway-sweep {
  0% {
    opacity: 0;
    transform: translateX(-40%);
  }
  30% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(40%);
  }
}

@keyframes runway-rise {
  from {
    opacity: 0;
    transform: translateY(14px) rotateX(6deg);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
```

- [ ] **Step 7: 고양 arrival / horizon**

`GuideShortcuts.astro` `<section class="guide-shortcuts fold" data-motion-scene-enter ...>`. 링크 3개에 `style={`--i: ${index}`}`가 필요하므로 `nav` 내부 링크를 배열로:
```astro
<nav aria-label="고양 가이드 바로가기">
  {
    [
      ['/goyang/#transport', '가는 길'],
      ['/goyang/#packing', '준비물'],
      ['/goyang/#return', '귀가 확인'],
    ].map(([href, label], index) => (
      <a href={href} style={`--i: ${index}`}>
        {label} <span aria-hidden="true">→</span>
      </a>
    ))
  }
</nav>
```
스타일:
```css
.guide-shortcuts::after {
  position: absolute;
  inset: auto 0 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--amber), transparent);
  content: '';
  opacity: 0.35;
  transform-origin: left;
  pointer-events: none;
}

:global(html[data-motion-ready]) .guide-shortcuts:not([data-motion-state='entered']) nav a {
  opacity: 0;
  transform: translateY(10px);
}

:global(html[data-motion-ready]) .guide-shortcuts[data-motion-state='entered']::after {
  animation: horizon-draw 600ms var(--ease-cinematic) both;
}

:global(html[data-motion-ready]) .guide-shortcuts[data-motion-state='entered'] nav a {
  animation: runway-rise 420ms var(--ease-cinematic) both;
  animation-delay: calc(var(--i, 0) * 60ms + 120ms);
}

@keyframes horizon-draw {
  from {
    opacity: 1;
    transform: scaleX(0);
  }
  60% {
    opacity: 1;
  }
  to {
    opacity: 0.35;
    transform: scaleX(1);
  }
}

@keyframes runway-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
```
(Astro 스코프 스타일이라 같은 `@keyframes` 이름을 두 컴포넌트에서 써도 충돌하지 않는다.)

- [ ] **Step 8: 통과 확인**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm run check && PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm run build && PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npx playwright test`
Expected: 전부 PASS. 특히 `reduced motion does not load the deferred Motion chunk`(새 스크립트가 reduce에서 `import('motion')`을 호출하지 않음)와 `records 390 by 844 home ... layout-shift`(CLS < 0.1 — opacity/transform만 사용).

- [ ] **Step 9: 런타임 계측 확인**

`scratchpad/anim/probe.mjs`를 프로젝트 루트로 복사해 실행(포트 4323 preview). 판정: t<1.5s 안에 달·안개 → sweep → 숫자 reveal 순서, 이후 `runningAnimations` 0; 스크롤 중 `.dawn-sky` 외 애니메이션 0.

- [ ] **Step 10: 커밋**

```bash
npx prettier --write src tests/e2e/visual.spec.ts
git add src tests/e2e/visual.spec.ts
git commit -m "feat: add one-shot hero, eclipse, runway, and horizon transitions

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: 헤더 모바일 정리 + micro-interaction 3개

**Files:**
- Modify: `src/components/chrome/SiteHeader.astro:76-126`
- Modify: `src/components/setlist/SetlistExplorer.astro` (detail 펼침 애니메이션)
- Modify: `src/components/content/AlbumCover.astro` (hover)
- Test: `tests/e2e/navigation.spec.ts`

- [ ] **Step 1: 실패하는 e2e**

`tests/e2e/navigation.spec.ts` 끝에:
```ts
test('hides the mobile menu scrollbar and keeps the last item reachable', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'mobile only');
  await page.goto('/');

  const nav = page.getByRole('navigation', { name: '주요 메뉴' });
  const metrics = await nav.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      overflow: element.scrollWidth > element.clientWidth,
      scrollbarWidth: style.scrollbarWidth,
      snap: style.scrollSnapType,
    };
  });
  expect(metrics.overflow).toBe(true);
  expect(metrics.scrollbarWidth).toBe('none');
  expect(metrics.snap).toContain('x');

  const last = nav.getByRole('link', { name: '출처·업데이트' });
  await last.scrollIntoViewIfNeeded();
  const box = await last.boundingBox();
  const viewport = page.viewportSize()!;
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
});
```

- [ ] **Step 2: 실패 확인**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm run build && PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npx playwright test tests/e2e/navigation.spec.ts -g "scrollbar" --project=mobile-chromium`
Expected: FAIL — `scrollbarWidth` 'thin'

- [ ] **Step 3: 헤더 스타일**

`SiteHeader.astro` 76–79행 `nav` 블록 교체 및 추가:
```css
nav {
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
}

nav::-webkit-scrollbar {
  display: none;
}

.site-header__nav-list li {
  scroll-snap-align: start;
}
```
106–114행(hover/aria-current 그라데이션 배경) 교체:
```css
.site-header__nav-list a {
  position: relative;
}

.site-header__nav-list a::after {
  position: absolute;
  inset: auto 0.65rem 0.4rem;
  height: 2px;
  background: var(--amber);
  content: '';
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--motion-fast) var(--ease-cinematic);
}

.site-header__nav-list a:hover,
.site-header__nav-list a[aria-current='page'] {
  color: var(--ivory);
}

.site-header__nav-list a:hover::after,
.site-header__nav-list a:focus-visible::after,
.site-header__nav-list a[aria-current='page']::after {
  transform: scaleX(1);
}
```
`.site-header` 배경을 `color-mix(in srgb, var(--night) 70%, transparent)`로(하늘이 비침). 모바일 미디어 블록의 `nav`:
```css
nav {
  margin-inline: calc(var(--gutter) * -1);
  padding-inline: var(--gutter) 3rem;
  mask-image: linear-gradient(
    90deg,
    transparent,
    #000 var(--gutter),
    #000 calc(100% - 3rem),
    transparent
  );
}
```

- [ ] **Step 4: 셋리스트 펼침 micro-interaction**

`SetlistExplorer.astro` 스타일 추가:
```css
details[open] > .expected-setlist__detail {
  animation: detail-reveal 180ms var(--ease-cinematic) both;
}

@keyframes detail-reveal {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
```
(마커 회전은 Task 7에서 이미 `transition`으로 구현.)

- [ ] **Step 5: 커버 hover**

`AlbumCover.astro` 스타일 추가:
```css
@media (hover: hover) {
  .album-cover {
    transition:
      transform 160ms var(--ease-cinematic),
      box-shadow 160ms var(--ease-cinematic);
  }

  .album-cover:hover,
  .album-cover:focus-visible {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px color-mix(in srgb, var(--era-color) 70%, transparent);
  }
}
```

- [ ] **Step 6: 통과 확인**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm run build && PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npx playwright test`
Expected: 전부 PASS(`keeps navigation targets touch-sized in every viewport` 포함)

- [ ] **Step 7: 커밋**

```bash
npx prettier --write src tests/e2e/navigation.spec.ts
git add src tests/e2e/navigation.spec.ts
git commit -m "feat: tidy mobile menu overflow and add restrained micro-interactions

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: 최종 검증·핸드오프

**Files:**
- Modify: `docs/handoff-context.md`

- [ ] **Step 1: 전체 검증**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm run verify`
Expected: lint 0 errors, prettier clean, astro check 0 errors, 콘텐츠 감사 통과(albums 규칙 포함), 단위 테스트 전부 PASS, 빌드 7페이지, budget `js-gzip ≤ 75.0KiB`·raster 이전과 동일(739.0 KiB), e2e 전부 PASS(skip 3 유지 + Firefox skip 없음 — chromium만 실행).

- [ ] **Step 2: Wrangler dry-run**

Run: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npx wrangler deploy --dry-run 2>&1 | tail -5`
Expected: assets 개수 출력, binding 없음, 오류 없음.

- [ ] **Step 3: 4해상도 최종 스크린샷**

Task 6 Step 9 스크립트로 `/`, `/discover/`, `/setlist/`, `/goyang/`, `/sources/` × 375/390/572/1440 캡처 후 Read로 판정(spec §8 기준 전부).

- [ ] **Step 4: 핸드오프 갱신**

`docs/handoff-context.md`의 "진행 중 / 미완료", "다음 세션에서 할 일"을 실제 상태로 교체: 완료 항목, 남은 범위 외 항목(sources 좌측 여백, goyang 교통 도식, 티켓·포스터 썸네일, INDEX 메뉴), 커버 갱신 절차(`npm run covers:verify` / `covers:refresh`, 90일 감사).

- [ ] **Step 5: 커밋**

```bash
git add docs/handoff-context.md
git commit -m "docs: update handoff after visual fidelity pass

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Self-Review 기록

- Spec 커버리지: §0(Task 7), §1(Task 8), §2(Task 6), §3 전환 4개 + micro 3개(Task 9, 10), §4(Task 10), §5(Task 6/8/9 e2e + Task 11), §6(Task 1–5). 상위 §11 개정은 이미 커밋됨.
- 조정 3건은 "Spec 대비 조정"에 명시, 1건은 Task 1 Step 9에서 spec 본문 수정.
- 타입 일관성: `AlbumRecord`(contracts) ↔ `AlbumCover` props ↔ `findAlbumByTitle<T>` 제네릭; `captionLabel` 이름 countdown.ts ↔ EclipseCountdown; `data-motion-scene-enter`/`data-motion-state='entered'`/`data-motion-ready` 이름 home-motion.ts ↔ 세 컴포넌트 CSS ↔ e2e; `data-reveal` pending/done ↔ e2e.
