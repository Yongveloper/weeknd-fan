import { expect, test } from '@playwright/test';
import sharp from 'sharp';

// Freeze wind and inspect density, so illumination/video cannot disguise
// a coordinate stretch or an empty layer as successful scrolling.
async function densityPixels(image: Buffer, top = 0, height = 960) {
  return sharp(image)
    .extract({ left: 0, top, width: 1440, height })
    .greyscale()
    .raw()
    .toBuffer();
}
const difference = (a: Buffer, b: Buffer) =>
  a.reduce((sum, value, i) => sum + Math.abs(value - b[i]!), 0) / a.length;

for (const surface of ['cover', 'reading'] as const) {
  test(`${surface} clouds keep their ${surface === 'cover' ? 'cover' : 'viewport'} coordinates while scrolling`, async ({
    page,
  }) => {
    test.skip(test.info().project.name !== 'desktop-chromium');
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.addInitScript(() => {
      for (const type of [WebGLRenderingContext, WebGL2RenderingContext]) {
        const original = type.prototype.shaderSource;
        type.prototype.shaderSource = function (shader, source) {
          if (
            source.includes('float bankCloud') &&
            !source.includes('#define FOREGROUND_MIST')
          ) {
            const density = 'nearCloud';
            source = source
              .replace('uniform float time;', 'const float time = 5.0;')
              .replace(/vec4\(color,alpha\)/, `vec4(vec3(${density}),1.0)`);
          }
          original.call(this, shader, source);
        };
      }
    });
    await page.goto('/');
    const sky = page.locator('dawn-sky');
    await expect(sky).toHaveAttribute('data-renderer', 'webgl');
    await page.addStyleTag({
      content:
        '.site-header,.dawn-sky__eclipse,.home-hero__content,.dawn-sky__foreground,.reading-panel,.site-footer,.back-to-top { visibility:hidden!important; }',
    });
    const capture = async (top: number) => {
      await page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), top);
      await page.waitForTimeout(180);
      return sky.screenshot({ scale: 'css' });
    };
    if (surface === 'cover') {
      const a = await densityPixels(await capture(0), 360, 260);
      const b = await densityPixels(await capture(180), 180, 260);
      expect(a.reduce((sum, value) => sum + value, 0)).toBeGreaterThan(
        1_000_000,
      );
      expect(difference(a, b)).toBeLessThan(0.8);
    } else {
      const a = await capture(1300);
      const b = await capture(1450);
      // The reading scene has its own fixed viewport coordinates. Freeze
      // only wind: scrolling must not translate or stretch the actual density.
      const alignedA = await densityPixels(a, 200, 400);
      const alignedB = await densityPixels(b, 200, 400);
      expect(alignedA.reduce((sum, value) => sum + value, 0)).toBeGreaterThan(
        1_000_000,
      );
      expect(difference(alignedA, alignedB)).toBeLessThan(0.1);
    }
  });
}

for (const route of ['/discover/', '/setlist/', '/goyang/']) {
  test(`${route} renders independent clouds behind the backed-up board`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(route);
    const sky = page.locator('dawn-sky[data-surface="reading"]');
    await expect(sky).toHaveAttribute('data-renderer', 'webgl');
    await expect(sky).toHaveAttribute('data-state', 'reading');
    await expect(page.locator('moon-light')).toHaveCount(0);
    const alpha = await page
      .locator('.reading-surface')
      .evaluate((el) =>
        Number(
          getComputedStyle(el)
            .backgroundColor.split(',')
            .at(-1)
            ?.replace(')', ''),
        ),
      );
    expect(alpha).toBeCloseTo(0.629, 2);
    const box = await sky.boundingBox();
    await page.evaluate(() => scrollTo({ top: 800, behavior: 'instant' }));
    expect(await sky.boundingBox()).toEqual(box);
    expect(errors).toEqual([]);
  });
}
