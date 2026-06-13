// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://kolosei.com',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
  redirects: {
    '/projects': '/products',
  },
  integrations: [sitemap()],
});
