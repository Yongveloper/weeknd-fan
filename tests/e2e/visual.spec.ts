import { expect, test } from '@playwright/test';

async function useClock(page: import('@playwright/test').Page, now: string) {
  await page.addInitScript((timestamp) => {
    const NativeDate = Date;

    class ControlledDate extends NativeDate {
      constructor(...args: [] | [string | number]) {
        if (args.length === 0) {
          super(timestamp);
          return;
        }

        super(args[0]);
      }

      static now() {
        return timestamp;
      }
    }

    window.Date = ControlledDate as DateConstructor;
  }, new Date(now).getTime());
}

test('renders Eclipse Count inside the retained moon scene', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.locator('eclipse-countdown')).toBeVisible();
  await expect(page.locator('[data-primary]')).toContainText(
    /^D-|TONIGHT|WE WERE HERE/,
  );
});

test('reduced motion leaves the moon readable without a running animation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  await expect(page.locator('eclipse-countdown')).toHaveAttribute(
    'data-motion-state',
    'reduced',
  );
  await expect(page.locator('[data-primary]')).toBeVisible();
});

test('synchronizes stale server countdown markup and keeps polling under reduced motion', async ({
  page,
}) => {
  await useClock(page, '2026-10-07T19:40:00+09:00');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('[data-primary]')).toHaveText('D-DAY');
  await expect(page.locator('[data-clock]')).toBeVisible();
  await expect(page.locator('[data-accessible-countdown]')).toHaveText(
    /고양 공연까지 0일/,
  );
});

test('synchronizes stale server countdown markup before normal-motion transitions', async ({
  page,
}) => {
  await useClock(page, '2026-10-07T19:40:00+09:00');
  await page.goto('/');
  await expect(page.locator('[data-primary]')).toHaveText('D-DAY');
  await expect(page.locator('[data-accessible-countdown]')).toHaveText(
    /고양 공연까지 0일/,
  );
  await expect(page.locator('[data-clock]')).toHaveText('00 : 05 : 00');
});

test('updates the reduced-motion target after day one and clears polling on disconnect', async ({
  page,
}) => {
  await page.addInitScript(() => {
    let now = new Date('2026-10-07T19:44:00+09:00').getTime();
    const NativeDate = Date;
    class ControlledDate extends NativeDate {
      constructor(...args: [] | [string | number]) {
        super(args.length === 0 ? now : args[0]);
      }
      static now() {
        return now;
      }
    }
    window.Date = ControlledDate as DateConstructor;
    Object.assign(window, {
      __setCountdownTime: (next: string) =>
        (now = new NativeDate(next).getTime()),
    });
    const nativeClearInterval = window.clearInterval;
    let cleared = 0;
    window.clearInterval = ((id: number) => {
      cleared += 1;
      nativeClearInterval(id);
    }) as typeof window.clearInterval;
    Object.assign(window, { __countdownIntervalsCleared: () => cleared });
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('[data-primary]')).toHaveText('D-DAY');
  await page.evaluate(() =>
    (
      window as typeof window & { __setCountdownTime: (time: string) => void }
    ).__setCountdownTime('2026-10-07T20:00:00+09:00'),
  );
  await expect(page.locator('[data-primary]')).toHaveText('D-1');
  await expect(page.locator('[data-accessible-countdown]')).toHaveText(
    /고양 공연까지 1일/,
  );
  await page
    .locator('eclipse-countdown')
    .evaluate((element) => element.remove());
  await expect
    .poll(() =>
      page.evaluate(() =>
        (
          window as typeof window & {
            __countdownIntervalsCleared: () => number;
          }
        ).__countdownIntervalsCleared(),
      ),
    )
    .toBeGreaterThan(0);
});

test('reduced motion does not load the deferred Motion chunk', async ({
  page,
}) => {
  const requestedUrls: string[] = [];
  page.on('request', (request) => requestedUrls.push(request.url()));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForTimeout(750);

  expect(
    requestedUrls.some((url) => /\/_astro\/index\.[\w-]+\.js$/.test(url)),
  ).toBe(false);
});

test('records 390 by 844 home transfer, layout-shift, and long-task evidence', async ({
  page,
}, testInfo) => {
  test.skip(
    test.info().project.name !== 'mobile-chromium',
    'The required mobile performance evidence uses a 390 by 844 viewport.',
  );

  await page.setViewportSize({ width: 390, height: 844 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await page.addInitScript(() => {
    const evidence = {
      cls: 0,
      longTasks: [] as number[],
    };
    Object.defineProperty(window, '__performanceEvidence', {
      value: evidence,
      configurable: true,
    });
    new PerformanceObserver((entries) => {
      for (const entry of entries.getEntries() as PerformanceEntryList) {
        const layoutShift = entry as PerformanceEntry & {
          hadRecentInput?: boolean;
          value?: number;
        };
        if (!layoutShift.hadRecentInput) evidence.cls += layoutShift.value ?? 0;
      }
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((entries) => {
      evidence.longTasks.push(
        ...entries.getEntries().map((entry) => entry.duration),
      );
    }).observe({ type: 'longtask', buffered: true });
  });
  await page.goto('/');
  await page.waitForTimeout(900);
  await page.mouse.wheel(0, 500);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);

  const evidence = await page.evaluate(() => {
    const resources = performance.getEntriesByType(
      'resource',
    ) as PerformanceResourceTiming[];
    const bytesFor = (pattern: RegExp) =>
      resources
        .filter((resource) => pattern.test(resource.name))
        .reduce((sum, resource) => sum + resource.transferSize, 0);
    return {
      ...(
        window as typeof window & {
          __performanceEvidence: { cls: number; longTasks: number[] };
        }
      ).__performanceEvidence,
      rasterBytes: bytesFor(/\.(?:avif|webp|png|jpe?g)(?:\?|$)/i),
      javascriptBytes: bytesFor(/\.js(?:\?|$)/i),
    };
  });
  await testInfo.attach('home-390x844-performance.json', {
    body: JSON.stringify(evidence, null, 2),
    contentType: 'application/json',
  });

  expect(evidence.rasterBytes).toBeLessThanOrEqual(700 * 1024);
  expect(evidence.javascriptBytes).toBeLessThanOrEqual(75 * 1024);
  expect(evidence.cls).toBeLessThan(0.1);
  expect(evidence.longTasks.every((duration) => duration <= 50)).toBe(true);
});

test('keeps the near-term clock inside the mobile hero and viewport', async ({
  page,
}) => {
  test.skip(
    test.info().project.name !== 'mobile-chromium',
    'This viewport-bound layout regression is mobile-specific.',
  );
  await useClock(page, '2026-10-07T19:40:00+09:00');
  await page.goto('/');

  const clock = page.locator('[data-clock]');
  const hero = page.locator('[data-home-hero]');
  await expect(clock).toBeVisible();

  const [clockBox, heroBox] = await Promise.all([
    clock.boundingBox(),
    hero.boundingBox(),
  ]);
  const viewport = page.viewportSize();

  expect(clockBox).not.toBeNull();
  expect(heroBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(clockBox!.y).toBeGreaterThanOrEqual(heroBox!.y);
  expect(clockBox!.y + clockBox!.height).toBeLessThanOrEqual(
    heroBox!.y + heroBox!.height,
  );
  expect(clockBox!.y + clockBox!.height).toBeLessThanOrEqual(viewport!.height);
});

test('serves every home-scene image as AVIF and WebP derivatives', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.locator('picture source[type="image/avif"]')).toHaveCount(
    3,
  );
  await expect(page.locator('picture source[type="image/webp"]')).toHaveCount(
    3,
  );
});

test('selects native-capped moon and cover fog candidates on Pixel 7', async ({
  page,
}) => {
  test.skip(
    test.info().project.name !== 'mobile-chromium',
    'The source selection contract is specific to the Pixel 7 DPR.',
  );
  await page.goto('/');

  await expect(
    page
      .locator('[data-moon-art]')
      .evaluate((image) => (image as HTMLImageElement).currentSrc),
  ).resolves.toMatch(/moon-960\.avif$/);
  await expect(
    page
      .locator('.home-hero__fog--night')
      .evaluate((image) => (image as HTMLImageElement).currentSrc),
  ).resolves.toMatch(/fog-night-1536\.avif$/);
  await expect(
    page
      .locator('.home-hero__fog--dawn')
      .evaluate((image) => (image as HTMLImageElement).currentSrc),
  ).resolves.toMatch(/fog-dawn-1536\.avif$/);
});

test('keeps the hero title on two lines and renders Korean headings in Noto Sans KR', async ({
  page,
}) => {
  await page.goto('/');

  const metrics = await page.evaluate(async () => {
    await document.fonts.ready;

    const lineCount = (element: Element) => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) =>
          (node.textContent ?? '').trim().length > 0
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP,
      });
      const tops = new Set<number>();
      let node = walker.nextNode();
      while (node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const rect of Array.from(range.getClientRects())) {
          tops.add(Math.round(rect.top));
        }
        node = walker.nextNode();
      }
      return tops.size;
    };

    const h1 = document.querySelector('h1')!;
    const intro = document.getElementById('intro-title')!;
    const introStyle = getComputedStyle(intro);
    const spanRights = Array.from(h1.querySelectorAll('span')).map(
      (span) => span.getBoundingClientRect().right,
    );

    return {
      heroLines: lineCount(h1),
      heroScrollWidth: h1.scrollWidth,
      heroClientWidth: h1.clientWidth,
      spanRights,
      viewportWidth: window.innerWidth,
      introFont: introStyle.fontFamily,
      introWeight: introStyle.fontWeight,
      introLineHeight:
        parseFloat(introStyle.lineHeight) / parseFloat(introStyle.fontSize),
    };
  });

  expect(metrics.heroLines).toBe(2);
  expect(metrics.heroScrollWidth).toBeLessThanOrEqual(metrics.heroClientWidth);
  for (const right of metrics.spanRights) {
    expect(right).toBeLessThanOrEqual(metrics.viewportWidth);
  }
  expect(metrics.introFont).toMatch(/Noto Sans KR/);
  expect(metrics.introWeight).toBe('900');
  expect(metrics.introLineHeight).toBeGreaterThan(1);
});

test('turns the fixed sky from night to dawn as the home page scrolls', async ({
  page,
}) => {
  await page.goto('/');
  const sky = page.locator('.dawn-sky');
  await expect(sky).toHaveAttribute('aria-hidden', 'true');

  const supportsScrollTimeline = await page.evaluate(() =>
    CSS.supports('animation-timeline: scroll()'),
  );
  test.skip(!supportsScrollTimeline, 'static fallback browser');

  const sample = () =>
    page.evaluate(() => {
      const element = document.querySelector('.dawn-sky')!;
      return getComputedStyle(element).backgroundColor;
    });
  const top = await sample();
  await page.evaluate(() =>
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'instant',
    }),
  );

  await expect
    .poll(async () => {
      const [r = 0, , b = 0] = (await sample()).match(/\d+/g)!.map(Number);
      return r > b;
    })
    .toBe(true);

  const bottom = await sample();
  expect(top).not.toBe(bottom);
});

test('keeps every home section transparent so the sky shows through', async ({
  page,
}) => {
  await page.goto('/');
  const opaqueSections = await page.evaluate(
    () =>
      Array.from(document.querySelectorAll('main > section')).filter(
        (section) => {
          const { backgroundColor, backgroundImage } =
            getComputedStyle(section);
          return (
            backgroundImage !== 'none' ||
            !/rgba\(0, 0, 0, 0\)|transparent/.test(backgroundColor)
          );
        },
      ).length,
  );
  expect(opaqueSections).toBe(0);
});
