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

// Allowed bilingual proper nouns and the switcher's own korean label.
const ALLOWED_KOREAN = ['고양종합운동장', '대화역', '한국어'];

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

// 1. Every route exists in both locales, and only there.
for (const route of ROUTES) {
  for (const prefix of ['', 'en/']) {
    const expected = path.join(DIST, prefix, route, 'index.html');
    if (!pages.includes(expected)) fail(`${prefix}${route}`, 'route missing');
  }
}
if (pages.some((file) => path.relative(DIST, file).startsWith('en/en/')))
  fail('en/en', 'locale prefix doubled');

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
  // Only the parts this task localizes. Page <head> metadata and body-level
  // widgets are translated by tasks 6-9 and are checked at the end of the
  // phase (Task 10 widens this to the full chrome including <head>).
  const headerStart = html.indexOf('<header');
  const headerEnd = html.indexOf('</header>');
  if (headerStart === -1 || headerEnd === -1) {
    fail(relative, 'no <header>');
    return;
  }
  const footerStart = html.indexOf('<footer');
  const footerEnd = html.indexOf('</footer>');
  if (footerStart === -1 || footerEnd === -1) {
    fail(relative, 'no <footer>');
    return;
  }
  const header = html.slice(headerStart, headerEnd + 9);
  const footer = html.slice(footerStart, footerEnd + 9);
  const skipLink =
    /<a[^>]*class="skip-link"[^>]*>[\s\S]*?<\/a>/.exec(html)?.[0] ?? '';
  const chrome = `${header}${footer}${skipLink}`;

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

  // Task 7 — the english home carries no korean ui label
  if (locale === 'en' && route === '') {
    const mainStart = html.indexOf('<main');
    const mainEnd = html.indexOf('</main>');
    if (mainStart === -1 || mainEnd === -1) {
      fail(relative, 'no <main> — cannot check the content area');
      return;
    }
    const main = html.slice(mainStart, mainEnd);
    const body = html.slice(html.indexOf('<body'));
    if (/[가-힣]/.test(stripAllowedKorean(body.replace(main, ''))))
      fail(
        relative,
        'korean text left outside the content area of the english home',
      );
  }
}

if (failures.length) {
  for (const line of failures) process.stderr.write(`${line}\n`);
  process.stderr.write(`\n${failures.length} dist i18n failures\n`);
  process.exit(1);
}
process.stdout.write(`dist i18n ok\t${pages.length} pages\n`);
