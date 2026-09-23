import { chromium } from 'playwright';
const B = 'https://weeknd-goyang-guide.yongveloper.workers.dev';
const OUT = process.argv[2];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, reducedMotion: 'reduce', isMobile: true, hasTouch: true, locale: 'ko-KR' });
const page = await ctx.newPage();
async function settle() {
  await page.evaluate(() => document.querySelectorAll('main details').forEach((d) => (d.open = true)));
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 300) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(60); }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300);
  await page.evaluate(() => { for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); if (cs.position === 'fixed' || cs.position === 'sticky') el.style.visibility = 'hidden'; } for (const a of document.querySelectorAll('a')) if (a.textContent.includes('본문으로 건너뛰기')) a.style.display = 'none'; });
}
async function shotSection(name, headingText, opts = {}) {
  const el = page.locator(opts.sel ?? 'section, details, footer, figure, article', { has: page.getByText(headingText, { exact: opts.exact ?? false }) }).last();
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  await el.screenshot({ path: `${OUT}/${name}.png` });
  console.log(name, Math.round(box.width), Math.round(box.height));
}
// home
await page.goto(B + '/', { waitUntil: 'networkidle' }); await settle();
await shotSection('home-contents', '기다림을 담아두기', { sel: 'details' });
await shotSection('home-setlist', '최근 2026년 공연 5회 비교', { sel: 'section' });
await shotSection('home-guide', '귀가 확인', { sel: 'section' });
await shotSection('home-fan-note', '모르는 곡이 있어도 괜찮아요', { sel: 'section' });
await shotSection('footer', '비공식·비영리 팬 가이드', { sel: 'footer' });
// setlist page top (badge)
await page.goto(B + '/setlist/', { waitUntil: 'networkidle' }); await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/setlist-top.png` });
// goyang
await page.goto(B + '/goyang/', { waitUntil: 'networkidle' }); await settle();
await page.screenshot({ path: `${OUT}/goyang-top.png` });
await shotSection('goyang-official', '공식 공연 정보', { sel: 'section', exact: true });
// ticket
await page.goto(B + '/share/ticket/', { waitUntil: 'networkidle' });
const selects = page.locator('main select');
const n = await selects.count();
for (let i = 0; i < n; i++) { const opts = await selects.nth(i).locator('option').allTextContents(); await selects.nth(i).selectOption({ index: [5, 30, 34][i] ?? 1 }); console.log('select', i, opts[[5, 30, 34][i] ?? 1]); }
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/ticket-form.png`, fullPage: true });
const img = page.locator('main img, main canvas').first();
await img.screenshot({ path: `${OUT}/ticket-preview.png` }).catch((e) => console.log('preview fail', e.message));
await browser.close();
