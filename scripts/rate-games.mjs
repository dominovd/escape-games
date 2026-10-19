#!/usr/bin/env node
// Works out difficulty and playing time for every playable game from its game.json,
// using the same engine the game runs on (public/play/<slug>/engine). Writes src/data/rated.json.
// Runs before "dev" and "build"; games.ts uses these values instead of hand-set ones.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const play = join(root, 'public/play');
const out = {};
for (const slug of readdirSync(play).sort()) {
  const eng = join(play, slug, 'engine'), gdir = join(play, slug, 'games');
  if (!existsSync(join(eng, 'difficulty.js')) || !existsSync(gdir)) continue;
  const core = await import(pathToFileURL(join(eng, 'core.js')).href);
  const { rate, LEVELS } = await import(pathToFileURL(join(eng, 'difficulty.js')).href);
  const rooms = [];
  for (const g of readdirSync(gdir).sort()) {
    const f = join(gdir, g, 'game.json');
    if (!existsSync(f)) continue;
    const game = JSON.parse(readFileSync(f, 'utf8'));
    const res = core.validate(game);
    if (!res.path || !res.path.length) { console.warn(`rate-games: ${slug}/${g} has no walkthrough, skipped`); continue; }
    rooms.push(rate(game, res.path, core.newState(game)));
  }
  if (!rooms.length) continue;
  // Several rooms in one game: tasks add up, so does the time.
  const score = Math.round(rooms.reduce((a, r) => a + r.score, 0) * 10) / 10;
  out[slug] = {
    difficulty: LEVELS.filter(([, min]) => score >= min).pop()[0],
    score,
    minutes: rooms.reduce((a, r) => a + r.minutes, 0),
    tasks: rooms.reduce((a, r) => a + r.factors.tasks, 0),
  };
}
writeFileSync(join(root, 'src/data/rated.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`rate-games: ${Object.keys(out).length} games rated`);
