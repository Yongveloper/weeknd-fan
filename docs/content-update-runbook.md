# 콘텐츠 업데이트 실행서

## 공연 전 확인

1. 먼저 The Weeknd, Live Nation Korea, 현대카드, NOL 티켓 등 **공식 원문**을 연다. 공공 교통 정보는 해당 공공 서비스 원문에서 확인한다.
2. 확인한 각 출처의 `lastCheckedAt`을 실제 확인 날짜로 갱신하고, 해당 콘텐츠의 `lastVerifiedAt`도 함께 갱신한다.
3. 입장 게이트, 반입 금지 물품, 셔틀·교통 통제, 접근성 지원, 스탠딩·Early Entry 운영처럼 공식 발표가 없는 운영 사실은 공개하지 않는다. `unpublished` / `미공개 · 확인 필요` 상태로 둔다.
4. Tokyo(9월 19–20일), Jakarta(9월 26–27일), Singapore(10월 2–3일) 뒤에는 각 공연의 셋리스트 스냅샷을 새 `src/data/sources/` 기록으로 추가한다. 세트리스트의 `observedIn`과 `confidence`는 새 기록을 기존 기록과 비교한 뒤에만 바꾼다.
5. 각 갱신에서 `npm run audit:content && npm run build`를 실행한다. 감사 또는 빌드가 실패하면 게시하지 않는다.

## 갱신 커밋 메시지

- Tokyo 확인: `content: refresh Tokyo verification`
- Jakarta 확인: `content: refresh Jakarta verification`
- Singapore 확인: `content: refresh Singapore verification`
- 고양 운영 공지: `content: refresh Goyang operations`

## 공연 후 아카이브 게이트

1. 10월 7일 공연 후에는 `src/data/archive/goyang-2026-10-07.json`, 10월 8일 공연 후에는 `src/data/archive/goyang-2026-10-08.json`을 각각 추가한다.
2. 각 파일은 `post-show` 상태, 실제 공연 곡의 순서 목록, 최소 두 개의 검증 출처, 실제 확인 날짜를 포함해야 한다.
3. 두 파일이 모두 존재하고 감사에 통과하기 전에는 `src/data/concert/goyang-2026.json`의 `archivePublished`를 `true`로 바꾸지 않는다.
4. 두 파일을 추가한 뒤 `npm run audit:content && npm run build`를 다시 실행한다. 두 게이트가 모두 통과한 경우에만 양일 아카이브를 공개한다.

## Cloudflare 정적 배포 운영

배포는 GitHub Actions가 한다. `main`에 push하면 `verify` job이 통과한 뒤 `deploy` job이 `npm run deploy`(= `assert-production-origin` → `build` → `wrangler deploy`)를 실행한다. 사람이 로컬에서 `npm run deploy`를 돌릴 일은 없다.

1. 프로덕션 origin은 리포 variable `PUBLIC_SITE_URL`에 있다(현재 `https://weeknd-goyang-guide.yongveloper.workers.dev`). `deploy` job이 이 값으로 다시 빌드하므로 canonical URL·sitemap·OG URL이 실제 게시 origin을 가리킨다. `verify` job은 `https://fan-guide.test`로 빌드한다 — CI를 origin 설정과 무관하게 유지하기 위한 것이고, origin은 예산·i18n 검사 결과에 영향을 주지 않는다.
2. 자격 증명은 리포 secret `CLOUDFLARE_API_TOKEN`(Workers Scripts: Edit)과 `CLOUDFLARE_ACCOUNT_ID`에 있다.
3. `wrangler.jsonc`는 `assets.directory: "./dist"`와 `run_worker_first: false`만으로 정적 자산을 제공한다. `main`, assets binding, SSR adapter, Functions route를 추가하지 않는다. `public/_headers`는 `dist/_headers`로 복사되어 정적 응답의 보안·캐시 정책을 제공한다.
4. 배포 후 실제 origin에서 canonical URL, sitemap, OG URL과 Kakao/X 미리보기를 점검한다.
5. 되돌리려면 `git revert` 후 `main`에 push한다. CD가 이전 상태를 다시 게시한다.
6. 로컬 확인은 `npx wrangler deploy --dry-run`까지만 한다. 구성과 `dist/`를 검증하며 게시하지 않는다.
7. 커스텀 도메인으로 옮길 때는 Cloudflare에 도메인을 연결하고 리포 variable `PUBLIC_SITE_URL`을 새 origin으로 바꾼 뒤 `main`에 push한다. 워크플로는 손대지 않는다.
