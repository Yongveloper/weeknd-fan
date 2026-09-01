import { expect, test } from '@playwright/test';

test.use({ javaScriptEnabled: false });

test('keeps home venue facts readable without JavaScript', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('고양종합운동장 주경기장')).toBeVisible();
});

test('keeps every primary route visible and keyboard reachable on a narrow screen without JavaScript', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');

  const nav = page.getByRole('navigation', { name: '주요 메뉴' });
  const links = nav.getByRole('link');
  await expect(links).toHaveCount(5);
  for (const link of await links.all()) {
    await expect(link).toBeVisible();
  }
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth + 1,
    ),
  ).toBe(true);

  const expectedHrefs = [
    '/',
    '/discover/',
    '/setlist/',
    '/goyang/',
    '/sources/',
  ];
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: '본문으로 건너뛰기' }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'The Weeknd 고양 팬 가이드 홈' }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('group', { name: '주요 메뉴' }).getByText('메뉴'),
  ).toBeFocused();
  for (const [index, href] of expectedHrefs.entries()) {
    await page.keyboard.press('Tab');
    await expect(links.nth(index)).toHaveAttribute('href', href);
    await expect(links.nth(index)).toBeFocused();
  }
});

test('keeps the expected-setlist label and native details readable without JavaScript', async ({
  page,
}) => {
  await page.goto('/setlist/');

  await expect(page.getByText('예상 · 보장 아님').first()).toBeVisible();
  await expect(page.locator('.expected-setlist details')).toHaveCount(38);
  await expect(page.locator('.expected-setlist details').first()).toBeVisible();
});

test('keeps Goyang transport and pending guidance readable without JavaScript', async ({
  page,
}) => {
  await page.goto('/goyang/');

  const overview = page.getByRole('navigation', { name: '당일 행동 요약' });
  await expect(overview.getByRole('link')).toHaveCount(4);
  await expect(overview.getByRole('link', { name: '가는 길' })).toHaveAttribute(
    'href',
    '#transport',
  );
  await expect(page.getByRole('heading', { name: '가는 길' })).toBeVisible();
  await expect(page.getByText('아직 발표되지 않은 운영 정보')).toBeVisible();
  const pendingItems = page.locator('#pending .pending-list li');
  await expect(pendingItems).toHaveCount(6);
  await expect(pendingItems.locator('strong')).toHaveText([
    '입장 게이트',
    '반입 금지 물품',
    '교통 통제',
    '순환버스 세부 운영',
    '접근성 지원',
    '스탠딩·Early Entry 운영',
  ]);
  for (const item of await pendingItems.all()) await expect(item).toBeVisible();
  await expect(page.locator('#pending .pending-list')).not.toContainText(
    '셔틀·교통 통제',
  );
});

test('keeps Discover summaries and sources readable without JavaScript', async ({
  page,
}) => {
  await page.goto('/discover/');

  const disclosure = page.getByRole('group', { name: '1분 입문 더 깊이 보기' });
  await expect(disclosure.getByText('1분 입문 펼쳐보기')).toBeVisible();
  await expect(disclosure).toHaveAttribute('open', '');
  await expect(
    disclosure.getByRole('link', { name: /Universal Music Canada/ }).first(),
  ).toBeVisible();
});
