import { describe, expect, it } from 'vitest';
import { buildWebSiteJsonLd } from '../../src/lib/seo/websiteJsonLd';

describe('buildWebSiteJsonLd', () => {
  it('names the site for the home page of each locale', () => {
    expect(
      buildWebSiteJsonLd('INTO:DAWN', 'https://fan-guide.test/en/', 'en'),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'INTO:DAWN',
      url: 'https://fan-guide.test/en/',
      inLanguage: 'en',
    });
  });
});
