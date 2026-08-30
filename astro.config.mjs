import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

/* global process, URL */
const publicSiteUrl = resolvePublicSiteUrl(process.env.PUBLIC_SITE_URL);

export default defineConfig({
  output: 'static',
  site: publicSiteUrl,
  integrations: publicSiteUrl ? [sitemap()] : [],
  image: {
    layout: 'constrained',
    responsiveStyles: true,
  },
  vite: {
    plugins: [notoSansKrOptionalFontDisplay()],
  },
});

/**
 * Noto Sans KR Variable ships as 124 unicode-range slices with
 * `font-display: swap`. Every slice that arrives after first paint forces a
 * full relayout, and on the home page those relayouts run 40-55ms - right at
 * the 50ms long-task budget the mobile performance evidence enforces.
 * `optional` renders the first visit with the system Korean font when the
 * slices are not yet cached and never swaps mid-page, so layout runs once.
 * Bebas Neue keeps `swap`: it is one face and carries the display identity.
 */
function notoSansKrOptionalFontDisplay() {
  return {
    name: 'noto-sans-kr-optional-font-display',
    transform(code, id) {
      if (!/@fontsource-variable\/noto-sans-kr\/.*\.css/.test(id)) return;
      return {
        code: code.replace(/font-display:\s*swap/g, 'font-display: optional'),
        map: null,
      };
    },
  };
}

export function resolvePublicSiteUrl(value) {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    if (['http:', 'https:'].includes(url.protocol)) return url.toString();
  } catch {
    // Normalize all invalid values to one actionable build-time error.
  }

  throw new Error('PUBLIC_SITE_URL must be an absolute HTTP(S) URL');
}
