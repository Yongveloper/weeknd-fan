# Workstream B — Goyang Guide Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/goyang/` from a page of "check it yourself" sentences into a useful day-of guide: Interpark's official access data with a rebuilt schematic map, a click-to-load live map plus three directions deep links, the official seat map with a structural schematic and legend, and a five-tab "field tips" section built from attendee reviews — every fact sourced, review-based content clearly labelled as unconfirmed for this show.

**Architecture:** Content stays in the `guides` content collection (markdown + frontmatter `sources`) so the existing content audit keeps enforcing freshness and sourcing. New Astro components under `src/components/guide/` render the structured parts (access table, SVG map, live map, directions, seat map, tabs). `goyang.astro` orders sections and groups the five `section: 'tips'` entries into one `TipsTabs`.

**Tech Stack:** Astro 6 content collections (`glob` loader, zod), `astro:assets` `<Image>`, inline SVG, one small tabs script, Playwright e2e, Vitest content audit.

**Spec:** `docs/superpowers/specs/2026-08-30-uiux-motion-guide-design.md` — §6 and §9 (items 4, 6). Research inputs: `.superpowers/tmp/b-inputs/goyang-access.md`, `goyang-seatmap.md`, `goyang-tips-research.md` (copied into the worktree; read all three before Task 1).

## Global Constraints

- Node: run every command with `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH`.
- You work in worktree `/Users/yong/dev/weeknd-fan-b` on branch `ws/b-goyang-guide`. Dev server port **4332** (`npm run dev -- --port 4332`). E2E via `npx playwright test -c .superpowers/tmp/playwright.4342.config.ts` (preview on 4342, already created).
- **Owned files only** (spec §3.4 + §9.6): `src/pages/goyang.astro`, `src/components/guide/**`, `src/data/guides/**`, `src/data/sources/**` (add files only; never edit existing source JSON), `src/assets/guide/**` (new), `tests/e2e/goyang.spec.ts` (new), `tests/e2e/navigation.spec.ts` (Goyang assertions only). Do **not** edit `src/content.config.ts` (the `guides.section` enum already has `'seating'` and `'tips'`), `tests/e2e/no-js.spec.ts`, `tests/e2e/accessibility.spec.ts`, `src/components/home/GuideShortcuts.astro`. If you need another file, stop and report.
- Section ids that other pages link to and must keep existing: `#transport`, `#packing`, `#return` (home shortcuts), plus `#official`, `#pending`.
- Existing tests that constrain you:
  - `no-js.spec.ts` (unchangeable): `/goyang/` heading `가는 길` visible; text `아직 발표되지 않은 운영 정보` visible (it is in the page header paragraph — keep that sentence).
  - `navigation.spec.ts` (you may edit Goyang assertions): `#transport .guide-section__body` contains `대화역`; `#transport .status` text `실용 안내`; `#official .status` text `공식 확정`; `#pending .status` count 5 all `미공개 · 확인 필요`; `#venue-map title`/`desc` exact text (update to the new map's text); `getByText('공연 직전 막차 재확인')` (update to the new return heading). Home shortcut tests expect `/goyang/#transport|#packing|#return` headings `가는 길`, `준비물`, `귀가 확인` — **keep those three titles exactly**.
  - `accessibility.spec.ts`: axe no serious/critical on `/goyang/`.
  - `tests/unit/content-audit.test.ts` (`npm run audit:content`): every guide needs `sources` ≥ 1 resolving to existing source ids; `practical` guides must have `lastVerifiedAt` within 7 Seoul days of the test clock — use `2026-08-30` everywhere; sources need `lastCheckedAt`.
- Guide frontmatter shape (all fields required unless defaulted): `title, summary, status (official|practical|unpublished), lastVerifiedAt, sources[], relatedAlbums: [], relatedSongs: [], spoilerLevel: none, order (int), section`.
- Editorial rules (spec §6.1): no "직접 확인하세요" sentences; facts in declarative form with source; review-based sections carry the badge text **후기 기반 · 이 공연 미확정**; never present other concerts' rules as this show's rules.
- Copy attribution: every Interpark-derived block ends with a caption naming `인터파크 티켓 공연 상세` and linking `https://tickets.interpark.com/goods/26006903`.
- Budget: `npm run build && npm run budget` — raster total ≤ 1100KiB (currently ≈786KiB); the seat map's generated variants must add ≤ 200KiB in total. Third-party iframes only after a click.
- Add `data-enter` (single element) or `data-enter-group` (container whose children stagger) attributes where this plan says; do not write CSS/JS for them (workstream C owns that).
- Commit after each task with the given message. Do not push.

---

### Task 1: Sources + guide content rewrite (data only)

**Files:**
- Create: `src/data/sources/interpark-goods-26006903.json`, `gys-goyang-sports.json`, `namu-goyang-stadium.json`, `news-ohmynews-2025-04.json`, `news-daum-blackpink-refund.json`, `review-vitaria-coldplay-2025.json`, `review-dcinside-bigbang-2026.json`, `review-alljoylog-seatview.json`, `review-clien-bts-2026.json`, `review-tndlrs-hero-2026.json`, `review-moneyroan-bts-parking.json`, `review-teamblind-return.json`, `review-lingoculture-guide.json`, `interpark-standing-notice-08004615.json`
- Modify: `src/data/guides/01-official-info.md`, `10-transport.md`
- Delete: `src/data/guides/20-arrival.md`
- Rename+rewrite: `30-return.md` → `40-return.md`, `40-packing.md` → `50-packing.md`, `50-pending-operations.md` → `60-pending-operations.md`
- Create: `src/data/guides/20-seating.md`, `30-tips-standing.md`, `31-tips-seating.md`, `32-tips-entry.md`, `33-tips-return.md`, `34-tips-packing.md`
- Test: `npm run audit:content`, `npm run check`

**Interfaces:**
- Produces guide entries with `section` values `official | transport | seating | tips | return | packing | pending` and `order` 1, 10, 20, 30–34, 40, 50, 60. Later tasks read `entry.data.section`, `entry.data.title`, `entry.data.summary`, `<Content />`.

- [ ] **Step 1: Run the audit to see the current baseline**

Run: `npm run audit:content`
Expected: PASS (baseline).

- [ ] **Step 2: Source records**

Each file follows this shape (kind ∈ `official | public-agency | crowd-sourced | editorial-reference`):

```json
{
  "name": "인터파크 티켓 — 현대카드 슈퍼콘서트 28 The Weeknd 공연 상세",
  "url": "https://tickets.interpark.com/goods/26006903",
  "kind": "official",
  "lastCheckedAt": "2026-08-30"
}
```

Create the rest with these values (name / url / kind):

| file | name | url | kind |
| --- | --- | --- | --- |
| `gys-goyang-sports.json` | 고양도시관리공사 — 고양종합운동장 시설 안내 | `https://www.gys.or.kr/subpage/index/12` | `public-agency` |
| `namu-goyang-stadium.json` | 나무위키 — 고양종합운동장 주경기장 | `https://namu.wiki/w/고양종합운동장%20주경기장` | `editorial-reference` |
| `news-ohmynews-2025-04.json` | 오마이뉴스 — 콜드플레이 고양 공연 교통 현장 (2025-04) | `https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0003119116` | `editorial-reference` |
| `news-daum-blackpink-refund.json` | 다음뉴스 — 블랙핑크 고양 공연 시야 논란 환불 (2025-08) | `https://v.daum.net/v/20250816174638726` | `editorial-reference` |
| `review-vitaria-coldplay-2025.json` | 관람 후기 — 콜드플레이 고양 스탠딩 1일차 (2025-04) | `https://vitariaplus.com/entry/콜드플레이-내한-후기-2025-고양종합운동장-스탠딩-콜드플레이-내한-공연-첫째-날-리얼-후기` | `crowd-sourced` |
| `review-dcinside-bigbang-2026.json` | 커뮤니티 후기 — 고양종합운동장 관람 팁 모음 (2026-08) | `https://gall.dcinside.com/mgallery/board/view/?id=bigbangvip&no=270100` | `crowd-sourced` |
| `review-alljoylog-seatview.json` | 관람 후기 — 고양종합운동장 좌석별 시야 (2026-05 갱신) | `https://alljoylog.com/고양종합운동장-좌석별-시야/` | `crowd-sourced` |
| `review-clien-bts-2026.json` | 커뮤니티 후기 — BTS 고양 공연 3층 관람 (2026-04) | `https://www.clien.net/service/board/park/19176744` | `crowd-sourced` |
| `review-tndlrs-hero-2026.json` | 관람 후기 — 임영웅 고양 공연 입장·금지물품 (2026-07) | `https://www.tndlrs.com/2026/07/herolanding3.html` | `crowd-sourced` |
| `review-moneyroan-bts-parking.json` | 관람 후기 — BTS 고양 공연 교통·주차 (2026-04) | `https://moneyroan.com/bts-goyang-concert-traffic-parking-2026/` | `crowd-sourced` |
| `review-teamblind-return.json` | 커뮤니티 후기 — 고양종합운동장 공연 후 귀가 (2025-04) | `https://www.teamblind.com/kr/post/고양-종합운동장-콘서트-후-귀가-방법-추천-부탁-LwinPVPz` | `crowd-sourced` |
| `review-lingoculture-guide.json` | 관람 가이드 — 고양종합운동장 좌석·준비물 정리 | `https://lingoculture.kr/goyang-stadium-concert-seating-guide/` | `crowd-sourced` |
| `interpark-standing-notice-08004615.json` | 인터파크 — 타 공연 스탠딩 입장 안내 (사례) | `http://mticket.interpark.com/Goods/GoodsInfo/GoodsExpandPopup?GoodsCode=08004615&ViewMode=GoodsDetailHtml` | `editorial-reference` |

Percent-encode non-ASCII path characters if `z.url()` rejects a raw Korean URL (`encodeURI` the path segment; keep the host as-is). Run `npm run check` after creating them.

- [ ] **Step 3: `01-official-info.md`** — keep frontmatter, add `gys-goyang-sports` to `sources`, and append one bullet:

```md
- 규모: 주경기장 41,311석 (고양도시관리공사 시설 안내 기준)
```

- [ ] **Step 4: `10-transport.md`** — replace the whole file:

```md
---
title: 가는 길
summary: 3호선 대화역 3번 출구에서 도보 3분. 버스는 대화역 정류장이 노선이 가장 많습니다.
status: practical
lastVerifiedAt: 2026-08-30
sources:
  - interpark-goods-26006903
  - news-ohmynews-2025-04
  - goyang-bis
  - korail-metropolitan-map
relatedAlbums: []
relatedSongs: []
spoilerLevel: none
order: 10
section: transport
---

**대화역(3호선) 3번 출구**로 나오면 횡단보도 하나를 건너 운동장입니다. 2025년 4월 콜드플레이 공연 때는 역 일부 공사로 사용 가능한 출구가 줄어 있었습니다([오마이뉴스, 2025-04](https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0003119116)).

**GTX-A 킨텍스역 1번 출구**에서는 도보 약 20분입니다. 대형 공연 때 킨텍스역과 운동장 사이에 임시 셔틀이 운행된 사례가 있습니다(콜드플레이 2025-04: 킨텍스역 2번 출구, 2~3분 간격). 이번 공연의 셔틀 운행 여부는 아직 공지되지 않았습니다.

**버스**는 아래 표의 노선이 대화역 정류장과 고양종합운동장·일산서구청 정류장에 정차합니다. 실시간 도착은 [고양시 BIS](https://bis.goyang.go.kr/m)에서 조회합니다.
```

- [ ] **Step 5: `20-seating.md`** (new):

```md
---
title: 좌석 안내
summary: 인터파크 공식 좌석도와 구조 개략도, 등급 범례를 한 화면에 모았습니다.
status: official
lastVerifiedAt: 2026-08-30
sources:
  - interpark-goods-26006903
relatedAlbums: []
relatedSongs: []
spoilerLevel: none
order: 20
section: seating
---

플로어 전체가 스탠딩 A·B 두 구역이고, 무대에서 십자형 런웨이가 플로어 중앙까지 뻗어 나와 끝에 작은 B-스테이지가 있습니다. 스탠딩 앞줄 띠는 Early Entry Package 구역입니다.

스탠드는 1~3층 링으로, 구역 코드 앞 글자가 방향(E·W·N·T·S 계열), 숫자가 클수록 바깥쪽입니다. 무대 좌우 상단 코너가 시야제한석입니다. 구역별 등급은 원본 좌석도와 예매 페이지 기준입니다.
```

- [ ] **Step 6: Five tips files.** Common frontmatter (change `title`, `summary`, `order`, `sources`):

```md
---
title: 스탠딩
summary: 타 공연 후기에서 반복된 스탠딩 대기·입장·반입 경험입니다.
status: practical
lastVerifiedAt: 2026-08-30
sources:
  - review-vitaria-coldplay-2025
  - interpark-standing-notice-08004615
  - review-dcinside-bigbang-2026
relatedAlbums: []
relatedSongs: []
spoilerLevel: none
order: 30
section: tips
---

- 콜드플레이(2025-04) 공연에서 스탠딩 대기 장소는 **보조경기장**이었고, 후기들은 공연 3시간 전 도착을 권했습니다. — [관람 후기, 2025-04](https://vitariaplus.com/entry/콜드플레이-내한-후기-2025-고양종합운동장-스탠딩-콜드플레이-내한-공연-첫째-날-리얼-후기)
- 같은 공연에서 500mL 이상 플라스틱 병은 반입되지 않았고, 현장에서 종이팩 물 500mL를 1,000원에 팔았습니다(무료 배부 아님). — 같은 후기
- 다른 고양 공연의 인터파크 공지에서는 스탠딩을 입장번호 순으로 들여보내고, 입장 시작 시각 이후에는 번호가 무효였습니다. — [인터파크 타 공연 공지](http://mticket.interpark.com/Goods/GoodsInfo/GoodsExpandPopup?GoodsCode=08004615&ViewMode=GoodsDetailHtml)
- 음료는 운동장 맞은편 CU에서 미리 사고 병뚜껑을 분리해 들어갔다는 후기가 있습니다. — [커뮤니티 후기, 2026-08](https://gall.dcinside.com/mgallery/board/view/?id=bigbangvip&no=270100)
```

`31-tips-seating.md` — title `좌석과 시야`, order 31, sources `review-alljoylog-seatview`, `review-clien-bts-2026`, `news-daum-blackpink-refund`:

```md
- 1층 중앙은 표정까지 보이고, 2층 W(본부석) 중앙이 전체 연출을 보기 좋은 자리로 꼽힙니다. 3층은 거리가 멀어 몰입이 떨어진다는 평이 많습니다. — [좌석별 시야 후기, 2026-05 갱신](https://alljoylog.com/고양종합운동장-좌석별-시야/)
- N·W 구역 상단은 난간이 시야를 가리고, S 상단은 무대에서 가장 멀며 측면석은 음향 손실이 있다고 합니다. — 같은 후기
- BTS(2026-04) 3층 관람 후기는 전광판이 커서 시야가 나쁘지 않았다고 전합니다. — [커뮤니티 후기, 2026-04](https://www.clien.net/service/board/park/19176744)
- 블랙핑크(2025-07) 공연에서는 일부 구역 시야 불량 항의 뒤 주최 측이 환불했습니다. 시야제한석 표기가 있는 구역은 예매 전에 위치를 확인할 가치가 있습니다. — [다음뉴스, 2025-08](https://v.daum.net/v/20250816174638726)
- 좌석 시야 사진 모음: [myseatcheck](https://myseatcheck.com/고양종합운동장/), [offmate](https://www.offmate.kr/seat-map/16)
```

`32-tips-entry.md` — title `입장`, order 32, sources `news-ohmynews-2025-04`, `review-tndlrs-hero-2026`, `review-dcinside-bigbang-2026`, `review-clien-bts-2026`:

```md
- 대화역 3번 출구에서 횡단보도 하나를 건너면 운동장입니다(도보 약 3분). — [오마이뉴스, 2025-04](https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0003119116)
- 임영웅(2026-09) 공연 안내의 금지 물품: 우산·대형 카메라·셀카봉·외부 음식과 음료·배너·레이저 포인터. 티켓 QR은 캡처본이 통과되지 않았고 신분증이 필요했습니다. 굿즈 부스는 입장 전 외부에 있었습니다. — [관람 후기, 2026-07](https://www.tndlrs.com/2026/07/herolanding3.html)
- 대화역 물품보관함은 공연날 수량이 크게 부족했고, 사전 예약형 보관 서비스(대화역 4번 출구 인근)를 이용했다는 후기가 있습니다. — [커뮤니티 후기, 2026-08](https://gall.dcinside.com/mgallery/board/view/?id=bigbangvip&no=270100)
- BTS(2026-04) 공연에서는 입·퇴장 동선에 경찰과 안전요원이 다수 배치되고 구역별 순차 퇴장이 이뤄졌습니다. — [커뮤니티 후기, 2026-04](https://www.clien.net/service/board/park/19176744)
```

`33-tips-return.md` — title `귀가`, order 33, sources `review-dcinside-bigbang-2026`, `news-ohmynews-2025-04`, `namu-goyang-stadium`, `review-moneyroan-bts-parking`, `review-teamblind-return`:

```md
- 종료 후 대화역은 입구부터 통제되어 혼잡 시 30분 이상 걸렸고, 택시는 거의 잡히지 않았습니다. 킨텍스역·주엽역까지 걸어가는 대안이 자주 언급됩니다. — [커뮤니티 후기, 2026-08](https://gall.dcinside.com/mgallery/board/view/?id=bigbangvip&no=270100)
- 킨텍스역(GTX-A)은 약 1.8km, 도보 25분이며 서울역까지 17분입니다. 콜드플레이(2025-04) 때는 킨텍스역 2번 출구 셔틀이 5대·2~3분 간격·300원으로 22:00부터 운행했습니다. — [오마이뉴스, 2025-04](https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0003119116)
- 콘서트 때 킨텍스역↔운동장 임시 셔틀(98-1번)이 운영된 사례가 있습니다. — [나무위키](https://namu.wiki/w/고양종합운동장%20주경기장)
- 주차는 출차에 1~2시간이 걸렸고 운동장 주차장은 오전에 만차였습니다. 킨텍스 임시주차, 일산서구청 주차타워(일 6천원)가 대안으로 언급됩니다. — [관람 후기, 2026-04](https://moneyroan.com/bts-goyang-concert-traffic-parking-2026/), [커뮤니티, 2025-04](https://www.teamblind.com/kr/post/고양-종합운동장-콘서트-후-귀가-방법-추천-부탁-LwinPVPz)
```

`34-tips-packing.md` — title `준비물`, order 34, sources `review-dcinside-bigbang-2026`, `news-ohmynews-2025-04`, `namu-goyang-stadium`, `review-lingoculture-guide`:

```md
- 화장실 줄은 20~30분이었고, 입장 전에 대화역이나 인근 건물 화장실을 쓰는 편이 낫다는 후기가 많습니다. 대화역 식당은 붐벼 주엽역·일산백병원 뒤쪽이 대안으로 언급됩니다. — [커뮤니티 후기, 2026-08](https://gall.dcinside.com/mgallery/board/view/?id=bigbangvip&no=270100)
- 대규모 공연 날 대화역 상권은 전 업소가 줄을 섰고 역 화장실도 극심하게 혼잡했습니다. — [오마이뉴스, 2025-04](https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0003119116)
- 경기장 서쪽이 열려 있어 북서풍이 그대로 들어오고, 봄·가을 야간 공연에서도 추위 호소가 잦습니다. — [나무위키](https://namu.wiki/w/고양종합운동장%20주경기장)
- 겉옷·담요·보조배터리, 1층 뒷열이나 2층 이상이면 오페라글라스를 권하는 후기가 있습니다. 우산은 금지된 사례가 있어 일회용 우비가 대안입니다. — [관람 가이드](https://lingoculture.kr/goyang-stadium-concert-seating-guide/)
```

- [ ] **Step 7: `40-return.md`** (renamed from `30-return.md`, `git mv`), replace body and frontmatter (`order: 40`, `section: return`, `title: 귀가 확인`, sources `goyang-bis`, `korail-metropolitan-map`, `news-ohmynews-2025-04`):

```md
## 막차와 귀가 동선

- 3호선 대화역 평일 막차는 0시 전후입니다. 공연 종료가 늦어질 수 있으니 당일 시각은 [코레일 수도권 노선도](출처 목록의 링크)와 역 안내로 확인합니다.
- 대화역이 통제될 때는 킨텍스역(GTX-A, 도보 25분)이나 임시 셔틀이 대안입니다. 셔틀 운행 여부는 공연 운영 공지에서 확정됩니다.
- 버스 실시간 도착은 [고양시 BIS](https://bis.goyang.go.kr/m)에서 조회합니다.

후기 기반의 혼잡·주차 경험은 현장 팁의 **귀가** 탭에 모았습니다.
```

Replace `(출처 목록의 링크)` with the actual `korail-metropolitan-map` URL from `src/data/sources/korail-metropolitan-map.json`.

- [ ] **Step 8: `50-packing.md`** (renamed from `40-packing.md`), `order: 50`, `title: 준비물`, sources `nol-notice`, `live-nation-goyang`, `review-tndlrs-hero-2026`:

```md
- 신분증과 예매 확인 수단(모바일 티켓은 앱에서 직접 표시 — 타 공연에서 캡처본이 통과되지 않은 사례가 있습니다)
- 휴대전화 보조배터리
- 겉옷 또는 담요 — 10월 초 저녁 야외 경기장, 서쪽이 열린 구조
- 우비 — 타 공연에서 우산이 금지 물품이었습니다

반입 금지 물품은 이 공연의 공식 안내가 나오면 그 기준으로 다시 정리합니다. 타 공연 사례는 현장 팁의 **입장** 탭에 있습니다.
```

- [ ] **Step 9: `60-pending-operations.md`** (renamed), `order: 60`; append one sentence to the body:

```md
타 공연 후기에서 반복된 경험은 현장 팁에 "후기 기반 · 이 공연 미확정"으로 따로 모았습니다.
```

- [ ] **Step 10: Delete `20-arrival.md`** (`git rm`).

- [ ] **Step 11: Run checks**

Run: `npm run check && npm run audit:content`
Expected: 0 errors, audit PASS. If the audit rejects a URL or date, fix the data — do not touch the test.

- [ ] **Step 12: Commit**

```bash
git add -A src/data/guides src/data/sources
git commit -m "content(goyang): rewrite guide data with sourced access, seating, and review-based tips"
```

---

### Task 2: Access table, rebuilt schematic map, directions links, click-to-load live map

**Files:**
- Create: `src/components/guide/AccessTable.astro`, `src/components/guide/DirectionsLinks.astro`, `src/components/guide/LiveMap.astro`
- Rewrite: `src/components/guide/VenueMap.astro`
- Modify: `src/pages/goyang.astro` (transport block), `tests/e2e/navigation.spec.ts` (venue-map title/desc assertions)
- Test: `tests/e2e/goyang.spec.ts`

**Interfaces:**
- `AccessTable` no props. `DirectionsLinks` no props (constants inside). `LiveMap` no props. `VenueMap` no props; SVG keeps `id="venue-map"` with `<title id="venue-map-title">고양종합운동장 주변 간이 지도</title>` and `<desc id="venue-map-desc">대화역·킨텍스역·킨텍스 전시장과 경기장의 위치 관계를 단순화한 개략도. 인터파크 공연 상세 도면을 바탕으로 다시 그림.</desc>`.

- [ ] **Step 1: Verify the coordinates**

Fetch `https://map.kakao.com/link/search/고양종합운동장` or search "고양종합운동장 주경기장 위도 경도" with WebFetch/WebSearch and confirm the coordinates are within ±0.003° of `37.6755, 126.7448`. Record the values you settled on in `DirectionsLinks.astro` as `const LAT`/`const LNG` with a comment giving the confirmation source and date.

- [ ] **Step 2: Write failing e2e tests**

```ts
// tests/e2e/goyang.spec.ts
import { expect, test } from '@playwright/test';

test('shows Interpark access data as a table with a source caption', async ({
  page,
}) => {
  await page.goto('/goyang/');
  const access = page.locator('#transport .access-table');
  await expect(access.getByText('경기도 고양시 일산서구 중앙로 1601')).toBeVisible();
  await expect(access.getByText('3호선 대화역 3번 출구')).toBeVisible();
  await expect(access.getByText('M7731')).toBeVisible();
  await expect(access.getByText('1100')).toBeVisible();
  await expect(
    page.locator('#transport').getByRole('link', { name: /인터파크 티켓 공연 상세/ }).first(),
  ).toHaveAttribute('href', 'https://tickets.interpark.com/goods/26006903');
});

test('links to Kakao, Naver, and Google directions', async ({ page }) => {
  await page.goto('/goyang/');
  const links = page.locator('#transport .directions a');
  await expect(links).toHaveCount(3);
  await expect(links.nth(0)).toHaveAttribute('href', /^https:\/\/map\.kakao\.com\/link\/to\//);
  await expect(links.nth(1)).toHaveAttribute('href', /^https:\/\/map\.naver\.com\//);
  await expect(links.nth(2)).toHaveAttribute('href', /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1/);
  for (let i = 0; i < 3; i += 1) {
    await expect(links.nth(i)).toHaveAttribute('target', '_blank');
    await expect(links.nth(i)).toHaveAttribute('rel', /noreferrer/);
  }
});

test('loads the live map iframe only after a click', async ({ page }) => {
  await page.goto('/goyang/');
  await expect(page.locator('#transport iframe')).toHaveCount(0);
  await page.getByRole('button', { name: '실제 지도 불러오기' }).click();
  const frame = page.locator('#transport iframe');
  await expect(frame).toHaveCount(1);
  await expect(frame).toHaveAttribute('src', /google\.com\/maps/);
  await expect(frame).toHaveAttribute('title', '고양종합운동장 지도');
});

test('draws the rebuilt schematic map with both stations', async ({ page }) => {
  await page.goto('/goyang/');
  await expect(page.locator('#venue-map title')).toHaveText('고양종합운동장 주변 간이 지도');
  await expect(page.locator('#venue-map').getByText('대화역')).toBeVisible();
  await expect(page.locator('#venue-map').getByText('킨텍스역')).toBeVisible();
  await expect(page.locator('#venue-map').getByText('고양종합운동장')).toBeVisible();
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npm run build && npx playwright test -c .superpowers/tmp/playwright.4342.config.ts tests/e2e/goyang.spec.ts --project=desktop-chromium`
Expected: FAIL — `.access-table` missing.

- [ ] **Step 4: `AccessTable.astro`**

```astro
---
const INTERPARK = 'https://tickets.interpark.com/goods/26006903';
const rows = [
  { label: '주소', value: '경기도 고양시 일산서구 중앙로 1601 (대화동)' },
  { label: '지하철', value: '3호선 대화역 3번 출구 · 도보 약 3분' },
  { label: '', value: 'GTX-A 킨텍스역 1번 출구 · 도보 약 20분' },
];
const buses = [
  {
    stop: '대화역 정류장',
    routes: ['M7731', '55', '66', '67', '75', '83', '88A', '88B', '89', '97', '98', '999', '1000', '1001', '1500', '3300', '3800', '9700'],
  },
  { stop: '고양종합운동장·일산서구청 정류장', routes: ['55', '88A', '88B', '999', '1100'] },
];
---

<div class="access-table" data-enter>
  <dl>
    {rows.map((row) => (
      <div class="access-table__row">
        <dt>{row.label}</dt>
        <dd>{row.value}</dd>
      </div>
    ))}
    {buses.map((bus) => (
      <div class="access-table__row">
        <dt>버스 · {bus.stop}</dt>
        <dd>
          <ul class="access-table__routes" aria-label={`${bus.stop} 정차 노선`}>
            {bus.routes.map((route) => <li>{route}</li>)}
          </ul>
        </dd>
      </div>
    ))}
  </dl>
  <p class="access-table__source">
    오는 길 정보 출처:
    <a href={INTERPARK} target="_blank" rel="noreferrer">인터파크 티켓 공연 상세</a>
    (2026-08-30 확인)
  </p>
</div>

<style>
  .access-table { display: grid; gap: 1rem; max-width: 56rem; }
  dl { display: grid; gap: 0; margin: 0; border-top: 1px solid color-mix(in srgb, var(--ivory) 28%, transparent); }
  .access-table__row {
    display: grid;
    grid-template-columns: minmax(7rem, 12rem) minmax(0, 1fr);
    gap: 0.5rem 1.25rem;
    padding: 0.8rem 0;
    border-bottom: 1px solid color-mix(in srgb, var(--ivory) 18%, transparent);
  }
  dt { color: var(--amber); font-size: 0.82rem; font-weight: 800; letter-spacing: 0.04em; }
  dd { margin: 0; color: var(--ivory); font-weight: 700; }
  .access-table__routes { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0; padding: 0; list-style: none; }
  .access-table__routes li {
    padding: 0.2rem 0.55rem;
    border: 1px solid color-mix(in srgb, var(--mist) 40%, transparent);
    border-radius: 999px;
    font-size: 0.82rem;
  }
  .access-table__source { color: var(--ink-muted); font-size: 0.82rem; }
  .access-table__source a { color: var(--ivory); font-weight: 700; }
  @media (max-width: 36rem) { .access-table__row { grid-template-columns: 1fr; } }
</style>
```

Empty `<dt>` for the second subway row is invalid-ish for screen readers — instead merge the two subway lines into one `dd` with a `<br>`: `value: ['3호선 대화역 3번 출구 · 도보 약 3분', 'GTX-A 킨텍스역 1번 출구 · 도보 약 20분']` and render `dd` as `{row.value.map((v) => <span class="access-table__line">{v}</span>)}` with `.access-table__line { display: block; }`. Do that; drop the empty-label row.

- [ ] **Step 5: `DirectionsLinks.astro`**

```astro
---
// 좌표 확인: <출처 URL>, 2026-08-30
const LAT = 37.6755;
const LNG = 126.7448;
const NAME = '고양종합운동장';
const links = [
  { label: '카카오맵 길찾기', href: `https://map.kakao.com/link/to/${encodeURIComponent(NAME)},${LAT},${LNG}` },
  { label: '네이버지도 길찾기', href: `https://map.naver.com/p/search/${encodeURIComponent(NAME)}` },
  { label: '구글맵 길찾기', href: `https://www.google.com/maps/dir/?api=1&destination=${LAT},${LNG}&travelmode=transit` },
];
---

<nav class="directions" aria-label="길찾기 앱 열기" data-enter-group>
  {links.map((link) => (
    <a href={link.href} target="_blank" rel="noreferrer">{link.label} <span aria-hidden="true">↗</span></a>
  ))}
</nav>

<style>
  .directions { display: flex; flex-wrap: wrap; gap: 0.7rem; }
  .directions a {
    display: inline-flex; align-items: center; gap: 0.4rem;
    min-height: 44px; padding: 0.6rem 1rem;
    border: 1px solid color-mix(in srgb, var(--amber) 60%, transparent);
    color: var(--ivory); font-weight: 800; text-decoration: none;
    transition: background var(--motion-fast) var(--ease-cinematic);
  }
  .directions a:hover, .directions a:focus-visible { background: color-mix(in srgb, var(--amber) 16%, transparent); }
</style>
```

- [ ] **Step 6: `LiveMap.astro`** (click-to-load)

```astro
---
const EMBED = 'https://www.google.com/maps?q=%EA%B3%A0%EC%96%91%EC%A2%85%ED%95%A9%EC%9A%B4%EB%8F%99%EC%9E%A5&z=16&hl=ko&output=embed';
---

<live-map class="live-map" data-src={EMBED}>
  <div class="live-map__placeholder">
    <p>지도는 버튼을 누른 뒤에만 불러옵니다(구글 지도, 외부 요청).</p>
    <button type="button">실제 지도 불러오기</button>
  </div>
</live-map>

<script>
  class LiveMap extends HTMLElement {
    connectedCallback() {
      this.querySelector('button')?.addEventListener('click', () => {
        const frame = document.createElement('iframe');
        frame.src = this.dataset.src ?? '';
        frame.title = '고양종합운동장 지도';
        frame.loading = 'lazy';
        frame.referrerPolicy = 'no-referrer-when-downgrade';
        frame.setAttribute('allowfullscreen', '');
        this.replaceChildren(frame);
      }, { once: true });
    }
  }
  if (!customElements.get('live-map')) customElements.define('live-map', LiveMap);
</script>

<style>
  .live-map { display: block; max-width: 56rem; aspect-ratio: 16 / 10; border: 1px solid color-mix(in srgb, var(--ivory) 18%, transparent); }
  .live-map :global(iframe) { width: 100%; height: 100%; border: 0; }
  .live-map__placeholder {
    display: grid; place-content: center; gap: 1rem; height: 100%; padding: 1.5rem; text-align: center;
    background: radial-gradient(ellipse at 50% 40%, color-mix(in srgb, var(--blue) 18%, transparent), transparent 70%);
    color: var(--mist);
  }
  .live-map__placeholder button {
    justify-self: center; min-height: 44px; padding: 0.6rem 1.2rem;
    border: 1px solid var(--amber); background: transparent; color: var(--ivory); font-weight: 800; cursor: pointer;
  }
</style>
```

Without JS the placeholder text and an inert button remain — acceptable; the directions links cover the no-JS path.

- [ ] **Step 7: Rewrite `VenueMap.astro`**

Replace the SVG with a 720×520 viewBox schematic reproducing the Interpark drawing in site colours. Elements (positions are guidance; tune visually):

- Roads: three horizontal bars at y ≈ 90, 270, 430 (height 26, fill `color-mix(in srgb, var(--mist) 30%, var(--night))`), four vertical bars at x ≈ 250, 330, 470, 600 (width 26). Draw roads first.
- Stadium: ellipse cx 150 cy 190 rx 95 ry 75, fill `color-mix(in srgb, var(--red) 45%, var(--night))`, stroke `var(--amber)` 3; label lines inside: `현대카드 슈퍼콘서트 28`, `The Weeknd`, `고양종합운동장` (last one 20px 900). Sub-stadium: rect x 20 y 110 w 60 h 70 rx 6 stroke ivory, label `보조경기장` 13px.
- Daehwa station: pill (rect rx 18) centred on the top road at x ≈ 290, y 90, w 120 h 36, fill `#f26b1d`-like → use `var(--amber)`; text `③ 대화역` fill `var(--night)` 800.
- KINTEX station: pill on the bottom road at x ≈ 560 y 430, fill `var(--blue)`, text `GTX-A 킨텍스역` fill ivory.
- KINTEX halls: rect x 480 y 300 w 110 h 60 `킨텍스 제1전시장`; rect x 480 y 460 w 110 h 50 `킨텍스 제2전시장`; fill `color-mix(in srgb, var(--ivory) 10%, transparent)` stroke mist.
- Dots + labels: `일산백병원` at (640, 60), `대화마을` at (120, 330).
- Walking route: dashed path from the station pill bottom to the stadium top-right (`stroke-dasharray 6 6`, amber), label `도보 약 3분` 13px.
- `<title id="venue-map-title">` and `<desc id="venue-map-desc">` with the exact texts from **Interfaces** above. Keep `role="img"` and `aria-labelledby`.
- `figcaption`: `인터파크 공연 상세의 오는 길 도면을 바탕으로 다시 그린 개략도. 축척·도로 수는 실제와 다릅니다.` followed by the existing two links (`공개 지도에서 위치 확인`, `고양시 BIS에서 버스 확인`).
- Root `<figure class="venue-map" data-enter>`.

- [ ] **Step 8: Update `navigation.spec.ts`** Goyang map assertions to the new title/desc text (only those two `toHaveText` calls).

- [ ] **Step 9: Wire the transport block in `goyang.astro`**

Replace `{entry.data.section === 'transport' && <VenueMap />}` with:

```astro
{entry.data.section === 'transport' && (
  <div class="guide-transport">
    <AccessTable />
    <VenueMap />
    <DirectionsLinks />
    <LiveMap />
  </div>
)}
```

Add imports and `.guide-transport { display: grid; gap: clamp(1.5rem, 4vw, 2.5rem); }`. Full page assembly happens in Task 5; for now this keeps the page rendering.

- [ ] **Step 10: Run tests**

Run: `npm run build && npx playwright test -c .superpowers/tmp/playwright.4342.config.ts tests/e2e/goyang.spec.ts tests/e2e/navigation.spec.ts tests/e2e/no-js.spec.ts tests/e2e/accessibility.spec.ts`
Expected: PASS (except the pre-existing `navigation.spec.ts` test that hard-codes `http://127.0.0.1:4321`).

- [ ] **Step 11: Commit**

```bash
git add src/components/guide src/pages/goyang.astro tests/e2e/goyang.spec.ts tests/e2e/navigation.spec.ts
git commit -m "feat(goyang): Interpark access table, rebuilt schematic, directions links, click-to-load map"
```

---

### Task 3: Seat map — official image, structural schematic, legend

**Files:**
- Create: `src/assets/guide/seat-map-interpark.png` (copy from `.superpowers/tmp/b-inputs/seat-map-interpark.png`), `src/components/guide/SeatMap.astro`, `src/components/guide/SeatMapSchematic.astro`
- Modify: `src/pages/goyang.astro` (seating block)
- Test: `tests/e2e/goyang.spec.ts` (append)

**Interfaces:**
- `SeatMap` no props; renders `<figure class="seat-map">` with `<picture>` (from `astro:assets` `<Image>`), caption link to Interpark, `SeatMapSchematic`, and a legend `<table class="seat-legend">`.

- [ ] **Step 1: Append failing tests**

```ts
test('shows the official seat map with source, a schematic, and the grade legend', async ({
  page,
}) => {
  await page.goto('/goyang/');
  const seating = page.locator('#seating');
  await expect(seating.getByRole('heading', { name: '좌석 안내' })).toBeVisible();
  await expect(seating.locator('.seat-map picture img')).toHaveCount(1);
  await expect(seating.locator('.seat-map figcaption')).toContainText('인터파크');
  await expect(seating.locator('#seat-schematic title')).toHaveText('고양종합운동장 공연 좌석 구조 개략도');
  await expect(seating.locator('.seat-legend tbody tr')).toHaveCount(13);
  await expect(seating.getByText('스탠딩 Early Entry Package')).toBeVisible();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run build && npx playwright test -c .superpowers/tmp/playwright.4342.config.ts tests/e2e/goyang.spec.ts --project=desktop-chromium -g "seat map"`
Expected: FAIL — `#seating` missing.

- [ ] **Step 3: Copy the asset**

```bash
mkdir -p src/assets/guide
cp .superpowers/tmp/b-inputs/seat-map-interpark.png src/assets/guide/seat-map-interpark.png
```

- [ ] **Step 4: `SeatMapSchematic.astro`** — viewBox 440×560, structure only, no section codes:

- Stage: rect x 150 y 20 w 140 h 50, fill `color-mix(in srgb, var(--mist) 35%, var(--night))`, text `STAGE`.
- Stand ring: three concentric U-shaped paths (outer, middle, inner) opening at the top toward the stage; stroke ivory 2, fills `color-mix(in srgb, var(--blue) 14/22/30%, transparent)` from outer to inner. Label `3F` / `2F` / `1F` at the left edge of each ring.
- Floor: path filling the inside of the inner ring, fill `color-mix(in srgb, #6d2fa8 55%, var(--night))`; labels `Standing A` (left) and `Standing B` (right).
- Early Entry band: rect just under the stage across the floor width, height 22, fill `color-mix(in srgb, #7ee0a8 45%, var(--night))`, label `Early Entry`.
- Runway: vertical bar from stage centre to y ≈ 330 (width 22), horizontal crossbar at y ≈ 200 (width 200, height 22), B-stage square 44×44 at the bottom of the vertical bar; fill mist 45%. Label `B-STAGE`.
- FOH: two small rects 34×26 at (150, 250) and (256, 250), dashed stroke, label `FOH`.
- Restricted-view corners: two dashed red (`var(--red)`) rounded rects over the top-left and top-right outer-ring corners, label `시야제한`.
- `<svg id="seat-schematic" role="img" aria-labelledby="seat-schematic-title seat-schematic-desc">` with `<title id="seat-schematic-title">고양종합운동장 공연 좌석 구조 개략도</title>` and `<desc id="seat-schematic-desc">무대, 스탠딩 A·B, Early Entry 띠, 십자형 런웨이와 B-스테이지, FOH, 1~3층 스탠드, 상단 코너 시야제한 위치만 표시한 구조도. 개별 구역 코드는 원본 좌석도를 참고.</desc>`.

- [ ] **Step 5: `SeatMap.astro`**

```astro
---
import { Image } from 'astro:assets';
import seatMap from '../../assets/guide/seat-map-interpark.png';
import SeatMapSchematic from './SeatMapSchematic.astro';

const INTERPARK = 'https://tickets.interpark.com/goods/26006903';
const legend = [
  ['지정석 P', 'p'], ['지정석 R', 'r'], ['지정석 S', 's'], ['지정석 A', 'a'],
  ['지정석 B', 'b'], ['지정석 C', 'c'], ['지정석 D', 'd'],
  ['스탠딩', 'standing'], ['스탠딩 Early Entry Package', 'early'],
  ['시야제한석 1', 'rv1'], ['시야제한석 2', 'rv2'], ['시야제한석 3', 'rv3'], ['시야제한석 4', 'rv4'],
] as const;
---

<div class="seat-map-wrap" data-enter>
  <figure class="seat-map">
    <a href={seatMap.src} target="_blank" rel="noreferrer" aria-label="좌석 안내도 원본 크게 보기">
      <Image
        src={seatMap}
        widths={[480, 960]}
        sizes="(max-width: 48rem) 100vw, 480px"
        formats={['avif', 'webp']}
        quality={70}
        alt="고양종합운동장 좌석 안내도. 상단 무대, 플로어 스탠딩 A·B, 십자형 런웨이, 1~3층 스탠드 구역과 등급 색상 범례."
      />
    </a>
    <figcaption>
      좌석 안내도 출처:
      <a href={INTERPARK} target="_blank" rel="noreferrer">인터파크 티켓 공연 상세</a>
      (2026-08-30 확인). 탭하면 원본이 새 탭에서 열립니다.
    </figcaption>
  </figure>

  <div class="seat-map__aside">
    <SeatMapSchematic />
    <table class="seat-legend">
      <caption>등급 범례 — 구역별 등급은 원본 좌석도와 예매 페이지 기준</caption>
      <thead><tr><th scope="col">색</th><th scope="col">등급</th></tr></thead>
      <tbody>
        {legend.map(([label, key]) => (
          <tr>
            <td><span class={`seat-legend__chip seat-legend__chip--${key}`} aria-hidden="true"></span></td>
            <td>{label}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

<style>
  .seat-map-wrap { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(1.25rem, 3vw, 2.5rem); max-width: 62rem; }
  .seat-map { display: grid; gap: 0.6rem; margin: 0; }
  .seat-map a { display: block; }
  .seat-map :global(img) { width: 100%; height: auto; border: 1px solid color-mix(in srgb, var(--ivory) 18%, transparent); background: #fff; }
  figcaption { color: var(--ink-muted); font-size: 0.82rem; }
  figcaption a { color: var(--ivory); font-weight: 700; }
  .seat-map__aside { display: grid; gap: 1rem; align-content: start; }
  .seat-legend { border-collapse: collapse; font-size: 0.85rem; }
  .seat-legend caption { padding-bottom: 0.5rem; color: var(--ink-muted); font-size: 0.78rem; text-align: start; }
  .seat-legend th, .seat-legend td { padding: 0.3rem 0.6rem; border-bottom: 1px solid color-mix(in srgb, var(--ivory) 14%, transparent); text-align: start; }
  .seat-legend__chip { display: inline-block; width: 1.1rem; height: 1.1rem; border-radius: 3px; }
  .seat-legend__chip--p { background: #6f6fe6; } .seat-legend__chip--r { background: #2e8b57; }
  .seat-legend__chip--s { background: #37a7e6; } .seat-legend__chip--a { background: #f28c5c; }
  .seat-legend__chip--b { background: #9ccc65; } .seat-legend__chip--c { background: #f2a33a; }
  .seat-legend__chip--d { background: #e64c8a; } .seat-legend__chip--standing { background: #6d2fa8; }
  .seat-legend__chip--early { background: #a8e6c1; } .seat-legend__chip--rv1 { background: #1f2fbf; }
  .seat-legend__chip--rv2 { background: #d9302c; } .seat-legend__chip--rv3 { background: #f7c8a8; }
  .seat-legend__chip--rv4 { background: #f7a8c8; }
  @media (max-width: 48rem) { .seat-map-wrap { grid-template-columns: 1fr; } }
</style>
```

Legend chips keep the original colour families so they match the photo the reader is looking at (the spec's "재해석" is limited to the schematic).

- [ ] **Step 6: Wire into `goyang.astro`**

```astro
{entry.data.section === 'seating' && <SeatMap />}
```

- [ ] **Step 7: Run tests + budget**

Run: `npm run build && npm run budget && npx playwright test -c .superpowers/tmp/playwright.4342.config.ts tests/e2e/goyang.spec.ts tests/e2e/accessibility.spec.ts --project=desktop-chromium`
Expected: PASS; budget raster ≤ 1100KiB. If the generated avif/webp exceed ~200KiB combined, lower `quality` to 60 or drop the 960 width.

- [ ] **Step 8: Commit**

```bash
git add src/assets/guide src/components/guide/SeatMap.astro src/components/guide/SeatMapSchematic.astro src/pages/goyang.astro tests/e2e/goyang.spec.ts
git commit -m "feat(goyang): official seat map with structural schematic and grade legend"
```

---

### Task 4: `TipsTabs` — five review-based tabs

**Files:**
- Create: `src/components/guide/TipsTabs.astro`
- Modify: `src/pages/goyang.astro` (group `tips` entries)
- Test: `tests/e2e/goyang.spec.ts` (append)

**Interfaces:**
- `TipsTabs` props: `entries: CollectionEntry<'guides'>[]` (sorted by `order`), `sources: SourceRecord[]`. Renders `<section id="tips">` with heading `현장 팁`, badge text `후기 기반 · 이 공연 미확정`, `div[role=tablist]` of `button[role=tab]`, and one `div[role=tabpanel]` per entry containing `<Content />` + `SourceList`.

- [ ] **Step 1: Append failing tests**

```ts
test('groups the five review-based tips into keyboard-operable tabs', async ({
  page,
}) => {
  await page.goto('/goyang/');
  const tips = page.locator('#tips');
  await expect(tips.getByText('후기 기반 · 이 공연 미확정')).toBeVisible();
  const tabs = tips.getByRole('tab');
  await expect(tabs).toHaveText(['스탠딩', '좌석과 시야', '입장', '귀가', '준비물']);
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await expect(tips.getByRole('tabpanel')).toHaveCount(1);

  await tabs.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(tips.getByRole('tabpanel')).toContainText('본부석');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('shows every tips panel in order', async ({ page }) => {
    await page.goto('/goyang/');
    const panels = page.locator('#tips [role="tabpanel"]');
    await expect(panels).toHaveCount(5);
    for (let i = 0; i < 5; i += 1) await expect(panels.nth(i)).toBeVisible();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run build && npx playwright test -c .superpowers/tmp/playwright.4342.config.ts tests/e2e/goyang.spec.ts --project=desktop-chromium -g "tips"`
Expected: FAIL — `#tips` missing.

- [ ] **Step 3: `TipsTabs.astro`**

```astro
---
import { render, type CollectionEntry } from 'astro:content';
import SourceList from '../content/SourceList.astro';
import type { SourceRecord } from '../../lib/content/contracts';
import { formatSeoulDate } from '../../lib/content/audit';
import { resolveSourceReferences } from '../../lib/content/queries';

interface Props {
  entries: CollectionEntry<'guides'>[];
  sources: SourceRecord[];
}

const { entries, sources } = Astro.props;
const panels = await Promise.all(
  entries.map(async (entry) => ({
    entry,
    Content: (await render(entry)).Content,
    sources: resolveSourceReferences(entry.data.sources, sources),
  })),
);
const latest = entries.reduce(
  (max, entry) => (entry.data.lastVerifiedAt > max ? entry.data.lastVerifiedAt : max),
  entries[0]!.data.lastVerifiedAt,
);
---

<section id="tips" class="tips" aria-labelledby="tips-title">
  <div class="tips__heading">
    <p class="eyebrow">FROM PEOPLE WHO WERE THERE</p>
    <h2 id="tips-title">현장 팁</h2>
    <p>
      고양종합운동장에서 열린 다른 공연의 관람 후기와 기사에서 반복된 경험입니다. 이 공연의 운영 공지가 아니며, 공지가 나오면 그 내용이 우선합니다.
    </p>
    <p class="tips__meta">
      <span class="tips__badge">후기 기반 · 이 공연 미확정</span>
      <span>마지막 확인 {formatSeoulDate(latest)}</span>
    </p>
  </div>

  <tips-tabs class="tips__tabs">
    <div role="tablist" aria-label="현장 팁 주제">
      {panels.map(({ entry }, index) => (
        <button
          type="button"
          role="tab"
          id={`tips-tab-${entry.data.order}`}
          aria-controls={`tips-panel-${entry.data.order}`}
          aria-selected={index === 0 ? 'true' : 'false'}
          tabindex={index === 0 ? 0 : -1}
        >
          {entry.data.title}
        </button>
      ))}
    </div>
    {panels.map(({ entry, Content, sources: panelSources }) => (
      <div
        role="tabpanel"
        id={`tips-panel-${entry.data.order}`}
        aria-labelledby={`tips-tab-${entry.data.order}`}
        tabindex="0"
        class="tips__panel"
      >
        <h3>{entry.data.title}</h3>
        <p class="tips__summary">{entry.data.summary}</p>
        <div class="tips__body"><Content /></div>
        <SourceList sources={panelSources} />
      </div>
    ))}
  </tips-tabs>
</section>

<script>
  class TipsTabs extends HTMLElement {
    connectedCallback() {
      const tabs = Array.from(this.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
      const panels = Array.from(this.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
      const select = (index: number, focus = false) => {
        tabs.forEach((tab, i) => {
          const active = i === index;
          tab.setAttribute('aria-selected', String(active));
          tab.tabIndex = active ? 0 : -1;
          panels[i]!.hidden = !active;
          if (active && focus) tab.focus();
        });
      };
      tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => select(i));
        tab.addEventListener('keydown', (event) => {
          const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
          if (delta === 0 && event.key !== 'Home' && event.key !== 'End') return;
          event.preventDefault();
          const next =
            event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (i + delta + tabs.length) % tabs.length;
          select(next, true);
        });
      });
      this.dataset.ready = 'true';
      select(0);
    }
  }
  if (!customElements.get('tips-tabs')) customElements.define('tips-tabs', TipsTabs);
</script>

<style>
  .tips { display: grid; gap: 1.5rem; scroll-margin-top: 1rem; }
  .tips__heading { display: grid; gap: 0.7rem; max-width: 55rem; }
  .tips__heading > p:not(.eyebrow):not(.tips__meta) { color: var(--mist); }
  .tips__meta { display: flex; flex-wrap: wrap; gap: 0.65rem 1rem; align-items: center; color: var(--ink-muted); font-size: 0.85rem; font-weight: 700; }
  .tips__badge {
    display: inline-flex; align-items: center; min-height: 2rem; padding: 0.3rem 0.65rem;
    border: 1px solid color-mix(in srgb, var(--red) 70%, transparent); color: var(--ivory);
    font-size: 0.76rem; font-weight: 800; letter-spacing: 0.04em;
  }
  .tips__tabs { display: grid; gap: 1.25rem; max-width: 56rem; }
  [role='tablist'] { display: flex; gap: 0.4rem; overflow-x: auto; padding-bottom: 0.25rem; scrollbar-width: none; }
  [role='tab'] {
    flex: 0 0 auto; min-height: 44px; padding: 0.55rem 1rem;
    border: 1px solid color-mix(in srgb, var(--ivory) 24%, transparent); border-radius: 999px;
    background: transparent; color: var(--mist); font: inherit; font-weight: 800; cursor: pointer;
    transition: color var(--motion-fast) var(--ease-cinematic), background var(--motion-fast) var(--ease-cinematic);
  }
  [role='tab'][aria-selected='true'] { border-color: var(--amber); background: color-mix(in srgb, var(--amber) 16%, transparent); color: var(--ivory); }
  .tips__panel { display: grid; gap: 0.9rem; }
  .tips__panel h3 { font-size: 1.1rem; }
  .tips__tabs[data-ready] .tips__panel h3 { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .tips__summary { color: var(--mist); }
  .tips__body :global(ul) { display: grid; gap: 0.6rem; margin: 0; padding-left: 1.25rem; color: var(--mist); }
  .tips__body :global(a) { color: var(--ivory); font-weight: 700; }
</style>
```

Without JS every panel stays visible with its `h3` (the heading is visually hidden only once the script marks `data-ready`).

- [ ] **Step 4: Wire into `goyang.astro`**

Compute `const tips = guides.filter((entry) => entry.data.section === 'tips');` and `const sections = guides.filter((entry) => entry.data.section !== 'tips');`. Render `<TipsTabs entries={tips} sources={sources} />` in place of the first `tips` entry position (i.e. after `seating`, before `return`). Task 5 finalises ordering; a simple approach now: iterate `sections`, and after the `seating` section render `TipsTabs`.

- [ ] **Step 5: Run tests**

Run: `npm run build && npx playwright test -c .superpowers/tmp/playwright.4342.config.ts tests/e2e/goyang.spec.ts tests/e2e/accessibility.spec.ts`
Expected: PASS on both projects.

- [ ] **Step 6: Commit**

```bash
git add src/components/guide/TipsTabs.astro src/pages/goyang.astro tests/e2e/goyang.spec.ts
git commit -m "feat(goyang): review-based field tips as accessible tabs"
```

---

### Task 5: Page assembly — section order, jump nav, entrance attributes, test updates

**Files:**
- Modify: `src/pages/goyang.astro`, `src/components/guide/GuideSection.astro` (add `data-enter` to the section root; add one sentence to `pending`), `tests/e2e/navigation.spec.ts` (return heading assertion), `tests/e2e/goyang.spec.ts` (append)

- [ ] **Step 1: Append failing test**

```ts
test('orders the seven sections and offers a jump nav', async ({ page }) => {
  await page.goto('/goyang/');
  const ids = await page.locator('main section[id]').evaluateAll((els) => els.map((el) => el.id));
  expect(ids).toEqual(['official', 'transport', 'seating', 'tips', 'return', 'packing', 'pending']);
  const jump = page.getByRole('navigation', { name: '가이드 섹션' });
  await expect(jump.getByRole('link')).toHaveCount(7);
  await expect(jump.getByRole('link', { name: '좌석 안내' })).toHaveAttribute('href', '#seating');
  await expect(page.getByText('아직 발표되지 않은 운영 정보')).toBeVisible();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run build && npx playwright test -c .superpowers/tmp/playwright.4342.config.ts tests/e2e/goyang.spec.ts --project=desktop-chromium -g "seven sections"`
Expected: FAIL — jump nav missing.

- [ ] **Step 3: Final `goyang.astro`**

```astro
---
import { getCollection } from 'astro:content';
import AccessTable from '../components/guide/AccessTable.astro';
import DirectionsLinks from '../components/guide/DirectionsLinks.astro';
import GuideSection from '../components/guide/GuideSection.astro';
import LiveMap from '../components/guide/LiveMap.astro';
import SeatMap from '../components/guide/SeatMap.astro';
import TipsTabs from '../components/guide/TipsTabs.astro';
import VenueMap from '../components/guide/VenueMap.astro';
import BaseLayout from '../layouts/BaseLayout.astro';
import { getGuideContent } from '../lib/content/queries';

const [guides, sources] = await Promise.all([getGuideContent(), getCollection('sources')]);
const tips = guides.filter((entry) => entry.data.section === 'tips');
const sections = guides.filter((entry) => entry.data.section !== 'tips');
const jump = [
  ...sections.map((entry) => ({ id: entry.data.section, label: entry.data.title, order: entry.data.order })),
  { id: 'tips', label: '현장 팁', order: tips[0]?.data.order ?? 30 },
].sort((a, b) => a.order - b.order);
---

<BaseLayout
  title="고양 가이드 | The Weeknd 고양 팬 가이드"
  description="The Weeknd 2026 고양 공연 당일 가이드 — 오는 길, 좌석 안내, 현장 팁, 귀가와 준비물"
>
  <section class="guide-page shell-content" aria-labelledby="goyang-guide-title">
    <header>
      <p class="eyebrow">GOYANG DAY-OF GUIDE</p>
      <h1 id="goyang-guide-title">고양 당일 가이드</h1>
      <p>
        확정된 공연 정보와 아직 발표되지 않은 운영 정보를 분리해 두고, 다른 공연 후기에서 반복된 경험은 따로 표시한 비공식 팬 가이드입니다.
      </p>
      <nav class="guide-jump" aria-label="가이드 섹션">
        {jump.map((item) => <a href={`#${item.id}`}>{item.label}</a>)}
      </nav>
    </header>
    {
      sections.map((entry) => (
        <>
          <GuideSection entry={entry} sources={sources} />
          {entry.data.section === 'transport' && (
            <div class="guide-transport">
              <AccessTable />
              <VenueMap />
              <DirectionsLinks />
              <LiveMap />
            </div>
          )}
          {entry.data.section === 'seating' && (
            <>
              <SeatMap />
              <TipsTabs entries={tips} sources={sources} />
            </>
          )}
        </>
      ))
    }
  </section>
</BaseLayout>
```

Keep the existing `<style>` block; add:

```css
.guide-jump { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
.guide-jump a {
  display: inline-flex; align-items: center; min-height: 44px; padding: 0.45rem 0.9rem;
  border: 1px solid color-mix(in srgb, var(--ivory) 24%, transparent); border-radius: 999px;
  color: var(--mist); font-size: 0.85rem; font-weight: 800; text-decoration: none;
}
.guide-jump a:hover, .guide-jump a:focus-visible { border-color: var(--amber); color: var(--ivory); }
.guide-transport { display: grid; gap: clamp(1.5rem, 4vw, 2.5rem); }
```

Note the page header sentence still contains `아직 발표되지 않은 운영 정보` (no-js.spec).

The `section[id]` order test counts `GuideSection` roots plus `#tips`; the `SeatMap`/transport wrappers are `div`s so they do not appear. `TipsTabs` renders after `SeatMap` inside the `seating` branch — the DOM order becomes official, transport, seating, tips, return, packing, pending as required.

- [ ] **Step 4: `GuideSection.astro`**

- Add `data-enter` to the root `<section …>`.
- In the `pending` branch nothing changes structurally (5 `.status` badges remain).

- [ ] **Step 5: `navigation.spec.ts`**

Replace `await expect(page.getByText('공연 직전 막차 재확인')).toBeVisible();` with `await expect(page.getByText('막차와 귀가 동선')).toBeVisible();`.

- [ ] **Step 6: Run the Goyang-related suites on both projects**

Run: `npm run build && npx playwright test -c .superpowers/tmp/playwright.4342.config.ts tests/e2e/goyang.spec.ts tests/e2e/navigation.spec.ts tests/e2e/no-js.spec.ts tests/e2e/accessibility.spec.ts`
Expected: PASS (except the pre-existing hard-coded 4321 test).

- [ ] **Step 7: Commit**

```bash
git add src/pages/goyang.astro src/components/guide/GuideSection.astro tests/e2e/navigation.spec.ts tests/e2e/goyang.spec.ts
git commit -m "feat(goyang): assemble seven-section guide with jump nav"
```

---

### Task 6: Verification pass

- [ ] **Step 1: Static checks**

Run: `npm run lint && npm run format:check && npm run check`
Expected: 0 errors. Prettier: format only files you own.

- [ ] **Step 2: Unit + audit + build + budget**

Run: `npm run test:unit && npm run audit:content && npm run build && npm run budget`
Expected: pass; report raster and js figures.

- [ ] **Step 3: Full e2e**

Run: `npx playwright test -c .superpowers/tmp/playwright.4342.config.ts`
Expected: green except the pre-existing hard-coded 4321 test.

- [ ] **Step 4: Screenshots**

Create `.superpowers/tmp/shot-b.mjs`:

```js
import { chromium, devices } from '@playwright/test';
const browser = await chromium.launch();
for (const [name, opts] of [
  ['mobile', devices['Pixel 7']],
  ['desktop', { viewport: { width: 1440, height: 900 } }],
]) {
  const page = await browser.newPage(opts);
  await page.goto('http://localhost:4332/goyang/');
  await page.evaluate(() => document.documentElement.removeAttribute('data-motion-ready'));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `.superpowers/tmp/b-goyang-${name}.png`, fullPage: true });
  await page.getByRole('button', { name: '실제 지도 불러오기' }).click();
  await page.waitForTimeout(1500);
  await page.locator('#transport').screenshot({ path: `.superpowers/tmp/b-transport-${name}.png` });
}
await browser.close();
```

Run: `node .superpowers/tmp/shot-b.mjs` (dev server on 4332). Look at the images: the schematic map labels must not overlap, the seat image must be legible, tabs must fit on mobile.

- [ ] **Step 5: Report**

Commits, test counts, budget numbers, coordinate confirmation source, screenshot paths, deviations.
