import { expect, test } from '@playwright/test';
import { useClock } from './helpers/clock';
import { tabUntilFocused } from './helpers/accessibility';

async function openPrimaryNav(page: import('@playwright/test').Page) {
  const menu = page
    .getByRole('navigation', { name: '주요 메뉴' })
    .getByText('메뉴');
  if (await menu.isVisible()) await menu.click();
}

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

test('keeps the Korean phrase 한 장씩 intact in the Discover heading on narrow screens', async ({
  page,
}) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/discover/');

    const metrics = await page
      .locator('.discover__hero h1')
      .evaluate(async (heading) => {
        await document.fonts.ready;
        const phrase = '한 장씩';
        const nodes: Array<{ node: Text; start: number; end: number }> = [];
        const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
        let text = '';
        let node = walker.nextNode() as Text | null;
        while (node) {
          nodes.push({
            node,
            start: text.length,
            end: text.length + node.length,
          });
          text += node.data;
          node = walker.nextNode() as Text | null;
        }

        const start = text.indexOf(phrase);
        const end = start + phrase.length;
        const startNode = nodes.find(
          ({ start: nodeStart, end: nodeEnd }) =>
            start >= nodeStart && start < nodeEnd,
        );
        const endNode = nodes.find(
          ({ start: nodeStart, end: nodeEnd }) =>
            end > nodeStart && end <= nodeEnd,
        );
        if (!startNode || !endNode)
          throw new Error('Discover heading phrase missing');

        const range = document.createRange();
        range.setStart(startNode.node, start - startNode.start);
        range.setEnd(endNode.node, end - endNode.start);
        return {
          phraseLines: new Set(
            Array.from(range.getClientRects(), (rect) => Math.round(rect.top)),
          ).size,
          headingFits: heading.scrollWidth <= heading.clientWidth,
        };
      });

    expect(metrics.phraseLines).toBe(1);
    expect(metrics.headingFits).toBe(true);
  }
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
  const mainNav = page.getByRole('navigation', { name: '주요 메뉴' });
  await expect(mainNav).toBeVisible();
  await expect(
    page.getByText('비공식·비영리 팬 가이드', { exact: true }),
  ).toBeVisible();
  await openPrimaryNav(page);
  await expect(
    mainNav.getByRole('link', { name: '예상 셋리스트' }),
  ).toHaveAttribute('href', '/setlist/');
  await expect(
    mainNav.getByRole('link', { name: '고양 가이드' }),
  ).toHaveAttribute('href', '/goyang/');

  const footerNav = page.getByRole('navigation', { name: '사이트 지도' });
  await expect(
    footerNav.getByRole('link', { name: '출처·업데이트' }),
  ).toHaveAttribute('href', '/sources/');
  await expect(
    page.getByText(/공식 정보 마지막 확인 \d{4}\.\d{2}\.\d{2}/),
  ).toBeVisible();
});

test('opens and closes the mobile menu from the keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 652, height: 526 });
  await page.goto('/');

  const menu = page.getByRole('group', { name: '주요 메뉴' }).getByText('메뉴');
  const details = page.getByRole('group', { name: '주요 메뉴' });
  const list = page.locator('.site-header__nav-list');
  const firstLink = page
    .getByRole('navigation', { name: '주요 메뉴' })
    .getByRole('link')
    .first();
  await expect(details).not.toHaveAttribute('open', '');
  await expect
    .poll(() => list.evaluate((element) => element.clientHeight))
    .toBe(0);
  await tabUntilFocused(page, menu);
  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open', '');
  await expect(firstLink).toBeVisible();
  await expect
    .poll(() => list.evaluate((element) => element.clientHeight))
    .toBeGreaterThan(0);
  await page.keyboard.press('Enter');
  await expect(details).not.toHaveAttribute('open', '');
  await expect
    .poll(() => list.evaluate((element) => element.clientHeight))
    .toBe(0);
});

test('keeps the header in the same fonts across page navigations', async ({
  page,
}) => {
  const headerMetrics = () =>
    page.evaluate(async () => {
      await document.fonts.ready;
      const links = [
        ...document.querySelectorAll('nav[aria-label="주요 메뉴"] a'),
      ];
      const wordmark = document.querySelector('.site-header__wordmark')!;
      return {
        widths: links.map((link) =>
          Math.round(link.getBoundingClientRect().width),
        ),
        wordmark: Math.round(wordmark.getBoundingClientRect().width),
        navLoaded: document.fonts.check(
          "700 16px 'Noto Sans KR Header'",
          '예상 셋리스트',
        ),
        wordmarkLoaded: document.fonts.check(
          "400 16px 'Bebas Neue Header'",
          'DAWNFOLD',
        ),
      };
    });

  await page.goto('/');
  await expect(
    page.locator('link[rel="preload"][as="font"]').first(),
  ).toHaveAttribute('crossorigin', '');
  const first = await headerMetrics();
  expect(first.navLoaded).toBe(true);
  expect(first.wordmarkLoaded).toBe(true);

  for (const href of ['/discover/', '/setlist/', '/goyang/']) {
    await openPrimaryNav(page);
    await page
      .getByRole('navigation', { name: '주요 메뉴' })
      .getByRole('link')
      .filter({ has: page.locator(`[href="${href}"]`) })
      .or(page.locator(`nav[aria-label="주요 메뉴"] a[href="${href}"]`))
      .first()
      .click();
    await page.waitForURL(`**${href}`);
    expect(await headerMetrics()).toEqual(first);
  }
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

  const concertSourceUsage = page
    .locator('li')
    .filter({ hasText: 'Live Nation Korea 고양 공연' })
    .locator('.source-usage');
  await expect(concertSourceUsage.getByText('사용 위치')).toBeVisible();
  await expect(concertSourceUsage.getByRole('link')).toHaveText([
    '홈',
    '고양 가이드',
  ]);
  await expect(concertSourceUsage.getByRole('link').nth(0)).toHaveAttribute(
    'href',
    '/',
  );

  const observedSetlistUsage = page
    .locator('li')
    .filter({ hasText: 'setlist.fm — Manchester, 2026-06-12' })
    .locator('.source-usage');
  await expect(observedSetlistUsage.getByRole('link')).toHaveText([
    '홈',
    '예상 셋리스트',
  ]);
  await expect(
    page
      .locator('li')
      .filter({ hasText: 'Spotify — After Hours 앨범' })
      .locator('.source-usage'),
  ).toHaveCount(0);
});

test('keeps navigation targets touch-sized in every viewport', async ({
  page,
}) => {
  await page.goto('/');
  await openPrimaryNav(page);

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

test('uses replace for typing and push for filters across browser history', async ({
  page,
}) => {
  await page.goto('/');
  await page.goto('/setlist/');

  const explorer = page.locator('.expected-setlist');
  const search = explorer.getByRole('searchbox', { name: '곡 검색' });
  const album = explorer.getByLabel('앨범으로 고르기');
  const homeUrl = new URL('/', page.url()).toString();
  const allSongIds = [
    '01-baptized-in-fear',
    '02-open-hearts',
    '03-wake-me-up',
    '04-after-hours',
    '05-starboy',
    '06-heartless',
    '07-faith',
    '08-cry-for-me',
    '09-sao-paulo',
    '10-until-were-skin-and-bones',
    '11-take-my-breath',
    '12-sacrifice',
    '13-how-do-i-make-you-love-me',
    '14-cant-feel-my-face',
    '15-lost-in-the-fire',
    '16-often',
    '17-given-up-on-me',
    '18-i-was-never-there',
    '19-the-hills',
    '20-timeless',
    '21-rather-lie',
    '22-creepin',
    '23-niagara-falls',
    '24-one-of-the-girls',
    '25-stargirl-interlude',
    '26-out-of-time',
    '27-i-feel-it-coming',
    '28-die-for-you',
    '29-is-there-someone-else',
    '30-wicked-games',
    '31-call-out-my-name',
    '32-the-abyss',
    '33-save-your-tears',
    '34-less-than-zero',
    '35-blinding-lights',
    '36-without-a-warning',
    '37-house-of-balloons',
    '38-moth-to-a-flame',
  ];
  const visibleRows = explorer.locator(
    '[data-setlist-list] > li:not([hidden])',
  );
  const expectState = async ({
    url,
    query,
    albumValue,
    rowIds,
  }: {
    url: RegExp;
    query: string;
    albumValue: string;
    rowIds: string[];
  }) => {
    await expect(page).toHaveURL(url);
    await expect(search).toHaveValue(query);
    await expect(album).toHaveValue(albumValue);
    await expect(explorer.locator('[data-setlist-view="all"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(explorer.getByRole('status')).toHaveText(
      `${rowIds.length}곡 표시`,
    );
    await expect(visibleRows).toHaveCount(rowIds.length);
    await expect
      .poll(() =>
        visibleRows.evaluateAll((rows) =>
          rows.map((row) => row.getAttribute('data-song-id')),
        ),
      )
      .toEqual(rowIds);
  };

  await expectState({
    url: /\/setlist\/$/,
    query: '',
    albumValue: '',
    rowIds: allSongIds,
  });
  await expect(
    explorer.getByRole('button', { name: '3분 핵심 10곡' }),
  ).toHaveCount(0);

  await tabUntilFocused(page, search);
  await search.pressSequentially('after');
  await expectState({
    url: /\/setlist\/\?q=after$/,
    query: 'after',
    albumValue: '',
    rowIds: ['04-after-hours'],
  });

  await album.selectOption('After Hours');
  await expectState({
    url: /\/setlist\/\?q=after&album=After\+Hours$/,
    query: 'after',
    albumValue: 'After Hours',
    rowIds: ['04-after-hours'],
  });

  await explorer.getByRole('button', { name: '초기화' }).click();
  await expectState({
    url: /\/setlist\/$/,
    query: '',
    albumValue: '',
    rowIds: allSongIds,
  });

  await page.goBack();
  await expectState({
    url: /\/setlist\/\?q=after&album=After\+Hours$/,
    query: 'after',
    albumValue: 'After Hours',
    rowIds: ['04-after-hours'],
  });
  await page.goBack();
  await expectState({
    url: /\/setlist\/\?q=after$/,
    query: 'after',
    albumValue: '',
    rowIds: ['04-after-hours'],
  });
  await page.goBack();
  await expect(page).toHaveURL(homeUrl);
  await page.goForward();
  await expectState({
    url: /\/setlist\/\?q=after$/,
    query: 'after',
    albumValue: '',
    rowIds: ['04-after-hours'],
  });
  await page.goForward();
  await expectState({
    url: /\/setlist\/\?q=after&album=After\+Hours$/,
    query: 'after',
    albumValue: 'After Hours',
    rowIds: ['04-after-hours'],
  });
  await page.goForward();
  await expectState({
    url: /\/setlist\/$/,
    query: '',
    albumValue: '',
    rowIds: allSongIds,
  });
});

test('reaches every setlist filter control and clear action by keyboard', async ({
  page,
}) => {
  await page.goto('/setlist/');
  const explorer = page.locator('.expected-setlist');
  const search = explorer.getByRole('searchbox', { name: '곡 검색' });
  const album = explorer.getByLabel('앨범으로 고르기');
  const all = explorer.getByRole('button', { name: '전체' });
  const essential = explorer.getByRole('button', { name: '3분 핵심 10곡' });
  const reset = explorer.getByRole('button', { name: '초기화' });

  const hasEssential = (await essential.count()) > 0;
  const controls = [search, album, all, reset];
  if (hasEssential) controls.splice(3, 0, essential);
  for (const control of controls) {
    await tabUntilFocused(page, control);
    await expect(control).toBeFocused();
    await expect(control).toBeVisible();
  }
  await tabUntilFocused(page, search);
  await page.keyboard.type('after');
  await expect(explorer.getByRole('status')).toHaveText('1곡 표시');
  await tabUntilFocused(page, reset);
  await page.keyboard.press('Shift+Tab');
  await expect(hasEssential ? essential : all).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(reset).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(search).toHaveValue('');
  await expect(explorer.getByRole('status')).toHaveText('38곡 표시');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('keeps source groups and source links readable', async ({ page }) => {
    await page.goto('/sources/');
    for (const heading of ['공식', '공공 교통', '공연 기록', '보조 참고']) {
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    }
    await expect(
      page.getByRole('link', { name: 'Live Nation Korea 고양 공연' }),
    ).toBeVisible();
  });
});

test('announces a zero-result expected-song search', async ({ page }) => {
  await page.goto('/setlist/');

  const explorer = page.locator('.expected-setlist');
  const search = explorer.getByRole('searchbox', { name: '곡 검색' });
  await tabUntilFocused(page, search);
  await search.pressSequentially('zzzz');

  await expect(explorer.getByRole('status')).toHaveText('0곡 표시');
  await expect(
    explorer.locator('[data-setlist-list] > li:not([hidden])'),
  ).toHaveCount(0);
  await expect(
    explorer.getByText('검색 결과가 없습니다.', { exact: true }),
  ).toBeVisible();
});

test('moves focus to the result count when filtering hides an open song', async ({
  page,
}) => {
  await page.goto('/setlist/');

  const explorer = page.locator('.expected-setlist');
  const firstSong = explorer.locator('summary').first();
  await tabUntilFocused(page, firstSong);
  await page.keyboard.press('Space');
  await expect(explorer.locator('details').first()).toHaveAttribute('open', '');

  const search = explorer.getByRole('searchbox', { name: '곡 검색' });
  await tabUntilFocused(page, search);
  await page.keyboard.type('after');
  await expect(explorer.getByRole('status')).toBeFocused();
  await expect(explorer.locator('details').first()).not.toHaveAttribute(
    'open',
    '',
  );
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

  await tabUntilFocused(page, firstSong);
  await page.keyboard.press('Space');
  await expect(explorer.locator('details').first()).toHaveAttribute('open', '');
  await tabUntilFocused(page, secondSong);
  await page.keyboard.press('Enter');
  await expect(explorer.locator('details').nth(1)).toHaveAttribute('open', '');
});

test('keeps the ordered prediction and trust label usable without JavaScript', async ({
  browser,
}, testInfo) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL: testInfo.project.use.baseURL,
  });
  const page = await context.newPage();

  await page.goto('/setlist/');

  const explorer = page.locator('.expected-setlist');
  await expect(explorer.getByText('예상 · 보장 아님').first()).toBeVisible();
  await expect(explorer.locator('summary').first()).toHaveText(
    /^\s*01 Baptized in Fear/,
  );
  await expect(explorer.locator('summary').nth(37)).toHaveText(
    /^\s*38 Moth to a Flame/,
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
  await expect(shortcuts.getByRole('link')).toHaveText([
    '공식 공연 정보 →',
    '가는 길 →',
    '좌석 안내 →',
    '준비물 →',
    '귀가 확인 →',
  ]);
  await expect(shortcuts.getByRole('link').nth(0)).toHaveAttribute(
    'href',
    '/goyang/#official',
  );
  await expect(shortcuts.getByRole('link').nth(1)).toHaveAttribute(
    'href',
    '/goyang/#transport',
  );
  await expect(shortcuts.getByRole('link').nth(2)).toHaveAttribute(
    'href',
    '/goyang/#seating',
  );
  await expect(shortcuts.getByRole('link').nth(3)).toHaveAttribute(
    'href',
    '/goyang/#packing',
  );
  await expect(shortcuts.getByRole('link').nth(4)).toHaveAttribute(
    'href',
    '/goyang/#return',
  );
});

test('opens transport and return information within two actions', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: '가는 길' }).click();

  await expect(page).toHaveURL(/\/goyang\/#transport$/);
  await expect(page.getByRole('heading', { name: '가는 길' })).toBeVisible();
  await expect(
    page
      .locator('#transport .guide-section__body')
      .getByText('대화역(3호선) 3번 출구'),
  ).toBeVisible();
  await expect(page.locator('#transport .status')).toHaveText('실용 안내');
  await expect(page.locator('#official .status')).toHaveText('공식 확정');
  await expect(page.getByText('막차와 귀가 동선')).toBeVisible();
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

  const pending = page.locator('#pending');
  await expect(
    pending.locator('.guide-section__heading > p:last-child'),
  ).toContainText('아래 여섯 운영 항목');
  await expect(pending.locator('.pending-list strong')).toHaveText([
    '입장 게이트',
    '반입 금지 물품',
    '교통 통제',
    '순환버스 세부 운영',
    '접근성 지원',
    '스탠딩·Early Entry 운영',
  ]);
  await expect(pending.locator('.status')).toHaveCount(6);
  await expect(pending.locator('.status')).toHaveText(
    Array(6).fill('미공개 · 확인 필요'),
  );
  await expect(pending.locator('.pending-list')).not.toContainText(
    '셔틀·교통 통제',
  );
  await expect(page.locator('#transport .access-map img')).toHaveAttribute(
    'alt',
    /인터파크 오는 길 안내/,
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
  await expect(intro).toHaveAttribute('open', '');
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

test('exposes every primary route without horizontal scrolling on mobile', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'mobile only');
  await page.goto('/');

  await page
    .getByRole('group', { name: '주요 메뉴' })
    .getByText('메뉴')
    .click();
  const nav = page.getByRole('navigation', { name: '주요 메뉴' });
  await expect(nav.getByRole('link')).toHaveCount(5);
  for (const link of await nav.getByRole('link').all()) {
    await expect(link).toBeVisible();
  }
  expect(
    await nav.evaluate((element) => element.scrollWidth - element.clientWidth),
  ).toBeLessThanOrEqual(1);
});

test('synchronizes the header menu when resizing across the mobile breakpoint', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'desktop only');
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');

  const menu = page.getByRole('group', { name: '주요 메뉴' });
  await expect(menu).toHaveAttribute('open', '');

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(menu).not.toHaveAttribute('open', '');

  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(menu).toHaveAttribute('open', '');
  const links = page
    .getByRole('navigation', { name: '주요 메뉴' })
    .getByRole('link');
  await expect(links).toHaveCount(5);
  for (const link of await links.all()) {
    await expect(link).toBeVisible();
  }
});

test('places covers beside every album mention on home, discover, and setlist', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.home-entry--intro a.album-cover')).toHaveCount(3);

  await page.goto('/discover/');
  await expect(page.locator('.trilogies__sequence a.album-cover')).toHaveCount(
    6,
  );
  const kissLand = page.locator('.timeline__entry', {
    hasText: '2013 · Kiss Land',
  });
  await expect(kissLand.locator('a.album-cover')).toHaveCount(1);

  await page.goto('/setlist/');
  const firstSong = page.locator('.expected-setlist__list details').first();
  await firstSong.locator('summary').click();
  await expect(firstSong.locator('a.album-cover')).toHaveCount(1);

  await page.goto('/sources/');
  await expect(
    page.getByText('앨범 커버는 Spotify CDN에서 직접 불러옵니다'),
  ).toBeVisible();
});

test('states what the site is, who it is for, and where the official notice lives', async ({
  page,
}) => {
  await useClock(page, '2026-08-29T09:00:00+09:00');
  await page.goto('/');

  await expect(page.getByText('THE WEEKND · 비공식 팬 팜플렛')).toBeVisible();
  await expect(page.getByText('만 19세 이상')).toBeVisible();
  await expect(page.getByRole('link', { name: '공식 공지' })).toHaveAttribute(
    'href',
    'https://tickets.interpark.com/contents/notice/detail/14180',
  );
  await expect(page.locator('eclipse-countdown [data-caption]')).toHaveText(
    /공연까지$/,
  );
  await expect(page.getByText('THE WEEKND · GOYANG 26')).toBeVisible();
  await expect(
    page.getByText('브라우저에서만 만들어지는 이미지 한 장').first(),
  ).toBeVisible();

  await page.goto('/setlist/');
  await expect(
    page.getByText('곡을 누르면 관람 포인트·떼창·공식 듣기가 열립니다.'),
  ).toBeVisible();
  const firstSummary = page.locator('.expected-setlist__list summary').first();
  await expect(firstSummary.locator('.disclosure__chevron')).toHaveCount(1);
});
