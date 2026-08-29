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
