import { expect, test } from 'vitest';
import { buildTicketLayout } from '../../src/lib/share/buildTicketLayout';

test('includes the show date, three songs, and fan-made disclaimer', () => {
  const commands = buildTicketLayout({
    showDate: '2026-10-07',
    dDayLabel: 'D-39',
    songs: ['After Hours', 'Wake Me Up', 'Blinding Lights'],
  });
  const text = commands
    .filter((command) => command.kind === 'text')
    .map((command) => command.value);

  expect(text).toEqual(
    expect.arrayContaining([
      '2026.10.07',
      'D-39',
      'After Hours',
      'Wake Me Up',
      'Blinding Lights',
      'UNOFFICIAL FAN GUIDE',
    ]),
  );
});
