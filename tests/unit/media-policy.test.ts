import { describe, expect, it } from 'vitest';
import { heroVideoVariant } from '../../src/lib/media-policy';

describe('heroVideoVariant', () => {
  it('serves the full encode on wide viewports with no constraints', () => {
    expect(heroVideoVariant({ saveData: false, compactViewport: false })).toBe(
      'full',
    );
    expect(
      heroVideoVariant({
        saveData: false,
        effectiveType: '4g',
        compactViewport: false,
      }),
    ).toBe('full');
  });

  it('serves the compact encode on viewports at or below the 42rem breakpoint', () => {
    expect(heroVideoVariant({ saveData: false, compactViewport: true })).toBe(
      'compact',
    );
  });

  it('shows the poster when the browser asks to save data', () => {
    expect(heroVideoVariant({ saveData: true, compactViewport: false })).toBe(
      'none',
    );
    expect(heroVideoVariant({ saveData: true, compactViewport: true })).toBe(
      'none',
    );
  });

  it('shows the poster on slow-2g, 2g and 3g connections', () => {
    for (const effectiveType of ['slow-2g', '2g', '3g']) {
      expect(
        heroVideoVariant({
          saveData: false,
          effectiveType,
          compactViewport: false,
        }),
      ).toBe('none');
    }
  });

  it('ignores unknown effectiveType values', () => {
    expect(
      heroVideoVariant({
        saveData: false,
        effectiveType: 'wifi',
        compactViewport: true,
      }),
    ).toBe('compact');
  });
});
