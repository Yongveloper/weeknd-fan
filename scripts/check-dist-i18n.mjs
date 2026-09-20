import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

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

/** `dist/en/goyang/index.html` → { locale: 'en', route: 'goyang/' } */
function describe(relative) {
  const withoutFile = relative.replace(/index\.html$/, '');
  if (withoutFile === 'en/' || withoutFile.startsWith('en/'))
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
  const head = html.slice(0, html.indexOf('</head>'));

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
  void relative;
  void locale;
  void route;
  void html;
  void fail;
}

if (failures.length) {
  for (const line of failures) process.stderr.write(`${line}\n`);
  process.stderr.write(`\n${failures.length} dist i18n failures\n`);
  process.exit(1);
}
process.stdout.write(`dist i18n ok\t${pages.length} pages\n`);
