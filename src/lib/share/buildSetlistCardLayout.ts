import type { DrawCommand } from './cardDesign';

export const POSTER_WIDTH = 1080;
export const POSTER_HEIGHT = 1638;
export const POSTER_DATE_FONT_FAMILY = 'Poster Date';

const POSTER_SRC = '/visual/share/poster-approved.webp';

/**
 * The approved poster is artwork, so its song list is never re-typeset. Only
 * its baked-in "UPDATED" date is replaced: blank paper from the same row is
 * copied over it, then the setlist version is lettered in the poster's own
 * face (Noto Sans KR Latin), size and ink, measured against the original.
 */
export function buildSetlistCardLayout(updated: string): DrawCommand[] {
  return [
    { kind: 'surface', width: POSTER_WIDTH, height: POSTER_HEIGHT },
    { kind: 'fill', color: '#000' },
    {
      kind: 'image',
      src: POSTER_SRC,
      x: 0,
      y: 0,
      width: POSTER_WIDTH,
      height: POSTER_HEIGHT,
      opacity: 1,
    },
    {
      kind: 'image',
      src: POSTER_SRC,
      x: 470,
      y: 1545,
      width: 200,
      height: 32,
      opacity: 1,
      source: [
        760 / POSTER_WIDTH,
        1545 / POSTER_HEIGHT,
        200 / POSTER_WIDTH,
        32 / POSTER_HEIGHT,
      ],
    },
    {
      kind: 'text',
      value: `UPDATED ${updated}`,
      x: 478.5,
      y: 1567.5,
      font: `500 17.6px "${POSTER_DATE_FONT_FAMILY}", sans-serif`,
      color: '#68655b',
    },
  ];
}
