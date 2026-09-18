import { expect, test } from '@playwright/test';
import sharp from 'sharp';

test('foreground cloud bodies contain opaque cores at different wind phases', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const probe = window as typeof window & { cloudFormTime: number };
    probe.cloudFormTime = 8;
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
            ? probe.cloudFormTime
            : value,
        );
      };
      const source = type.prototype.shaderSource;
      type.prototype.shaderSource = function (shader, code) {
        if (
          code.includes('float cumulusAlpha') &&
          !code.includes('#define FOREGROUND_MIST')
        ) {
          // Inspect opacity independently of lighting and the video: a dark
          // foreground core must still occlude, rather than becoming a hole.
          code = code.replace(
            'vec4(color,alpha)',
            'vec4(vec3(cumulusAlpha),1.0)',
          );
        }
        source.call(this, shader, code);
      };
    }
  });
  await page.goto('/');
  await expect(page.locator('dawn-sky')).toHaveAttribute(
    'data-renderer',
    'webgl',
  );
  await page.addStyleTag({
    content:
      '.site-header,.dawn-sky__eclipse,.home-hero__content,.dawn-sky__foreground,.dawn-sky__grain,.reading-panel,.site-footer {visibility:hidden!important}',
  });
  for (const time of [8, 24]) {
    await page.evaluate((time) => {
      (window as typeof window & { cloudFormTime: number }).cloudFormTime =
        time;
    }, time);
    await page.waitForTimeout(150);
    const pixels = await sharp(
      await page.locator('.dawn-sky__clouds').screenshot({ scale: 'css' }),
    )
      .removeAlpha()
      .greyscale()
      .raw()
      .toBuffer();
    const opaque = pixels.filter((value) => value >= 242).length;
    const skirts = pixels.filter((value) => value > 15 && value < 180).length;
    expect(opaque / pixels.length).toBeGreaterThan(0.015);
    expect(skirts / pixels.length).toBeGreaterThan(0.01);
  }
});
