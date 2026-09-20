import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, LOCALES, isLocale } from '../../src/lib/i18n/locales';
import {
  localeFromParam,
  localeHref,
  localePaths,
  pathWithoutLocale,
} from '../../src/lib/i18n/routes';

describe('locales', () => {
  it('lists korean first and defaults to it', () => {
    expect(LOCALES).toEqual(['ko', 'en']);
    expect(DEFAULT_LOCALE).toBe('ko');
  });

  it('recognises only the locales the site ships', () => {
    expect(isLocale('ko')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('ja')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe('localePaths', () => {
  it('emits an undefined param for korean so it keeps the bare root', () => {
    expect(localePaths()).toEqual([
      { params: { locale: undefined } },
      { params: { locale: 'en' } },
    ]);
  });
});

describe('localeFromParam', () => {
  it('maps a missing segment to korean', () => {
    expect(localeFromParam(undefined)).toBe('ko');
  });

  it('maps a prefixed segment to its locale', () => {
    expect(localeFromParam('en')).toBe('en');
  });

  it('rejects a segment that is not a prefixed locale', () => {
    expect(() => localeFromParam('ja')).toThrow('Unknown locale segment: ja');
    expect(() => localeFromParam('ko')).toThrow('Unknown locale segment: ko');
  });
});

describe('localeHref', () => {
  it('leaves korean paths unprefixed', () => {
    expect(localeHref('ko', '/')).toBe('/');
    expect(localeHref('ko', '/goyang/')).toBe('/goyang/');
    expect(localeHref('ko', '/share/ticket/')).toBe('/share/ticket/');
  });

  it('prefixes english paths', () => {
    expect(localeHref('en', '/')).toBe('/en/');
    expect(localeHref('en', '/goyang/')).toBe('/en/goyang/');
    expect(localeHref('en', '/share/ticket/')).toBe('/en/share/ticket/');
  });
});

describe('pathWithoutLocale', () => {
  it('strips the english prefix', () => {
    expect(pathWithoutLocale('/en/')).toBe('/');
    expect(pathWithoutLocale('/en')).toBe('/');
    expect(pathWithoutLocale('/en/goyang/')).toBe('/goyang/');
  });

  it('leaves korean paths alone', () => {
    expect(pathWithoutLocale('/')).toBe('/');
    expect(pathWithoutLocale('/goyang/')).toBe('/goyang/');
  });

  it('does not strip a path that merely starts with the prefix letters', () => {
    expect(pathWithoutLocale('/entry/')).toBe('/entry/');
  });
});
