import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

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
  await expect(button).toBeDisabled();
  await page.getByLabel('첫 번째 곡').selectOption({ index: 1 });
  await expect(
    page.getByLabel('두 번째 곡').locator('option').nth(1),
  ).toHaveAttribute('disabled', '');
  await page.getByLabel('두 번째 곡').selectOption({ index: 2 });
  await page.getByLabel('세 번째 곡').selectOption({ index: 3 });
  await expect(button).toBeEnabled();

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

test('creates the expected-setlist JPEG without personal input', async ({
  page,
}, testInfo) => {
  const apiRequests: string[] = [];
  page.on('request', (request) => {
    if (/\/api\//.test(request.url())) apiRequests.push(request.url());
  });
  await page.goto('/share/setlist/');
  await expect(
    page.getByText('예상 · 보장 아님', { exact: true }),
  ).toBeVisible();
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
