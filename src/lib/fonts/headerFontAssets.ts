import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { chromeText } from '../../components/chrome/navigation';
import {
  aliasFaceCss,
  facesCovering,
  formatUnicodeRange,
  parseFontFaces,
  type FontFace,
} from './headerFonts';

export const HEADER_BODY_FAMILY = 'Noto Sans KR Header';
export const HEADER_DISPLAY_FAMILY = 'Bebas Neue Header';

const require = createRequire(import.meta.url);

// Hashed asset URLs. The CSS from the fontsource packages already emits these
// files, and Vite dedupes identical assets, so nothing extra ships.
const hashedUrls = {
  ...import.meta.glob<string>(
    '/node_modules/@fontsource-variable/noto-sans-kr/files/*.woff2',
    { query: '?url', import: 'default', eager: true },
  ),
  ...import.meta.glob<string>(
    '/node_modules/@fontsource/bebas-neue/files/*.woff2',
    { query: '?url', import: 'default', eager: true },
  ),
};

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
      ranges: formatUnicodeRange(face.ranges),
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
