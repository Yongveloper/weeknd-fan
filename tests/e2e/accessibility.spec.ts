import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import {
  applyTextZoom,
  expectFocusedControlsClearStickyNavigation,
  expectMainAndFooterKeyboardReachable,
  expectNoHorizontalDocumentOverflow,
  expectVisibleControlsInsideViewport,
} from './helpers/accessibility';

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
  test(`${route} stays keyboard reachable and horizontally contained across the route matrix`, async ({
    page,
  }, testInfo) => {
    const viewports =
      testInfo.project.name === 'desktop-chromium'
        ? [{ width: 1280, height: 720, label: 'desktop' }]
        : [
            { width: 320, height: 568, label: '320x568' },
            { width: 390, height: 844, label: '390x844' },
          ];

    for (const viewport of viewports) {
      await test.step(viewport.label, async () => {
        await page.setViewportSize(viewport);
        await page.goto(route);
        await expectNoHorizontalDocumentOverflow(page);
        await expectMainAndFooterKeyboardReachable(page);
        await expectVisibleControlsInsideViewport(page);
        await expectFocusedControlsClearStickyNavigation(page);

        if (viewport.label !== 'desktop') {
          await applyTextZoom(page);
          await expectNoHorizontalDocumentOverflow(page);
          await expectVisibleControlsInsideViewport(page);
        }
      });
    }
  });
}

for (const route of publicRoutes) {
  test(`${route} has no serious or critical axe violations`, async ({
    page,
  }, testInfo) => {
    await page.goto(route);

    const result = await new AxeBuilder({ page }).analyze();
    for (const violation of result.violations) {
      testInfo.annotations.push({
        type: `axe-${violation.impact ?? 'unknown'}`,
        description: `${violation.id}: ${violation.help} (${violation.nodes.length} node${violation.nodes.length === 1 ? '' : 's'})`,
      });
    }
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
