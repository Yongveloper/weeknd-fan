import type { Locale } from '../i18n/locales';
import { VENUE_FULL, bilingual } from '../i18n/proper-nouns';

interface ConcertForJsonLd {
  shows: Array<{ startsAt: string }>;
}

export interface MusicEventJsonLd {
  '@context': 'https://schema.org';
  '@type': 'MusicEvent';
  name: string;
  startDate: string;
  eventStatus: 'https://schema.org/EventScheduled';
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode';
  location: {
    '@type': 'Place';
    name: string;
    address: 'Goyang-si, Gyeonggi-do, KR';
  };
  performer: { '@type': 'MusicGroup'; name: 'The Weeknd' };
  organizer: { '@type': 'Organization'; name: string };
  url: 'https://tickets.interpark.com/contents/notice/detail/14180';
  inLanguage: string;
}

const eventName = 'The Weeknd: After Hours Til Dawn Tour — Goyang';

/**
 * Unlike `location.name`, this is not wayfinding — no one needs the Korean
 * string to reach the organizer. It's matched by crawlers against a
 * canonical org entity, so each locale gets one name, not a combined form.
 */
const ORGANIZER_NAME: Record<Locale, string> = {
  ko: '현대카드',
  en: 'Hyundai Card',
};

export function buildEventJsonLd(
  concert: ConcertForJsonLd,
  siteUrl: string,
  locale: Locale,
): MusicEventJsonLd[] {
  normalizeSiteUrl(siteUrl);

  return concert.shows.map(({ startsAt }) => ({
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: eventName,
    startDate: startsAt,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: bilingual(VENUE_FULL, locale),
      address: 'Goyang-si, Gyeonggi-do, KR',
    },
    performer: { '@type': 'MusicGroup', name: 'The Weeknd' },
    organizer: {
      '@type': 'Organization',
      name: ORGANIZER_NAME[locale],
    },
    url: 'https://tickets.interpark.com/contents/notice/detail/14180',
    inLanguage: locale,
  }));
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function normalizeSiteUrl(siteUrl: string): string {
  let url: URL;

  try {
    url = new URL(siteUrl);
  } catch {
    throw new Error('siteUrl must be an absolute HTTP(S) URL');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('siteUrl must be an absolute HTTP(S) URL');
  }

  return url.origin + '/';
}
