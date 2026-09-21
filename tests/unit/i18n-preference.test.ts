import { describe, expect, it } from 'vitest';
import {
  LOCALE_PREFERENCE_KEY,
  localePreferenceScript,
} from '../../src/lib/i18n/preference';

/**
 * The snippet ships as a string, so the string is what these tests run. A test
 * against a reimplementation of the same logic would pass while the inlined
 * copy was broken.
 */
type Run = {
  replaced: string | null;
  stored: Record<string, string>;
  click: (attributes: Record<string, string> | null) => void;
};

function run({
  pathname = '/',
  search = '',
  hash = '',
  stored = {},
  storageThrows = false,
}: {
  pathname?: string;
  search?: string;
  hash?: string;
  stored?: Record<string, string>;
  storageThrows?: boolean;
} = {}): Run {
  const store = { ...stored };
  const result: Run = {
    replaced: null,
    stored: store,
    click: () => {
      throw new Error('no click listener was registered');
    },
  };

  const localStorage = {
    getItem(key: string) {
      if (storageThrows) throw new Error('storage is blocked');
      return key in store ? store[key] : null;
    },
    setItem(key: string, value: string) {
      if (storageThrows) throw new Error('storage is blocked');
      store[key] = value;
    },
  };

  const location = {
    pathname,
    search,
    hash,
    replace(target: string) {
      result.replaced = target;
    },
  };

  const document = {
    addEventListener(type: string, listener: (event: unknown) => void) {
      if (type !== 'click') return;
      result.click = (attributes) => {
        const link =
          attributes === null
            ? null
            : { getAttribute: (name: string) => attributes[name] ?? null };
        listener({ target: { closest: () => link } });
      };
    },
  };

  new Function('localStorage', 'location', 'document', localePreferenceScript)(
    localStorage,
    location,
    document,
  );

  return result;
}

describe('locale preference script', () => {
  it('does nothing for a reader who has never chosen', () => {
    expect(run({ pathname: '/goyang/' }).replaced).toBeNull();
  });

  it('sends a stored english reader to the english copy of the same page', () => {
    const { replaced } = run({
      pathname: '/goyang/',
      stored: { [LOCALE_PREFERENCE_KEY]: 'en' },
    });
    expect(replaced).toBe('/en/goyang/');
  });

  it('carries the query and hash across the redirect', () => {
    const { replaced } = run({
      pathname: '/goyang/',
      search: '?day=2',
      hash: '#seating',
      stored: { [LOCALE_PREFERENCE_KEY]: 'en' },
    });
    expect(replaced).toBe('/en/goyang/?day=2#seating');
  });

  it('sends a stored korean reader back out of /en/', () => {
    expect(
      run({
        pathname: '/en/setlist/',
        stored: { [LOCALE_PREFERENCE_KEY]: 'ko' },
      }).replaced,
    ).toBe('/setlist/');
  });

  it('maps the bare /en root back to /', () => {
    expect(
      run({ pathname: '/en', stored: { [LOCALE_PREFERENCE_KEY]: 'ko' } })
        .replaced,
    ).toBe('/');
  });

  it('leaves a reader who is already in the right edition alone', () => {
    // Redirecting here would reload the same page forever.
    expect(
      run({
        pathname: '/en/goyang/',
        stored: { [LOCALE_PREFERENCE_KEY]: 'en' },
      }).replaced,
    ).toBeNull();
    expect(
      run({ pathname: '/goyang/', stored: { [LOCALE_PREFERENCE_KEY]: 'ko' } })
        .replaced,
    ).toBeNull();
  });

  it('does not treat /english/ as the english edition', () => {
    expect(
      run({ pathname: '/english/', stored: { [LOCALE_PREFERENCE_KEY]: 'ko' } })
        .replaced,
    ).toBeNull();
  });

  it('ignores a stored value that is not a locale', () => {
    expect(
      run({ pathname: '/', stored: { [LOCALE_PREFERENCE_KEY]: 'jp' } })
        .replaced,
    ).toBeNull();
  });

  it('stores the locale the reader picks in the switcher', () => {
    const session = run({ pathname: '/' });
    session.click({ hreflang: 'en' });
    expect(session.stored[LOCALE_PREFERENCE_KEY]).toBe('en');
    session.click({ hreflang: 'ko' });
    expect(session.stored[LOCALE_PREFERENCE_KEY]).toBe('ko');
  });

  it('ignores clicks that are not on a locale link', () => {
    const session = run({ pathname: '/' });
    session.click(null);
    session.click({ hreflang: 'x-default' });
    expect(session.stored[LOCALE_PREFERENCE_KEY]).toBeUndefined();
  });

  it('survives a browser where localStorage throws', () => {
    const attempt = () => {
      const session = run({ pathname: '/', storageThrows: true });
      session.click({ hreflang: 'en' });
    };
    expect(attempt).not.toThrow();
  });

  it('does not register the click listener after it redirects away', () => {
    // The document is about to be replaced; binding to it is wasted work.
    const session = run({
      pathname: '/',
      stored: { [LOCALE_PREFERENCE_KEY]: 'en' },
    });
    expect(session.replaced).toBe('/en/');
    expect(() => session.click({ hreflang: 'ko' })).toThrow(
      'no click listener was registered',
    );
  });
});
