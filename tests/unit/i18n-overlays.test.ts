import { describe, expect, it } from 'vitest';
import {
  concertOverlay,
  setlistEntrySchema,
  setlistOverlay,
  sourcesOverlay,
} from '../../src/lib/i18n/content/overlays';

const validSetlistEntry = {
  title: 'Blinding Lights',
  summary: 'A synth-pop highlight.',
  liveNote: 'Live note.',
  singAlongNote: 'Sing-along note.',
  sourceHash: 'a292cb5030b783e7',
  translatedAt: '2026-09-20',
};

describe('json bundle loaders', () => {
  it('parses each bundle without throwing', () => {
    expect(() => setlistOverlay('en')).not.toThrow();
    expect(() => sourcesOverlay('en')).not.toThrow();
    expect(() => concertOverlay('en')).not.toThrow();
  });

  it('returns an empty map for korean, which needs no overlay', () => {
    expect(setlistOverlay('ko')).toEqual({});
    expect(sourcesOverlay('ko')).toEqual({});
    expect(concertOverlay('ko')).toEqual({});
  });

  it('requires a sourceHash on every translated entry', () => {
    for (const entry of Object.values(setlistOverlay('en')))
      expect(entry.sourceHash).toMatch(/^[0-9a-f]{16}$/);
  });
});

// The bundles above are empty until Tasks 6-9 add content, so the tests in
// that describe block cannot exercise the schema at all today: a `bundle()`
// stubbed to unconditionally return `{}` would pass every one of them. This
// block builds fixtures directly and checks the schema itself, independent
// of what is on disk.
describe('setlistEntrySchema', () => {
  it('parses a well-formed entry', () => {
    const result = setlistEntrySchema.parse(validSetlistEntry);
    expect(result).toEqual(validSetlistEntry);
  });

  it('normalizes a JS Date translatedAt to a plain YYYY-MM-DD string', () => {
    const result = setlistEntrySchema.parse({
      ...validSetlistEntry,
      translatedAt: new Date('2026-09-20T00:00:00.000Z'),
    });
    expect(result.translatedAt).toBe('2026-09-20');
  });

  it('accepts an ISO date string translatedAt unchanged', () => {
    const result = setlistEntrySchema.parse(validSetlistEntry);
    expect(result.translatedAt).toBe('2026-09-20');
  });

  it('rejects an entry missing sourceHash', () => {
    const withoutHash: Record<string, unknown> = { ...validSetlistEntry };
    delete withoutHash.sourceHash;
    expect(() => setlistEntrySchema.parse(withoutHash)).toThrow();
  });

  it('rejects an entry with an extra key', () => {
    expect(() =>
      setlistEntrySchema.parse({ ...validSetlistEntry, extra: 'nope' }),
    ).toThrow();
  });

  it('rejects a malformed translatedAt', () => {
    expect(() =>
      setlistEntrySchema.parse({
        ...validSetlistEntry,
        translatedAt: 'not-a-date',
      }),
    ).toThrow();
  });

  it('rejects a sourceHash that is not 16 lowercase hex characters', () => {
    expect(() =>
      setlistEntrySchema.parse({
        ...validSetlistEntry,
        sourceHash: 'TOOSHORT',
      }),
    ).toThrow();
    expect(() =>
      setlistEntrySchema.parse({
        ...validSetlistEntry,
        sourceHash: 'a292cb5030b783e77',
      }),
    ).toThrow();
  });
});
