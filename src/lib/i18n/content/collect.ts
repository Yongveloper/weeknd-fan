import { readFile, readdir } from 'node:fs/promises';
import type { TranslationAuditRecord } from '../../content/audit';
import { translatableHash, urlsIn } from './hash';
import { parseMarkdownSource } from './source-text';
import { jsonTranslatableText } from '../../../../scripts/i18n-hash.mjs';
import { DEFAULT_LOCALE, LOCALES } from '../locales';

const MARKDOWN_COLLECTIONS = ['guides', 'discover'] as const;
const JSON_COLLECTIONS = ['setlist', 'sources', 'concert'] as const;

/**
 * Walks every overlay on disk — not every source — so a translation whose
 * source entry has since been deleted or renamed (an orphan) is found, not
 * only one whose source prose has drifted. Mirrors the id scheme
 * `scripts/i18n-status.mjs` uses and shares its hashing helpers, so the
 * audit and the status CLI never disagree about what a hash covers.
 */
export async function collectTranslationRecords(): Promise<
  TranslationAuditRecord[]
> {
  const records: TranslationAuditRecord[] = [];
  for (const locale of LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    for (const collection of MARKDOWN_COLLECTIONS) {
      records.push(...(await collectMarkdownRecords(locale, collection)));
    }
    for (const collection of JSON_COLLECTIONS) {
      records.push(...(await collectJsonRecords(locale, collection)));
    }
  }
  return records;
}

async function collectMarkdownRecords(
  locale: string,
  collection: (typeof MARKDOWN_COLLECTIONS)[number],
): Promise<TranslationAuditRecord[]> {
  const overlayDir = `src/data/i18n/${locale}/${collection}`;
  let names: string[];
  try {
    names = (await readdir(overlayDir)).filter((name) => name.endsWith('.md'));
  } catch {
    return [];
  }

  const records: TranslationAuditRecord[] = [];
  for (const name of names.sort()) {
    const id = `${collection}/${name.replace(/\.md$/, '')}`;
    const overlayRaw = await readFile(`${overlayDir}/${name}`, 'utf8');
    const recordedHash = /^sourceHash: (\S+)$/m.exec(overlayRaw)?.[1] ?? '';
    const overlayText = parseMarkdownSource(overlayRaw, `${locale}/${id}`);
    const translatedUrls = urlsIn(overlayText.body ?? '');

    let sourceExists = true;
    let currentHash = '';
    let sourceUrls: string[] = [];
    try {
      const sourceRaw = await readFile(
        `src/data/${collection}/${name}`,
        'utf8',
      );
      const sourceText = parseMarkdownSource(sourceRaw, id);
      currentHash = translatableHash(sourceText);
      sourceUrls = urlsIn(sourceText.body ?? '');
    } catch {
      sourceExists = false;
    }

    records.push({
      id,
      locale,
      sourceExists,
      sourceHash: recordedHash,
      currentHash,
      sourceUrls,
      translatedUrls,
    });
  }
  return records;
}

async function collectJsonRecords(
  locale: string,
  collection: (typeof JSON_COLLECTIONS)[number],
): Promise<TranslationAuditRecord[]> {
  let bundle: Record<string, { sourceHash: string }>;
  try {
    bundle = JSON.parse(
      await readFile(`src/data/i18n/${locale}/${collection}.json`, 'utf8'),
    );
  } catch {
    return [];
  }

  const records: TranslationAuditRecord[] = [];
  for (const entryId of Object.keys(bundle).sort()) {
    const overlay = bundle[entryId];
    if (!overlay) continue;
    const id = `${collection}/${entryId}`;
    const overlayText = jsonTranslatableText(
      collection,
      overlay,
      `${locale}/${id}`,
    );
    const translatedUrls = urlsIn(overlayText.body ?? '');

    let sourceExists = true;
    let currentHash = '';
    let sourceUrls: string[] = [];
    try {
      const sourceFile = JSON.parse(
        await readFile(`src/data/${collection}/${entryId}.json`, 'utf8'),
      );
      const sourceText = jsonTranslatableText(collection, sourceFile, id);
      currentHash = translatableHash(sourceText);
      sourceUrls = urlsIn(sourceText.body ?? '');
    } catch {
      sourceExists = false;
    }

    records.push({
      id,
      locale,
      sourceExists,
      sourceHash: overlay.sourceHash,
      currentHash,
      sourceUrls,
      translatedUrls,
    });
  }
  return records;
}
