#!/usr/bin/env node
// Переписывает тексты сайта через DeepSeek API и складывает результат в src/data/copy.json.
// Сайт берет текст из copy.json, если он там есть, иначе показывает исходный из games.ts / themes.ts / home.ts.
//
//   node scripts/rewrite-copy.mjs --home --themes halloween --games forgotten-lab,escape-the-garage
//   node scripts/rewrite-copy.mjs --all            # все, что еще не переписано
//   node scripts/rewrite-copy.mjs --all --force    # переписать заново, в том числе уже готовое
//   --dry    ничего не пишет в copy.json, только отчет
//
// Ключ: DEEPSEEK_API_KEY в окружении или в .env. Модель: DEEPSEEK_MODEL (по умолчанию deepseek-chat).
// Отчет «было / стало» для проверки: scripts/out/review.md

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'src/data');
const COPY_FILE = path.join(DATA, 'copy.json');
const OUT_DIR = path.join(ROOT, 'scripts/out');

try { process.loadEnvFile(path.join(ROOT, '.env')); } catch {}
const API_KEY = process.env.DEEPSEEK_API_KEY;
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const API_URL = process.env.DEEPSEEK_URL || 'https://api.deepseek.com/chat/completions';
const CONCURRENCY = 3;

// ───────────── CLI ─────────────
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const list = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1].split(',').map((s) => s.trim()) : null; };
const ALL = flag('all'), FORCE = flag('force'), DRY = flag('dry');
const wantHome = ALL || flag('home');
const wantThemes = ALL ? 'all' : flag('themes') ? (list('themes') ?? 'all') : null;
const wantGames = ALL ? 'all' : flag('games') ? (list('games') ?? 'all') : null;
if (!wantHome && !wantThemes && !wantGames) {
  console.log('Укажите, что переписать: --home, --themes [a,b], --games [a,b] или --all. Флаги: --force, --dry.');
  process.exit(1);
}
if (!API_KEY) { console.error('Нет DEEPSEEK_API_KEY (в окружении или в .env).'); process.exit(1); }

// ───────────── Загрузка исходных данных (без подмены из copy.json) ─────────────
// Копии файлов кладем во временную папку вне репозитория и импортируем оттуда (Node сам снимает типы).
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'rewrite-copy-'));
for (const f of fs.readdirSync(DATA)) {
  if (!/\.(ts|json)$/.test(f) || f === 'copy.json') continue;
  let src = fs.readFileSync(path.join(DATA, f), 'utf8');
  if (f.endsWith('.ts')) {
    src = src
      .replace(/import copy from '\.\/copy\.json';/, 'const copy = {};')
      .replace(/import (\w+) from '(\.\/[\w.-]+\.json)';/g, "import $1 from '$2' with { type: 'json' };")
      .replace(/from '\.\/(\w+)';/g, "from './$1.ts';");
  }
  fs.writeFileSync(path.join(TMP, f), src);
}
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {} });
async function loadAll() {
  const { themes } = await import(pathToFileURL(path.join(TMP, 'themes.ts')).href);
  const { games } = await import(pathToFileURL(path.join(TMP, 'games.ts')).href);
  const { home } = await import(pathToFileURL(path.join(TMP, 'home.ts')).href);
  return { themes, games, homeDefaults: { ...home } };
}

// ───────────── Стиль ─────────────
const STYLE = `You write copy for playescapegames.com, a site of free point-and-click escape room games that run in the browser.

Voice: a native US English speaker who actually plays these games, writing for other players. Plain, warm, specific. Talk to the reader as "you". Contractions are fine. Mix short and medium sentences. Concrete details from the facts beat adjectives.

Hard rules:
- Never use an em dash or en dash (— or –). Use a period, comma, colon or parentheses instead. No spaced hyphens as dashes either.
- Use straight quotes and apostrophes (' and ").
- No exclamation marks.
- Do not use these words or phrases: timer, deadline, start here, delve, embark, journey, tapestry, realm, immerse, immersive, unleash, unlock the secrets, dive into, plunge, thrilling, captivating, enthralling, spine-tingling, mind-bending, brain-teasing, adventure awaits, get ready, are you ready, whether you're, look no further, in this game, this game, ultimate, perfect for, a must, test your skills, put your skills to the test, hidden gem, seamless, elevate, navigate, intricate, myriad, vibrant, nestled, testament, ever-, beckons, awaits.
- No "not just X, but Y" constructions. No lists of three adjectives. No rhetorical questions in a row. No closing sentence that sums up or sells ("So grab...", "Can you escape?").
- Write it fresh. The current text is only a source of facts: do not keep its sentences, sentence order or signature images, and do not paraphrase it line by line.
- Headings (h2) in sentence case: only the first word and proper names capitalized.
- Capitalize theme names (Halloween, Christmas). Write the control labels exactly as "Mouse & touch" and "Best with a mouse".
- Every concrete image or detail (an object, a creature, a place, a theme like Christmas) must come from the facts. Do not invent scenery for intros.
- Never refer to your sources ("based on the page", "the description says").
- Use only the facts you are given. Do not invent puzzles, items, characters, features, numbers or promises (no "hundreds of games", no "updated daily", no accounts, no leaderboards, no hint buttons unless stated).
- No spoilers: never give solutions, codes, number sequences, color orders, or which item is used where. Do not add objects, actions or puzzle steps that the current description does not mention.
- SEO: use the main search phrase naturally once or twice, never stuffed. Do not repeat the page title over and over.
- Output valid JSON only, matching the requested shape exactly.`;

const SITE_FACTS = [
  'All games are free, run in the browser, no download, no account or sign-up.',
  'Each game page shows difficulty (easy, medium, hard), rough playing time in minutes, number of rooms and controls.',
  '"Mouse & touch" games work on phones and tablets; "Best with a mouse" games are for computers.',
  'Some games have a walkthrough page: each step shows a hint first, the full solution stays hidden until opened.',
  'Some games get new rooms over time ("more rooms coming"). The next room unlocks after you finish the previous one.',
  'Progress is saved automatically in your browser on that device; a finished room stays marked as done. Clearing browser data or switching device resets it.',
  'Games still in development are marked Coming soon.',
  'There is no countdown timer and no score. Playing time is only a rough estimate. Do not claim anything about penalties for wrong tries. Mention the lack of a countdown at most once per page, only where it answers something.',
  'Category pages have difficulty and playing time filters. The home page has no filters or sorting.',
  'Players can like or dislike a game on its page.',
];

// ───────────── Задачи ─────────────
const GENERIC_Q = ['how long it takes', 'whether it works on a phone or tablet', 'what to do when stuck (walkthrough)', 'whether progress is saved'];
let gameIndex = 0;
function gameTask(g, themesBySlug) {
  const genericQ = GENERIC_Q[gameIndex++ % GENERIC_Q.length];
  const themeNames = g.themes.map((s) => themesBySlug[s]?.name).filter(Boolean);
  const facts = {
    title: g.title,
    themes: themeNames,
    difficulty: g.difficulty,
    minutes: g.minutes,
    rooms_open: (g.roomList ?? []).filter((r) => r.status === 'open').map((r) => r.title),
    rooms_coming_soon: (g.roomList ?? []).filter((r) => r.status === 'soon').map((r) => r.title),
    more_rooms_coming: Boolean(g.moreRoomsComing),
    works_on_mobile: g.mobile,
    controls: g.controls,
    series: g.series ? `Part ${g.series.part} of the ${g.series.name} series` : null,
    has_walkthrough: Boolean(g.walkthrough),
    current_description: g.description,
  };
  const mainPhrase = `${themeNames[0] ? themeNames[0].toLowerCase() + ' ' : ''}escape game`;
  return {
    key: `games/${g.slug}`,
    label: `Game: ${g.title}`,
    secrets: secretsFrom(g),
    extra: (o) => {
      const e = [];
      const t = allText(o).toLowerCase();
      if (t.includes('countdown') || /\bno score\b/.test(t)) e.push('do not mention a countdown or score on a game page');
      if (!g.moreRoomsComing && !(g.roomList ?? []).some((r) => r.status === 'soon') && /more rooms|coming soon|on the way|rooms are planned|next room/.test(t)) e.push('this game has no more rooms coming; do not say or imply that more rooms are coming');
      const first = sentences((o.description ?? [''])[0])[0] ?? '';
      if (wc(first) > 25) e.push(`first sentence is ${wc(first)} words, must be under 25`);
      if (!first.includes(g.title)) e.push(`first sentence must contain the game name "${g.title}"`);
      return e;
    },
    old: { description: g.description, faq: g.faq ?? null },
    messages: [
      { role: 'system', content: STYLE },
      { role: 'user', content: `Rewrite the copy for the game page "${g.title}". Main search phrase: "${g.title}" and "${mainPhrase}" (also natural variants like "escape room", "play online").

Facts about the game (JSON):
${JSON.stringify(facts, null, 2)}

Site facts you may use in the FAQ:
${SITE_FACTS.map((f) => '- ' + f).join('\n')}

Write:
1. "description": 2 paragraphs, 90 to 150 words in total. The first sentence must work on its own as a search snippet: under 25 words, says what the game is and sets the scene. Paragraph 1: the setup and atmosphere. Paragraph 2: what you'll be doing (without spoilers), the difficulty and length in natural words, and who it suits. Only if more_rooms_coming is true or rooms_coming_soon is not empty, mention once that more rooms are coming; otherwise never mention future rooms. Do not mention countdowns or scores.
2. "faq": 4 questions real players would type into Google about this game. Exactly 1 of them is generic, and it must be about ${genericQ}. Do not ask the other generic questions (length, phone, stuck, saving). The others must be specific to this game: its story or setting, who it suits, how it compares in difficulty, more rooms, series order, whether it is scary. Each answer 1 to 3 sentences, answers the question in the first words, uses only the facts above. No selling lines.

Return JSON: {"description": ["...", "..."], "faq": [{"q": "...", "a": "..."}]}` },
    ],
    check: (o) => {
      const e = [];
      if (!Array.isArray(o.description) || o.description.length < 2 || o.description.length > 3) e.push('description must be 2 paragraphs');
      const words = wc((o.description ?? []).join(' '));
      if (words < 80 || words > 170) e.push(`description is ${words} words, need 90 to 150`);
      if (!Array.isArray(o.faq) || o.faq.length < 3 || o.faq.length > 5) e.push('faq must have 4 items');
      if (!faqOk(o.faq)) e.push('every faq item must be {"q": "...", "a": "..."}');
      return e;
    },
    pick: (o) => ({ description: o.description, faq: o.faq }),
  };
}

function themeTask(t, gamesInTheme) {
  const facts = {
    name: t.name, h1: t.h1, page_title: t.title,
    games_on_page: gamesInTheme.map((g) => ({ title: g.title, difficulty: g.difficulty, minutes: g.minutes, setup: g.description[0] })),
    current: { metaDescription: t.metaDescription, intro: t.intro, body: t.body, faq: t.faq ?? [] },
  };
  return {
    key: `themes/${t.slug}`,
    label: `Theme: ${t.h1}`,
    secrets: gamesInTheme.flatMap(secretsFrom),
    extra: (o) => {
      const e = namedGameNumbers(o, gamesInTheme.map((g) => g.title));
      if ((allText(o).toLowerCase().match(/countdown/g) ?? []).length > 1) e.push('mention the countdown at most once on the page');
      return e;
    },
    old: { metaDescription: t.metaDescription, intro: t.intro, body: t.body, faq: t.faq ?? null },
    messages: [
      { role: 'system', content: STYLE },
      { role: 'user', content: `Rewrite the copy for the category page "${t.h1}" (URL /${t.slug}-escape-games/). Main search phrase: "${t.h1.toLowerCase()}" plus natural variants ("${t.name.toLowerCase()} escape room", "online", "free").

Facts (JSON). The games listed are what's on the page right now; you can mention a few by name, but don't depend on the exact list since it will grow. Never state the minutes or difficulty of a named game (those numbers change):
${JSON.stringify(facts, null, 2)}

Site facts:
${SITE_FACTS.map((f) => '- ' + f).join('\n')}

Write:
1. "metaDescription": 130 to 155 characters, includes the main phrase, says what the page offers.
2. "intro": 1 to 2 sentences shown above the game grid. Sets the mood, no SEO stuffing.
3. "body": 2 sections shown under the grid. Each {"h2": "...", "text": "..."}, text is one paragraph of 60 to 110 words. H2s are natural headings a player might search for, not clickbait. Useful content: what these rooms are like, how to pick one (difficulty, time), tips for this kind of room.
4. "faq": 3 or 4 questions people search about ${t.name.toLowerCase()} escape games. At most 2 may be site-wide basics (free, phone, saving, stuck, countdown); the rest must be about this kind of room specifically (what the puzzles are like, how scary, who it suits, which to try first, series). Answers 1 to 3 sentences, only from the facts.

Return JSON: {"metaDescription": "...", "intro": "...", "body": [{"h2": "...", "text": "..."}], "faq": [{"q": "...", "a": "..."}]}` },
    ],
    check: (o) => {
      const e = [];
      const md = o.metaDescription ?? '';
      if (md.length < 115 || md.length > 160) e.push(`metaDescription is ${md.length} chars, need 130 to 155`);
      if (!o.intro || wc(o.intro) > 45) e.push('intro must be 1 to 2 short sentences');
      if (!Array.isArray(o.body) || o.body.length < 2 || o.body.length > 3 || o.body.some((b) => !b.h2 || !b.text)) e.push('body must be 2 sections with h2 and text');
      if (!Array.isArray(o.faq) || o.faq.length < 3 || o.faq.length > 5) e.push('faq must have 3 or 4 items');
      if (!faqOk(o.faq)) e.push('every faq item must be {"q": "...", "a": "..."}');
      return e;
    },
    pick: (o) => ({ metaDescription: o.metaDescription, intro: o.intro, body: o.body, faq: o.faq }),
  };
}

function homeTask(home, liveThemes, games) {
  const playable = games.filter((g) => g.embedUrl);
  const facts = {
    h1: 'Free Online Escape Games',
    categories: liveThemes.map((t) => ({ name: t.h1, games: games.filter((g) => g.themes.includes(t.slug)).length })),
    playable_games: playable.length,
    example_games: playable.slice(0, 10).map((g) => ({ title: g.title, setup: g.description[0] })),
    current: home,
  };
  return {
    key: 'home',
    label: 'Home page',
    secrets: games.flatMap(secretsFrom),
    extra: (o) => namedGameNumbers(o, games.map((g) => g.title)),
    old: home,
    messages: [
      { role: 'system', content: STYLE },
      { role: 'user', content: `Rewrite the text of the home page. H1 stays "Free Online Escape Games". Main search phrases: "free online escape games", "escape room games", "escape games online", "play in your browser". Use each naturally, at most twice across the whole page.

Facts (JSON). Category list and game counts will grow, so don't state exact numbers of games, and never state the minutes or difficulty of a named game:
${JSON.stringify(facts, null, 2)}

Site facts:
${SITE_FACTS.map((f) => '- ' + f).join('\n')}

Write:
1. "sub": one line under the H1, 8 to 16 words, sets the mood.
2. "columns": two columns of text shown under the game grid. Column 1: 2 sections, column 2: 3 sections. Each section {"h2": "...", "paragraphs": ["..."]} with 1 or 2 paragraphs of 40 to 90 words. Cover: what an online escape game is and how a room works, how to start and what to look for, choosing a category or difficulty (name a few real categories), playing on a phone, getting help with walkthroughs. Headings are natural, the way a person would title them.
3. "faq": 5 or 6 questions people search about free online escape games (free, phone, stuck, progress saving, kids, how long, new games). Answers 1 to 3 sentences, only from the facts.

Return JSON: {"sub": "...", "columns": [[{"h2": "...", "paragraphs": ["..."]}], [...]], "faq": [{"q": "...", "a": "..."}]}` },
    ],
    check: (o) => {
      const e = [];
      if (!o.sub || wc(o.sub) < 6 || wc(o.sub) > 20) e.push('sub must be 8 to 16 words');
      if (!Array.isArray(o.columns) || o.columns.length !== 2 || o.columns.some((c) => !Array.isArray(c) || !c.length || c.some((s) => !s.h2 || !Array.isArray(s.paragraphs)))) e.push('columns must be 2 arrays of {h2, paragraphs[]}');
      if (!Array.isArray(o.faq) || o.faq.length < 4 || o.faq.length > 7) e.push('faq must have 5 or 6 items');
      if (!faqOk(o.faq)) e.push('every faq item must be {"q": "...", "a": "..."}');
      return e;
    },
    pick: (o) => ({ sub: o.sub, columns: o.columns, faq: o.faq }),
  };
}

// ───────────── Проверки текста ─────────────
const faqOk = (f) => Array.isArray(f) && f.every((x) => x && typeof x.q === 'string' && typeof x.a === 'string' && x.q && x.a);
const wc = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;
const BANNED = ['delve', 'embark', 'journey', 'tapestry', 'realm', 'immerse', 'immersive', 'unleash', 'unlock the secrets', 'dive into', 'plunge', 'thrilling', 'captivating', 'enthralling', 'spine-tingling', 'mind-bending', 'brain-teasing', 'adventure awaits', 'get ready', 'are you ready', "whether you're", 'whether you are', 'look no further', 'in this game', 'ultimate', 'perfect for', 'a must', 'test your skills', 'put your skills', 'hidden gem', 'seamless', 'elevate', 'navigate', 'intricate', 'myriad', 'vibrant', 'nestled', 'testament', 'beckons', 'awaits', 'not just', 'so grab', 'can you escape?', 'timer', 'deadline', 'start here', 'based on what', 'see how far you get', 'the page puts', 'the page says', 'listed as working', 'filed under', 'the game page lists it', 'the description says'];

const sentences = (t) => String(t).split(/(?<=[.?!])\s+/);
const allText = (o) => JSON.stringify(o).replace(/\\n/g, ' ');
// В текстах тем и главной нельзя называть минуты и сложность конкретной игры: эти цифры пересчитываются.
function namedGameNumbers(o, titles) {
  const hits = [];
  const strings = []; (function walk(v) { if (typeof v === 'string') strings.push(v); else if (v && typeof v === 'object') Object.values(v).forEach(walk); })(o);
  for (const str of strings) for (const sen of sentences(str)) {
    const t = titles.find((x) => sen.includes(x));
    if (t && /\b\d+\s*minutes?\b|\b(easy|medium|hard|harder|hardest)\b|\bten minutes\b/i.test(sen)) hits.push(t);
  }
  return hits.length ? [`states minutes or difficulty of named games (${[...new Set(hits)].join(', ')}); describe them without numbers or difficulty labels`] : [];
}

// Коды и последовательности из решений: в тексте их быть не должно.
function secretsFrom(g) {
  const out = new Set();
  for (const s of g.walkthrough?.steps ?? []) {
    for (const m of s.solution.matchAll(/\b\d[\d,\s-]{2,}\d\b/g)) { const d = m[0].replace(/\D/g, ''); if (d.length >= 3) out.add(d); }
  }
  return [...out];
}

function textOf(o) { return JSON.stringify(o); }
function lint(o, secrets) {
  const e = [];
  const t = textOf(o);
  if (/[—–]/.test(t)) e.push('contains an em/en dash');
  if (/\s-\s/.test(t)) e.push('contains a spaced hyphen used as a dash');
  if (/!/.test(t)) e.push('contains an exclamation mark');
  const low = t.toLowerCase();
  const hits = BANNED.filter((w) => low.includes(w));
  if (hits.length) e.push(`uses banned phrases: ${hits.join(', ')}`);
  const leaked = secrets.filter((s) => new RegExp(s.split('').join('[^a-z0-9]{0,3}'), 'i').test(t));
  if (leaked.length) e.push(`reveals puzzle codes: ${leaked.join(', ')}`);
  return e;
}
// Последняя страховка: тире и кавычки чиним сами.
function scrub(v) {
  if (typeof v === 'string') return v.replace(/\s*[—–]\s*/g, ', ').replace(/\s-\s/g, ', ').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/,\s*,/g, ',').replace(/!/g, '.');
  if (Array.isArray(v)) return v.map(scrub);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, scrub(x)]));
  return v;
}

// ───────────── API ─────────────
async function chat(messages) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({ model: MODEL, messages, temperature: 1.0, response_format: { type: 'json_object' }, max_tokens: 8000 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const data = await res.json();
      return { text: data.choices[0].message.content, usage: data.usage };
    } catch (err) {
      if (attempt === 4) throw err;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

async function runTask(task) {
  const messages = [...task.messages];
  let last, problems = [];
  for (let round = 1; round <= 3; round++) {
    const { text } = await chat(messages);
    let obj;
    try { obj = JSON.parse(String(text).replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, '')); } catch { problems = ['response was not valid JSON']; messages.push({ role: 'assistant', content: text }, { role: 'user', content: 'That was not valid JSON. Return only the JSON object.' }); continue; }
    last = obj;
    problems = [...task.check(obj), ...lint(obj, task.secrets), ...(task.extra?.(obj) ?? [])];
    if (!problems.length) break;
    messages.push({ role: 'assistant', content: text }, { role: 'user', content: `Fix these problems and return the full JSON again:\n- ${problems.join('\n- ')}` });
  }
  // Сломанная структура не сохраняется; мелкие огрехи стиля (тире, кавычки) чинит scrub.
  if (!last || task.check(last).length) throw new Error(problems.join('; '));
  const result = scrub(task.pick(last));
  const left = [...lint(result, task.secrets), ...(task.extra?.(result) ?? [])];
  if (left.some((p) => p.startsWith('reveals'))) throw new Error(left.join('; '));
  return { result, problems: left };
}

// ───────────── Отчет ─────────────
function render(v, indent = '') {
  if (v == null) return `${indent}_(нет)_\n`;
  if (typeof v === 'string') return `${indent}${v}\n`;
  if (Array.isArray(v)) return v.map((x) => render(x, indent)).join('\n');
  if (v.q && v.a) return `${indent}**${v.q}**\n${indent}${v.a}\n`;
  if (v.h2) return `${indent}### ${v.h2}\n${render(v.text ?? v.paragraphs, indent)}`;
  return Object.entries(v).map(([k, x]) => `${indent}#### ${k}\n${render(x, indent)}`).join('\n');
}

// ───────────── Main ─────────────
const { themes, games, homeDefaults } = await loadAll();
const themesBySlug = Object.fromEntries(themes.map((t) => [t.slug, t]));
const copy = JSON.parse(fs.readFileSync(COPY_FILE, 'utf8'));
copy.themes ??= {}; copy.games ??= {};

const tasks = [];
const realGames = games.filter((g) => !g.sample);
const byNewest = (a, b) => Number(Boolean(b.embedUrl)) - Number(Boolean(a.embedUrl)) || b.added.localeCompare(a.added);
const inTheme = (slug) => games.filter((g) => g.themes.includes(slug)).sort(byNewest);
const live = themes.filter((t) => inTheme(t.slug).length >= 6);

if (wantHome && (FORCE || !copy.home)) tasks.push(homeTask(homeDefaults, live, realGames));
if (wantThemes) {
  const pick = wantThemes === 'all' ? themes : wantThemes.map((s) => themesBySlug[s] ?? (console.error(`Нет темы ${s}`), process.exit(1)));
  for (const t of pick) if (FORCE || !copy.themes[t.slug] || wantThemes !== 'all') tasks.push(themeTask(t, inTheme(t.slug).filter((g) => !g.sample)));
}
if (wantGames) {
  const pick = wantGames === 'all' ? realGames : wantGames.map((s) => games.find((g) => g.slug === s) ?? (console.error(`Нет игры ${s}`), process.exit(1)));
  for (const g of pick) if (FORCE || !copy.games[g.slug] || wantGames !== 'all') tasks.push(gameTask(g, themesBySlug));
}
if (!tasks.length) { console.log('Нечего переписывать (все уже есть в copy.json, добавьте --force).'); process.exit(0); }

console.log(`Модель ${MODEL}, задач: ${tasks.length}`);
const report = [`# Rewrite review ${new Date().toISOString().slice(0, 16).replace('T', ' ')}\n`];
let failed = 0;
const queue = [...tasks];
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (queue.length) {
    const task = queue.shift();
    try {
      const { result, problems } = await runTask(task);
      const [kind, slug] = task.key.split('/');
      if (kind === 'home') copy.home = result; else copy[kind][slug] = result;
      if (!DRY) fs.writeFileSync(COPY_FILE, JSON.stringify(copy, null, 2) + '\n');
      report.push(`---\n\n## ${task.label}\n${problems.length ? `\n> Остались замечания: ${problems.join('; ')}\n` : ''}\n### Было\n\n${render(task.old)}\n### Стало\n\n${render(result)}`);
      console.log(`✓ ${task.label}${problems.length ? '  (замечания: ' + problems.join('; ') + ')' : ''}`);
    } catch (err) {
      failed++;
      console.error(`✗ ${task.label}: ${err.message}`);
      report.push(`---\n\n## ✗ ${task.label}\n\nНе сохранено: ${err.message}\n`);
    }
  }
}));

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'review.md'), report.join('\n'));
console.log(`${DRY ? 'Dry run, copy.json не изменен. ' : 'Записано в src/data/copy.json. '}Отчет: scripts/out/review.md${failed ? `. Ошибок: ${failed}` : ''}`);
