import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://steamnewsdaily.com',
  output: 'static',
  prefetch: true,
  integrations: [
    tailwind(),
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-US',
          zh: 'zh-CN',
          ja: 'ja-JP',
          ko: 'ko-KR',
          es: 'es-ES',
          fr: 'fr-FR',
          de: 'de-DE',
          pt: 'pt-BR',
          ru: 'ru-RU',
          ar: 'ar-SA',
          tr: 'tr-TR',
        },
      },
    }),
  ],
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});
