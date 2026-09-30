import { expect, test } from '@playwright/test';
import { applyTextZoom, tabUntilFocused } from './helpers/accessibility';

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

test('provides an inline venue map without an external frame', async ({
  page,
}) => {
  await page.goto('/goyang/');
  const map = page.getByRole('region', {
    name: '고양종합운동장 지도',
    exact: true,
  });
  await expect(map).toHaveCount(1);
  await expect(map.locator('[data-venue-map]')).toHaveCount(1);
  await expect(map.locator('iframe')).toHaveCount(0);
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
  await expect(tips.getByText('후기 기반 · 이 공연 미확정')).toHaveCount(0);
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

  await tabUntilFocused(page, tabs.nth(0));
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(tips.getByRole('tabpanel')).toContainText('본부석');
});

test('supports every TipsTabs keyboard navigation key', async ({ page }) => {
  await page.goto('/goyang/');
  const tabs = page.locator('#tips [role="tab"]');

  await tabUntilFocused(page, tabs.nth(0));
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

test('orders the eight sections and offers a jump nav', async ({ page }) => {
  await page.goto('/goyang/');
  const ids = await page
    .locator('main section[id]')
    .evaluateAll((els) => els.map((el) => el.id));
  expect(ids).toEqual([
    'timetable',
    'official',
    'transport',
    'packing',
    'seating',
    'tips',
    'return',
    'pending',
  ]);
  const jump = page.getByRole('navigation', { name: '가이드 섹션' });
  await expect(jump.getByRole('link')).toHaveCount(8);
  await expect(jump.getByRole('link', { name: '좌석 안내' })).toHaveAttribute(
    'href',
    '#seating',
  );
  await expect(page.getByText('아직 발표되지 않은 운영 정보')).toBeVisible();
});

test('activates all eight guide jump links from the keyboard', async ({
  page,
}) => {
  // One fresh page load per link; eight sections sit right at the 30s default.
  test.setTimeout(60_000);
  await page.goto('/goyang/');
  const jump = page.getByRole('navigation', { name: '가이드 섹션' });
  const links = jump.getByRole('link');
  const ids = [
    'timetable',
    'official',
    'transport',
    'packing',
    'seating',
    'tips',
    'return',
    'pending',
  ];

  await expect(links).toHaveCount(ids.length);
  for (const [index, id] of ids.entries()) {
    await page.goto('/goyang/');
    await tabUntilFocused(page, links.nth(0));
    for (let tab = 0; tab < index; tab += 1) await page.keyboard.press('Tab');
    await expect(links.nth(index)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeVisible();
    await expect(page.locator(`#${id}`)).toBeFocused();
  }
});

test('tracks the current guide section', async ({ page }) => {
  await page.goto('/goyang/');

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

test('clears the actual sticky jump nav from every guide heading', async ({
  page,
}) => {
  // 6 viewport/zoom cases × 8 sections of smooth-scroll clicks: the run took
  // 27s with seven sections, so the eighth pushed it past the 30s default.
  test.setTimeout(60_000);
  const cases = [
    { width: 320, zoom: false },
    { width: 390, zoom: false },
    { width: 1280, zoom: false },
    { width: 320, zoom: true },
    { width: 390, zoom: true },
    { width: 1280, zoom: true },
  ];
  const ids = [
    'timetable',
    'official',
    'transport',
    'packing',
    'seating',
    'tips',
    'return',
    'pending',
  ];

  for (const { width, zoom } of cases) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/goyang/');
    if (zoom) await applyTextZoom(page);

    const jump = page.getByRole('navigation', { name: '가이드 섹션' });
    for (const id of ids) {
      await jump.locator(`a[href="#${id}"]`).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      const clearance = await page.locator(`#${id} h2`).evaluate((heading) => {
        const sticky = document.querySelector<HTMLElement>('guide-jump-nav');
        if (!sticky) throw new Error('missing sticky guide navigation');
        return {
          headingTop: heading.getBoundingClientRect().top,
          stickyBottom: sticky.getBoundingClientRect().bottom,
        };
      });
      expect(
        clearance.headingTop,
        `${width}px${zoom ? ' at 200% text' : ''} #${id} heading should clear sticky nav`,
      ).toBeGreaterThanOrEqual(clearance.stickyBottom + 1);
    }
  }
});

test('keeps the guide jump nav in one horizontal row at text zoom', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/goyang/');
  await applyTextZoom(page);

  const jump = page.getByRole('navigation', { name: '가이드 섹션' });
  const rows = await jump
    .locator('a')
    .evaluateAll((links) =>
      links.map((link) => Math.round(link.getBoundingClientRect().top)),
    );
  expect(new Set(rows).size).toBe(1);
});

test('hides the actual jump scroller scrollbar and spaces its chips', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/goyang/');

  const jump = page.getByRole('navigation', { name: '가이드 섹션' });
  const geometry = await jump.evaluate((nav) => {
    const links = Array.from(nav.querySelectorAll('a'));
    const first = links[0]?.getBoundingClientRect();
    const second = links[1]?.getBoundingClientRect();
    if (!first || !second) throw new Error('missing guide jump links');
    const style = getComputedStyle(nav);
    return {
      columnGap: style.columnGap,
      flexWrap: style.flexWrap,
      gap: second.left - first.right,
      overflowX: style.overflowX,
      overflows: nav.scrollWidth > nav.clientWidth,
      scrollbarWidth: style.scrollbarWidth,
      webkitScrollbarDisplay: getComputedStyle(nav, '::-webkit-scrollbar')
        .display,
    };
  });
  expect(geometry.overflows).toBe(true);
  expect(geometry.overflowX).toBe('auto');
  expect(geometry.flexWrap).toBe('nowrap');
  expect(geometry.columnGap).toBe('8px');
  expect(geometry.gap).toBeCloseTo(8, 3);
  expect(geometry.scrollbarWidth).toBe('none');
  expect(geometry.webkitScrollbarDisplay).toBe('none');
});

test('keeps the hash target and current section aligned after navigation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 382, height: 527 });
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
  await page.goto('/goyang/#return', { waitUntil: 'domcontentloaded' });

  const jump = page.getByRole('navigation', { name: '가이드 섹션' });
  const current = jump.locator('[aria-current="location"]');
  await page.waitForTimeout(100);
  await page.locator('#tips').evaluate((section) => {
    document.documentElement.style.overflowAnchor = 'none';
    section.style.paddingBottom = '20rem';
    window.dispatchEvent(new Event('resize'));
  });
  await page.waitForTimeout(600);
  await expect(current).toHaveCount(1);
  expect(await current.getAttribute('href')).toBe('#return');
  const directClearance = await page
    .locator('#return h2')
    .evaluate((heading) => {
      const sticky = document.querySelector<HTMLElement>('guide-jump-nav');
      if (!sticky) throw new Error('missing sticky guide navigation');
      const headingRect = heading.getBoundingClientRect();
      return {
        headingTop: headingRect.top,
        headingBottom: headingRect.bottom,
        stickyBottom: sticky.getBoundingClientRect().bottom,
        viewportHeight: window.innerHeight,
      };
    });
  expect(directClearance.headingTop).toBeGreaterThanOrEqual(
    directClearance.stickyBottom + 1,
  );
  expect(directClearance.headingBottom).toBeLessThanOrEqual(
    directClearance.viewportHeight,
  );
  expect(
    await page.evaluate(
      () =>
        (window as Window & { __initialGuideCurrent?: string })
          .__initialGuideCurrent,
    ),
  ).toBe('#return');

  await jump.locator('a[href="#seating"]').click();
  await page.waitForTimeout(700);
  await expect(page).toHaveURL(/#seating$/);
  await expect(current).toHaveCount(1);
  expect(await current.getAttribute('href')).toBe('#seating');
  const alignedScrollY = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, -800);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(
    alignedScrollY - 100,
  );

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
      ['packing', 102],
      ['seating', 101],
      ['tips', 102],
      ['return', 102],
      ['pending', 102],
    ] as const) {
      Object.defineProperty(
        document.querySelector<HTMLElement>(`#${id}`)!,
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

test('keeps the active guide chip horizontally visible without moving the page', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/goyang/#pending');
  await page.waitForTimeout(250);

  const jump = page.getByRole('navigation', { name: '가이드 섹션' });
  const current = jump.locator('[aria-current="location"]');
  await expect(current).toHaveAttribute('href', '#pending');
  const position = await current.evaluate((link) => {
    const nav = link.closest('nav');
    if (!nav) throw new Error('missing guide navigation');
    const linkRect = link.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    return {
      linkLeft: linkRect.left,
      linkRight: linkRect.right,
      navLeft: navRect.left,
      navRight: navRect.right,
      scrollY: window.scrollY,
    };
  });
  expect(position.linkLeft).toBeGreaterThanOrEqual(position.navLeft - 1);
  expect(position.linkRight).toBeLessThanOrEqual(position.navRight + 1);
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.scrollY)).toBe(position.scrollY);
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

test('leads with the official show-day timetable', async ({ page }) => {
  await page.goto('/goyang/');
  const firstSection = page.locator('main section[id]').first();
  await expect(firstSection).toHaveAttribute('id', 'timetable');

  const timetable = page.locator('#timetable');
  await expect(
    timetable.getByRole('heading', { level: 2, name: '당일 타임테이블' }),
  ).toBeVisible();
  await expect(
    timetable.getByText('스탠딩은 16:30 전까지 대기장소로'),
  ).toBeVisible();

  const rows = timetable
    .getByRole('list', { name: '공식 시간표' })
    .locator('li');
  await expect(rows.locator('time')).toHaveText([
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '16:30',
    '18:45',
    '19:45',
  ]);
  await expect(
    rows.filter({ has: page.locator('[datetime="16:30"]') }),
  ).toHaveAttribute('data-emphasis', '');
  await expect(rows.nth(1)).toContainText(
    '스탠딩 Early Entry Package 구매자 대상',
  );
  await expect(rows.nth(5)).toContainText('Creepy Nuts 오프닝 공연 시작');
  await expect(rows.nth(6)).toContainText('The Weeknd 공연 시작');

  const totals = timetable.locator('.entry-duration__totals dd');
  await expect(totals).toHaveText(['최소 147분', '최소 137분']);
  const steps = timetable.getByRole('table', {
    name: '입장까지 예상 소요 시간',
  });
  await expect(steps.locator('tbody th[scope="row"]')).toHaveCount(4);
  await expect(steps).toContainText('대화역 도보 최소 13분');

  await expect(
    timetable.getByRole('listitem').filter({ hasText: '모바일 신분증' }),
  ).toBeVisible();
  await expect(
    timetable.getByRole('link', { name: '현대카드 공식 인스타그램' }).first(),
  ).toHaveAttribute('href', 'https://www.instagram.com/p/Dd5iIpMiQKE/');
});

test('shows the Hyundai Card venue map with a text alternative', async ({
  page,
}) => {
  await page.goto('/goyang/');
  const map = page.locator('#timetable .venue-map');
  const original = map.getByRole('link', {
    name: /공연장 맵 원본 이미지 열기/,
  });
  await expect(original).toHaveAttribute(
    'href',
    '/downloads/venue-map-hyundaicard.png',
  );
  const image = map.locator('img');
  await expect(image).toHaveAttribute('alt', /현대카드 슈퍼콘서트 공연장 맵/);
  await image.scrollIntoViewIfNeeded();
  // One 1206w WebP only; naturalWidth is density-corrected against `sizes`,
  // so check the decoded source instead of a pixel width.
  await expect
    .poll(() =>
      image.evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
    )
    .toBe(true);
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.currentSrc))
    .toMatch(/venue-map-hyundaicard\.[^/]+\.webp$/);

  const response = await page.request.get(
    '/downloads/venue-map-hyundaicard.png',
  );
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('image/png');

  const details = map.locator('details');
  await expect(details).not.toHaveAttribute('open', '');
  await details.locator('summary').click();
  await expect(details.getByRole('listitem')).toHaveCount(6);
  await expect(details).toContainText('보조경기장');
  await expect(details).toContainText(
    '좌석 구역별 입장 게이트는 아직 안내되지 않았습니다',
  );
});
