import { readFile, readdir } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import type { TranslationAuditRecord } from '../../content/audit';
// Explicit `.ts` extensions (not the convention elsewhere under src/lib):
// this module is imported directly by `scripts/i18n-status.mjs` under
// Node's type-stripping loader, which — unlike Vite/vitest — requires a
// resolvable extension on relative runtime imports.
import { translatableHash, urlsIn } from './hash.ts';
import { parseMarkdownSource } from './source-text.ts';
import { jsonTranslatableText } from './json-text.ts';
import { DEFAULT_LOCALE, LOCALES } from '../locales.ts';

const MARKDOWN_COLLECTIONS = ['guides', 'discover'] as const;
const JSON_COLLECTIONS = ['setlist', 'sources', 'concert'] as const;

/**
 * Recursive so this walk can never fall out of step with what the Astro
 * content loaders see: every markdown/JSON collection — source and overlay
 * alike — is declared with a `**` glob pattern in `content.config.ts`. A
 * flat `readdir` would silently stop covering a nested id the moment one
 * appeared, while the build's own orphan guard (`src/lib/content/
 * queries.ts`) kept walking it via the glob loader — two notions of "every
 * overlay" that would then agree only by accident of a flat tree.
 */
async function listRecursive(
  dir: string,
  extension: string,
): Promise<string[]> {
  let entries: Dirent[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const ids: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const nested = await listRecursive(`${dir}/${entry.name}`, extension);
      ids.push(...nested.map((id) => `${entry.name}/${id}`));
    } else if (entry.name.endsWith(extension)) {
      ids.push(entry.name.slice(0, -extension.length));
    }
  }
  return ids;
}

export type MarkdownWalkEntry = {
  /** `<collection>/<id>`, matching the overlay/source id scheme. */
  id: string;
  sourceRaw?: string;
  overlayRaw?: string;
};

/**
 * The single directory walk for one markdown collection, shared by the
 * translation audit (`collectTranslationRecords`, below) and
 * `scripts/i18n-status.mjs`. Walking the union of source and overlay ids —
 * not just the source side — is what lets an overlay whose source has been
 * deleted or renamed show up at all; a source-only walk would silently miss
 * it, which is exactly the gap `translation-orphan` exists to close.
 */
export async function walkMarkdownCollection(
  locale: string,
  collection: string,
  root = '.',
): Promise<MarkdownWalkEntry[]> {
  const sourceIds = new Set(
    await listRecursive(`${root}/src/data/${collection}`, '.md'),
  );
  const overlayIds = new Set(
    await listRecursive(`${root}/src/data/i18n/${locale}/${collection}`, '.md'),
  );
  const allIds = [...new Set([...sourceIds, ...overlayIds])].sort();

  const entries: MarkdownWalkEntry[] = [];
  for (const relativeId of allIds) {
    entries.push({
      id: `${collection}/${relativeId}`,
      sourceRaw: sourceIds.has(relativeId)
        ? await readFile(
            `${root}/src/data/${collection}/${relativeId}.md`,
            'utf8',
          )
        : undefined,
      overlayRaw: overlayIds.has(relativeId)
        ? await readFile(
            `${root}/src/data/i18n/${locale}/${collection}/${relativeId}.md`,
            'utf8',
          )
        : undefined,
    });
  }
  return entries;
}

export type JsonOverlayEntry = { sourceHash: string; [key: string]: unknown };

export type JsonWalkEntry = {
  /** `<collection>/<id>`, matching the overlay/source id scheme. */
  id: string;
  sourceFile?: Record<string, unknown>;
  overlayEntry?: JsonOverlayEntry;
};

/**
 * The single directory/bundle walk for one JSON collection. See
 * `walkMarkdownCollection` for why this covers the union of source and
 * overlay ids rather than the source side alone.
 */
export async function walkJsonCollection(
  locale: string,
  collection: string,
  root = '.',
): Promise<JsonWalkEntry[]> {
  const sourceIds = new Set(
    await listRecursive(`${root}/src/data/${collection}`, '.json'),
  );
  let bundle: Record<string, JsonOverlayEntry>;
  try {
    bundle = JSON.parse(
      await readFile(
        `${root}/src/data/i18n/${locale}/${collection}.json`,
        'utf8',
      ),
    );
  } catch {
    bundle = {};
  }
  const allIds = [...new Set([...sourceIds, ...Object.keys(bundle)])].sort();

  const entries: JsonWalkEntry[] = [];
  for (const entryId of allIds) {
    entries.push({
      id: `${collection}/${entryId}`,
      sourceFile: sourceIds.has(entryId)
        ? JSON.parse(
            await readFile(
              `${root}/src/data/${collection}/${entryId}.json`,
              'utf8',
            ),
          )
        : undefined,
      overlayEntry: bundle[entryId],
    });
  }
  return entries;
}

/**
 * Every overlay on disk, as a translation-audit record. Korean is the
 * source of record.
 *
 * `npm run audit:translations` (`tests/unit/content-audit.test.ts`) is the
 * only consumer, and it walks the filesystem directly rather than going
 * through Astro's collections, so this is not shadowed by the build-time
 * orphan guard in `src/lib/content/queries.ts` — the two run at different
 * times, for the same reason, and this one runs first and without needing
 * a full Astro build.
 */
export async function collectTranslationRecords(
  root = '.',
): Promise<TranslationAuditRecord[]> {
  const records: TranslationAuditRecord[] = [];
  for (const locale of LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    for (const collection of MARKDOWN_COLLECTIONS) {
      for (const entry of await walkMarkdownCollection(
        locale,
        collection,
        root,
      )) {
        if (entry.overlayRaw === undefined) continue;
        records.push(markdownRecord(locale, entry));
      }
    }
    for (const collection of JSON_COLLECTIONS) {
      for (const entry of await walkJsonCollection(locale, collection, root)) {
        if (entry.overlayEntry === undefined) continue;
        records.push(jsonRecord(locale, collection, entry));
      }
    }
  }
  return records;
}

function markdownRecord(
  locale: string,
  entry: MarkdownWalkEntry,
): TranslationAuditRecord {
  const overlayRaw = entry.overlayRaw!;
  const recordedHash = /^sourceHash: (\S+)$/m.exec(overlayRaw)?.[1] ?? '';
  const overlayText = parseMarkdownSource(overlayRaw, `${locale}/${entry.id}`);
  const translatedUrls = urlsIn(overlayText.body ?? '');

  if (entry.sourceRaw === undefined) {
    return {
      id: entry.id,
      locale,
      sourceExists: false,
      sourceHash: recordedHash,
      currentHash: '',
      sourceUrls: [],
      translatedUrls,
    };
  }
  const sourceText = parseMarkdownSource(entry.sourceRaw, entry.id);
  return {
    id: entry.id,
    locale,
    sourceExists: true,
    sourceHash: recordedHash,
    currentHash: translatableHash(sourceText),
    sourceUrls: urlsIn(sourceText.body ?? ''),
    translatedUrls,
  };
}

function jsonRecord(
  locale: string,
  collection: string,
  entry: JsonWalkEntry,
): TranslationAuditRecord {
  const overlay = entry.overlayEntry!;
  const overlayText = jsonTranslatableText(
    collection,
    overlay,
    `${locale}/${entry.id}`,
  );
  const translatedUrls = urlsIn(overlayText.body ?? '');

  if (entry.sourceFile === undefined) {
    return {
      id: entry.id,
      locale,
      sourceExists: false,
      sourceHash: overlay.sourceHash,
      currentHash: '',
      sourceUrls: [],
      translatedUrls,
    };
  }
  const sourceText = jsonTranslatableText(
    collection,
    entry.sourceFile,
    entry.id,
  );
  return {
    id: entry.id,
    locale,
    sourceExists: true,
    sourceHash: overlay.sourceHash,
    currentHash: translatableHash(sourceText),
    sourceUrls: urlsIn(sourceText.body ?? ''),
    translatedUrls,
  };
}
