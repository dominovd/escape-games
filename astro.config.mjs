// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { games } from './src/data/games.ts';
import { themes } from './src/data/themes.ts';

// Домен сайта: задать в Vercel как переменную окружения SITE_URL
// (или поменять значение по умолчанию ниже).
const SITE_URL = process.env.SITE_URL || 'https://playescapegames.com';

// Страницы демо-игр (sample: true) не попадают в sitemap.
const samplePaths = games.filter((g) => g.sample).map((g) => `/games/${g.slug}/`);
const seriesSlugs = [...new Set(games.filter((g) => g.series).map((g) => g.series.slug))];
seriesSlugs
  .filter((s) => games.filter((g) => g.series?.slug === s).every((g) => g.sample))
  .forEach((s) => samplePaths.push(`/series/${s}/`));
// Хабы, где пока только демо-игры (страница получает noindex)
themes
  .filter((t) => {
    const list = games.filter((g) => g.themes.includes(t.slug));
    return list.length > 0 && list.every((g) => g.sample);
  })
  .forEach((t) => samplePaths.push(`/${t.slug}-escape-games/`));

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  server: { port: 4322 },
  build: { format: 'directory' },
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        if (path.startsWith('/search/')) return false;
        return !samplePaths.some((p) => path.startsWith(p));
      },
    }),
  ],
});
