import { describe, expect, it } from 'vitest';
import { getSetlistEditorialMetadata } from '../../src/lib/content/queries';

describe('getSetlistEditorialMetadata', () => {
  it('advances the version and observation count when only setlist records refresh', () => {
    const metadata = getSetlistEditorialMetadata([
      {
        data: {
          lastVerifiedAt: new Date('2026-08-29T00:00:00+09:00'),
          observedIn: [{ id: 'manchester' }, { id: 'london-14' }],
        },
      },
      {
        data: {
          lastVerifiedAt: new Date('2026-09-20T00:00:00+09:00'),
          observedIn: [{ id: 'london-14' }, { id: 'tokyo' }],
        },
      },
    ]);

    expect(metadata).toEqual({ version: '2026-09-20', observationCount: 3 });
  });
});
