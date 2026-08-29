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
