/**
 * Korean is the type source for every dictionary: a key missing from
 * `en.ts` fails `astro check` rather than rendering blank.
 *
 * Rules
 * - Whole sentences only. Never assemble a sentence from fragments.
 * - Interpolate data slots (numbers, dates) only; the words around the slot
 *   belong to the locale.
 * - English plurals get explicit `one` / `other` variants.
 * - Proper nouns come from `../proper-nouns`, never from here.
 */
export const ko = {
  chrome: {
    skipToContent: '본문으로 건너뛰기',
    primaryMenu: '주요 메뉴',
    menu: '메뉴',
    localeSwitcher: '언어',
    homeSuffix: '고양 팬 가이드 홈',
    disclaimer: '비공식·비영리 팬 가이드',
    verifiedPrefix: '공식 정보 마지막 확인',
    siteMap: '사이트 지도',
    officialTicketNotice: '공식 티켓 공지 보기',
  },
  guide: {
    page: {
      title: '콘서트 가이드 | {artist} 고양 팬 가이드',
      description:
        '{artist} 2026 고양 공연 당일 가이드 — 오는 길, 좌석 안내, 현장 팁, 귀가와 준비물',
      heading: '콘서트 가이드',
      intro:
        '확정된 공연 정보와 아직 발표되지 않은 운영 정보를 분리해 두고, 다른 공연 후기에서 반복된 경험은 따로 표시한 비공식 팬 가이드입니다.',
    },
    accessMap: {
      openOriginalAriaLabel: '오는 길 안내 원본 이미지 열기',
      alt: '인터파크 오는 길 안내. 3호선 {daehwa}과 GTX-A {kintex} 사이 격자 도로 위에 {venue}(현대카드 슈퍼콘서트 28 위켄드), 보조경기장, 킨텍스 제1·제2 전시장, 일산백병원, 대화마을 위치를 표시한 약도와 주소·지하철·버스 안내.',
      sourcePrefix: '오는 길 안내 출처:',
      sourceLinkLabel: '인터파크 티켓 공연 상세',
      confirmedOn: '(2026-08-29 확인)',
      opensNewTabNote: '탭하면 원본 이미지가 새 탭에서 열립니다.',
    },
    accessTable: {
      addressLabel: '주소',
      subwayLabel: '지하철',
      subwayDaehwaLine: '3호선 {daehwa} 3번 출구 · 도보 약 3분',
      subwayKintexLine: 'GTX-A {kintex} 1번 출구 · 도보 약 20분',
      busDtLabel: '버스 · {stop} 정류장',
      busRoutesAriaLabel: '{stop} 정류장 정차 노선',
      sourcePrefix: '오는 길 정보 출처:',
      sourceLinkLabel: '인터파크 티켓 공연 상세',
      confirmedOn: '(2026-08-29 확인)',
    },
    directions: {
      navAriaLabel: '길찾기 앱 열기',
      kakaoMapLabel: '카카오맵 길찾기',
      naverMapLabel: '네이버지도에서 열기',
      googleMapLabel: '구글맵 길찾기',
    },
    jumpNav: {
      sectionsAriaLabel: '가이드 섹션',
    },
    overview: {
      beforeArrival: '도착 전',
      entry: '입장',
      show: '관람',
      goingHome: '귀가',
      summaryAriaLabel: '당일 행동 요약',
    },
    section: {
      pendingAriaLabel: '공식 발표 대기 항목',
      pendingItems: {
        entryGate: '입장 게이트',
        prohibitedItems: '반입 금지 물품',
        trafficControl: '교통 통제',
        shuttleOperations: '순환버스 세부 운영',
        accessibilitySupport: '접근성 지원',
        standingEarlyEntry: '스탠딩·Early Entry 운영',
      },
      lastCheckedPrefix: '마지막 확인',
    },
    liveMap: {
      ariaLabel: '{venue} 지도',
      statusFallback:
        '지도가 표시되지 않으면 위 공식 약도와 길찾기 버튼을 이용하세요.',
      note: '{venue} · 지도를 확대하거나 위 길찾기 버튼으로 경로를 확인하세요.',
    },
    seatMap: {
      openOriginalAriaLabel: '좌석 안내도 원본 이미지 열기',
      alt: '{venue} 좌석 안내도. 상단 무대, 플로어 스탠딩 A·B, 십자형 런웨이, 1~3층 스탠드 구역과 등급 색상 범례.',
      sourcePrefix: '좌석 안내도 출처:',
      sourceLinkLabel: '인터파크 티켓 공연 상세',
      confirmedOn: '(2026-08-29 확인)',
      opensNewTabNote: '탭하면 원본 이미지가 새 탭에서 열립니다.',
    },
    tips: {
      heading: '현장 팁',
      intro:
        '{venue}에서 열린 다른 공연의 관람 후기와 기사에서 반복된 경험입니다. 이 공연의 운영 공지가 아니며, 공지가 나오면 그 내용이 우선합니다.',
      lastCheckedPrefix: '마지막 확인',
      tablistAriaLabel: '현장 팁 주제',
    },
    transport: {
      eyebrow: '공식 안내',
      heading: '공식 교통 운영 안내',
      noParkingHeading: '공연장 내부 주차 불가',
      noParkingBody:
        '공연 당일에는 공연장 내부에 주차할 수 없어 대중교통 이용을 권장합니다.',
      shuttleHeading: '유료 순환버스 임시 운영 예정',
      shuttleRoute: 'GTX-A {kintex} 1번 출구 ↔ {venue} 구간에서 운행합니다.',
      shuttlePending:
        '운행 시간 · 요금 · 배차 간격 · 운동장 승차 위치는 미공개',
      kakaoHeading: '카카오 T 유료 셔틀',
      kakaoIntro: '수도권 11곳과 지방 7곳에서 출발하는 예약형 셔틀입니다.',
      kakaoReserveLabel: '카카오 T 셔틀 예약',
      metroAreasHeading: '수도권 11곳',
      metroAreasAriaLabel: '카카오 T 셔틀 수도권 출발지',
      regionalAreasHeading: '지방 7곳',
      regionalAreasAriaLabel: '카카오 T 셔틀 지방 출발지',
      kakaoDetail:
        '자세한 사항은 카카오 T 앱과 예약 전 유의사항에서 확인합니다.',
    },
  },
} as const;
