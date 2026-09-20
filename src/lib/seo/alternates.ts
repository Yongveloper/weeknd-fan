import { DEFAULT_LOCALE, LOCALES } from '../i18n/locales';
import { localeHref, pathWithoutLocale } from '../i18n/routes';

export type AlternateLink = { hreflang: string; href: string };

/**
 * Every locale of one page, plus x-default. The site never negotiates by
 * Accept-Language (it is static), so x-default points at Korean — the
 * source of record.
 */
export function alternateLinks(pathname: string, site: URL): AlternateLink[] {
  const bare = pathWithoutLocale(pathname);
  const links: AlternateLink[] = LOCALES.map((locale) => ({
    hreflang: locale,
    href: new URL(localeHref(locale, bare), site).toString(),
  }));
  links.push({
    hreflang: 'x-default',
    href: new URL(localeHref(DEFAULT_LOCALE, bare), site).toString(),
  });
  return links;
}
