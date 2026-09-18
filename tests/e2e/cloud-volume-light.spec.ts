import { expect, test } from '@playwright/test';
import sharp from 'sharp';

test('cloud folds lose direct light and warmth behind intervening cloud', async ({
  page,
}) => {
  await page.addInitScript(() => {
    for (const type of [WebGLRenderingContext, WebGL2RenderingContext]) {
      const source = type.prototype.shaderSource;
      type.prototype.shaderSource = function (shader, code) {
        if (
          code.includes('float bankCloud') &&
          !code.includes('#define FOREGROUND_MIST')
        ) {
          // Hold surface density, position and light energy constant. Only
          // the cloud between this surface and the sun changes by column.
          code = code.replace(
            'float litEdge =',
            `
            nearCloud = 0.38;
            farCloud = 0.12;
            nearBlocker = viewportUV.x < 0.333 ? 0.06 : viewportUV.x < 0.667 ? 0.35 : 0.85;
            farBlocker = nearBlocker*0.6;
            bankCloud = 0.0;
            bankBlocker = 0.0;
            leftRelief = 0.0;
            illumination = 1.0;
            directField = 1.0;
            reach = 0.8;
            titleLight = 0.0;
            cloudBrightness = 1.0;
            float litEdge =`,
          );
          if (code.includes('float nearPathBlocker')) {
            code = code.replace(
              'float litEdge =',
              'nearPathBlocker = nearBlocker; farPathBlocker = farBlocker; float litEdge =',
            );
          }
          code = code.replace('vec4(color,alpha)', 'vec4(cloudColor,1.0)');
        }
        source.call(this, shader, code);
      };
    }
  });
  await page.goto('/');
  await expect(page.locator('dawn-sky')).toHaveAttribute(
    'data-renderer',
    'webgl',
  );
  await page.addStyleTag({
    content:
      '.site-header,.dawn-sky__eclipse,.home-hero__content,.dawn-sky__foreground,.dawn-sky__grain,.reading-panel,.site-footer { visibility:hidden!important; }',
  });
  const canvas = page.locator('.dawn-sky__clouds');
  const frame = await canvas.screenshot({ scale: 'css' });
  const { width, height } = await sharp(frame).metadata();
  const sample = async (fraction: number) => {
    const { channels } = await sharp(
      await sharp(frame)
        .extract({
          left: Math.floor(width! * fraction),
          top: Math.floor(height! * 0.45),
          width: 8,
          height: 8,
        })
        .toBuffer(),
    ).stats();
    return channels.map((channel) => channel.mean);
  };
  const exposed = await sample(0.2);
  const halfLit = await sample(0.5);
  const occluded = await sample(0.8);
  // Shadows keep a visible body, but neither the gold wash nor an emitting
  // edge should survive full occlusion. Lit caps shift toward pale gold.
  expect(occluded[0]).toBeGreaterThan(3);
  expect(occluded[0]!).toBeLessThan(exposed[0]! * 0.35);
  expect(halfLit[0]!).toBeGreaterThan(occluded[0]! * 1.3);
  expect(halfLit[0]!).toBeLessThan(exposed[0]! * 0.8);
  expect(exposed[2]! / exposed[0]!).toBeGreaterThan(
    halfLit[2]! / halfLit[0]! + 0.06,
  );
});
