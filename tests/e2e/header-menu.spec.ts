import { expect, test } from '@playwright/test';

const mobileViewport = { width: 652, height: 526 };

function headerMenu(page: import('@playwright/test').Page) {
  const details = page.locator('.site-header details');
  return {
    details,
    icon: details.locator('.site-header__menu-icon'),
    panel: details.locator('.disclosure__panel'),
    summary: details.locator('summary'),
  };
}

test('opens a compact mobile overlay without moving the page', async ({
  page,
}) => {
  await page.setViewportSize(mobileViewport);
  await page.goto('/');

  const { details, icon, panel, summary } = headerMenu(page);
  const header = page.locator('.site-header');
  const wordmark = page.locator('.site-header__wordmark');
  const main = page.locator('main');

  await expect(summary).toHaveAttribute('aria-label', '메뉴');
  await expect(details).not.toHaveAttribute('open', '');
  await expect
    .poll(() => panel.evaluate((element) => element.clientHeight))
    .toBe(0);

  const [headerBox, wordmarkBox, summaryBox, mainBox] = await Promise.all([
    header.boundingBox(),
    wordmark.boundingBox(),
    summary.boundingBox(),
    main.boundingBox(),
  ]);
  expect(headerBox?.height).toBeLessThanOrEqual(76);
  expect(wordmarkBox?.y).toBeLessThan(
    (summaryBox?.y ?? 0) + (summaryBox?.height ?? 0),
  );
  expect(summaryBox?.y).toBeLessThan(
    (wordmarkBox?.y ?? 0) + (wordmarkBox?.height ?? 0),
  );

  const closedIcon = await icon.evaluate((element) =>
    Array.from(element.children, (bar) => getComputedStyle(bar).transform),
  );
  await summary.click();
  await expect(details).toHaveAttribute('data-state', 'open');
  await expect
    .poll(() => panel.evaluate((element) => element.clientHeight))
    .toBeGreaterThan(0);

  const [openMainBox, panelBox, openIcon] = await Promise.all([
    main.boundingBox(),
    panel.boundingBox(),
    icon.evaluate((element) =>
      Array.from(element.children, (bar) => getComputedStyle(bar).transform),
    ),
  ]);
  expect(openMainBox?.y).toBe(mainBox?.y);
  expect(panelBox?.y).toBeGreaterThanOrEqual(
    (headerBox?.y ?? 0) + (headerBox?.height ?? 0) - 1,
  );
  expect(panelBox?.y).toBeLessThan((mainBox?.y ?? 0) + (mainBox?.height ?? 0));
  expect(openIcon).not.toEqual(closedIcon);

  await summary.click();
  await expect(details).toHaveAttribute('data-state', 'closed');
  await expect
    .poll(() => panel.evaluate((element) => element.clientHeight))
    .toBe(0);
  await expect.poll(async () => (await main.boundingBox())?.y).toBe(mainBox?.y);
});

test('keeps opened menu links above the home hero pointer layer', async ({
  page,
}) => {
  test.setTimeout(10_000);
  await page.setViewportSize(mobileViewport);
  await page.goto('/');
  const { details, summary } = headerMenu(page);

  await summary.click();
  await expect(details).toHaveAttribute('data-state', 'open');
  await details.getByRole('link', { name: 'The Weeknd' }).click();

  await expect(page).toHaveURL(/\/discover\/$/);
});

test('attaches the narrow-screen menu across the full header width', async ({
  page,
}) => {
  await page.setViewportSize({ width: 382, height: 527 });
  await page.goto('/');

  const { details, panel, summary } = headerMenu(page);
  const header = page.locator('.site-header');
  const main = page.locator('main');
  const firstLink = details.getByRole('link').first();
  const [closedMainBox, headerBox] = await Promise.all([
    main.boundingBox(),
    header.boundingBox(),
  ]);

  await summary.click();
  await expect(details).toHaveAttribute('data-state', 'open');
  const [openMainBox, panelBox, linkBox, textStart] = await Promise.all([
    main.boundingBox(),
    panel.boundingBox(),
    firstLink.boundingBox(),
    firstLink.evaluate((link) => {
      const range = document.createRange();
      range.selectNodeContents(link);
      return range.getBoundingClientRect().x;
    }),
  ]);

  expect(panelBox?.x).toBeCloseTo(headerBox?.x ?? 0, 0);
  expect(panelBox?.width).toBeCloseTo(headerBox?.width ?? 0, 0);
  expect(panelBox?.y).toBeCloseTo(
    (headerBox?.y ?? 0) + (headerBox?.height ?? 0),
    0,
  );
  expect(linkBox?.width).toBeGreaterThan((panelBox?.width ?? 0) - 16);
  expect(textStart).toBeGreaterThanOrEqual((headerBox?.x ?? 0) + 12);
  expect(textStart).toBeLessThanOrEqual((headerBox?.x ?? 0) + 32);
  expect(openMainBox?.y).toBe(closedMainBox?.y);
});

test('keeps the compact header inside a 320px viewport at 200% text zoom', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });

  const wordmark = page.locator('.site-header__wordmark');
  const summary = page.locator('.site-header summary');
  await expect(wordmark).toBeVisible();
  await expect(summary).toBeVisible();

  const [overflow, wordmarkBox, summaryBox] = await Promise.all([
    page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
    wordmark.boundingBox(),
    summary.boundingBox(),
  ]);
  expect(overflow).toBeLessThanOrEqual(1);
  for (const box of [wordmarkBox, summaryBox]) {
    expect(box?.x).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320);
  }
});

test('supports keyboard control and uses the fast disclosure motion', async ({
  page,
}) => {
  await page.setViewportSize(mobileViewport);
  await page.goto('/');
  const { details, panel, summary } = headerMenu(page);

  await summary.focus();
  await page.keyboard.press('Enter');
  expect(
    await panel.evaluate(
      (element) => element.getAnimations()[0]?.effect?.getTiming().duration,
    ),
  ).toBe(180);
  await expect(details).toHaveAttribute('data-state', 'open');

  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('data-state', 'closed');
});

test('snaps the mobile menu under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize(mobileViewport);
  await page.goto('/');
  const { details, panel, summary } = headerMenu(page);

  await summary.click();
  await expect(details).toHaveAttribute('open', '');
  expect(
    await panel.evaluate((element) => element.getAnimations().length),
  ).toBe(0);

  await summary.click();
  await expect(details).not.toHaveAttribute('open', '');
});

test('keeps the desktop navigation open and inline', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 700 });
  await page.goto('/');
  const { details, summary } = headerMenu(page);
  const links = details.getByRole('link');

  await expect(details).toHaveAttribute('open', '');
  await expect(summary).toBeHidden();
  await expect(links).toHaveCount(5);
  for (const link of await links.all()) await expect(link).toBeVisible();
  expect(
    await details
      .locator('ul')
      .evaluate((element) => getComputedStyle(element).display),
  ).toBe('flex');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('keeps all primary links visible and reachable on mobile', async ({
    page,
  }) => {
    await page.setViewportSize(mobileViewport);
    await page.goto('/');
    const { details } = headerMenu(page);
    const links = details.getByRole('link');

    await expect(details).toHaveAttribute('open', '');
    await expect(links).toHaveCount(5);
    for (const link of await links.all()) await expect(link).toBeVisible();

    await links.first().focus();
    await expect(links.first()).toBeFocused();
  });
});
