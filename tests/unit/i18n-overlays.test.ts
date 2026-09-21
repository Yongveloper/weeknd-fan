import { describe, expect, it } from 'vitest';
import {
  concertOverlay,
  setlistOverlay,
  sourcesOverlay,
} from '../../src/lib/i18n/content/overlays';

describe('json overlays', () => {
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
