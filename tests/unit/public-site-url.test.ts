import { describe, expect, it } from 'vitest';
import { resolvePublicSiteUrl } from '../../astro.config.mjs';

describe('PUBLIC_SITE_URL configuration', () => {
  it('keeps builds local-safe when the value is absent', () => {
    expect(resolvePublicSiteUrl(undefined)).toBeUndefined();
  });

  it('accepts a valid HTTP(S) origin', () => {
    expect(resolvePublicSiteUrl('https://fan-guide.test/path/')).toBe(
      'https://fan-guide.test/path/',
    );
  });

  it.each(['not-a-url', 'ftp://fan-guide.test'])(
    'rejects invalid value %s',
    (value) => {
      expect(() => resolvePublicSiteUrl(value)).toThrow(
        'PUBLIC_SITE_URL must be an absolute HTTP(S) URL',
      );
    },
  );
});
