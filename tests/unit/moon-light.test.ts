import { describe, expect, it } from 'vitest';
import { moonLightAt } from '../../src/lib/moon-light';

describe('v8 scene coordination', () => {
  it('keeps the dark opening and samples the same light at the loop handoff', () => {
    expect(moonLightAt(0, 'intro')).toBe(0);
    expect(moonLightAt(7, 'intro')).toBeCloseTo(moonLightAt(0, 'loop'), 5);
    expect(moonLightAt(20, 'loop')).toBe(moonLightAt(0, 'loop'));
    expect(moonLightAt(10.33, 'loop')).toBeGreaterThan(0.4);
  });
});
