import { describe, expect, it } from 'vitest';
import { LOCALES } from '../../src/lib/i18n/locales';
import {
  ARTIST,
  STATION_DAEHWA,
  TOUR,
  VENUE,
  bilingual,
} from '../../src/lib/i18n/proper-nouns';
import { ui } from '../../src/lib/i18n/ui';

function flatten(value: unknown, prefix = ''): Array<[string, string]> {
  if (typeof value === 'string') return [[prefix, value]];
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([key, child]) =>
      flatten(child, prefix ? `${prefix}.${key}` : key),
    );
  throw new Error(`Dictionary values must be strings: ${prefix}`);
}

describe('ui dictionaries', () => {
  it('exposes the same key set in every locale', () => {
    const [first, ...rest] = LOCALES.map((locale) =>
      flatten(ui(locale))
        .map(([key]) => key)
        .sort(),
    );
    for (const keys of rest) expect(keys).toEqual(first);
  });

  it('has no empty string anywhere', () => {
    for (const locale of LOCALES)
      for (const [key, value] of flatten(ui(locale)))
        expect(value.trim(), `${locale}.${key}`).not.toBe('');
  });

  it('never embeds the artist or tour name in a dictionary value', () => {
    for (const locale of LOCALES)
      for (const [key, value] of flatten(ui(locale))) {
        expect(value, `${locale}.${key}`).not.toContain(ARTIST);
        expect(value, `${locale}.${key}`).not.toContain(TOUR);
      }
  });
});

describe('proper nouns', () => {
  it('keeps the artist and tour in latin for both locales', () => {
    expect(ARTIST).toBe('The Weeknd');
    expect(TOUR).toBe('After Hours Til Dawn');
  });

  it('shows korean alone to korean readers', () => {
    expect(bilingual(VENUE, 'ko')).toBe('고양종합운동장');
    expect(bilingual(STATION_DAEHWA, 'ko')).toBe('대화역');
  });

  it('pairs the latin name with the korean original for english readers', () => {
    expect(bilingual(VENUE, 'en')).toBe('Goyang Stadium · 고양종합운동장');
    expect(bilingual(STATION_DAEHWA, 'en')).toBe('Daehwa Station · 대화역');
  });
});
