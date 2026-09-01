import { expect, test } from '@playwright/test';

test('flows from the hero through the artist intro and setlist before practical guidance', async ({
  page,
}) => {
  await page.goto('/');

  const sectionLabels = await page
    .locator('main > section')
    .evaluateAll((sections) =>
      sections.map((section) => section.getAttribute('aria-labelledby')),
    );

  expect(sectionLabels).toEqual([
    'home-title',
    'intro-title',
    'setlist-preview-title',
    'guide-shortcuts-title',
    'fan-note-title',
  ]);
});

test('hero intro link targets the rendered artist introduction', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: /3분 만에 The Weeknd 알기/ }).click();

  await expect(page).toHaveURL(/#intro$/);
  const target = page.locator('section:target');
  await expect(target).toHaveAttribute('id', 'intro');
  await expect(
    target.getByRole('heading', { name: '3분 만에 The Weeknd 알기' }),
  ).toBeVisible();
});
