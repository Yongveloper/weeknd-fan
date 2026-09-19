import { expect, test } from '@playwright/test';

const FULL_INTRO = '/visual/moon-v8/intro.mp4';
const COMPACT_INTRO = '/visual/moon-v8/intro-720.mp4';

function mockConnection(saveData: boolean, effectiveType: string) {
  return `Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: { saveData: ${saveData}, effectiveType: ${JSON.stringify(effectiveType)} },
  });`;
}

test('streams the compact intro at or below 42rem and the full intro above', async ({
  page,
}) => {
  await page.goto('/');
  const moon = page.locator('moon-light');
  const compact = (page.viewportSize()?.width ?? 0) <= 672;
  await expect(moon).toHaveAttribute(
    'data-variant',
    compact ? 'compact' : 'full',
  );
  await expect(moon).toHaveAttribute('data-phase', 'intro');
  await expect(moon.locator('[data-intro] source')).toHaveAttribute(
    'src',
    compact ? COMPACT_INTRO : FULL_INTRO,
  );
});

test('keeps the poster and downloads no video when the browser saves data', async ({
  page,
}) => {
  await page.addInitScript(mockConnection(true, '4g'));
  await page.goto('/');
  const moon = page.locator('moon-light');
  await expect(moon).toHaveAttribute('data-variant', 'none');
  await expect(moon).toHaveAttribute('data-phase', 'poster');
  await expect(page.locator('.home-hero')).toHaveAttribute(
    'data-title-phase',
    'static',
  );
  await expect(moon.locator('[data-intro] source')).not.toHaveAttribute(
    'src',
    /.+/,
  );
  await page.waitForTimeout(500);
  const videoRequests = await page.evaluate(
    () =>
      performance
        .getEntriesByType('resource')
        .filter((entry) => entry.name.endsWith('.mp4')).length,
  );
  expect(videoRequests).toBe(0);
});

test('treats a 3g connection like save-data', async ({ page }) => {
  await page.addInitScript(mockConnection(false, '3g'));
  await page.goto('/');
  await expect(page.locator('moon-light')).toHaveAttribute(
    'data-variant',
    'none',
  );
  await expect(page.locator('moon-light')).toHaveAttribute(
    'data-phase',
    'poster',
  );
});
