import type { Locale } from '../locales';
import { en } from './en';
import { ko } from './ko';

/**
 * Korean is the shape of record; `en.ts` is checked against it. The mapping
 * recurses because groups nest (`guide.directions.heading`), and it widens
 * every leaf to `string` so English may differ from the Korean literal.
 */
type SameShape<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : SameShape<T[K]>;
};

export type UiStrings = SameShape<typeof ko>;

const DICTIONARIES: Record<Locale, UiStrings> = { ko, en };

export function ui(locale: Locale): UiStrings {
  return DICTIONARIES[locale];
}
