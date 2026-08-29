export type DrawCommand =
  | { kind: 'fill'; color: string }
  | {
      kind: 'line';
      from: [number, number];
      to: [number, number];
      color: string;
      width: number;
    }
  | {
      kind: 'text';
      value: string;
      x: number;
      y: number;
      font: string;
      color: string;
      align?: CanvasTextAlign;
    };

export type TicketLayoutInput = {
  showDate: string;
  dDayLabel: string;
  songs: [string, string, string] | string[];
};

const DISPLAY = '700 64px "Bebas Neue", Impact, sans-serif';
const BODY = '600 29px "Noto Sans KR Variable", system-ui, sans-serif';

export function buildTicketLayout(input: TicketLayoutInput): DrawCommand[] {
  const date = input.showDate.replaceAll('-', '.');
  const songs = input.songs.slice(0, 3);

  return [
    { kind: 'fill', color: '#050507' },
    {
      kind: 'line',
      from: [-120, 1300],
      to: [1200, 50],
      color: '#a61f27',
      width: 250,
    },
    {
      kind: 'line',
      from: [-120, 1370],
      to: [1200, 120],
      color: '#2f63d8',
      width: 64,
    },
    {
      kind: 'text',
      value: 'DAWNFOLD',
      x: 86,
      y: 120,
      font: DISPLAY,
      color: '#f0e8da',
    },
    {
      kind: 'text',
      value: 'GOYANG / 2026',
      x: 88,
      y: 165,
      font: BODY,
      color: '#d7d8dc',
    },
    {
      kind: 'text',
      value: date,
      x: 86,
      y: 352,
      font: '700 104px "Bebas Neue", Impact, sans-serif',
      color: '#e6a359',
    },
    {
      kind: 'text',
      value: input.dDayLabel,
      x: 994,
      y: 352,
      font: '700 82px "Bebas Neue", Impact, sans-serif',
      color: '#f0e8da',
      align: 'right',
    },
    {
      kind: 'line',
      from: [86, 412],
      to: [994, 412],
      color: '#f0e8da',
      width: 2,
    },
    {
      kind: 'text',
      value: 'MY THREE SONGS',
      x: 86,
      y: 510,
      font: BODY,
      color: '#e6a359',
    },
    ...songs.flatMap((song, index) => [
      {
        kind: 'text' as const,
        value: `0${index + 1}`,
        x: 90,
        y: 630 + index * 120,
        font: DISPLAY,
        color: '#e6a359',
      },
      {
        kind: 'text' as const,
        value: song,
        x: 210,
        y: 630 + index * 120,
        font: '700 50px "Bebas Neue", Impact, sans-serif',
        color: '#f0e8da',
      },
    ]),
    {
      kind: 'line',
      from: [86, 1060],
      to: [994, 1060],
      color: '#f0e8da',
      width: 2,
    },
    {
      kind: 'text',
      value: 'THE WEEKND: AFTER HOURS TIL DAWN',
      x: 86,
      y: 1145,
      font: BODY,
      color: '#d7d8dc',
    },
    {
      kind: 'text',
      value: 'UNOFFICIAL FAN GUIDE',
      x: 86,
      y: 1230,
      font: BODY,
      color: '#f0e8da',
    },
  ];
}
