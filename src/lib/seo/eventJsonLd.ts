interface ConcertForJsonLd {
  venue: string;
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
  organizer: { '@type': 'Organization'; name: '현대카드' };
  url: 'https://tickets.interpark.com/contents/notice/detail/14180';
}

const eventName = 'The Weeknd: After Hours Til Dawn Tour — Goyang';

export function buildEventJsonLd(
  concert: ConcertForJsonLd,
  siteUrl: string,
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
      name: concert.venue,
      address: 'Goyang-si, Gyeonggi-do, KR',
    },
    performer: { '@type': 'MusicGroup', name: 'The Weeknd' },
    organizer: { '@type': 'Organization', name: '현대카드' },
    url: 'https://tickets.interpark.com/contents/notice/detail/14180',
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
