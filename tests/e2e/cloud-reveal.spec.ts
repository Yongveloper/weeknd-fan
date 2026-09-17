import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import curve from '../../src/lib/moon-light-curve.json' with { type: 'json' };

test('reveals cloud bodies and mist with the emitting rim rather than page load', async ({
  page,
}) => {
  // Freeze travel only. The actual video light still drives the atmosphere.
  await page.addInitScript(() => {
    for (const type of [WebGLRenderingContext, WebGL2RenderingContext]) {
      const times = new Set<WebGLUniformLocation>();
      const getLocation = type.prototype.getUniformLocation;
      type.prototype.getUniformLocation = function (program, name) {
        const location = getLocation.call(this, program, name);
        if (location && name === 'time') times.add(location);
        return location;
      };
      const setFloat = type.prototype.uniform1f;
      type.prototype.uniform1f = function (location, value) {
        setFloat.call(
          this,
          location,
          location && times.has(location) ? 8 : value,
        );
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
  for (const time of [0.5, 1.5, 2.5, 3.5, 7]) {
    await page.locator('[data-intro]').evaluate(async (element, time) => {
      const video = element as HTMLVideoElement;
      video.pause();
      await new Promise<void>((resolve) => {
        video.addEventListener('seeked', () => resolve(), { once: true });
        video.currentTime = time;
      });
    }, time);
    await expect(sky).toHaveAttribute(
      'data-dawn-progress',
      curve.values[time * curve.fps]!.toFixed(3),
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
  expect(levels[2]).toBeGreaterThan(0.5);
  expect(levels[3]!).toBeGreaterThan(levels[2]! * 1.5);
  expect(levels[4]!).toBeGreaterThan(levels[3]!);
});
