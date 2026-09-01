import { expect, type Page } from '@playwright/test';

export async function expectNoHorizontalDocumentOverflow(page: Page) {
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        ),
      { message: 'document should not overflow horizontally' },
    )
    .toBeLessThanOrEqual(1);
}

export async function applyTextZoom(page: Page) {
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await page.waitForFunction(
    () => document.documentElement.style.fontSize === '200%',
  );
}

export async function expectVisibleControlsInsideViewport(page: Page) {
  const violations = await page
    .locator('a:visible, button:visible')
    .evaluateAll((controls) => {
      const viewportWidth = document.documentElement.clientWidth;
      return controls.flatMap((control) => {
        const rect = control.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
          return [`${control.tagName} has an empty box`];
        }
        if (rect.left < -1 || rect.right > viewportWidth + 1) {
          return [
            `${control.tagName} ${control.textContent?.trim() ?? ''} is outside ${viewportWidth}px`,
          ];
        }
        return [];
      });
    });
  expect(violations).toEqual([]);
}

export async function expectMainAndFooterKeyboardReachable(page: Page) {
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: '본문으로 건너뛰기' });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();

  let footerReached = false;
  for (let index = 0; index < 160; index += 1) {
    await page.keyboard.press('Tab');
    footerReached = await page.evaluate(
      () => document.activeElement?.closest('footer') !== null,
    );
    if (footerReached) break;
  }
  expect(footerReached).toBe(true);
}

export async function expectFocusedControlsClearStickyNavigation(page: Page) {
  const sticky = page.locator('guide-jump-nav:visible');
  if ((await sticky.count()) === 0) return;

  const controls = page.locator(
    'a:visible, button:visible, input:visible, select:visible, summary:visible',
  );
  const count = await controls.count();
  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    if (await control.locator('xpath=ancestor::guide-jump-nav').count())
      continue;
    await control.focus();
    const overlap = await page.evaluate(
      (element) => {
        const sticky = document.querySelector<HTMLElement>('guide-jump-nav');
        if (!sticky || !element) return false;
        const controlRect = (element as HTMLElement).getBoundingClientRect();
        const stickyRect = sticky.getBoundingClientRect();
        return (
          controlRect.left < stickyRect.right &&
          controlRect.right > stickyRect.left &&
          controlRect.top < stickyRect.bottom &&
          controlRect.bottom > stickyRect.top
        );
      },
      await control.elementHandle(),
    );
    expect(
      overlap,
      `focused control ${index} is covered by sticky navigation`,
    ).toBe(false);
  }
}
