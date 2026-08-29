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
});

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
