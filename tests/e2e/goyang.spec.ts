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

test('renders the live map iframe on load', async ({ page }) => {
  await page.goto('/goyang/');
  const frame = page.locator('#transport iframe');
  await expect(frame).toHaveCount(1);
  await expect(frame).toHaveAttribute('src', /google\.com\/maps/);
  await expect(frame).toHaveAttribute('title', '고양종합운동장 지도');
  await expect(frame).toHaveAttribute('loading', 'lazy');
});

test('shows the Interpark access map image with its source', async ({
  page,
}) => {
  await page.goto('/goyang/');
  const map = page.locator('#transport .access-map');
  await expect(map.locator('picture img')).toHaveCount(1);
  await expect(map.locator('picture img')).toHaveAttribute(
    'alt',
    /대화역.*킨텍스역.*고양종합운동장/,
  );
  await expect(map.locator('figcaption a')).toHaveAttribute(
    'href',
    /tickets\.interpark\.com/,
  );
  await expect(map.locator('> a')).toHaveAttribute('target', '_blank');
});

test('shows the official seat map image with its Interpark source', async ({
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
  await expect(seating.locator('#seat-schematic')).toHaveCount(0);
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

test('supports every TipsTabs keyboard navigation key', async ({ page }) => {
  await page.goto('/goyang/');
  const tabs = page.locator('#tips [role="tab"]');

  await tabs.nth(0).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.nth(4)).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(0)).toBeFocused();
  await page.keyboard.press('End');
  await expect(tabs.nth(4)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tabs.nth(0)).toBeFocused();
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.nth(4)).toHaveAttribute('aria-selected', 'false');
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

test('orders the seven sections and offers a jump nav', async ({ page }) => {
  await page.goto('/goyang/');
  const ids = await page
    .locator('main section[id]')
    .evaluateAll((els) => els.map((el) => el.id));
  expect(ids).toEqual([
    'official',
    'transport',
    'seating',
    'tips',
    'return',
    'packing',
    'pending',
  ]);
  const jump = page.getByRole('navigation', { name: '가이드 섹션' });
  await expect(jump.getByRole('link')).toHaveCount(7);
  await expect(jump.getByRole('link', { name: '좌석 안내' })).toHaveAttribute(
    'href',
    '#seating',
  );
  await expect(page.getByText('아직 발표되지 않은 운영 정보')).toBeVisible();
});

test('activates all seven guide jump links from the keyboard', async ({
  page,
}) => {
  await page.goto('/goyang/');
  const jump = page.getByRole('navigation', { name: '가이드 섹션' });
  const links = jump.getByRole('link');
  const ids = [
    'official',
    'transport',
    'seating',
    'tips',
    'return',
    'packing',
    'pending',
  ];

  await expect(links).toHaveCount(ids.length);
  for (const [index, id] of ids.entries()) {
    await links.nth(index).focus();
    await expect(links.nth(index)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
});

test('summarizes day-of actions and tracks the current guide section', async ({
  page,
}) => {
  await page.goto('/goyang/');

  const overview = page.getByRole('navigation', { name: '당일 행동 요약' });
  await expect(overview.getByRole('link')).toHaveText([
    /도착 전.*가는 길.*준비물/,
    /입장.*공식 공연 정보.*공식 발표 대기/,
    /관람.*좌석 안내.*현장 팁/,
    /귀가.*귀가 확인/,
  ]);
  await expect(
    overview.getByRole('link', { name: /공식 발표 대기/ }),
  ).toHaveText(/미공개 · 확인 필요/);

  const jump = page.getByRole('navigation', { name: '가이드 섹션' });
  for (const id of ['transport', 'seating', 'return']) {
    await page
      .locator(`#${id} h2`)
      .evaluate((element) =>
        element.scrollIntoView({ block: 'start', behavior: 'instant' }),
      );
    await expect(jump.locator('[aria-current="location"]')).toHaveCount(1);
    await expect(jump.locator('[aria-current="location"]')).toHaveAttribute(
      'href',
      `#${id}`,
    );
  }

  await jump.getByRole('link', { name: '좌석 안내' }).click();
  await expect(page).toHaveURL(/#seating$/);
  const heading = page.getByRole('heading', { name: '좌석 안내' });
  await expect(heading).toBeInViewport();
  const box = await heading.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);
});

test('keeps a deterministic current section across history events and boundaries', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const guideWindow = window as Window & {
      __initialGuideCurrent?: string | null;
    };
    const observer = new MutationObserver(() => {
      const current = document.querySelector<HTMLAnchorElement>(
        'guide-jump-nav a[aria-current="location"]',
      );
      if (current && !guideWindow.__initialGuideCurrent)
        guideWindow.__initialGuideCurrent = current.getAttribute('href');
    });
    observer.observe(document, {
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-current'],
    });
  });
  await page.goto('/goyang/#seating');

  const jump = page.getByRole('navigation', { name: '가이드 섹션' });
  const current = jump.locator('[aria-current="location"]');
  await expect(current).toHaveCount(1);
  expect(
    await page.evaluate(
      () =>
        (window as Window & { __initialGuideCurrent?: string })
          .__initialGuideCurrent,
    ),
  ).toBe('#seating');

  await page.evaluate(() => {
    window.location.hash = 'return';
  });
  await expect(current).toHaveCount(1);
  await expect(current).toHaveAttribute('href', '#tips');

  await page.evaluate(() => {
    history.pushState({}, '', '#transport');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(current).toHaveCount(1);
  await expect(current).toHaveAttribute('href', '#tips');

  await page.evaluate(() => {
    const rect = (top: number): DOMRect =>
      ({
        top,
        bottom: top + 40,
        left: 0,
        right: 200,
        width: 200,
        height: 40,
        x: 0,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect;
    const nav = document.querySelector<HTMLElement>('guide-jump-nav')!;
    Object.defineProperty(nav, 'getBoundingClientRect', {
      value: () => rect(60),
    });
    for (const [id, top] of [
      ['official', 0],
      ['transport', 101],
      ['seating', 101],
      ['tips', 102],
      ['return', 102],
      ['packing', 102],
      ['pending', 102],
    ] as const) {
      Object.defineProperty(
        document.querySelector<HTMLElement>(`#${id} h2`)!,
        'getBoundingClientRect',
        { value: () => rect(top) },
      );
    }
    window.history.replaceState({}, '', '/goyang/');
    window.dispatchEvent(new Event('scroll'));
  });
  await expect(current).toHaveCount(1);
  await expect(current).toHaveAttribute('href', '#seating');
  await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
  await expect(current).toHaveCount(1);
  await expect(current).toHaveAttribute('href', '#seating');
});

test('keeps every tips tab inside the viewport on mobile', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-chromium',
    'narrow-viewport layout only',
  );
  await page.goto('/goyang/');
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  const tabs = page.locator('#tips [role="tab"]');
  await expect(tabs).toHaveCount(5);
  const fifth = await tabs.nth(4).boundingBox();
  expect(fifth).not.toBeNull();
  expect(fifth!.x + fifth!.width).toBeLessThanOrEqual(viewport!.width);
});
