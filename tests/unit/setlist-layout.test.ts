import { expect, test } from 'vitest';
import { buildSetlistCardLayout } from '../../src/lib/share/buildSetlistCardLayout';

test('preserves version and songs without the removed poster disclaimer', () => {
  const commands = buildSetlistCardLayout({
    version: '2026-08-29',
    songs: ['Baptized in Fear', 'Open Hearts'],
  });
  const text = commands
    .filter((command) => command.kind === 'text')
    .map((command) => command.value);

  expect(text).toEqual(
    expect.arrayContaining([
      'UPDATED 2026.08.29',
      'Baptized in Fear',
      'Open Hearts',
    ]),
  );
  expect(text).not.toContain('예상 · 보장 아님');
});
