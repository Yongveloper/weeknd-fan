import { expect, test } from 'vitest';
import { buildSetlistCardLayout } from '../../src/lib/share/buildSetlistCardLayout';

test('uses the approved poster intact, without re-typesetting its song list', () => {
  const commands = buildSetlistCardLayout();
  expect(commands).toContainEqual({
    kind: 'surface',
    width: 1080,
    height: 1638,
  });
  expect(commands.filter((command) => command.kind === 'text')).toEqual([]);
  expect(commands.filter((command) => command.kind === 'image')).toEqual([
    {
      kind: 'image',
      src: '/visual/share/poster-approved.webp',
      x: 0,
      y: 0,
      width: 1080,
      height: 1638,
      opacity: 1,
    },
  ]);
});
