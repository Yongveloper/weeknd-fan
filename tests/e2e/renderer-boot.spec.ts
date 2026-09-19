import { expect, test } from '@playwright/test';

test('boots the WebGL renderer only after the load event and the LCP texture', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('dawn-sky')).toHaveAttribute(
    'data-renderer',
    'webgl',
  );
  const timing = await page.evaluate(() => {
    const [navigation] = performance.getEntriesByType(
      'navigation',
    ) as PerformanceNavigationTiming[];
    const resources = performance.getEntriesByType(
      'resource',
    ) as PerformanceResourceTiming[];
    const renderer = resources.find((entry) =>
      /dawn-sky-renderer\.[\w-]+\.js$/.test(entry.name),
    );
    const texture = resources.find((entry) =>
      entry.name.endsWith('/visual/atmosphere/golden-cloud-bank-v3.webp'),
    );
    return {
      loadEventStart: navigation?.loadEventStart ?? Number.NaN,
      rendererFetchStart: renderer?.fetchStart ?? Number.NaN,
      textureResponseEnd: texture?.responseEnd ?? Number.NaN,
    };
  });
  expect(timing.rendererFetchStart).toBeGreaterThanOrEqual(
    timing.loadEventStart,
  );
  expect(timing.rendererFetchStart).toBeGreaterThanOrEqual(
    timing.textureResponseEnd,
  );
});
