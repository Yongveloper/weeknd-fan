import { expect, test } from '@playwright/test';

test('hides data-enter elements until they scroll into view, then reveals them once', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-motion-ready', 'true');

  const fanNote = page.locator('.fan-note');
  await expect(fanNote).toHaveAttribute('data-enter', '');
  expect(await fanNote.evaluate((el) => getComputedStyle(el).opacity)).toBe('0');

  await fanNote.scrollIntoViewIfNeeded();
  await expect(fanNote).toHaveAttribute('data-enter', 'in');
  await expect
    .poll(() => fanNote.evaluate((el) => getComputedStyle(el).opacity))
    .toBe('1');
});

test('shows everything immediately under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForTimeout(300);
  await expect(page.locator('html')).not.toHaveAttribute('data-motion-ready', /.+/);
  expect(
    await page.locator('.fan-note').evaluate((el) => getComputedStyle(el).opacity),
  ).toBe('1');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('never hides data-enter content', async ({ page }) => {
    await page.goto('/');
    const fanNote = page.locator('.fan-note');
    await expect(fanNote).toBeVisible();
    expect(await fanNote.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  });
});

test('marks every page motion-ready, not just home', async ({ page }) => {
  await page.goto('/discover/');
  await expect(page.locator('html')).toHaveAttribute('data-motion-ready', 'true');
});
