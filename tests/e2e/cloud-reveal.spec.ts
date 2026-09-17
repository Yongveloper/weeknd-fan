import { expect, test } from '@playwright/test';
import sharp from 'sharp';

test('reveals clouds linearly from one to four seconds independently of eclipse brightness', async ({
  page,
}) => {
  // Freeze travel and lighting to measure the reveal itself in rendered pixels.
  await page.addInitScript(() => {
    for (const type of [WebGLRenderingContext, WebGL2RenderingContext]) {
      const fields = new Map<WebGLUniformLocation, string>();
      const getLocation = type.prototype.getUniformLocation;
      type.prototype.getUniformLocation = function (program, name) {
        const location = getLocation.call(this, program, name);
        if (location) fields.set(location, name);
        return location;
      };
      const setFloat = type.prototype.uniform1f;
      type.prototype.uniform1f = function (location, value) {
        const name = location && fields.get(location);
        const fixed =
          name === 'time'
            ? 8
            : name === 'dawn'
              ? 1
              : name === 'titleEnergy'
                ? 0
                : value;
        setFloat.call(this, location, fixed);
      };
    }
  });
  await page.goto('/');
  const sky = page.locator('dawn-sky');
  await expect(sky).toHaveAttribute('data-renderer', 'webgl');
  await page.addStyleTag({
    content: `
      .site-header,.dawn-sky__eclipse,.home-hero__content,
      .reading-panel,.site-footer,.back-to-top { visibility:hidden!important; }
      body,.home-hero { background:#000!important; }
    `,
  });
  const coverBottom = await page
    .locator('[data-home-hero]')
    .evaluate((hero) => hero.getBoundingClientRect().bottom);
  const levels: number[] = [];
  for (const time of [500, 1000, 1750, 2500, 3250, 4000, 5500]) {
    // Keep rAF and GPU preparation live; control only the navigation clock.
    await page.evaluate((time) => {
      performance.now = () => time;
    }, time);
    await expect(sky).toHaveAttribute(
      'data-cloud-reveal',
      Math.max(0, Math.min(1, (time - 1000) / 3000)).toFixed(3),
    );
    const frame = await sky.screenshot({ scale: 'css' });
    const { width, height } = await sharp(frame).metadata();
    // Exclude the independent reading clouds below the cover.
    const sample = await sharp(frame)
      .extract({
        left: 0,
        top: 0,
        width: width!,
        height: Math.min(height!, Math.floor(coverBottom)),
      })
      .removeAlpha()
      .raw()
      .toBuffer();
    levels.push(sample.reduce((sum, value) => sum + value, 0) / sample.length);
  }
  expect(levels[0]).toBeLessThan(0.2);
  expect(levels[1]).toBeLessThan(0.2);
  const peak = levels[5]!;
  expect(peak).toBeGreaterThan(1);
  for (const [index, ratio] of [
    [2, 0.25],
    [3, 0.5],
    [4, 0.75],
  ] as const) {
    expect(Math.abs(levels[index]! / peak - ratio)).toBeLessThan(0.08);
  }
  expect(Math.abs(levels[6]! - peak)).toBeLessThan(0.3);
});
