import { expect, test } from '@playwright/test';

const TEXTURE = '/visual/atmosphere/golden-cloud-bank-v3.webp';
const COVER_CDN = 'https://image-cdn-ak.spotifycdn.com';

for (const route of ['/', '/discover/', '/setlist/', '/goyang/']) {
  test(`${route} preloads the sky texture and marks it high priority`, async ({
    page,
  }) => {
    await page.goto(route);
    const preload = page.locator('head link[rel="preload"][as="image"]');
    await expect(preload).toHaveCount(1);
    await expect(preload).toHaveAttribute('href', TEXTURE);
    await expect(preload).toHaveAttribute('fetchpriority', 'high');
    await expect(
      page.locator('dawn-sky .dawn-sky__still img').first(),
    ).toHaveAttribute('fetchpriority', 'high');
  });
}

test('/sources/ has no sky texture to preload', async ({ page }) => {
  await page.goto('/sources/');
  await expect(
    page.locator('head link[rel="preload"][as="image"]'),
  ).toHaveCount(0);
});

for (const route of ['/', '/discover/']) {
  test(`${route} preconnects to the album cover CDN`, async ({ page }) => {
    await page.goto(route);
    await expect(
      page.locator(`head link[rel="preconnect"][href="${COVER_CDN}"]`),
    ).toHaveCount(1);
  });
}

test('/goyang/ does not preconnect to the album cover CDN', async ({
  page,
}) => {
  await page.goto('/goyang/');
  await expect(page.locator('head link[rel="preconnect"]')).toHaveCount(0);
});
