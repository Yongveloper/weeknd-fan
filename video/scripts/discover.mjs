import { chromium } from 'playwright';
const OUT = process.argv[2];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, reducedMotion: 'reduce', isMobile: true, hasTouch: true, locale: 'ko-KR' });
const p = await ctx.newPage();
await p.goto('https://weeknd-goyang-guide.yongveloper.workers.dev/discover/', { waitUntil: 'networkidle' });
const h = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < h; y += 300) { await p.evaluate((v) => window.scrollTo(0, v), y); await p.waitForTimeout(60); }
await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);
await p.screenshot({ path: `${OUT}/discover-top.png` });
await p.screenshot({ path: `${OUT}/discover-full.png`, fullPage: true });
await p.evaluate(() => { for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); if (cs.position === 'fixed' || cs.position === 'sticky') el.style.visibility = 'hidden'; } for (const a of document.querySelectorAll('a')) if (a.textContent.includes('본문으로 건너뛰기')) a.style.display = 'none'; });
for (const [name, text] of [['discover-albums', '정규 앨범 6장'], ['discover-trilogy', '두 개의 Trilogy를 헷갈리지 않기']]) {
  const el = p.locator('section', { has: p.getByRole('heading', { name: text }) }).last();
  await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(200);
  await el.screenshot({ path: `${OUT}/${name}.png` });
  const bb = await el.boundingBox(); console.log(name, Math.round(bb.width), Math.round(bb.height));
}
await b.close();
