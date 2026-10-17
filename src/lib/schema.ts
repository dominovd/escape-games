import type { Game } from '../data/games';
import { SITE } from '../data/site';
import { themeBySlug } from '../data/themes';

const abs = (path: string, site: URL) => new URL(path, site).toString();

export const breadcrumbLd = (items: { name: string; href: string }[], site: URL) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.href, site) })),
});

export const gameLd = (g: Game, site: URL) => ({
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: g.title,
  url: abs(`/games/${g.slug}/`, site),
  description: g.description[0],
  image: g.image && g.coverIndex === undefined ? abs(g.image, site) : undefined,
  genre: ['Escape room', 'Puzzle', ...g.themes.map((t) => themeBySlug(t)?.name).filter(Boolean)],
  gamePlatform: g.mobile ? ['Web browser', 'Mobile browser'] : ['Web browser'],
  applicationCategory: 'Game',
  playMode: 'SinglePlayer',
  isAccessibleForFree: true,
  datePublished: g.added,
  offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' },
  publisher: { '@type': 'Organization', name: SITE.name, url: site.toString() },
});

export const itemListLd = (games: Game[], site: URL) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: games.map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/games/${g.slug}/`, site), name: g.title })),
});

export const websiteLd = (site: URL) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE.name,
  url: site.toString(),
});
