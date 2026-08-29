import { expect, test } from '@playwright/test';

test.use({ javaScriptEnabled: false });

test('keeps home venue facts readable without JavaScript', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('고양종합운동장 주경기장')).toBeVisible();
});

test('keeps the expected-setlist label and native details readable without JavaScript', async ({
  page,
}) => {
  await page.goto('/setlist/');

  await expect(page.getByText('예상 · 보장 아님').first()).toBeVisible();
  await expect(page.locator('.expected-setlist details').first()).toBeVisible();
});

test('keeps Goyang transport and pending guidance readable without JavaScript', async ({
  page,
}) => {
  await page.goto('/goyang/');

  await expect(page.getByRole('heading', { name: '가는 길' })).toBeVisible();
  await expect(page.getByText('아직 발표되지 않은 운영 정보')).toBeVisible();
});

test('keeps Discover summaries and sources readable without JavaScript', async ({
  page,
}) => {
  await page.goto('/discover/');

  const disclosure = page.getByRole('group', { name: '1분 입문 더 깊이 보기' });
  await expect(disclosure.getByText('1분 입문 펼쳐보기')).toBeVisible();
  await disclosure.getByText('1분 입문 펼쳐보기').click();
  await expect(
    disclosure.getByRole('link', { name: /Universal Music Canada/ }).first(),
  ).toBeVisible();
});
