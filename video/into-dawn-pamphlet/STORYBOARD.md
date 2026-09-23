---
format: 1080x1920
duration: 19.6s
message: "위켄드 팬과 고양 공연 관객을 위한 공연 팸플릿"
arc: Cover → Contents → Chapter 1 (discover · setlist) → Chapter 2 → Chapter 3 → Back cover
audience: The Weeknd 팬, 2026-10-07/08 고양종합운동장 공연 관객
mode: collaborative
music: none
---

## Changes from v2

- 사용자: "A,B안 Discover페이지 소개가 너무 초반 앞 부분만 나와서 Discover 페이지 내용이 부실해보여 … 섹션별로 … 결국 쓰윽 다 내리거나, 중간에 "연표는 가볍게,필요하면 더 깊게" 섹션의 앨범중 하나의 더 깊이보기까지 펼치는 장면도 있으면 좋겠어." → discover 컷을 섹션별 정거장 스크롤 + 2020 After Hours 더 깊이 보기 펼침으로 확장, 컷 길이 연장(전체 15s → A 17.4s / B 17s).
- 사용자: "B의 End 컷은 디자인이 너무 단순해보여. 우리 서비스에서 사용하는 배경 구름이나 그런걸 같이 노출해주면 좋을 거 같아." → B 06 배경에 사이트 홈 하늘(구름 + 일식) 캡처.

## Changes from v3

- 사용자: 장면이 빠르게 넘어간다는 피드백 후 절충안 채택("A로 가보자") — 읽어야 하는 컷의 끝 멈춤만 늘림: discover 4.6→4.9s, 셋리스트·가는 길·티켓 2.2→2.6s, 뒤표지 2.2→2.9s (전체 17.4→19.6s). 표지·차례는 그대로. 17.4s 버전은 versions/into-dawn-pamphlet-17s/ 에 보관.

## Video direction

- **palette** (from `frame.md`): ground `ink-black` #0B0B0A (site night); text `cream` #F1EEE7; secondary text `cream-muted` #C0BEB7; the ONE accent `fire-orange` = site gold #DAB17A — chapter numerals, kickers, the 예상 · 보장 아님 badge, highlight bars, CTA words only; hairlines `border-dark` #2A2926. Site screenshots and the eclipse footage carry their own photographic warmth; nothing else adds color.
- **type**: Bebas Neue for Latin display and numerals (01/02/03, INTO:DAWN, D-14); Noto Sans KR 800 for Korean headlines, 500–700 for sub-lines, 700 + 0.14em tracking for kickers. Every Korean line must be readable on a phone: headline ≥ ~7cqw, sub-lines ≥ ~4.5cqw.
- **motion grammar**: smooth long-tail settles (`power3`-family), no bounce, no overshoot. Entrances are short rises / fades (~0.3–0.5s); screen captures move as a **camera pan inside a masked window** (content scrolls, the window stays put). One continuous film: the same entrance distance and ease everywhere.
- **reveal model (silent video)**: there is no voiceover, so reveals follow the **reading order** of the on-screen text — kicker → headline → sub-line → evidence. At t=0 only the first element enters; never more than one new element per ~0.3s; the evidence (screen / ticket) arrives in the back half and ends in a still read.
- **holds**: every frame ends on a still read of ≥ 0.4s. Motion allowed during a hold: the eclipse footage itself (it is the subject), nothing else — no breathing cards, no drift.
- **safe zones (Instagram Reels UI)**: all text and key screen content between 12% and 80% of the height and left of 86% of the width. Nothing important in the bottom 20% (caption / buttons) or the right 14% (like / share rail).
- **negative list**: no drop shadows, glows, gradients, bokeh, glass or "AI" textures; no cursor or browser chrome; no album cover lifted out of a site screen and enlarged; no creator emails (footer crop stops above them); no official logos or posters; no unconfirmed ops info. Failure modes to avoid: slideshow (everything dumped at t=0 then frozen) and screensaver (several things floating independently).
- **audio**: silent (`music: none`, no SCRIPT.md). No sfx.
- **rhythm (A)**: F1 cover and F7 back cover are the calm bookends; F3–F6 share one chapter grammar (numeral → title → evidence) so the page-turn feels like one pamphlet; F6 (ticket) is the breather before the close.
- **seams (A)**: frame-to-frame `push-slide LEFT` = turning a page; every chapter frame enters with its numeral already moving the same direction (leftward settle) so the turn reads continuous.

## Changes from v1

- 사용자: "A랑B에 대해서 discover 페이지에 대한 내용이 필수로 있었으면 하는데 둘다 없어서 아쉬워." → discover 컷 추가, 15초 유지하고 컷 길이 재배분.
- 사용자: 앨범 커버는 "1로가" — 사이트 화면 캡처 속 커버는 그대로 사용, 따로 떼어 크게 쓰지 않음.

## Frame 1 — Cover

- scene: 팸플릿 표지. 사이트 일식 영상 위에 INTO:DAWN 워드마크와 공연 정보가 인쇄물처럼 놓인다
- voiceover: ""
- duration: 2.0s
- poster: 1.8s
- transition_in: cut
- status: animated
- src: compositions/frames/01-cover.html
- type: hook
- persuasion: Belonging — 같은 공연을 기다리는 사람의 물건
- beat: anticipation + belonging
- blueprint: logo-assemble-lockup (Adapt)
- focal: assets/eclipse-still.jpg
- roles: eclipse-still = background (full-bleed, dim ~55%, slow settle)
- asset_candidates: assets/eclipse-still.jpg — still from the site eclipse loop (t=1.5s), inside the frame so it turns with the page; assets/loop.mp4 — source clip (not placed: a hoisted video cannot follow the push-slide)

on-screen: "THE WEEKND · GOYANG 2026.10.07—08" (kicker) / "INTO:DAWN" (wordmark) / "고양 공연을 위한 팬 팸플릿" (sub).
narrativeRole: 첫 1초에 "이건 이 공연의 팸플릿"이라는 정체를 박는다.
keyMessage: 고양 공연 팸플릿.

Adapt: keep the signature "the mark comes to exist" — INTO:DAWN letters cascade up into a locked wordmark; drop the orbiting parts (flat plane system).
Scene 1 (0.0–0.7s): eclipse loop already playing full-bleed (dim ~55%); the kicker "THE WEEKND · GOYANG 2026.10.07—08" fades up at the upper-third (y≈17%), left-aligned; INTO:DAWN letters cascade up one by one into the lower-middle (y≈58%), display size ~80% of width — left-aligned editorial layout, 3 layers (footage / wordmark / kicker).
Scene 2 (0.7–1.3s): a 1px hairline self-draws left→right under the wordmark; "고양 공연을 위한 팬 팸플릿" rises onto it (Noto 800, ~6.5cqw).
Scene 3 (1.3–2.0s): held read — only the eclipse footage moves.

## Frame 2 — Contents

- scene: 팸플릿 첫 장을 넘기면 차례. 사이트 실제 차례 화면이 종이 한 장처럼 들어오고 세 장(章) 제목이 차례로 골드 하이라이트
- voiceover: ""
- duration: 2.0s
- poster: 2s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/02-contents.html
- type: product_intro
- persuasion: Rule of three — 공연 전 / 가는 길 / 기다림
- beat: clarity
- blueprint: grid-card-assemble (Adapt)
- focal: assets/screen-home-contents.png
- roles: screen-home-contents = cutout (paper card, masked window 86cqw × 86cqw)
- asset_candidates: assets/screen-home-contents.png — real 차례 screen with three chapters

on-screen: "차례" + 01 새벽을 맞기 전에 · 02 새벽으로 향하는 길 · 03 기다림을 담아두기 (the site's own chapter names).
narrativeRole: 메시지를 두 번째 비트에 완성 — 공연 전부터 당일, 기다림까지 한 권에 있다.
keyMessage: 필요한 게 세 장에 다 있다.

Adapt: the staggered list is the site's own contents screen; the cascade becomes a gold bar stepping 01 → 02 → 03 as each chapter label passes it.
Scene 1 (0.0–0.4s): kicker "PAGE 02" and the headline "차례" (Noto 800, ~10cqw) rise at the upper-left (y≈14–18%).
Scene 2 (0.4–0.9s): the contents screen, cropped below its own "차례" row, slides up into a masked card below the headline (y≈30–78%); the gold bar sits outside the card's left edge beside "새벽을 맞기 전에".
Scene 3 (0.9–2.0s): inside the card the screen pans up so 새벽으로 향하는 길 and 기다림을 담아두기 pass the bar line; the bar steps to each chapter label as it crosses (keyword-glow feel, no scale) and holds on 기다림을 담아두기 for the last ~0.4s.

## Frame 3 — Chapter 01 · The Weeknd를 한 장씩

- scene: 장 번호 01이 찍힌 뒤 제목이 위로 접히고, 넓어진 창에서 discover 페이지 전체가 섹션별로 멈추며 내려간다 — 정규 앨범 6장 → 두 개의 Trilogy → 연표(2020 After Hours "더 깊이 보기"가 열림) → 용어 한 장·보는 음악
- voiceover: ""
- duration: 4.9s
- poster: 3.0s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/03-meet-the-weeknd.html
- type: feature_showcase
- persuasion: Show-don't-tell proof — 섹션마다 이렇게 설명해 준다
- beat: curiosity + ease
- blueprint: transcript-scroll-artifact-reveal (Adapt)
- focal: assets/screen-discover-scroll-closed.png
- roles: screen-discover-scroll-closed = focal (masked window, scrolled) · screen-discover-scroll-open = supporting (swapped in at the After Hours expand, identical above image-y 14229)
- asset_candidates: assets/screen-discover-scroll-closed.png — whole /discover/ page, all disclosures closed (anchors in asset-descriptions); assets/screen-discover-scroll-open.png — same page with 2020 After Hours "더 깊이 보기" opened

on-screen: "01 새벽을 맞기 전에" / "The Weeknd를 한 장씩 넘겨 보기" (site heading) / gold section label that follows the scroll: "정규 앨범 6장" → "두 개의 Trilogy" → "연표 · 앨범마다 더 깊이 보기" → "용어 한 장 · 보는 음악".
narrativeRole: discover가 섹션마다 무엇을 설명해 주는지 — "이렇게 설명해 주는구나"를 느끼게 한다.
keyMessage: 공연 전에 위켄드를 3분 만에, 섹션별로.

Adapt: keep the vertical travel along one long real surface; the travel becomes STATIONS (hold on each section heading, fast velocity-matched scroll between) plus one in-place disclosure opening.
Scene 1 (0.0–0.5s): the gold numeral "01" settles in from the right (y≈12%), same chapter grammar.
Scene 2 (0.5–0.9s): "새벽을 맞기 전에" (~8cqw) rises at y≈38%, then "The Weeknd를 한 장씩 넘겨 보기" (muted).
Scene 3 (0.9–1.2s): the numeral + title block condenses upward into a compact header (numeral ~18cqw at y≈12%, title beside/under it) while the masked window grows from y≈51% up to y≈30% (bottom stays ≈79%) — more page on screen.
Scene 4 (1.2–1.7s): station 1 — the window shows the page top → "정규 앨범 6장" list (years, titles, covers at on-site size); gold section label (y≈81%) reads "정규 앨범 6장".
Scene 5 (1.7–2.2s): fast decelerating scroll to station 2 — "두 개의 Trilogy를 헷갈리지 않기" with 초기 3부작; label swaps to "두 개의 Trilogy".
Scene 6 (2.2–3.6s): scroll to station 3 — "연표는 가볍게, 필요하면 더 깊게", continuing down to the 2020 · After Hours entry (label "연표 · 앨범마다 더 깊이 보기"); at ~2.8s its "더 깊이 보기" row opens in place: the open strip takes over and its panel (접기 + two paragraphs) unmasks top-to-bottom while the content below slides down ~936 image-px — reads as the disclosure opening. Hold the open panel ~0.5s.
Scene 7 (3.6–4.2s): scroll on to station 4 — "용어 한 장" and "보는 음악"; label "용어 한 장 · 보는 음악".
Scene 8 (4.2–4.6s): held read.

## Frame 4 — Chapter 01 · 예상 셋리스트

- scene: 같은 장(01)의 다음 쪽. 작은 "01 · 새벽을 맞기 전에" 라벨 아래 실제 예상 셋리스트 화면이 위로 흘러간다. "예상 · 보장 아님" 배지가 고정
- voiceover: ""
- duration: 2.6s
- poster: 1.6s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/04-setlist.html
- type: feature_showcase
- persuasion: Show-don't-tell proof
- beat: curiosity
- blueprint: transcript-scroll-artifact-reveal (Reproduce)
- focal: assets/screen-home-setlist.png
- roles: screen-home-setlist = focal (masked window) · screen-setlist-top = supporting (source of the badge wording only; the badge itself is typeset in frame.md style)
- asset_candidates: assets/screen-home-setlist.png — real numbered 38-song expected setlist; assets/screen-setlist-top.png — setlist page top with the 예상 · 보장 아님 badge

on-screen: "01 · 새벽을 맞기 전에" (kicker) / "예상 셋리스트 38곡" / badge "예상 · 보장 아님".
narrativeRole: 팬이 제일 궁금한 것(무슨 곡?)을 먼저 보여 준다. 예상임을 분명히.
keyMessage: 공연 전에 곡을 미리 만난다.

Scene 1 (0.0–0.4s): kicker "01 · 새벽을 맞기 전에" and the headline "예상 셋리스트" (Noto 800, ~10cqw) rise at the upper-left (y≈14–18%) — the same page as F3, so no big numeral.
Scene 2 (0.4–0.8s): "38곡 · 최근 2026년 공연 5회 비교" (muted) rises; the gold outline badge "예상 · 보장 아님" settles in under it (y≈32%) and stays pinned for the rest of the frame.
Scene 3 (0.8–2.2s): the masked window (y≈39–79%) shows the numbered list starting at 1. Baptized in Fear and pans up to about song 14, decelerating; a short fade at the window's lower edge; still read for the last ~0.4s.

## Frame 5 — Chapter 02 · 새벽으로 향하는 길

- scene: 장 번호 02. 실제 콘서트 가이드 목록(공식 공연 정보·가는 길·좌석·준비물·귀가)이 한 줄씩 들어오고, 한 줄 요약이 얹힌다
- voiceover: ""
- duration: 2.6s
- poster: 1.8s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/05-road-to-dawn.html
- type: feature_showcase
- persuasion: Friction reduction
- beat: relief + control
- blueprint: grid-card-assemble (Adapt)
- focal: assets/screen-home-guide.png
- roles: screen-home-guide = focal (masked window) · screen-goyang-official = unused in motion (kept as the source of the 대화역 line)
- asset_candidates: assets/screen-home-guide.png — real 콘서트 가이드 list; assets/screen-goyang-official.png — 공식 공연 정보 with 10/7·8, venue, 18:45 / 19:45

on-screen: "02 새벽으로 향하는 길" / "가는 길부터 귀가까지" / "3호선 대화역 3번 출구 · 도보 3분" (official, from the site's transport section).
narrativeRole: 고양에 가는 사람의 실용 불안(어떻게 가고 어떻게 오지)을 덜어 준다.
keyMessage: 당일 동선이 한 장에.

Adapt: the five guide rows of the real screen reveal row by row instead of separate cards.
Scene 1 (0.0–0.5s): the gold numeral "02" settles in from the right (y≈12%).
Scene 2 (0.5–0.9s): "새벽으로 향하는 길" (~8cqw) rises at y≈38%, then "가는 길부터 귀가까지" (muted).
Scene 3 (0.9–1.3s): the gold line "3호선 대화역 3번 출구 · 도보 3분" reveals word by word at y≈48%.
Scene 4 (1.3–2.2s): the guide screen (y≈54–79%) reveals its rows top to bottom — 공식 공연 정보 / 가는 길 / 좌석 안내 … — each row unmasking in turn; still read for the last ~0.4s.

## Frame 6 — Chapter 03 · 기다림을 담아두기

- scene: 장 번호 03. 실제로 생성한 D-day 티켓이 팸플릿 사이에 끼워진 티켓처럼 기울어져 들어온다
- voiceover: ""
- duration: 2.6s
- poster: 1.8s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/06-keep-the-wait.html
- type: benefit_highlight
- persuasion: Ownership — 내 곡 세 개로 만든 내 티켓
- beat: excitement
- blueprint: titlecard-reveal (Adapt)
- focal: assets/screen-ticket-export.png
- roles: screen-ticket-export = focal (cutout, ~92% width)
- asset_candidates: assets/screen-ticket-export.png — generated D-day ticket (D-14, 2026.10.07, Starboy / Wicked Games / Less Than Zero)

on-screen: "03 기다림을 담아두기" / "나만의 D-day 티켓".
narrativeRole: 기다리는 시간에도 쓸 거리가 있다 → 저장·공유 동기.
keyMessage: 기다림도 팸플릿의 일부.

Adapt: the ONE restrained move is the ticket sliding in and settling at a slight tilt, like a ticket tucked into a pamphlet.
Scene 1 (0.0–0.5s): the gold numeral "03" settles in from the right (y≈12%).
Scene 2 (0.5–0.8s): "기다림을 담아두기" (~8cqw) rises at y≈38%, then "나만의 D-day 티켓" (muted).
Scene 3 (0.8–1.5s): the generated ticket slides in from the lower right and settles at about −6° across y≈55–72%, D-14 and the three song titles readable.
Scene 4 (1.5–2.2s): held read — the breather before the close.

## Frame 7 — Back cover

- scene: 뒤표지. 팬의 한마디 한 줄이 조용히 놓이고, INTO:DAWN · 비공식 팬 가이드 · 프로필 링크
- voiceover: ""
- duration: 2.9s
- poster: 2s
- transition_in: crossfade
- status: animated
- src: compositions/frames/07-back-cover.html
- type: cta
- persuasion: Belonging — FROM ONE FAN TO ANOTHER
- beat: warmth + urgency-to-act
- blueprint: titlecard-reveal (Reproduce)
- focal: assets/poster.webp
- roles: poster.webp = background (full-bleed, dim ~35%)
- asset_candidates: assets/poster.webp — eclipse poster still (site hero poster)

on-screen: "모르는 곡이 있어도 괜찮아요." / "FROM ONE FAN TO ANOTHER" / "INTO:DAWN · 비공식 팬 가이드" / "프로필 링크에서".
narrativeRole: 팬끼리의 톤으로 닫고, 비공식임을 밝히고, 행동(링크)을 남긴다.
keyMessage: 팬이 팬에게 주는 팸플릿.

Scene 1 (0.0–0.7s): eclipse still (dim ~35%); kicker "FROM ONE FAN TO ANOTHER" fades up at y≈24%; "모르는 곡이 있어도 / 괜찮아요." rises line by line (Noto 800, ~8.6cqw) at y≈28–38%.
Scene 2 (0.7–1.1s): the muted line "가장 크게 남는 순간은, 눈앞에서 밤이 새벽으로 바뀌는 장면일 테니까요." rises at y≈43%, kept left of the right rail.
Scene 3 (1.1–1.6s): a hairline self-draws at y≈62%; INTO:DAWN (Bebas ~15cqw) rises onto it; "비공식 팬 가이드 · 프로필 링크에서" (gold on the CTA words) follows.
Scene 4 (1.6–2.2s): final held read to the end — no exit fade (Reels loops back to the cover).

