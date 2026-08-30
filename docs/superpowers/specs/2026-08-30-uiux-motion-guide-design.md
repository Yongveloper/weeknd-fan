# UI/UX 개선: 디스클로저 · 모션 시스템 · 고양가이드 재구성 설계

- 상태: 사용자 승인 완료 · 구현 계획 이관
- 작성일: 2026-08-30
- 선행 스펙: `2026-08-29-weeknd-goyang-fan-guide-design.md`(제품 정의·편집 원칙), `2026-08-29-dawnfold-home-visual-fidelity-design.md`(홈 우주·일식 비주얼)
- 실행 방식: 세 워크스트림(A·B·C)을 **별도 git worktree에서 병렬 구현**. 파일 소유권을 분리해 병합 충돌을 없앤다.

## 1. 배경과 문제

사용자 검수에서 나온 네 가지 문제.

1. **펼치기 UX** — `discover`, `CareerTimeline`, `SetlistPreview`, `SetlistExplorer`의 `<details>`가 전환 애니메이션 없이 즉시 열리고, 텍스트 옆에 열림/닫힘 방향을 알리는 앵커(chevron)가 없다. 셋리스트만 CSS `data-affordance="+"`를 쓴다.
2. **셋리스트 상세 가독성** — 펼친 상세 안에서 `h3`(amber 소문자) + 본문 쌍이 네 번 같은 리듬으로 반복되어 섹션이 구분되지 않고, 출처 목록이 본문과 같은 시각 위계를 가진다. 메타 행(커버·앨범·신뢰도·배지)은 정보 밀도가 높은데 구분이 없다.
3. **고양가이드** — 본문이 전부 "직접 확인하세요"로 끝나 실질 정보가 없다. `VenueMap`은 대화역→경기장 화살표 개략도일 뿐 실제 지도가 아니다. 좌석 안내가 없다. 실사용 후기 기반 팁이 없다.
4. **모션** — `@view-transition` root 크로스페이드만 있다. 요소 등장 애니메이션이 없어 사이트의 영화적 콘셉트가 정적으로 느껴진다.

## 2. 목표

- 펼치기는 어디서나 같은 컴포넌트, 같은 애니메이션, 같은 앵커로 동작한다.
- 셋리스트 상세는 한 번 훑어서 "한 문장 / 무대 / 떼창 / 듣기 / 출처"가 구분된다.
- 고양가이드는 (a) 인터파크 공식 오는 길 데이터, (b) 실제 지도와 길찾기, (c) 좌석 안내도, (d) 후기 기반 현장 팁을 제공한다. 후기는 "이 공연 확정 정보"로 오해되지 않게 분리 표시한다.
- 페이지 전환과 요소 등장이 The Weeknd의 밤·일식·새벽 콘셉트와 일치한다.
- 모션은 접근성·성능 원칙을 지킨다: `prefers-reduced-motion`에서 즉시 상태, JS 없이도 모든 정보 노출, JS 예산 75KiB gz 이내(현재 29.3KiB).

## 3. 공통 계약 (팬아웃 전 메인 세션이 커밋)

세 워크스트림이 공유하는 최소 규약. 이 커밋 위에 세 worktree를 분기한다.

### 3.1 토큰 (`src/styles/tokens.css`)

```css
--motion-slow: 900ms;
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--reveal-y: 14px;
--reveal-blur: 6px;
--reveal-stagger: 60ms;
```

### 3.2 등장 애니메이션 규약

- `data-reveal`(→ §9에서 `data-enter`로 개명) — 단일 요소. 뷰포트 진입 시 C의 스크립트가 `data-reveal="in"`으로 바꾼다.
- `data-reveal-group` — 컨테이너. 직계 자식이 순서대로 `--reveal-i` 인덱스를 받아 stagger 된다. 자식에 `data-reveal`을 붙이지 않는다.
- CSS는 `html[data-js] [data-reveal]:not([data-reveal='in'])`만 숨긴다. JS 미실행 시 전부 보인다.
- A·B는 자기 파일에 **속성만** 붙인다. 스크립트·CSS는 C 소유.

### 3.3 스키마 (`src/content.config.ts`)

`guides.section` enum에 `'seating'`, `'tips'` 추가. `sources.kind`의 기존 `'crowd-sourced'`를 후기 출처에 사용한다.

### 3.4 파일 소유권

| 워크스트림 | 소유 파일 |
| --- | --- |
| A 디스클로저 | `src/components/ui/Disclosure.astro`(신규), `src/scripts/disclosure.ts`(신규), `src/components/setlist/SetlistExplorer.astro`, `src/components/home/SetlistPreview.astro`, `src/pages/discover.astro`, `src/components/discover/CareerTimeline.astro`, `tests/unit/setlist-layout.test.ts`, `tests/e2e/disclosure.spec.ts`(신규) |
| B 고양가이드 | `src/pages/goyang.astro`, `src/components/guide/**`, `src/data/guides/**`, `src/data/sources/**`(추가만), `src/assets/guide/**`(신규), `src/content.config.ts`는 수정하지 않음(enum은 §3.3에서 메인 세션이 추가), `tests/e2e/goyang.spec.ts`(신규) |
| C 모션 | `src/styles/motion.css`, `src/scripts/reveal.ts`(신규), `src/layouts/BaseLayout.astro`, `src/components/chrome/**`, `src/components/home/**`(SetlistPreview 제외), `src/pages/index.astro`, `tests/e2e/visual.spec.ts`, `tests/e2e/motion.spec.ts`(신규) |

교집합 없음. 다른 워크스트림 파일이 필요하면 구현하지 말고 메인 세션에 보고한다.

## 4. 워크스트림 A — 디스클로저 컴포넌트와 셋리스트 상세

### 4.1 `Disclosure.astro`

Props: `label: string`, `openLabel?: string`(기본 `'접기'`), `id?: string`, `open?: boolean`, `class?: string`. Slots: default(본문), `meta`(summary 우측 보조 텍스트, 예: 앨범 태그), `summary`(라벨 전체 대체 — 셋리스트 곡명처럼 복합 summary용).

렌더 구조:

```html
<details class="disclosure" data-disclosure>
  <summary>
    <span class="disclosure__label" data-label-closed="…" data-label-open="…">더 깊이 보기</span>
    <slot name="meta" />
    <svg class="disclosure__chevron" aria-hidden="true">▾</svg>
  </summary>
  <div class="disclosure__panel"><slot /></div>
</details>
```

- Chevron: 인라인 SVG, amber, 16px, `details[open]`에서 `rotate(180deg)`, `transition: transform var(--motion-fast) var(--ease-cinematic)`.
- 라벨 전환: 열림 시 `.disclosure__label` 텍스트를 `openLabel`로 바꾼다(스크립트). `summary` slot 사용 시 라벨 전환 없음, chevron만.
- 기존 `SetlistExplorer`의 `data-affordance="+"` 텍스트 앵커는 제거하고 chevron으로 통일한다.

### 4.2 `disclosure.ts` — 높이 애니메이션

`interpolate-size`가 Safari 미지원(MDN 2026-08 기준)이므로 CSS만으로는 iOS에서 높이 전환이 불가하다. WAAPI로 구현한다.

- 대상: `details[data-disclosure]`. summary 클릭을 가로채 `preventDefault`.
- 열기: `open` 설정 → panel `height: 0 → scrollHeight`, `opacity 0 → 1`, `translateY(6px) → 0`, `var(--motion-scene)` / `var(--ease-cinematic)`. 완료 후 인라인 스타일 제거.
- 닫기: 역방향 → 완료 후 `open` 제거.
- 애니메이션 중 재클릭: 진행 중 애니메이션 `cancel()` 후 현재 높이에서 반대 방향으로 시작.
- `prefers-reduced-motion: reduce`이면 가로채지 않는다(네이티브 즉시 토글).
- `<script>` 태그는 `Disclosure.astro` 내부에서 한 번만 로드(Astro가 중복 제거). 이벤트 위임 1개.
- `hashchange`/`:target`으로 열린 details는 네이티브 동작 유지(스크립트는 클릭만 처리).
- 예산: ≤ 1.2KiB gz.

### 4.3 적용 위치

| 위치 | 라벨(닫힘 → 열림) |
| --- | --- |
| `discover.astro` 1분 입문 | "1분 입문 펼쳐보기" → "접기" (기본 `open` 유지) |
| `discover.astro` 용어·보는 음악 | "더 깊이 보기" → "접기" |
| `CareerTimeline.astro` | "더 깊이 보기" → "접기" |
| `SetlistPreview.astro` | "전체 목록 펼쳐보기" → "접기" |
| `SetlistExplorer.astro` | `summary` slot: 번호·곡명 + `meta` slot: 앨범 태그. 라벨 전환 없음 |

### 4.4 셋리스트 상세 재구성 (`.expected-setlist__detail`)

모바일 1열, 블록 간 1.25rem.

1. **메타 헤더 카드** — `AlbumCover` 48px, 앨범명(ivory 900), 신뢰도 pill(`신뢰도 high` → 테두리 pill), `StatusBadge`. 한 줄 flex, 하단 1px 구분선.
2. **본문 3블록** — 각 블록: 왼쪽 2px amber 룰, `eyebrow`(display 폰트, `BEFORE` / `ON STAGE` / `SING ALONG`) + 한글 소제목(`공연 전에 알면 좋은 한 문장` 등, ivory 0.95rem 800) + 본문(mist). 블록 내부 gap 0.35rem.
3. **공식 듣기** — `OfficialEmbed` 그대로, 위 블록과 동일 들여쓰기.
4. **출처** — 소제목 없이 `SourceList`를 0.8rem·mist 60%로 축소, 상단 1px 구분선. 각 항목 "마지막 확인" 날짜는 유지.

기존 `h3` 요소는 제거하되 소제목은 `h3`로 유지해 헤딩 구조를 보존한다(시각만 변경). `tests/unit/setlist-layout.test.ts`가 헤딩 텍스트를 단언하면 그에 맞춘다.

### 4.5 테스트

- 단위: `Disclosure` 렌더 스냅샷 대신 속성 단언 — `data-disclosure`, chevron 존재, 라벨 데이터 속성.
- e2e `disclosure.spec.ts`: 클릭 시 `open` 토글, 애니메이션 종료 후 인라인 `height` 제거, reduced-motion 에뮬레이션 시 즉시 토글, 키보드(Enter/Space) 동작, 셋리스트 첫 곡 펼침 후 4개 블록 헤딩 순서.

## 5. 워크스트림 C — 모션 시스템

### 5.1 페이지 전환: 딥 투 블랙

일식 은유 — 빛이 가려지고 돌아온다.

```css
::view-transition-group(root) { background: var(--night); }
::view-transition-old(root) {
  animation: vt-out var(--motion-scene) var(--ease-cinematic) both;
}
::view-transition-new(root) {
  animation: vt-in var(--motion-scene) var(--ease-out-expo) both;
  animation-delay: calc(var(--motion-scene) * 0.35);
}
@keyframes vt-out { to { opacity: 0; transform: scale(0.985); } }
@keyframes vt-in { from { opacity: 0; transform: scale(1.015); } }
```

- `SiteHeader` 루트에 `view-transition-name: site-header` — 전환 중 헤더는 그대로 머문다.
- 활성 내비 링크 밑줄은 `view-transition-name`을 주지 않는다(과한 모핑 방지).
- 총 체감 길이 ≈ 620ms × 1.35 ≈ 840ms. `--motion-slow` 이내.

### 5.2 요소 등장: 새벽 안개 걷힘

`reveal.ts`:

- `document.documentElement.dataset.js = ''` 를 스크립트 최상단에서 설정.
- `IntersectionObserver({ rootMargin: '0px 0px -10% 0px', threshold: 0.1 })`. 진입 시 `data-reveal="in"`, 관찰 해제(한 번만).
- `[data-reveal-group]` 자식마다 `style.setProperty('--reveal-i', i)`.
- 초기 뷰포트 안 요소는 첫 프레임에 즉시 `in`(플래시 방지: CSS 초기 상태가 hidden이므로 딜레이 없이 전환).
- `astro:page-load`에서 재실행(View Transitions 후 새 DOM).
- `prefers-reduced-motion: reduce`이면 관찰 없이 전부 `in`.

`motion.css`:

```css
html[data-js] [data-reveal]:not([data-reveal='in']),
html[data-js] [data-reveal-group]:not([data-reveal='in']) > * {
  opacity: 0;
  transform: translateY(var(--reveal-y));
  filter: blur(var(--reveal-blur));
}
[data-reveal], [data-reveal-group] > * {
  transition:
    opacity var(--motion-scene) var(--ease-out-expo),
    transform var(--motion-scene) var(--ease-out-expo),
    filter var(--motion-scene) var(--ease-out-expo);
  transition-delay: calc(var(--reveal-i, 0) * var(--reveal-stagger));
}
```

- 홈: `HomeHero` 내부는 기존 `motion` 진입 애니메이션 유지(중복 적용 금지). `IntroSummary`·`GuideShortcuts`·`FanNote` 섹션 루트에 `data-reveal`, `GuideShortcuts` 카드 컨테이너에 `data-reveal-group`.
- 공통: `BaseLayout`의 `<main>` 직계 `section > header`에 `data-reveal`은 붙이지 않는다(페이지 소유자가 결정). C는 홈·크롬만 적용.

### 5.3 마이크로 인터랙션

- 본문 링크: `background-image` 밑줄 0→100% 드로우, `--motion-fast`.
- 주요 CTA(`.expected-setlist__poster`류 클래스가 아닌, `global.css`의 `.cta` 공통 클래스가 있으면 그것): hover 시 `box-shadow: 0 0 24px color-mix(in srgb, var(--amber) 35%, transparent)`.
- 이 둘 외 추가 금지.

### 5.4 테스트

- e2e `motion.spec.ts`: (1) JS 활성 시 뷰포트 밖 `[data-reveal]`이 `opacity 0`, 스크롤 후 `in`; (2) reduced-motion 에뮬레이션에서 로드 직후 전부 `in`; (3) JS 비활성(`javaScriptEnabled: false`)에서 `[data-reveal]` 모두 보임; (4) 헤더 `view-transition-name` 계산값.
- 기존 `visual.spec.ts` `getAnimations` 단언은 `.space-sky` 예외 유지, `[data-reveal]` transition은 예외 목록에 추가.
- 예산: `npm run budget` js ≤ 32KiB gz.

## 6. 워크스트림 B — 고양가이드 재구성

### 6.1 편집 원칙

- 공식(인터파크·고양도시관리공사·라이브네이션) 정보와 후기 정보를 시각·구조적으로 분리한다.
- 후기 섹션은 `status: practical`, 섹션 상단에 배지 **"후기 기반 · 이 공연 미확정"**. 각 항목 끝에 출처 링크. 후기 출처는 `kind: 'crowd-sourced'`, 기사는 `'editorial-reference'`.
- "직접 확인하세요" 계열 문장은 제거. 확인이 필요한 항목은 **무엇을 어디서** 확인하는지 링크와 함께 한 줄로 쓴다.
- `50-pending-operations.md`의 원칙("타 공연 규정을 확정 정보로 옮기지 않는다")은 유지 — 후기 섹션 라벨이 그 경계다.

### 6.2 페이지 구조 (`goyang.astro`)

순서와 `section` 값:

1. `official` 공식 공연 정보 — 기존 유지. 수용 규모 41,311석(고양도시관리공사) 한 줄 추가.
2. `transport` 가는 길 — 전면 재작성(6.3).
3. `seating` 좌석 안내 — 신규(6.4).
4. `tips` 현장 팁 — 신규(6.5).
5. `return` 귀가 — 재작성(6.6).
6. `packing` 준비물 — 재작성(6.6).
7. `pending` 공식 발표 대기 — 유지, `pendingItems`에서 후기로 대체 가능한 항목은 그대로 두되 문구 "후기 기반 참고는 현장 팁 참조" 한 줄 추가.

`arrival`(도착 전 확인)은 `tips`의 입장 탭으로 흡수하고 파일 삭제.

페이지 상단 헤더 아래에 **섹션 점프 내비**(`nav[aria-label="가이드 섹션"]`, 가로 스크롤 pill 링크 7개, 현재 섹션 하이라이트는 하지 않음).

### 6.3 가는 길 (`transport`)

데이터 출처: 인터파크 `https://tickets.interpark.com/goods/26006903` (사용자 제공 스크린샷 2026-08-30). `sources/interpark-goods-26006903.json` 신규(`kind: 'official'`).

구성:

1. **주소·핵심 경로 표** (`AccessTable.astro` 신규)
   - 주소: 경기도 고양시 일산서구 중앙로 1601 (대화동)
   - 지하철: 3호선 대화역 3번 출구 도보 약 3분 / GTX-A 킨텍스역 1번 출구 도보 약 20분
   - 버스 대화역 정류장: M7731, 55, 66, 67, 75, 83, 88A, 88B, 89, 97, 98, 999, 1000, 1001, 1500, 3300, 3800, 9700
   - 버스 고양종합운동장·일산서구청 정류장: 55, 88A, 88B, 999, 1100
2. **간이 지도 SVG** (`VenueMap.astro` 전면 교체) — 인터파크 도면 재제작: 도로 격자(가로 3·세로 4), 좌상 경기장 원(red 38% + amber 테두리, 라벨 "고양종합운동장")과 그 왼쪽 보조경기장, 상단 도로 위 대화역(주황 pill, "③ 대화역"), 우하 킨텍스역(보라 pill, "GTX-A 킨텍스역"), 우측 킨텍스 제1·제2전시장 사각, 우상 일산백병원·좌하 대화마을 점 라벨. 대화역→경기장 도보 점선 표시. `role="img"` + `<title>/<desc>`. 사이트 팔레트로 재색.
3. **실제 지도** (`LiveMap.astro` 신규) — 클릭 로드 패턴. 초기에는 정적 플레이스홀더(SVG 지도 축소 + "지도 불러오기" 버튼). 클릭 시 `iframe` 삽입: `https://www.google.com/maps?q=고양종합운동장&output=embed&hl=ko` (`loading="lazy"`, `referrerpolicy="no-referrer-when-downgrade"`, `title="고양종합운동장 지도"`). 서드파티 요청은 사용자 동작 후에만.
4. **길찾기 버튼 3개** (`DirectionsLinks.astro` 신규) — 목적지 좌표 37.6755, 126.7448(고양종합운동장 주경기장; 구현 시 카카오맵 장소 페이지로 재확인).
   - 카카오맵: `https://map.kakao.com/link/to/고양종합운동장,37.6755,126.7448`
   - 네이버지도: `https://map.naver.com/p/search/고양종합운동장`
   - 구글맵: `https://www.google.com/maps/dir/?api=1&destination=37.6755,126.7448&travelmode=transit`
   - 모두 `target="_blank" rel="noreferrer"`, 44px 터치 타깃.
5. 캡션: "오는 길 정보 출처: 인터파크 티켓 공연 상세(2026-08-30 확인)".

`10-transport.md` 본문은 표 아래 보조 문단 2개로 축소: 대화역 3번 출구 공사로 출구 축소 사례(오마이뉴스 2025-04, `editorial-reference`), 콘서트 시 킨텍스역 셔틀 운행 사례(같은 출처).

### 6.4 좌석 안내 (`seating`, 신규 `20-seating.md` + `SeatMap.astro`)

1. **원본 좌석도 이미지** — 사용자 제공 `screenshot-2026-08-30-172710.png`를 `src/assets/guide/seat-map-interpark.png`로 복사, Astro `<Image>`로 avif/webp 변환(폭 480·960). `<a href=원본>` 감싸 탭 시 새 탭 원본 확대. `alt`는 구조 설명 한 문장. 캡션: "좌석 안내도 출처: 인터파크 티켓 공연 상세". 래스터 예산 1100KiB 중 현재 786KiB 사용 — 변환 결과 합계 150KiB 이내로 압축.
2. **구조 개략 SVG** (`SeatMapSchematic.astro`) — 개별 구역 라벨 없이 구조만: 상단 Stage, Floor 스탠딩 A/B(좌·우), 전면 Early Entry 띠, 십자 런웨이 + 하단 B-stage, FOH 2개, 3층 스탠드 링(내·중·외), 상단 좌·우 코너 시야제한 영역(빨간 점선), 1F/2F/3F 표기. 좌석도와 나란히(데스크톱 2열, 모바일 1열).
3. **등급 범례 표** — 지정석 P·R·S·A·B·C·D, 스탠딩, 스탠딩 Early Entry Package, 시야제한석 1–4. 색 칩은 인터파크 색을 그대로 쓰지 않고 사이트 팔레트 명도 단계로 재해석하되 원본 순서 유지. "구역별 등급은 원본 좌석도와 예매 페이지 기준" 한 줄.
4. **구역 코드 읽는 법** 3줄 — E/N/W/T/S 계열의 위치(스테이지 기준 좌·후·우), 숫자 클수록 외곽, 시야제한은 상단 코너.
5. 후기 기반 시야 팁은 여기 넣지 않고 `tips`로 링크.

### 6.5 현장 팁 (`tips`, 신규 `30-tips.md` + `TipsTabs.astro`)

탭 5개(`role="tablist"`, 키보드 화살표 이동, 모바일 가로 스크롤): **스탠딩 · 좌석과 시야 · 입장 · 귀가 · 준비물**. 탭 패널은 정적 렌더 + `hidden` 토글(JS 없으면 전부 순서대로 노출).

콘텐츠는 `scratchpad/goyang-tips-research.md`(리서치 2026-08-30) 기준. 각 항목 = 한 문장 사실 + 출처 링크 + 시기(YYYY-MM). 문장은 조언 어투 아닌 사실 서술("콜드플레이 2025-04 공연에서 스탠딩 대기 장소는 보조경기장이었다"). 항목 수 탭당 3–6.

`sources/` 신규(모두 `lastCheckedAt: 2026-08-30`): `review-vitaria-coldplay-2025`, `review-dcinside-bigbang-2026`, `review-alljoylog-seatview`, `review-clien-bts-2026`, `review-tndlrs-hero-2026`, `review-moneyroan-bts-parking`, `review-teamblind-return`, `review-lingoculture-guide`(`crowd-sourced`); `news-ohmynews-2025-04`, `news-daum-blackpink-refund`(`editorial-reference`); `gys-goyang-sports`(`public-agency`); `namu-goyang-stadium`(`editorial-reference`).

인터파크 스탠딩 입장 규정(`GoodsCode=08004615`)은 **타 공연** 공지이므로 후기 탭 안에서만 인용하고 `official`로 표기하지 않는다(`editorial-reference`).

### 6.6 귀가·준비물 재작성

- `30-return.md` → `40-return.md`: 대화역 통제·혼잡 30분+, 킨텍스역 도보 25분·GTX 서울역 17분, 임시 셔틀 운행 사례, 주차 출차 1–2시간, 3호선 막차 "0시 전후 — 공식 시간표 링크에서 당일 확인". 실시간 링크 2개(고양 BIS, 코레일 노선도) 유지.
- `40-packing.md` → `50-packing.md`: 신분증·티켓 QR(캡처 불가 사례)·보조배터리·겉옷/담요(북서풍)·우비(우산 금지 사례)·오페라글라스(2층 이상). 금지 물품은 "타 공연 사례" 라벨.

### 6.7 콘텐츠 감사 준수

- 모든 md `lastVerifiedAt: 2026-08-30`, `sources` ≥ 1.
- `content-audit.test.ts`가 `guides/*` practical 항목에 7일 신선도를 요구 — 새 md 모두 오늘 날짜.
- `pendingItems` 배열은 `GuideSection`에 하드코딩되어 있음 — 유지.

### 6.8 테스트

- e2e `goyang.spec.ts`: 섹션 7개 `id` 존재·순서, 길찾기 링크 3개 `href` 패턴, 지도 iframe은 클릭 전 0개·클릭 후 1개, 좌석도 `<picture>` 존재 + 캡션에 "인터파크", 탭 키보드 이동, JS 비활성 시 탭 패널 전부 노출.
- 단위: `content-audit` 통과, `npm run check` 0.
- 예산: 래스터 합계 ≤ 1100KiB.

## 7. 실행 순서

1. 메인 세션: §3 공통 계약 커밋(`chore: add motion tokens, reveal contract, guide sections`).
2. worktree 3개 생성 `../weeknd-fan-a|b|c`, 각 `node_modules` 심링크, dev 포트 4331/4332/4333.
3. 구현 에이전트 3개 병렬(subagent-driven-development, 모델 opus). 각 에이전트는 자기 소유 파일만 수정, TDD, 완료 시 `npm run lint && npm run check && npm run test:unit` 통과 + 스크린샷 경로 보고.
4. 메인 세션 리뷰(코드 + 스크린샷) → 수정 라운드.
5. 병합 순서 C → A → B (A·B의 `data-reveal` 속성이 C의 CSS를 전제). 각 병합 후 `npm run build && npm run budget`.
6. 최종 `npm run verify`(4321 dev 종료 후) + 모바일/데스크톱 스크린샷 판정.

## 8. 범위 외

- 카카오/네이버 지도 JS SDK 임베드(키·도메인 등록 필요) — 딥링크로 대체.
- 좌석 구역별 등급 매핑 표·"내 구역 찾기" 검색 — 오표기 리스크로 제외.
- 서브페이지 배경 우주 통일 여부 — 별도 결정.
- 10월 초 저녁 실측 기온 — 근거 없음, 기재 안 함.

## 9. 구현 조정 (계획 작성 중 확정 — 위 본문보다 우선)

1. **속성명** `data-reveal` → **`data-enter`**, `data-reveal-group` → **`data-enter-group`**. 홈 `eclipse-countdown`이 이미 `data-reveal="done"`을 쓰고 있어 충돌한다. 진입 상태 값은 `data-enter="in"`.
2. **게이트** `html[data-js]` → 기존 **`html[data-motion-ready]`** 재사용. `reveal.ts`가 JS 실행 + reduced-motion 아님일 때만 설정한다(기존 `home-motion.ts` 의미 유지, `visual.spec.ts` "reduced motion never marks the document motion-ready" 통과). reduced-motion에서는 속성이 없으므로 CSS 숨김이 적용되지 않아 별도 `in` 마킹이 불필요하다.
3. **`reveal.ts`가 `home-motion.ts`를 대체**한다. 기존 `[data-motion-scene-enter]` → `data-motion-state="entered"` 동작을 그대로 흡수하고(`IntersectionObserver`, threshold 0.35), `motion`의 `inView` 의존을 제거한다. `BaseLayout`에서 전 페이지 로드. `index.astro`의 `home-motion.ts` 스크립트 태그와 파일은 삭제.
4. **현장 팁 데이터**: `30-tips.md` 하나가 아니라 **탭당 md 1개** (`30-tips-standing.md`, `31-tips-seating.md`, `32-tips-entry.md`, `33-tips-return.md`, `34-tips-packing.md`, 모두 `section: 'tips'`). 각 파일이 자기 `sources`를 가져 콘텐츠 감사를 통과하고, `goyang.astro`가 `section === 'tips'` 항목을 모아 `TipsTabs` 하나로 렌더한다. 후기 항목의 개별 출처는 본문 불릿 끝 인라인 링크로 표기한다.
5. **Disclosure 단위 테스트**는 두지 않는다(프로젝트에 Astro 컨테이너 렌더 테스트 패턴 없음). 속성 단언은 e2e `disclosure.spec.ts`에서 한다.
6. **소유권 추가**: `tests/e2e/navigation.spec.ts` → B (고양 관련 단언 갱신; 셋리스트 단언은 A가 호환 유지), `tests/e2e/no-js.spec.ts` → 수정 금지(A·B 모두 호환 유지), `src/styles/global.css` → C.
7. **CTA glow**는 공통 CTA 클래스가 없어 생략. 마이크로 인터랙션은 본문 링크 밑줄 드로우만.
8. **마이너**: `Disclosure`에 `ariaLabel` prop 추가(기존 `details aria-label` 유지용 — `no-js.spec.ts`가 `getByRole('group', { name: '1분 입문 더 깊이 보기' })`로 조회).
9. **토큰명**: §3.1의 `--reveal-y / --reveal-blur / --reveal-stagger` → **`--enter-y / --enter-blur / --enter-stagger`** (속성명 개명과 일치).
10. **계획 문서**: `docs/superpowers/plans/2026-08-30-{a-disclosure,c-motion,b-goyang-guide}.md`. B의 리서치 입력은 각 worktree의 `.superpowers/tmp/b-inputs/`(gitignored)에 둔다.
