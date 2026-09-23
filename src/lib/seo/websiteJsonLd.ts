import type { Locale } from '../i18n/locales';

export interface WebSiteJsonLd {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  inLanguage: Locale;
}

/**
 * Google reads the site name it shows above search results from this block
 * on the home page; without it, it guesses from the title and domain.
 */
export function buildWebSiteJsonLd(
  name: string,
  homeUrl: string,
  locale: Locale,
): WebSiteJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url: homeUrl,
    inLanguage: locale,
  };
}
