import { expect, test } from 'vitest';
import { buildSetlistCardLayout } from '../../src/lib/share/buildSetlistCardLayout';

test('uses the approved poster intact, re-lettering only its updated date', () => {
  const commands = buildSetlistCardLayout('2026.09.23');
  expect(commands).toContainEqual({
    kind: 'surface',
    width: 1080,
    height: 1638,
  });
  const images = commands.filter((command) => command.kind === 'image');
  expect(images[0]).toEqual({
    kind: 'image',
    src: '/visual/share/poster-approved.webp',
    x: 0,
    y: 0,
    width: 1080,
    height: 1638,
    opacity: 1,
  });
  // The only other image is a patch of the poster's own paper.
  expect(images.slice(1)).toHaveLength(1);
  expect(images[1]).toMatchObject({
    src: '/visual/share/poster-approved.webp',
  });
  expect(
    commands
      .filter((command) => command.kind === 'text')
      .map((command) => command.value),
  ).toEqual(['UPDATED 2026.09.23']);
});
