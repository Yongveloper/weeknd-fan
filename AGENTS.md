# AGENTS.md — The Weeknd 고양 팬 가이드: 새 에디션

The Weeknd 2026-10-07/08 고양종합운동장 공연의 **비공식·비영리 정적 팬 가이드**. Astro 6 (`output: 'static'`) → Cloudflare Workers Static Assets(`dist/`만). 콘텐츠는 한국어, 코드·커밋은 영어.

## 명령

Node **22.14.0** (CI 동일). 최초 1회 `npm ci && npx playwright install chromium`.

```bash
npm run dev                                   # http://localhost:4321
npm run verify:core                           # CI와 동일한 체인 (아래 순서)
#  lint → format:check → check → test:unit → audit:translations → build → budget → check:dist
npm run verify                                # verify:core + audit:content 전체 + test:e2e (로컬 전용)
PUBLIC_SITE_URL=https://fan-guide.test npm run build   # sitemap/canonical/OG 포함 빌드
npm run test:unit                             # vitest (content-audit 제외)
npm run audit:content                         # 콘텐츠 신뢰 계약 감사 — 날짜 민감
npm run test:e2e                              # playwright; preview 서버 자동 기동, desktop+mobile chromium, workers:1
npx playwright test tests/e2e/goyang.spec.ts --project=desktop-chromium   # 단일 스펙
npm run budget                                # 반드시 build 후. 예산 초과 시 실패
node scripts/build-compact-moon-video.mjs        # 720px 히어로 비디오 재인코딩 (ffmpeg). 원본 mp4 변경 시 1회
npm run fonts:header                             # 헤더 폰트 서브셋 재생성. src/components/chrome/navigation.ts 변경 시 필수
npx wrangler deploy --dry-run                 # 구성 + dist 검증, 게시 안 함
npx prettier --write .                        # format:check가 verify에 포함됨
```

- `npm run deploy`는 **실제 프로덕션 게시**. 에이전트는 실행하지 않는다. dry-run만.
- `PUBLIC_SITE_URL`: 절대 HTTP(S) URL이 아니면 빌드 실패, 없으면 sitemap 미생성. 로컬·CI는 `https://fan-guide.test`.

## 구조

```
src/pages/          라우트: / /discover/ /setlist/ /goyang/ /sources/ /share/ticket/ /share/setlist/
src/components/     chrome content discover guide home setlist share ui visual
src/data/           콘텐츠 원본 — albums/ archive/ concert/ discover/ guides/(번호 prefix .md) setlist/ sources/
src/content.config.ts   컬렉션 스키마
src/lib/content/    audit.ts(audit:content 기준) contracts.ts queries.ts albums.ts
src/lib/{seo,share}/, src/lib/countdown.ts
src/scripts/        클라이언트 TS — disclosure.ts, reveal.ts
src/styles/         tokens.css → global.css → motion.css
scripts/*.mjs       check-performance-budget, assert-production-origin, refresh-album-covers, build-space-assets
tests/unit/         vitest        tests/e2e/   playwright (axe a11y, no-JS, 내비·공유·고양 계약, 성능 evidence)
public/_headers     → dist/_headers 보안·캐시 헤더
docs/content-update-runbook.md   콘텐츠 갱신·아카이브 게이트·배포 절차 — 콘텐츠 건드리기 전 읽기
```

## 불변 규칙

- `wrangler.jsonc`: `assets.directory: "./dist"`, `run_worker_first: false`만. `main`, SSR 어댑터, Functions, assets binding **추가 금지**. `tests/unit/static-delivery-config.test.ts`가 검사.
- 공식 미발표 운영 정보(게이트·반입금지·셔틀·Early Entry 등)는 게시하지 않고 `unpublished` / `미공개 · 확인 필요` 유지.
- 예상 셋리스트는 페이지와 공유 카드 모두 `예상 · 보장 아님` 표기 유지.
- 출처 `lastCheckedAt`과 콘텐츠 `lastVerifiedAt`은 실제 확인 날짜로 **함께** 갱신. 날짜 기준 `Asia/Seoul`.
- `src/data/concert/goyang-2026.json`의 `archivePublished`는 `archive/goyang-2026-10-07.json`·`-08.json` 둘 다 존재 + audit 통과 전 `true` 금지.
- 사용자가 제공한 이미지(Interpark 좌석도, 지도)는 **원본 그대로** 사용. 재드로잉·범례 재구성·재인코딩 금지. 지도 임베드는 클릭 없이 로드.

## 함정

- 성능 예산(`scripts/check-performance-budget.mjs`): JS 75KiB gzip, raster 합계 1300KiB, 홈 700KiB, 기타 페이지 400KiB. Spotify 핫링크 커버는 제외. 예산 수치를 바꾸면 `tests/unit/performance-budget.test.ts` fixture도 같이 갱신.
- 앨범 커버는 `src/data/albums/*.json` 직접 편집 대신 `npm run covers:refresh` / `covers:verify`.
- 홈 배경(eclipse·starfield)은 `node scripts/build-space-assets.mjs`로 생성(sharp, seeded PRNG → 결정적). 손편집 금지.
- `<details>` 애니메이션: Chromium은 닫힌 details 내용을 `content-visibility: hidden`으로 감춰 `getBoundingClientRect().height`가 stale 값 반환. `src/scripts/disclosure.ts`의 `details.open ? rect.height : 0` 패턴 유지. 디스클로저를 grid `auto` 열에 두면 열릴 때 layout shift.
- tsconfig `strict` + `noUncheckedIndexedAccess`. 배열 인덱스 접근은 `undefined` 처리 필요.
- e2e는 `baseURL` 사용(`http://127.0.0.1:4321` 하드코딩 금지).
- Astro image: `layout: 'constrained'`, `responsiveStyles: true` 전역. `<picture>`는 AVIF 우선.
- 홈 long task 예산 50ms(`tests/e2e/performance.spec.ts` 모바일 evidence). `Intl.DateTimeFormat`에 `timeZone` 주면 첫 생성이 20~60ms — 클라이언트 번들에서 쓰지 않는다(`src/lib/countdown.ts`는 고정 UTC+9). Noto Sans KR은 `astro.config.mjs` Vite 플러그인이 `font-display: optional`로 바꿔 swap 재레이아웃 제거 — 첫 방문은 시스템 한글 폰트로 렌더될 수 있음.
- 히어로 비디오: `src/lib/media-policy.ts`가 `saveData`·`effectiveType`(slow-2g/2g/3g) → 포스터, `≤42rem` → `-720.mp4`, 그 외 원본을 선택. 예산 스크립트가 mp4 합계 13MiB, `-720` 합계 3MiB를 검사한다. 원본 mp4를 바꾸면 `node scripts/build-compact-moon-video.mjs`를 다시 돌린다.
- 헤더 폰트는 `src/assets/fonts/header/`의 서브셋을 preload한다. `navigation.ts`의 워드마크·메뉴 문구를 바꾸면 `npm run fonts:header`를 실행하고 결과를 커밋한다 — `tests/unit/header-fonts.test.ts`가 manifest와 `chromeText` 불일치를 실패로 잡는다.

## 커밋

Conventional Commits, 영어 소문자 subject ≤ 72자. 스코프는 디렉터리/페이지명.

```
feat(goyang): show the live map without a click
fix(e2e): use project baseURL in the no-JS setlist test
test(budget): raise the aggregate raster fixture to the new 1300KiB ceiling
content: refresh Tokyo verification      # 콘텐츠 갱신 전용 형식 (runbook 참조)
```

커밋 전 `npm run verify:core` 통과 — CI가 도는 것과 같다. e2e는 CI에서 돌지 않으니 UI를 건드렸으면 `npm run test:e2e`를 따로 돌린다. `docs/handoff-context.md`, `.superpowers/`, `.worktrees/`, `tmp/`, `.playwright-mcp/`는 gitignore/로컬 — 커밋하지 않는다.

## 새 에디션 작업 경계

이 폴더는 기존 ../weeknd-fan과 분리된 새 웹이다. 기존 폴더는 수정하지 않는다. 이 버전의 dev/preview/test 포트는 4323이며 원본은 4321이다. 디자인의 최신 기준은 docs/new-edition-design.md 및 src/styles/edition.css이다. 기존 콘텐츠·라벨·정보·기능 변경은 사용자에게 구체적인 변경안과 이유를 제시하고 승인을 받은 뒤 진행한다.
