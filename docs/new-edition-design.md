# New edition design

Original site: ../weeknd-fan, read-only. New site: weeknd-dawn, preview port 4323.

Reading this as an editorial concert programme for Korean fans, with a cinematic eclipse cover and an accessible reading index. Design variance 7, motion intensity 3, density 4. The user authorizes a new visual layout but requires explicit approval before changes to existing content. No copy, dates, navigation labels, route slugs, source records, form fields or share output artwork are changed.

## Audit and direction

Preserve Bebas Neue/Noto Sans KR, DAWNFOLD wordmark, existing ivory/amber on night palette, approved v8 eclipse and fog, 7 routes, all disclosures, song search, timeline, guide, sources, poster and ticket tools. Existing UI is a 2-column home with a 3-group horizontal contents strip. New edition uses an overscale asymmetric cover and a sticky vertical reading directory beside sequential chapters. Album imagery expands into a prominent programme spread; song list uses open editorial rows; practical guide and personal ticket close the reading sequence. Mobile reflows to one column without hiding content.

UI UX Pro Max search suggested generic purple/green entertainment styling; rejected because user explicitly defines eclipse/night/amber. Adopted its contrast, reduced-motion and navigation guidance. Use existing Astro/CSS architecture, no new runtime package.

## Implementation and verification

Copy original project and dependencies into separate folder; preserve source asset bytes; add scoped edition stylesheet and layout-only wrapper. Update new-only dev and test port. Compare original source manifest and all data/public/script files; compare rendered texts and links across all seven routes. Build/type/lint/budget, exercise navigation, song disclosures, search and local share tools, inspect desktop/mobile screenshots. Existing stale source dates must not be silently updated.

## Verified result — 2026-09-16

- All seven routes retain the original rendered text. Data, public assets and standalone client scripts match the source copy byte for byte. No content edits were made.
- Build, Astro check, lint, formatting and performance budgets passed. No new runtime dependency was introduced.
- Share exports, navigation, disclosures, no-JavaScript behavior and accessibility were exercised. The initial 178-case run had 172 passes, 3 intentional skips and 3 failures; the changed color expectation and two text-zoom overflow failures were corrected and their targeted reruns passed.
- The final layout, lunar atmosphere, home-flow and accessibility run had 84 passes, 2 intentional skips and 2 old background-style expectations. The expectations were updated for the new solid dark detail-page background; both targeted reruns passed.
- Desktop, tablet, wide and mobile screenshots were inspected. No page errors or horizontal overflow were recorded at those regular viewport sizes; the 320px/200% text-zoom route matrix also passed after correction.
- Preview is local at http://127.0.0.1:4323/. Original remains separately accessible on port 4321. No deployment or commit was performed. This was a design verification, not a fresh external audit of concert information.

## 2026-09-16 — 움직이는 일식 표지 시안

사용자가 승인한 메인 임팩트 시안. 홈의 `eclipse-impact.css`로 범위를 한정했다. 기존 4321 사이트 및 콘텐츠 데이터는 수정하지 않았다.

- 데스크톱 일식 지름 약 48vw, 중심 가로 74%. 가장 밝은 오른쪽 테두리를 화면 안에 남긴다. 모바일 지름 약 84vw, 중심 가로 57%.
- 타이틀을 확대하고 TIL DAWN을 들여써서 일식으로 시선을 이어 준다. 반사광은 기존 영상의 측정 광량 곡선과 연결한다.
- 원본 v8 영상 재사용. 왼쪽 테두리만 점진적으로 마스킹한다. 영상 자체의 플레어 텍스처/재생 시간은 편집하지 않았다.
- 기존 diffuse-haze-v2 텍스처로 얇은 전경 안개를 추가하고 58초 왕복 이동을 적용했다. 읽기 패널 뒤 배경은 고정되며 패널 상단에 따뜻한 얇은 경계광을 둔다.
- 모션 감소 환경에서는 영상 대신 포스터, 안개는 정지. 반사광용 타이틀 복제는 aria-hidden 처리.

검증: Astro check 0 errors/0 warnings(기존 deprecated API hint 1), 변경 파일 ESLint 통과, build 7 routes 성공. lunar-atmosphere 데스크톱/모바일 테스트 10개 통과. 최종 수평 위치 보정 후 geometry 2개 재통과. 1440×960/390×844 표지 및 스크롤 화면 시각 확인, 가로 넘침 없음. 전체 콘텐츠 날짜 감사는 이번 디자인 시안 범위에서 실행하지 않았다.

## 2026-09-16 — 참조 이미지의 구름 질감과 모바일 비율 재구성

이전 표지가 충분히 풍부하지 않다는 사용자 피드백을 반영했다. 내장 imagegen으로 참조 이미지의 금빛 가장자리와 어두운 내부가 있는 구름 합성 에셋을 생성했다. 사용본은 `public/visual/atmosphere/golden-cloud-bank-v3.webp`(약 66KB), 생성 PNG와 프롬프트는 `output/imagegen/`에 보관한다. 원본 참조를 픽셀 단위 복제한 것이 아니라 질감을 참고해 생성한 구름이다.

EclipseWeather의 앞뒤 구름은 각각 33초/41초 동안 다른 경로로 순환하며, 안개는 27초, 안개에 가려진 광선은 36초로 움직인다. 광량은 기존 영상 측정값을 공유한다. 모바일 일식 지름은 84vw에서 68vw로 줄이고 가로 중심을 52%로 맞췄다. 제목 아래에 일식 전체가 들어오며 구름은 측면과 하단을 감싼다. 장식 horizon이 그리드 행을 차지하던 제목 겹침도 수정했다. 정보 콘텐츠와 4321 원본 웹은 수정하지 않았다.

검증: 데스크톱/모바일 lunar-atmosphere 14 tests 통과. 모바일 제목과 일식 비겹침 및 화면 내 원형 보존을 검사에 추가. 영상 루프, 모션 감소 전환, 고정 배경/스크롤 및 새 구름 실제 이동 확인. Astro check 0 errors/0 warnings, 기존 deprecated API hint 1. 생성 에셋은 보이는 로컬 마스크 편집기에도 열었다.

## 2026-09-17 — 구름 몸체·첫 조명·아웃라인 타이틀

- 기존 구름 사진의 명도를 그대로 투명도로 쓰면서 그늘진 몸체가 빠지고, 짧은 파장의 변형이 둥근 능선을 실처럼 풀어내는 문제를 조정했다. 정규화한 밀도 응답으로 몸체를 복원하고 공간 변형의 파장을 넓혔다. 그늘진 표면의 산란을 낮춰 밝은 능선과 덩어리를 구분한다.
- 바람 네 방향·속도·이동량, 좌측 10%에서 6시 100%까지의 조명장, 빛 팔레트, 하단 원 침범 구름의 10~30% 감쇠, 분산 여백과 스크롤 좌표를 유지한다. 형태 변형은 면적을 보존하며 구름의 총량을 주기적으로 증감하지 않는다.
- 표지 구름과 안개는 측정된 일식 광량의 0.11~0.40 구간에서 서서히 드러난다. 실제 영상 기준 약 2초 부근에 시작하며 별도 타이머로 재생과 어긋나지 않는다. 읽기 구름과 정적 대체는 별도로 유지한다.
- 메인 TIL DAWN은 투명한 면, 백금색 윤곽선, 얇은 순백색 필라멘트로 복원했다. 기존 크기·간격·4초 지연/4초 등장·일정한 최대 밝기·오렌지 발광과 안개 반사는 유지한다. 세부 현재 기준은 DESIGN.md에 기록했다.

검증: build, lint, 변경 파일 formatting, Astro check 및 자산 예산 통과. 관련 Headless E2E 44개 중 40개 통과, 데스크톱 전용 검사의 모바일 중복 4개 건너뜀. 0.5/1.5/2.5/3.5/7초 실제 영상 광량을 따라 구름이 드러나는지, 이동 중 총밀도·대비 보존, 조명 비율, 스크롤, 정적 대체, 텍스트 아웃라인과 고정 발광을 검사했다. 1440×1000 및 390×844 화면 확인, 가로 넘침·페이지 오류 없음. 로컬 preview 4323에 반영했으며 배포용 clone에는 아직 동기화하지 않았다. 기존 콘텐츠 최신성·배포 대기 항목은 이번 변경의 검증 범위가 아니다.
