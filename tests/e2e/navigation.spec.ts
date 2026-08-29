import { expect, test } from '@playwright/test';

test('serves the Korean fan-guide shell', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/The Weeknd 고양 팬 가이드/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'AFTER HOURS TIL DAWN',
  );
});

test('exposes navigation and the unofficial disclaimer', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('navigation', { name: '주요 메뉴' }),
  ).toBeVisible();
  await expect(
    page.getByText('비공식·비영리 팬 가이드', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: '예상 셋리스트' }),
  ).toHaveAttribute('href', '/setlist/');
  await expect(page.getByRole('link', { name: '고양 가이드' })).toHaveAttribute(
    'href',
    '/goyang/',
  );
});

test('keeps navigation targets touch-sized in every viewport', async ({
  page,
}) => {
  await page.goto('/');

  for (const link of await page
    .getByRole('navigation', { name: '주요 메뉴' })
    .getByRole('link')
    .all()) {
    const box = await link.boundingBox();
    expect(box, `missing box for ${await link.textContent()}`).not.toBeNull();
    expect(
      box?.width,
      `narrow target for ${await link.textContent()}`,
    ).toBeGreaterThanOrEqual(44);
    expect(
      box?.height,
      `short target for ${await link.textContent()}`,
    ).toBeGreaterThanOrEqual(44);
  }
});
