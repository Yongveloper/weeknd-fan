---
format: 1080x1920
duration: 19.2s
message: "위켄드 팬과 고양 공연 관객을 위한 공연 팸플릿"
arc: Hook (real home) → Demo cycle: discover → setlist → guide → ticket → CTA
audience: The Weeknd 팬, 2026-10-07/08 고양종합운동장 공연 관객
mode: collaborative
music: none
---

## Changes from v2

- 사용자: "A,B안 Discover페이지 소개가 너무 초반 앞 부분만 나와서 Discover 페이지 내용이 부실해보여 … 섹션별로 … 결국 쓰윽 다 내리거나, 중간에 "연표는 가볍게,필요하면 더 깊게" 섹션의 앨범중 하나의 더 깊이보기까지 펼치는 장면도 있으면 좋겠어." → discover 컷을 섹션별 정거장 스크롤 + 2020 After Hours 더 깊이 보기 펼침으로 확장, 컷 길이 연장(전체 15s → A 17.4s / B 17s).
- 사용자: "B의 End 컷은 디자인이 너무 단순해보여. 우리 서비스에서 사용하는 배경 구름이나 그런걸 같이 노출해주면 좋을 거 같아." → B 06 배경에 사이트 홈 하늘(구름 + 일식) 캡처.

## Changes from v3

- 사용자: "B도 늘려줘" — A와 같은 절충안: 읽어야 하는 컷의 끝 멈춤만 늘림: discover 4.5→4.8s, 셋리스트·가이드·티켓 2.5→2.9s, 끝 카드 2.5→3.2s (전체 17→19.2s). 첫 화면은 그대로. 17s 버전은 versions/into-dawn-tour-17s/ 에 보관.

## Video direction

- **palette** (from `frame.md`): ground `ink-black` #0B0B0A (site night); text `cream` #F1EEE7; secondary text `cream-muted` #C0BEB7; the ONE accent `fire-orange` = site gold #DAB17A — chapter numerals, kickers, the 예상 · 보장 아님 badge, highlight bars, CTA words only; hairlines `border-dark` #2A2926. Site screenshots and the eclipse footage carry their own photographic warmth; nothing else adds color.
- **type**: Bebas Neue for Latin display and numerals (01/02/03, INTO:DAWN, D-14); Noto Sans KR 800 for Korean headlines, 500–700 for sub-lines, 700 + 0.14em tracking for kickers. Every Korean line must be readable on a phone: headline ≥ ~7cqw, sub-lines ≥ ~4.5cqw.
- **motion grammar**: smooth long-tail settles (`power3`-family), no bounce, no overshoot. Entrances are short rises / fades (~0.3–0.5s); screen captures move as a **camera pan inside a masked window** (content scrolls, the window stays put). One continuous film: the same entrance distance and ease everywhere.
- **reveal model (silent video)**: there is no voiceover, so reveals follow the **reading order** of the on-screen text — kicker → headline → sub-line → evidence. At t=0 only the first element enters; never more than one new element per ~0.3s; the evidence (screen / ticket) arrives in the back half and ends in a still read.
- **holds**: every frame ends on a still read of ≥ 0.4s. Motion allowed during a hold: the eclipse footage itself (it is the subject), nothing else — no breathing cards, no drift.
- **safe zones (Instagram Reels UI)**: all text and key screen content between 12% and 80% of the height and left of 86% of the width. Nothing important in the bottom 20% (caption / buttons) or the right 14% (like / share rail).
- **negative list**: no drop shadows, glows, gradients, bokeh, glass or "AI" textures; no cursor or browser chrome; no album cover lifted out of a site screen and enlarged; no creator emails (footer crop stops above them); no official logos or posters; no unconfirmed ops info. Failure modes to avoid: slideshow (everything dumped at t=0 then frozen) and screensaver (several things floating independently).
- **audio**: silent (`music: none`, no SCRIPT.md). No sfx.
- **rhythm (B)**: the phone is the protagonist and stays in the SAME place (centered, lower 70%) in F1–F4 — only its screen content changes and the captions above swap; F5 breaks the pattern (ticket jumps out of the phone), F6 closes without the phone.
- **device**: registry component `browser-device-stage` (phone variant), token-native chrome in `border-dark`; screen slot holds the captured screen as an `<img>` panned inside the slot.

## Changes from v1

- 사용자: "A랑B에 대해서 discover 페이지에 대한 내용이 필수로 있었으면 하는데 둘다 없어서 아쉬워." → discover 컷 추가, 15초 유지하고 컷 길이 재배분.
- 사용자: 앨범 커버는 "1로가" — 사이트 화면 캡처 속 커버는 그대로 사용, 따로 떼어 크게 쓰지 않음.

## Frame 1 — Open the guide

- scene: 폰 화면 그대로의 사이트 첫 화면(AFTER HOURS / TIL DAWN). 위에 한 줄 자막
- voiceover: ""
- duration: 2.5s
- poster: 2s
- transition_in: cut
- status: animated
- src: compositions/frames/01-open.html
- type: hook
- persuasion: Show-don't-tell
- beat: anticipation
- blueprint: device-surface-showcase (Adapt)
- focal: assets/screen-home-hero-live.png
- roles: screen-home-hero-live = focal (inside browser-device-stage screen slot) · loop.mp4 = unused (the captured hero already shows the eclipse)
- asset_candidates: assets/screen-home-hero-live.png — real phone home screen with the neon title; assets/loop.mp4 — eclipse loop (can play inside the hero area)

on-screen: "위켄드 고양 공연 가는 사람" / "팸플릿 먼저 펼쳐 보기".
narrativeRole: 실제 사이트가 첫 화면 — 무엇인지 1초에 보인다.
keyMessage: 고양 공연용 팬 팸플릿이 있다.

Adapt: keep the held device surface as the hero; the "flow" is the site's own pages across F1–F4.
Scene 1 (0.0–0.7s): the phone (registry `browser-device-stage`, phone variant) rises from below into its fixed seat — centered, y≈27–90% but its important screen area above 80% — showing the real home hero (AFTER HOURS / TIL DAWN).
Scene 2 (0.7–1.2s): "위켄드 고양 공연 가는 사람" (Noto 800, ~6.2cqw) rises at y≈13%.
Scene 3 (1.2–1.8s): "팸플릿 먼저 펼쳐 보기" (gold) rises under it.
Scene 4 (1.8–2.5s): held read.

## Frame 2 — Meet The Weeknd

- scene: 폰 속 실제 discover 화면이 섹션별로 멈추며 끝까지 내려간다 — 한 장씩 넘겨 보기 → 정규 앨범 6장 → 두 개의 Trilogy → 연표(2020 After Hours "더 깊이 보기"가 열림) → 용어 한 장·보는 음악
- voiceover: ""
- duration: 4.8s
- poster: 2.8s
- transition_in: crossfade
- status: animated
- src: compositions/frames/02-discover.html
- type: feature_showcase
- persuasion: Show-don't-tell proof — 섹션마다 이렇게 설명해 준다
- beat: curiosity + ease
- blueprint: transcript-scroll-artifact-reveal (Adapt)
- focal: assets/screen-discover-scroll-closed.png
- roles: screen-discover-scroll-closed = focal (inside the phone screen slot, scrolled) · screen-discover-scroll-open = supporting (swapped in at the After Hours expand)
- asset_candidates: assets/screen-discover-scroll-closed.png — whole /discover/ page, all disclosures closed; assets/screen-discover-scroll-open.png — same page with 2020 After Hours "더 깊이 보기" opened

on-screen: line 1 (fixed) "3분 만에 The Weeknd 알기" / line 2 (gold, swaps with the scroll) "한 장씩 넘겨 보기" → "정규 앨범 6장" → "두 개의 Trilogy" → "연표 · 앨범마다 더 깊이 보기" → "용어 한 장 · 보는 음악".
narrativeRole: discover가 섹션마다 무엇을 설명해 주는지 — "이렇게 설명해 주는구나"를 느끼게 한다.
keyMessage: 공연 전에 위켄드를 3분 만에, 섹션별로.

Adapt: the long surface scrolls INSIDE the fixed phone as stations (hold on each section, fast velocity-matched scroll between) plus one in-place disclosure opening. The phone never moves (shared seat).
Scene 1 (0.0–0.6s): caption line 1 "3분 만에 The Weeknd 알기" in, line 2 "한 장씩 넘겨 보기"; the screen slot cross-dissolves to the discover page top.
Scene 2 (0.6–1.2s): scroll to "정규 앨범 6장" (list with covers); line 2 swaps to "정규 앨범 6장".
Scene 3 (1.2–1.8s): scroll to "두 개의 Trilogy를 헷갈리지 않기"; line 2 → "두 개의 Trilogy".
Scene 4 (1.8–3.3s): scroll through "연표는 가볍게, 필요하면 더 깊게" to the 2020 · After Hours entry; line 2 → "연표 · 앨범마다 더 깊이 보기"; at ~2.4s its "더 깊이 보기" opens in place (open strip takes over, panel unmasks top-to-bottom, content below slides down ~936 image-px); hold the open panel ~0.5s.
Scene 5 (3.3–4.0s): scroll to "용어 한 장" / "보는 음악"; line 2 → "용어 한 장 · 보는 음악".
Scene 6 (4.0–4.5s): held read.

## Frame 3 — Expected setlist

- scene: 실제 셋리스트 화면을 위로 스크롤. "예상 · 보장 아님" 배지에서 잠깐 멈춤
- voiceover: ""
- duration: 2.9s
- poster: 1.5s
- transition_in: crossfade
- status: animated
- src: compositions/frames/03-setlist.html
- type: feature_showcase
- persuasion: Show-don't-tell proof
- beat: curiosity
- blueprint: transcript-scroll-artifact-reveal (Reproduce)
- focal: assets/screen-setlist-top.png
- roles: screen-setlist-top = focal (screen slot) · screen-home-setlist = unused
- asset_candidates: assets/screen-setlist-top.png — setlist page with 예상 · 보장 아님 badge; assets/screen-home-setlist.png — numbered 38-song list

on-screen: "예상 셋리스트 38곡" / "예상 · 보장 아님".
narrativeRole: 가장 궁금한 정보부터.
keyMessage: 곡을 미리 만난다.

Scene 1 (0.0–0.5s): caption "예상 셋리스트 38곡" swaps in; the gold badge "예상 · 보장 아님" settles under it (pinned).
Scene 2 (0.5–1.9s): the screen slot shows the setlist page top (its own 예상 · 보장 아님 badge visible) and scrolls down to 곡 목록 and the first song card, decelerating.
Scene 3 (1.9–2.5s): held read.

## Frame 4 — Concert guide

- scene: /goyang/ 실제 화면. 공식 공연 정보(일정·장소·시간)를 줌인, 이어서 가이드 목록
- voiceover: ""
- duration: 2.9s
- poster: 1.5s
- transition_in: crossfade
- status: animated
- src: compositions/frames/04-guide.html
- type: feature_showcase
- persuasion: Friction reduction
- beat: relief + control
- blueprint: camera-journey (Adapt)
- focal: assets/screen-goyang-top.png
- roles: screen-goyang-top = focal (screen slot) · screen-home-guide = unused
- asset_candidates: assets/screen-goyang-top.png — /goyang/ top with 공식 공연 정보; assets/screen-home-guide.png — 콘서트 가이드 list

on-screen: "가는 길 · 좌석 · 준비물 · 귀가" / "10.7–8 고양종합운동장".
narrativeRole: 당일 실용 정보가 다 있다.
keyMessage: 당일 동선이 한곳에.

Adapt: one motivated leg — a gentle push toward the phone's 공식 공연 정보 block, then land.
Scene 1 (0.0–0.5s): captions swap — "가는 길 · 좌석 · 준비물 · 귀가" then "10.7–8 고양종합운동장" (gold).
Scene 2 (0.5–1.9s): inside the slot the screen scrolls from 콘서트 가이드 to 공식 공연 정보 (일정 · 장소 lines) while the whole phone pushes in slightly (zoom-to-target on that block), decelerating.
Scene 3 (1.9–2.5s): held read.

## Frame 5 — D-day ticket

- scene: 실제 티켓 폼 → 생성된 D-day 티켓이 화면을 채운다
- voiceover: ""
- duration: 2.9s
- poster: 2s
- transition_in: crossfade
- status: animated
- src: compositions/frames/05-ticket.html
- type: benefit_highlight
- persuasion: Ownership
- beat: excitement
- blueprint: device-surface-showcase (Adapt)
- focal: assets/screen-ticket-export.png
- roles: screen-ticket-export = focal (cutout, ~94% width) · the F4 phone = background (dims to ~35%)
- asset_candidates: assets/screen-ticket-export.png — generated D-day ticket PNG

on-screen: "내 곡 3개로 D-day 티켓".
narrativeRole: 저장·공유 동기.
keyMessage: 기다림을 담는다.

Adapt: the pattern breaks — the artifact leaves the device.
Scene 1 (0.0–0.4s): caption "내 곡 3개로 D-day 티켓" swaps in; the phone dims to ~35%.
Scene 2 (0.4–1.3s): the ticket rises out of the phone and settles in front at about −5°, across y≈45–65%.
Scene 3 (1.3–2.5s): held read.

## Frame 6 — End card

- scene: 사이트 홈의 실제 하늘(구름 + 일식) 위에 풋터 블록, INTO:DAWN 워드마크, 프로필 링크
- voiceover: ""
- duration: 3.2s
- poster: 2s
- transition_in: crossfade
- status: animated
- src: compositions/frames/06-end.html
- type: cta
- persuasion: Belonging
- beat: warmth + urgency-to-act
- blueprint: titlecard-reveal (Reproduce)
- focal: assets/bg-home-sky.png
- roles: bg-home-sky = background (full-bleed, scaled ~1.25 anchored bottom, top darkened, dim ~55%) · screen-footer = supporting (crop: top block only; stop above the nav and emails)
- asset_candidates: assets/bg-home-sky.png — the site's own home sky (dawn clouds + eclipse); assets/screen-footer.png — real footer top block

on-screen: "INTO:DAWN" / "비공식 팬 가이드" / "프로필 링크에서".
narrativeRole: 사이트의 분위기(구름·일식) 속에서 정체(비공식)와 행동을 남긴다.
keyMessage: 링크로 와서 펼쳐 보기.

Scene 1 (0.0–0.6s): the site sky fades up full-bleed (the eclipse sits in the middle band, clouds low; the top darkened so the faint title ghost never shows); the real footer block fades up in a hairline card at y≈24–46% (card surface = the site's glass: dark translucent, not opaque).
Scene 2 (0.6–1.2s): a hairline self-draws at y≈52%; INTO:DAWN (Bebas ~18cqw) rises onto it.
Scene 3 (1.2–1.7s): "비공식 팬 가이드 · 프로필 링크에서" (gold on the CTA words) rises at y≈66%.
Scene 4 (1.7–2.5s): final held read — only the sky's clouds may drift very slowly (the site's own sky moves like this); no exit fade.

