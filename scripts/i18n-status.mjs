// Walks every source entry (markdown collections `guides`/`discover`, JSON
// collections `setlist`/`sources`/`concert`) for each supported locale and
// prints one tab-separated line per entry: locale, id, state, current hash.
// State is `ok`, `missing` (no overlay yet) or `stale` (overlay's recorded
// sourceHash no longer matches the current source). Exits 1 unless every
// entry is `ok`.
//   npm run i18n:status
// Requires Node 22 type stripping to import the .ts hash/parser directly, so
// the app and this tooling share one copy of the hashing logic. The
// directory walk itself lives in `src/lib/i18n/content/collect.ts` — shared
// with the `translation-orphan`/`translation-stale` audit
// (`tests/unit/content-audit.test.ts`) — so this script and that audit
// cannot silently disagree about what "every overlay" means.
import process from 'node:process';
import { translatableHash } from '../src/lib/i18n/content/hash.ts';
import { parseMarkdownSource } from '../src/lib/i18n/content/source-text.ts';
import { jsonTranslatableText } from '../src/lib/i18n/content/json-text.ts';
import {
  walkJsonCollection,
  walkMarkdownCollection,
} from '../src/lib/i18n/content/collect.ts';

const LOCALES = ['en'];
const MARKDOWN_COLLECTIONS = ['guides', 'discover'];
const JSON_COLLECTIONS = ['setlist', 'sources', 'concert'];

let failed = false;

for (const locale of LOCALES) {
  for (const collection of MARKDOWN_COLLECTIONS) {
    await checkMarkdownCollection(locale, collection);
  }
  for (const collection of JSON_COLLECTIONS) {
    await checkJsonCollection(locale, collection);
  }
}

process.exit(failed ? 1 : 0);

/**
 * Markdown collections keep one overlay file per id, mirroring the source
 * layout: `src/data/i18n/<locale>/<collection>/<id>.md`. Only source-side
 * entries are reported here — an overlay with no matching source is an
 * orphan, which `npm run audit:translations` catches, not this status list.
 */
async function checkMarkdownCollection(locale, collection) {
  for (const entry of await walkMarkdownCollection(locale, collection)) {
    if (entry.sourceRaw === undefined) continue;
    const current = translatableHash(
      parseMarkdownSource(entry.sourceRaw, entry.id),
    );
    const recorded =
      entry.overlayRaw === undefined
        ? undefined
        : /^sourceHash: (\S+)$/m.exec(entry.overlayRaw)?.[1];
    const state =
      recorded === undefined
        ? 'missing'
        : recorded === current
          ? 'ok'
          : 'stale';
    report(locale, entry.id, state, current);
  }
}

/**
 * JSON collections keep a single bundled overlay file per locale
 * (`src/data/i18n/<locale>/<collection>.json`) mapping each id to its own
 * translation, with a `sourceHash` field per id.
 */
async function checkJsonCollection(locale, collection) {
  for (const entry of await walkJsonCollection(locale, collection)) {
    if (entry.sourceFile === undefined) continue;
    const current = translatableHash(
      jsonTranslatableText(collection, entry.sourceFile, entry.id),
    );
    const recorded = entry.overlayEntry?.sourceHash;
    const state =
      recorded === undefined
        ? 'missing'
        : recorded === current
          ? 'ok'
          : 'stale';
    report(locale, entry.id, state, current);
  }
}

function report(locale, id, state, hash) {
  if (state !== 'ok') failed = true;
  process.stdout.write(`${locale}\t${id}\t${state}\t${hash}\n`);
}
