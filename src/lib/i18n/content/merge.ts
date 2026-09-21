import type { Locale } from '../locales';

export type Localized<D, R> = {
  /** Translated where a translation exists, source of record otherwise. */
  data: D;
  /** Passed to `render()`. The overlay entry when translated. */
  renderEntry: R;
  translated: boolean;
};

/** Overlay ids are `<locale>/<id>`; source ids are bare. */
export function overlayId(locale: Locale, id: string): string {
  return `${locale}/${id}`;
}

/**
 * The glob loader keeps the pattern's collection-name segment in the id (a
 * file at `src/data/i18n/en/guides/32-tips-entry.md` gets the id
 * `en/guides/32-tips-entry`, not `en/32-tips-entry`), so a lookup keyed by
 * `overlayId(locale, sourceId)` (`<locale>/<id>`) has to drop that middle
 * segment before it can match. JSON-bundle overlays (setlist, sources,
 * concert) are hand-authored objects keyed by the bare source id directly —
 * they never go through this function.
 */
export function overlayEntryKey(id: string): string {
  const [locale, , ...rest] = id.split('/');
  return `${locale}/${rest.join('/')}`;
}
