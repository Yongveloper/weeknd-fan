import { expect, test } from '@playwright/test';

test('renders Eclipse Count inside the retained moon scene', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.locator('eclipse-countdown')).toBeVisible();
  await expect(page.locator('[data-primary]')).toContainText(
    /^D-|TONIGHT|WE WERE HERE/,
  );
});

test('reduced motion leaves the moon readable without a running animation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  await expect(page.locator('eclipse-countdown')).toHaveAttribute(
    'data-motion-state',
    'reduced',
  );
  await expect(page.locator('[data-primary]')).toBeVisible();
});
