import { DEFAULT_LOCALE, type Locale } from './locales';

/**
 * Proper nouns never go through the UI dictionaries. English carries a
 * definite article ("The Weeknd") that Korean particles attach to
 * differently, so any sentence assembled from fragments breaks in one
 * locale or the other.
 */
export const ARTIST = 'The Weeknd';
export const TOUR = 'After Hours Til Dawn';

export type ProperNoun = { latin: string; ko: string };

export const VENUE: ProperNoun = {
  latin: 'Goyang Stadium',
  ko: '고양종합운동장',
};

export const STATION_DAEHWA: ProperNoun = {
  latin: 'Daehwa Station',
  ko: '대화역',
};

/**
 * Visiting fans type the Korean string into a map app or show it to a taxi
 * driver, so the English page keeps it beside the translated name.
 */
export function bilingual(noun: ProperNoun, locale: Locale): string {
  return locale === DEFAULT_LOCALE ? noun.ko : `${noun.latin} · ${noun.ko}`;
}
