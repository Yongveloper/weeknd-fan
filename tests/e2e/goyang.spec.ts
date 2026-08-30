import { expect, test } from '@playwright/test';

test('shows Interpark access data as a table with a source caption', async ({
  page,
}) => {
  await page.goto('/goyang/');
  const access = page.locator('#transport .access-table');
  await expect(
    access.getByText('경기도 고양시 일산서구 중앙로 1601'),
  ).toBeVisible();
  await expect(access.getByText('3호선 대화역 3번 출구')).toBeVisible();
  await expect(access.getByText('M7731')).toBeVisible();
  await expect(access.getByText('1100')).toBeVisible();
  await expect(
    page
      .locator('#transport')
      .getByRole('link', { name: /인터파크 티켓 공연 상세/ })
      .first(),
  ).toHaveAttribute('href', 'https://tickets.interpark.com/goods/26006903');
});

test('links to Kakao, Naver, and Google directions', async ({ page }) => {
  await page.goto('/goyang/');
  const links = page.locator('#transport .directions a');
  await expect(links).toHaveCount(3);
  await expect(links.nth(0)).toHaveAttribute(
    'href',
    /^https:\/\/map\.kakao\.com\/link\/to\//,
  );
  await expect(links.nth(1)).toHaveAttribute(
    'href',
    /^https:\/\/map\.naver\.com\//,
  );
  await expect(links.nth(2)).toHaveAttribute(
    'href',
    /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1/,
  );
  for (let i = 0; i < 3; i += 1) {
    await expect(links.nth(i)).toHaveAttribute('target', '_blank');
    await expect(links.nth(i)).toHaveAttribute('rel', /noreferrer/);
  }
});

test('loads the live map iframe only after a click', async ({ page }) => {
  await page.goto('/goyang/');
  await expect(page.locator('#transport iframe')).toHaveCount(0);
  await page.getByRole('button', { name: '실제 지도 불러오기' }).click();
  const frame = page.locator('#transport iframe');
  await expect(frame).toHaveCount(1);
  await expect(frame).toHaveAttribute('src', /google\.com\/maps/);
  await expect(frame).toHaveAttribute('title', '고양종합운동장 지도');
});

test('draws the rebuilt schematic map with both stations', async ({ page }) => {
  await page.goto('/goyang/');
  await expect(page.locator('#venue-map title')).toHaveText(
    '고양종합운동장 주변 간이 지도',
  );
  // `#venue-map` 안의 <desc>/<title>도 같은 단어를 담고 있어 getByText는 strict mode에서
  // 두 개를 잡습니다. 실제로 그려진 라벨만 보도록 <text> 요소로 좁힙니다.
  const labels = page.locator('#venue-map text');
  await expect(labels.filter({ hasText: '대화역' })).toBeVisible();
  await expect(labels.filter({ hasText: '킨텍스역' })).toBeVisible();
  await expect(labels.filter({ hasText: '고양종합운동장' })).toBeVisible();
});

test('shows the official seat map with source, a schematic, and the grade legend', async ({
  page,
}) => {
  await page.goto('/goyang/');
  const seating = page.locator('#seating');
  await expect(
    seating.getByRole('heading', { name: '좌석 안내' }),
  ).toBeVisible();
  await expect(seating.locator('.seat-map picture img')).toHaveCount(1);
  await expect(seating.locator('.seat-map figcaption')).toContainText(
    '인터파크',
  );
  await expect(seating.locator('#seat-schematic title')).toHaveText(
    '고양종합운동장 공연 좌석 구조 개략도',
  );
  await expect(seating.locator('.seat-legend tbody tr')).toHaveCount(13);
  await expect(seating.getByText('스탠딩 Early Entry Package')).toBeVisible();
});

test('groups the five review-based tips into keyboard-operable tabs', async ({
  page,
}) => {
  await page.goto('/goyang/');
  const tips = page.locator('#tips');
  await expect(tips.getByText('후기 기반 · 이 공연 미확정')).toBeVisible();
  const tabs = tips.getByRole('tab');
  await expect(tabs).toHaveText([
    '스탠딩',
    '좌석과 시야',
    '입장',
    '귀가',
    '챙길 것',
  ]);
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await expect(tips.getByRole('tabpanel')).toHaveCount(1);

  await tabs.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(tips.getByRole('tabpanel')).toContainText('본부석');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('shows every tips panel in order', async ({ page }) => {
    await page.goto('/goyang/');
    const panels = page.locator('#tips [role="tabpanel"]');
    await expect(panels).toHaveCount(5);
    for (let i = 0; i < 5; i += 1) await expect(panels.nth(i)).toBeVisible();
  });
});
