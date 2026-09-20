import { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from './locales';

/** Korean keeps the bare root, so only the others carry a path prefix. */
const PREFIXED = LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);

export type LocaleParam = string | undefined;

/** `getStaticPaths` input for every `[...locale]` route. */
export function localePaths(): Array<{ params: { locale: LocaleParam } }> {
  return [undefined, ...PREFIXED].map((locale) => ({ params: { locale } }));
}

export function localeFromParam(param: LocaleParam): Locale {
  if (param === undefined) return DEFAULT_LOCALE;
  if (!isLocale(param) || param === DEFAULT_LOCALE)
    throw new Error(`Unknown locale segment: ${param}`);
  return param;
}

export function localeHref(locale: Locale, path: string): string {
  return locale === DEFAULT_LOCALE ? path : `/${locale}${path}`;
}

export function pathWithoutLocale(pathname: string): string {
  for (const locale of PREFIXED) {
    if (pathname === `/${locale}` || pathname === `/${locale}/`) return '/';
    if (pathname.startsWith(`/${locale}/`))
      return pathname.slice(locale.length + 1);
  }
  return pathname;
}
