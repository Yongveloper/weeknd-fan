import {
  bodyFont,
  cardCover,
  cardFooter,
  cardInk,
  cardRule,
  displayFont,
  type DrawCommand,
} from './cardDesign';

export type { DrawCommand } from './cardDesign';
export type TicketLayoutInput = {
  showDate: string;
  dDayLabel: string;
  songs: [string, string, string] | string[];
};

export function buildTicketLayout(input: TicketLayoutInput): DrawCommand[] {
  return [
    ...cardCover(),
    {
      kind: 'text',
      value: 'D-DAY TICKET',
      x: 74,
      y: 520,
      font: displayFont(48),
      color: cardInk.ivory,
    },
    {
      kind: 'text',
      value: input.dDayLabel,
      x: 72,
      y: 686,
      font: displayFont(156),
      color: cardInk.light,
      maxWidth: 448,
    },
    {
      kind: 'text',
      value: input.showDate.replaceAll('-', '.'),
      x: 1006,
      y: 661,
      font: displayFont(78),
      color: cardInk.gold,
      align: 'right',
      maxWidth: 420,
    },
    cardRule(732),
    {
      kind: 'text',
      value: 'MY THREE SONGS',
      x: 74,
      y: 795,
      font: displayFont(32),
      color: cardInk.gold,
    },
    ...Array.from({ length: 3 }, (_, index): DrawCommand[] => {
      const song = input.songs[index];
      return [
        {
          kind: 'text',
          value: String(index + 1).padStart(2, '0'),
          x: 76,
          y: 884 + index * 112,
          font: displayFont(35),
          color: cardInk.gold,
        },
        {
          kind: 'text',
          value: song || '곡을 선택해 주세요',
          x: 150,
          y: 884 + index * 112,
          font: song ? displayFont(52) : bodyFont(26),
          color: song ? cardInk.ivory : cardInk.muted,
          maxWidth: 856,
        },
        {
          kind: 'line',
          from: [150, 911 + index * 112],
          to: [1006, 911 + index * 112],
          width: 1,
          color: cardInk.rule,
        },
      ];
    }).flat(),
    cardRule(1202, true),
    ...cardFooter(),
  ];
}
