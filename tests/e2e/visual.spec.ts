import { expect, test } from '@playwright/test';

test('reduced motion does not load the deferred Motion chunk', async ({
  page,
}) => {
  const requestedUrls: string[] = [];
  page.on('request', (request) => requestedUrls.push(request.url()));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForTimeout(750);

  expect(
    requestedUrls.some((url) => /\/_astro\/index\.[\w-]+\.js$/.test(url)),
  ).toBe(false);
});

test('records 390 by 844 home transfer, layout-shift, and long-task evidence', async ({
  page,
}, testInfo) => {
  test.skip(
    test.info().project.name !== 'mobile-chromium',
    'The required mobile performance evidence uses a 390 by 844 viewport.',
  );

  await page.setViewportSize({ width: 390, height: 844 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await page.addInitScript(() => {
    const evidence = {
      cls: 0,
      longTasks: [] as number[],
    };
    Object.defineProperty(window, '__performanceEvidence', {
      value: evidence,
      configurable: true,
    });
    new PerformanceObserver((entries) => {
      for (const entry of entries.getEntries() as PerformanceEntryList) {
        const layoutShift = entry as PerformanceEntry & {
          hadRecentInput?: boolean;
          value?: number;
        };
        if (!layoutShift.hadRecentInput) evidence.cls += layoutShift.value ?? 0;
      }
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((entries) => {
      evidence.longTasks.push(
        ...entries.getEntries().map((entry) => entry.duration),
      );
    }).observe({ type: 'longtask', buffered: true });
  });
  await page.goto('/');
  await page.waitForTimeout(900);
  await page.mouse.wheel(0, 500);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);

  const evidence = await page.evaluate(() => {
    const resources = performance.getEntriesByType(
      'resource',
    ) as PerformanceResourceTiming[];
    const bytesFor = (pattern: RegExp) =>
      resources
        .filter((resource) => pattern.test(resource.name))
        .reduce((sum, resource) => sum + resource.transferSize, 0);
    return {
      ...(
        window as typeof window & {
          __performanceEvidence: { cls: number; longTasks: number[] };
        }
      ).__performanceEvidence,
      rasterBytes: bytesFor(/\.(?:avif|webp|png|jpe?g)(?:\?|$)/i),
      javascriptBytes: bytesFor(/\.js(?:\?|$)/i),
    };
  });
  await testInfo.attach('home-390x844-performance.json', {
    body: JSON.stringify(evidence, null, 2),
    contentType: 'application/json',
  });

  expect(evidence.rasterBytes).toBeLessThanOrEqual(700 * 1024);
  expect(evidence.javascriptBytes).toBeLessThanOrEqual(75 * 1024);
  expect(evidence.cls).toBeLessThan(0.1);
  expect(evidence.longTasks.every((duration) => duration <= 50)).toBe(true);
});

test('shares one lightweight WebP texture between the scene and static fallback', async ({
  page,
}) => {
  await page.goto('/');
  const texture = page.locator('.dawn-sky__still img');
  await expect(texture).toHaveCount(1);
  await expect(texture).toHaveAttribute(
    'src',
    '/visual/atmosphere/golden-cloud-bank-v3.webp',
  );
  await expect(page.locator('[data-home-hero] video')).toHaveCount(2);
});

test('keeps the hero title on two lines and renders Korean headings in Noto Sans KR', async ({
  page,
}) => {
  await page.goto('/');

  const metrics = await page.evaluate(async () => {
    await document.fonts.ready;

    const lineCount = (element: Element) => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) =>
          (node.textContent ?? '').trim().length > 0
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP,
      });
      const tops = new Set<number>();
      let node = walker.nextNode();
      while (node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const rect of Array.from(range.getClientRects())) {
          tops.add(Math.round(rect.top));
        }
        node = walker.nextNode();
      }
      return tops.size;
    };

    const h1 = document.querySelector('h1')!;
    const intro = document.getElementById('intro-title')!;
    const introStyle = getComputedStyle(intro);
    const spanRights = Array.from(h1.querySelectorAll('span')).map(
      (span) => span.getBoundingClientRect().right,
    );
    // The luminous pseudo-elements intentionally spill outside the h1 box.
    // Measure the letters themselves so glow is not mistaken for text overflow.
    const titleBounds = h1.getBoundingClientRect();
    const glyphsFit = Array.from(h1.children).every((line) => {
      const range = document.createRange();
      range.selectNodeContents(line.firstChild!);
      const glyphs = range.getBoundingClientRect();
      return (
        glyphs.left >= titleBounds.left - 1 &&
        glyphs.right <= titleBounds.right + 1
      );
    });

    return {
      heroLines: lineCount(h1),
      glyphsFit,
      documentWidth: document.documentElement.scrollWidth,
      spanRights,
      viewportWidth: window.innerWidth,
      introFont: introStyle.fontFamily,
      introWeight: introStyle.fontWeight,
      introLineHeight:
        parseFloat(introStyle.lineHeight) / parseFloat(introStyle.fontSize),
    };
  });

  expect(metrics.heroLines).toBe(2);
  expect(metrics.glyphsFit).toBe(true);
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth);
  for (const right of metrics.spanRights) {
    expect(right).toBeLessThanOrEqual(metrics.viewportWidth);
  }
  expect(metrics.introFont).toMatch(/Noto Sans KR/);
  expect(metrics.introWeight).toBe('750');
  expect(metrics.introLineHeight).toBeGreaterThan(1);
});

test('uses a dark lunar backdrop instead of adding stars while scrolling', async ({
  page,
}) => {
  await page.goto('/');
  const sky = page.locator('.space-sky--lunar');
  await expect(sky).toHaveAttribute('aria-hidden', 'true');
  const before = await sky.evaluate((element) => ({
    image: getComputedStyle(element).backgroundImage,
    color: getComputedStyle(element).backgroundColor,
    stars: getComputedStyle(element, '::after').display,
  }));
  expect(before).toEqual({
    image: 'none',
    color: 'rgb(0, 0, 0)',
    stars: 'none',
  });
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await expect
    .poll(() => page.locator('dawn-sky').getAttribute('data-state'))
    .toBe('reading');
  await expect(
    sky.evaluate((element) => getComputedStyle(element).backgroundImage),
  ).resolves.toBe('none');
});

test('does not mount the space sky on sub-pages', async ({ page }) => {
  await page.goto('/discover/');
  await expect(page.locator('.space-sky')).toHaveCount(0);
  const bodyBackgroundImage = await page.evaluate(
    () => getComputedStyle(document.body).backgroundImage,
  );
  expect(bodyBackgroundImage).toBe('none');
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(11, 11, 10)',
  );
});

test('keeps content sections transparent within one translucent reading panel', async ({
  page,
}) => {
  await page.goto('/');
  const opaqueSections = await page.evaluate(
    () =>
      Array.from(
        document.querySelectorAll(
          'main > section, .edition-chapters > section',
        ),
      ).filter((section) => {
        const { backgroundColor, backgroundImage } = getComputedStyle(section);
        return (
          backgroundImage !== 'none' ||
          !/rgba\(0, 0, 0, 0\)|transparent/.test(backgroundColor)
        );
      }).length,
  );
  expect(opaqueSections).toBe(0);
});

test('plays each scene transition once and leaves nothing running afterwards', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute(
    'data-motion-ready',
    'true',
  );
  await expect(page.locator('[data-home-hero]')).toHaveAttribute(
    'data-motion-state',
    'entered',
  );

  await page.locator('.setlist-preview').scrollIntoViewIfNeeded();
  await expect(page.locator('.setlist-preview')).toHaveAttribute(
    'data-motion-state',
    'entered',
  );
  await page.locator('.guide-shortcuts').scrollIntoViewIfNeeded();
  await expect(page.locator('.guide-shortcuts')).toHaveAttribute(
    'data-motion-state',
    'entered',
  );

  await page.waitForTimeout(900);
  const running = () =>
    page.evaluate(
      () =>
        document
          .getAnimations()
          .filter(
            (animation) =>
              animation.playState === 'running' &&
              !(
                animation.effect as KeyframeEffect | null
              )?.target?.classList.contains('space-sky') &&
              !(
                animation.effect as KeyframeEffect | null
              )?.target?.hasAttribute('data-cloud-motion') &&
              !(
                animation.effect as KeyframeEffect | null
              )?.target?.hasAttribute('data-eclipse-ambient') &&
              !(animation.effect as KeyframeEffect | null)?.target?.closest(
                '.eclipse-weather',
              ) &&
              !(animation instanceof CSSTransition),
          ).length,
    );
  await expect.poll(running).toBe(0);
});

test('keeps repeated setlist rows out of reveal observation', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const observedTargets: string[] = [];
    const NativeIntersectionObserver = window.IntersectionObserver;
    class TrackedIntersectionObserver extends NativeIntersectionObserver {
      observe(target: Element) {
        observedTargets.push(
          target.hasAttribute('data-song-id')
            ? `${target.tagName.toLowerCase()}[data-song-id]`
            : target.tagName.toLowerCase(),
        );
        return super.observe(target);
      }
    }
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: TrackedIntersectionObserver,
    });
    (
      window as Window & { __motionObservedTargets?: string[] }
    ).__motionObservedTargets = observedTargets;
  });
  await page.goto('/setlist/');
  const rows = page.locator('.expected-setlist__list > li');
  await expect(rows).toHaveCount(38);
  expect(
    await rows.evaluateAll(
      (elements) =>
        elements.filter(
          (element) =>
            element.hasAttribute('data-enter') ||
            element.hasAttribute('data-enter-group'),
        ).length,
    ),
  ).toBe(0);
  expect(
    await page.evaluate(
      () =>
        (
          window as Window & { __motionObservedTargets?: string[] }
        ).__motionObservedTargets?.filter((target) =>
          target.endsWith('[data-song-id]'),
        ) ?? [],
    ),
  ).toEqual([]);
});

test('reduced motion never marks the document motion-ready', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForTimeout(500);
  await expect(page.locator('html')).not.toHaveAttribute(
    'data-motion-ready',
    /.+/,
  );
  await expect(page.locator('.dawn-sky__still img')).toBeVisible();
});

test('keeps only the tour title and eclipse above the pamphlet contents', async ({
  page,
}) => {
  await page.goto('/');
  const hero = page.locator('[data-home-hero]');
  await expect(hero).toHaveText(/^[\s]*AFTER HOURS\s+TIL DAWN\s*$/);
  await expect(hero.locator('a, eclipse-countdown')).toHaveCount(0);
  await expect(
    page.getByRole('navigation', { name: '팜플렛 목차' }),
  ).toBeVisible();
});
