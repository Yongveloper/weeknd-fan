import { expect, test } from '@playwright/test';
import sharp from 'sharp';

test('reveals the sun into gold clouds, then keeps the mist moving', async ({
  page,
}, testInfo) => {
  test.setTimeout(45000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const sky = page.locator('dawn-sky');
  await expect(sky).toHaveAttribute('data-renderer', 'webgl');
  const night = await sky.screenshot();
  await expect(sky).toHaveAttribute('data-state', 'dawn', { timeout: 30000 });
  const dawn = await sky.screenshot();
  const dimensions = await sharp(dawn).metadata();
  const lightSide = {
    left: Math.floor(dimensions.width! * 0.75),
    top: 0,
    width: dimensions.width! - Math.floor(dimensions.width! * 0.75),
    height: dimensions.height!,
  };
  const nightStats = await sharp(
    await sharp(night).extract(lightSide).toBuffer(),
  ).stats();
  const dawnStats = await sharp(
    await sharp(dawn).extract(lightSide).toBuffer(),
  ).stats();
  // The emitting side brightens; the rest of the sky should stay dark.
  expect(
    dawnStats.channels[0]!.mean - nightStats.channels[0]!.mean,
  ).toBeGreaterThan(15);
  expect(dawnStats.channels[0]!.mean).toBeGreaterThan(
    dawnStats.channels[2]!.mean,
  );
  expect(dawnStats.channels[0]!.mean).toBeGreaterThan(
    dawnStats.channels[1]!.mean * 1.2,
  );
  await page.waitForTimeout(1200);
  const moving = await sky.screenshot();
  const pixelsA = await sharp(dawn)
    .resize(100, 100)
    .removeAlpha()
    .raw()
    .toBuffer();
  const pixelsB = await sharp(moving)
    .resize(100, 100)
    .removeAlpha()
    .raw()
    .toBuffer();
  const change =
    pixelsA.reduce((sum, value, i) => sum + Math.abs(value - pixelsB[i]!), 0) /
    pixelsA.length;
  expect(change).toBeGreaterThan(0.5);
  await testInfo.attach('night.png', { body: night, contentType: 'image/png' });
  await testInfo.attach('dawn.png', { body: dawn, contentType: 'image/png' });
  expect(errors).toEqual([]);
  // Returning from the content must preserve dawn, not restart the intro.
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await expect(sky).toHaveAttribute('data-state', 'reading');
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(sky).toHaveAttribute('data-state', 'dawn');
});

test('keeps the disk clear and lights moving clouds from the strong side of the rim', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  const sky = page.locator('dawn-sky');
  await expect(sky).toHaveAttribute('data-renderer', 'webgl');
  await expect(page.locator('moon-light')).toHaveAttribute(
    'data-phase',
    'intro',
  );
  await page.locator('[data-intro]').evaluate((el) => {
    const video = el as HTMLVideoElement;
    video.pause();
    video.currentTime = 7;
  });
  await expect
    .poll(async () => Number(await sky.getAttribute('data-dawn-progress')))
    .toBeGreaterThan(0.95);
  // Inspect only the atmosphere, so the video's own bright rim cannot make
  // this lighting assertion pass or masquerade as moving clouds.
  await page.addStyleTag({
    content:
      '.dawn-sky__eclipse, .home-hero__content { visibility: hidden !important; }',
  });
  const geometry = await sky.evaluate((el) => {
    const bounds = el.getBoundingClientRect();
    const art = el
      .closest('[data-home-hero]')!
      .querySelector('moon-light')!
      .getBoundingClientRect();
    return {
      x: art.x + art.width / 2 - bounds.x,
      y: art.y + art.height / 2 - bounds.y,
      r: art.width * 0.3104375,
      width: bounds.width,
      height: bounds.height,
    };
  });
  const frame = await sky.screenshot({ scale: 'css' });
  const region = (x: number, y: number, width: number, height: number) => ({
    left: Math.max(0, Math.floor(x)),
    top: Math.max(0, Math.floor(y)),
    width: Math.max(
      1,
      Math.floor(Math.min(width, geometry.width - Math.max(0, x))),
    ),
    height: Math.max(
      1,
      Math.floor(Math.min(height, geometry.height - Math.max(0, y))),
    ),
  });
  const { x, y, r } = geometry;
  // stats() reads the input image; materialize each crop before measuring it.
  const statsFor = async (rectangle: ReturnType<typeof region>) =>
    sharp(await sharp(frame).extract(rectangle).toBuffer()).stats();
  const [center, left, right] = await Promise.all([
    statsFor(region(x - r * 0.22, y - r * 0.22, r * 0.44, r * 0.44)),
    statsFor(region(x - r * 1.3, y - r * 0.35, r * 0.3, r * 0.7)),
    statsFor(region(x + r, y - r * 0.35, r * 0.3, r * 0.7)),
  ]);
  // The new thin mist may cross the disk, but must not become an opaque bank.
  expect(center.channels[0]!.mean).toBeGreaterThan(4);
  expect(center.channels[0]!.mean).toBeLessThan(24);
  expect(right.channels[0]!.mean).toBeGreaterThan(
    center.channels[0]!.mean * 1.4,
  );
  expect(left.channels[0]!.mean).toBeGreaterThan(6);
  expect(right.channels[0]!.mean).toBeGreaterThan(left.channels[0]!.mean * 1.2);
  expect(right.channels[0]!.mean).toBeGreaterThan(12);
  await page.waitForTimeout(1500);
  const moving = await sky.screenshot({ scale: 'css' });
  const a = await sharp(frame).resize(120, 120).removeAlpha().raw().toBuffer();
  const b = await sharp(moving).resize(120, 120).removeAlpha().raw().toBuffer();
  const change =
    a.reduce((sum, value, i) => sum + Math.abs(value - b[i]!), 0) / a.length;
  expect(change).toBeGreaterThan(0.15);
  await testInfo.attach('isolated-clouds.png', {
    body: frame,
    contentType: 'image/png',
  });
});

test('fits the scene and title without horizontal overflow', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('dawn-sky')).toHaveAttribute('aria-hidden', 'true');
  const metrics = await page.evaluate(() => {
    const sky = document.querySelector('dawn-sky')!.getBoundingClientRect();
    const title = document
      .querySelector('#home-title')!
      .getBoundingClientRect();
    return {
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
      skyWidth: sky.width,
      titleRight: title.right,
      titleLeft: title.left,
    };
  });
  expect(metrics.scroll).toBeLessThanOrEqual(metrics.width);
  expect(metrics.skyWidth).toBe(metrics.width);
  expect(metrics.titleLeft).toBeGreaterThanOrEqual(0);
  expect(metrics.titleRight).toBeLessThanOrEqual(metrics.width);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'AFTER HOURS TIL DAWN',
  );
});

test('takes seven real seconds to reveal the original rim without scaling it', async ({
  page,
}) => {
  await page.goto('/');
  const moon = page.locator('moon-light');
  await expect(moon).toHaveAttribute('data-phase', 'intro');
  // Sample on the browser clock so transport latency cannot shift a six-second
  // assertion beyond the eight-second title reveal on a busy mobile runner.
  const { start, middle, rim, complete } = await moon.evaluate(async (el) => {
    const video = el.querySelector<HTMLVideoElement>('[data-intro]')!;
    const hero = el.closest<HTMLElement>('[data-home-hero]')!;
    const title = hero.querySelector<HTMLElement>('.home-hero__dawn')!;
    const sample = () => ({
      time: video.currentTime,
      rate: video.playbackRate,
      light: Number((el as HTMLElement).dataset.light),
      width: el.getBoundingClientRect().width,
      titleOpacity: Number(getComputedStyle(title).opacity),
      titleFilter: getComputedStyle(title).filter,
      titlePhase: hero.dataset.titlePhase,
      titleDelay: getComputedStyle(title).animationDelay,
      titleDuration: getComputedStyle(title).animationDuration,
    });
    const wait = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    const start = sample();
    await wait(3200);
    const middle = sample();
    await wait(4000);
    const rim = sample();
    await wait(1300);
    return { start, middle, rim, complete: sample() };
  });
  expect(start.rate).toBe(1);
  expect(start.light).toBeLessThan(0.1);
  expect(start.titleOpacity).toBe(0);
  expect(start.titleDelay).toBe('4s');
  expect(start.titleDuration).toBe('4s');
  expect(middle.time - start.time).toBeGreaterThan(2.9);
  expect(middle.time - start.time).toBeLessThan(3.7);
  expect(middle.light).toBeGreaterThan(0.3);
  expect(middle.light).toBeLessThan(0.65);
  expect(rim.time).toBeGreaterThanOrEqual(7);
  expect(rim.light).toBeGreaterThan(0.94);
  expect(rim.width).toBe(start.width);
  expect(complete.titlePhase).toBe('shown');
  expect(complete.titleOpacity).toBe(1);
  expect(complete.titleFilter).toBe('none');
  expect(complete.width).toBe(start.width);
  await expect(page.locator('.home-hero__dawn-light')).toHaveCSS(
    'animation-name',
    'none',
  );
});

test('places dawn above clouds and behind mist that catches its steady peak light', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const probe = window as typeof window & {
      suppressTitleReflection?: boolean;
    };
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
        const name = location && names.get(location);
        setFloat.call(
          this,
          location,
          name === 'time'
            ? 8
            : name === 'titleEnergy' && probe.suppressTitleReflection
              ? 0
              : value,
        );
      };
    }
  });
  await page.goto('/');
  const sky = page.locator('dawn-sky');
  await expect(sky).toHaveAttribute('data-renderer', 'webgl');
  await expect(page.locator('[data-home-hero]')).toHaveAttribute(
    'data-title-phase',
    'shown',
    { timeout: 10000 },
  );
  await expect(page.locator('.home-hero__dawn')).toHaveCSS('z-index', '2');
  await expect(sky).toHaveCSS('z-index', '1');
  await expect(sky.locator('.dawn-sky__clouds')).toHaveCSS('opacity', '1');
  await expect(page.locator('.dawn-sky__foreground')).toHaveCSS('z-index', '3');
  await expect(page.locator('.home-hero__after')).toHaveCSS('z-index', '4');
  // The preserved line slot can be wider than a resized title. Sample the
  // actual letters so unlit layout space does not dilute the mist's color.
  const clip = await page.locator('.home-hero__dawn').evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el.firstChild!);
    const { x, y, width, height } = range.getBoundingClientRect();
    return { x, y, width, height };
  });
  // Isolate the mist and hold its wind still, then remove only the title's
  // reflected light in the probe. A constant source must still illuminate it.
  await page.addStyleTag({
    content:
      '.home-hero__content, .dawn-sky__eclipse, .dawn-sky__clouds { visibility: hidden !important; }',
  });
  await expect(sky).toHaveAttribute('data-title-light', '1.000');
  await expect(page.locator('.home-hero__dawn-light')).toHaveCSS(
    'animation-name',
    'none',
  );
  const bright = await page.screenshot({ clip, scale: 'css' });
  await page.evaluate(() => {
    (
      window as typeof window & { suppressTitleReflection: boolean }
    ).suppressTitleReflection = true;
  });
  await page.waitForTimeout(150);
  const dim = await page.screenshot({ clip, scale: 'css' });
  const brightStats = await sharp(bright).stats();
  const dimStats = await sharp(dim).stats();
  expect(
    brightStats.channels[0]!.mean - dimStats.channels[0]!.mean,
  ).toBeGreaterThan(1);
  expect(brightStats.channels[0]!.mean).toBeGreaterThan(
    brightStats.channels[2]!.mean * 1.2,
  );
});

test('restores the original v8 media and keeps cloud light synchronized', async ({
  page,
}) => {
  await page.goto('/');
  const moon = page.locator('moon-light');
  await expect(moon).toHaveAttribute('data-phase', 'intro');
  await expect(moon.locator('[data-intro] source')).toHaveAttribute(
    'src',
    '/visual/moon-v8/intro.mp4',
  );
  await expect(
    moon.locator('picture source[type="image/avif"]'),
  ).toHaveAttribute('srcset', '/visual/moon-v8/poster.avif');
  await expect(page.locator('.dawn-sky__sun')).toHaveCount(0);
  await moon.locator('[data-intro]').evaluate((el) => {
    (el as HTMLVideoElement).currentTime = 17;
  });
  await expect
    .poll(async () =>
      Number(await page.locator('dawn-sky').getAttribute('data-dawn-progress')),
    )
    .toBeGreaterThan(0.4);
  await expect
    .poll(async () => {
      const sky = Number(
        await page.locator('dawn-sky').getAttribute('data-dawn-progress'),
      );
      const light = Number(await moon.getAttribute('data-light'));
      return Math.abs(sky - light);
    })
    .toBeLessThan(0.03);
  await moon.locator('[data-intro]').evaluate((el) => {
    (el as HTMLVideoElement).currentTime = 26.7;
  });
  await expect(moon).toHaveAttribute('data-phase', 'loop');
  await expect(moon.locator('[data-loop] source')).toHaveAttribute(
    'src',
    '/visual/moon-v8/loop.mp4',
  );
  const geometry = await moon.evaluate((el) => ({
    diameter: (el.getBoundingClientRect().width * 0.620875) / innerWidth,
    width: innerWidth,
  }));
  expect(geometry.diameter).toBeCloseTo(geometry.width <= 672 ? 0.68 : 0.4, 2);
});

test('extends the sky behind the header and keeps cover art out of the reading surface', async ({
  page,
}) => {
  await page.goto('/');
  const sky = page.locator('dawn-sky');
  const moon = page.locator('moon-light');
  const title = page.locator('#home-title');
  await expect(sky).toHaveAttribute('data-renderer', 'webgl');
  const originalMoon = await moon.boundingBox();
  const originalTitle = await title.boundingBox();
  const viewport = page.viewportSize()!;
  const originalSky = await sky.boundingBox();
  expect(originalSky?.y).toBe(0);
  expect(originalSky?.height).toBe(viewport.height);

  await page.evaluate(() => window.scrollTo(0, 150));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(150);
  const movedMoon = await moon.boundingBox();
  const movedTitle = await title.boundingBox();
  expect(movedMoon!.y).toBeCloseTo(originalMoon!.y - 150, 0);
  expect(movedTitle!.y).toBeCloseTo(originalTitle!.y - 150, 0);
  expect(await sky.boundingBox()).toEqual(originalSky);
  const header = await page.locator('.site-header').boundingBox();
  expect(header!.y + header!.height).toBeLessThan(0);

  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await expect(sky).toHaveAttribute('data-state', 'reading');
  await expect(moon.locator('[data-intro]')).toHaveJSProperty('paused', true);
  const videoTime = await moon
    .locator('[data-intro]')
    .evaluate((el) => (el as HTMLVideoElement).currentTime);
  const finalMoon = await moon.boundingBox();
  expect(finalMoon!.y + finalMoon!.height).toBeLessThan(0);
  await expect(title).not.toBeInViewport();

  // Isolate the atmosphere to verify that the lit clouds still animate below
  // the programme sheet, even though the eclipse's media clock is paused.
  await page.addStyleTag({
    content:
      '.reading-panel, .site-footer, .back-to-top { visibility: hidden !important; }',
  });
  const before = await sky.screenshot({ scale: 'css' });
  await page.waitForTimeout(1200);
  const after = await sky.screenshot({ scale: 'css' });
  const a = await sharp(before).resize(120, 120).removeAlpha().raw().toBuffer();
  const b = await sharp(after).resize(120, 120).removeAlpha().raw().toBuffer();
  const change =
    a.reduce((sum, value, i) => sum + Math.abs(value - b[i]!), 0) / a.length;
  expect(change).toBeGreaterThan(0.15);
  expect(
    await moon
      .locator('[data-intro]')
      .evaluate((el) => (el as HTMLVideoElement).currentTime),
  ).toBe(videoTime);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(sky).toHaveAttribute('data-state', 'revealing');
  await expect
    .poll(() =>
      moon
        .locator('[data-intro]')
        .evaluate((el) => (el as HTMLVideoElement).currentTime),
    )
    .toBeGreaterThan(videoTime);
});

test('scrolls the cover bank and foreground mist with the eclipse', async ({
  page,
}) => {
  test.skip(test.info().project.name !== 'desktop-chromium');
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.addInitScript(() => {
    for (const type of [WebGLRenderingContext, WebGL2RenderingContext]) {
      const original = type.prototype.shaderSource;
      type.prototype.shaderSource = function (shader, source) {
        source = source
          .replace('uniform float time;', 'const float time = 5.0;')
          .replace('uniform float dawn;', 'const float dawn = 1.0;')
          .replace(
            'uniform float titleEnergy;',
            'const float titleEnergy = 0.0;',
          );
        original.call(this, shader, source);
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
      '.site-header,.dawn-sky__eclipse,.home-hero__content,.reading-panel,.site-footer,.back-to-top {visibility:hidden!important;}',
  });
  const capture = async (top: number) => {
    await page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), top);
    await page.waitForTimeout(180);
    return page.screenshot({ scale: 'css' });
  };
  const before = await capture(0);
  const after = await capture(180);
  // Compare the same actual cover patch after document translation. This
  // includes the light and foreground veil, not just a density diagnostic.
  const a = await sharp(before)
    .extract({ left: 0, top: 370, width: 1440, height: 280 })
    .removeAlpha()
    .raw()
    .toBuffer();
  const b = await sharp(after)
    .extract({ left: 0, top: 190, width: 1440, height: 280 })
    .removeAlpha()
    .raw()
    .toBuffer();
  expect(a.reduce((sum, value) => sum + value, 0)).toBeGreaterThan(1_000_000);
  const difference =
    a.reduce((sum, value, i) => sum + Math.abs(value - b[i]!), 0) / a.length;
  expect(difference).toBeLessThan(1.2);
});

test('uses a static composition for reduced motion without loading the renderer', async ({
  page,
}) => {
  const resources: string[] = [];
  page.on('request', (request) => resources.push(request.url()));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('dawn-sky')).toHaveAttribute('data-state', 'still');
  await expect(page.locator('.home-hero__dawn')).toHaveCSS('opacity', '1');
  await expect(page.locator('.dawn-sky__still img')).toBeVisible();
  await expect(page.locator('.dawn-sky__foreground')).toHaveCSS('opacity', '0');
  expect(resources.some((url) => /dawn-sky-renderer|\.mp4/.test(url))).toBe(
    false,
  );
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('dawn-sky')).toHaveAttribute(
    'data-renderer',
    'webgl',
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('dawn-sky')).toHaveAttribute('data-state', 'still');
  await expect(page.locator('.dawn-sky__foreground')).toHaveCSS('opacity', '0');
});

test('falls back cleanly when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === 'webgl' || type === 'webgl2') return null;
      return Reflect.apply(getContext, this, [type, ...args]);
    } as typeof getContext;
  });
  await page.goto('/');
  await expect(page.locator('dawn-sky')).toHaveAttribute('data-state', 'still');
  await expect(page.locator('.dawn-sky__still img')).toBeVisible();
  await expect(page.locator('.dawn-sky__foreground')).toHaveCSS('opacity', '0');
});

test('preserves the seven pamphlet links and anchored navigation', async ({
  page,
}) => {
  await page.goto('/');
  const contents = page.getByRole('navigation', { name: '팜플렛 목차' });
  await expect(contents.getByRole('link')).toHaveCount(7);
  await contents
    .getByRole('link', { name: '예상 셋리스트', exact: true })
    .click();
  await expect(page).toHaveURL(/#setlist$/);
  await expect(page.locator('#setlist')).toBeInViewport();
});

test('retains the illustrated background without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('.dawn-sky__still img')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'AFTER HOURS TIL DAWN',
  );
  await expect(page.locator('.home-hero__dawn')).toHaveCSS('opacity', '1');
  await context.close();
});
