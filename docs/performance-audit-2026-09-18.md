# 성능 감사 — 2026-09-18

기준 커밋 `e06a4ab` (main). `PUBLIC_SITE_URL=https://fan-guide.test npm run build` 후 `astro preview --port 4323` 대상으로 chrome-devtools MCP 트레이스·Lighthouse·정적 분석을 수행했다. 개선 착수 전 현황 기록이며, 코드 변경은 없다.

## 1. 측정 조건

| 항목              | 값                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 빌드              | Astro 6 static, `dist/` 7페이지                                                                                                             |
| 서버              | `astro preview` — **HTTP/1.1, `Cache-Control: no-cache`**                                                                                   |
| 모바일 프로파일   | 390×844, DPR 3, touch, CPU 4x, Slow 4G                                                                                                      |
| 데스크톱 프로파일 | 1440×900, DPR 1, 무제한                                                                                                                     |
| 도구              | `performance_start_trace`(reload, autoStop), `lighthouse_audit`(mobile, navigation), `evaluate_script`로 리소스·롱태스크·스크롤 프레임 계측 |

주의: preview는 HTTP/1.1 연결 6개 제한과 무캐시 환경이므로 LCP 절대값은 Cloudflare(H2/H3, immutable 캐시)보다 크게 나온다. 병목 순위와 원인 분석은 그대로 유효하지만, 수치는 상대 비교용으로만 쓴다.

## 2. 측정 결과

### 2.1 Core Web Vitals (lab)

| 페이지      | 프로파일 | LCP     | LCP 요소                    | CLS                | 렌더 블로킹 절감 추정(FCP) |
| ----------- | -------- | ------- | --------------------------- | ------------------ | -------------------------- |
| `/`         | 모바일   | 2,433ms | `golden-cloud-bank-v3.webp` | 0.00               | 1,126ms                    |
| `/goyang/`  | 모바일   | 2,407ms | 동일                        | 0.0005 (폰트 스왑) | 1,119ms                    |
| `/setlist/` | 모바일   | 2,345ms | 동일                        | 0.00               | 1,111ms                    |
| `/`         | 데스크톱 | 151ms   | —                           | 0.00               | 0                          |

홈 모바일 LCP 분해: TTFB 4ms · 로드 지연 610ms · **로드 시간 1,788ms** · 렌더 지연 31ms. 이미지 자체 다운로드는 0.6ms이고 나머지는 큐 대기(614ms 큐잉 → 1,818ms 전송 시작). 폰트 preload 7개 + CSS 2개가 먼저 연결을 점유한 결과.

### 2.2 메인 스레드

| 항목                                 | 값                                                              |
| ------------------------------------ | --------------------------------------------------------------- |
| 홈 모바일 롱태스크                   | 1건, 477ms 시점, **54ms** (AGENTS.md 홈 예산 50ms)              |
| 홈 데스크톱 롱태스크                 | 없음                                                            |
| 홈 모바일 스크롤 4,000px 합성 스크롤 | 프레임 p95 9ms, 롱태스크 없음                                   |
| DOM                                  | 홈 275 노드, 깊이 11, 최대 자식 32 (`ol.setlist-preview__list`) |
| 최대 레이아웃                        | 214ms (4x CPU), 287/373 노드                                    |

스크롤 중 `dawn-sky-renderer` 프레임 비용은 문제 없음. 강제 동기 레이아웃(읽기→쓰기→읽기) 패턴은 소스에서 발견되지 않았다.

### 2.3 Lighthouse (모바일, 홈)

| 카테고리       | 점수 |
| -------------- | ---- |
| Accessibility  | 100  |
| Best Practices | 96   |
| SEO            | 100  |

실패 감사 2건:

- `image-aspect-ratio` — `dawn-sky__still img`, `dawn-sky__reading-still img`. 원본 1536×1024가 948×700으로 렌더.
- `label-content-name-mismatch` — `a.site-header__wordmark`의 `aria-label`("INTO:DAWN · The Weeknd 고양 팬 가이드 홈")이 표시 텍스트와 불일치.

### 2.4 전송량 (홈, 데스크톱, 캐시 없음)

| 종류                          | 요청 수 | 인코딩 바이트  |
| ----------------------------- | ------- | -------------- |
| 비디오 (`intro.mp4`)          | 1       | **5,866,428**  |
| 폰트 (preload 7 + CSS 발견 7) | 14      | ~230,000       |
| 이미지                        | 5       | 139,364        |
| CSS                           | 2       | ~42,000 (gzip) |
| JS                            | 6       | 26,256 (gzip)  |
| 비디오 제외 합계              | —       | ~130KB         |

`intro.mp4`는 모바일 프로파일에서도 다운로드 확인(5.87MB, 2.8초). 재생 20초 후 `loop.mp4` 3.75MB 추가 로드 (`src/scripts/moon-light.ts` `timeupdate` 핸들러).

### 2.5 성능 예산 (`npm run budget`)

| 버킷               | 사용/예산           | 여유        |
| ------------------ | ------------------- | ----------- |
| JS gzip 합계       | 74.0 / 75.0 KiB     | **1.0 KiB** |
| raster 합계        | 1,221.6 / 1,300 KiB | 78.4 KiB    |
| `/`                | 70.5 / 700 KiB      | 충분        |
| `/goyang/`         | 114.3 / 400 KiB     | 충분        |
| download-originals | 6,541.6 / 8,192 KiB | 별도 버킷   |

예산 스크립트는 `avif|webp|png|jpe?g`만 집계한다 (`scripts/check-performance-budget.mjs:210`). **mp4는 어떤 예산에도 포함되지 않는다.**

## 3. 리소스 구성 분석

### JS

| 청크                                        | gzip    | 로드 페이지                                | 로드 방식                                                             |
| ------------------------------------------- | ------- | ------------------------------------------ | --------------------------------------------------------------------- |
| `leaflet-src`                               | 43.4KB  | `/goyang/`                                 | `venue-map.ts` IntersectionObserver 뒤 동적 import — 초기 로드 미포함 |
| `dawn-sky-renderer`                         | 19.7KB  | `/`, `/discover/`, `/goyang/`, `/setlist/` | `dawn-sky.ts:70` 동적 import, reduced-motion 시 생략                  |
| 기타 (SiteHeader, MoonLight, Disclosure 등) | 각 <4KB | 페이지별                                   | 정적                                                                  |

### CSS

- `BaseLayout.*.css` 116KB raw / 32KB gzip — 전 페이지 공통, 렌더 블로킹. 대부분 `@fontsource-variable/noto-sans-kr` 124개 slice `@font-face` 선언.
- 페이지 CSS(`index`, `goyang` 등) 각 5~10KB gzip, 렌더 블로킹.
- `index.html`에 인라인 `<style>` 5.2KB. 인라인 `<script>` 0.

### 폰트

- `dist/_astro/*.woff2` 127개, 3.56MB. 실제 페이지당 로드 14–20개(230–300KB).
- 헤더 전용 패밀리 `Noto Sans KR Header`(6 slice) + `Bebas Neue Header`(1)를 `<link rel="preload">`, `font-display: block`. 생성 로직 `src/lib/fonts/headerFontAssets.ts`.
- 본문 `Noto Sans KR Variable`은 `astro.config.mjs:33-44` Vite 플러그인이 `font-display: optional`로 패치. 홈 롱태스크 예산을 위한 의도적 설계 (AGENTS.md).

### 이미지

- LCP 요소는 4개 페이지 모두 `/visual/atmosphere/golden-cloud-bank-v3.webp` (67KB, 1536×1024, srcset 없음).
- 홈은 같은 이미지를 `<img>` 2개(`dawn-sky__still`, `dawn-sky__reading-still`)로 렌더. `DawnSky.astro:24,36`. `readingOnly=true` 페이지는 `fetchpriority="auto"` (`DawnSky.astro:25`) → LCPDiscovery 감사 FAIL.
- Spotify 커버 hotlink: 홈 3개, `/discover/` 22개, 모두 `loading="lazy"`. preconnect 없음.
- `dist/visual/moon-v8/intro.mp4` 5.87MB, `loop.mp4` 3.75MB. `dist/downloads/*-original.png` 3.5MB + 3.2MB (다운로드 전용).

### 비디오 로드 조건 (`src/scripts/moon-light.ts`)

`connectedCallback`의 IntersectionObserver가 hero 노출 시 `start()` 호출. `start()`는 `document.hidden`, `visible`, `prefers-reduced-motion`, `isConnected`만 검사한 뒤 `load(intro)`로 `source.src` 설정 + `preload='auto'` + `video.load()`. 네트워크 상태(`saveData`, `effectiveType`), 뷰포트 폭, 배터리 조건 없음.

### 캐시 헤더 (`public/_headers`)

- `/_astro/*` → `public, max-age=31536000, immutable`.
- `/*` → 보안 헤더만. HTML과 `/visual/*`, `/downloads/*`에는 명시적 `Cache-Control` 없음.

## 4. 개선 우선순위

| 순위   | 항목                                                  | 영향                              | 파일                                                                                                                   | 조치안                                                                                                                       |
| ------ | ----------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **P0** | 홈 비디오 9.6MB 무조건 다운로드                       | 모바일 데이터·배터리, 대역폭 경쟁 | `src/scripts/moon-light.ts` `start()`, `src/components/visual/MoonLight.astro`, `scripts/check-performance-budget.mjs` | `saveData`/`effectiveType` 게이트, 모바일용 저해상도 mp4(≤1.5MB) 분기, 예산 스크립트에 media 버킷 추가                       |
| **P1** | LCP 이미지 큐 대기 + 서브 페이지 `fetchpriority=auto` | LCP 전 페이지                     | `src/components/visual/DawnSky.astro:24-40`                                                                            | readingOnly에도 `fetchpriority="high"`, `<link rel="preload" as="image">`, 홈 중복 `<img>` 1개 제거 또는 CSS background 전환 |
| **P1** | 렌더 블로킹 CSS 148KB raw                             | FCP ~1.1s (Slow 4G)               | `src/layouts/BaseLayout.astro:2-3`, `astro.config.mjs`                                                                 | 폰트 `@font-face` CSS를 non-blocking 분리, `build.inlineStylesheets` 검토                                                    |
| **P2** | 헤더 폰트 preload 6개 slice                           | LCP 대역폭 경쟁                   | `src/lib/fonts/headerFontAssets.ts`                                                                                    | 실제 사용 글리프 subset 1파일로 병합                                                                                         |
| **P2** | JS 예산 여유 1KiB                                     | 추가 개발 차단                    | `src/scripts/dawn-sky-renderer.ts`, `DawnSky.astro`                                                                    | renderer를 홈 전용으로 축소, 서브 페이지는 정지 이미지                                                                       |
| **P3** | 홈 모바일 롱태스크 54ms                               | 저사양 실기기 INP                 | `src/styles/eclipse-impact.css:31-51`, `src/scripts/dawn-sky.ts`                                                       | `filter: blur()` 키프레임을 opacity/clip-path로, renderer 초기화 idle 분할                                                   |
| **P3** | Lighthouse `image-aspect-ratio`                       | Best Practices                    | `DawnSky.astro` 스타일                                                                                                 | `object-fit: cover` 또는 `aspect-ratio`                                                                                      |
| **P3** | Lighthouse `label-content-name-mismatch`              | 접근성                            | `src/components/chrome/SiteHeader.astro` 워드마크                                                                      | `aria-label` 제거, 시각적 숨김 텍스트로 대체                                                                                 |
| **P3** | Spotify CDN preconnect 없음                           | lazy라 영향 작음                  | `BaseLayout.astro`                                                                                                     | `<link rel="preconnect" href="https://image-cdn-ak.spotifycdn.com">`                                                         |

P0·P1은 비주얼 동작(비디오 재생 조건, 배경 레이어 구성) 변경을 포함한다. AGENTS.md 새 에디션 규칙에 따라 구체 변경안과 이유를 제시하고 승인 후 진행한다.

## 5. 정상 확인 항목

- CLS 0 (모든 페이지). 폰트 스왑 shift 0.0005는 무시 수준.
- 데스크톱 LCP 151ms.
- 스크롤 프레임 p95 9ms(4x CPU), 스크롤 롱태스크 없음.
- Leaflet, dawn-sky-renderer 동적 import로 초기 로드에서 격리.
- `/_astro/*` immutable 캐시.
- Spotify 커버 전부 lazy.
- 강제 동기 레이아웃 패턴 없음 (`disclosure.ts:167`, `dawn-sky.ts:30`은 단일 읽기 후 쓰기).

## 6. 재측정 방법

```bash
PUBLIC_SITE_URL=https://fan-guide.test npm run build
npx astro preview --port 4323 --host 127.0.0.1
```

chrome-devtools MCP에서 `emulate`(`390x844x3,mobile,touch`, `cpuThrottlingRate: 4`, `networkConditions: "Slow 4G"`) → `navigate_page` → `performance_start_trace(reload: true)`. 비디오 다운로드 여부는 `list_network_requests(resourceTypes: ["media"])` 또는 `performance.getEntriesByType('resource')`에서 `.mp4` 필터로 확인.

개선 후 비교 지표: 홈 모바일 LCP, 홈 mp4 전송 바이트, `npm run budget` JS 여유, Lighthouse 실패 감사 수, 홈 모바일 롱태스크 최대치.

## 7. 개선 후 재측정 — 2026-09-19 (커밋 `2a7d5e1`)

계획 `docs/superpowers/plans/2026-09-19-performance-improvements.md`의 4개 트랙(히어로 비디오 정책, LCP 텍스처 preload·`fetchpriority`, 헤더 폰트 서브셋, 렌더러 부트 지연)을 머지한 뒤 §1과 같은 조건(`astro preview` HTTP/1.1, 모바일 390×3 · CPU 4x · Slow 4G, 데스크톱 1440 무제한)으로 재측정했다. 측정 중 호스트 load ~13으로 §2보다 높았으므로 수치는 보수적이다.

| 지표                            | 이전                      | 이후                                                                         |
| ------------------------------- | ------------------------- | ---------------------------------------------------------------------------- |
| `/` 모바일 LCP                  | 2,433ms                   | **2,103ms**                                                                  |
| `/` 모바일 LCP 리소스 로드 시간 | 1,788ms                   | **573ms**                                                                    |
| `/` 모바일 LCP 렌더 지연        | 31ms                      | 925ms (이미지가 CSS보다 먼저 도착 → 렌더 블로킹 CSS 대기로 이동)             |
| `/goyang/` 모바일 LCP           | 2,407ms                   | **1,837ms**                                                                  |
| `/setlist/` 모바일 LCP          | 2,345ms                   | **1,553ms**                                                                  |
| `/` 데스크톱 LCP                | 151ms                     | 144ms                                                                        |
| CLS (전 페이지)                 | 0.00                      | 0.00                                                                         |
| `/` 모바일 mp4 전송             | 5,866,428 B (`intro.mp4`) | **195,123 B** (`intro-720.mp4`, variant `compact`)                           |
| `/` 데스크톱 mp4 전송           | 5,866,428 B               | 5,866,428 B (variant `full`, 의도된 동작)                                    |
| `saveData` / 2g·3g              | 비디오 다운로드           | 포스터, mp4 0건 (e2e `hero-video-policy.spec.ts`)                            |
| 헤더 폰트 preload               | 7 파일 / 109,464 B        | 7 파일 / **13,908 B**                                                        |
| 홈 HTML                         | 35,783 B                  | 32,810 B                                                                     |
| `/` 모바일 롱태스크             | 1건 54ms @477ms           | 3건 55/61/56ms @1763/4742/4825ms — 렌더러 부트가 `load`(4,065ms) 이후로 이동 |
| 렌더러 청크 fetchStart          | 파싱 중                   | 4,122ms (≥ loadEventStart, e2e `renderer-boot.spec.ts`)                      |
| `npm run budget` JS             | 74.0 / 75.0 KiB           | 74.4 / 75.0 KiB                                                              |
| `npm run budget` media          | 미집계                    | 9,720.6 / 13,312 KiB · compact 330.4 / 3,072 KiB                             |

해석:

- LCP 개선의 원인은 리소스 로드 시간(1,788→573ms). 텍스처 preload가 폰트 preload보다 먼저 큐잉되고, 헤더 폰트 preload가 109KB→14KB로 줄어 연결 경쟁이 사라졌다. 남은 병목은 렌더 블로킹 CSS(FCP 절감 추정 ~1,100ms, §4 제외 항목 참조).
- 렌더러 부트 지연은 LCP 창에서 롱태스크를 빼냈지만 태스크 자체(WebGL 초기화, 4x CPU에서 55~61ms)는 남아 있다. 홈 롱태스크 예산 50ms는 e2e(무제한 CPU)에서 통과하며, 4x 스로틀 조건에서는 여전히 초과한다.
- 로컬 e2e: 386건 중 358 통과, 17 실패, 11 스킵. 실패 17건은 6개 제목 × 프로젝트로, 모두 변경 전 main에서도 실패하는 이 mac의 headless Chromium WebGL/비디오 한계(`dawn-sky.spec` 3, `cloud-reveal.spec` 1, `back-to-top.spec:47`, `cloud-continuation.spec`). CI(Linux)가 기준.
- 선재 실패 정리: `format:check`는 이번에 수정(`5c36b79`). `audit:content`는 출처 `lastCheckedAt` staleness로 실패 중 — 콘텐츠 확인 후 갱신이 필요한 사용자 결정 사항.
