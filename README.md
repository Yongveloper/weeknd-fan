# The Weeknd 고양 팬 가이드

The Weeknd의 2026년 10월 7–8일 고양 공연을 위한 비공식·비영리 정적 팬 가이드입니다.

## 로컬 실행

Node.js 22.14.0을 사용합니다.

```bash
npm ci
npm run dev
npm run verify
PUBLIC_SITE_URL=https://fan-guide.test npm run build
npx wrangler deploy --dry-run
```

`PUBLIC_SITE_URL`은 절대 HTTPS URL이어야 하며, 빌드 결과의 canonical URL, sitemap, Open Graph URL에 사용됩니다.

## Cloudflare 정적 배포

이 사이트는 Cloudflare Workers Static Assets의 `./dist`만 배포합니다. Worker entrypoint, SSR 어댑터, Functions, assets binding은 사용하지 않으며 `run_worker_first`는 반드시 `false`로 유지합니다. 따라서 정적 자산 요청은 Worker 코드를 실행하지 않습니다.

`npm run deploy`는 외부 프로덕션 상태를 변경합니다. 인증된 Cloudflare 계정과 명시적인 프로덕션 배포 권한이 있는 운영자만 실제 도메인으로 실행할 수 있습니다.

처음 승인된 배포는 두 번 수행합니다. 두 단계 모두 **실제 게시**이므로, 인증된 Cloudflare 계정과 명시적인 프로덕션 배포 권한이 있을 때만 실행합니다. 검증 목적으로 실행하지 않습니다.

1. 승인된 운영자가 `PUBLIC_SITE_URL=https://fan-guide.test npm run deploy`을 실행하고 Wrangler가 출력한 HTTPS origin을 기록합니다. 이 bootstrap 배포는 canonical, sitemap, OG URL에 테스트 origin을 **일시적으로 게시**합니다.
2. Wrangler가 출력한 실제 HTTPS origin을 설정해 `PUBLIC_SITE_URL=https://<wrangler-origin> npm run deploy`을 실행합니다. 이 두 번째 결과가 canonical, sitemap, OG URL의 실제 origin을 고정합니다.

실제 배포 전에 `npx wrangler deploy --dry-run`으로 구성과 `dist/`를 검증합니다.

## 출시 체크리스트

- [ ] `run_worker_first`가 `false`이고 Worker entrypoint 또는 Functions route가 없다.
- [ ] 비공식·비영리 안내문이 보인다.
- [ ] 고양 공연 날짜가 10월 7일과 8일로 정확하다.
- [ ] 티켓 링크가 공식 판매처를 가리킨다.
- [ ] 예상 셋리스트의 `예상 · 보장 아님` 표기가 페이지와 생성 포스터에 모두 보인다.
- [ ] 미공개 운영 정보는 게시하지 않고 `미공개 · 확인 필요`로 남아 있다.
- [ ] Kakao와 X 미리보기 도구에서 배포된 HTTPS URL의 OG 이미지를 확인했다.
- [ ] 모바일과 reduced-motion 스모크 테스트를 통과했다.
- [ ] 콘텐츠 감사의 확인 날짜가 현재이며 `npm run audit:content`를 통과했다.
