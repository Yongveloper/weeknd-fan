import {
  bodyFont,
  cardCover,
  cardFooter,
  cardInk,
  cardRule,
  displayFont,
  type DrawCommand,
} from './cardDesign';

export type SetlistCardLayoutInput = { version: string; songs: string[] };

export function buildSetlistCardLayout(
  input: SetlistCardLayoutInput,
): DrawCommand[] {
  const splitAt = Math.ceil(input.songs.length / 2);
  const rowHeight = Math.min(32, 608 / Math.max(1, splitAt));
  return [
    ...cardCover(),
    {
      kind: 'text',
      value: 'EXPECTED SETLIST',
      x: 74,
      y: 520,
      font: displayFont(48),
      color: cardInk.ivory,
    },
    {
      kind: 'text',
      value: `${input.songs.length} TRACKS`,
      x: 1006,
      y: 515,
      font: bodyFont(21),
      color: cardInk.gold,
      align: 'right',
    },
    ...input.songs.flatMap((song, index): DrawCommand[] => {
      const column = index < splitAt ? 0 : 1;
      const row = column === 0 ? index : index - splitAt;
      const x = column === 0 ? 74 : 568;
      const y = 584 + row * rowHeight;
      return [
        {
          kind: 'text',
          value: String(index + 1).padStart(2, '0'),
          x,
          y,
          font: bodyFont(19),
          color: cardInk.gold,
        },
        {
          kind: 'text',
          value: song,
          x: x + 42,
          y,
          font: bodyFont(Math.min(25, rowHeight * 0.78)),
          color: cardInk.ivory,
          maxWidth: 396,
        },
      ];
    }),
    cardRule(1196),
    {
      kind: 'text',
      value: `UPDATED ${input.version.replaceAll('-', '.')}`,
      x: 74,
      y: 1232,
      font: bodyFont(20),
      color: cardInk.muted,
    },
    ...cardFooter(),
  ];
}
