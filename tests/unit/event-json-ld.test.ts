import { describe, expect, it } from 'vitest';
import {
  buildEventJsonLd,
  normalizeSiteUrl,
  serializeJsonLd,
} from '../../src/lib/seo/eventJsonLd';
import concert from '../../src/data/concert/goyang-2026.json';
import { VENUE_FULL } from '../../src/lib/i18n/proper-nouns';

const input = {
  venue: '고양종합운동장 주경기장',
  shows: [
    { startsAt: '2026-10-07T19:45:00+09:00' },
    { startsAt: '2026-10-08T19:45:00+09:00' },
  ],
};

describe('buildEventJsonLd', () => {
  it('emits one conservative MusicEvent per Goyang date', () => {
    const events = buildEventJsonLd(input, 'https://fan-guide.test', 'ko');

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
        inLanguage: 'ko',
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
        inLanguage: 'ko',
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
      buildEventJsonLd(concert, 'https://fan-guide.test/path/', 'ko')[0]?.url,
    ).toBe('https://tickets.interpark.com/contents/notice/detail/14180');
    expect(() =>
      buildEventJsonLd(concert, 'ftp://fan-guide.test', 'ko'),
    ).toThrow('siteUrl must be an absolute HTTP(S) URL');
  });

  it('declares the rendered language', () => {
    expect(
      buildEventJsonLd(input, 'https://fan-guide.test', 'ko')[0]?.inLanguage,
    ).toBe('ko');
    expect(
      buildEventJsonLd(input, 'https://fan-guide.test', 'en')[0]?.inLanguage,
    ).toBe('en');
  });

  it('pairs the venue name with its korean original in english', () => {
    expect(
      buildEventJsonLd(input, 'https://fan-guide.test', 'en')[0]?.location.name,
    ).toBe('Goyang Sports Complex Main Stadium · 고양종합운동장 주경기장');
  });

  it('emits a single-form organizer name per locale, not a bilingual pair', () => {
    expect(
      buildEventJsonLd(input, 'https://fan-guide.test', 'ko')[0]?.organizer
        .name,
    ).toBe('현대카드');
    expect(
      buildEventJsonLd(input, 'https://fan-guide.test', 'en')[0]?.organizer
        .name,
    ).toBe('Hyundai Card');
  });

  it('escapes HTML-significant characters before script injection', () => {
    expect(
      serializeJsonLd({ note: '</script><script>alert(1)</script>' }),
    ).toBe('{"note":"\\u003c/script>\\u003cscript>alert(1)\\u003c/script>"}');
  });

  it('keeps the structured-data venue name equal to the audited content record', () => {
    expect(VENUE_FULL.ko).toBe(concert.venue);
  });
});
