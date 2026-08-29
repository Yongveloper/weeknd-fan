import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const publicRoutes = [
  '/',
  '/discover/',
  '/setlist/',
  '/goyang/',
  '/sources/',
  '/share/ticket/',
  '/share/setlist/',
] as const;

for (const route of publicRoutes) {
  test(`${route} has no serious or critical axe violations`, async ({
    page,
  }) => {
    await page.goto(route);

    const result = await new AxeBuilder({ page }).analyze();
    const blockingViolations = result.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    );

    expect(blockingViolations).toEqual([]);
  });

  test(`${route} has no autoplaying video`, async ({ page }) => {
    await page.goto(route);

    await expect(page.locator('video[autoplay]')).toHaveCount(0);
  });
}

test('moves focus to main content when the skip link is activated', async ({
  page,
}) => {
  await page.goto('/');

  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: '본문으로 건너뛰기' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.locator('main')).toBeFocused();
});

test('opens the first expected-song disclosure from the keyboard', async ({
  page,
}) => {
  await page.goto('/setlist/');

  const firstSong = page.locator('.expected-setlist summary').first();
  await firstSong.focus();
  await page.keyboard.press('Space');

  await expect(
    page.locator('.expected-setlist details').first(),
  ).toHaveAttribute('open', '');
});

test('keeps official media embeds absent until a user requests one', async ({
  page,
}) => {
  await page.goto('/setlist/');

  await expect(page.locator('official-embed iframe')).toHaveCount(0);
});
