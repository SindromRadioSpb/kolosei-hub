// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://kolosei.com',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
});
