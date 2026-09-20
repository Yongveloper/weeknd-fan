# 영어판 지원 설계 — 2026-09-20

The Weeknd 고양 팬 가이드에 영어 로케일을 더한다. 대상 독자는 **방한 관람객**: 해외에 거주하며 2026-10-07/08 고양 공연을 보러 입국하는 팬이다. 한국어가 유일한 정본이며 영어는 그 파생이다.

## 범위

7개 라우트 전부와 공유 카드 도구까지 영어를 지원한다. 일본어는 이번 범위에 없다.

번역 대상 분량은 정본 한글 6,865자 — `setlist` 2,582, `guides` 2,486, `discover` 941, `sources` 818, `concert` 38 — 과 컴포넌트·페이지에 흩어진 UI 문자열 약 310줄이다. 영어로 옮기면 대략 2,300 단어가 된다.

### 하지 않는 것

- 정본 117개 데이터 파일은 수정하지 않는다.
- 새 폰트 패키지를 추가하지 않는다. `@fontsource-variable/noto-sans-kr`의 `latin` 슬라이스(25.4KB)가 영어 본문을 커버하고, 디스플레이용 Bebas Neue는 이미 라틴 전용이다.
- 브라우저 언어 자동 감지·자동 리다이렉트를 넣지 않는다.
- `wrangler.jsonc`에 `main`·SSR 어댑터·Functions를 추가하지 않는다. 정적 배포 제약은 그대로다.
- 기존 한국어 URL을 바꾸지 않는다.

### 별건으로 남기는 발견

`scripts/check-performance-budget.mjs`는 JS·raster·media만 계측한다. 현재 `dist`에 나가는 woff2 134개 3.4MB는 어느 예산에도 잡히지 않는다. 영어 추가는 `latin` 슬라이스 하나라 실질 증가가 없으므로 이번 범위에 넣지 않는다. 폰트를 실제로 늘리는 작업이 생길 때 함께 처리한다.

## 결정과 근거

### 한국어가 유일한 정본이다

영어 번역은 `sourceHash`를 들고 있다가 정본 산문이 바뀌면 stale로 판정되고, `audit:content`가 빌드를 세운다. 번역을 갱신하지 않으면 원문 변경도 배포되지 않는다.

이 사이트는 공연 정보의 정확성을 계약으로 강제한다. 번역본이 원문과 어긋나면 잘못된 게이트·시각·금지물품 정보를 퍼뜨리는 사고가 된다. 배포 차단이 그 사고보다 싸다.

### 번역은 오버레이 트리에 둔다

`src/data/`는 그대로 두고 `src/data/i18n/en/` 아래에 번역만 쌓는다. 정본 파일·스키마·`audit:content`가 무손상으로 남아 회귀 위험이 가장 작고, `sourceHash`를 번역 쪽에 붙이므로 stale 게이트가 자연스럽게 성립한다. 번역이 없는 항목은 한국어로 폴백하므로 단계적 출고도 가능하다.

대안이던 로케일 접미사 파일(`32-tips-entry.en.md`)은 `setlist`를 38에서 114 파일로 불린다. 완전 디렉터리 분리(`src/data/{ko,en}/`)는 117개 파일을 이동시켜 git history를 끊고 `reference('sources')`를 꼬이게 한다.

### 한국어는 접두사 없이 루트를 유지한다

`/goyang/`은 그대로 두고 영어를 `/en/goyang/`에 놓는다. 기존 URL과 이미 공유된 링크가 전부 보존된다.

### 언어 전환은 명시적 링크로만 한다

헤더에 KO/EN 링크를 두고 자동 감지는 하지 않는다. 정적 배포라 서버에서 Accept-Language 협상이 불가능하고, 클라이언트 리다이렉트는 뒤로가기 함정과 크롤러 색인 혼선을 만든다. 링크 방식은 JavaScript가 0바이트라 no-JS에서도 동작한다.

### 고유명사는 라틴으로 고정하고 한국어를 병기한다

아티스트·투어·곡명은 두 로케일 모두 `The Weeknd`, `After Hours Til Dawn`으로 쓴다. 장소와 역명은 번역명과 한글 원문을 함께 보여 준다 — `Goyang Stadium · 고양종합운동장`.

방한 관람객은 이 한글 문자열을 택시 기사에게 보여 주거나 카카오맵·네이버지도에 그대로 입력해야 한다. 완전 현지화는 읽기에는 자연스럽지만 현지에서 쓸 수 없다.

### 문장을 조립하지 않는다

`${artist} 콘서트 가이드` 같은 템플릿은 두지 않는다. 영어의 정관사("The Weeknd")와 한국어의 조사가 같은 자리에서 다르게 동작하므로, 조각을 이어 붙이면 어느 한쪽이 반드시 어색해진다. 로케일별 완성 문장만 사전에 저장하고, 보간은 숫자·날짜 같은 데이터 슬롯에만 허용한다. 영어 복수형은 `one`·`other` 두 변형을 사전에 직접 적는다.

## 구조

### 라우팅

```
src/pages/index.astro         → src/pages/[...locale]/index.astro
src/pages/goyang.astro        → src/pages/[...locale]/goyang.astro
src/pages/discover.astro      → src/pages/[...locale]/discover.astro
src/pages/setlist.astro       → src/pages/[...locale]/setlist.astro
src/pages/sources.astro       → src/pages/[...locale]/sources.astro
src/pages/share/ticket.astro  → src/pages/[...locale]/share/ticket.astro
src/pages/share/setlist.astro → src/pages/[...locale]/share/setlist.astro
```

```ts
// src/lib/i18n/routes.ts
export const localePaths = () =>
  [undefined, 'en'].map((locale) => ({ params: { locale } }));
```

라우트는 7개에서 14개가 된다.

`astro.config.mjs`에 `i18n: { defaultLocale: 'ko', locales: ['ko', 'en'], routing: { prefixDefaultLocale: false } }`를 선언한다. `Astro.currentLocale`을 쓰기 위한 것이며, `fallback`은 설정하지 않는다 — 설정하면 Astro가 리다이렉트를 끼워 넣어 동적 라우트와 겹친다.

이 조합이 이중 접두사를 만들지 않는지는 **구현 첫 작업에서 실제 빌드로 검증한다.** 어긋나면 `i18n` 블록을 빼고 자체 헬퍼만 쓰는 쪽으로 선회한다.

### 신규 모듈

```
src/lib/i18n/
  locales.ts        LOCALES, type Locale, DEFAULT_LOCALE, isLocale()
  routes.ts         localePaths(), localeHref(locale, path)
  proper-nouns.ts   고유명사 단일 출처
  ui/ko.ts  en.ts   타입 고정 UI 사전
  ui/index.ts       ui(locale)
  content/
    overlays.ts     JSON 번들 오버레이 로드 + zod 파싱
    merge.ts        정본 + 오버레이 병합
    hash.ts         translatableHash(entry)
```

`ko.ts`를 타입 원본으로 삼으면 `en.ts`의 키 누락을 `tsc`가 잡는다.

### 번역 오버레이

컬렉션마다 성격이 달라 두 가지 방식을 쓴다.

| 컬렉션 | 정본 | 번역 대상 | 방식 |
|---|---|---|---|
| `guides` | 11 `.md` | `title`, `summary`, 본문 | 파일별 `.md` 오버레이 |
| `discover` | 11 `.md` | `title`, `summary`, 본문 | 파일별 `.md` 오버레이 |
| `setlist` | 38 `.json` | `title`, `summary`, `liveNote`, `singAlongNote` | 로케일 번들 1개 |
| `concert` | 1 `.json` | `title`, `summary`, `venue`, `ageRestriction`, `dateLabel` | 로케일 번들 1개 |
| `sources` | 45 `.json` | `name` | 로케일 번들 1개 |
| `albums` | 10 `.json` | 없음 | 오버레이 없음 |

마크다운만 파일별인 이유는 `GuideSection.astro:15`와 `discover.astro:28`이 `render(entry)`를 쓰기 때문이다. 번역 본문도 `render()` 대상이 되려면 실제 컬렉션 엔트리여야 한다. JSON은 짧은 필드뿐이라 38개를 파일로 쪼갤 이유가 없다.

`albums`에는 한글이 없다. `kind`·`era`는 enum이고 라벨은 UI 사전이 담당한다.

```
src/data/                              ← 정본. 무수정.
src/data/i18n/en/
  guides/32-tips-entry.md
  discover/10-intro.md
  setlist.json
  concert.json
  sources.json
```

오버레이 `.md` frontmatter는 네 필드뿐이다.

```yaml
title: Entry
summary: Walking route, prohibited items and locker notes repeated across other shows.
sourceHash: 9f2c4a…
translatedAt: 2026-09-20
```

`status`·`lastVerifiedAt`·`sources`·`order`·`section`은 복제하지 않고 정본에서 가져온다. 신뢰 계약을 한 곳에만 두기 위해서다. 복제하면 어긋날 수 있고, 어긋나는 것 자체가 사고다.

JSON 번들은 정본 id를 키로 삼고 엔트리마다 해시를 들고 있다.

```jsonc
// src/data/i18n/en/setlist.json
{
  "01-take-my-breath": {
    "title": "…", "summary": "…", "liveNote": "…", "singAlongNote": "…",
    "sourceHash": "…", "translatedAt": "2026-09-20"
  }
}

// src/data/i18n/en/sources.json
{ "news-ohmynews-2025-04": { "name": "OhmyNews", "sourceHash": "…" } }

// src/data/i18n/en/concert.json — shows[]는 인덱스로 맞춘다
{
  "goyang-2026": {
    "title": "…", "summary": "…", "venue": "…", "ageRestriction": "…",
    "shows": [{ "dateLabel": "…" }, { "dateLabel": "…" }],
    "sourceHash": "…", "translatedAt": "2026-09-20"
  }
}
```

`concert.json`의 `shows` 배열은 길이가 정본과 같아야 하며(정본 스키마가 `.length(2)`로 고정), 불일치는 audit 실패다. `dateLabel` 외의 `shows` 필드는 시각 데이터라 오버레이에 두지 않는다.

`src/content.config.ts`에 컬렉션 두 개를 더한다.

```ts
guidesI18n:   glob({ base: './src/data/i18n', pattern: '*/guides/**/*.md' })
discoverI18n: glob({ base: './src/data/i18n', pattern: '*/discover/**/*.md' })
```

id가 `en/32-tips-entry` 형태가 되므로 로케일을 id에서 파싱한다. JSON 번들은 컬렉션으로 만들지 않고 `overlays.ts`에서 직접 import해 zod로 검증한다.

### 병합 지점

`src/lib/content/queries.ts`가 모든 페이지의 단일 관문이다. 기존 함수에 `locale` 인자를 더한다.

```ts
getGuideContent(locale) → Array<{
  entry,             // 정본. status·sources·lastVerifiedAt의 출처
  data,              // title·summary가 번역본으로 덮인 값
  renderEntry,       // 번역이 있으면 오버레이, 없으면 정본
  translated,        // false면 폴백 고지를 렌더
}>
```

`locale === 'ko'`면 오버레이 조회를 건너뛴다. 한국어 경로의 코드 경로가 현재와 사실상 같아지므로 회귀 위험을 여기서 끊는다.

### stale 게이트

해시 대상은 `title + summary + 본문`을 정규화한 sha256이다. `status`·`lastVerifiedAt`·`sources`는 제외한다.

이 저장소에서 가장 잦은 작업은 출처 날짜 갱신(`content: refresh Tokyo verification` 류)이다. 해시에 `lastCheckedAt`을 포함하면 날짜만 고쳐도 번역 전체가 stale로 떨어져 게이트가 의미를 잃는다. 산문이 실제로 바뀔 때만 걸리게 한다.

```
npm run i18n:status     엔트리별 ok | missing | stale
npm run i18n:hash <id>  번역 갱신 후 기입할 새 해시
```

`audit:content`에 규칙 네 개를 더한다.

1. **stale** — 오버레이 `sourceHash`가 현재 정본 해시와 다르면 실패.
2. **URL 패리티** — 번역 본문의 URL 집합이 정본과 다르면 실패. 정본은 문장마다 `— [오마이뉴스, 2025-04](https://…)` 형태로 출처를 단다. 번역하다 링크를 흘리면 근거 없는 주장이 된다.
3. **고아 오버레이** — 정본에 없는 id의 오버레이가 있으면 실패.
4. **금지 표기** — `expected` 항목은 로케일별 "예상 · 보장 아님" 등가 문구를, `unpublished` 항목은 "미공개 · 확인 필요" 등가 문구를 반드시 렌더한다.

`src/lib/content/contracts.ts:14-21`의 `STATUS_LABELS`를 로케일 맵으로 바꾼다. `tests/unit/content-audit.test.ts`는 현재 한국어 문자열을 직접 단언하므로 로케일 맵 기준으로 확장한다.

### 폴백

번역이 없는 항목은 정본으로 렌더하고 블록 위에 고지를 단다.

> **This section is shown in Korean.** The Korean text is the source of record.

stale은 빌드를 세우므로 사용자에게 노출되지 않는다. 배포된 사이트에 stale 번역이 떠 있는 상태는 존재할 수 없다.

### SEO

`src/layouts/BaseLayout.astro`에서 `lang="ko"` 하드코딩(47행)을 걷어내고 로케일을 받는다. 페이지마다 canonical, `hreflang="ko"`, `hreflang="en"`, `hreflang="x-default"`(한국어 루트)를 낸다. `og:locale`과 `og:locale:alternate`도 함께 낸다.

`buildEventJsonLd()`에 `inLanguage`를 더하고 `name`·`description`을 로케일화한다. `location.name`은 라틴과 한글을 병기한 형태를 유지한다.

`astro.config.mjs`의 사이트맵에 `i18n: { defaultLocale: 'ko', locales: { ko: 'ko-KR', en: 'en' } }`를 준다. 언어 대체 링크가 자동 생성된다.

### 공유 카드

카드 그림 자체는 두 로케일에서 픽셀이 같다.

- `buildSetlistCardLayout.ts`는 텍스트가 없다. 승인된 포스터 이미지 한 장뿐이고 아트워크라 재조판하지 않는다.
- `cardDesign.ts`의 텍스트는 `GOYANG / 2026`, `THE WEEKND`, `AFTER HOURS`, `TIL DAWN`, `UNOFFICIAL FAN GUIDE`, 워드마크로 전부 라틴이다. 라틴 고정 규칙에 따라 그대로 둔다.
- 티켓 아트워크는 사용자 제공 승인본이라 원본 그대로 유지한다.

번역 대상은 네 곳이다.

1. `buildTicketLayout.ts:69`의 `'곡을 선택해 주세요'` 플레이스홀더.
2. `canvas.ts`의 에러 메시지 세 개(17, 61, 208행).
3. `TicketBuilder.astro`와 `SetlistCardBuilder.astro`의 폼 UI 66줄.
4. D-day·날짜 문자열의 로케일 포맷.

`canvas.ts`와 `buildTicketLayout.ts`는 클라이언트 번들이다. 사전을 import하지 않고 문자열을 인자로 주입받게 시그니처를 바꾼다. 사전 두 벌이 번들에 들어가면 JS 75KiB 예산에 직접 부딪힌다.

`canvas.ts:26-33`이 이미 `font`별로 쓰인 글자를 모아 `document.fonts.load(font, text)`를 호출하므로 글리프 로딩에는 손댈 것이 없다.

### 날짜와 카운트다운

`src/lib/countdown.ts`는 고정 UTC+9라 그대로 둔다. 로케일 날짜 문자열은 빌드 타임에만 생성한다. 클라이언트에서 `Intl.DateTimeFormat`을 `timeZone`과 함께 만들면 첫 생성이 20~60ms라 홈 long task 50ms 예산이 깨진다.

`src/scripts/disclosure.ts`와 `reveal.ts`에 한글 리터럴이 있으면 `data-*` 속성으로 주입받게 바꾼다. 같은 이유다.

### 헤더 폰트

`src/components/chrome/navigation.ts`의 `chromeText`가 `scripts/build-header-font-subsets.mjs`의 입력이다. 두 로케일 메뉴 라벨의 합집합으로 바꾸고 `npm run fonts:header`를 다시 돌려 결과를 커밋한다. 영어 라벨은 라틴이라 기존 `latin` 슬라이스 범위 안이다. `tests/unit/header-fonts.test.ts`를 합집합 기준으로 갱신한다.

### 성능 예산 스크립트

`scripts/check-performance-budget.mjs`가 페이지 7개에서 14개를 보게 한다. `/en/` 접두사 경로를 대응하는 원본 페이지 예산(home 700KiB, other 400KiB)에 매핑한다. `tests/unit/performance-budget.test.ts` fixture도 함께 갱신한다.

## 번역 생산 규칙

기계가 검사할 수 없는 부분이라 규칙으로 못 박고 `docs/content-update-runbook.md`에 넣는다.

- **번역 중 정보를 더하거나 보정하지 않는다.** 정본이 "미공개"면 번역도 미공개다. 번역자가 아는 사실을 채워 넣는 것이 이 사이트가 막으려는 사고 그 자체다.
- **불확실성의 강도를 보존한다.** "~로 보입니다"를 "is"로 옮기지 않는다. 추정은 추정으로 남긴다.
- 초안 생성 후 사람이 검수한다. 검수하지 않은 번역은 커밋하지 않는다.
- 고유명사는 `src/lib/i18n/proper-nouns.ts`만 사용한다. 번역문에 직접 적지 않는다.
- 커밋 형식은 `content(i18n): translate goyang transport section into en`.

정본 산문을 고쳤을 때의 절차: `npm run i18n:status`로 stale 확인 → 번역 갱신 → `npm run i18n:hash <id>`로 해시 재기입 → `npm run verify`.

공연 임박 시 긴급 정정이 필요한데 번역이 준비되지 않았다면, 해당 오버레이 파일을 **삭제한다.** 한국어 폴백과 고지로 즉시 배포할 수 있다.

## 테스트

`playwright.config.ts`는 `workers: 1`에 프로젝트 두 개(desktop/mobile)다. 전체를 두 배로 돌리면 CI 시간이 두 배가 되므로 선별한다.

| 스펙 | 로케일 |
|---|---|
| 기존 13개 (`navigation`, `share`, `goyang`, `disclosure`, `motion`, `dawn-sky`, 구름 계열 등) | ko만 |
| 신규 `tests/e2e/i18n.spec.ts` | ko/en |
| `critical-path.spec.ts` | ko/en |
| `no-js.spec.ts` | 전환기 케이스 추가 |
| 320px + 200% 텍스트 확대 가로 넘침 매트릭스 | ko/en |
| `visual.spec.ts` 시각 회귀 | ko만 |

가로 넘침을 두 로케일 모두 도는 이유는 영어가 한국어보다 단어가 길고 끊을 자리가 적기 때문이다. 좁은 컬럼에서 라벨이 넘칠 가능성이 이번 작업의 최대 시각 위험이다.

기존 스펙의 한글 리터럴 316줄은 텍스트 직접 단언 대신 `getByRole`과 사전 import로 바꾼다. 그래야 앞으로 카피를 고쳐도 테스트가 깨지지 않는다.

단위 테스트를 더한다.

- `i18n-dictionary.test.ts` — ko/en 키 집합 일치, 빈 문자열 없음.
- `hreflang.test.ts` — 14개 라우트 전부 대체 링크 세 개.
- `content-audit.test.ts` — stale·URL 패리티·고아 오버레이·금지 표기.

## 단계

### 1단계 — 인프라

끝나면 `/en/goyang/`이 한국어 본문으로 뜬다. UI·라우팅·SEO가 두 언어가 되고 콘텐츠는 아직 한국어다. 배포 가능한 상태다.

라우팅 전환, UI 사전(컴포넌트 244줄 + 공유 빌더 66줄), `STATUS_LABELS` 로케일화, 언어 전환기, `lang`·canonical·hreflang·사이트맵, 클라이언트 모듈 문자열 주입, 헤더 폰트 서브셋, 예산 스크립트 경로 대응.

검증 기준:

1. `npm run build`가 14개 라우트를 내고 이중 접두사가 없다.
2. `/`와 `/en/`의 `<html lang>`이 정확하고 hreflang 세 개가 붙는다.
3. `PUBLIC_SITE_URL=https://fan-guide.test npm run build` 후 `dist/sitemap-0.xml`에 14 URL과 언어 대체 링크가 있다.
4. 전환기가 JavaScript 없이 동작한다.
5. `npm run verify`가 통과한다.

신규 파일 약 10개, 수정 약 45개.

### 2단계 — 콘텐츠 번역

오버레이 컬렉션, 병합 레이어, `sourceHash` 게이트, audit 규칙 네 개, 폴백 고지, 영어 번역문 작성과 검수.

검증 기준:

1. `npm run i18n:status`가 stale 0, missing 0을 낸다.
2. 정본 산문 한 줄을 고치면 `npm run audit:content`가 **실패하고** 해당 id를 지목한다.
3. 출처 `lastCheckedAt`만 고치면 `audit:content`가 **통과한다**.
4. 번역 본문에서 링크를 하나 지우면 URL 패리티가 실패한다.
5. 오버레이 하나를 지우면 해당 페이지가 한국어와 폴백 고지로 렌더된다.
6. `/`와 `/en/` 셋리스트 페이지 모두 "예상 · 보장 아님" 등가 문구를 노출한다.
7. 두 로케일 전 라우트에서 320px·200% 확대 시 가로 넘침이 없다.
8. `npm run verify`가 통과한다.
9. `npx wrangler deploy --dry-run`이 통과한다. 실제 배포는 하지 않는다.

신규 파일 25개(번역문) + 코드 약 6개, 수정 약 12개. 노동의 대부분이 번역 작성과 검수다.

## 위험

**Astro `i18n` 설정과 `[...locale]` 동적 라우트의 조합.** 이중 접두사가 생길 가능성이 있다. 1단계 첫 작업에서 실제 빌드로 검증하고, 어긋나면 `i18n` 블록을 빼고 자체 헬퍼만 쓴다.

**번역 품질은 기계가 잡지 못한다.** 해시와 URL 패리티는 누락을 잡지 왜곡을 잡지 않는다. 사람 검수가 유일한 방어선이며, 번역 생산 규칙이 실질 안전장치다.

**운영 부담은 지속된다.** 공연이 가까워질수록 정본이 자주 바뀌고 stale 게이트가 매번 번역 갱신을 강제한다. 이것은 설계 의도이자 비용이다. 긴급 상황의 우회로는 오버레이 삭제다.

**CI 시간이 늘어난다.** 선별 매트릭스로 억제하지만 증가는 불가피하다. 2단계에서 실측해 과도하면 시각 회귀를 데스크톱 한국어만으로 더 줄인다.
