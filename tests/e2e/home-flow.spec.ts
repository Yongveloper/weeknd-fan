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

test('aligns the Goyang guide heading with home section geometry', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');

  const desktop = await page
    .locator('.guide-shortcuts__inner')
    .evaluate((inner) => {
      const heading = inner.querySelector<HTMLElement>(
        '.guide-shortcuts__heading',
      );
      const nav = inner.querySelector<HTMLElement>('nav');
      if (!heading || !nav) throw new Error('missing home section geometry');
      const innerRect = inner.getBoundingClientRect();
      const headingRect = heading.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();
      return {
        headingLeft: headingRect.left,
        headingTop: headingRect.top,
        innerLeft: innerRect.left,
        navTop: navRect.top,
      };
    });
  expect(Math.abs(desktop.headingTop - desktop.navTop)).toBeLessThanOrEqual(1);
  expect(Math.abs(desktop.headingLeft - desktop.innerLeft)).toBeLessThanOrEqual(
    1,
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const mobile = await page
    .locator('.guide-shortcuts__inner')
    .evaluate((inner) => {
      const heading = inner.querySelector<HTMLElement>(':scope > div');
      const nav = inner.querySelector<HTMLElement>('nav');
      if (!heading || !nav) throw new Error('missing Goyang guide geometry');
      const innerRect = inner.getBoundingClientRect();
      const headingRect = heading.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();
      return {
        documentOverflow:
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
        headingBottom: headingRect.bottom,
        headingLeft: headingRect.left,
        innerLeft: innerRect.left,
        navTop: navRect.top,
      };
    });
  expect(Math.abs(mobile.headingLeft - mobile.innerLeft)).toBeLessThanOrEqual(
    1,
  );
  expect(mobile.headingBottom).toBeLessThanOrEqual(mobile.navTop);
  expect(mobile.documentOverflow).toBeLessThanOrEqual(1);
});
