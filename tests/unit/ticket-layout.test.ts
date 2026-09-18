import { expect, test } from 'vitest';
import { buildTicketLayout } from '../../src/lib/share/buildTicketLayout';

test('keeps editable dates and songs on the approved wide artwork', () => {
  const commands = buildTicketLayout({
    showDate: '2026-10-07',
    dDayLabel: 'D-39',
    songs: ['After Hours', 'Wake Me Up', 'Blinding Lights'],
  });
  const text = commands
    .filter((command) => command.kind === 'text')
    .map((command) => command.value);

  expect(commands).toContainEqual({
    kind: 'surface',
    width: 2070,
    height: 990,
  });
  expect(
    commands.some(
      (command) =>
        command.kind === 'image' &&
        command.src === '/visual/share/ticket-approved.webp',
    ),
  ).toBe(true);
  expect(text).toEqual(
    expect.arrayContaining([
      '2026.10.07',
      'D-39',
      'After Hours',
      'Wake Me Up',
      'Blinding Lights',
    ]),
  );
});
