import { chromium } from 'playwright';
const B = 'https://weeknd-goyang-guide.yongveloper.workers.dev';
const OUT = process.argv[2];
const b = await chromium.launch();
const hideFixed = () => { for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); if (cs.position === 'fixed' || cs.position === 'sticky') el.style.visibility = 'hidden'; } for (const a of document.querySelectorAll('a')) if (a.textContent.includes('본문으로 건너뛰기')) a.style.display = 'none'; };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, reducedMotion: 'reduce', isMobile: true, hasTouch: true, locale: 'ko-KR' });
const p = await ctx.newPage();
await p.goto(B + '/discover/', { waitUntil: 'networkidle' });
const settle = async () => { const h = await p.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y < h; y += 300) { await p.evaluate((v) => window.scrollTo(0, v), y); await p.waitForTimeout(50); } await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400); };
await settle();
// keep the sticky header visible at the very top of the page (it is part of the page), hide only overlays below it
await p.evaluate(() => { for (const a of document.querySelectorAll('a')) if (a.textContent.includes('본문으로 건너뛰기')) a.style.display = 'none'; for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); if (cs.position === 'fixed' && !el.closest('header')) el.style.visibility = 'hidden'; } });
const anchors = async () => p.evaluate(() => Object.fromEntries([...document.querySelectorAll('main h2, main h3')].map(e => [e.textContent.trim().replace(/\s+/g,' ').slice(0,30), Math.round(e.getBoundingClientRect().top + scrollY)])));
const a1 = await anchors();
await p.screenshot({ path: `${OUT}/discover-scroll-closed.png`, fullPage: true });
const h1 = await p.evaluate(() => document.documentElement.scrollHeight);
// open the 2020 After Hours "더 깊이 보기"
const handle = await p.evaluateHandle(() => { const h = [...document.querySelectorAll('main h3')].find((e) => e.textContent.includes('2020') && e.textContent.includes('After Hours')); let el = h; while (el && !el.querySelector('details')) el = el.parentElement; return el.querySelector('details'); });
const sumTop = await handle.evaluate((d) => Math.round(d.getBoundingClientRect().top + scrollY));
await handle.evaluate((d) => { d.open = true; });
await p.waitForTimeout(900);
const h2 = await p.evaluate(() => document.documentElement.scrollHeight);
const detBox = await handle.evaluate((d) => { const r = d.getBoundingClientRect(); return { top: Math.round(r.top + scrollY), height: Math.round(r.height) }; });
await p.screenshot({ path: `${OUT}/discover-scroll-afterhours-open.png`, fullPage: true });
console.log(JSON.stringify({ closedHeight: h1, openHeight: h2, afterHoursDetailsTop: sumTop, openDetails: detBox, anchors: a1 }, null, 1));
// sky only (clouds) from the 404 page, 1080x1920
const sky = await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'ko-KR' });
for (const [name, path] of [['sky-404', '/does-not-exist/'], ['sky-goyang', '/goyang/']]) {
  const sp = await sky.newPage();
  await sp.goto(B + path, { waitUntil: 'networkidle' }); await sp.waitForTimeout(3000);
  await sp.evaluate(() => { for (const sel of ['header', 'main', 'footer', 'nav']) document.querySelectorAll(sel).forEach((e) => (e.style.visibility = 'hidden')); });
  await sp.waitForTimeout(500);
  await sp.screenshot({ path: `${OUT}/${name}.png` });
}
await b.close();
