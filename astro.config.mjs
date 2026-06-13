// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://kolosei.com',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    routing: { prefixDefaultLocale: false },
  },
  redirects: {
    '/projects': '/products',
    '/ru/projects': '/ru/products',
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', ru: 'ru' },
      },
    }),
  ],
});
