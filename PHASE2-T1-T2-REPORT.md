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

---

## Phase 2 hash-scope corrections (pending-phase2-hash-fix.md)

Applied the four fixes from
`.superpowers/sdd/2026-09-20-english-localization-phase-1-infrastructure/pending-phase2-hash-fix.md`.

### Fix 1 — dropped `venue` from the concert hash

`translatableJsonFields('concert', …)` no longer includes `file.venue`.
`VENUE`/`VENUE_FULL` in `proper-nouns.ts` already own the translated name,
and a unit test pins `VENUE_FULL.ko` to `concert.venue`, so a venue rename
already fails loudly there without needing the hash to also flag it.

### Fix 2 — dropped `transcript` from the sources hash, fixed the comment

`translatableJsonFields('sources', …)` now returns `[]`. Verified the
"rendered to readers" claim was false before changing anything:

```
$ grep -rn 'transcript' src/ --include='*.astro' --include='*.ts'
src/content.config.ts:39:      transcript: z.never().optional(),
src/content.config.ts:49:      transcript: z.string().min(1),
src/pages/[...locale]/sources.astro:33:  data: { medium: 'sms'; receivedAt: Date; sender: string; transcript: string };
```

`transcript` appears only as a Zod schema field and as part of an
`isSmsSource` type-guard's return type annotation — never as
`source.data.transcript` anywhere the page actually reads a value for
markup. `src/pages/[...locale]/sources.astro` renders `source.data.name`
for every source, SMS or otherwise (lines 112, 120, 176, 179, 139, 198).

Also confirmed against a real build (`PUBLIC_SITE_URL=https://fan-guide.test
npm run build`): the 863-character transcript in
`src/data/sources/nol-weeknd-transport-sms.json` does not appear, in whole
or by a 20-character substring, in `dist/sources/index.html` or
`dist/en/sources/index.html`.

The stale comment above `translatableJsonFields` was rewritten to state
what's actually true: `sources` has no collection-specific prose field —
`name` is the only translated field, covered by `jsonTranslatableText`'s
`title = file.title ?? file.name` fallback.

### Fix 3 — reconciled the entry count

The original count of "107 data lines" was wrong. The true figure is
**106**: 11 guides + 11 discover + 38 setlist + 45 sources + 1 concert — not
46 sources. `ls src/data/sources/*.json | wc -l` gives 45, and the raw
script output (`node scripts/i18n-status.mjs`, no npm wrapper) is exactly
106 lines, all data lines, confirming the file-count discrepancy — not a
script double-count/skip — was the error. No script change was needed.

### Fix 4 — corrected the plan's age-restriction guidance

`docs/superpowers/plans/2026-09-20-english-localization-phase-2-content.md`:
both the guidance line and its worked JSON example changed from
`19 and over (Korean age reckoning)` to `Ages 19 and over`, with the
parenthetical's rationale replaced by a note that `만` already means
ordinary international reckoning, so the parenthetical implied a
nonexistent special rule.

### Test coverage added

`tests/unit/i18n-hash.test.ts` had no coverage at all for the JSON branch
(`jsonTranslatableText` / `translatableJsonFields`) before this change —
only the markdown branch was tested. Added a `describe('translatableJsonFields', …)`
block (3 new tests, imported directly from `scripts/i18n-hash.mjs`) that:

- asserts changing `concert.venue` does not change the hashed fields,
- asserts changing `sources.transcript` does not change the hashed
  fields, and that the hashed fields are `[]`,
- asserts a `sources.name` change still changes the full hash via
  `jsonTranslatableText`, so the empty array above isn't hiding a
  dead code path.

These tests fail if `venue` or `transcript` creep back into the hash.

### Before / after hashes

| Entry                              | Before             | After              |
| ---------------------------------- | ------------------ | ------------------ |
| `concert/goyang-2026`              | `459aa55cee3fe2d2` | `51698299392e7e0b` |
| `sources/nol-weeknd-transport-sms` | `a94006f766454267` | `cee44a64276747e8` |

Every `sources/*` hash changed (not only the SMS one), because the hashed
body went from `JSON.stringify([''])` to `JSON.stringify([])` for every
source record, SMS or not. Expected per the brief: no overlays exist yet,
so nothing goes stale.

### Gate command output

```
$ npx vitest run tests/unit/i18n-hash.test.ts
PASS (12) FAIL (0)

$ npm run verify:core
... (lint: 0 errors 0 warnings 1 pre-existing hint)
... (test:unit: Test Files 23 passed (23), Tests 108 passed (108))
... (build: 14 page(s) built)
... (budget: aggregate js-gzip=73.6KiB/75.0KiB raster=1221.6KiB/1300.0KiB — all pages under budget)
$ node scripts/check-dist-i18n.mjs
dist i18n ok	14 pages
$ echo $?
0

$ npm run i18n:status | tail -3
en	sources/umc-kiss-land	missing	e62803ad739c9fba
en	sources/umc-starboy	missing	2bb2c4939c09b4c2
en	concert/goyang-2026	missing	51698299392e7e0b
$ echo $?   # of `npm run i18n:status` itself, checked separately
1

$ npm run i18n:hash -- concert/goyang-2026
51698299392e7e0b

$ npm run i18n:hash -- sources/nol-weeknd-transport-sms
cee44a64276747e8
```

### Files touched

```
scripts/i18n-hash.mjs
tests/unit/i18n-hash.test.ts
docs/superpowers/plans/2026-09-20-english-localization-phase-2-content.md
```

No file under `src/data/` touched. `wrangler.jsonc` untouched. No new
runtime dependencies.
