import { expect, test } from '@playwright/test';

for (const [route, opacity] of [
  ['/', 0.21735 * 1.15],
  ['/goyang/', 0.18 * 1.15],
  ['/share/ticket/', 0.18 * 1.15],
] as const) {
  test(`${route} has one full-screen grain layer without blocking controls`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route);
    const grain = page.locator('.dawn-sky__grain');
    await expect(grain).toHaveCount(1);
    const style = await grain.evaluate((el) => {
      const css = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      return {
        opacity: Number(css.opacity),
        position: css.position,
        pointer: css.pointerEvents,
        width: box.width,
        height: box.height,
      };
    });
    expect(style.opacity).toBeCloseTo(opacity, 5);
    expect(style.position).toBe('fixed');
    expect(style.pointer).toBe('none');
    expect(style.width).toBe(page.viewportSize()!.width);
    expect(style.height).toBe(page.viewportSize()!.height);
  });
}
