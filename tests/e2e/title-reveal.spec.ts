import { expect, test } from '@playwright/test';

test('reveals AFTER HOURS at 2s and TIL DAWN continuously at 5s', async ({
  page,
}) => {
  await page.goto('/');
  const hero = page.locator('[data-home-hero]');
  await expect(hero).toHaveAttribute('data-title-phase', 'revealing');
  const samples = await page.locator('#home-title').evaluate((heading) => {
    const sample = (selector: string, times: number[]) => {
      const line = heading.querySelector(selector)!;
      const animation = line.getAnimations()[0]!;
      animation.pause();
      const timing = animation.effect!.getTiming();
      return {
        delay: timing.delay,
        duration: timing.duration,
        opacity: times.map((time) => {
          animation.currentTime = time;
          return Number(getComputedStyle(line).opacity);
        }),
      };
    };
    return {
      after: sample('.home-hero__after', [1999, 2000, 3200, 6000]),
      dawn: sample('.home-hero__dawn', [4999, 5000, 6100, 6200, 6300, 8999]),
    };
  });
  expect(samples.after.delay).toBe(2000);
  expect(samples.after.duration).toBe(4000);
  expect(samples.after.opacity.slice(0, 2)).toEqual([0, 0]);
  expect(samples.after.opacity[2]).toBeCloseTo(0.35, 3);
  expect(samples.after.opacity[3]).toBe(1);
  expect(samples.dawn.delay).toBe(5000);
  expect(samples.dawn.duration).toBe(4000);
  expect(samples.dawn.opacity.slice(0, 2)).toEqual([0, 0]);
  expect(samples.dawn.opacity[5]).toBeCloseTo(1, 4);

  // The old 30% keyframe flattened the incoming opacity, then restarted
  // easing with a sudden increase. Equal intervals must stay continuous.
  const before = samples.dawn.opacity[3]! - samples.dawn.opacity[2]!;
  const after = samples.dawn.opacity[4]! - samples.dawn.opacity[3]!;
  expect(before).toBeGreaterThan(0.02);
  expect(after / before).toBeGreaterThan(0.75);
  expect(after / before).toBeLessThan(1.1);

  // The arrival ends at steady peak brightness, without a second animation.
  await page.locator('.home-hero__dawn').evaluate((line) => {
    const animation = line.getAnimations()[0]!;
    animation.currentTime = 8900;
    animation.play();
  });
  await expect(hero).toHaveAttribute('data-title-phase', 'shown');
  await expect(page.locator('.home-hero__dawn')).toHaveCSS('opacity', '1');
  await expect(page.locator('.home-hero__dawn')).toHaveCSS('filter', 'none');
  // The face stays open, with a sharp white filament above the warm corona.
  const outline = await page.locator('.home-hero__dawn').evaluate((line) => {
    const core = line.querySelector('.home-hero__dawn-core')!;
    const main = getComputedStyle(line);
    const edge = getComputedStyle(core, '::before');
    const filament = getComputedStyle(core, '::after');
    return {
      fills: [main, edge, filament].map((style) => style.webkitTextFillColor),
      widths: [edge, filament].map((style) =>
        parseFloat(style.webkitTextStrokeWidth),
      ),
      filament: filament.webkitTextStrokeColor,
      filter: filament.filter,
    };
  });
  expect(outline.fills).toEqual(Array(3).fill('rgba(0, 0, 0, 0)'));
  expect(outline.widths[1]).toBeGreaterThan(0);
  expect(outline.widths[0]!).toBeGreaterThan(outline.widths[1]!);
  expect(outline.filament).toBe('rgb(255, 255, 255)');
  expect(outline.filter).toBe('none');
  await expect(page.locator('.home-hero__dawn-light')).toHaveCSS(
    'animation-name',
    'none',
  );
  await expect(page.locator('dawn-sky')).toHaveAttribute(
    'data-title-light',
    '1.000',
  );
  await page.waitForTimeout(5200);
  await expect(page.locator('.home-hero__dawn-light')).toHaveCSS(
    'opacity',
    '1',
  );
  await expect(page.locator('dawn-sky')).toHaveAttribute(
    'data-title-light',
    '1.000',
  );
});

test('keeps the reflected title light aligned with the continuous reveal', async ({
  page,
}) => {
  await page.goto('/');
  const sky = page.locator('dawn-sky');
  await expect(sky).toHaveAttribute('data-renderer', 'webgl');
  const title = page.locator('.home-hero__dawn');
  for (const time of [5000, 6000, 6200, 6400, 8200]) {
    const opacity = await title.evaluate((line, time) => {
      const animation = line.getAnimations()[0]!;
      animation.pause();
      animation.currentTime = time;
      return Number(getComputedStyle(line).opacity);
    }, time);
    await expect
      .poll(async () =>
        Math.abs(Number(await sky.getAttribute('data-title-light')) - opacity),
      )
      .toBeLessThan(0.005);
  }
});
