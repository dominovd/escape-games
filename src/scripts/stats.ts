// Статистика игр: счетчики, лайки и события из движка escape-kit.
// Пишет в Supabase через функции eg_track / eg_vote, читает через eg_stats.
// Если подключен Umami (SITE.umamiWebsiteId), события дублируются туда для воронок.
import { SITE } from '../data/site';

const cfg = SITE.stats;
const enabled = !!(cfg && cfg.supabaseUrl && cfg.supabaseKey);

// На localhost запись выключена, чтобы тесты не попадали в статистику.
// Включить для проверки: открыть любую страницу с ?track=1 (выключить: ?track=0).
const isLocal = /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname);
const params = new URLSearchParams(location.search);

const ls = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string | null) { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} },
};
if (params.has('track')) ls.set('eg:dev-track', params.get('track') === '0' ? null : '1');
const canWrite = enabled && (!isLocal || ls.get('eg:dev-track') === '1');

const uuid = () =>
  (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ??
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

function visitor() {
  let v = ls.get('eg:vid');
  if (!v || !/^[0-9a-f-]{36}$/.test(v)) { v = uuid(); ls.set('eg:vid', v); }
  return v;
}

async function rpc<T = unknown>(fn: string, body: object): Promise<T | null> {
  if (!enabled) return null;
  try {
    const r = await fetch(`${cfg.supabaseUrl}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: cfg.supabaseKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    });
    if (!r.ok) return null;
    const text = await r.text();
    return text ? (JSON.parse(text) as T) : null;
  } catch {
    return null;
  }
}

const EVENTS = new Set([
  'play_click', 'game_start', 'game_resume', 'scene', 'puzzle_open', 'puzzle_fail',
  'puzzle_solve', 'hint_used', 'restart', 'game_complete',
]);

export function track(slug: string, event: string, extra: { room?: string; detail?: string; ms?: number } = {}) {
  if (!EVENTS.has(event)) return;
  if (canWrite) {
    rpc('eg_track', {
      p_slug: slug, p_event: event, p_visitor: visitor(),
      p_room: extra.room ?? null, p_puzzle: extra.detail ?? null,
      p_ms: typeof extra.ms === 'number' ? Math.round(extra.ms) : null,
    });
  }
  const umami = (window as unknown as { umami?: { track: (e: string, d: object) => void } }).umami;
  try { umami?.track(event, { game: slug, ...extra }); } catch {}
}

// ---------- счетчики ----------
type Row = { slug: string; plays: number; completions: number; likes: number; dislikes: number };
const stats = new Map<string, Row>();
const fmt = (n: number) =>
  n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k'
  : String(n);

function renderCounters() {
  document.querySelectorAll<HTMLElement>('[data-stat][data-slug]').forEach((el) => {
    const s = stats.get(el.dataset.slug!);
    if (!s) return;
    const label = el.querySelector<HTMLElement>('[data-label]') ?? el;
    if (el.dataset.stat === 'plays' && s.plays >= SITE.minPlaysToShow) {
      label.textContent = `${fmt(s.plays)} plays`;
      el.hidden = false;
    }
    const votes = s.likes + s.dislikes;
    if (el.dataset.stat === 'liked' && votes >= SITE.minVotesToShow) {
      label.textContent = `${Math.round((s.likes / votes) * 100)}% liked`;
      el.hidden = false;
    }
  });
  document.querySelectorAll<HTMLElement>('[data-vote]').forEach((box) => {
    const s = stats.get(box.dataset.vote!);
    if (s) drawVote(box, s.likes, s.dislikes);
  });
}

// ---------- лайки ----------
function drawVote(box: HTMLElement, likes?: number, dislikes?: number) {
  const slug = box.dataset.vote!;
  const mine = Number(ls.get('eg:vote:' + slug) || 0);
  box.querySelectorAll<HTMLButtonElement>('button[data-v]').forEach((b) => {
    const v = Number(b.dataset.v);
    b.setAttribute('aria-pressed', String(mine === v));
    const c = b.querySelector<HTMLElement>('[data-count]');
    const n = v === 1 ? likes : dislikes;
    if (c && typeof n === 'number') c.textContent = n > 0 ? fmt(n) : '';
  });
}

document.querySelectorAll<HTMLElement>('[data-vote]').forEach((box) => {
  const slug = box.dataset.vote!;
  drawVote(box);
  box.querySelectorAll<HTMLButtonElement>('button[data-v]').forEach((b) => {
    b.addEventListener('click', async () => {
      const v = Number(b.dataset.v);
      const prev = Number(ls.get('eg:vote:' + slug) || 0);
      const next = prev === v ? 0 : v;
      ls.set('eg:vote:' + slug, next ? String(next) : null);
      // мгновенно обновляем цифры, потом сверяем с сервером
      const s = stats.get(slug) ?? { slug, plays: 0, completions: 0, likes: 0, dislikes: 0 };
      if (prev === 1) s.likes--; if (prev === -1) s.dislikes--;
      if (next === 1) s.likes++; if (next === -1) s.dislikes++;
      s.likes = Math.max(0, s.likes); s.dislikes = Math.max(0, s.dislikes);
      stats.set(slug, s);
      drawVote(box, s.likes, s.dislikes);
      box.classList.remove('ask');
      box.classList.toggle('thanks', next !== 0);
      if (!canWrite) return;
      const res = await rpc<{ likes: number; dislikes: number }[]>('eg_vote', { p_slug: slug, p_visitor: visitor(), p_value: next });
      if (res && res[0]) { s.likes = res[0].likes; s.dislikes = res[0].dislikes; drawVote(box, s.likes, s.dislikes); }
    });
  });
});

const slugs = [...new Set(
  [...document.querySelectorAll<HTMLElement>('[data-stat][data-slug], [data-vote]')]
    .map((el) => el.dataset.slug ?? el.dataset.vote!)
)];
if (slugs.length) {
  rpc<Row[]>('eg_stats', { p_slugs: slugs }).then((rows) => {
    (rows ?? []).forEach((r) => stats.set(r.slug, r));
    renderCounters();
  });
}

// ---------- события из игры (iframe с того же домена) ----------
window.addEventListener('message', (e) => {
  if (e.origin !== location.origin) return;
  const d = e.data as { source?: string; event?: string; game?: string; detail?: string; ms?: number };
  if (!d || d.source !== 'escape-kit' || !d.event) return;
  const frame = [...document.querySelectorAll<HTMLIFrameElement>('[data-player] iframe')].find((f) => f.contentWindow === e.source);
  const slug = frame?.closest<HTMLElement>('[data-player]')?.dataset.slug;
  if (!slug) return;
  track(slug, d.event, { room: d.game, detail: d.detail, ms: d.ms });
  if (d.event === 'game_complete') {
    document.querySelector<HTMLElement>(`[data-vote="${slug}"]`)?.classList.add('ask');
  }
});
