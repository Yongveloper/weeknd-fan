import type { UiStrings } from './index';

export const en: UiStrings = {
  chrome: {
    skipToContent: 'Skip to content',
    primaryMenu: 'Primary',
    menu: 'Menu',
    localeSwitcher: 'Language',
    homeSuffix: 'Goyang fan guide home',
    disclaimer: 'Unofficial, non-commercial fan guide',
    verifiedPrefix: 'Official info last checked',
    siteMap: 'Site map',
    officialTicketNotice: 'View official ticket notice',
  },
  guide: {
    page: {
      title: 'Concert Guide | {artist} Goyang Fan Guide',
      description:
        "A day-of guide for {artist}'s 2026 Goyang concert — directions, seating, on-site tips, and what to bring home",
      heading: 'Concert Guide',
      intro:
        'An unofficial fan guide that keeps confirmed show details separate from operations not yet announced, and separately flags experiences repeated in reviews of other concerts.',
    },
    accessMap: {
      openOriginalAriaLabel: 'Open the original directions image',
      alt: 'Interpark directions guide. A sketch map over the grid streets between Line 3 {daehwa} and GTX-A {kintex}, marking {venue} (Hyundai Card Super Concert 28 Weeknd), the auxiliary stadium, KINTEX Halls 1 and 2, Ilsan Paik Hospital and Daehwa-maeul, plus the address, subway and bus directions.',
      sourcePrefix: 'Directions guide source:',
      sourceLinkLabel: 'Interpark ticket listing',
      confirmedOn: '(confirmed 2026-08-29)',
      opensNewTabNote: 'Tapping opens the original image in a new tab.',
    },
    accessTable: {
      addressLabel: 'Address',
      subwayLabel: 'Subway',
      subwayDaehwaLine: 'Line 3 {daehwa} Exit 3 · about 3 min on foot',
      subwayKintexLine: 'GTX-A {kintex} Exit 1 · about 20 min on foot',
      busDtLabel: '{stop} bus stop',
      busRoutesAriaLabel: 'Bus routes serving {stop}',
      sourcePrefix: 'Directions info source:',
      sourceLinkLabel: 'Interpark ticket listing',
      confirmedOn: '(confirmed 2026-08-29)',
    },
    directions: {
      navAriaLabel: 'Open a directions app',
      kakaoMapLabel: 'Directions in KakaoMap',
      naverMapLabel: 'Open in Naver Map',
      googleMapLabel: 'Directions in Google Maps',
    },
    jumpNav: {
      sectionsAriaLabel: 'Guide sections',
    },
    overview: {
      beforeArrival: 'Before you arrive',
      entry: 'Entry',
      show: 'The show',
      goingHome: 'Getting home',
      summaryAriaLabel: 'Day-of summary',
    },
    section: {
      pendingAriaLabel: 'Items awaiting official announcement',
      pendingItems: {
        entryGate: 'Entry gates',
        prohibitedItems: 'Prohibited items',
        trafficControl: 'Traffic control',
        shuttleOperations: 'Shuttle bus operational details',
        accessibilitySupport: 'Accessibility support',
        standingEarlyEntry: 'Standing & Early Entry operations',
      },
      lastCheckedPrefix: 'Last checked',
    },
    liveMap: {
      ariaLabel: '{venue} map',
      statusFallback:
        'If the map does not load, use the official sketch map and directions buttons above.',
      note: '{venue} · Zoom the map or use the directions buttons above to check your route.',
    },
    seatMap: {
      openOriginalAriaLabel: 'Open the original seating guide image',
      alt: '{venue} seating guide. Stage at the top, floor standing sections A and B, a cross-shaped runway, tier 1-3 stand sections, and a color-coded price legend.',
      sourcePrefix: 'Seating guide source:',
      sourceLinkLabel: 'Interpark ticket listing',
      confirmedOn: '(confirmed 2026-08-29)',
      opensNewTabNote: 'Tapping opens the original image in a new tab.',
    },
    tips: {
      heading: 'On-site tips',
      intro:
        "These are experiences that repeat across reviews and articles from other concerts at {venue}. They are not this show's official operations notice, and any official notice takes priority once announced.",
      lastCheckedPrefix: 'Last checked',
      tablistAriaLabel: 'On-site tip topics',
    },
    transport: {
      eyebrow: 'Official information',
      heading: 'Official transportation operations',
      noParkingHeading: 'No parking inside the venue',
      noParkingBody:
        'On the day of the show, parking inside the venue is unavailable, so public transit is recommended.',
      shuttleHeading: 'Paid shuttle bus — temporary service planned',
      shuttleRoute:
        'The shuttle runs between GTX-A {kintex} Exit 1 and {venue}.',
      shuttlePending:
        'Operating hours, fare, interval, and the stadium boarding point are unpublished',
      kakaoHeading: 'Kakao T paid shuttle',
      kakaoIntro:
        'A reservation-based shuttle departing from 11 stops in the Seoul metro area and 7 regional cities.',
      kakaoReserveLabel: 'Reserve a Kakao T shuttle',
      metroAreasHeading: '11 Seoul metro area stops',
      metroAreasAriaLabel: 'Kakao T shuttle Seoul metro area departure points',
      regionalAreasHeading: '7 regional stops',
      regionalAreasAriaLabel: 'Kakao T shuttle regional departure points',
      kakaoDetail:
        'Check the Kakao T app and the pre-booking notice for details.',
    },
  },
  home: {
    page: {
      title: '{artist} Goyang Fan Guide',
      description:
        "An unofficial, non-commercial fan guide for {artist}'s 2026 Goyang concert",
    },
    fanNote: {
      heading: 'A note from one fan',
      body: "It's fine if you don't know every song. What stays with you won't be the ones you knew by heart — it'll be watching the night turn to dawn right in front of you.",
      cta: 'Make your own D-day ticket',
    },
    shortcuts: {
      heading: 'Concert Guide',
      navAriaLabel: 'Concert guide shortcuts',
      official: 'Official show information',
      directions: 'Getting there',
      seating: 'Seating guide',
      packing: 'What to bring',
      returning: 'Getting home',
    },
    intro: {
      heading: 'Get to know {artist} in 3 minutes',
      description:
        'A story of someone who once sang the impulses and regrets of night like a film, now turning to face himself on the way to dawn. Before the show, these three albums back to back are all you need.',
      albumsAriaLabel: 'Three albums to hear before the show',
      cta: 'Browse the album timeline',
    },
    setlistPreview: {
      heading: 'Expected Setlist',
      comparison: {
        one: 'Compared against 1 show from the 2026 tour',
        other: 'Compared against {count} shows from the 2026 tour',
      },
      empty:
        "We're still confirming the latest show's lineup. The verified song order will appear here soon.",
      fullListAriaLabel: 'Full expected setlist',
      fullListLabel: 'Expand the full list',
      fullListEmpty:
        'The full expected setlist will be published once the latest show is confirmed.',
      pointsLink: 'See what to watch for, song by song',
      posterLink: 'Make a setlist poster',
    },
    pamphlet: {
      navAriaLabel: 'Pamphlet contents',
      chapters: {
        beforeDawn: {
          title: 'Before dawn arrives',
          albumTimeline: 'Album timeline',
          setlist: 'Expected setlist',
          points: 'Song-by-song points',
        },
        towardDawn: {
          title: 'The road toward dawn',
          guide: 'Concert guide',
          officialNotice: 'View official ticket notice',
        },
        keepsake: {
          title: 'Something to keep while you wait',
          poster: 'Setlist poster',
          ticket: 'Make your own D-day ticket',
        },
      },
    },
    countdown: {
      days: { one: '{n} day to go', other: '{n} days to go' },
    },
  },
  ui: {
    backToTop: 'Back to top',
    collapse: 'Collapse',
  },
};
