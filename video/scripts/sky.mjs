import { chromium } from 'playwright';
const OUT = process.argv[2];
const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'ko-KR' });
const p = await ctx.newPage();
await p.goto('https://weeknd-goyang-guide.yongveloper.workers.dev/', { waitUntil: 'networkidle' });
await p.waitForTimeout(9000);
const info = await p.evaluate(() => {
  document.querySelectorAll('header, [class*="pamphlet"], footer').forEach((e) => (e.style.visibility = 'hidden'));
  const hero = document.querySelector('[data-home-hero]');
  const hidden = [];
  for (const el of hero.querySelectorAll('*')) {
    if (el.closest('moon-light') || el.tagName === 'CANVAS' || el.querySelector('canvas, moon-light')) continue;
    if (/heading|title|dawn|after|kicker|glow|corona/i.test(String(el.className))) { el.style.visibility = 'hidden'; hidden.push(String(el.className).slice(0, 40)); }
  }
  hero.style.setProperty('--dawn-glow', '0');
  return hidden;
});
console.log(info.join(' | '));
await p.waitForTimeout(400);
await p.screenshot({ path: `${OUT}/sky-home-moon.png` });
await p.evaluate(() => { document.querySelectorAll('moon-light').forEach((e) => (e.style.visibility = 'hidden')); });
await p.waitForTimeout(400);
await p.screenshot({ path: `${OUT}/sky-home-clouds.png` });
await b.close();
