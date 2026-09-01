import { describe, expect, it } from 'vitest';
import { getHorizontalClipIntersection } from '../../tests/e2e/helpers/accessibility';

describe('getHorizontalClipIntersection', () => {
  const viewportWidth = 320;
  const scroller = { left: 0, right: viewportWidth };

  it('ignores a scroll child fully outside the clipping ancestor', () => {
    expect(
      getHorizontalClipIntersection(
        { left: 321, right: 365 },
        [scroller],
        viewportWidth,
      ),
    ).toBeNull();
  });

  it('keeps a visible focused link eligible for viewport checks', () => {
    expect(
      getHorizontalClipIntersection(
        { left: 24, right: 120 },
        [scroller],
        viewportWidth,
      ),
    ).toEqual({ left: 24, right: 120 });
  });

  it('keeps a partially clipped link eligible for viewport checks', () => {
    expect(
      getHorizontalClipIntersection(
        { left: 300, right: 340 },
        [scroller],
        viewportWidth,
      ),
    ).toEqual({ left: 300, right: 320 });
  });
});
