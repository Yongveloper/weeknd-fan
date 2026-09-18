import { expect, test } from '@playwright/test';
import sharp from 'sharp';

test('evolves cloud contours without changing their total density or contrast', async ({
  page,
}) => {
  test.skip(test.info().project.name !== 'desktop-chromium');
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.addInitScript(() => {
    const probe = window as typeof window & { cloudShapeTime: number };
    probe.cloudShapeTime = 0;
    for (const type of [WebGLRenderingContext, WebGL2RenderingContext]) {
      const names = new Map<WebGLUniformLocation, string>();
      const getLocation = type.prototype.getUniformLocation;
      type.prototype.getUniformLocation = function (program, name) {
        const location = getLocation.call(this, program, name);
        if (location) names.set(location, name);
        return location;
      };
      const setFloat = type.prototype.uniform1f;
      type.prototype.uniform1f = function (location, value) {
        setFloat.call(
          this,
          location,
          location && names.get(location) === 'time'
            ? probe.cloudShapeTime
            : value,
        );
      };
      const source = type.prototype.shaderSource;
      type.prototype.shaderSource = function (shader, code) {
        if (
          code.includes('vec2 deformCloud') &&
          !code.includes('#define FOREGROUND_MIST')
        ) {
          // Inspect the complete texture with a margin for displaced edges.
          // Removing translation, lighting and occlusion isolates deformation.
          code = code.replace(
            'vec4(color,alpha)',
            'vec4(vec3(plate(deformCloud(viewportUV*1.2-0.1))),1.0)',
          );
        }
        source.call(this, shader, code);
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
  const frames: { mass: number; variance: number; pixels: Buffer }[] = [];
  for (const time of [0, 4, 8, 16, 40]) {
    await page.evaluate((time) => {
      (window as typeof window & { cloudShapeTime: number }).cloudShapeTime =
        time;
    }, time);
    await page.waitForTimeout(150);
    const pixels = await sharp(await sky.screenshot({ scale: 'css' }))
      .removeAlpha()
      .greyscale()
      .raw()
      .toBuffer();
    const mass = pixels.reduce((sum, p) => sum + p, 0);
    const mean = mass / pixels.length;
    const variance =
      pixels.reduce((sum, p) => sum + (p - mean) ** 2, 0) / pixels.length;
    frames.push({ mass, variance, pixels });
  }
  const original = frames[0]!;
  expect(original.mass).toBeGreaterThan(5_000_000);
  for (const frame of frames.slice(1)) {
    expect(Math.abs(frame.mass / original.mass - 1)).toBeLessThan(0.01);
    expect(Math.abs(frame.variance / original.variance - 1)).toBeLessThan(0.02);
    const change =
      frame.pixels.reduce(
        (sum, p, i) => sum + Math.abs(p - original.pixels[i]!),
        0,
      ) / frame.pixels.length;
    expect(change).toBeGreaterThan(2);
  }
});
