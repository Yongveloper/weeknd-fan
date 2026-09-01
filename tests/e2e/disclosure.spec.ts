import { expect, test } from '@playwright/test';

const intro = (page: import('@playwright/test').Page) =>
  page.getByRole('group', { name: '1분 입문 더 깊이 보기' });

test('renders a chevron anchor and swaps the label when toggled', async ({
  page,
}) => {
  await page.goto('/discover/');
  const details = intro(page);
  await expect(details).toHaveAttribute('open', '');
  await expect(details.locator('summary .disclosure__chevron')).toHaveCount(1);
  await expect(details.locator('summary .disclosure__label')).toHaveText(
    '접기',
  );

  await details.locator('summary').click();
  await expect(details).toHaveAttribute('data-state', 'closed');
  await expect(details).not.toHaveAttribute('open', '');
  await expect(details.locator('summary .disclosure__label')).toHaveText(
    '1분 입문 펼쳐보기',
  );

  await details.locator('summary').click();
  await expect(details).toHaveAttribute('data-state', 'open');
  await expect(details).toHaveAttribute('open', '');
  await expect(details.locator('summary .disclosure__label')).toHaveText(
    '접기',
  );
});

test('leaves no inline height on the panel after the animation ends', async ({
  page,
}) => {
  await page.goto('/discover/');
  const glossary = page.getByRole('group', { name: '용어 한 장 더 깊이 보기' });
  await glossary.locator('summary').click();
  await expect(glossary).toHaveAttribute('data-state', 'open');
  await expect(glossary.locator('.disclosure__panel')).not.toHaveAttribute(
    'style',
    /height/,
  );
  await expect(glossary.locator('.disclosure__panel')).toBeVisible();
});

test('toggles instantly and natively under reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/discover/');
  await expect(intro(page).locator('summary .disclosure__label')).toHaveText(
    '1분 입문 펼쳐보기',
  );

  const glossary = page.getByRole('group', { name: '용어 한 장 더 깊이 보기' });
  await glossary.locator('summary').click();
  await expect(glossary).toHaveAttribute('open', '');
  await expect(glossary).not.toHaveAttribute('data-state', /.+/);
});

test('opens from the keyboard', async ({ page }) => {
  await page.goto('/discover/');
  const glossary = page.getByRole('group', { name: '용어 한 장 더 깊이 보기' });
  await glossary.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(glossary).toHaveAttribute('open', '');
  await expect(glossary).toHaveAttribute('data-state', 'open');
});

test('animates the timeline and home setlist disclosures too', async ({
  page,
}) => {
  await page.goto('/discover/');
  const timeline = page.locator('.timeline details').first();
  await expect(timeline.locator('.disclosure__chevron')).toHaveCount(1);
  await timeline.locator('summary').click();
  await expect(timeline).toHaveAttribute('data-state', 'open');
  await expect(timeline.locator('summary .disclosure__label')).toHaveText(
    '접기',
  );

  await page.goto('/');
  const preview = page.getByRole('group', { name: '전체 예상 셋리스트' });
  await preview.scrollIntoViewIfNeeded();
  await expect(preview.locator('summary .disclosure__label')).toHaveText(
    '전체 목록 펼쳐보기',
  );
  await preview.locator('summary').click();
  await expect(preview).toHaveAttribute('data-state', 'open');
  await expect(preview.locator('ol li').first()).toBeVisible();
});

test('keeps the song summary name clean and animates the setlist explorer', async ({
  page,
}) => {
  await page.goto('/setlist/');
  const first = page.locator('.expected-setlist details').first();
  await expect(first.locator('summary')).toHaveAccessibleName(
    '01 Baptized in Fear',
  );
  await expect(first.locator('summary .disclosure__chevron')).toHaveCount(1);
  await expect(first).toHaveCSS('border-bottom-width', '0px');
  const last = page.locator('.expected-setlist details').last();
  await expect(last).toHaveCSS('border-bottom-width', '1px');
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('data-state', 'open');
});

test('uses scene motion for editorial panels and fast motion for setlist rows', async ({
  page,
}) => {
  await page.goto('/discover/');
  await expect(intro(page)).toHaveAttribute('data-motion', 'scene');

  await page.goto('/setlist/');
  const first = page.locator('.expected-setlist details').first();
  await expect(first).toHaveAttribute('data-motion', 'fast');
  await first.locator('summary').click();
  const duration = await first
    .locator('.disclosure__panel')
    .evaluate((el) => el.getAnimations()[0]?.effect?.getTiming().duration);
  expect(duration).toBeLessThan(300);
});

test('interrupts a disclosure safely when reduced motion is enabled mid-animation', async ({
  page,
}) => {
  await page.goto('/discover/');
  const glossary = page.getByRole('group', { name: '용어 한 장 더 깊이 보기' });
  await glossary.locator('summary').click();
  await page.emulateMedia({ reducedMotion: 'reduce' });

  await expect(glossary).toHaveAttribute('open', '');
  await expect(glossary).not.toHaveAttribute('data-state', /.+/);
  await expect(glossary.locator('.disclosure__panel')).not.toHaveAttribute(
    'style',
    /height|overflow/,
  );
  expect(
    await glossary
      .locator('.disclosure__panel')
      .evaluate((panel) => panel.getAnimations().length),
  ).toBe(0);
});

test('scopes adopter styles (max-width/min-width/color) to the parent, not Disclosure', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop-chromium',
    'these px values assume the desktop viewport',
  );
  await page.goto('/discover/');
  await expect(intro(page)).toHaveCSS('max-width', '672px');
  await expect(intro(page)).toHaveCSS('color', 'rgb(215, 216, 220)');

  const timelineFirst = page.locator('.timeline details').first();
  await expect(timelineFirst).toHaveCSS('max-width', '736px');

  await page.goto('/');
  const preview = page.getByRole('group', { name: '전체 예상 셋리스트' });
  await expect(preview).toHaveCSS('max-width', '832px');
});

test('lays out the song detail as meta header, three labelled blocks, then sources', async ({
  page,
}) => {
  await page.goto('/setlist/');
  const first = page.locator('.expected-setlist details').first();
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('data-state', 'open');

  const detail = first.locator('.expected-setlist__detail');
  await expect(detail.locator('.song-meta')).toHaveCount(1);
  await expect(detail.locator('.song-meta .status')).toHaveText(
    '예상 · 보장 아님',
  );
  await expect(detail.locator('.song-block .eyebrow')).toHaveText([
    'BEFORE',
    'ON STAGE',
    'SING ALONG',
  ]);
  await expect(detail.locator('.song-block h3')).toHaveText([
    '공연 전에 알면 좋은 한 문장',
    '무대에서 볼 것',
    '떼창 포인트',
  ]);
  await expect(detail.locator('.song-sources h3')).toHaveText('출처');
  await expect(
    detail.locator('.song-sources .source-list li').first(),
  ).toBeVisible();
});

test('animates with the configured duration, not a mis-parsed millisecond value', async ({
  page,
}) => {
  await page.goto('/discover/');
  const glossary = page.getByRole('group', { name: '용어 한 장 더 깊이 보기' });
  const panel = glossary.locator('.disclosure__panel');
  await glossary.locator('summary').click();
  const duration = await panel.evaluate(
    (el) => el.getAnimations()[0]?.effect?.getTiming().duration,
  );
  expect(duration).toBeGreaterThan(100);
});

test('cleans up fully after closing: no open, no data-closing, no inline height/overflow', async ({
  page,
}) => {
  await page.goto('/discover/');
  const details = intro(page);
  await details.locator('summary').click();
  await expect(details).toHaveAttribute('data-state', 'closed');
  await expect(details).not.toHaveAttribute('open', '');
  await expect(details).not.toHaveAttribute('data-closing', /.+/);
  const panel = details.locator('.disclosure__panel');
  await expect(panel).not.toHaveAttribute('style', /height/);
  await expect(panel).not.toHaveAttribute('style', /overflow/);
});

test('stays consistent under rapid repeated clicks', async ({ page }) => {
  await page.goto('/discover/');
  const glossary = page.getByRole('group', { name: '용어 한 장 더 깊이 보기' });
  const summary = glossary.locator('summary');

  await summary.click();
  await page.waitForTimeout(100);
  await summary.click();
  await page.waitForTimeout(100);
  await summary.click();

  await expect.poll(() => glossary.getAttribute('data-state')).not.toBeNull();

  const [openAttr, state] = await Promise.all([
    glossary.getAttribute('open'),
    glossary.getAttribute('data-state'),
  ]);
  expect(openAttr !== null).toBe(state === 'open');

  const panel = glossary.locator('.disclosure__panel');
  await expect(panel).not.toHaveAttribute('style', /height/);
});
