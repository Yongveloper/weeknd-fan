import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, test } from 'vitest';
import { chromeText } from '../../src/components/chrome/navigation';
import {
  aliasFaceCss,
  facesCovering,
  formatUnicodeRange,
  parseFontFaces,
  parseUnicodeRange,
} from '../../src/lib/fonts/headerFonts';

const require = createRequire(import.meta.url);
const read = (specifier: string) =>
  readFileSync(require.resolve(specifier), 'utf8');

test('parses fontsource unicode-range tokens including wildcards', () => {
  expect(parseUnicodeRange('U+0000-00FF,U+0131,U+02??')).toEqual([
    [0, 0xff],
    [0x131, 0x131],
    [0x200, 0x2ff],
  ]);
  expect(
    formatUnicodeRange([
      [0, 0xff],
      [0x131, 0x131],
    ]),
  ).toBe('U+0-FF,U+131');
});

test('the header text is covered by a small set of Noto Sans KR slices', () => {
  const faces = parseFontFaces(
    read('@fontsource-variable/noto-sans-kr/index.css'),
  );
  expect(faces.length).toBeGreaterThan(100);

  const needed = facesCovering(faces, chromeText.body);
  expect(needed.length).toBeGreaterThan(0);
  expect(needed.length).toBeLessThanOrEqual(8);

  for (const char of chromeText.body.replace(/\s+/g, '')) {
    const point = char.codePointAt(0) ?? 0;
    expect(
      needed.some((face) =>
        face.ranges.some(([from, to]) => from <= point && point <= to),
      ),
      `no header slice covers ${JSON.stringify(char)}`,
    ).toBe(true);
  }
});

test('the wordmark needs exactly the Bebas Neue latin slice', () => {
  const faces = parseFontFaces(read('@fontsource/bebas-neue/index.css'));
  const needed = facesCovering(faces, chromeText.display);
  expect(needed.map((face) => face.file)).toEqual([
    'bebas-neue-latin-400-normal.woff2',
  ]);
});

test('alias faces block instead of falling back', () => {
  const css = aliasFaceCss({
    family: 'Noto Sans KR Header',
    weight: '100 900',
    url: '/_astro/slice.woff2',
    format: 'woff2-variations',
    ranges: 'U+AC00-D7A3',
  });
  expect(css).toContain("font-family:'Noto Sans KR Header'");
  expect(css).toContain('font-display:block');
  expect(css).toContain('src:url(/_astro/slice.woff2)');
  expect(css).toContain('unicode-range:U+AC00-D7A3');
});
