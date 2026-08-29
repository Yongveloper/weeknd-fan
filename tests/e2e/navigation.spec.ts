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

test('shows six predicted titles before the complete collapsed list', async ({
  page,
}) => {
  await page.goto('/');

  const preview = page.locator('.setlist-preview');
  await expect(preview.locator('> .shell-content > ol > li')).toHaveText([
    'Baptized in Fear',
    'Open Hearts',
    'Wake Me Up',
    'After Hours',
    'Starboy',
    'Heartless',
  ]);

  const disclosure = page.getByRole('group', { name: '전체 예상 셋리스트' });
  await expect(disclosure).not.toHaveAttribute('open', '');
  await expect(disclosure.locator('li')).toHaveCount(32);
  await expect(preview.getByText('예상 · 보장 아님')).toBeVisible();
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

test('distinguishes the six studio albums from both trilogies', async ({
  page,
}) => {
  await page.goto('/discover/');

  await expect(
    page.getByRole('heading', { name: '정규 앨범 6장' }),
  ).toBeVisible();
  await expect(
    page.getByText('House of Balloons → Thursday → Echoes of Silence'),
  ).toBeVisible();
  await expect(
    page.getByText('After Hours → Dawn FM → Hurry Up Tomorrow'),
  ).toBeVisible();
  await expect(page.getByText('한 가지 해석')).toBeVisible();
});

test('shows checked primary sources when discover disclosures open', async ({
  page,
}) => {
  await page.goto('/discover/');

  const intro = page.getByRole('group', { name: '1분 입문 더 깊이 보기' });
  await intro.locator('summary').click();
  await expect(
    intro.getByRole('link', {
      name: 'Universal Music Canada — Kiss Land 발표',
    }),
  ).toHaveAttribute(
    'href',
    'https://www.universalmusic.ca/press-releases/the-weeknds-kiss-land-to-arrive-september-10/',
  );
  await expect(intro.getByText('마지막 확인 2026.08.29').first()).toBeVisible();

  const kissLand = page.getByRole('group', {
    name: '2013 · Kiss Land 더 깊이 보기',
  });
  await kissLand.locator('summary').click();
  await expect(
    kissLand.getByRole('link', {
      name: 'Universal Music Canada — Kiss Land 발표',
    }),
  ).toBeVisible();
});
