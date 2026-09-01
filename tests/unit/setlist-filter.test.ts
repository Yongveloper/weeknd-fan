import { describe, expect, it } from 'vitest';
import {
  filterExpectedSetlist,
  type SetlistFilterable,
} from '../../src/lib/setlist/filter';

const entries: SetlistFilterable[] = [
  {
    id: 'baptized-in-fear',
    data: {
      songTitle: 'Baptized in Fear',
      album: 'Hurry Up Tomorrow',
      expectedOrder: 1,
      essentialOrder: 2,
    },
  },
  {
    id: 'after-hours',
    data: {
      songTitle: 'After Hours',
      album: 'After Hours',
      expectedOrder: 4,
    },
  },
  {
    id: 'blinding-lights',
    data: {
      songTitle: 'Blinding Lights',
      album: 'After Hours',
      expectedOrder: 35,
      essentialOrder: 1,
    },
  },
];

describe('filterExpectedSetlist', () => {
  it('finds song titles case-insensitively after trimming whitespace', () => {
    expect(
      filterExpectedSetlist(entries, {
        query: '  BAPTIZED  ',
        album: null,
        view: 'all',
      }).map((entry) => entry.id),
    ).toEqual(['baptized-in-fear']);
  });

  it('matches an album without changing expected order', () => {
    expect(
      filterExpectedSetlist(entries, {
        query: '',
        album: 'After Hours',
        view: 'all',
      }).map((entry) => entry.id),
    ).toEqual(['after-hours', 'blinding-lights']);
  });

  it('combines the title and album filters', () => {
    expect(
      filterExpectedSetlist(entries, {
        query: 'lights',
        album: 'After Hours',
        view: 'all',
      }).map((entry) => entry.id),
    ).toEqual(['blinding-lights']);
  });

  it('orders the approved essential view by essential order', () => {
    expect(
      filterExpectedSetlist(entries, {
        query: '',
        album: null,
        view: 'essential',
      }).map((entry) => entry.id),
    ).toEqual(['blinding-lights', 'baptized-in-fear']);
  });

  it('returns no entries when the filters find no song', () => {
    expect(
      filterExpectedSetlist(entries, {
        query: '없음',
        album: null,
        view: 'all',
      }),
    ).toEqual([]);
  });
});
