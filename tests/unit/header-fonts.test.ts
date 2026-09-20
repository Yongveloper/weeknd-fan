import { existsSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { expect, test } from 'vitest';
import manifest from '../../src/assets/fonts/header/manifest.json';
import { chromeText } from '../../src/components/chrome/navigation';
import {
  aliasFaceCss,
  charactersCoveredBy,
  facesCovering,
  formatUnicodeRange,
  parseFontFaces,
  parseUnicodeRange,
} from '../../src/lib/fonts/headerFonts';

const require = createRequire(import.meta.url);
const HEADER_FONT_DIR = path.resolve('src/assets/fonts/header');
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

test('charactersCoveredBy returns the distinct characters a face can render', () => {
  const face = {
    file: 'slice.woff2',
    format: 'woff2-variations',
    weight: '100 900',
    ranges: [
      [0x41, 0x5a] as [number, number],
      [0xac00, 0xd7a3] as [number, number],
    ],
  };
  expect(charactersCoveredBy(face, 'THE WEEKND 홈 the')).toBe('THEWKND홈');
  expect(charactersCoveredBy(face, '· 26')).toBe('');
});

test('charactersCoveredBy keeps one space for a face that declares U+0020', () => {
  const faceWithSpace = {
    file: 'slice.woff2',
    format: 'woff2-variations',
    weight: '100 900',
    ranges: [
      [0x20, 0x20] as [number, number],
      [0x41, 0x5a] as [number, number],
    ],
  };
  // The header renders spaces, so a face declaring U+0020 has to subset and
  // range it; runs of whitespace collapse to the single space glyph.
  expect(charactersCoveredBy(faceWithSpace, 'THE  WEEKND')).toBe('THE WKND');
});

test('the committed header subsets were built from the current chrome text', () => {
  expect(manifest.text).toEqual(chromeText);
});

test('every header subset exists and is a fraction of its fontsource slice', () => {
  expect(manifest.files.length).toBeGreaterThan(0);
  for (const entry of manifest.files) {
    const file = path.join(HEADER_FONT_DIR, entry.file);
    expect(existsSync(file), `${entry.file} missing`).toBe(true);
    expect(statSync(file).size).toBe(entry.bytes);
    // The union slice (both locales' nav labels) needs more room than a
    // single-locale one; 8KiB still keeps each subset a sliver of the
    // ~15KiB fontsource source slice it's cut from.
    expect(entry.bytes).toBeLessThan(8 * 1024);
    expect(entry.characters.length).toBeGreaterThan(0);
  }
});

test('each subset holds exactly the glyphs its alias face will range', () => {
  const specifiers = {
    display: '@fontsource/bebas-neue/index.css',
    body: '@fontsource-variable/noto-sans-kr/index.css',
  } as const;

  for (const entry of manifest.files) {
    const family = entry.family as keyof typeof specifiers;
    const text = chromeText[family];
    const face = parseFontFaces(read(specifiers[family])).find(
      (candidate) => candidate.file === entry.file,
    );
    expect(
      face,
      `${entry.file} is not a ${family} fontsource slice`,
    ).toBeDefined();
    // headerFontAssets.ts derives unicode-range from the same call, so a drift
    // here means the preloaded file and its declared range disagree.
    expect(entry.characters).toBe(charactersCoveredBy(face!, text));
  }
});
