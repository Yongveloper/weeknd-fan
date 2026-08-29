import { expect, test } from '@playwright/test';

test('serves the Korean fan-guide shell', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/The Weeknd 고양 팬 가이드/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'AFTER HOURS TIL DAWN',
  );
});
