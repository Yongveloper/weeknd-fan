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
    credits: {
      label: '만든 사람',
      build: '기획·콘텐츠·개발',
      design: '기획·디자인',
    },
  },
  content: {
    // 한국어 경로에서는 렌더되지 않지만 타입 원본이라 값이 필요하다
    koreanSourceNotice: '이 항목은 한국어 원문입니다.',
    koreanSourceLink: '한국어판 보기',
    // 출처 목록처럼 한 줄짜리 항목이 여러 개 나열될 때 쓰는 짧은 표시.
    // 문장형 koreanSourceNotice를 항목 수만큼 반복하면 페이지가 그 문장으로
    // 뒤덮이므로 별도로 둔다.
    untranslatedSourceNote: '(한국어 표기)',
    albumCover: {
      alt: '{title} 앨범 커버 — Spotify에서 열기',
    },
    officialEmbed: {
      listen: '공식 원문에서 듣기',
      loadVideo: '공식 영상 불러오기',
      iframeTitle: '{song} 공식 미디어',
    },
    externalLink: {
      newTab: '(새 창에서 열림)',
    },
    sourceList: {
      ariaLabel: '출처',
      receivedOn: '수신일 {date}',
      lastChecked: '마지막 확인 {date}',
      summary: '출처 {count}개 · 마지막 확인 {date}',
    },
  },
  discover: {
    page: {
      title: '{artist} 알기 | {artist} 고양 팬 가이드',
      description:
        '공연 전 3분에 훑는 {artist}의 커리어, 앨범 구분, 그리고 두 3부작',
    },
    hero: {
      heading: '{artist}를 {phrase} 넘겨 보기',
      phrase: '한 장씩',
      introDisclosureAriaLabel: '3분 입문 더 깊이 보기',
      introDisclosureLabel: '3분 입문 펼쳐보기',
    },
    albums: {
      heading: '정규 앨범 6장',
      note: '2011년 세 믹스테이프, 2012년 {trilogy} 컴필레이션, 2018년 {mdm} EP는 이 여섯 장과 따로 센다.',
    },
    timeline: {
      heading: '연표는 가볍게, 필요하면 더 깊게',
      careerAriaLabel: '{artist} 시대별 커리어',
      coversAriaLabel: '{era} 앨범',
      disclosureAriaLabel: '{era} 더 깊이 보기',
    },
    disclosureLabel: '더 깊이 보기',
    glossary: {
      disclosureAriaLabel: '용어 한 장 더 깊이 보기',
    },
    visual: {
      disclosureAriaLabel: '보는 음악 더 깊이 보기',
    },
    trilogy: {
      title: '두 개의 Trilogy를 헷갈리지 않기',
      intro:
        '초기의 세 믹스테이프와 최근의 세 정규 앨범은 이름이 닮았지만 분류가 다르다.',
      early: {
        heading: '초기 3부작',
        coversAriaLabel: '초기 3부작 앨범',
        body: '세 장의 오리지널 믹스테이프. 2012년 {album}는 이들을 묶은 컴필레이션이다.',
      },
      recent: {
        heading: '최근 앨범 3부작',
        coversAriaLabel: '최근 앨범 3부작 앨범',
        body: '세 장의 정규 앨범이 이어지는 공식 3부작이다.',
      },
      interpretation: {
        ariaLabel: '한 가지 해석',
        eyebrow: '한 가지 해석',
        emphasis: '사망 → 연옥 → 환생',
        body: '{emphasis}은 팬들이 세 장을 읽는 한 방식이다. 공식 설정이나 단일한 줄거리로 단정하지 않는다.',
      },
    },
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
      sourceLinkLabel: 'NOL 티켓 공연 상세',
      confirmedOn: '(2026-09-23 확인)',
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
      sourceLinkLabel: 'NOL 티켓 공연 상세',
      confirmedOn: '(2026-09-23 확인)',
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
    section: {
      pendingAriaLabel: '공식 발표 대기 항목',
      pendingItems: {
        gateOpening: '게이트 오픈 시각',
        entryGate: '입장 게이트',
        prohibitedItems: '반입 금지 물품',
        trafficControl: '교통 통제',
        shuttleOperations: '순환버스 세부 운영',
        accessibilitySupport: '접근성 지원',
        standingEarlyEntry: '스탠딩·Early Entry 운영',
        merchandise: '공식 굿즈(MD) 판매',
      },
      lastCheckedPrefix: '마지막 확인',
    },
    liveMap: {
      ariaLabel: '{venue} 지도',
      statusFallback:
        '지도가 표시되지 않으면 위 공식 약도와 길찾기 버튼을 이용하세요.',
      note: '{venue} · 지도를 확대하거나 위 길찾기 버튼으로 경로를 확인하세요.',
      loadingLabel: '지도를 불러오는 중입니다.',
      unavailableLabel:
        '지도를 불러오지 못했습니다. 위 공식 약도와 길찾기 버튼을 이용하세요.',
      zoomInLabel: '지도 확대',
      zoomOutLabel: '지도 축소',
      markerAlt: '{venue} 위치',
    },
    seatMap: {
      openOriginalAriaLabel: '좌석 안내도 원본 이미지 열기',
      alt: '{venue} 좌석 안내도. 상단 무대, 플로어 스탠딩 A·B, 십자형 런웨이, 1~3층 스탠드 구역과 등급 색상 범례.',
      sourcePrefix: '좌석 안내도 출처:',
      sourceLinkLabel: 'NOL 티켓 공연 상세',
      confirmedOn: '(2026-09-23 확인)',
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
  home: {
    page: {
      title: '{artist} 고양 팬 가이드',
      description: '{artist} 2026 고양 공연을 위한 비공식·비영리 팬 가이드',
    },
    fanNote: {
      heading: '팬의 한마디',
      body: '모르는 곡이 있어도 괜찮아요. 가장 크게 남는 순간은 완벽히 아는 노래보다, 눈앞에서 밤이 새벽으로 바뀌는 장면일 테니까요.',
      cta: '나만의 D-day 티켓 만들기',
    },
    shortcuts: {
      heading: '콘서트 가이드',
      navAriaLabel: '콘서트 가이드 바로가기',
      official: '공식 공연 정보',
      directions: '가는 길',
      seating: '좌석 안내',
      packing: '준비물',
      returning: '귀가 확인',
    },
    intro: {
      heading: '3분 만에 {artist} 알기',
      description:
        '밤의 충동과 후회를 영화처럼 노래하던 인물이, 새벽을 향해 자신을 마주하는 이야기. 이번 공연 전에는 이 세 장의 앨범만 이어 들어도 충분해요.',
      albumsAriaLabel: '이번 공연 전에 들을 세 장',
      cta: '앨범 타임라인 살펴보기',
    },
    setlistPreview: {
      heading: '예상 셋리스트',
      comparison: {
        one: '최근 2026년 공연 {count}회 비교',
        other: '최근 2026년 공연 {count}회 비교',
      },
      empty:
        '최신 공연 구성을 확인 중이에요. 확인된 곡 순서는 곧 여기에 이어집니다.',
      fullListAriaLabel: '전체 예상 셋리스트',
      fullListLabel: '전체 목록 펼쳐보기',
      fullListEmpty:
        '전체 예상 셋리스트는 최신 공연 기록을 확인한 뒤 공개합니다.',
      pointsLink: '곡별 관람 포인트 보기',
      posterLink: '셋리스트 포스터 만들기',
    },
    pamphlet: {
      mobileToggle: '차례',
      navAriaLabel: '팜플렛 목차',
      chapters: {
        beforeDawn: {
          title: '새벽을 맞기 전에',
          albumTimeline: '앨범 타임라인',
          setlist: '예상 셋리스트',
          points: '곡별 관람 포인트',
        },
        towardDawn: {
          title: '새벽으로 향하는 길',
          guide: '콘서트 가이드',
          officialNotice: '공식 티켓 공지 보기',
        },
        keepsake: {
          title: '기다림을 담아두기',
          poster: '셋리스트 포스터',
          ticket: '나만의 D-day 티켓 만들기',
        },
      },
    },
  },
  setlist: {
    page: {
      titleArchived: 'WE WERE HERE | {artist} 고양 팬 가이드',
      titleExpected: '예상 셋리스트 | {artist} 고양 팬 가이드',
      description:
        '최근 2026년 공연 기록을 바탕으로 한 {artist} 고양 공연 예상 셋리스트',
      headingArchived: '우리는 그곳에 있었다',
      headingExpected: '예상 셋리스트',
      intro:
        '최근 무대의 반복 패턴을 참고한 비공식 예상 순서입니다. 실제 공연은 달라질 수 있어요.',
    },
    explorer: {
      dayVerified: '{day}일차 공연 후 확인',
      actualHeading: '공연 후 확인된 셋리스트',
      expectedListHeading: '곡 목록 — 예상 · 보장 아님',
      searchLabel: '곡 검색',
      searchPlaceholder: '곡 제목으로 찾기',
      albumFilterLabel: '앨범으로 고르기',
      allAlbumsOption: '전체 앨범',
      viewsAriaLabel: '목록 보기',
      viewAll: '전체',
      viewEssential: '3분 핵심 10곡',
      countShown: { one: '{count}곡 표시', other: '{count}곡 표시' },
      resetButton: '초기화',
      confidenceLabel: '신뢰도 {level}',
      confidenceLevels: { high: '높음', medium: '보통', low: '낮음' },
      beforeHeading: '공연 전에 알면 좋은 한 문장',
      onStageHeading: '무대에서 볼 것',
      singAlongHeading: '떼창 포인트',
      sourcesHeading: '출처',
      noResults: '검색 결과가 없습니다.',
    },
  },
  share: {
    errors: {
      imageLoadFailed: '배경 이미지를 불러오지 못했습니다. 다시 시도해 주세요.',
      canvasUnavailable: '이미지를 그릴 수 없습니다. 다시 시도해 주세요.',
      exportFailed: '이미지 생성에 실패했습니다. 다시 시도해 주세요.',
    },
    common: {
      originalPngLabel: '원본 디자인 PNG',
      fallbackHeading: '이미지 저장이 안 되면',
      fallbackImageLink: '기본 공유 이미지 보기',
      fallbackCopyButton: '텍스트 공유 문구 복사',
      generatingStatus: '이미지를 생성하고 있습니다…',
      shareLabel: '공유',
      shareCancelled:
        '공유를 취소했습니다. JPEG를 저장하거나 문구를 복사할 수 있습니다.',
      shareFailed:
        '공유에 실패했습니다. JPEG를 저장하거나 문구를 복사해 주세요.',
      copiedStatus: '텍스트 공유 문구를 복사했습니다.',
      copyFallback: '공유 문구를 직접 복사해 주세요: {url}',
    },
    ticket: {
      page: {
        title: 'D-day Ticket | {artist} 고양 팬 가이드',
        description: '브라우저 안에서만 생성하는 {artist} 고양 D-day 티켓',
      },
      intro: '관람일과 가장 기다리는 세 곡을 골라 가로형 티켓을 만드세요.',
      previewAriaLabel: 'D-day 티켓 미리보기',
      previewFallback:
        '미리보기는 JavaScript가 켜져 있을 때 표시됩니다. 저장 버튼으로 만드는 이미지와 같은 티켓입니다.',
      previewCaption: '가로형 티켓 · 저장되는 이미지와 같습니다',
      previewExpand: '미리보기 크게 보기',
      previewCollapse: '미리보기 작게 보기',
      dateLegend: '관람일',
      songLabels: ['첫 번째 곡', '두 번째 곡', '세 번째 곡'],
      emptySong: '곡을 선택해 주세요',
      downloadButton: 'D-day 티켓 저장',
      privacyNote:
        '서로 다른 세 곡을 고르면 티켓에 담겨요. 이미지는 이 브라우저 안에서만 생성되며 선택값을 저장하지 않습니다.',
      backLink: '공연 안내로 돌아가기',
      validationError: '서로 다른 세 곡을 선택해 주세요.',
      savedStatus: 'JPEG 티켓을 저장했습니다.',
      shareTitle: '{artist} 고양 D-day 티켓',
      sharedStatus: '티켓 이미지를 공유했습니다.',
      clipboardText: '{artist} 고양 팬 가이드 — {url}',
    },
    setlist: {
      page: {
        title: 'Setlist Card | {artist} 고양 팬 가이드',
        description:
          '브라우저 안에서만 생성하는 {artist} 고양 예상 셋리스트 카드',
      },
      lead: {
        one: '예상 셋리스트 {count}곡을 세로형 이미지 한 장(1080×1638)으로 만듭니다. 저장해서 스토리·단톡방에 올리거나, 공연 전 예습용으로 갤러리에 넣어 두세요.',
        other:
          '예상 셋리스트 {count}곡을 세로형 이미지 한 장(1080×1638)으로 만듭니다. 저장해서 스토리·단톡방에 올리거나, 공연 전 예습용으로 갤러리에 넣어 두세요.',
      },
      previewAriaLabel: '예상 셋리스트 카드 미리보기',
      previewFallback:
        '미리보기는 JavaScript가 켜져 있을 때 표시됩니다. 저장 버튼으로 만드는 이미지와 같은 카드입니다.',
      previewCaption: '미리보기 · 저장되는 이미지와 같습니다',
      songsIncludedLabel: '담기는 곡',
      songsCount: { one: '{count}곡', other: '{count}곡' },
      basisLabel: '기준',
      basisValue: '최근 2026년 공연 기록 · UPDATED {date}',
      downloadButton: '셋리스트 카드 저장',
      privacyNote:
        '이미지는 이 브라우저 안에서만 생성되며 선택값을 저장하지 않습니다.',
      backLink: '곡별 관람 포인트 보기',
      savedStatus: 'JPEG 셋리스트 카드를 저장했습니다.',
      shareTitle: '{artist} 고양 예상 셋리스트',
      sharedStatus: '셋리스트 카드를 공유했습니다.',
      clipboardText: '{artist} 고양 예상 셋리스트 — {url}',
    },
  },
  sources: {
    page: {
      title: '출처와 업데이트 | {artist} 고양 팬 가이드',
      description:
        '{artist} 고양 팬 가이드의 출처, 마지막 확인일, 그리고 공연 전후 업데이트 일정',
      heading: '출처와 업데이트',
      intro:
        '이 페이지는 정보의 근거와 확인 시점을 짧게 남깁니다. 운영 공지가 없는 항목은 추정으로 채우지 않습니다.',
      groupsAriaLabel: '출처 목록',
    },
    routeLabels: {
      home: '홈',
      setlist: '예상 셋리스트',
      goyang: '콘서트 가이드',
    },
    kind: {
      official: {
        title: '공식',
        description:
          '아티스트·주최·예매처·레이블이 공개한 원문과 예매처 공식 문자 안내입니다.',
      },
      'public-agency': {
        title: '공공 교통',
        description: '공공시설·철도·버스 확인에 사용하는 공공 서비스입니다.',
      },
      'crowd-sourced': {
        title: '공연 기록',
        description:
          '최근 공연의 반복 패턴을 비교하는 기록입니다. 공식 확정 정보가 아닙니다.',
      },
      'editorial-reference': {
        title: '보조 참고',
        description:
          '후보와 용어를 찾는 보조 자료이며, 핵심 사실은 위 원문으로 다시 확인합니다.',
      },
    },
    allCheckedOn: '전체 마지막 확인 {date}',
    receivedLabel: '수신일',
    lastCheckedLabel: '마지막 확인',
    usedInLabel: '사용 위치',
    usedInAriaLabel: '{name} 사용 위치',
    wikiReference: {
      name: '나무위키 PDF',
      note: '누락 탐색용·핵심 사실 근거 아님',
    },
    checkpoints: {
      heading: '다음 확인 지점',
      items: [
        ['Tokyo', '9월 19–20일 이후', '첫 아시아 구성 확인'],
        ['Jakarta', '9월 26–27일 이후', '게스트 없는 구간과 세트 변화 비교'],
        ['Singapore', '10월 2–3일 이후', '가장 가까운 비교군 반영'],
        [
          '고양 공식 확인',
          '10월 4–6일',
          '입장·반입·교통·접근성 공지 최종 확인',
        ],
        ['고양 1일차 아카이브', '10월 7일 공연 후', '실제 셋리스트 기록'],
        [
          '고양 2일차 아카이브',
          '10월 8일 공연 후',
          '실제 셋리스트와 차이 기록',
        ],
      ],
      archiveNote:
        '실제 고양 공연 기록은 양일 모두 확인한 뒤에만 아카이브로 전환합니다.',
      coverNote:
        '앨범 커버는 Spotify CDN에서 직접 불러옵니다(쿠키 없음). 자체 저장·재가공하지 않으며 커버를 누르면 Spotify 앨범 페이지로 이동합니다.',
    },
  },
  notFound: {
    page: {
      title: '페이지를 찾을 수 없어요',
      description: '요청한 주소에 해당하는 페이지가 없습니다.',
    },
    eyebrow: '404',
    heading: '이 페이지는 새벽에 닿지 않았어요',
    body: '주소가 바뀌었거나 처음부터 없던 페이지입니다. 아래에서 이어가세요.',
    navAriaLabel: '다른 페이지로 이동',
  },
  ui: {
    backToTop: '맨 위로 이동',
    collapse: '접기',
  },
} as const;
