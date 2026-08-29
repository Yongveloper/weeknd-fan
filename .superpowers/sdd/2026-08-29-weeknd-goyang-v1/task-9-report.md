# Task 9 report — Goyang Day-of Guide

## Scope

- Added only Task 9 guide content, components, route, required source records, and navigation coverage.
- Did not implement Task 10 source/audit publication work.

## Authoritative sources consulted (2026-08-29)

- Live Nation Korea: <https://www.livenation.kr/en/event/the-weeknd-after-hours-til-dawn-tour-seoul-tickets-edp1672877>
- NOL Ticket official notice: <https://tickets.interpark.com/contents/notice/detail/14180>
- Hyundai Card announcement: <https://newsroom.hyundaicard.com/front/board/%E2%80%9821%EC%84%B8%EA%B8%B0-%EA%B0%80%EC%9E%A5-%EC%98%81%ED%96%A5%EB%A0%A5-%EC%9E%88%EB%8A%94-%EA%B8%80%EB%A1%9C%EB%B2%8C-%ED%8C%9D%EC%8A%A4%ED%83%80%2C-%EC%9C%84%EC%BC%84%EB%93%9C-%EC%98%A8%EB%8B%A4%E2%80%99)>
- Goyang public sports facilities: <https://www.goyang.go.kr/www/www03/www03_11/www03_11_7.jsp>
- Goyang BIS: <https://bis.goyang.go.kr/m>
- Korail metropolitan rail map: <https://dev2.letskorail.com/images/subway_map.pdf>
- Public map link supplied for current position lookup: <https://map.kakao.com/?q=%EA%B3%A0%EC%96%91%EC%A2%85%ED%95%A9%EC%9A%B4%EB%8F%99%EC%9E%A5>

## Facts vs. unknowns

- `official`: dates, venue, Creepy Nuts, scheduled times, age restriction, and NOL ticket source.
- Route options only: Daehwa Station, GTX-A transfer comparison, and bus lookup. No travel duration, capacity, or final-service guarantee is stated.
- `unpublished`: entry gates, prohibited items, shuttle/traffic control, accessibility support, and standing/Early Entry operation. No other-event rules were copied.

## TDD

- RED: `npm run build && npm run test:e2e -- navigation.spec.ts` failed on the absent `/goyang/#transport` content (six expected guide assertions failed across desktop/mobile).
- GREEN: after the route/content implementation, focused navigation coverage passed: 30/30.

## Visual checks

- Inspected full-page desktop and Pixel 7 screenshots at `/goyang/#transport`.
- Anchored headings remain text-first; the original schematic is readable at both widths. Map uses semantic SVG title/description and contains no copied map artwork.

## Verification

- Node `v22.14.0`
- `npm run verify` — 37 passed, 1 intentionally skipped mobile-only duplicate project case.
- `git diff --check` — clean.

## Commit

- `feat(guide): add Goyang concert day guide`

## Limitations

- Transit schedules and event operations remain volatile. Users must recheck live services and organizer notices immediately before travel.

## Fix round 1

- Added the global `practical` trust status (`실용 안내`) to the typed contract and content schema. Transport, return, and packing now use it; confirmed core facts remain `공식 확정`, while operation-dependent arrival and pending items remain `미공개 · 확인 필요`.
- Added RED/GREEN browser coverage for all three displayed labels and for transport, packing, and return headings settling fully inside both desktop and mobile viewports after fragment navigation.
