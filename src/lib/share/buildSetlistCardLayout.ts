import type { DrawCommand } from './buildTicketLayout';

export type SetlistCardLayoutInput = { version: string; songs: string[] };

const DISPLAY = '700 56px "Bebas Neue", Impact, sans-serif';
const BODY = '600 24px "Noto Sans KR Variable", system-ui, sans-serif';

export function buildSetlistCardLayout(
  input: SetlistCardLayoutInput,
): DrawCommand[] {
  const version = input.version.replaceAll('-', '.');
  const splitAt = Math.ceil(input.songs.length / 2);

  return [
    { kind: 'fill', color: '#050507' },
    {
      kind: 'line',
      from: [-130, 1320],
      to: [1210, 30],
      color: '#a61f27',
      width: 210,
    },
    {
      kind: 'line',
      from: [-130, 1375],
      to: [1210, 85],
      color: '#2f63d8',
      width: 52,
    },
    {
      kind: 'text',
      value: 'EXPECTED',
      x: 76,
      y: 128,
      font: '700 124px "Bebas Neue", Impact, sans-serif',
      color: '#f0e8da',
    },
    {
      kind: 'text',
      value: 'SETLIST / GOYANG',
      x: 80,
      y: 190,
      font: DISPLAY,
      color: '#e6a359',
    },
    {
      kind: 'text',
      value: `UPDATED ${version}`,
      x: 80,
      y: 247,
      font: BODY,
      color: '#d7d8dc',
    },
    {
      kind: 'line',
      from: [78, 285],
      to: [1002, 285],
      color: '#f0e8da',
      width: 2,
    },
    ...input.songs.map((song, index) => {
      const column = index < splitAt ? 0 : 1;
      const row = column === 0 ? index : index - splitAt;
      const x = column === 0 ? 80 : 568;
      const y = 355 + row * 43;
      return {
        kind: 'text' as const,
        value: `${String(index + 1).padStart(2, '0')}  ${song}`,
        x,
        y,
        font: '600 22px "Noto Sans KR Variable", system-ui, sans-serif',
        color: '#f0e8da',
      };
    }),
    {
      kind: 'line',
      from: [78, 1195],
      to: [1002, 1195],
      color: '#f0e8da',
      width: 2,
    },
    {
      kind: 'text',
      value: '예상 · 보장 아님',
      x: 80,
      y: 1260,
      font: '700 34px "Noto Sans KR Variable", system-ui, sans-serif',
      color: '#e6a359',
    },
    {
      kind: 'text',
      value: 'UNOFFICIAL FAN GUIDE',
      x: 1000,
      y: 1260,
      font: BODY,
      color: '#f0e8da',
      align: 'right',
    },
  ];
}
