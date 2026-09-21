// Prints the current translatable-text hash for one source entry, for
// pasting into an overlay's `sourceHash` frontmatter/field.
//   npm run i18n:hash -- guides/32-tips-entry
//   npm run i18n:hash -- sources/nol-weeknd-transport-sms
// Requires Node 22 type stripping to import the .ts hash/parser directly, so
// the app and this tooling share one copy of the hashing logic.
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { translatableHash } from '../src/lib/i18n/content/hash.ts';
import { parseMarkdownSource } from '../src/lib/i18n/content/source-text.ts';

const MARKDOWN_COLLECTIONS = ['guides', 'discover'];

// Only run the CLI when this file is executed directly — `scripts/
// i18n-status.mjs` imports the helpers below and must not trigger it.
if (import.meta.url === `file://${process.argv[1]}`) {
  const target = process.argv[2];
  if (!target) {
    process.stderr.write('usage: npm run i18n:hash -- guides/32-tips-entry\n');
    process.exit(2);
  }
  process.stdout.write(`${await hashOf(target)}\n`);
}

/** Computes the current translatable-text hash for one `<collection>/<id>`. */
export async function hashOf(target) {
  const [collection, ...rest] = target.split('/');
  const id = rest.join('/');
  if (!collection || !id) {
    throw new Error(`Expected <collection>/<id>, got "${target}"`);
  }
  if (MARKDOWN_COLLECTIONS.includes(collection)) {
    const raw = await readFile(`src/data/${collection}/${id}.md`, 'utf8');
    return translatableHash(parseMarkdownSource(raw, target));
  }
  const file = JSON.parse(
    await readFile(`src/data/${collection}/${id}.json`, 'utf8'),
  );
  return translatableHash(jsonTranslatableText(collection, file, target));
}

/**
 * Builds the translatable text for one JSON source record.
 *
 * `setlist` and `concert` have `title`/`summary` like the markdown
 * collections. `sources` has neither — only `name` (and, for the SMS
 * variant, no `url`/`lastCheckedAt` either) — so `title` falls back to
 * `name` and `summary` is empty.
 */
export function jsonTranslatableText(collection, file, id) {
  const title = file.title ?? file.name;
  if (!title) throw new Error(`Expected a title or name in ${id}`);
  return {
    title,
    summary: file.summary ?? '',
    body: JSON.stringify(translatableJsonFields(collection, file)),
  };
}

/**
 * The JSON fields a translator rewrites beyond title/summary, in a fixed
 * order. Includes the shared `body` field (present on `setlist` and
 * `concert` via the common content schema) alongside each collection's own
 * prose fields — `transcript` for an SMS source record is rendered to
 * readers, so it is translatable too.
 */
export function translatableJsonFields(collection, file) {
  if (collection === 'setlist') {
    return [file.body ?? '', file.liveNote, file.singAlongNote];
  }
  if (collection === 'sources') {
    return [file.transcript ?? ''];
  }
  if (collection === 'concert') {
    return [
      file.body ?? '',
      file.venue,
      file.ageRestriction,
      ...file.shows.map((show) => show.dateLabel),
    ];
  }
  throw new Error(`Unknown collection: ${collection}`);
}
