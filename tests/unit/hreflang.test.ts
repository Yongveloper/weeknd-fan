import { describe, expect, it } from 'vitest';
import { alternateLinks } from '../../src/lib/seo/alternates';

const site = new URL('https://fan-guide.test');

describe('alternateLinks', () => {
  it('lists every locale plus x-default for a korean path', () => {
    expect(alternateLinks('/goyang/', site)).toEqual([
      { hreflang: 'ko', href: 'https://fan-guide.test/goyang/' },
      { hreflang: 'en', href: 'https://fan-guide.test/en/goyang/' },
      { hreflang: 'x-default', href: 'https://fan-guide.test/goyang/' },
    ]);
  });

  it('produces the identical set from the english path', () => {
    expect(alternateLinks('/en/goyang/', site)).toEqual(
      alternateLinks('/goyang/', site),
    );
  });

  it('handles the site root', () => {
    expect(alternateLinks('/en/', site)).toEqual([
      { hreflang: 'ko', href: 'https://fan-guide.test/' },
      { hreflang: 'en', href: 'https://fan-guide.test/en/' },
      { hreflang: 'x-default', href: 'https://fan-guide.test/' },
    ]);
  });
});
