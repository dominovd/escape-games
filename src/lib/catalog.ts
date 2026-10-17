import { games, type Game, type Difficulty } from '../data/games';
import { themes, themeBySlug, type Theme } from '../data/themes';
import { SITE } from '../data/site';

export const byNewest = (a: Game, b: Game) => b.added.localeCompare(a.added);

export const gamesInTheme = (slug: string) => games.filter((g) => g.themes.includes(slug)).sort(byNewest);

/** Хабы, в которых достаточно игр для публикации. Только они попадают в меню, плитки и футер. */
export const liveThemes = (): Theme[] => themes.filter((t) => gamesInTheme(t.slug).length >= SITE.minGamesPerHub);

export const isLiveTheme = (slug: string) => liveThemes().some((t) => t.slug === slug);

export const hubUrl = (slug: string) => `/${slug}-escape-games/`;
export const gameUrl = (slug: string) => `/games/${slug}/`;
export const walkthroughUrl = (slug: string) => `/games/${slug}/walkthrough/`;
export const seriesUrl = (slug: string) => `/series/${slug}/`;

/** Основная тема игры, у которой есть живой хаб (для хлебных крошек). */
export const primaryTheme = (g: Game): Theme | undefined => {
  const live = g.themes.find((s) => isLiveTheme(s));
  return themeBySlug(live ?? g.themes[0]);
};

export const isNew = (g: Game, now = new Date()) => {
  const days = (now.getTime() - new Date(g.added).getTime()) / 86_400_000;
  return days >= 0 && days <= SITE.newBadgeDays;
};

export const difficultyLabel: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

export const featuredGames = () => {
  const f = games.filter((g) => g.featured);
  return (f.length ? f : games).slice().sort(byNewest).slice(0, 12);
};

export const newestGames = (n = games.length) => games.slice().sort(byNewest).slice(0, n);

export const relatedGames = (g: Game, n = 8) => {
  const scored = games
    .filter((o) => o.slug !== g.slug)
    .map((o) => ({ o, s: o.themes.filter((t) => g.themes.includes(t)).length + (o.difficulty === g.difficulty ? 0.5 : 0) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || byNewest(a.o, b.o));
  return scored.slice(0, n).map((x) => x.o);
};

export const seriesGames = (seriesSlug: string) =>
  games.filter((g) => g.series?.slug === seriesSlug).sort((a, b) => a.series!.part - b.series!.part);

export const nextInSeries = (g: Game) =>
  g.series ? seriesGames(g.series.slug).find((o) => o.series!.part === g.series!.part + 1) : undefined;

export const allSeries = () => {
  const map = new Map<string, string>();
  games.forEach((g) => g.series && map.set(g.series.slug, g.series.name));
  return [...map].map(([slug, name]) => ({ slug, name }));
};

export const accentOf = (g: Game) => themeBySlug(g.themes[0])?.accent ?? '#ff7a1a';
