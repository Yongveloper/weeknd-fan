import { chromium } from 'playwright';
const B = 'https://weeknd-goyang-guide.yongveloper.workers.dev';
const OUT = process.argv[2];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'ko-KR', acceptDownloads: true });
for (const [name, path, picks] of [['ticket', '/share/ticket/', [5, 30, 34]], ['poster', '/share/setlist/', null]]) {
  const page = await ctx.newPage();
  await page.goto(B + path, { waitUntil: 'networkidle' });
  if (picks) { const s = page.locator('main select'); for (let i = 0; i < await s.count(); i++) await s.nth(i).selectOption({ index: picks[i] }); }
  await page.waitForTimeout(800);
  const btn = page.getByRole('button', { name: /저장/ }).first();
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), btn.click()]);
  await dl.saveAs(`${OUT}/${name}-export.png`);
  console.log(name, dl.suggestedFilename());
}
await browser.close();
