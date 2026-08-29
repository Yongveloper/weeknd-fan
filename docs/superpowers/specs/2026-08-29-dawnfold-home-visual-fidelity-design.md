# DAWNFOLD 시각 충실도·이해도 개선 설계

- 날짜: 2026-08-29
- 상위 문서: `2026-08-29-weeknd-goyang-fan-guide-design.md` (§4 콘텐츠 깊이, §5 정보 구조, §9 DAWNFOLD, §11 저작권)
- 브랜치: `feature/goyang-v1`
- 성격: 기능 추가 없음. 카피·마크업·CSS·소량 JS·데이터 컬렉션 1개.

## 0. 배경과 진단

v1 구현은 콘텐츠·접근성·성능·배포가 완성됐지만 승인된 DAWNFOLD 시각 설계는 일부만 구현됐고, 처음 온 사람이 사이트의 정체를 첫 화면에서 파악하지 못한다. 2026-08-29 코드·실제 화면(375/390/572/1440) 검토로 확인한 근본 원인:

1. **밤→새벽 흐름이 픽셀로 존재하지 않는다.** `html`에 배경이 있어 `body` 배경이 캔버스로 전파되지 않고, `body::before`(z-index -1, fixed 조명 레이어)는 root stacking context에서 body의 불투명 그라데이션 아래에 그려진다. 여기에 hero·setlist·fan-note 섹션이 각자 불투명 배경을 칠해 "시간이 흐르는 하늘"이 아니라 "색이 다른 직사각형 블록"으로 읽힌다. 푸터는 레드→블루→앰버 가로 그라데이션으로 새벽에서 다시 밤으로 되돌아간다.
2. **한글 제목이 display 폰트 fallback으로 렌더된다.** `--font-display: 'Bebas Neue', Impact, sans-serif`에 한글 글리프가 없어 모든 한글 h1–h3가 시스템 sans(얇은 웨이트)로 떨어지고, Bebas 기준 `line-height 0.82–0.98`이 그대로 적용된다. 결과: `3분 만에 THE / WEEKND 알기` 혼합 폰트, 1440px `고양 가이/드`, /discover 390px `기` 한 글자 고아.
3. **히어로 h1이 375px에서 4줄**(`AFTER / HOURS / TIL / DAWN`), 572px에서 3줄. `clamp(5.5rem, 18vw, 15rem)` 하한 88px가 343px 컨테이너를 넘친다.
4. **셋리스트 미리보기 heading 붕괴**: `.setlist-preview__heading`이 `flex-wrap + align-items:end`라 eyebrow가 왼쪽 아래, h2가 중앙에 떠 있다(572·1440).
5. **모바일 헤더** nav `scrollWidth 479 / clientWidth 375`, scrollbar 노출, 마지막 항목 잘림.
6. **정체 설명 부재**: 홈 첫 화면에 "The Weeknd"라는 이름과 "비공식 팬 가이드"라는 정체가 없다. eyebrow가 h1과 같은 문구(`AFTER HOURS TIL DAWN`)를 반복하고, `D-39`에 무엇까지인지 캡션이 없다. 스펙 §5 Home #1·#2(표지, 연령·공식 공지) 미충족.
7. **페이지 간 h1 언어 불일치**(홈·setlist·goyang 영문, discover·sources 한글), setlist 페이지는 `EXPECTED SETLIST` h1 바로 아래 `예상 셋리스트` h2 중복.
8. **셋리스트 페이지의 핵심 가치가 숨어 있다**: 38행이 `<details>`인데 펼침 표시가 없어 관람 포인트·떼창·공식 듣기가 있다는 사실을 알 수 없다. 리스트 배경이 ~5행 단위로 색이 급변한다.
9. **Discover**: 첫 콘텐츠 `1분 입문`이 접혀 있고, 각 앨범 밑 `StatusBadge`가 grid stretch로 전폭 빈 막대처럼 렌더된다.
10. **애니메이션 런타임 계측(1440×900, `document.getAnimations()`)**: 페이지 로드 후 달·안개 진입 0.62s 동안만 애니메이션 2개 실행, 이후 스크롤 600–3000px 구간 전체에서 실행 중 애니메이션 0개. `eclipse-shadow`는 D-숫자가 바뀌는 자정에만 재생되어 실질적으로 보이지 않으며, 상위 문서 §9 "페이지 진입 시 한 번만 짧은 숫자 전환"은 미구현. 상위 §9 전환 목록 6개 중 구현 1.5개.
11. 사용자 요구 추가: 앨범이 언급되는 모든 자리에 실제 앨범 커버를 함께 보여준다. 이는 상위 문서 §11 "앨범 아트를 복제하지 않는다"와 충돌하므로 §6에서 정책을 개정한다.

## 1. 결정 사항 요약

| 항목 | 결정 |
|---|---|
| 한글 display 서체 | 기존 로드된 Noto Sans KR Variable, weight 900. 새 폰트 없음 |
| 밤→새벽 구동 | 고정 하늘 레이어 + CSS scroll-driven animation. 미지원 브라우저는 정적 그라데이션 |
| 모바일 헤더 | 가로 스크롤 유지, scrollbar 숨김 + 우측 fade hint + scroll-snap |
| 앨범 커버 | Spotify oEmbed 공식 커버 hotlink, 커버는 항상 Spotify 앨범 링크. 자체 호스팅 없음 |
| 전환 | 히어로 sweep / Eclipse 진입 숫자 전환 / 셋리스트 runway / 고양 horizon 4개. 각 1회, 450–700ms. 읽기를 방해하지 않는 micro-interaction 3개(셋리스트 펼침, 커버 hover, 메뉴 underline) 추가 |
| 범위 외 | sources 좌측 여백, goyang 교통 도식, 티켓·포스터 썸네일, INDEX 메뉴, 새 래스터 에셋, 지속 parallax |

## 2. §0 이해도 — 카피·마크업

목표: 첫 화면 3초 안에 "The Weeknd 고양 공연을 위한 팬이 만든 비공식 팜플렛"임을 알고, 각 페이지에서 무엇을 클릭하면 무엇이 나오는지 보인다.

### 홈 히어로 (`HomeHero.astro`)
- eyebrow: `AFTER HOURS TIL DAWN / GOYANG` → `THE WEEKND · 비공식 팬 팜플렛`.
- h1: `AFTER HOURS <span>TIL DAWN</span>` 유지(투어명 고유명사). 항상 2줄.
- 정보 줄: `2026.10.07—08 · 고양종합운동장 주경기장` 뒤에 ` · 만 19세 이상`과 `공식 공지 ↗`(concert 데이터의 공식 티켓 공지 URL, `rel="noreferrer"`) 추가. 기존 e2e `getByText('고양종합운동장 주경기장')`가 계속 매칭되도록 장소 문자열은 별도 `<span>`으로 유지.
- Eclipse 달 아래 캡션 `<p class="eclipse-caption">첫 공연까지</p>`(카운트다운 상태가 day-two면 `둘째 날 공연까지`, 종료 후에는 표시 안 함). `EclipseCountdown` 내부 상태 라벨에서 파생. 시각 전용(`aria-hidden`), SR 라벨은 기존 `[data-accessible-countdown]` 유지.

### 워드마크 (`SiteHeader.astro`)
- 부제 `GOYANG 26` → `THE WEEKND · GOYANG 26`. aria-label 기존 유지.

### 페이지 h1 규칙
- 규칙: **h1은 한글, eyebrow는 영문.** 예외는 홈 히어로(투어명)만.
- `/setlist/`: h1 `EXPECTED SETLIST` → `예상 셋리스트`, eyebrow `EXPECTED SHOW GUIDE` 유지. 그 아래 `SetlistExplorer`의 `예상 셋리스트` h2는 `이번 투어의 반복 패턴`으로 바꿔 중복 제거. e2e는 `.expected-setlist` 클래스와 `예상 · 보장 아님` 텍스트 기반이라 영향 없음 — 단 `aria-labelledby` id는 유지.
- `/goyang/`: h1 `GOYANG<br />DAY-OF GUIDE` → `고양 당일 가이드`, eyebrow `GOYANG DAY-OF GUIDE`.
- `/discover/`, `/sources/`: 이미 한글. `<br />` 제거하고 `text-wrap: balance`에 맡긴다.

### 셋리스트 페이지 (`SetlistExplorer.astro`)
- 각 `<summary>`에 펼침 affordance: 우측 `+`(펼치면 `−`) 마커를 `::after`로, 좌측에 곡 번호. `list-style: none` 후 커스텀. 키보드·no-JS 동작은 네이티브 `<details>` 그대로.
- summary 우측에 앨범 태그(`AlbumCover` 32px 없이 텍스트만: 앨범명 소문자 eyebrow 스타일) — 접힌 상태에서 시대를 구분할 최소 힌트. 커버는 펼친 메타에만.
- 리스트 배경 색 밴딩 제거(§3 하늘 레이어 위 투명).
- 리스트 상단에 한 줄 안내: `곡을 누르면 관람 포인트·떼창·공식 듣기가 열립니다.`

### Discover (`discover.astro`, `CareerTimeline.astro`, `IntroDisclosure` 해당 컴포넌트)
- `1분 입문` `<details open>` 기본 열림. e2e `1분 입문 펼쳐보기` 클릭 테스트는 open 상태에서도 summary 클릭 후 링크가 보이는지 확인하므로 유지되지만, 클릭이 닫기로 동작하면 실패한다 → 해당 테스트는 "이미 열려 있으면 클릭 생략"으로 수정한다.
- `StatusBadge`는 grid 자식에서 `justify-self: start`(컴포넌트 자체에 `width: fit-content` 추가로 전역 해결).

### 티켓·포스터 링크 (`FanNote.astro`, `SetlistPreview.astro`)
- 링크 아래 한 줄 설명: `브라우저에서만 만들어지는 이미지 한 장. 서버 저장 없음.` 썸네일은 범위 외.

## 3. §1 하늘 레이어 — 밤→새벽

### 구조 (`BaseLayout.astro`, `global.css`)
- `<body>` 첫 자식으로 `<div class="dawn-sky" aria-hidden="true"></div>` 추가.
- `body { position: relative; isolation: isolate; background: none; }` — body가 자체 stacking context를 만들어 `.dawn-sky`의 `z-index: -1`이 body 콘텐츠 뒤, html 배경 앞에 확정된다. `html { background: var(--night) }` 유지(로딩·no-JS·오버스크롤 안전).
- 기존 `body::before` 제거.
- `.dawn-sky { position: fixed; inset: 0; z-index: -1; pointer-events: none; }`

### 레이어 구성 (모두 CSS gradient, 래스터 없음)
- 진행 변수 `--dawn: 0..1` 하나로 제어. `@property --dawn { syntax: '<number>'; inherits: true; initial-value: 0 }`.
- 하늘 색: `background-color: color-mix(in oklab, ...)`를 4구간 키프레임으로 — 0 밤 `#050507`, 0.3 딥레드 번짐(`--red` 22%), 0.62 코발트(`--blue` 26%), 1 앰버 새벽(`--amber` 30%).
- 빛 번짐 2장(`::before`, `::after`): 좌상단 레드 radial(0.15–0.45에서 opacity 최대), 우측 대각 코발트 밴드 `linear-gradient(112deg …)`(0.5–0.75 최대). opacity만 애니메이션.
- 지평선: `.dawn-sky` `background-image` 마지막 층 — 가로 1px glow 라인 + 아래 12vh 부드러운 앰버. `background-position-y`를 `62vh → 40vh`로, 색을 mist→amber로.

### 구동
```css
@supports (animation-timeline: scroll()) {
  .dawn-sky { animation: dawn-progress linear both; animation-timeline: scroll(root block); }
  @keyframes dawn-progress { from { --dawn: 0 } to { --dawn: 1 } }
}
```
- 각 시각 속성은 `--dawn`에서 `calc()`/`color-mix()`로 파생하지 않고 키프레임에 직접 값을 둔다(브라우저별 `@property` 보간 차이 회피). 즉 `@keyframes dawn-progress`가 `background-color`, `background-position`, `--glow-red`, `--glow-blue`(opacity로 사용)를 함께 보간.
- 지원: Chrome/Edge 115+, Safari 26+(2025-09). **Firefox 미지원** → `@supports` 블록 밖의 기본 CSS가 정적 fallback이다: `.dawn-sky`는 `display: none`, `body`에 tall gradient(밤→레드→코발트→앰버, 180deg, 문서 전체 높이)를 둔다. `@supports` 안에서 `.dawn-sky`를 `display: block`으로 켜고 `body` 배경을 `none`으로 되돌린다. 즉 fallback = "스크롤과 함께 지나가는 긴 하늘", 지원 브라우저 = "제자리에서 변하는 하늘".
- `prefers-reduced-motion: reduce`: 스크롤 종속 색 변화는 사용자 조작에 비례하므로 유지. 단 지평선 이동(`background-position`)과 빛 번짐 opacity 변화는 제거하고 색만 변한다. `motion.css`의 전역 `animation-duration: 0.01ms !important`는 scroll timeline에서 duration이 무시되므로 충돌하지 않지만, 명시적으로 `.dawn-sky { animation-duration: auto !important }`를 reduce 블록에 둔다.

### 섹션 (`HomeHero`, `IntroSummary`, `SetlistPreview`, `GuideShortcuts`, `FanNote`, `SiteFooter`, `SetlistExplorer`)
- 모든 섹션 `background: transparent`. 히어로는 달·안개 이미지의 `mix-blend-mode: screen`이 검정 배경을 전제하므로 히어로 내부 `.home-hero__visual` 뒤에만 `--night` 레이어를 남기고, 히어로 하단 18vh는 `mask-image: linear-gradient(180deg, #000 82%, transparent)`로 하늘에 녹인다.
- 섹션 경계는 테두리 없이 **대각선 접힘 면**: 각 섹션 `::before`에 높이 `clamp(3rem, 8vw, 7rem)`의 대각(`polygon(0 0, 100% 0, 100% 100%, 0 38%)` 또는 좌우 교대) ivory 3–5% 반투명 면. 팜플렛 접힘 은유, 수평 직선 경계 0개.
- 푸터: gradient 제거, 상단 1px 앰버 지평선 라인 + 투명. "새벽에 도착"으로 끝.
- `/setlist/` 리스트 행 배경 제거(밴딩 해소). 행 구분은 기존 1px 라인만.

## 4. §2 타이포

### 토큰·전역 (`tokens.css`, `global.css`)
- `--font-display-ko: 'Noto Sans KR Variable', system-ui, sans-serif;`
- 전역 h2/h3 기본 규칙(현재 4개 컴포넌트에 중복된 스타일을 `global.css`로 승격):
```css
h1, h2, h3 { font-family: var(--font-display-ko); font-weight: 900; line-height: 1.08; letter-spacing: -0.02em; word-break: keep-all; text-wrap: balance; }
.display-latin, h1 .latin, h2 .latin { font-family: var(--font-display); font-weight: 400; letter-spacing: 0.02em; white-space: nowrap; }
```
- 영문 전용 제목(홈 h1 `AFTER HOURS TIL DAWN`)은 `.display-latin` 클래스로 Bebas 유지, `line-height 0.82`.
- 한글 제목 안의 라틴 조각(`The Weeknd`, `Trilogy`, 앨범명)은 `<span class="latin">`로 감싸 Bebas + `nowrap`. 크기는 한글보다 시각적으로 커 보이므로 `font-size: 1.08em`으로 맞춘다.
- 크기 스케일: h1 `clamp(2.6rem, 7.5vw, 5.4rem)`, h2 `clamp(2.1rem, 5.5vw, 4rem)`, h3 `clamp(1.2rem, 2.4vw, 1.5rem)`. 기존 Bebas 기준 `clamp(3.2rem, 8vw, 6.5rem)`은 900 웨이트 한글에 과대.

### 히어로 h1 (`HomeHero.astro`)
- 두 줄 각각 `display:block; white-space: nowrap`. `font-size: clamp(3.8rem, 16.5vw, 15rem)` — 343px 컨테이너에서 `AFTER HOURS`(Bebas 약 0.40em/자 × 11자 ≈ 4.4em) → 3.8rem×4.4 ≈ 267px 여유. 검증 기준: 375·390·572·1440 모두 정확히 2줄.
- 모바일: 정보 줄을 heading 바로 아래로 붙이고(`gap` 축소) 달을 `bottom: -6vw`로 내려 텍스트와 겹치지 않게. 겹침 잔여분은 정보 줄 `text-shadow: 0 1px 12px var(--night)`.

### 셋리스트 미리보기 heading (`SetlistPreview.astro`)
- 2단 grid: 1행 eyebrow, 2행 `h2 + StatusBadge`(flex, `align-items: baseline`).

## 5. §3 전환 4개 + micro-interaction 3개

- 원칙(상위 §9): 장면 전환은 450–700ms, 1회, 읽는 동안 정지. 지속 애니메이션·parallax 없음. micro-interaction은 사용자 조작에 대한 응답만(hover·펼침·현재 위치), 200ms 이하.
- 구현: `src/scripts/home-motion.ts` 신규. 기존 deferred `motion` 청크 패턴을 따라 `prefers-reduced-motion: no-preference`일 때만 `import('motion')` 후 `inView(el, cb, { amount: 0.35 })` 1회(`once` 동작은 콜백에서 unsubscribe). 진입 즉시 `data-motion-state="entered"` 세팅 → CSS `@keyframes`가 재생. **no-JS와 reduced-motion은 최종 상태가 기본 CSS**(속성 초기값 = 완료 상태, `[data-motion-ready] .x:not([data-motion-state=entered])`에서만 시작 상태). CLS 0.
- 히어로 fold/light sweep: heading 위 대각 ivory→transparent 빛 밴드 1회 sweep 620ms, 기존 달·안개 진입(EclipseCountdown)과 동시 시작.
- 셋리스트 runway/blue sweep: 섹션 진입 시 코발트 레이저 밴드가 좌→우 560ms, 곡 `li` 6개 `translateY(14px)→0` + `opacity` 30ms stagger, `perspective(900px) rotateX(6deg)→0`로 얕은 원근. 네온 도시 깊이는 배경 밴드 2장(`::before/::after`) opacity로 암시.
- 고양 arrival/horizon: 가이드 섹션 진입 시 하늘 지평선 glow 1회 pulse(`.dawn-sky`에 `data-horizon-pulse` 600ms) + 링크 3개 stagger fade-up.
- **Eclipse 진입 숫자 전환**(상위 §9 요구, 미구현분): 달 진입 애니메이션 `finished` 직후 `EclipseCountdown`이 기존 `eclipse-shadow` 키프레임(440ms)을 1회 재생하며 `D-39`를 드러낸다. 시작 상태는 숫자 `opacity: 0` → 그림자가 지나간 뒤 1. 이후 자정 라벨 변경 시 동작은 기존 그대로. reduced-motion·no-JS는 숫자 즉시 표시(현행 `data-motion-state="reduced"`/서버 마크업 경로 재사용). e2e `renders Eclipse Count inside the retained moon scene`의 `[data-primary]` 텍스트 검증은 opacity와 무관하므로 유지, `toBeVisible`은 애니메이션 종료 후 통과하도록 기존 대기 로직 확인.

### micro-interaction (사용자 조작 응답, 200ms 이하)
- 셋리스트 `<details>` 펼침: `.expected-setlist__detail`이 `opacity 0→1`, `translateY(6px)→0` 180ms. `details[open]`에서만 `@keyframes` 재생(네이티브 토글이라 JS 없음). `+`→`−` 마커 회전 180ms.
- 앨범 커버 hover/focus-visible: `translateY(-2px)` + 시대 색 glow `box-shadow` 160ms. 터치 기기(`@media (hover: none)`)에서는 비활성.
- 헤더 메뉴 현재 위치·hover: 기존 그라데이션 배경 대신 하단 2px underline이 `scaleX(0→1)` 180ms(`transform-origin: left`). `aria-current="page"`는 항상 채워진 상태. 기존 e2e 44px 타깃 검증 유지.
- reduced-motion: 위 3개 모두 `transition-duration: 0.01ms`(전역 규칙)로 즉시 전환 — 별도 처리 없음.
- e2e `reduced motion does not load the deferred Motion chunk` 유지: 새 스크립트도 같은 조건 분기 안에서만 import.

## 6. §4 헤더 (`SiteHeader.astro`)
- `nav { scrollbar-width: none; } nav::-webkit-scrollbar { display: none; }`
- `nav { scroll-snap-type: x proximity; } li { scroll-snap-align: start; }`
- 우측 fade hint: `nav { mask-image: linear-gradient(90deg, #000 calc(100% - 3rem), transparent) }` + 마지막 항목 잘림 방지 `padding-inline-end: 3rem`. 좌측 스크롤 시 왼쪽도 fade가 필요하면 `scroll-timeline` 없이 두 방향 고정 mask(`transparent, #000 1.5rem, #000 calc(100% - 3rem), transparent`)로 단순화.
- 헤더 배경은 반투명 유지(`color-mix(--night 70%)`) → 하늘 색이 헤더에 비쳐 시간 흐름이 상단에도 보인다.
- 44px 터치 타깃·`aria-current` 유지.

## 7. §6 앨범 커버

### 정책
- 상위 문서 §11 개정(같은 커밋): 앨범 아트를 **자체 호스팅·재가공하지 않는다.** Spotify oEmbed가 제공하는 공식 커버 이미지를 Spotify 앨범 링크와 함께 hotlink로만 표시한다. Spotify 개발자 정책이 허용하는 형태(커버 아트는 Spotify 콘텐츠 링크와 함께 표시).
- 사용자 프라이버시: 이미지 요청만 발생(쿠키 없음), `referrerpolicy="no-referrer"`. `/sources/` 하단에 한 줄 고지: `앨범 커버는 Spotify CDN에서 직접 불러옵니다.`

### 데이터 (`src/content.config.ts`, `src/data/albums/*.json`)
- 새 컬렉션 `albums` 10개: `house-of-balloons`, `thursday`, `echoes-of-silence`, `kiss-land`, `beauty-behind-the-madness`, `starboy`, `my-dear-melancholy`(EP), `after-hours`, `dawn-fm`, `hurry-up-tomorrow`. My Dear Melancholy, 는 EP지만 연표·셋리스트에 등장하므로 포함.
- 스키마:
```ts
const albums = defineCollection({
  loader: glob({ base: './src/data/albums', pattern: '**/*.json' }),
  schema: z.object({
    title: z.string(),
    year: z.number().int(),
    kind: z.enum(['mixtape', 'studio', 'ep']),
    era: z.enum(['night', 'red', 'blue', 'amber']),
    spotifyUrl: z.url().regex(/^https:\/\/open\.spotify\.com\/album\//),
    cover: z.object({
      url: z.url().regex(/^https:\/\/(image-cdn-[a-z]+\.spotifycdn\.com|i\.scdn\.co)\//),
      width: z.number().int(), height: z.number().int(),
      fetchedAt: editorialDate,
    }),
  }),
});
```
- `setlist.album`·`relatedAlbums`는 문자열을 유지한다. 실제 데이터에 정규 디스코그래피 밖 발매(`Heroes & Villains`, `The Highlights` 등)가 있어 `findAlbumByTitle()`(제목 정규화 매칭)로 일치하는 앨범만 커버를 붙이고, 나머지는 텍스트로 남긴다.
- `scripts/refresh-album-covers.mjs`: 각 앨범 `spotifyUrl`로 `https://open.spotify.com/oembed?url=` 호출 → `thumbnail_url/width/height` 갱신, `fetchedAt` 오늘. 빌드·테스트는 이 스크립트를 호출하지 않는다(오프라인 빌드 유지). 실측: 300×300 JPEG ≈ 25KB/장.
- `audit.ts`에 규칙 추가: 모든 앨범 `cover.fetchedAt`이 90일 이내, `spotifyUrl`은 `sources` 컬렉션에 `official` 항목으로도 존재(출처 체계 일관).

### 컴포넌트 `src/components/content/AlbumCover.astro`
```astro
<a class="album-cover" href={album.data.spotifyUrl} target="_blank" rel="noreferrer" data-era={album.data.era} style={`--size:${size}px`}>
  <img src={album.data.cover.url} width={album.data.cover.width} height={album.data.cover.height}
       alt={`${album.data.title} 앨범 커버 — Spotify에서 열기`} loading="lazy" decoding="async" referrerpolicy="no-referrer" />
  <span class="album-cover__fallback" aria-hidden="true">{album.data.title}</span>
</a>
```
- `.album-cover`는 `--size` 정사각, 배경에 시대 색 타일 + 제목(fallback). 이미지가 로드되면 위를 덮는다 → 오프라인·CDN URL 변경·no-JS에서도 빈 칸 없음. JS 불필요.
- 크기 프리셋: 32(셋리스트 곡 메타), 72(정규 6장 목록·연표), 120(홈 입문 3장·Trilogy).

### 노출 위치
- 홈 `IntroSummary`: 문장 "세 장의 앨범" 옆에 After Hours·Dawn FM·Hurry Up Tomorrow 120px 3장 가로.
- `/discover/` 정규 앨범 6장 목록(72), 연표 각 항목(72), 두 Trilogy 3+3(120).
- `/setlist/` 곡 펼침 메타(32) — 접힌 38행에는 넣지 않는다.
- 성능: `/discover/` 최대 10장 ≈ 250KB(외부, 로컬 raster 예산 400KiB와 별개지만 같은 기준으로 관리). 홈 3장 ≈ 75KB. 모두 `loading="lazy"`.

## 8. §5 검증 기준

- 스크린샷 375×812, 390×844, 572×863, 1440×900:
  - 홈 h1 정확히 2줄. 모든 한글 h1–h3 Noto Sans KR 900, 고아 글자 0, `The Weeknd`·앨범명 비분리.
  - 섹션 경계에 수평 직선 0개. 스크롤 0%/50%/100%에서 하늘 색이 밤/코발트/앰버로 판정 가능(`getComputedStyle(.dawn-sky).backgroundColor` 샘플).
  - 셋리스트 미리보기 heading 2단, 셋리스트 페이지 행마다 `+` 마커 보임.
  - 헤더 scrollbar 미노출, 마지막 메뉴 `출처·업데이트` 완전 노출(스크롤 후).
  - 앨범 커버 로드, fallback 타일은 `img` 제거 시 보임.
- 애니메이션 런타임 계측(독립 Playwright 스크립트): 로드 후 1.5s 안에 달·안개·light sweep·eclipse 숫자 전환이 순서대로 재생되고 종료; 셋리스트·가이드 섹션 첫 진입 시 각 1회 재생 후 `document.getAnimations()` 0; 되돌아가도 재생 없음; 스크롤 중 하늘 레이어 외 실행 중 애니메이션 0.
- Firefox에서 정적 fallback 1회 확인(Playwright firefox 프로젝트 또는 수동).
- `npm run verify` 전체 통과. JS gzip ≤ 75KiB(현 28.7), 로컬 raster 변화 0, CLS < 0.1, long task ≤ 50ms.
- 기존 e2e 유지 대상: `getByText('고양종합운동장 주경기장')`, `eclipse-countdown`/`[data-primary]`/`[data-clock]`, `.expected-setlist details`, `1분 입문 펼쳐보기`(open 기본값 반영해 수정), `reduced motion does not load the deferred Motion chunk`.
- 콘텐츠 감사에 `albums` 규칙 2개 추가 후 통과.

## 9. 파일 목록

- 신규: `src/data/albums/*.json`(10), `scripts/refresh-album-covers.mjs`, `src/components/content/AlbumCover.astro`, `src/scripts/home-motion.ts`
- 수정: `src/content.config.ts`, `src/lib/content/audit.ts`, `src/lib/content/queries.ts`, `src/layouts/BaseLayout.astro`, `src/styles/tokens.css`, `src/styles/global.css`, `src/styles/motion.css`, `src/components/chrome/SiteHeader.astro`, `SiteFooter.astro`, `src/components/home/HomeHero.astro`, `IntroSummary.astro`, `SetlistPreview.astro`, `GuideShortcuts.astro`, `FanNote.astro`, `src/components/visual/EclipseCountdown.astro`(캡션, 진입 숫자 전환), `src/components/setlist/SetlistExplorer.astro`, `src/components/discover/CareerTimeline.astro`, `TrilogyExplainer.astro`, `src/components/content/StatusBadge.astro`, `src/pages/setlist.astro`, `goyang.astro`, `discover.astro`, `sources.astro`, `src/data/setlist/*.json`(album slug), `src/data/discover/*.md`(relatedAlbums slug), `tests/e2e/navigation.spec.ts`(1분 입문 open), `docs/superpowers/specs/2026-08-29-weeknd-goyang-fan-guide-design.md`(§11 1줄)

## 10. 권장 구현 순서

1. §6 데이터·스키마·커버 컴포넌트(이후 모든 화면 판정의 콘텐츠가 고정됨)
2. §2 타이포 전역 규칙 + 히어로 h1 + 셋리스트 heading
3. §1 하늘 레이어 + 섹션 투명화 + 대각선 접힘 + 푸터
4. §0 카피·마크업(h1 규칙, affordance, 입문 open, 배지)
5. §3 전환 4개 + micro-interaction 3개
6. §4 헤더
7. §5 검증 — 스크린샷 4해상도 반복, `npm run verify`, Firefox fallback
