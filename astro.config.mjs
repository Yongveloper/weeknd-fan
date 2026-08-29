import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

/* global process, URL */
const publicSiteUrl = getPublicSiteUrl(process.env.PUBLIC_SITE_URL);

export default defineConfig({
  output: 'static',
  site: publicSiteUrl,
  integrations: publicSiteUrl ? [sitemap()] : [],
  image: {
    layout: 'constrained',
    responsiveStyles: true,
  },
});

function getPublicSiteUrl(value) {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol)
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}
