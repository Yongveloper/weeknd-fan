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

test('shows concert facts and four lightweight entry blocks', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByText('2026.10.07—08')).toBeVisible();
  await expect(page.getByText('고양종합운동장 주경기장')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '3분 만에 The Weeknd 알기' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '예상 셋리스트' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '고양 가이드' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '팬의 한마디' }),
  ).toBeVisible();
});

test('keeps the complete predicted list collapsed by default', async ({
  page,
}) => {
  await page.goto('/');

  const disclosure = page.getByRole('group', { name: '전체 예상 셋리스트' });
  await expect(disclosure).not.toHaveAttribute('open', '');
  await expect(page.getByText('예상 · 보장 아님').first()).toBeVisible();
});

test('links each Goyang shortcut to its stable guide anchor', async ({
  page,
}) => {
  await page.goto('/');

  const shortcuts = page.getByRole('navigation', {
    name: '고양 가이드 바로가기',
  });
  await expect(
    shortcuts.getByRole('link', { name: '가는 길' }),
  ).toHaveAttribute('href', '/goyang/#transport');
  await expect(shortcuts.getByRole('link', { name: '준비물' })).toHaveAttribute(
    'href',
    '/goyang/#packing',
  );
  await expect(
    shortcuts.getByRole('link', { name: '귀가 확인' }),
  ).toHaveAttribute('href', '/goyang/#return');
});
