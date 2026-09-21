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
