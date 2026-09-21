# Phase 2, Tasks 1–2 — report

## Worktree/branch defect found before starting

This worktree's branch (`worktree-agent-a6fa2527943a1c1e2`) was checked out at
`2feeca8`, which is the merge-base of this branch and the Phase 1 branch
(`feat/english-localization`, at `0d0e609` in
`/Users/yong/dev/weeknd-fan/.worktrees/i18n-en`) — **not** the Phase 1 tip.
As a result the plan and spec files named in the brief did not exist in this
tree at all (`git show HEAD:docs/superpowers/plans/...` → `fatal: path ...
does not exist in 'HEAD'`), and none of Phase 1's infrastructure
(`src/lib/i18n/routes.ts`, `locales.ts`, `[...locale]` pages, etc.) was
present either.

Since this branch had zero unique commits (its tip equaled the merge-base
with Phase 1), fast-forwarding was lossless:

```
git merge --ff-only feat/english-localization
```

This brought the worktree to `0d0e609` before any of my work began. All
diffs below are relative to that commit.

## Plan defects found and fixed

1. **`scalar()` in Task 1's own test doesn't catch a folded YAML value.**
   The plan's regex `^title: (\S.*)$` matches `title: >` (captures `>`),
   so the "fails loudly on folded scalar" test failed against the plan's
   own snippet. Fixed by rejecting a trimmed value that is itself a YAML
   block-scalar indicator (`^[|>][+-]?\d*$`) in `src/lib/i18n/content/source-text.ts`.
2. **Task 2's `sources` JSON handling doesn't fit the real schema**, exactly
   as the brief warned. `src/data/sources/*.json` records have no
   `title`/`summary` at all — only `name` — and one variant
   (`nol-weeknd-transport-sms.json`) has no `url`/`lastCheckedAt`, instead
   carrying `medium: "sms"`, `sender`, `receivedAt`, `transcript`. Fixed:
   `title` falls back to `file.name`, `summary` falls back to `''`, and for
   `sources` the hashed "body" is `[file.transcript ?? '']` — `transcript`
   is rendered to readers by `SourceList.astro` for the SMS variant, so
   it's translatable prose, not metadata.
3. **Task 2's `translatableJsonFields` omits the shared `body` field.**
   `setlist` and `concert` extend the same `common` Zod schema as
   guides/discover, which includes an optional `body: z.string()`. Some
   `setlist` entries populate it (e.g. `01-baptized-in-fear.json` has
   `"body": "공연의 첫 장면과 최근 앨범 3부작의 마지막 장을 연결해 듣는다."`)
   — real prose the plan's snippet never hashed, which would let a body
   edit go undetected as stale. Fixed by including `file.body ?? ''` in
   `translatableJsonFields` for both `setlist` and `concert`.
4. **Importing `i18n-hash.mjs`'s helpers from `i18n-status.mjs` executed its
   CLI path.** The plan's snippet has top-level `process.argv[2]` handling
   with no guard; importing the file (to reuse `translatableJsonFields`)
   printed the usage message and called `process.exit(2)`. Fixed with an
   entry-point guard: `if (import.meta.url === \`file://${process.argv[1]}\`)`.
5. **Test count off by one.** The plan says "Expected: PASS — 10 tests" for
   `tests/unit/i18n-hash.test.ts`; the file as given has 9 (`describe`
   blocks: 3 + 4 + 2). Not a functional issue, just a doc inaccuracy.

## JSON shapes found (Task 2, Step 1 checkpoint)

- `src/data/setlist/*.json` (38 files): has `title`, `summary`, `body`
  (common schema), plus `liveNote`, `singAlongNote` (both prose),
  `songTitle`/`album` (proper nouns, left untranslated).
- `src/data/sources/*.json` (46 files): normal shape
  `{ name, url, kind, lastCheckedAt }`. One SMS variant,
  `nol-weeknd-transport-sms.json`:
  `{ name, kind, medium: "sms", sender, receivedAt, transcript }` — no
  `url`/`lastCheckedAt`, and `transcript` is a long verbatim Korean SMS body
  that's rendered on the sources page.
- `src/data/concert/goyang-2026.json` (1 file): has `title`, `summary`,
  `venue`, `ageRestriction`, `shows[].dateLabel`; no `body` populated
  currently (schema allows it).

Implemented in `scripts/i18n-hash.mjs`'s `jsonTranslatableText()` /
`translatableJsonFields()`, reused by `scripts/i18n-status.mjs`.

## Gate command output

```
$ npx vitest run tests/unit/i18n-hash.test.ts
PASS (9) FAIL (0)

$ npm run check
...
Result (149 files):
- 0 errors
- 0 warnings
- 1 hint   (pre-existing eslint.config.js tseslint.config deprecation hint, unrelated to this work)

$ npm run lint
ESLint: No issues found

$ npm run i18n:status
(110 lines incl. npm banner; 107 data lines: 11 guides + 11 discover + 38 setlist + 46 sources + 1 concert, all "missing")
exit code: 1

$ npm run i18n:hash -- guides/32-tips-entry
a292cb5030b783e7
```

All green / expected-failing as specified.

## Files touched (all new; diff vs. Phase 1 tip `0d0e609`)

```
package.json                        |   2 +
scripts/i18n-hash.mjs               |  83 ++++++++
scripts/i18n-status.mjs             | 104 +++++++++
src/lib/i18n/content/hash.ts        |  32 +++
src/lib/i18n/content/source-text.ts |  40 +++
tests/unit/i18n-hash.test.ts        |  83 ++++++++
6 files changed, 344 insertions(+)
```

No file under `src/data/` was touched. No file owned by Phase 1
(`wrangler.jsonc`, `astro.config.mjs`, `src/content.config.ts`,
`src/components/`, `src/pages/`, `src/layouts/`, `src/lib/i18n/ui/`,
`src/lib/i18n/{locales,routes,proper-nouns}.ts`, `src/lib/content/`,
`scripts/check-dist-i18n.mjs`) was touched.

## Commits

1. `c66e3c5` — `feat(i18n): hash only the translatable part of a source entry`
2. `34b7e38` — `feat(i18n): add the translation status and hash scripts`

## Not run (per hard constraints)

`npm run test:e2e`, `npx playwright test`, `npm run verify`, `npm run
verify:core` were not run.
