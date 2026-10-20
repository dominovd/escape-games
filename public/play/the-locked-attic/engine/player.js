// Escape Kit player. mountPlayer(root, game, { asset, saveKey, debug })
//   asset(path) -> URL for a file inside the game folder.
import * as core from './core.js';
import { puzzleTypes, renderOption } from './puzzles/index.js';
import { createAudio } from './audio.js';
import * as fx from './fx.js';
import * as actors from './actors.js';

// Bump when engine styles change, so browsers fetch the new theme files.
export const EK_VERSION = '20261020-1';

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sizes = new Map();
function imageSize(url) {
  if (sizes.has(url)) return sizes.get(url);
  const p = new Promise((res, rej) => { const i = new Image(); i.onload = () => res([i.naturalWidth, i.naturalHeight]); i.onerror = () => rej(new Error('Cannot load ' + url)); i.src = url; });
  sizes.set(url, p); return p;
}
function store(key, val) {
  try { if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null'); if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(val)); } catch { return null; }
}

export function mountPlayer(root, game, opts = {}) {
  const asset = opts.asset || (p => p);
  const saveKey = opts.saveKey === false ? null : (opts.saveKey || 'ek:' + game.id);
  const saved = saveKey && store(saveKey);
  let state = saved || core.newState(game);
  if (!game.scenes[state.scene]) state = core.newState(game);
  // Events for the hosting page (play counts, completions, where players get stuck). Same-origin parent only.
  const t0 = Date.now();
  const emit = (event, detail) => {
    try { if (window.parent !== window) window.parent.postMessage({ source: 'escape-kit', event, game: game.id, detail, ms: Date.now() - t0 }, location.origin); } catch { /* cross-origin parent */ }
  };
  emit(saved && game.scenes[saved.scene] ? 'game_resume' : 'game_start');
  let selected = null, hintLevel = 0, hintTarget = null, debug = !!opts.debug, renderToken = 0;

  root.classList.add('ek');
  // Visual theme: engine/themes/<name>.css, or a game's own stylesheet via "themeCss".
  if (game.theme) {
    root.classList.add('theme-' + game.theme);
    const id = 'ek-theme-' + game.theme;
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id; link.rel = 'stylesheet'; link.href = new URL(`./themes/${game.theme}.css?v=${EK_VERSION}`, import.meta.url).href;
      document.head.append(link);
    }
  }
  if (game.themeCss && !document.querySelector(`link[data-ek-css="${game.themeCss}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = asset(game.themeCss); link.dataset.ekCss = game.themeCss;
    document.head.append(link);
  }
  root.innerHTML = '';
  const top = h('header', 'ek-top', `<div class="ek-title">${esc(game.title || game.id)}</div><div class="ek-actions"><button class="ek-btn ghost ek-sound" data-a="fullscreen" hidden></button><button class="ek-btn ghost ek-sound" data-a="music"></button><button class="ek-btn ghost ek-sound" data-a="sound"></button><button class="ek-btn ghost" data-a="hint">Hint</button><button class="ek-btn ghost" data-a="restart">Restart</button></div>`);
  const view = h('div', 'ek-view');
  const frame = h('div', 'ek-frame');
  const sceneEl = h('div', 'ek-scene');
  const back = h('button', 'ek-back', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  back.setAttribute('aria-label', 'Back');
  frame.append(sceneEl, back);
  view.append(frame);
  const msg = h('div', 'ek-msg'); msg.setAttribute('role', 'status');
  const inv = h('footer', 'ek-inv');
  const modal = h('div', 'ek-modal'); modal.hidden = true;
  frame.append(msg);
  root.append(top, view, inv, modal);

  const audio = createAudio(game, asset);
  const sfx = (n, o) => audio.play(n, o);
  const soundBtn = top.querySelector('[data-a=sound]'), musicBtn = top.querySelector('[data-a=music]');
  const SLASH = '<path d="M3 3l18 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>';
  const drawSound = () => {
    soundBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/>' +
      (audio.muted ? SLASH : '<path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>') + '</svg>';
    soundBtn.setAttribute('aria-label', audio.muted ? 'Sounds off' : 'Sounds on');
    soundBtn.title = audio.muted ? 'Sounds: off' : 'Sounds: on';
    soundBtn.classList.toggle('off', audio.muted);
    musicBtn.hidden = !audio.hasMusic;
    musicBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17V5l11-2v12" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="6.5" cy="17.5" r="2.8" fill="currentColor"/><circle cx="17.5" cy="15.5" r="2.8" fill="currentColor"/>' + (audio.musicOff ? SLASH : '') + '</svg>';
    musicBtn.setAttribute('aria-label', audio.musicOff ? 'Music off' : 'Music on');
    musicBtn.title = audio.musicOff ? 'Music: off' : 'Music: on';
    musicBtn.classList.toggle('off', audio.musicOff);
  };
  // Fullscreen: hidden where the browser can't do it (e.g. iPhone Safari).
  const fsBtn = top.querySelector('[data-a=fullscreen]');
  const fsTarget = document.documentElement;
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  const canFs = !!(fsTarget.requestFullscreen || fsTarget.webkitRequestFullscreen) && (document.fullscreenEnabled || document.webkitFullscreenEnabled);
  const drawFs = () => {
    const on = !!fsEl();
    fsBtn.innerHTML = on
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    fsBtn.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen');
    fsBtn.title = on ? 'Exit full screen' : 'Full screen';
    root.classList.toggle('fullscreen', on);
  };
  if (canFs) {
    fsBtn.hidden = false;
    fsBtn.onclick = () => {
      if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else (fsTarget.requestFullscreen || fsTarget.webkitRequestFullscreen).call(fsTarget).catch?.(() => {});
    };
    document.addEventListener('fullscreenchange', drawFs);
    document.addEventListener('webkitfullscreenchange', drawFs);
    drawFs();
  }
  soundBtn.onclick = () => { audio.setMuted(!audio.muted); drawSound(); };
  musicBtn.onclick = () => { audio.setMusicOff(!audio.musicOff); drawSound(); };
  drawSound();
  const save = () => saveKey && store(saveKey, state);
  let msgTimer;
  function say(text, cls = '') {
    if (!text) return;
    msg.innerHTML = `<span class="${cls}">${esc(text)}</span>`;
    msg.classList.add('show');
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => msg.classList.remove('show'), Math.max(2800, text.length * 55));
  }

  // ---------- scene ----------
  let shownScene = null, shownLayers = new Set(), enters = [], shownActors = new Map();
  const fxCache = new Map();
  let sceneSize = null;
  async function renderScene() {
    const token = ++renderToken;
    enters = [];
    const sc = game.scenes[state.scene];
    const url = asset(sc.image);
    let W, H;
    try { [W, H] = await imageSize(url); } catch (e) { sceneEl.innerHTML = `<div class="ek-error">${esc(e.message)}</div>`; return; }
    if (token !== renderToken) return;
    const [cx, cy, cw, ch] = sc.crop || [0, 0, W, H];
    sceneSize = [W, H];
    sceneEl.dataset.aspect = cw / ch;
    const canvas = h('div', 'ek-canvas');
    Object.assign(canvas.style, { width: (W / cw * 100) + '%', height: (H / ch * 100) + '%', left: (-cx / cw * 100) + '%', top: (-cy / ch * 100) + '%' });
    const pct = ([x, y, w, hh]) => ({ left: x / W * 100 + '%', top: y / H * 100 + '%', width: w / W * 100 + '%', height: hh / H * 100 + '%' });
    const base = h('img', 'ek-base'); base.src = url; base.alt = sc.title || ''; base.draggable = false;
    canvas.append(base);
    // Ambient motion: flames sit on the picture, glows and particles above the state layers.
    const amb = fx.renderAmbient(fx.ambientFor(game, sc.image, c => core.check(c, state)), W, H, url, h, fxCache, asset);
    const under = e => (e.classList.contains('ek-flame') || e.classList.contains('ek-sway')) && !e.classList.contains('on-layer');
    canvas.append(...amb.filter(under));
    const sameScene = shownScene === state.scene;
    const nowLayers = new Set();
    for (const l of core.visibleLayers(game, state)) {
      const li = h('img', 'ek-layer'); li.src = asset(l.image); li.alt = ''; li.draggable = false;
      Object.assign(li.style, pct(l.rect || [0, 0, W, H]));
      if (l.anim) fx.animateLayer(li, l);
      if (l.id) li.dataset.id = l.id;
      nowLayers.add(l.image);
      if (sameScene && !shownLayers.has(l.image)) enters.push([li, l]);
      canvas.append(li);
    }
    const actorDefs = actors.actorDefsFor(game, sc.image);
    const liveActors = actorDefs.filter(a => core.check(a.if, state));
    const actorEls = actors.renderActors(liveActors, W, H, h, asset);
    canvas.append(...actorEls.values());
    const exits = sameScene ? actorDefs.filter(a => a.exit && shownActors.has(a.id) && !actorEls.has(a.id)).map(a => [a, actors.actorPoint(a, shownActors.get(a.id), W, H)]) : [];
    canvas.append(...amb.filter(e => !under(e)));
    for (const hs of core.visibleHotspots(game, state)) {
      const b = h('button', 'ek-hot');
      b.setAttribute('aria-label', hs.label || hs.id);
      b.title = debug ? hs.id : '';
      if (hs.actor) { if (!actorEls.has(hs.actor)) continue; b.classList.add('ek-hot-actor'); }
      else Object.assign(b.style, pct(hs.rect));
      if (hs.cursor) b.dataset.cursor = hs.cursor;
      else if ((hs.do || []).some(a => a.goto) && !hs.use) b.dataset.cursor = 'zoom';
      b.onclick = e => { e.stopPropagation(); click(hs, b); };
      (hs.actor ? actorEls.get(hs.actor) : canvas).append(b);
    }
    // Decode new pictures before swapping, so nothing blinks; fade only when the scene itself changes.
    const imgs = [...canvas.querySelectorAll('img')];
    await Promise.race([Promise.all(imgs.map(i => i.decode().catch(() => {}))), new Promise(r => setTimeout(r, 600))]);
    if (token !== renderToken) return;
    sceneEl.replaceChildren(canvas);
    for (const [li, l] of enters) fx.enterLayer(li, l);
    for (const [a, p] of exits) actors.exitActor(a, p, canvas, W, H, h, asset);
    // An actor with "delay" that just appeared waits that long before fading in (e.g. until another actor's exit run ends).
    if (sameScene) for (const a of liveActors) if (a.delay && !shownActors.has(a.id)) actors.delayIn(actorEls.get(a.id), a.delay);
    shownActors = actorEls;
    shownLayers = nowLayers;
    sceneEl.classList.toggle('debug', debug);
    back.hidden = !sc.back;
    fit();
    if (shownScene !== state.scene) frame.animate([{ opacity: 0 }, { opacity: 1 }], 200);
    shownScene = state.scene;
  }
  function fit() {
    const a = +sceneEl.dataset.aspect || 16 / 9;
    const cs = getComputedStyle(view);
    const aw = view.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const ah = view.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    let w = aw, hh = w / a;
    if (hh > ah) { hh = ah; w = hh * a; }
    frame.style.width = Math.floor(w) + 'px'; frame.style.height = Math.floor(hh) + 'px';
  }
  // Preload every picture once so scene changes and state layers appear without a blink.
  const seen = new Set();
  for (const sc of Object.values(game.scenes)) for (const p of [sc.image, ...(sc.layers || []).map(l => l.image)]) seen.add(p);
  for (const it of Object.values(game.items || {})) if (it.icon) seen.add(it.icon);
  for (const p of seen) if (p) { const i = new Image(); i.decoding = 'async'; i.src = asset(p); }
  const ro = new ResizeObserver(fit); ro.observe(view);

  // ---------- inventory ----------
  function renderInv() {
    inv.innerHTML = '';
    const slots = h('div', 'ek-slots');
    const n = Math.max(6, state.inv.length);
    for (let i = 0; i < n; i++) {
      const id = state.inv[i];
      const s = h('button', 'ek-slot' + (id && id === selected ? ' sel' : ''));
      if (id) {
        const it = game.items[id] || {};
        s.title = it.name || id;
        s.setAttribute('aria-label', (it.name || id) + (id === selected ? ' (selected)' : ''));
        if (it.icon) { const im = h('img'); im.src = asset(it.icon); im.alt = ''; s.append(im); } else s.append(h('span', 'ek-slot-name', esc(it.name || id)));
        s.onclick = () => slotClick(id);
        s.ondblclick = () => inspect(id);
      } else { s.disabled = true; s.setAttribute('aria-label', 'Empty slot'); }
      slots.append(s);
    }
    const ins = h('button', 'ek-btn ghost ek-inspect', 'Inspect');
    ins.disabled = !selected;
    ins.onclick = () => selected && inspect(selected);
    inv.append(slots, ins);
    root.classList.toggle('holding', !!selected);
  }
  function slotClick(id) {
    if (selected && selected !== id) {
      const r = core.combine(game, state, selected, id);
      selected = null;
      apply(r); return;
    }
    selected = selected === id ? null : id;
    sfx('select');
    if (selected) say(`Holding: ${core.itemName(game, id)}. Click where to use it.`, 'dim');
    renderInv();
  }
  function inspect(id) {
    const it = game.items[id] || {};
    openModal(it.name || id, body => {
      body.classList.add('ek-inspect-body');
      if (it.image) { const im = h('img', 'ek-inspect-full'); im.src = asset(it.image); im.alt = it.name || id; body.append(im); if (it.text) body.append(h('p', 'ek-prompt', esc(it.text))); return; }
      if (it.icon) { const im = h('img', 'ek-inspect-img'); im.src = asset(it.icon); im.alt = ''; body.append(im); }
      body.append(h('p', 'ek-note', esc(it.text || 'Nothing special about it.').replace(/\n/g, '<br>')));
    });
  }

  // ---------- interaction ----------
  let fromRect = null;
  function click(hs, el) {
    fromRect = el ? el.getBoundingClientRect() : null;
    const r = core.clickHotspot(game, state, hs, selected);
    if (r.blocked) { if (!r.quiet) sfx('locked'); el && el.animate([{ transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'none' }], 180); }
    else if (hs.use) selected = null;
    if (!r.blocked && selected && !hs.use) selected = null;
    apply(r);
  }
  function apply(r) {
    const prevKey = core.stateKey(state);
    state = r.state;
    hintLevel = 0;
    const texts = [];
    let puzzle = null, win = null, look = null;
    const custom = r.events.some(e => e.type === 'sfx');
    for (const e of r.events) {
      if (e.type === 'sfx') sfx(e.name);
      if (e.type === 'goto' && !custom) sfx(game.scenes[e.scene] && game.scenes[e.scene].back ? 'zoom' : 'back');
      if (e.type === 'solved') emit('puzzle_solve', e.id);
      if (e.type === 'solved' && !custom) sfx('solve');
      if (e.type === 'say') texts.push(e.text);
      if (e.type === 'give') texts.push(`You got: ${core.itemName(game, e.item)}`);
      if (e.type === 'puzzle') puzzle = e.id;
      if (e.type === 'inspect') look = e.item;
      if (e.type === 'win') win = e;
    }
    if (selected && !state.inv.includes(selected)) selected = null;
    save();
    if (texts.length) say(texts.join('  '));
    const plays = r.events.filter(e => e.type === 'play').map(e => e.id);
    const runPlays = () => plays.forEach(playAnim);
    if (core.stateKey(state) !== prevKey) renderScene().then(runPlays); else runPlays();
    renderInv();
    if (r.events.some(e => e.type === 'give')) { if (!custom) sfx('pickup'); } else if (r.ok === false) sfx('locked');
    if (r.events.some(e => e.type === 'give')) inv.animate([{ boxShadow: '0 0 0 2px #ffc874' }, { boxShadow: '0 0 0 0 transparent' }], 700);
    const slotEls = inv.querySelectorAll('.ek-slot');
    for (const e of r.events) if (e.type === 'give' && (fromRect || e.from)) {
      const it = game.items[e.item] || {};
      // "from": [x, y] in picture pixels makes the item come out of that spot (e.g. a mouse hole), "delay" in ms.
      let from = fromRect;
      const cv = sceneEl.querySelector('.ek-canvas');
      if (e.from && cv && sceneSize) {
        const cr = cv.getBoundingClientRect(), x = cr.left + e.from[0] / sceneSize[0] * cr.width, y = cr.top + e.from[1] / sceneSize[1] * cr.height;
        from = { left: x - 40, top: y - 40, width: 80, height: 80 };
      }
      fx.flyToSlot(root, from, slotEls[state.inv.indexOf(e.item)], it.icon && asset(it.icon), e.delay || 0);
    }
    fromRect = null;
    if (look) inspect(look);
    if (puzzle) openPuzzle(puzzle);
    if (win) showWin(win.text);
  }

  function playAnim(id) {
    const sc = game.scenes[state.scene];
    const l = (sc.layers || []).find(x => x.id === id), a = (game.actors || []).find(x => x.id === id);
    const el = sceneEl.querySelector(`[data-id="${id}"]`) || sceneEl.querySelector(`[data-actor="${id}"] .ek-actor-flip`);
    actors.playOnce(el, (l && l.play) || (a && a.play) || 'shake', l && l.rect, asset);
  }

  // ---------- modal & puzzles ----------
  function openModal(title, fill, onClose) {
    modal.hidden = false;
    modal.innerHTML = '';
    const card = h('div', 'ek-card'); card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', title);
    const head = h('div', 'ek-card-head', `<h2>${esc(title)}</h2>`);
    const x = h('button', 'ek-close', '✕'); x.setAttribute('aria-label', 'Close');
    head.append(x);
    const body = h('div', 'ek-card-body');
    card.append(head, body); modal.append(card);
    const close = () => { modal.hidden = true; modal.innerHTML = ''; document.removeEventListener('keydown', onKey); onClose && onClose(); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    x.onclick = close;
    modal.onclick = e => { if (e.target === modal) close(); };
    document.addEventListener('keydown', onKey);
    fill(body, close, card);
    (body.querySelector('[tabindex],button') || x).focus();
    return close;
  }
  function openPuzzle(id) {
    const p = game.puzzles[id];
    emit('puzzle_open', id);
    const type = puzzleTypes[p.type];
    openModal(p.title || 'Puzzle', (body, close, card) => {
      if (p.prompt) body.append(h('p', 'ek-prompt', esc(p.prompt)));
      if (p.image) { const im = h('img', 'ek-puzzle-img'); im.src = asset(p.image); im.alt = ''; body.append(im); }
      const area = h('div', 'ek-puzzle ek-p-' + p.type);
      body.append(area);
      if (!type) { area.textContent = `Unknown puzzle type "${p.type}"`; return; }
      area.addEventListener('click', e => { if (e.target.closest('button')) sfx('button', { rate: 0.95 + Math.random() * 0.1 }); });
      const ui = { option: renderOption, fail: () => emit('puzzle_fail', id) || sfx('fail') || card.animate([{ transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(-4px)' }, { transform: 'none' }], 300) };
      type(area, p, () => {
        card.classList.add('solved');
        setTimeout(() => { close(); apply(core.solvePuzzle(game, state, id)); }, 450);
      }, ui);
      setTimeout(() => area.focus && area.focus(), 0);
    });
  }
  function showWin(text) {
    store(saveKey, null);
    // Remember the finished room so the site can unlock the next one.
    try { localStorage.setItem('ek:won:' + game.id, String(Date.now())); } catch { /* storage unavailable */ }
    try { if (window.parent !== window) window.parent.postMessage({ type: 'ek:win', id: game.id }, location.origin); } catch { /* cross-origin parent */ }
    emit('game_complete');
    sfx('win'); audio.finale();
    openModal(game.winTitle || 'You escaped!', (body, close) => {
      body.append(h('p', 'ek-prompt', esc(text || game.winText || 'Well done.')));
      const again = h('button', 'ek-btn', 'Play again');
      again.onclick = () => { close(); restart(); };
      body.append(again);
    });
  }

  // ---------- hints ----------
  function hint() {
    emit('hint_used', state.scene);
    const path = core.shortestWin(game, state);
    if (!path) return say('No hint available from here. Try restarting.');
    const isNav = n => n.move.kind === 'back' || (n.move.kind === 'click' && n.events.every(e => e.type === 'goto'));
    const step = path.find(n => !isNav(n)) || path[0];
    const key = core.stateKey(state) + '#' + (step.move.hotspot ? step.move.hotspot.id : step.move.kind);
    hintLevel = key === hintTarget ? hintLevel + 1 : 1;
    hintTarget = key;
    const m = step.move, where = m.scene ? core.sceneName(game, m.scene) : '';
    if (hintLevel === 1) {
      if (m.hotspot && m.hotspot.hint) return say(m.hotspot.hint, 'hint');
      if (m.kind === 'combine') return say('Some of the things you carry belong together.', 'hint');
      return say(`Look closely at the ${core.hotspotName(m.hotspot).toLowerCase()}${where ? ' (' + where + ')' : ''}.`, 'hint');
    }
    say(core.describeMove(game, m, step.events), 'hint');
  }

  function restart() {
    emit('restart');
    state = core.newState(game); selected = null; store(saveKey, null); audio.restartMusic();
    renderScene(); renderInv(); say(game.intro || '');
  }
  back.onclick = () => apply(core.runActions(game, state, [{ goto: game.scenes[state.scene].back }]));
  top.querySelector('[data-a=hint]').onclick = hint;
  top.querySelector('[data-a=restart]').onclick = restart;
  const keyDebug = e => { if (e.key === 'h' && e.altKey) { debug = !debug; renderScene(); } };
  document.addEventListener('keydown', keyDebug);

  renderScene(); renderInv();
  if (game.intro && state.inv.length === 0 && !state.flags.length) say(game.intro);

  return {
    get state() { return state; },
    setDebug(v) { debug = v; renderScene(); },
    destroy() { document.removeEventListener('fullscreenchange', drawFs); document.removeEventListener('webkitfullscreenchange', drawFs); audio.destroy(); ro.disconnect(); document.removeEventListener('keydown', keyDebug); root.innerHTML = ''; root.classList.remove('ek', 'theme-' + game.theme); }
  };
}
