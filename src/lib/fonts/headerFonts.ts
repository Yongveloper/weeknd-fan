/**
 * Header type must not shift between pages. Body text uses
 * `font-display: optional` (see astro.config.mjs): when a slice misses the
 * ~100ms window the page keeps the system font for its whole life, so two
 * consecutive pages can render the same header in two different fonts.
 *
 * The fix is to give the header its own alias families whose faces point at
 * the *same* slice files but use `font-display: block`, and to preload those
 * slices. Only the handful of slices the chrome text actually needs are
 * involved (~7 files), so nothing else changes.
 */

export interface FontFace {
  file: string;
  format: string;
  weight: string;
  ranges: Array<[number, number]>;
}

export interface AliasFace {
  family: string;
  weight: string;
  url: string;
  format: string;
  ranges: string;
}

const RANGE_PATTERN = /^u\+([0-9a-f?]+)(?:-([0-9a-f]+))?$/i;

export function parseUnicodeRange(value: string): Array<[number, number]> {
  return value.split(',').flatMap((token) => {
    const match = RANGE_PATTERN.exec(token.trim());
    if (!match?.[1]) return [];
    const [, start, end] = match;
    if (start.includes('?')) {
      return [
        [
          Number.parseInt(start.replaceAll('?', '0'), 16),
          Number.parseInt(start.replaceAll('?', 'f'), 16),
        ],
      ];
    }
    const from = Number.parseInt(start, 16);
    return [[from, end ? Number.parseInt(end, 16) : from]];
  });
}

/** Parses a fontsource index.css into its faces (file basename + ranges). */
export function parseFontFaces(css: string): FontFace[] {
  return [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].flatMap(([, body]) => {
    if (!body) return [];
    const src = /url\(([^)]+\.woff2)\)\s*format\(['"]([^'"]+)['"]\)/.exec(body);
    const ranges = /unicode-range:\s*([^;]+);/.exec(body);
    const weight = /font-weight:\s*([^;]+);/.exec(body);
    if (!src?.[1] || !src[2]) return [];
    return [
      {
        file: src[1].split('/').pop() ?? src[1],
        format: src[2],
        weight: weight?.[1]?.trim() ?? '400',
        ranges: ranges?.[1] ? parseUnicodeRange(ranges[1]) : [[0, 0x10ffff]],
      },
    ];
  });
}

/** Faces (in stylesheet order) that cover every non-space code point of `text`. */
export function facesCovering(faces: FontFace[], text: string): FontFace[] {
  const needed = new Set<FontFace>();
  for (const char of new Set(text.replace(/\s+/g, ''))) {
    const point = char.codePointAt(0) ?? 0;
    const face = faces.find(({ ranges }) =>
      ranges.some(([from, to]) => from <= point && point <= to),
    );
    if (face) needed.add(face);
  }
  return faces.filter((face) => needed.has(face));
}

/** Distinct non-space characters of `text` that `face` declares in its ranges. */
export function charactersCoveredBy(face: FontFace, text: string): string {
  const covered: string[] = [];
  for (const char of new Set(text.replace(/\s+/g, ''))) {
    const point = char.codePointAt(0) ?? 0;
    if (face.ranges.some(([from, to]) => from <= point && point <= to))
      covered.push(char);
  }
  return covered.join('');
}

export function formatUnicodeRange(ranges: Array<[number, number]>): string {
  const hex = (value: number) => value.toString(16).toUpperCase();
  return ranges
    .map(([from, to]) =>
      from === to ? `U+${hex(from)}` : `U+${hex(from)}-${hex(to)}`,
    )
    .join(',');
}

export function aliasFaceCss({
  family,
  weight,
  url,
  format,
  ranges,
}: AliasFace) {
  return (
    `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};` +
    `font-display:block;src:url(${url}) format('${format}');unicode-range:${ranges}}`
  );
}
