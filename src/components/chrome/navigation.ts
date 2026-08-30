/** Header/footer chrome text. Kept in one place so the header font preload
 *  (src/lib/fonts) can compute exactly which font slices the chrome needs. */
export const wordmark = {
  name: 'DAWNFOLD',
  edition: 'THE WEEKND · GOYANG 26',
} as const;

export const navigation = [
  { href: '/', label: '홈' },
  { href: '/discover/', label: 'The Weeknd' },
  { href: '/setlist/', label: '예상 셋리스트' },
  { href: '/goyang/', label: '고양 가이드' },
  { href: '/sources/', label: '출처·업데이트' },
] as const;

export const chromeText = {
  display: wordmark.name,
  body: [wordmark.edition, ...navigation.map((item) => item.label)].join(''),
};
