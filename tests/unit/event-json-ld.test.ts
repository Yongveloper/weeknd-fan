import { describe, expect, it } from 'vitest';
import {
  buildEventJsonLd,
  normalizeSiteUrl,
  serializeJsonLd,
} from '../../src/lib/seo/eventJsonLd';

describe('buildEventJsonLd', () => {
  it('emits one conservative MusicEvent per Goyang date', () => {
    const events = buildEventJsonLd(
      {
        venue: '고양종합운동장 주경기장',
        shows: [
          { startsAt: '2026-10-07T19:45:00+09:00' },
          { startsAt: '2026-10-08T19:45:00+09:00' },
        ],
      },
      'https://fan-guide.test',
    );

    expect(events).toEqual([
      {
        '@context': 'https://schema.org',
        '@type': 'MusicEvent',
        name: 'The Weeknd: After Hours Til Dawn Tour — Goyang',
        startDate: '2026-10-07T19:45:00+09:00',
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: '고양종합운동장 주경기장',
          address: 'Goyang-si, Gyeonggi-do, KR',
        },
        performer: { '@type': 'MusicGroup', name: 'The Weeknd' },
        organizer: { '@type': 'Organization', name: '현대카드' },
        url: 'https://tickets.interpark.com/contents/notice/detail/14180',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'MusicEvent',
        name: 'The Weeknd: After Hours Til Dawn Tour — Goyang',
        startDate: '2026-10-08T19:45:00+09:00',
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: '고양종합운동장 주경기장',
          address: 'Goyang-si, Gyeonggi-do, KR',
        },
        performer: { '@type': 'MusicGroup', name: 'The Weeknd' },
        organizer: { '@type': 'Organization', name: '현대카드' },
        url: 'https://tickets.interpark.com/contents/notice/detail/14180',
      },
    ]);
  });

  it('normalizes the site URL and rejects non-http origins', () => {
    const concert = {
      venue: '고양종합운동장 주경기장',
      shows: [{ startsAt: '2026-10-07T19:45:00+09:00' }],
    };

    expect(normalizeSiteUrl('https://fan-guide.test/path/')).toBe(
      'https://fan-guide.test/',
    );
    expect(
      buildEventJsonLd(concert, 'https://fan-guide.test/path/')[0]?.url,
    ).toBe('https://tickets.interpark.com/contents/notice/detail/14180');
    expect(() => buildEventJsonLd(concert, 'ftp://fan-guide.test')).toThrow(
      'siteUrl must be an absolute HTTP(S) URL',
    );
  });

  it('escapes HTML-significant characters before script injection', () => {
    expect(
      serializeJsonLd({ note: '</script><script>alert(1)</script>' }),
    ).toBe('{"note":"\\u003c/script>\\u003cscript>alert(1)\\u003c/script>"}');
  });
});
