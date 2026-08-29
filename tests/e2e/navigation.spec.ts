import { expect, test } from '@playwright/test';

async function expectAnchorHeadingInViewport(
  page: import('@playwright/test').Page,
  heading: string,
) {
  await expect
    .poll(
      async () => {
        const box = await page
          .getByRole('heading', { name: heading })
          .boundingBox();
        const viewport = page.viewportSize();
        return Boolean(
          box &&
          viewport &&
          box.y >= 0 &&
          box.y + box.height <= viewport.height,
        );
      },
      { message: `${heading} heading should settle inside the viewport` },
    )
    .toBe(true);
}

test('serves the Korean fan-guide shell', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/The Weeknd 고양 팬 가이드/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'AFTER HOURS TIL DAWN',
  );
});

test('reaches both private share tools through contextual product CTAs', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: '나만의 D-day 티켓 만들기' }).click();
  await expect(page).toHaveURL(/\/share\/ticket\/$/);

  await page.goto('/');
  await page.getByRole('link', { name: '셋리스트 포스터 만들기' }).click();
  await expect(page).toHaveURL(/\/share\/setlist\/$/);
});

test('exposes navigation and the unofficial disclaimer', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('navigation', { name: '주요 메뉴' }),
  ).toBeVisible();
  await expect(
    page.getByText('비공식·비영리 팬 가이드', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: '예상 셋리스트' }),
  ).toHaveAttribute('href', '/setlist/');
  await expect(page.getByRole('link', { name: '고양 가이드' })).toHaveAttribute(
    'href',
    '/goyang/',
  );
});

test('groups sources and planned update checkpoints without overstating NamuWiki', async ({
  page,
}) => {
  await page.goto('/sources/');

  await expect(
    page.getByRole('heading', { name: '출처와 업데이트' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: '공식' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '공공 교통' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '공연 기록' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '보조 참고' })).toBeVisible();
  await expect(
    page.getByText('누락 탐색용·핵심 사실 근거 아님', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Tokyo · 9월 19–20일 이후')).toBeVisible();
  await expect(
    page.getByText('고양 2일차 아카이브 · 10월 8일 공연 후'),
  ).toBeVisible();
});

test('keeps navigation targets touch-sized in every viewport', async ({
  page,
}) => {
  await page.goto('/');

  for (const link of await page
    .getByRole('navigation', { name: '주요 메뉴' })
    .getByRole('link')
    .all()) {
    const box = await link.boundingBox();
    expect(box, `missing box for ${await link.textContent()}`).not.toBeNull();
    expect(
      box?.width,
      `narrow target for ${await link.textContent()}`,
    ).toBeGreaterThanOrEqual(44);
    expect(
      box?.height,
      `short target for ${await link.textContent()}`,
    ).toBeGreaterThanOrEqual(44);
  }
});

test('shows concert facts and four lightweight entry blocks', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByText('2026.10.07—08')).toBeVisible();
  await expect(page.getByText('고양종합운동장 주경기장')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '3분 만에 The Weeknd 알기' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '예상 셋리스트' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '고양 가이드' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '팬의 한마디' }),
  ).toBeVisible();
});

test('keeps the complete predicted list collapsed by default', async ({
  page,
}) => {
  await page.goto('/');

  const disclosure = page.getByRole('group', { name: '전체 예상 셋리스트' });
  await expect(disclosure).not.toHaveAttribute('open', '');
  await expect(page.getByText('예상 · 보장 아님').first()).toBeVisible();
});

test('shows six predicted titles before the complete collapsed list', async ({
  page,
}) => {
  await page.goto('/');

  const preview = page.locator('.setlist-preview');
  await expect(preview.locator('> .shell-content > ol > li')).toHaveText([
    'Baptized in Fear',
    'Open Hearts',
    'Wake Me Up',
    'After Hours',
    'Starboy',
    'Heartless',
  ]);

  const disclosure = page.getByRole('group', { name: '전체 예상 셋리스트' });
  await expect(disclosure).not.toHaveAttribute('open', '');
  await expect(disclosure.locator('li')).toHaveCount(32);
  await expect(preview.getByText('예상 · 보장 아님')).toBeVisible();
});

test('presents the setlist as a prediction with expandable song context', async ({
  page,
}) => {
  await page.goto('/setlist/');

  await expect(
    page.getByRole('heading', { name: '예상 셋리스트' }),
  ).toBeVisible();
  await expect(page.getByText('예상 · 보장 아님').first()).toBeVisible();
  await expect(page.getByText('최근 2026년 공연 3회 비교')).toBeVisible();

  const firstSong = page.locator('.expected-setlist summary').first();
  await expect(firstSong).toHaveAccessibleName('01 Baptized in Fear');
  await firstSong.click();

  await expect(
    page.getByRole('heading', { name: '공연 전에 알면 좋은 한 문장' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '무대에서 볼 것' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '떼창 포인트' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: '출처' })).toBeVisible();
});

test('keeps expected songs ordered and keyboard-operable without media controls', async ({
  page,
}) => {
  await page.goto('/setlist/');

  const explorer = page.locator('.expected-setlist');
  const firstSong = explorer.locator('summary').first();
  const secondSong = explorer.locator('summary').nth(1);

  await expect(firstSong).toBeVisible();
  await expect(secondSong).toBeVisible();
  await expect(firstSong).toHaveAccessibleName('01 Baptized in Fear');
  await expect(secondSong).toHaveAccessibleName('02 Open Hearts');
  await expect(explorer.locator('details')).toHaveCount(38);
  await expect(explorer.locator('details').first()).not.toHaveAttribute(
    'open',
    '',
  );
  await expect(explorer.getByText('공식 영상 불러오기')).toHaveCount(0);

  await firstSong.focus();
  await page.keyboard.press('Space');
  await expect(explorer.locator('details').first()).toHaveAttribute('open', '');
  await secondSong.focus();
  await page.keyboard.press('Enter');
  await expect(explorer.locator('details').nth(1)).toHaveAttribute('open', '');
});

test('keeps the ordered prediction and trust label usable without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto('http://127.0.0.1:4321/setlist/');

  const explorer = page.locator('.expected-setlist');
  await expect(explorer.getByText('예상 · 보장 아님').first()).toBeVisible();
  await expect(explorer.locator('summary').first()).toHaveText(
    '01 Baptized in Fear',
  );
  await expect(explorer.locator('summary').nth(37)).toHaveText(
    '38 Moth to a Flame',
  );
  expect(
    await explorer
      .locator('details')
      .evaluateAll((items) =>
        items.every((item) => !item.hasAttribute('open')),
      ),
  ).toBe(true);

  await context.close();
});

test('links each Goyang shortcut to its stable guide anchor', async ({
  page,
}) => {
  await page.goto('/');

  const shortcuts = page.getByRole('navigation', {
    name: '고양 가이드 바로가기',
  });
  await expect(
    shortcuts.getByRole('link', { name: '가는 길' }),
  ).toHaveAttribute('href', '/goyang/#transport');
  await expect(shortcuts.getByRole('link', { name: '준비물' })).toHaveAttribute(
    'href',
    '/goyang/#packing',
  );
  await expect(
    shortcuts.getByRole('link', { name: '귀가 확인' }),
  ).toHaveAttribute('href', '/goyang/#return');
});

test('opens transport and return information within two actions', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: '가는 길' }).click();

  await expect(page).toHaveURL(/\/goyang\/#transport$/);
  await expect(page.getByRole('heading', { name: '가는 길' })).toBeVisible();
  await expect(
    page.locator('#transport .guide-section__body').getByText('대화역'),
  ).toBeVisible();
  await expect(page.locator('#transport .status')).toHaveText('실용 안내');
  await expect(page.locator('#official .status')).toHaveText('공식 확정');
  await expect(page.getByText('공연 직전 막차 재확인')).toBeVisible();
});

test('keeps every home guide shortcut on a stable visible anchor', async ({
  page,
}) => {
  await page.goto('/');

  for (const [name, id, heading] of [
    ['가는 길', 'transport', '가는 길'],
    ['준비물', 'packing', '준비물'],
    ['귀가 확인', 'return', '귀가 확인'],
  ] as const) {
    await page.getByRole('link', { name }).click();
    await expect(page).toHaveURL(new RegExp(`/goyang/#${id}$`));
    await expect(page.locator(`#${id}`)).toBeVisible();
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    await expectAnchorHeadingInViewport(page, heading);
    await page.goto('/');
  }
});

test('renders exact unpublished operations and an accessible schematic map', async ({
  page,
}) => {
  await page.goto('/goyang/');

  await expect(page.locator('#pending .status')).toHaveCount(5);
  await expect(page.locator('#pending .status')).toHaveText([
    '미공개 · 확인 필요',
    '미공개 · 확인 필요',
    '미공개 · 확인 필요',
    '미공개 · 확인 필요',
    '미공개 · 확인 필요',
  ]);
  await expect(page.locator('#venue-map title')).toHaveText(
    '대화역과 고양종합운동장 위치 관계 개략도',
  );
  await expect(page.locator('#venue-map desc')).toHaveText(
    '실제 입장 게이트가 아닌 이동 방향 참고용 개략도',
  );
});

test('distinguishes the six studio albums from both trilogies', async ({
  page,
}) => {
  await page.goto('/discover/');

  await expect(
    page.getByRole('heading', { name: '정규 앨범 6장' }),
  ).toBeVisible();
  await expect(
    page.getByText('House of Balloons → Thursday → Echoes of Silence'),
  ).toBeVisible();
  await expect(
    page.getByText('After Hours → Dawn FM → Hurry Up Tomorrow'),
  ).toBeVisible();
  await expect(page.getByText('한 가지 해석')).toBeVisible();
});

test('shows checked primary sources when discover disclosures open', async ({
  page,
}) => {
  await page.goto('/discover/');

  const intro = page.getByRole('group', { name: '1분 입문 더 깊이 보기' });
  await intro.locator('summary').click();
  await expect(
    intro.getByRole('link', {
      name: 'Universal Music Canada — Kiss Land 발표',
    }),
  ).toHaveAttribute(
    'href',
    'https://www.universalmusic.ca/press-releases/the-weeknds-kiss-land-to-arrive-september-10/',
  );
  await expect(intro.getByText('마지막 확인 2026.08.29').first()).toBeVisible();

  const kissLand = page.getByRole('group', {
    name: '2013 · Kiss Land 더 깊이 보기',
  });
  await kissLand.locator('summary').click();
  await expect(
    kissLand.getByRole('link', {
      name: 'Universal Music Canada — Kiss Land 발표',
    }),
  ).toBeVisible();
});

test('shows Spotify-linked official covers for the six studio albums', async ({
  page,
}) => {
  await page.goto('/discover/');

  const covers = page
    .getByRole('list', { name: '정규 앨범 6장' })
    .locator('a.album-cover');
  await expect(covers).toHaveCount(6);
  await expect(covers.first()).toHaveAttribute(
    'href',
    /^https:\/\/open\.spotify\.com\/album\//,
  );
  await expect(covers.first().locator('img')).toHaveAttribute(
    'alt',
    /앨범 커버 — Spotify에서 열기$/,
  );
  await expect(covers.first().locator('img')).toHaveAttribute(
    'referrerpolicy',
    'no-referrer',
  );
});

test('hides the mobile menu scrollbar and keeps the last item reachable', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'mobile only');
  await page.goto('/');

  const nav = page.getByRole('navigation', { name: '주요 메뉴' });
  const metrics = await nav.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      overflow: element.scrollWidth > element.clientWidth,
      scrollbarWidth: style.scrollbarWidth,
      snap: style.scrollSnapType,
    };
  });
  expect(metrics.overflow).toBe(true);
  expect(metrics.scrollbarWidth).toBe('none');
  expect(metrics.snap).toContain('x');

  const last = nav.getByRole('link', { name: '출처·업데이트' });
  await last.scrollIntoViewIfNeeded();
  const box = await last.boundingBox();
  const viewport = page.viewportSize()!;
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
});
