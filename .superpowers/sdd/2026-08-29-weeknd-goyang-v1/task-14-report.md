# Task 14 Report — CI, Cloudflare Static Delivery, and Launch Verification

Date: 2026-08-29

## Delivery configuration

- Added GitHub Actions CI using Node.js 22.14.0, `npm ci`, Chromium installation, `PUBLIC_SITE_URL=https://fan-guide.test npm run verify`, and `npx wrangler deploy --dry-run`.
- Added `wrangler.jsonc` with only the Static Assets directory (`./dist`) and `run_worker_first: false`. It has no `main`, Worker source, assets binding, Functions route, or Astro Cloudflare adapter.
- Added `public/_headers` with `nosniff`, strict-origin referrer policy, camera/microphone/geolocation denial, and one-year immutable caching for fingerprinted `/_astro/*` assets.
- Added a unit assertion preventing reintroduction of a Worker entrypoint, assets binding, adapter, or altered static header/routing policy.
- Added deployment/launch procedures to `README.md` and `docs/content-update-runbook.md`; `.wrangler/` is ignored.

## Official documentation consulted

- 2026-08-29 — [Astro: Deploy your site to Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/): static deployment uses a Wrangler config with `assets.directory`; the Cloudflare adapter is for on-demand rendering.
- 2026-08-29 — [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/): matching static assets are served without Worker code; `assets.directory` configures the uploaded output.
- 2026-08-29 — [Cloudflare Static Assets headers](https://developers.cloudflare.com/workers/static-assets/headers/): `_headers` in a framework `public/` directory is copied to build output and applies custom static-response headers.
- 2026-08-29 — [Cloudflare Static Assets billing and limitations](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/): static-asset requests are free and unlimited; Worker-script requests are separately billed.
- 2026-08-29 — [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/#assets) and [Wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands/): validated current assets configuration and local Wrangler command use.

## Fresh validation

All commands used Node.js `v22.14.0`.

```text
npm ci
  added 497 packages; exit 0

PUBLIC_SITE_URL=https://fan-guide.test npm run verify
  lint, format, Astro check, content audit (12), unit tests (21), build,
  budget, and Playwright (91 passed, 3 intended skips); exit 0

npm run budget
  aggregate JS 28.3 KiB / 75 KiB; aggregate raster 739.0 KiB / 1100 KiB;
  home raster 144.1 KiB / 700 KiB; exit 0

npx wrangler deploy --dry-run
  wrangler 4.127.1 read 189 files from dist; "No bindings found.";
  "--dry-run: exiting now."; exit 0
```

Built output inspection confirmed `dist/_headers`, canonical and Open Graph URLs at `https://fan-guide.test/`, and sitemap URLs at the same HTTPS origin.

## External-state boundary

No authentication, Cloudflare project/domain creation, publication, or real deployment was attempted. The only Wrangler execution used `--dry-run`; it validated local `dist/` and exited before deployment. `npm run deploy` is intentionally an explicit, authenticated-operator action and requires `PUBLIC_SITE_URL`.

## Concerns

- `npm ci` under the required Node 22.14.0 succeeds but emits existing `EBADENGINE` warnings from locked transitive packages requesting newer Node versions; the complete suite still passes on the required runtime. Updating those dependencies is outside Task 14 scope.
- The worktree already contained a modified `task-13-report.md`; it was preserved and excluded from this task's commit.

## Fix round 1 — 2026-08-29

- Corrected the first-deployment instructions: the bootstrap step is now the explicit, authorized real-deploy command `PUBLIC_SITE_URL=https://fan-guide.test npm run deploy`. Both the README and runbook warn that it temporarily publishes test-origin canonical, sitemap, and OG URLs; the second authorized deployment uses the HTTPS origin printed by Wrangler.
- Replaced the non-empty shell guard with `scripts/assert-production-origin.mjs`. It requires a parseable absolute `https:` `PUBLIC_SITE_URL` before the build or `wrangler deploy` can run. Unit coverage rejects missing, HTTP, FTP, and malformed values and accepts HTTPS without invoking deployment.
- Strengthened the static-delivery regression assertion with semantic JSONC parsing, exact allowed Wrangler config keys, static Astro output, no Cloudflare adapter, and absence of scoped Functions/Worker entrypoint paths.
- Fresh Node 22.14.0 validation: `PUBLIC_SITE_URL=https://fan-guide.test npm run verify` passed (26 unit tests; 91 Playwright passed and 3 intended skips), `npm run budget` passed, `npx wrangler deploy --dry-run` read 189 `dist/` files with no bindings and exited before deploy, and `git diff --check` passed.

## Fix round 2 — 2026-08-29

- Replaced the Astro source-text assertion with a cache-busted dynamic import of `astro.config.mjs` under controlled missing and HTTPS `PUBLIC_SITE_URL` values. The evaluated configurations both require `output === 'static'` and no adapter; the valid origin resolves as expected.
- Added mutation-style confidence checks proving that the config guard rejects server output and an adapter-shaped configuration. Package, Wrangler JSONC, and scoped Function/Worker-path checks remain secondary defense.
- Fresh Node 22.14.0 validation again passed: targeted static config test; complete `PUBLIC_SITE_URL=https://fan-guide.test npm run verify` (26 unit tests; 91 Playwright passed, 3 intended skips); `npm run budget`; `npx wrangler deploy --dry-run` (189 `dist/` files, no bindings, exited before deployment); and `git diff --check`.
