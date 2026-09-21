import type { TranslatableText } from './source-text';

/**
 * Builds the translatable text for one JSON source record.
 *
 * `setlist` and `concert` have `title`/`summary` like the markdown
 * collections. `sources` has neither — only `name` (and, for the SMS
 * variant, no `url`/`lastCheckedAt` either) — so `title` falls back to
 * `name` and `summary` is empty.
 *
 * Canonical location for this logic: `scripts/i18n-hash.mjs` re-exports it
 * rather than defining its own copy, so the app and the CLI tooling share
 * one implementation instead of two that could drift apart.
 */
export function jsonTranslatableText(
  collection: string,
  file: Record<string, unknown>,
  id: string,
): TranslatableText {
  const title =
    (file.title as string | undefined) ?? (file.name as string | undefined);
  if (!title) throw new Error(`Expected a title or name in ${id}`);
  return {
    title,
    summary: (file.summary as string | undefined) ?? '',
    body: JSON.stringify(translatableJsonFields(collection, file)),
  };
}

/**
 * The JSON fields a translator rewrites beyond title/summary, in a fixed
 * order. Includes the shared `body` field (present on `setlist` and
 * `concert` via the common content schema) alongside each collection's own
 * prose fields. `sources` has none: it translates `name` only, which
 * `jsonTranslatableText`'s `title` fallback already covers. `concert`
 * excludes `venue` — the venue name is not translated; it is pinned to
 * `proper-nouns.ts` by a unit test, and the overlay carries no `venue`
 * field to update.
 */
export function translatableJsonFields(
  collection: string,
  file: Record<string, unknown>,
): unknown[] {
  if (collection === 'setlist') {
    return [file.body ?? '', file.liveNote, file.singAlongNote];
  }
  if (collection === 'sources') {
    return [];
  }
  if (collection === 'concert') {
    const shows = file.shows as Array<{ dateLabel: string }>;
    return [
      file.body ?? '',
      file.ageRestriction,
      ...shows.map((show) => show.dateLabel),
    ];
  }
  throw new Error(`Unknown collection: ${collection}`);
}
