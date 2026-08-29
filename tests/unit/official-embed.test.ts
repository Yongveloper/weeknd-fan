import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { chromium } from 'playwright';
import { expect as playwrightExpect } from '@playwright/test';
import { describe, expect, it } from 'vitest';
import OfficialEmbed from '../../src/components/content/OfficialEmbed.astro';

describe('OfficialEmbed', () => {
  it('loads each of two embeds with its own title and URL', async () => {
    const container = await AstroContainer.create();
    const [first, second] = await Promise.all([
      container.renderToString(OfficialEmbed, {
        props: {
          url: 'https://www.youtube.com/embed/first-video',
          songTitle: 'First Song',
        },
      }),
      container.renderToString(OfficialEmbed, {
        props: {
          url: 'https://www.youtube.com/embed/second-video',
          songTitle: 'Second Song',
        },
      }),
    ]);
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.route('https://www.youtube.com/**', (route) =>
      route.fulfill({ contentType: 'text/html', body: '' }),
    );
    await page.setContent(`${first}${second}`);
    const embeds = await page.evaluate(() =>
      Array.from(document.querySelectorAll('official-embed')).map((embed) => {
        embed.querySelector('button')?.click();
        const iframe = embed.querySelector('iframe');
        return { src: iframe?.getAttribute('src'), title: iframe?.title };
      }),
    );

    expect(embeds).toEqual([
      {
        src: 'https://www.youtube.com/embed/first-video',
        title: 'First Song 공식 미디어',
      },
      {
        src: 'https://www.youtube.com/embed/second-video',
        title: 'Second Song 공식 미디어',
      },
    ]);
    await playwrightExpect(page.locator('iframe')).toHaveCount(2);

    await browser.close();
  }, 15_000);

  it('clears its timeout when media errors or its host disconnects', async () => {
    const container = await AstroContainer.create();
    const markup = await container.renderToString(OfficialEmbed, {
      props: {
        url: 'https://www.youtube.com/embed/cleanup-video',
        songTitle: 'Cleanup Song',
      },
    });
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.setContent(markup);
    const result = await page.evaluate(async () => {
      const cleared = [];
      const nativeClearTimeout = window.clearTimeout;
      window.clearTimeout = (id) => {
        cleared.push(id);
        nativeClearTimeout(id);
      };
      const embed = document.querySelector('official-embed');
      if (!embed) throw new Error('Missing official embed fixture');
      embed.querySelector('button')?.click();
      embed.querySelector('iframe')?.dispatchEvent(new Event('error'));
      const clearedOnError = cleared.length;

      embed.querySelector('button')?.click();
      embed.remove();
      await Promise.resolve();
      return { clearedOnError, clearedAfterDisconnect: cleared.length };
    });

    expect(result.clearedOnError).toBeGreaterThan(0);
    expect(result.clearedAfterDisconnect).toBeGreaterThan(
      result.clearedOnError,
    );
    await browser.close();
  }, 15_000);
});
