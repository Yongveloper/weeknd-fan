# Task 12 report — Search, structured event data, and share preview

## Scope

- Implemented only Task 12: conservative `MusicEvent` JSON-LD, canonical/OG/Twitter metadata, conditional sitemap configuration, and the default share preview.
- No Task 13 performance/accessibility gates or later deployment work was added.

## TDD evidence

- RED: `PATH=/Users/yong/.nvm/versions/node/v22.14.0/bin:$PATH npm test -- event-json-ld.test.ts` failed because `src/lib/seo/eventJsonLd` did not exist.
- GREEN: the same test passed with three assertions after the minimal implementation.
- A second RED/GREEN cycle added and proved `normalizeSiteUrl`: it first failed as `normalizeSiteUrl is not a function`, then passed after implementation.
- Coverage locks one event per show, conservative supported schema fields, HTTP(S) site-origin normalization/rejection, and HTML-safe `<` escaping in the JSON-LD serializer.

## Generated asset provenance

- Method: built-in ImageGen generated a text-free background, then deterministic Node/Sharp SVG typography composited the required exact text. No Python image editing was used.
- Source: `/Users/yong/.codex/generated_images/01a04a6d-7425-7000-af43-5aa2d6c693db/exec-314d8f78-02af-4901-85f0-22e279f35588.png`.
- Original final: `public/og/default.jpg`, JPEG, 1200×630, 29,282 bytes; superseded by the fix-round composition below.
- Prompt: “Original DAWNFOLD abstract cinematic night-to-dawn scene: deep Night Black field, a large soft eclipse-like moon glow slightly right of center, restrained deep-red horizon haze in the lower third, a narrow cobalt-blue light seam, and a subtle dawn-amber edge along the horizon. Leave the left third and upper-left quadrant visibly uncluttered for later typography. Background only; no typography, people, artist likeness, logos, XO mark, official tour lockup, album artwork, sponsor marks, checkerboard, watermark, frame, border, or recognizable promotional artwork.”
- Inspection: viewed the generated 1731×909 source and final JPEG at original resolution. The final contains readable required text and no prohibited marks, portrait, checkerboard, or official-art imitation.

## Fix round 1

- `PUBLIC_SITE_URL` remains optional for local builds, but every nonempty malformed or non-HTTP(S) value now stops configuration with `PUBLIC_SITE_URL must be an absolute HTTP(S) URL`; invalid values are no longer silently treated as absent.
- Regression coverage proves missing, valid HTTPS, malformed, and FTP values. Fresh build invocations verified all four paths: missing omits sitemap; valid HTTPS emits it; malformed and FTP fail with the clear error.
- Recomposed `public/og/default.jpg` from the same ImageGen background with deterministic Sharp/SVG typography. The exact visible title is now `THE WEEKND · GOYANG` on one line. Final output: 1200×630 JPEG, 26,366 bytes, SHA-256 `7a096049089ab9a347940f6ae595e1d2638134775749d559fd4544eb745099d6`; original-resolution inspection passed.

## Build and metadata evidence

- Local Node 22.14.0 build succeeds without `PUBLIC_SITE_URL` and safely omits `dist/sitemap-index.xml`.
- `PUBLIC_SITE_URL=https://fan-guide.test npm run build` succeeds and creates a sitemap whose index uses the HTTPS test origin.
- Fresh built-HTML assertions confirmed absolute canonical/OG URLs, OG title/description/type/url/image, Twitter large-image card fields, one JSON-LD script containing exactly two `MusicEvent` records, and a valid sitemap link.

## Verification

- Node: `v22.14.0` explicitly selected from `/Users/yong/.nvm/versions/node/v22.14.0/bin`.
- `npm run verify` passed: lint, format, Astro check, content audit, unit tests, build, and E2E (`45 passed`, `1 skipped`).
- `npm test -- event-json-ld.test.ts` passed after final TDD changes (`3 passed`).
- `sips` confirmed the OG JPEG dimensions/format; `stat` confirmed its size is below 220 KB.
- `git diff --check` passed.

## Concerns

- Existing Astro checks retain one upstream TypeScript deprecation hint in `eslint.config.js`; Task 12 adds no diagnostics.
- Existing content build logs retain the known empty `showRecords` collection notice; Task 12 does not change content collection behavior.

## Commit

- Initial Task 12: `83b60d3 feat(seo): add event metadata and OG preview`.
- Fix round 1: `b78621f fix(seo): reject invalid public origins`.
- Status immediately after the fix commit: clean worktree before this report-evidence update.
