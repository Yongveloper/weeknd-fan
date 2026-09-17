import { expect, test } from '@playwright/test';
import sharp from 'sharp';

test('keeps a ten-percent left glow rising to the unchanged six oclock light', async ({
  page,
}) => {
  await page.addInitScript(() => {
    for (const type of [WebGLRenderingContext, WebGL2RenderingContext]) {
      const original = type.prototype.shaderSource;
      type.prototype.shaderSource = function (shader, source) {
        if (
          source.includes('float bankCloud') &&
          !source.includes('#define FOREGROUND_MIST')
        ) {
          // Equal-density cloud probes must receive different illumination
          // purely from their position, without baked texture highlights.
          source = source.replace(
            'vec4(color,alpha)',
            'vec4(vec3(illumination*0.5),1.0)',
          );
        }
        original.call(this, shader, source);
      };
    }
  });
  await page.goto('/');
  const sky = page.locator('dawn-sky');
  await expect(sky).toHaveAttribute('data-renderer', 'webgl');
  await page.locator('[data-intro]').evaluate((el) => {
    const video = el as HTMLVideoElement;
    video.pause();
    video.currentTime = 7;
  });
  await expect
    .poll(async () => Number(await sky.getAttribute('data-dawn-progress')))
    .toBeGreaterThan(0.95);
  const geometry = await page.locator('moon-light').evaluate((el) => {
    const r = el.getBoundingClientRect();
    return {
      x: r.x + r.width / 2,
      y: r.y + r.height / 2,
      radius: r.width * 0.3104375,
      stage: document.querySelector('[data-home-hero]')!.getBoundingClientRect()
        .height,
      desktop: matchMedia('(min-width: 42.001rem)').matches,
    };
  });
  await page.addStyleTag({
    // Probe the lighting field itself, without the film-grain compositing pass.
    content:
      '.site-header,.dawn-sky__eclipse,.home-hero__content,.dawn-sky__foreground,.dawn-sky__grain,.reading-panel,.site-footer,.back-to-top { visibility:hidden!important; }',
  });
  const frame = await sky.screenshot({ scale: 'css' });
  const sample = async (x: number, y: number) => {
    const stats = await sharp(
      await sharp(frame)
        .extract({
          left: Math.round(x) - 2,
          top: Math.round(y) - 2,
          width: 5,
          height: 5,
        })
        .toBuffer(),
    ).stats();
    return (stats.channels[0]!.mean * 2) / 255;
  };
  const atHour = (hour: number) => {
    const angle = ((6 - hour) * Math.PI) / 6;
    return sample(
      geometry.x + Math.sin(angle) * geometry.radius * 1.12,
      geometry.y + Math.cos(angle) * geometry.radius * 1.12,
    );
  };
  const [five, six, seven, sevenHalf, eight] = await Promise.all([
    atHour(5),
    atHour(6),
    atHour(7),
    atHour(7.5),
    atHour(8),
  ]);
  // The existing five/six peak is retained, rather than increasing the
  // maximum to make the left look brighter by comparison.
  const radius = geometry.radius / geometry.stage;
  const expectedSix =
    Math.exp(-((0.2 / 0.68) ** 2)) *
    0.98 *
    (1 +
      (geometry.desktop ? 0.35 : 0) *
        Math.exp(-Math.hypot(radius * 0.985, radius * 1.05) * 1.65));
  expect(six).toBeCloseTo(expectedSix, 1);
  const expectedFive =
    Math.exp(-(((Math.PI / 6 - 0.2) / 0.68) ** 2)) *
    0.98 *
    (1 +
      (geometry.desktop ? 0.35 : 0) *
        Math.exp(
          -Math.hypot(
            radius * (0.56 - 0.985),
            radius * (Math.cos(Math.PI / 6) * 1.12 - 0.07),
          ) * 1.65,
        ));
  expect(five).toBeCloseTo(expectedFive, 1);
  expect(seven).toBeLessThan(six);
  expect(sevenHalf).toBeLessThan(seven);
  expect(eight).toBeLessThan(sevenHalf);
  expect(eight).toBeGreaterThan(six * 0.15);

  // Equal-height probes isolate the requested left-to-six spatial ramp.
  const y = geometry.y + geometry.radius * 1.12;
  const samples = await Promise.all(
    [0, 0.25, 0.5, 0.75, 1].map((fraction) =>
      sample(Math.max(3, geometry.x * fraction), y),
    ),
  );
  expect(samples[0]! / six).toBeCloseTo(0.1, 2);
  for (let i = 1; i < samples.length; i++) {
    expect(samples[i]).toBeGreaterThan(samples[i - 1]!);
  }
  expect(samples[4]).toBeCloseTo(six, 2);
});
