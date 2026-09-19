import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { chromeText } from '../../components/chrome/navigation';
import {
  aliasFaceCss,
  charactersCoveredBy,
  facesCovering,
  formatUnicodeRange,
  parseFontFaces,
  type FontFace,
} from './headerFonts';

export const HEADER_BODY_FAMILY = 'Noto Sans KR Header';
export const HEADER_DISPLAY_FAMILY = 'Bebas Neue Header';

const require = createRequire(import.meta.url);

// Hashed asset URLs of the committed header subsets (npm run fonts:header).
// Each file keeps its fontsource basename so `face.file` still resolves.
const hashedUrls = import.meta.glob<string>(
  '/src/assets/fonts/header/*.woff2',
  { query: '?url&no-inline', import: 'default', eager: true },
);

function urlFor(face: FontFace): string {
  const entry = Object.entries(hashedUrls).find(([path]) =>
    path.endsWith(`/${face.file}`),
  );
  if (!entry)
    throw new Error(`Header font slice missing from build: ${face.file}`);
  return entry[1];
}

function readPackageCss(specifier: string): string {
  return readFileSync(require.resolve(specifier), 'utf8');
}

function aliasFor(family: string, specifier: string, text: string) {
  return facesCovering(parseFontFaces(readPackageCss(specifier)), text).map(
    (face) => ({
      family,
      weight: face.weight,
      url: urlFor(face),
      format: face.format,
      ranges: formatUnicodeRange(
        [...charactersCoveredBy(face, text)].map((char) => {
          const point = char.codePointAt(0) ?? 0;
          return [point, point] as [number, number];
        }),
      ),
    }),
  );
}

const faces = [
  ...aliasFor(
    HEADER_DISPLAY_FAMILY,
    '@fontsource/bebas-neue/index.css',
    chromeText.display,
  ),
  ...aliasFor(
    HEADER_BODY_FAMILY,
    '@fontsource-variable/noto-sans-kr/index.css',
    chromeText.body,
  ),
];

/** Preload hrefs and the alias @font-face rules for the site header. */
export const headerFontAssets = {
  preloads: [...new Set(faces.map((face) => face.url))],
  css: faces.map(aliasFaceCss).join(''),
};
