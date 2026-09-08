// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { facts } from './src/data/linguistpro.ts';

export default defineConfig({
  site: 'https://kolosei.com',
  trailingSlash: 'always',
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
      filter: (page) => !/\/(?:ru\/)?projects\/?$/.test(new URL(page).pathname),
      serialize: (item) => {
        if (/^\/(ru\/)?(products\/(linguistpro|reading-room)\/|agents\/|guides\/.*|about\/|privacy\/|technology\/)?$/.test(new URL(item.url).pathname)) item.lastmod = new Date(facts.reviewed);
        return item;
      },
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', ru: 'ru' },
      },
    }),
  ],
});
