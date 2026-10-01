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
    credits: {
      label: 'Credits',
      build: 'Concept, content, and engineering',
      design: 'Concept and design',
    },
  },
  content: {
    koreanSourceNotice:
      'This section is shown in Korean. The Korean text is the source of record.',
    koreanSourceLink: 'Read the Korean page',
    // Short per-row marker for listings (e.g. the sources page) where
    // repeating the full sentence above once per row would bury the list.
    untranslatedSourceNote: '(shown in Korean)',
    albumCover: {
      alt: '{title} album cover — open on Spotify',
    },
    officialEmbed: {
      listen: 'Listen at the official source',
      loadVideo: 'Load the official video',
      iframeTitle: '{song} official media',
    },
    externalLink: {
      newTab: '(opens in a new tab)',
    },
    sourceList: {
      ariaLabel: 'Sources',
      receivedOn: 'Received {date}',
      lastChecked: 'Last checked {date}',
      summary: '{count} sources · last checked {date}',
    },
  },
  discover: {
    page: {
      title: 'Get to know {artist} | {artist} Goyang Fan Guide',
      description:
        "A three-minute, pre-show primer on {artist}'s career, album lineup, and the two Trilogys",
    },
    hero: {
      heading: 'Flip through {artist}, {phrase}',
      phrase: 'one album at a time',
      introDisclosureAriaLabel: 'More on the 3-minute primer',
      introDisclosureLabel: 'Expand the 3-minute primer',
    },
    albums: {
      heading: 'Six studio albums',
      note: 'The 2011 mixtapes, the 2012 {trilogy} compilation, and the 2018 {mdm} EP are counted separately from these six.',
    },
    timeline: {
      heading: 'A light timeline, deeper when you want it',
      careerAriaLabel: "{artist}'s career, era by era",
      coversAriaLabel: '{era} albums',
      disclosureAriaLabel: 'More on {era}',
    },
    disclosureLabel: 'Learn more',
    glossary: {
      disclosureAriaLabel: 'More on the glossary',
    },
    visual: {
      disclosureAriaLabel: 'More on the visual side of the music',
    },
    trilogy: {
      title: "Don't mix up the two Trilogys",
      intro:
        'The three early mixtapes and the three recent studio albums share a similar name, but they are classified differently.',
      early: {
        heading: 'The early trilogy',
        coversAriaLabel: 'Early trilogy albums',
        body: 'Three original mixtapes. The 2012 compilation {album} bundles them together.',
      },
      recent: {
        heading: 'The recent album trilogy',
        coversAriaLabel: 'Recent album trilogy albums',
        body: 'An official trilogy formed by three consecutive studio albums.',
      },
      interpretation: {
        ariaLabel: 'One interpretation',
        eyebrow: 'One interpretation',
        emphasis: 'Death → Purgatory → Rebirth',
        body: '{emphasis} is one way fans read the three albums. It is not treated as an official canon or a single storyline.',
      },
    },
  },
  guide: {
    page: {
      title: 'Concert Guide | {artist} Goyang Fan Guide',
      description:
        "A day-of guide for {artist}'s 2026 Goyang concert — directions, seating, on-site tips, and what to bring home",
      heading: 'Concert guide',
      intro:
        'An unofficial fan guide that keeps confirmed show details separate from operations not yet announced, and separately flags experiences repeated in reviews of other concerts.',
    },
    accessMap: {
      openOriginalAriaLabel: 'Open the original directions image',
      alt: 'Interpark directions guide. A sketch map over the grid streets between Line 3 {daehwa} and GTX-A {kintex}, marking {venue} (Hyundai Card Super Concert 28 Weeknd), the auxiliary stadium, KINTEX Halls 1 and 2, Ilsan Paik Hospital and Daehwa-maeul, plus the address, subway and bus directions.',
      sourcePrefix: 'Directions guide source:',
      sourceLinkLabel: 'NOL ticket listing',
      confirmedOn: '(confirmed 2026-09-27)',
      opensNewTabNote: 'Tapping opens the original image in a new tab.',
    },
    accessTable: {
      addressLabel: 'Address',
      subwayLabel: 'Subway',
      subwayDaehwaLine: 'Line 3 {daehwa}, Exit 3 — about 3 min on foot',
      subwayKintexLine: 'GTX-A {kintex}, Exit 1 — about 20 min on foot',
      busDtLabel: '{stop} bus stop',
      busRoutesAriaLabel: 'Bus routes serving {stop}',
      sourcePrefix: 'Directions info source:',
      sourceLinkLabel: 'NOL ticket listing',
      confirmedOn: '(confirmed 2026-09-27)',
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
    section: {
      pendingAriaLabel: 'Items awaiting official announcement',
      pendingItems: {
        entryGate: 'Entry gate by seating section',
        prohibitedItems: 'Prohibited items',
        trafficControl: 'Traffic control',
        shuttleOperations: 'Shuttle bus operational details',
        accessibilitySupport: 'Accessibility support',
        standingEarlyEntry: 'Early Entry priority admission',
      },
      lastCheckedPrefix: 'Last checked',
    },
    liveMap: {
      ariaLabel: '{venue} map',
      statusFallback:
        'If the map does not load, use the official sketch map and directions buttons above.',
      note: '{venue} — Zoom the map or use the directions buttons above to check your route.',
      loadingLabel: 'Loading the map…',
      unavailableLabel:
        "The map couldn't load. Use the official sketch map and directions buttons above.",
      zoomInLabel: 'Zoom in',
      zoomOutLabel: 'Zoom out',
      markerAlt: '{venue} location',
    },
    timetable: {
      arrivalHeading: 'Arrive at the venue before 16:00',
      arrivalBody:
        'For a smooth entry, arriving at the venue by 16:00 at the latest is recommended. If you hold a standing ticket and want to enter in admission-number order, the 16:30 rule below applies, so leave a little more time.',
      alertHeading: 'Standing: be in the queue area before 16:30',
      alertBody:
        'Finish the adult check first, then wait in the standing queue area in admission-number order. Arrive after 16:30 and your admission number is voided.',
      scheduleHeading: 'Official schedule',
      scheduleAriaLabel: 'Show-day schedule',
      scheduleNote:
        'The same schedule was announced for both shows, Wednesday 7 and Thursday 8 October.',
      rows: {
        ticketBox: 'Ticket box · Standing Early Entry Package booth open',
        ticketBoxNote:
          'Collecting an Early Entry Package ticket on site: pick it up at the ticket box, then visit the booth',
        booths: 'Adult check · record booths open',
        merchandisePreOpen: 'Merchandise booth early opening',
        merchandisePreOpenNote: 'Standing Early Entry Package buyers only',
        merchandiseOpen: 'Merchandise booth opens to everyone',
        merchandiseOpenNote: 'All ticket holders',
        standingQueue: 'Standing queue area opens',
        entry: 'Standing and reserved-seat entry begins',
        entryNote: 'Standing admission numbers are void after 16:30',
        opener: '{opener} opening set begins',
        headliner: '{artist} show begins',
      },
      changeNote:
        'Times may change with conditions on the day. Crowds can make every step take longer, so arrive with time to spare.',
    },
    entryDuration: {
      heading: 'Estimated time to get in',
      intro:
        'The minimum estimated time from leaving public transport to reaching your spot.',
      stepHeader: 'Step',
      seatedLabel: 'Seated',
      standingLabel: 'Standing',
      totalLabel: 'Total',
      totalValue: 'at least {minutes} min',
      minutes: '{minutes} min',
      steps: {
        arrival: 'From public transport to the adult-check booth',
        wristband: 'Adult check and wristband pickup',
        booths: 'Photo zone, merchandise, record and event booths',
        seat: 'Finding your spot after entering',
      },
      arrivalSeated:
        'Seated: at least 13 min on foot from {daehwa}; at least 20 min on foot or by shuttle bus from {kintex}',
      arrivalStanding:
        'Standing: at least 15 min on foot from {daehwa}; at least 25 min on foot or by shuttle bus from {kintex}',
      arrivalNote:
        'These times run to the adult-check booth. The “about 3 minutes on foot from Exit 3 of {daehwa}” in Getting There is measured to the stadium, a different point.',
      estimateNote:
        'These are estimates and vary with conditions on the day and with what each person stops for.',
      boothsNote: 'The totals include 95 minutes at the photo zone and booths.',
    },
    venueMap: {
      heading: 'Venue map',
      openOriginalAriaLabel: 'Open the original venue map image',
      alt: 'Hyundai Card Super Concert venue map. The stage and standing sections A and B in the middle of the stadium, W, N and E gates around it, standing and reserved-seat adult-check booths, merchandise, record, Early Entry Package and VIP Package booths, lockers, information and restrooms, with a legend.',
      sourcePrefix: 'Venue map source:',
      sourceLinkLabel: 'Hyundai Card official Instagram',
      confirmedOn: '(confirmed 2026-10-01)',
      opensNewTabNote: 'Tapping opens the original image in a new tab.',
      summaryLabel: 'Read the map as text',
      points: {
        standingBooth:
          'The standing adult-check booth and standing queue area are on the {auxStadium} side. Standing-only merchandise and restrooms are marked there, and a yellow dotted route leads from the queue area to the standing sections.',
        seatedBooth:
          'The reserved-seat adult-check booth is beside the {southPlaza}, toward {parking}. The ticket box and the VIP Package booth are marked in the same area.',
        merchandise:
          'The merchandise area is on the {sonoArena} side, with lockers and restrooms marked. MD marks also appear beside gates W4–W5 and E8.',
        earlyEntry:
          'The Early Entry Package booth is near gate W1, with lockers and restrooms marked nearby.',
        records:
          'The record booth is above the {southPlaza} and information is below it.',
        gates:
          'Gates W1, W3, W4, W5, N1-2 and E1, E2, E3, E4, E5, E8 are marked. Which gate each seating section uses has not been announced.',
      },
    },
    ticketRoutes: {
      heading: 'Where to go first by ticket type',
      intro:
        'Each ticket type starts at a different place. Tapping a map opens the original image in a new tab.',
      openOriginalAriaLabel: 'Open the original {ticket} map image',
      sourcePrefix: 'Map source:',
      sourceLinkLabel: 'Hyundai Card official Instagram',
      confirmedOn: '(confirmed 2026-10-01)',
      seated: {
        title: 'Reserved seats',
        place: '{parking} — reserved-seat adult-check booth',
        alt: 'Hyundai Card Super Concert reserved-seat map. A close-up of {parking} beside the {southPlaza}, marking the two reserved-seat adult-check booths, the ticket box, and the three entrances and two exits of the check area.',
        steps: [
          'Take the adult check and collect your wristband at the reserved-seat adult-check booths (two) in {parking}.',
          'The ticket box and the VIP Package booth are in {parking} too. The check area has three entrances and two exits marked.',
        ],
      },
      standing: {
        title: 'Standing',
        place: '{auxStadium} — standing queue area',
        alt: 'Hyundai Card Super Concert standing map. A close-up of the {auxStadium}, the standing queue area, marking its two entrances, the two standing adult-check booths and standing-only merchandise.',
        steps: [
          'The {auxStadium} is the standing queue area. Take the adult check at the standing adult-check booths (two) inside it.',
          'Standing-only merchandise is inside the queue area too.',
          'The queue area opens at 14:00. Wait there in admission-number order before 16:30.',
          'Collecting your ticket on site? The ticket box is in {parking}.',
        ],
      },
      earlyEntry: {
        title: 'Standing Early Entry Package',
        place: 'Beside gate W1 — Early Entry Package booth',
        alt: 'Hyundai Card Super Concert standing Early Entry Package map. The Early Entry Package booth beside gate W1, below the {auxStadium}, with notes on using the booth.',
        steps: [
          'Take the adult check at the Early Entry Package booth and collect the adult-check wristband and a gift there.',
          'Collecting your ticket on site? Pick it up at the ticket box in {parking} first, then go to the booth.',
          'To enter in admission-number order, finish the adult check and be inside the queue area by 16:30. After that your admission number is voided.',
        ],
      },
    },
    seatMap: {
      openOriginalAriaLabel: 'Open the original seating guide image',
      alt: '{venue} seating guide. Stage at the top, floor standing sections A and B, a cross-shaped runway, tier 1-3 stand sections, and a color-coded price legend.',
      sourcePrefix: 'Seating guide source:',
      sourceLinkLabel: 'NOL ticket listing',
      confirmedOn: '(confirmed 2026-09-27)',
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
        'The shuttle runs between Exit 1 of GTX-A {kintex} and {venue}.',
      shuttlePending:
        'Operating hours, fare, interval, and the stadium boarding point are unpublished',
      kakaoHeading: 'Kakao T paid shuttle',
      kakaoIntro:
        'A reservation-based shuttle departing from 11 stops in the Seoul metro area and 7 regional stops.',
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
      heading: 'Concert guide',
      navAriaLabel: 'Concert guide shortcuts',
      timetable: 'Show-day timetable',
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
      heading: 'Expected setlist',
      comparison: {
        one: 'Compared against 1 recent 2026 show',
        other: 'Compared against {count} recent 2026 shows',
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
      mobileToggle: 'Contents',
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
          poster: 'Make a setlist poster',
          ticket: 'Make your own D-day ticket',
        },
      },
    },
  },
  setlist: {
    page: {
      titleArchived: 'WE WERE HERE | {artist} Goyang Fan Guide',
      titleExpected: 'Expected Setlist | {artist} Goyang Fan Guide',
      description:
        "An unofficial expected setlist for {artist}'s Goyang show, based on recent 2026 show records",
      headingArchived: 'We were here',
      headingExpected: 'Expected setlist',
      intro:
        'An unofficial expected order based on recurring patterns from recent shows. The actual show may differ.',
    },
    explorer: {
      dayVerified: 'Day {day} — verified after the show',
      actualHeading: 'Setlist verified after the show',
      expectedListHeading: 'Song list — Expected · not guaranteed',
      searchLabel: 'Search songs',
      searchPlaceholder: 'Search by song title',
      albumFilterLabel: 'Filter by album',
      allAlbumsOption: 'All albums',
      viewsAriaLabel: 'List view',
      viewAll: 'All',
      viewEssential: 'Essential 10 in 3 minutes',
      countShown: { one: '{count} song shown', other: '{count} songs shown' },
      resetButton: 'Reset',
      confidenceLabel: '{level} confidence',
      confidenceLevels: { high: 'high', medium: 'medium', low: 'low' },
      beforeHeading: 'One line worth knowing before the show',
      onStageHeading: 'What to watch for on stage',
      singAlongHeading: 'Sing-along moment',
      sourcesHeading: 'Sources',
      noResults: 'No matching songs.',
    },
  },
  share: {
    errors: {
      imageLoadFailed: 'Could not load the background image. Please try again.',
      canvasUnavailable: 'Could not draw the image. Please try again.',
      exportFailed: 'Could not generate the image. Please try again.',
    },
    common: {
      originalPngLabel: 'Original design PNG',
      fallbackHeading: "If the image won't save",
      fallbackImageLink: 'View the default share image',
      fallbackCopyButton: 'Copy the text share caption',
      generatingStatus: 'Generating the image…',
      shareLabel: 'Share',
      shareCancelled:
        'Share canceled. You can save the JPEG or copy the caption instead.',
      shareFailed:
        'Share failed. Please save the JPEG or copy the caption instead.',
      copiedStatus: 'Copied the text share caption.',
      copyFallback: 'Please copy this share caption yourself: {url}',
    },
    ticket: {
      page: {
        title: 'D-day Ticket | {artist} Goyang Fan Guide',
        description:
          "A D-day ticket for {artist}'s Goyang show, generated entirely in your browser",
      },
      intro:
        "Choose your show date and the three songs you're most looking forward to, then build a landscape ticket.",
      previewAriaLabel: 'D-day ticket preview',
      previewFallback:
        "The preview appears only when JavaScript is on. It's the same ticket as the image the save button creates.",
      previewCaption: 'Landscape ticket · same as the saved image',
      previewExpand: 'Expand the preview',
      previewCollapse: 'Collapse the preview',
      dateLegend: 'Show date',
      songLabels: ['First song', 'Second song', 'Third song'],
      emptySong: 'Choose a song',
      downloadButton: 'Save D-day ticket',
      privacyNote:
        "Pick three different songs and they'll appear on your ticket. The image is generated only in this browser, and your choices are not saved.",
      backLink: 'Back to the concert guide',
      validationError: 'Please choose three different songs.',
      savedStatus: 'Saved the JPEG ticket.',
      shareTitle: '{artist} Goyang D-day Ticket',
      sharedStatus: 'Shared the ticket image.',
      clipboardText: '{artist} Goyang Fan Guide — {url}',
    },
    setlist: {
      page: {
        title: 'Setlist Card | {artist} Goyang Fan Guide',
        description:
          "An expected setlist card for {artist}'s Goyang show, generated entirely in your browser",
      },
      lead: {
        one: 'This turns the 1 song in the expected setlist into a single portrait image (1080×1638). Save it to post to your story or group chat, or keep it in your gallery to preview before the show.',
        other:
          'This turns the {count} songs in the expected setlist into a single portrait image (1080×1638). Save it to post to your story or group chat, or keep it in your gallery to preview before the show.',
      },
      previewAriaLabel: 'Expected setlist card preview',
      previewFallback:
        "The preview appears only when JavaScript is on. It's the same card as the image the save button creates.",
      previewCaption: 'Preview · same as the saved image',
      songsIncludedLabel: 'Songs included',
      songsCount: { one: '1 song', other: '{count} songs' },
      basisLabel: 'Basis',
      basisValue: 'Based on recent 2026 show records · UPDATED {date}',
      downloadButton: 'Save setlist card',
      privacyNote:
        'The image is generated only in this browser, and your choices are not saved.',
      backLink: 'See what to watch for, song by song',
      savedStatus: 'Saved the JPEG setlist card.',
      shareTitle: '{artist} Goyang Expected Setlist',
      sharedStatus: 'Shared the setlist card.',
      clipboardText: '{artist} Goyang Expected Setlist — {url}',
    },
  },
  sources: {
    page: {
      title: 'Sources and Updates | {artist} Goyang Fan Guide',
      description:
        "{artist} Goyang Fan Guide's sources, last-checked dates, and the update schedule around the show",
      heading: 'Sources and Updates',
      intro:
        'This page briefly records where information comes from and when it was checked. Items without an operations notice are not filled in with guesses.',
      groupsAriaLabel: 'Source list',
    },
    routeLabels: {
      home: 'Home',
      setlist: 'Expected setlist',
      goyang: 'Concert guide',
    },
    kind: {
      official: {
        title: 'Official',
        description:
          'Original statements published by the artist, promoter, ticket seller, or label, and official SMS notices from the ticket seller.',
      },
      'public-agency': {
        title: 'Public transit',
        description:
          'Public services used to check facilities, rail, and bus information.',
      },
      'crowd-sourced': {
        title: 'Show records',
        description:
          'Records comparing recurring patterns from recent shows. Not officially confirmed information.',
      },
      'editorial-reference': {
        title: 'Supporting reference',
        description:
          'Supporting material for finding candidates and terms; core facts are re-checked against the original sources above.',
      },
    },
    allCheckedOn: 'All last checked {date}',
    receivedLabel: 'Received',
    lastCheckedLabel: 'Last checked',
    usedInLabel: 'Used in',
    usedInAriaLabel: 'Where {name} is used',
    wikiReference: {
      name: 'Namu Wiki PDF',
      note: 'For finding gaps only · not a source for core facts',
    },
    checkpoints: {
      heading: 'Next checkpoints',
      items: [
        ['Tokyo', 'after Sep 19–20', 'confirm the first Asia-leg lineup'],
        [
          'Jakarta',
          'after Sep 26–27',
          'compare guest-free stretches and set changes',
        ],
        ['Singapore', 'after Oct 2–3', 'reflect the closest comparison show'],
        [
          'Goyang official notice',
          'Oct 4–6',
          'final check on entry, prohibited items, transit, and access notices',
        ],
        [
          'Goyang day 1 archive',
          'after the Oct 7 show',
          'record the actual setlist',
        ],
        [
          'Goyang day 2 archive',
          'after the Oct 8 show',
          'record differences from the actual setlist',
        ],
      ],
      archiveNote:
        'The actual Goyang show record switches to an archive only after both dates are confirmed.',
      coverNote:
        'Album covers load directly from the Spotify CDN (no cookies). We do not store or re-process them, and tapping a cover opens its Spotify album page.',
    },
  },
  notFound: {
    page: {
      title: 'Page not found',
      description: 'There is no page at the requested address.',
    },
    eyebrow: '404',
    heading: 'This page never reached the dawn',
    body: 'The address may have changed, or the page never existed. Continue from one of these.',
    navAriaLabel: 'Go to another page',
  },
  ui: {
    backToTop: 'Back to top',
    collapse: 'Collapse',
  },
};
