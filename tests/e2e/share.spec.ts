import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import {
  expectNoHorizontalDocumentOverflow,
  expectVisibleControlsInsideViewport,
  tabUntilFocused,
} from './helpers/accessibility';

async function chooseSongWithKeyboard(
  page: import('@playwright/test').Page,
  select: import('@playwright/test').Locator,
  optionIndex: number,
) {
  await tabUntilFocused(page, select);
  const option = select.locator('option').nth(optionIndex);
  await page.keyboard.type((await option.textContent())?.trim() ?? '');
  await page.keyboard.press('Enter');
  await expect(select).toHaveValue((await option.getAttribute('value')) ?? '');
}

async function expectJpegCard(
  download: import('@playwright/test').Download,
  path: string,
) {
  await download.saveAs(path);
  const bytes = await readFile(path);
  expect(bytes.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));

  for (let index = 2; index < bytes.length - 9; index += 1) {
    if (bytes[index] !== 0xff) continue;
    const marker = bytes[index + 1];
    if (marker === undefined) break;
    if (
      marker === 0xd8 ||
      marker === 0xd9 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      continue;
    }
    const length = bytes.readUInt16BE(index + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      expect(bytes.readUInt16BE(index + 5)).toBe(1350);
      expect(bytes.readUInt16BE(index + 7)).toBe(1080);
      return;
    }
    index += length + 1;
  }
  throw new Error('JPEG start-of-frame marker was not found');
}

test('creates a ticket download without submission or browser storage', async ({
  page,
}, testInfo) => {
  const apiRequests: string[] = [];
  page.on('request', (request) => {
    if (/\/api\//.test(request.url())) apiRequests.push(request.url());
  });
  await page.goto('/share/ticket/');

  const button = page.getByRole('button', { name: 'D-day 티켓 저장' });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.getByRole('alert')).toHaveText(
    '서로 다른 세 곡을 선택해 주세요.',
  );
  await page.getByLabel('첫 번째 곡').selectOption({ index: 1 });
  await expect(
    page.getByLabel('두 번째 곡').locator('option').nth(1),
  ).toHaveAttribute('disabled', '');
  await page.getByLabel('두 번째 곡').selectOption({ index: 2 });
  await page.getByLabel('세 번째 곡').selectOption({ index: 3 });
  await expect(page.getByRole('alert')).toBeHidden();

  const download = page.waitForEvent('download');
  await button.click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('weeknd-goyang-dday-ticket.jpg');
  await expectJpegCard(file, testInfo.outputPath(file.suggestedFilename()));
  expect(apiRequests).toEqual([]);
  await expect
    .poll(() =>
      page.evaluate(() => [localStorage.length, sessionStorage.length]),
    )
    .toEqual([0, 0]);
});

test('redraws the ticket preview and blocks a duplicate download while generating', async ({
  page,
}) => {
  await page.addInitScript(() => {
    let downloads = 0;
    const createObjectUrl = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object) => {
      downloads += 1;
      return createObjectUrl(object);
    };
    Object.defineProperty(window, '__ticketDownloads', {
      get: () => downloads,
    });
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
      setTimeout(
        () =>
          HTMLCanvasElement.prototype.toDataURL.call(this, type, quality) &&
          callback(new Blob(['ticket'], { type: 'image/jpeg' })),
        50,
      );
    };
  });
  await page.goto('/share/ticket/');
  const preview = page.locator('[data-ticket-builder] [data-preview]');
  await expect(preview).toBeVisible();

  const before = await preview.evaluate((canvas) =>
    (canvas as HTMLCanvasElement).toDataURL(),
  );
  await page.getByLabel('첫 번째 곡').selectOption({ index: 1 });
  await expect
    .poll(() =>
      preview.evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL()),
    )
    .not.toBe(before);

  const beforeDateChange = await preview.evaluate((canvas) =>
    (canvas as HTMLCanvasElement).toDataURL(),
  );
  await page.locator('input[name="show-date"][value="2026-10-08"]').check();
  await expect
    .poll(() =>
      preview.evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL()),
    )
    .not.toBe(beforeDateChange);

  await page.getByLabel('두 번째 곡').selectOption({ index: 2 });
  await page.getByLabel('세 번째 곡').selectOption({ index: 3 });
  const button = page.getByRole('button', { name: 'D-day 티켓 저장' });
  const download = page.waitForEvent('download');
  await button.evaluate((element) => {
    (element as HTMLButtonElement).click();
    (element as HTMLButtonElement).click();
  });
  await expect(button).toBeDisabled();
  await expect(page.locator('[data-status]')).toHaveText(
    '이미지를 생성하고 있습니다…',
  );
  await download;
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { __ticketDownloads: number })
            .__ticketDownloads,
      ),
    )
    .toBe(1);
});

test('offers native file sharing only after a supported ticket generation', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: () => true,
    });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: () => Promise.resolve(),
    });
  });
  await page.goto('/share/ticket/');
  await expect(
    page.getByRole('button', { name: '공유', exact: true }),
  ).toHaveCount(0);
  await page.getByLabel('첫 번째 곡').selectOption({ index: 1 });
  await page.getByLabel('두 번째 곡').selectOption({ index: 2 });
  await page.getByLabel('세 번째 곡').selectOption({ index: 3 });
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'D-day 티켓 저장' }).click();
  await download;
  await page.getByRole('button', { name: '공유', exact: true }).click();
  await expect(page.locator('[data-status]')).toHaveText(
    '티켓 이미지를 공유했습니다.',
  );
});

test('keeps download and copy options after native share is cancelled', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: () => true,
    });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: () => Promise.reject(new DOMException('Cancelled', 'AbortError')),
    });
  });
  await page.goto('/share/setlist/');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '셋리스트 카드 저장' }).click();
  await download;
  await page.getByRole('button', { name: '공유', exact: true }).click();
  await expect(page.getByRole('alert')).toBeHidden();
  await expect(page.locator('[data-status]')).toContainText(
    '공유를 취소했습니다',
  );
  await expect(
    page.getByRole('button', { name: '텍스트 공유 문구 복사' }),
  ).toBeVisible();
});

test('announces native share failures other than user cancellation', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: () => true,
    });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: () => Promise.reject(new Error('share transport failed')),
    });
  });
  await page.goto('/share/setlist/');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '셋리스트 카드 저장' }).click();
  await download;
  await page.getByRole('button', { name: '공유', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText(
    '공유에 실패했습니다. JPEG를 저장하거나 문구를 복사해 주세요.',
  );

  await page.goto('/share/ticket/');
  await page.getByLabel('첫 번째 곡').selectOption({ index: 1 });
  await page.getByLabel('두 번째 곡').selectOption({ index: 2 });
  await page.getByLabel('세 번째 곡').selectOption({ index: 3 });
  const ticketDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'D-day 티켓 저장' }).click();
  await ticketDownload;
  await page.getByRole('button', { name: '공유', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText(
    '공유에 실패했습니다. JPEG를 저장하거나 문구를 복사해 주세요.',
  );
});

test('does not add native sharing where file sharing is unsupported', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: () => {},
    });
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: () => false,
    });
  });
  await page.goto('/share/setlist/');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '셋리스트 카드 저장' }).click();
  await download;
  await expect(
    page.getByRole('button', { name: '공유', exact: true }),
  ).toHaveCount(0);
});

test('creates the expected-setlist JPEG without personal input', async ({
  page,
}, testInfo) => {
  const apiRequests: string[] = [];
  page.on('request', (request) => {
    if (/\/api\//.test(request.url())) apiRequests.push(request.url());
  });
  await page.goto('/share/setlist/');
  await expect(page.getByText('예상 · 보장 아님', { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByText(
      '이미지는 이 브라우저 안에서만 생성되며 선택값을 저장하지 않습니다.',
      { exact: true },
    ),
  ).toBeVisible();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '셋리스트 카드 저장' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('weeknd-goyang-expected-setlist.jpg');
  await expectJpegCard(file, testInfo.outputPath(file.suggestedFilename()));
  expect(apiRequests).toEqual([]);
});

test('shows a visible error when ticket JPEG creation returns no blob', async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.toBlob = function (callback) {
      callback(null);
    };
  });
  await page.goto('/share/ticket/');
  await page.getByLabel('첫 번째 곡').selectOption({ index: 1 });
  await page.getByLabel('두 번째 곡').selectOption({ index: 2 });
  await page.getByLabel('세 번째 곡').selectOption({ index: 3 });
  await page.getByRole('button', { name: 'D-day 티켓 저장' }).click();
  await expect(page.getByRole('alert')).toContainText(
    '이미지 생성에 실패했습니다',
  );
  await expect(
    page.getByRole('link', { name: '기본 공유 이미지 보기' }),
  ).toHaveAttribute('href', '/og/default.jpg');
  await expect(
    page.getByRole('button', { name: '텍스트 공유 문구 복사' }),
  ).toBeVisible();
});

test('keeps setlist fallback alternatives available after JPEG failure', async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.toBlob = function (callback) {
      callback(null);
    };
  });
  await page.goto('/share/setlist/');
  await page.getByRole('button', { name: '셋리스트 카드 저장' }).click();
  await expect(page.getByRole('alert')).toContainText(
    '이미지 생성에 실패했습니다',
  );
  await expect(
    page.getByRole('link', { name: '기본 공유 이미지 보기' }),
  ).toHaveAttribute('href', '/og/default.jpg');
  await expect(
    page.getByRole('button', { name: '텍스트 공유 문구 복사' }),
  ).toBeVisible();
});

test('copies the current absolute share route and exposes it as manual fallback text', async ({
  context,
  page,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/share/ticket/');
  const expectedUrl = new URL('/share/ticket/', page.url()).href;
  await expect(page.locator('[data-share-url]')).toHaveText(expectedUrl);
  await page.getByRole('button', { name: '텍스트 공유 문구 복사' }).click();
  await expect(page.locator('[data-status]')).toHaveText(
    '텍스트 공유 문구를 복사했습니다.',
  );
  await expect(
    page.evaluate(() => navigator.clipboard.readText()),
  ).resolves.toContain(expectedUrl);
});

test('explains the manual fallback when clipboard access is unavailable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined });
  });
  await page.goto('/share/setlist/');
  await page.getByRole('button', { name: '텍스트 공유 문구 복사' }).click();
  await expect(page.locator('[data-status]')).toContainText(
    '직접 복사해 주세요',
  );
});

test('keeps share primary actions and fallback controls reachable on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  for (const route of ['/share/ticket/', '/share/setlist/']) {
    await page.goto(route);
    await expectNoHorizontalDocumentOverflow(page);
    await expectVisibleControlsInsideViewport(page);
    await expect(page.getByRole('button', { name: /저장/ })).toBeVisible();
    await expect(
      page.getByRole('button', { name: '텍스트 공유 문구 복사' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: '기본 공유 이미지 보기' }),
    ).toBeVisible();
  }
});

test('completes share exports and fallback actions from the keyboard', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined });
  });

  await page.goto('/share/ticket/');
  const ticketButton = page.getByRole('button', { name: 'D-day 티켓 저장' });
  await tabUntilFocused(page, ticketButton);
  await page.keyboard.press('Space');
  await expect(page.getByRole('alert')).toHaveText(
    '서로 다른 세 곡을 선택해 주세요.',
  );
  await chooseSongWithKeyboard(page, page.getByLabel('첫 번째 곡'), 1);
  await chooseSongWithKeyboard(page, page.getByLabel('두 번째 곡'), 2);
  await chooseSongWithKeyboard(page, page.getByLabel('세 번째 곡'), 3);
  await tabUntilFocused(page, ticketButton);
  const ticketDownload = page.waitForEvent('download');
  await page.keyboard.press('Enter');
  await ticketDownload;
  const ticketCopy = page.getByRole('button', {
    name: '텍스트 공유 문구 복사',
  });
  await tabUntilFocused(page, ticketCopy);
  await page.keyboard.press('Space');
  await expect(page.locator('[data-status]')).toContainText(
    '직접 복사해 주세요',
  );

  await page.goto('/share/setlist/');
  const setlistButton = page.getByRole('button', {
    name: '셋리스트 카드 저장',
  });
  await tabUntilFocused(page, setlistButton);
  const setlistDownload = page.waitForEvent('download');
  await page.keyboard.press('Space');
  await setlistDownload;
  await tabUntilFocused(
    page,
    page.getByRole('button', {
      name: '텍스트 공유 문구 복사',
    }),
  );
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-status]')).toContainText(
    '직접 복사해 주세요',
  );
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('keeps ticket labels and privacy fallback copy visible', async ({
    page,
  }) => {
    await page.goto('/share/ticket/');
    for (const label of ['관람일', '첫 번째 곡', '두 번째 곡', '세 번째 곡']) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(page.getByText(/선택값을 저장하지 않습니다/)).toBeVisible();
    await expect(page.getByText('이미지 저장이 안 되면')).toBeVisible();
  });

  test('keeps setlist facts and manual fallback copy visible', async ({
    page,
  }) => {
    await page.goto('/share/setlist/');
    await expect(
      page.getByText('예상 · 보장 아님', { exact: true }),
    ).toHaveCount(0);
    await expect(page.getByText('담기는 곡', { exact: true })).toBeVisible();
    await expect(page.getByText('기준', { exact: true })).toBeVisible();
    await expect(
      page.getByText(/이미지는 이 브라우저 안에서만 생성/),
    ).toBeVisible();
    await expect(page.getByText('이미지 저장이 안 되면')).toBeVisible();
    await expect(
      page.getByRole('link', { name: '기본 공유 이미지 보기' }),
    ).toBeVisible();
  });
});
