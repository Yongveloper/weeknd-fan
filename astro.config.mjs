import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

/* global process */
export default defineConfig({
  output: 'static',
  site: process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321',
  integrations: [sitemap()],
  image: {
    layout: 'constrained',
    responsiveStyles: true,
  },
});
