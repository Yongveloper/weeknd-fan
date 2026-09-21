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

/** Wayfinding labels: what people actually say and type into a map app. */
export const VENUE: ProperNoun = {
  latin: 'Goyang Stadium',
  ko: '고양종합운동장',
};

/**
 * Structured data: the venue's full name, which distinguishes the main
 * stadium from the auxiliary one. Its Korean half must equal the audited
 * content record — a test enforces that so this constant cannot drift.
 */
export const VENUE_FULL: ProperNoun = {
  latin: 'Goyang Sports Complex Main Stadium',
  ko: '고양종합운동장 주경기장',
};

export const STATION_DAEHWA: ProperNoun = {
  latin: 'Daehwa Station',
  ko: '대화역',
};

export const STATION_KINTEX: ProperNoun = {
  latin: 'Kintex Station',
  ko: '킨텍스역',
};

/** One stop whose Korean name joins two places; not two stops. */
export const BUS_STOP_VENUE: ProperNoun = {
  latin: 'Goyang Stadium / Ilsanseo-gu Office',
  ko: '고양종합운동장·일산서구청',
};

export const VENUE_ADDRESS: ProperNoun = {
  latin: '1601 Jungang-ro, Ilsanseo-gu, Goyang-si, Gyeonggi-do (Daehwa-dong)',
  ko: '경기도 고양시 일산서구 중앙로 1601 (대화동)',
};

/** Event organizer, cited in structured data. */
export const ORGANIZER_HYUNDAI_CARD: ProperNoun = {
  latin: 'Hyundai Card',
  ko: '현대카드',
};

/**
 * Kakao T shuttle departure points (TransportOperations). Every stop is
 * something a fan has to physically find, so each keeps its korean original.
 */
export const SHUTTLE_METRO_STOPS: ProperNoun[] = [
  { latin: 'Jamsil Station', ko: '잠실역' },
  { latin: 'Seoul Station', ko: '서울역' },
  { latin: 'Hapjeong Station', ko: '합정역' },
  { latin: 'Sadang Station', ko: '사당역' },
  { latin: 'Gangnam Station', ko: '강남역' },
  { latin: 'Nowon Station', ko: '노원역' },
  { latin: 'Wangsimni Station', ko: '왕십리역' },
  { latin: 'Sindorim Station', ko: '신도림역' },
  { latin: 'Migeum Station', ko: '미금역' },
  { latin: 'Yeongtong Station', ko: '영통역' },
  { latin: 'Bupyeong Station', ko: '부평역' },
];

export const SHUTTLE_REGIONAL_STOPS: ProperNoun[] = [
  { latin: 'Daejeon', ko: '대전' },
  { latin: 'Daegu', ko: '대구' },
  { latin: 'Jeonju', ko: '전주' },
  { latin: 'Gwangju', ko: '광주' },
  { latin: 'Busan', ko: '부산' },
  { latin: 'Cheonan', ko: '천안' },
  { latin: 'Cheongju', ko: '청주' },
];

/**
 * Visiting fans type the Korean string into a map app or show it to a taxi
 * driver, so the English page keeps it beside the translated name.
 */
export function bilingual(noun: ProperNoun, locale: Locale): string {
  return locale === DEFAULT_LOCALE ? noun.ko : `${noun.latin} · ${noun.ko}`;
}
