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
  await expect(details.locator('summary .disclosure__label')).toHaveText('접기');

  await details.locator('summary').click();
  await expect(details).toHaveAttribute('data-state', 'closed');
  await expect(details).not.toHaveAttribute('open', '');
  await expect(details.locator('summary .disclosure__label')).toHaveText(
    '1분 입문 펼쳐보기',
  );

  await details.locator('summary').click();
  await expect(details).toHaveAttribute('data-state', 'open');
  await expect(details).toHaveAttribute('open', '');
  await expect(details.locator('summary .disclosure__label')).toHaveText('접기');
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
  await expect(first.locator('summary')).not.toHaveAttribute(
    'data-affordance',
    /.+/,
  );
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('data-state', 'open');
});
