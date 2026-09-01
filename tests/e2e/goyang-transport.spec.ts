import { expect, test } from '@playwright/test';

const metroAreas = [
  '잠실역',
  '서울역',
  '합정역',
  '사당역',
  '강남역',
  '노원역',
  '왕십리역',
  '신도림역',
  '미금역',
  '영통역',
  '부평역',
];
const regionalAreas = ['대전', '대구', '전주', '광주', '부산', '천안', '청주'];

test('shows official parking and shuttle guidance before the existing access table', async ({
  page,
}) => {
  await page.goto('/goyang/');
  const transport = page.locator('#transport');
  const operations = transport.getByRole('region', {
    name: '공식 교통 운영 안내',
  });

  await expect(operations).toContainText('공연장 내부 주차 불가');
  await expect(operations).toContainText('대중교통 이용을 권장');
  await expect(operations).toContainText(
    'GTX-A 킨텍스역 1번 출구 ↔ 고양종합운동장',
  );
  await expect(operations).toContainText('유료 순환버스 임시 운영 예정');
  await expect(operations).toContainText(
    '운행 시간 · 요금 · 배차 간격 · 운동장 승차 위치는 미공개',
  );

  const access = transport.locator('.access-table');
  await expect(
    transport.locator('.transport-operations + .access-table'),
  ).toHaveCount(1);
  await expect(access.getByText('3호선 대화역 3번 출구')).toHaveCount(1);
  await expect(operations.getByText('3호선 대화역 3번 출구')).toHaveCount(0);
  await expect(access.getByText('M7731')).toHaveCount(1);
});

test('lists every Kakao T shuttle origin and links to booking', async ({
  page,
}) => {
  await page.goto('/goyang/');
  const transport = page.locator('#transport');
  const booking = transport.getByRole('link', { name: /카카오 T 셔틀 예약/ });
  await expect(booking).toHaveAttribute('href', 'https://kko.to/NSrfta0uxT');
  await expect(booking).toHaveAttribute('target', '_blank');
  await expect(booking).toHaveAttribute('rel', /noreferrer/);

  await expect(
    transport
      .getByRole('list', { name: '카카오 T 셔틀 수도권 출발지' })
      .getByRole('listitem'),
  ).toHaveText(metroAreas);
  await expect(
    transport
      .getByRole('list', { name: '카카오 T 셔틀 지방 출발지' })
      .getByRole('listitem'),
  ).toHaveText(regionalAreas);
  await expect(transport).toContainText(
    '자세한 사항은 카카오 T 앱과 예약 전 유의사항에서 확인',
  );
});

test('shows the confirmed return options and same-day SMS caveat', async ({
  page,
}) => {
  await page.goto('/goyang/');
  const returning = page.locator('#return');
  await expect(returning).toContainText('유료 순환버스');
  await expect(returning).toContainText(
    '운행 시간·요금·배차 간격·운동장 승차 위치는 아직 공개되지 않았습니다',
  );
  await expect(returning).toContainText(
    '귀가행 시간과 탑승지는 현장 상황에 따라 변경될 수 있으며',
  );
  await expect(returning).toContainText('공연 당일 안내 문자를 확인');
});

test('keeps transport guidance within narrow viewports', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/goyang/');
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow, `${width}px document overflow`).toBeLessThanOrEqual(1);
  }
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('keeps the parking, shuttle, booking, and return guidance visible', async ({
    page,
  }) => {
    await page.goto('/goyang/');
    await expect(page.getByText('공연장 내부 주차 불가')).toBeVisible();
    await expect(page.getByText('유료 순환버스 임시 운영 예정')).toBeVisible();
    await expect(
      page.getByRole('link', { name: /카카오 T 셔틀 예약/ }),
    ).toBeVisible();
    await expect(page.locator('#return')).toContainText(
      '공연 당일 안내 문자를 확인',
    );
  });
});
