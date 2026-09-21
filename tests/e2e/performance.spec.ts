import { expect, test } from '@playwright/test';

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
