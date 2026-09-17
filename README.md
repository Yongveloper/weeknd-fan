# INTO:DAWN

The Weeknd의 2026년 10월 7–8일 고양 공연을 위한 비공식·비영리 정적 팬 가이드입니다. 일식과 구름으로 구성된 홈 화면, 앨범 안내, 예상 셋리스트, 콘서트 가이드, 브라우저에서 생성하는 티켓과 포스터를 제공합니다.

## 팀 로컬 실행

Node.js **22.14.0**을 사용합니다.

```bash
npm ci
npx playwright install chromium
npm run dev
```

개발 주소는 `http://localhost:4323`입니다. 모든 에셋과 폰트는 저장소에 포함되어 있으며, 별도의 서버나 데이터베이스가 필요하지 않습니다. 지도·공식 영상·앨범 커버 일부는 외부 서비스에 연결합니다.

## 검증

```bash
PUBLIC_SITE_URL=https://fan-guide.test npm run verify
npx wrangler deploy --dry-run
```

`verify`는 린트, 포맷, 타입, 콘텐츠 출처·확인 날짜, 단위 테스트, 빌드, 성능 예산, 데스크톱·모바일 Playwright 검사를 실행합니다. 콘텐츠 감사 실패 시 확인 날짜를 임의로 바꾸지 말고 `docs/content-update-runbook.md`에 따라 실제 출처를 다시 확인합니다.

## Cloudflare 배포

Cloudflare Workers Static Assets의 `dist/`만 배포합니다. Worker entrypoint, SSR, Functions는 사용하지 않고 `run_worker_first: false`를 유지합니다.

```bash
npx wrangler login
PUBLIC_SITE_URL=https://실제-사이트-주소 npm run deploy
```

`PUBLIC_SITE_URL`은 canonical, sitemap, Open Graph 주소에 사용됩니다. 이미 연결된 Cloudflare 계정의 Workers 하위 도메인 또는 팀의 실제 도메인을 먼저 확인하고 설정합니다. 인증 정보와 `.env`는 Git에 넣지 않습니다.

## 팀 인수인계

- 디자인 기준: `DESIGN.md`, `docs/share-art-direction.md`.
- 홈 장면: `src/components/home/HomeHero.astro`, `src/styles/eclipse-impact.css`, `src/scripts/dawn-sky-renderer.ts`.
- 공유 이미지 공통 디자인: `src/lib/share/cardDesign.ts`, `src/lib/share/canvas.ts`.
- 콘텐츠: `src/data/`. 공개 전 최신성은 별도 확인이 필요합니다.
- `tmp/`, `output/`, `.impeccable/`, 브라우저 검사 결과와 로컬 백업은 배포 대상이 아닙니다.

공유 이미지는 브라우저에서 생성하며 입력값을 서버에 저장하지 않습니다. 예상 셋리스트는 실제 공연을 보장하지 않으며 공연 후 검증된 기록이 있을 때만 아카이브를 공개합니다.
