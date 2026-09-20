/**
 * Korean is the type source for every dictionary: a key missing from
 * `en.ts` fails `astro check` rather than rendering blank.
 *
 * Rules
 * - Whole sentences only. Never assemble a sentence from fragments.
 * - Interpolate data slots (numbers, dates) only; the words around the slot
 *   belong to the locale.
 * - English plurals get explicit `one` / `other` variants.
 * - Proper nouns come from `../proper-nouns`, never from here.
 */
export const ko = {
  chrome: {
    skipToContent: '본문으로 건너뛰기',
    primaryMenu: '주요 메뉴',
    menu: '메뉴',
    localeSwitcher: '언어',
    homeSuffix: '고양 팬 가이드 홈',
    disclaimer: '비공식·비영리 팬 가이드',
    verifiedPrefix: '공식 정보 마지막 확인',
    siteMap: '사이트 지도',
    officialTicketNotice: '공식 티켓 공지 보기',
  },
} as const;
