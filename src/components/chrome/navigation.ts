import {
  DEFAULT_LOCALE,
  LOCALES,
  type Locale,
} from '../../lib/i18n/locales.ts';
import { localeHref } from '../../lib/i18n/routes.ts';

/** Header/footer chrome text. Kept in one place so the header font preload
 *  (src/lib/fonts) can compute exactly which font slices the chrome needs. */
export const wordmark = {
  name: 'INTO:DAWN',
  edition: 'THE WEEKND · GOYANG 26',
} as const;

type NavItem = { path: string; label: Record<Locale, string> };

const NAV: readonly NavItem[] = [
  { path: '/', label: { ko: '홈', en: 'Home' } },
  { path: '/discover/', label: { ko: 'The Weeknd', en: 'The Weeknd' } },
  { path: '/setlist/', label: { ko: '예상 셋리스트', en: 'Expected setlist' } },
  { path: '/goyang/', label: { ko: '콘서트 가이드', en: 'Concert guide' } },
] as const;

const FOOTER_ONLY: readonly NavItem[] = [
  {
    path: '/sources/',
    label: { ko: '출처·업데이트', en: 'Sources & updates' },
  },
] as const;

function resolve(items: readonly NavItem[], locale: Locale) {
  return items.map(({ path, label }) => ({
    href: localeHref(locale, path),
    label: label[locale],
  }));
}

export function navigationFor(locale: Locale) {
  return resolve(NAV, locale);
}

export function footerNavigationFor(locale: Locale) {
  return resolve([...NAV, ...FOOTER_ONLY], locale);
}

/** Every character the chrome can render, across all locales, so one
 *  committed subset serves both. */
export const chromeText = {
  display: wordmark.name,
  body: [
    wordmark.edition,
    ...LOCALES.flatMap((locale) =>
      [...NAV, ...FOOTER_ONLY].map(({ label }) => label[locale]),
    ),
  ].join(''),
};

export const navigation = navigationFor(DEFAULT_LOCALE);
