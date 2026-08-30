import { expect, test } from '@playwright/test';

test('hides data-enter elements until they scroll into view, then reveals them once', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute(
    'data-motion-ready',
    'true',
  );

  const fanNote = page.locator('.fan-note');
  await expect(fanNote).toHaveAttribute('data-enter', '');
  expect(await fanNote.evaluate((el) => getComputedStyle(el).opacity)).toBe(
    '0',
  );

  await fanNote.scrollIntoViewIfNeeded();
  await expect(fanNote).toHaveAttribute('data-enter', 'in');
  await expect
    .poll(
      async () => {
        const opacity = Number(
          await fanNote.evaluate((el) => getComputedStyle(el).opacity),
        );
        return opacity > 0 && opacity < 1;
      },
      { timeout: 600 },
    )
    .toBe(true);
  await expect
    .poll(() => fanNote.evaluate((el) => getComputedStyle(el).opacity))
    .toBe('1');
});

test('staggers data-enter-group children via --enter-i and transition-delay', async ({
  page,
}) => {
  await page.goto('/');
  const group = page.locator('.site-footer__inner');
  await expect(group).toHaveAttribute('data-enter-group', '');
  const children = group.locator(':scope > *');

  await group.scrollIntoViewIfNeeded();
  await expect(group).toHaveAttribute('data-enter', 'in');

  const [firstIndex, secondIndex] = await Promise.all([
    children
      .nth(0)
      .evaluate((el) =>
        getComputedStyle(el).getPropertyValue('--enter-i').trim(),
      ),
    children
      .nth(1)
      .evaluate((el) =>
        getComputedStyle(el).getPropertyValue('--enter-i').trim(),
      ),
  ]);
  expect(firstIndex).toBe('0');
  expect(secondIndex).toBe('1');

  const [firstDelay, secondDelay] = await Promise.all([
    children.nth(0).evaluate((el) => getComputedStyle(el).transitionDelay),
    children.nth(1).evaluate((el) => getComputedStyle(el).transitionDelay),
  ]);
  expect(firstDelay).toBe('0s');
  expect(secondDelay).toBe('0.06s');
});

test('keeps body links visible at rest and draws the full underline on hover', async ({
  page,
}) => {
  await page.goto('/sources/');
  const link = page.locator('main :is(p, li) > a:not([class])').first();
  const styles = await link.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      color: cs.color,
      decoration: cs.textDecorationLine,
      transition: cs.transitionProperty,
      size: cs.backgroundSize,
      marker: getComputedStyle(el, '::after').content,
      external: /^https?:/.test(el.getAttribute('href') ?? ''),
    };
  });
  // 쉬는 상태: hover 없이도 링크임이 보여야 한다(밝은 글자 + 옅은 밑줄), 드로우 선은 0.
  expect(styles.color).toBe('rgb(240, 232, 218)');
  expect(styles.decoration).toBe('underline');
  expect(styles.transition).toContain('background-size');
  expect(styles.size).toMatch(/^0(px)? /);
  if (styles.external) expect(styles.marker).toContain('↗');

  await link.hover();
  await expect
    .poll(() => link.evaluate((el) => getComputedStyle(el).backgroundSize))
    .toBe('100% 1px');
});

test('excludes structural links like nav shortcuts from the underline draw', async ({
  page,
}) => {
  await page.goto('/');
  const navLink = page
    .locator('nav[aria-label="고양 가이드 바로가기"] a')
    .first();
  const styles = await navLink.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      size: cs.backgroundSize,
      transition: cs.transitionProperty,
    };
  });
  expect(styles.size).not.toMatch(/^0(px)? /);
  expect(styles.transition).not.toContain('background-size');
});

test('excludes the official-embed link nested inside a setlist entry', async ({
  page,
}) => {
  await page.goto('/setlist/');
  await page.locator('.expected-setlist details summary').first().click();

  const embedLinks = page.locator('official-embed a');
  const embedCount = await embedLinks.count();
  test.skip(
    embedCount === 0,
    'no officialListenUrl in the current content data, so official-embed never renders; ' +
      "the broader 'main li details a:not([class])' fallback resolves to SourceList's own " +
      'direct-child links instead (which are correctly underlined), so it cannot stand in here',
  );

  const styles = await embedLinks.first().evaluate((el) => {
    const cs = getComputedStyle(el);
    return { size: cs.backgroundSize, transition: cs.transitionProperty };
  });
  expect(styles.size).not.toMatch(/^0(px)? /);
  expect(styles.transition).not.toContain('background-size');
});

test('shows everything immediately under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForTimeout(300);
  await expect(page.locator('html')).not.toHaveAttribute(
    'data-motion-ready',
    /.+/,
  );
  expect(
    await page
      .locator('.fan-note')
      .evaluate((el) => getComputedStyle(el).opacity),
  ).toBe('1');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('never hides data-enter content', async ({ page }) => {
    await page.goto('/');
    const fanNote = page.locator('.fan-note');
    await expect(fanNote).toBeVisible();
    expect(await fanNote.evaluate((el) => getComputedStyle(el).opacity)).toBe(
      '1',
    );
  });
});

test('marks every page motion-ready, not just home', async ({ page }) => {
  await page.goto('/discover/');
  await expect(page.locator('html')).toHaveAttribute(
    'data-motion-ready',
    'true',
  );
});

test('pins the header across view transitions and dips through black', async ({
  page,
}) => {
  await page.goto('/');
  expect(
    await page
      .locator('header.site-header')
      .evaluate((el) => getComputedStyle(el).viewTransitionName),
  ).toBe('site-header');
  const css = await page.evaluate(() =>
    Array.from(document.styleSheets)
      .flatMap((sheet) => {
        try {
          return Array.from(sheet.cssRules).map((rule) => rule.cssText);
        } catch {
          return [];
        }
      })
      .join('\n'),
  );
  expect(css).toContain('::view-transition-group(root)');
  expect(css).toMatch(/@keyframes vt-out/);
  expect(css).toMatch(/@keyframes vt-in/);
});
