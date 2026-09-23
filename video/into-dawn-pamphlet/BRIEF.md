---
workflow: product-launch-video
flow: automation
storyboard: yes
message: "위켄드 팬과 고양 공연 관객을 위한 공연 팸플릿"
destination: instagram-reels
aspect: 1080x1920
language: ko
audience: "The Weeknd 팬, 2026-10-07/08 고양종합운동장 공연 관객"
length: 15s
angle: pamphlet-page-turn
---

## Intent

A안 — 공연 팸플릿을 넘기듯: 표지 → 목차 → 장(章) 넘김. 각 장 안에 사이트 실제 모바일 화면이 들어간다. 사이트 홈이 이미 '팸플릿 목차' 구조라 그 구조를 영상의 뼈대로 쓴다.
POV 형식이 아니다. 홍보 광고보다 "이 공연을 위한 팸플릿"이라는 목적이 드러나야 한다.
사이트: INTO:DAWN — The Weeknd 2026 고양 공연 비공식·비영리 팬 가이드
(https://weeknd-goyang-guide.yongveloper.workers.dev).

## Assets

- ../../src/styles/tokens.css, ../../src/styles/edition.css, ../../docs/new-edition-design.md — 사이트 디자인 시스템(브랜드 기준). 프리셋 색·폰트는 이 토큰으로 대체.

## Customizations

- discover 페이지(3분 만에 The Weeknd 알기 — 정규 앨범 6장, 두 개의 Trilogy) 컷 필수 — 2026-09-23 사용자 요청.

- 팸플릿 프레임(표지·목차·장 번호) 위에 실제 캡처 화면을 얹는다.
- 모바일 폭(390px) 캡처를 사용한다.

## Notes

- 무음 렌더: 음악·내레이션 없음. 음악은 사용자가 인스타 음악 라이브러리에서 얹는다(위켄드 음원 파일 삽입 금지 — 저작권). 컷 간격은 약 2~3초의 일반 템포.
- 셋리스트가 보이는 컷에는 반드시 "예상 · 보장 아님" 표기.
- 마지막 컷에 "비공식 팬 가이드" 표기. 공식 로고·공식 포스터 사용 금지. 앨범 커버는 사이트 화면 캡처 속에 보이는 그대로만 사용(따로 떼어 크게 쓰지 않음) — 2026-09-23 사용자 결정.
- 공식 미발표 운영 정보(게이트·반입금지·셔틀 시간 등)를 확정 사실처럼 쓰지 않는다.
- 자막은 폰에서 읽히게 크게, 한 화면 한 줄 위주. 한국어.
- 비교용 자매 프로젝트: ../into-dawn-tour/
