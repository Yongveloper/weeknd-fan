import type { DrawCommand } from './cardDesign';

export const POSTER_WIDTH = 1080;
export const POSTER_HEIGHT = 1638;

/** The approved poster is artwork, so its lettering is never re-typeset. */
export function buildSetlistCardLayout(): DrawCommand[] {
  return [
    { kind: 'surface', width: POSTER_WIDTH, height: POSTER_HEIGHT },
    { kind: 'fill', color: '#000' },
    {
      kind: 'image',
      src: '/visual/share/poster-approved.webp',
      x: 0,
      y: 0,
      width: POSTER_WIDTH,
      height: POSTER_HEIGHT,
      opacity: 1,
    },
  ];
}
