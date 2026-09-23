import { chromium } from 'playwright';
const B = 'https://weeknd-goyang-guide.yongveloper.workers.dev';
const OUT = process.argv[2];
const pages = [['home', '/'], ['discover', '/discover/'], ['setlist', '/setlist/'], ['goyang', '/goyang/'], ['ticket', '/share/ticket/'], ['poster', '/share/setlist/']];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, reducedMotion: 'reduce', isMobile: true, hasTouch: true, locale: 'ko-KR' });
for (const [name, path] of pages) {
  const page = await ctx.newPage();
  await page.goto(B + path, { waitUntil: 'networkidle' });
  // open every disclosure so collapsed content (mobile contents) is visible
  await page.evaluate(() => document.querySelectorAll('main details').forEach((d) => (d.open = true)));
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 300) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(80); }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}-full.png`, fullPage: true });
  await page.screenshot({ path: `${OUT}/${name}-top.png` });
  console.log(name, h);
  if (name === 'home') {
    const live = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'ko-KR' });
    const lp = await live.newPage();
    await lp.goto(B + '/', { waitUntil: 'networkidle' });
    await lp.waitForTimeout(9000);
    await lp.screenshot({ path: `${OUT}/home-hero-live.png` });
    await live.close();
  }
  await page.close();
}
await browser.close();
