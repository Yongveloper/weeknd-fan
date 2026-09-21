// Walks every source entry (markdown collections `guides`/`discover`, JSON
// collections `setlist`/`sources`/`concert`) for each supported locale and
// prints one tab-separated line per entry: locale, id, state, current hash.
// State is `ok`, `missing` (no overlay yet) or `stale` (overlay's recorded
// sourceHash no longer matches the current source). Exits 1 unless every
// entry is `ok`.
//   npm run i18n:status
// Requires Node 22 type stripping to import the .ts hash/parser directly, so
// the app and this tooling share one copy of the hashing logic.
import { readFile, readdir } from 'node:fs/promises';
import process from 'node:process';
import { translatableHash } from '../src/lib/i18n/content/hash.ts';
import { parseMarkdownSource } from '../src/lib/i18n/content/source-text.ts';
import { jsonTranslatableText } from './i18n-hash.mjs';

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
 * layout: `src/data/i18n/<locale>/<collection>/<id>.md`.
 */
async function checkMarkdownCollection(locale, collection) {
  const names = (await readdir(`src/data/${collection}`))
    .filter((name) => name.endsWith('.md'))
    .sort();
  for (const name of names) {
    const id = name.replace(/\.md$/, '');
    const raw = await readFile(`src/data/${collection}/${name}`, 'utf8');
    const current = translatableHash(
      parseMarkdownSource(raw, `${collection}/${id}`),
    );
    let state;
    try {
      const overlay = await readFile(
        `src/data/i18n/${locale}/${collection}/${name}`,
        'utf8',
      );
      const recorded = /^sourceHash: (\S+)$/m.exec(overlay)?.[1];
      state = recorded === current ? 'ok' : 'stale';
    } catch {
      state = 'missing';
    }
    report(locale, `${collection}/${id}`, state, current);
  }
}

/**
 * JSON collections keep a single bundled overlay file per locale
 * (`src/data/i18n/<locale>/<collection>.json`) mapping each id to its own
 * translation, with a `sourceHash` field per id.
 */
async function checkJsonCollection(locale, collection) {
  const names = (await readdir(`src/data/${collection}`))
    .filter((name) => name.endsWith('.json'))
    .sort();
  const overlay = await readJsonOverlay(locale, collection);
  for (const name of names) {
    const id = name.replace(/\.json$/, '');
    const file = JSON.parse(
      await readFile(`src/data/${collection}/${name}`, 'utf8'),
    );
    const current = translatableHash(
      jsonTranslatableText(collection, file, `${collection}/${id}`),
    );
    const recorded = overlay?.[id]?.sourceHash;
    const state =
      recorded === undefined
        ? 'missing'
        : recorded === current
          ? 'ok'
          : 'stale';
    report(locale, `${collection}/${id}`, state, current);
  }
}

async function readJsonOverlay(locale, collection) {
  try {
    return JSON.parse(
      await readFile(`src/data/i18n/${locale}/${collection}.json`, 'utf8'),
    );
  } catch {
    return null;
  }
}

function report(locale, id, state, hash) {
  if (state !== 'ok') failed = true;
  process.stdout.write(`${locale}\t${id}\t${state}\t${hash}\n`);
}
