import { expect, test } from '@playwright/test';

test('shows an accessible top button after one viewport and returns focus to main at the document top', async ({
  page,
}) => {
  await page.goto('/goyang/');

  const topButton = page.getByRole('button', { name: '맨 위로 이동' });
  await expect(topButton).toBeHidden();

  await page.evaluate(() => scrollTo(0, innerHeight + 1));
  await expect(topButton).toBeVisible();
  expect(
    await topButton.evaluate((el) => el.getBoundingClientRect().width),
  ).toBe(48);
  expect(
    await topButton.evaluate((el) => el.getBoundingClientRect().height),
  ).toBe(48);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);

  await topButton.click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(page.locator('main')).toBeFocused();
  await expect(topButton).toBeHidden();
});

test('returns to the top immediately when reduced motion is requested', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/goyang/');

  const topButton = page.getByRole('button', { name: '맨 위로 이동' });
  await page.evaluate(() => scrollTo(0, innerHeight + 1));
  await expect(topButton).toBeVisible();

  await topButton.click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

test('continues to work after navigating to another route', async ({
  page,
}) => {
  await page.goto('/');
  const navigation = page.getByRole('navigation', { name: '주요 메뉴' });
  const menu = navigation.getByText('메뉴');
  if (await menu.isVisible()) await menu.click();
  await navigation.getByRole('link', { name: '고양 가이드' }).click();
  await expect(page).toHaveURL(/\/goyang\/$/);

  const topButton = page.getByRole('button', { name: '맨 위로 이동' });
  await page.evaluate(() => scrollTo(0, innerHeight + 1));
  await expect(topButton).toBeVisible();
  await topButton.click();

  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(page.locator('main')).toBeFocused();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('keeps the top button absent', async ({ page }) => {
    await page.goto('/goyang/');
    await expect(
      page.getByRole('button', { name: '맨 위로 이동' }),
    ).toBeHidden();
  });
});
