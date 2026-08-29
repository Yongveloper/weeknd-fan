import { describe, expect, it } from 'vitest';
import {
  findAlbumByTitle,
  normalizeAlbumTitle,
} from '../../src/lib/content/albums';

describe('normalizeAlbumTitle', () => {
  it('ignores case, punctuation, and spacing', () => {
    expect(normalizeAlbumTitle('My Dear Melancholy,')).toBe('mydearmelancholy');
    expect(normalizeAlbumTitle('my dear melancholy')).toBe('mydearmelancholy');
    expect(normalizeAlbumTitle('Beauty Behind The Madness')).toBe(
      'beautybehindthemadness',
    );
  });
});

describe('findAlbumByTitle', () => {
  const albums = [
    { data: { title: 'After Hours' } },
    { data: { title: 'My Dear Melancholy,' } },
  ];

  it('matches setlist album strings written without the trailing comma', () => {
    expect(findAlbumByTitle(albums, 'My Dear Melancholy')?.data.title).toBe(
      'My Dear Melancholy,',
    );
  });

  it('returns undefined for releases outside the core discography', () => {
    expect(findAlbumByTitle(albums, 'Heroes & Villains')).toBeUndefined();
  });
});
