import { expect, type Locator, type Page } from '@playwright/test';

export interface HorizontalRect {
  left: number;
  right: number;
}

interface ControlGeometry extends HorizontalRect {
  width: number;
  height: number;
  tagName: string;
  text: string;
  clipRects: HorizontalRect[];
}

export function getHorizontalClipIntersection(
  rect: HorizontalRect,
  clipRects: HorizontalRect[],
  viewportWidth: number,
): HorizontalRect | null {
  let left = 0;
  let right = viewportWidth;
  clipRects.forEach((clip) => {
    left = Math.max(left, clip.left);
    right = Math.min(right, clip.right);
  });
  const intersection = {
    left: Math.max(rect.left, left),
    right: Math.min(rect.right, right),
  };
  if (intersection.right <= intersection.left) {
    return clipRects.length > 0 ? null : rect;
  }
  return clipRects.length > 0 ? intersection : rect;
}

export async function tabUntilFocused(
  page: Page,
  target: Locator,
  maxTabs = 160,
) {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((element) => document.activeElement === element))
      return;
  }
  throw new Error(
    `could not reach ${(await target.first().getAttribute('aria-label')) ?? 'target'} with Tab`,
  );
}

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
  const { viewportWidth, controls } = await page
    .locator('a:visible, button:visible')
    .evaluateAll((elements) => {
      const controls: ControlGeometry[] = elements.map((control) => {
        const rect = control.getBoundingClientRect();
        const clipRects: Array<{ left: number; right: number }> = [];
        let ancestor = control.parentElement;
        while (ancestor) {
          const style = getComputedStyle(ancestor);
          const clipsHorizontally = [
            'auto',
            'clip',
            'hidden',
            'scroll',
          ].includes(style.overflowX);
          if (clipsHorizontally) {
            const ancestorRect = ancestor.getBoundingClientRect();
            clipRects.push({
              left: ancestorRect.left,
              right: ancestorRect.right,
            });
          }
          ancestor = ancestor.parentElement;
        }
        return {
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height,
          tagName: control.tagName,
          text: control.textContent?.trim() ?? '',
          clipRects,
        };
      });
      return { viewportWidth: document.documentElement.clientWidth, controls };
    });
  const violations = controls.flatMap((control) => {
    const intersection = getHorizontalClipIntersection(
      control,
      control.clipRects,
      viewportWidth,
    );
    if (!intersection) return [];
    if (control.width <= 0 || control.height <= 0) {
      return [`${control.tagName} has an empty box`];
    }
    if (intersection.left < -1 || intersection.right > viewportWidth + 1) {
      return [
        `${control.tagName} ${control.text} is outside ${viewportWidth}px`,
      ];
    }
    return [];
  });
  expect(violations).toEqual([]);
}

export async function expectMainAndFooterKeyboardReachable(page: Page) {
  const skipLink = page.getByRole('link', { name: '본문으로 건너뛰기' });
  const alreadyFocused = await skipLink.evaluate(
    (element) => document.activeElement === element,
  );
  if (!alreadyFocused) {
    let skipReached = false;
    for (let index = 0; index < 220; index += 1) {
      await page.keyboard.press('Tab');
      if (
        await skipLink.evaluate((element) => document.activeElement === element)
      ) {
        skipReached = true;
        break;
      }
    }
    expect(skipReached, 'skip link should be reachable with Tab').toBe(true);
  }
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

  for (let index = 0; index < 220; index += 1) {
    await page.keyboard.press('Shift+Tab');
    const result = await page.evaluate(() => {
      const active = document.activeElement;
      if (!active) return { stop: true, control: false, overlap: false };
      if (active.matches('.skip-link'))
        return { stop: true, control: false, overlap: false };
      const control = active.matches(
        'a, button, input, select, summary, [tabindex]:not([tabindex="-1"])',
      );
      if (!control || active.closest('guide-jump-nav'))
        return { stop: false, control: false, overlap: false };
      const sticky = document.querySelector<HTMLElement>('guide-jump-nav');
      if (!sticky) return { stop: false, control: true, overlap: false };
      const controlRect = (active as HTMLElement).getBoundingClientRect();
      const stickyRect = sticky.getBoundingClientRect();
      return {
        stop: false,
        control: true,
        overlap:
          controlRect.left < stickyRect.right &&
          controlRect.right > stickyRect.left &&
          controlRect.top < stickyRect.bottom &&
          controlRect.bottom > stickyRect.top,
      };
    });
    if (result.stop) return;
    if (result.control)
      expect(
        result.overlap,
        `focused control is covered by sticky navigation`,
      ).toBe(false);
  }
  throw new Error('could not traverse back to the skip link with Shift+Tab');
}
