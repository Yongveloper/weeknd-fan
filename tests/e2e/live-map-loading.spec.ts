import { expect, test } from '@playwright/test';

const tilePattern = 'https://tile.openstreetmap.org/**';
const tile =
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e1e6d5"/></svg>';

test('loads the venue map automatically when viewed and supports zoom', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const tileZooms = new Set<number>();
  await page.route(tilePattern, async (route) => {
    tileZooms.add(
      Number(new URL(route.request().url()).pathname.split('/')[1]),
    );
    await route.fulfill({ contentType: 'image/svg+xml', body: tile });
  });
  await page.goto('/goyang/');
  const map = page.getByRole('region', {
    name: '고양종합운동장 지도',
    exact: true,
  });
  expect(tileZooms.size).toBe(0);
  await map.scrollIntoViewIfNeeded();
  await expect(map).toHaveAttribute('data-map-state', 'ready');
  await expect(map.locator('.leaflet-tile-loaded').first()).toBeVisible();
  await expect(
    map.getByRole('button', { name: '고양종합운동장', exact: true }),
  ).toBeVisible();
  await expect(
    map.getByRole('link', { name: 'OpenStreetMap contributors' }),
  ).toBeVisible();
  await map.getByRole('button', { name: '지도 확대', exact: true }).click();
  await expect.poll(() => tileZooms.has(17)).toBe(true);
  await map.getByRole('button', { name: '지도 축소', exact: true }).click();
  await expect(map.locator('[data-map-status]')).toBeHidden();
});

test('keeps directions and the official map available if map tiles fail', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route(tilePattern, (route) => route.abort());
  await page.goto('/goyang/');
  const map = page.locator('.live-map');
  await map.scrollIntoViewIfNeeded();
  await expect(map).toHaveAttribute('data-map-state', 'error');
  await expect(map.getByRole('status')).toContainText(
    '위 공식 약도와 길찾기 버튼',
  );
  await expect(
    page.getByRole('link', { name: '구글맵 길찾기' }),
  ).toHaveAttribute('href', /google\.com\/maps\/dir/);
  await expect(page.locator('.access-map img')).toBeVisible();
});

test('keeps the official map and directions usable without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(test.info().project.use.baseURL + '/goyang/');
  await expect(page.locator('.live-map [data-map-status]')).toContainText(
    '위 공식 약도',
  );
  await expect(page.locator('.access-map img')).toBeVisible();
  await expect(
    page.getByRole('link', { name: '카카오맵 길찾기' }),
  ).toHaveAttribute('href', /map\.kakao\.com/);
  await context.close();
});
