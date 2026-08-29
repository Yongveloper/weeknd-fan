import { expect, test } from '@playwright/test';

async function useClock(page: import('@playwright/test').Page, now: string) {
  await page.addInitScript((timestamp) => {
    const NativeDate = Date;

    class ControlledDate extends NativeDate {
      constructor(...args: [] | [string | number]) {
        if (args.length === 0) {
          super(timestamp);
          return;
        }

        super(args[0]);
      }

      static now() {
        return timestamp;
      }
    }

    window.Date = ControlledDate as DateConstructor;
  }, new Date(now).getTime());
}

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

test('keeps the near-term clock inside the mobile hero and viewport', async ({
  page,
}) => {
  test.skip(
    test.info().project.name !== 'mobile-chromium',
    'This viewport-bound layout regression is mobile-specific.',
  );
  await useClock(page, '2026-10-07T19:40:00+09:00');
  await page.goto('/');

  const clock = page.locator('[data-clock]');
  const hero = page.locator('[data-home-hero]');
  await expect(clock).toBeVisible();

  const [clockBox, heroBox] = await Promise.all([
    clock.boundingBox(),
    hero.boundingBox(),
  ]);
  const viewport = page.viewportSize();

  expect(clockBox).not.toBeNull();
  expect(heroBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(clockBox!.y).toBeGreaterThanOrEqual(heroBox!.y);
  expect(clockBox!.y + clockBox!.height).toBeLessThanOrEqual(
    heroBox!.y + heroBox!.height,
  );
  expect(clockBox!.y + clockBox!.height).toBeLessThanOrEqual(viewport!.height);
});

test('serves every home-scene image as AVIF and WebP derivatives', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.locator('picture source[type="image/avif"]')).toHaveCount(
    3,
  );
  await expect(page.locator('picture source[type="image/webp"]')).toHaveCount(
    3,
  );
});
