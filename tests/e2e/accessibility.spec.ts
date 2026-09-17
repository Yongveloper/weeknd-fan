import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import {
  applyTextZoom,
  expectFocusedControlsClearStickyNavigation,
  expectMainAndFooterKeyboardReachable,
  expectNoHorizontalDocumentOverflow,
  expectVisibleControlsInsideViewport,
  tabUntilFocused,
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

const moderateAxeClassifications: Record<
  string,
  {
    classification:
      'plan-caused' | 'pre-existing-designer-owned' | 'fixed' | 'accepted';
    rationale: string;
  }
> = {
  'color-contrast': {
    classification: 'pre-existing-designer-owned',
    rationale:
      'The visual palette is owned by the active designer branch; Task 8 does not change tokens, assets, or screenshot baselines.',
  },
};

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

        await applyTextZoom(page);
        await expectNoHorizontalDocumentOverflow(page);
        await expectMainAndFooterKeyboardReachable(page);
        await expectVisibleControlsInsideViewport(page);
        await expectFocusedControlsClearStickyNavigation(page);
      });
    }
  });
}

for (const route of publicRoutes) {
  test(`${route} has no serious or critical axe violations`, async ({
    page,
  }, testInfo) => {
    // Scan fully exposed text, not a transient reveal opacity. Motion behavior
    // is covered separately in the visual and lunar atmosphere tests.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route);

    const result = await new AxeBuilder({ page }).analyze();
    const moderateViolations = result.violations.filter(
      (violation) => violation.impact === 'moderate',
    );
    expect(
      moderateViolations
        .map((violation) => violation.id)
        .filter((id) => !moderateAxeClassifications[id]),
      'every moderate axe finding must have an explicit Task 8 classification',
    ).toEqual([]);
    if (moderateViolations.length === 0) {
      testInfo.annotations.push({
        type: 'axe-moderate',
        description: 'none observed; route passed the axe scan',
      });
    }
    for (const violation of result.violations) {
      const classification =
        violation.impact === 'moderate'
          ? moderateAxeClassifications[violation.id]
          : undefined;
      testInfo.annotations.push({
        type: `axe-${violation.impact ?? 'unknown'}`,
        description: `${violation.id}: ${violation.help} (${violation.nodes.length} node${violation.nodes.length === 1 ? '' : 's'})${classification ? ` — ${classification.classification}: ${classification.rationale}` : ''}`,
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
  await tabUntilFocused(page, firstSong);
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
