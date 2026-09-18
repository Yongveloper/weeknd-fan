import type { DrawCommand } from './cardDesign';

export type { DrawCommand } from './cardDesign';
export type TicketLayoutInput = {
  showDate: string;
  dDayLabel: string;
  songs: [string, string, string] | string[];
};
export const TICKET_WIDTH = 2070;
export const TICKET_HEIGHT = 990;
const artwork = '/visual/share/ticket-approved.webp';

// Only editable fields are covered with paper sampled from the supplied art.
// The eclipse, red lettering, panel proportions, labels and texture stay intact.
const paper = (
  x: number,
  y: number,
  width: number,
  height: number,
): DrawCommand => ({
  kind: 'image',
  src: artwork,
  x,
  y,
  width,
  height,
  opacity: 1,
  source: [0.665, 0.195, 0.29, 0.16],
});

export function buildTicketLayout(input: TicketLayoutInput): DrawCommand[] {
  return [
    { kind: 'surface', width: TICKET_WIDTH, height: TICKET_HEIGHT },
    { kind: 'fill', color: '#000' },
    {
      kind: 'image',
      src: artwork,
      x: 0,
      y: 0,
      width: TICKET_WIDTH,
      height: TICKET_HEIGHT,
      opacity: 1,
    },
    paper(710, 213, 670, 325),
    paper(1570, 404, 444, 123),
    {
      kind: 'text',
      value: input.dDayLabel,
      x: 722,
      y: 516,
      font: '400 320px "Anton", sans-serif',
      color: '#131713',
      maxWidth: 655,
    },
    {
      kind: 'text',
      value: input.showDate.replaceAll('-', '.'),
      x: 2004,
      y: 511,
      font: '400 106px "Anton", sans-serif',
      color: '#131713',
      align: 'right',
      maxWidth: 426,
    },
    ...Array.from({ length: 3 }, (_, i): DrawCommand[] => [
      paper([718, 1157, 1620][i]!, 689, [414, 446, 396][i]!, 93),
      {
        kind: 'text',
        value: input.songs[i] || '곡을 선택해 주세요',
        x: [722, 1162, 1626][i]!,
        y: 746,
        font: `700 ${input.songs[i] ? 50 : 32}px "Noto Sans KR Variable", sans-serif`,
        color: '#141915',
        maxWidth: [412, 444, 382][i]!,
      },
    ]).flat(),
  ];
}
