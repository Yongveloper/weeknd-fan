import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

/* global URL */

const DIST = path.resolve(process.env.CHECK_DIST_ROOT ?? 'dist');

const ROUTES = [
  '',
  'discover/',
  'setlist/',
  'goyang/',
  'sources/',
  'share/ticket/',
  'share/setlist/',
];

const failures = [];
const fail = (where, why) => failures.push(`${where}: ${why}`);

// The locale switcher names korean in korean on every page, including the
// english ones. Nothing else korean is allowed outside <main>. Bilingual
// proper nouns are not listed here: they render inside <main>, which the
// chrome check already excludes. Add to this list only for a string that a
// failing run actually names.
const ALLOWED_KOREAN = ['한국어'];

function stripAllowedKorean(fragment) {
  return ALLOWED_KOREAN.reduce(
    (text, allowed) => text.replaceAll(allowed, ''),
    fragment,
  );
}

/** `dist/en/goyang/index.html` → { locale: 'en', route: 'goyang/' } */
function describe(relative) {
  const withoutFile = relative.replace(/index\.html$/, '');
  if (withoutFile.startsWith('en/'))
    return { locale: 'en', route: withoutFile.slice(3) };
  return { locale: 'ko', route: withoutFile };
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.name === 'index.html') out.push(full);
  }
  return out;
}

const pages = await walk(DIST);

// 1. Every route exists in both locales, and nothing else is built.
// Both halves matter. Without the second, a page added outside the localized
// route tree ships korean-only with hreflang pointing at a 404, and the
// checker still exits 0 — the page count is printed, never checked.
const expectedPages = new Set(
  ROUTES.flatMap((route) =>
    ['', 'en/'].map((prefix) => path.join(DIST, prefix, route, 'index.html')),
  ),
);
for (const expected of expectedPages)
  if (!pages.includes(expected))
    fail(path.relative(DIST, expected), 'route missing');
for (const file of pages)
  if (!expectedPages.has(file))
    fail(
      path.relative(DIST, file),
      'unexpected page — add the route to ROUTES or remove the page',
    );

// 2-6. Per-page assertions.
for (const file of pages) {
  const relative = path.relative(DIST, file);
  const { locale, route } = describe(relative);
  const html = await readFile(file, 'utf8');
  const headEnd = html.indexOf('</head>');
  if (headEnd === -1) {
    fail(relative, 'no </head> — cannot check head-only assertions');
    continue;
  }
  const head = html.slice(0, headEnd);

  const lang = /<html[^>]*\blang="([^"]+)"/.exec(html)?.[1];
  if (lang !== locale)
    fail(relative, `html lang is ${lang}, expected ${locale}`);

  const canonicals = head.match(/<link[^>]+rel="canonical"/g) ?? [];
  if (canonicals.length !== 1)
    fail(relative, `${canonicals.length} canonical links, expected 1`);

  const alternates = [
    ...head.matchAll(/<link[^>]+rel="alternate"[^>]+hreflang="([^"]+)"/g),
  ].map((match) => match[1]);
  const expectedAlternates = ['ko', 'en', 'x-default'];
  if (
    alternates.length !== 3 ||
    expectedAlternates.some((value) => !alternates.includes(value))
  )
    fail(relative, `alternates were [${alternates}], expected ko/en/x-default`);

  checkPage({ relative, locale, route, html, fail });
}

/** Assertions later tasks extend. Kept separate so each task adds one block. */
function checkPage({ relative, locale, route, html, fail }) {
  // Task 4 — chrome
  // Every part of an english page outside the content area must be english:
  // <head> metadata, the header, the footer and body-level widgets.
  const chromeMainStart = html.indexOf('<main');
  const chromeMainEnd = html.indexOf('</main>');
  if (chromeMainStart === -1 || chromeMainEnd === -1) {
    fail(relative, 'no <main> — cannot check the chrome');
    return;
  }
  const chromeMain = html.slice(
    chromeMainStart,
    chromeMainEnd + '</main>'.length,
  );
  const chrome = html.replace(chromeMain, '');

  const switcherLinks = [...chrome.matchAll(/<a\b[^>]*>/g)]
    .map(([tag]) => tag)
    .filter((tag) => /hreflang="(?:ko|en)"/.test(tag));

  if (switcherLinks.length !== 2)
    fail(relative, `${switcherLinks.length} locale switcher links, expected 2`);

  for (const tag of switcherLinks) {
    const target = /hreflang="(ko|en)"/.exec(tag)?.[1];
    const href = /href="([^"]+)"/.exec(tag)?.[1];
    const want = target === 'ko' ? `/${route}` : `/en/${route}`;
    if (href !== want)
      fail(relative, `${target} switcher points at ${href}, expected ${want}`);
  }

  const currentTag = switcherLinks.find((tag) =>
    /aria-current="true"/.test(tag),
  );
  if (/hreflang="(ko|en)"/.exec(currentTag ?? '')?.[1] !== locale)
    fail(relative, 'the switcher does not mark the current locale');

  if (locale === 'en' && /[가-힣]/.test(stripAllowedKorean(chrome)))
    fail(relative, 'korean text left in the english chrome');

  // Task 10 — the switcher must stay a plain link so it works without js
  const switcherMarkup =
    /<nav[^>]+class="locale-switcher"[\s\S]*?<\/nav>/.exec(html)?.[0] ?? '';
  if (!switcherMarkup) fail(relative, 'no locale switcher found');
  if (
    /<script|onclick=|data-astro-cid-[^"]*"[^>]*type="module"/.test(
      switcherMarkup,
    )
  )
    fail(relative, 'the locale switcher depends on javascript');

  // Task 5 — canonical and x-default targets
  const canonical =
    /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/.exec(html)?.[1] ?? '';
  const canonicalPath = new URL(canonical, 'https://placeholder.test').pathname;
  const wantCanonical = locale === 'ko' ? `/${route}` : `/en/${route}`;
  if (canonicalPath !== wantCanonical)
    fail(relative, `canonical is ${canonicalPath}, expected ${wantCanonical}`);

  const xDefault =
    /<link[^>]+hreflang="x-default"[^>]+href="([^"]+)"/.exec(html)?.[1] ?? '';
  if (new URL(xDefault, 'https://placeholder.test').pathname !== `/${route}`)
    fail(relative, 'x-default does not point at the korean route');

  const ogLocale = /<meta[^>]+property="og:locale"[^>]+content="([^"]+)"/.exec(
    html,
  )?.[1];
  if (ogLocale !== (locale === 'ko' ? 'ko_KR' : 'en_US'))
    fail(relative, `og:locale is ${ogLocale}`);

  // Task 6 — guide chrome is translated, the venue keeps its korean original
  if (route === 'goyang/') {
    if (!html.includes('고양종합운동장'))
      fail(relative, 'the venue lost its korean original');
    if (locale === 'en' && !html.includes('Goyang Stadium · 고양종합운동장'))
      fail(relative, 'the english venue is not shown bilingually');
  }

  // Task 8 — the guarantee disclaimer survives translation
  if (route === 'setlist/') {
    const want =
      locale === 'ko' ? '예상 · 보장 아님' : 'Expected · not guaranteed';
    if (!html.includes(want))
      fail(relative, `the setlist page does not carry "${want}"`);
  }

  // Task 9 — the share surface carries the same disclaimer as the page
  if (route === 'share/setlist/') {
    const want =
      locale === 'ko' ? '예상 · 보장 아님' : 'Expected · not guaranteed';
    if (!html.includes(want))
      fail(relative, `the setlist share page does not carry "${want}"`);
  }

  // Task 9 — the english share builders carry no korean form copy
  if (locale === 'en' && route.startsWith('share/')) {
    if (/[가-힣]/.test(stripAllowedKorean(chromeMain)))
      fail(relative, 'korean text left in the english share builder');
  }

  // Phase 2 Task 4 — translated bodies land, untranslated ones say so
  if (locale === 'en' && route === 'goyang/') {
    if (!html.includes('Cross one crosswalk from Exit 3'))
      fail(relative, 'the translated guide body did not render');
  }
  if (locale === 'ko' && html.includes('This section is shown in Korean.'))
    fail(relative, 'the fallback notice leaked onto a korean page');

  // Every untranslated section carries the notice. Phase 2 Task 10 tightens
  // this to zero once all 25 overlays exist.
  if (locale === 'en') {
    const notices = (html.match(/This section is shown in Korean\./g) ?? [])
      .length;
    if (route === 'goyang/' && notices === 0)
      fail(relative, 'no fallback notice on a page with untranslated sections');
  }
}

if (failures.length) {
  for (const line of failures) process.stderr.write(`${line}\n`);
  process.stderr.write(`\n${failures.length} dist i18n failures\n`);
  process.exit(1);
}
process.stdout.write(`dist i18n ok\t${pages.length} pages\n`);
