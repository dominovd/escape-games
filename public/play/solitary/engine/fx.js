// Escape Kit ambient motion: light glows, flickering flames, particles, looping layer animations,
// layer entrance animations and the item-to-inventory flight.
// Everything here is decoration: the game logic never depends on it, and "reduce motion" turns it off.

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const T0 = typeof performance !== 'undefined' ? performance.now() : 0;
const now = () => performance.now() - T0;

// Keep a CSS loop at the same phase when the scene DOM is rebuilt, so nothing visibly restarts.
export function keepPhase(el, durMs) { el.style.animationDelay = -(now() % durMs) + 'ms'; }

// Ambient entries live at game level and apply to every scene that shows the same picture.
//   { "type": "light", "at": [x, y], "r": 600, "color": "#ff9a3c", "strength": 0.35, "flicker": 1 }
//   { "type": "flame", "rect": [x, y, w, h], "amp": 1, "dur": 1000 }   (optional "src": a layer image, "srcRect": that layer's rect)
//   { "type": "particles", "kind": "embers|dust|fireflies|snow|bubbles|mist", "rect": [x, y, w, h], "count": 30, "color": "#ffb060" }
// Each entry can have "if" (same conditions as layers) and "image" (defaults to the start scene's picture).
export function ambientFor(game, sceneImage, check) {
  const def = game.scenes[game.start] && game.scenes[game.start].image;
  return (game.ambient || []).map((a, i) => ({ ...a, _i: i })).filter(a => (a.image || def) === sceneImage && check(a.if));
}

export function renderAmbient(list, W, H, baseUrl, h, cache = new Map(), asset = p => p) {
  const out = [];
  const pct = ([x, y, w, hh]) => ({ left: x / W * 100 + '%', top: y / H * 100 + '%', width: w / W * 100 + '%', height: hh / H * 100 + '%' });
  for (const a of list) {
    if (a.type === 'light') {
      const r = a.r || 400, [x, y] = a.at;
      const el = h('div', 'ek-light' + (a.flicker === 0 || a.flicker === false ? '' : ' flicker'));
      Object.assign(el.style, pct([x - r, y - r, 2 * r, 2 * r]));
      el.style.setProperty('--c', a.color || '#ffa04a');
      el.style.setProperty('--s', a.strength ?? 0.35);
      el.style.setProperty('--f', typeof a.flicker === 'number' ? a.flicker : 1);
      const dur = 1700 + (a._i * 373) % 1300;
      el.style.animationDuration = dur + 'ms'; keepPhase(el, dur);
      out.push(el);
    } else if (a.type === 'flame') {
      // A small patch of the picture (or of a layer: "src" + "srcRect") that flickers in place.
      const [x, y, w, hh] = a.rect;
      const [sx, sy, sw, sh] = a.srcRect || [0, 0, W, H];
      const el = h('div', 'ek-flame' + (a.src ? ' on-layer' : ''));
      Object.assign(el.style, pct(a.rect));
      const im = h('img'); im.alt = ''; im.draggable = false; im.src = a.src ? asset(a.src) : baseUrl;
      Object.assign(im.style, { left: (sx - x) / w * 100 + '%', top: (sy - y) / hh * 100 + '%', width: sw / w * 100 + '%', height: sh / hh * 100 + '%' });
      el.append(im);
      el.style.setProperty('--amp', a.amp ?? 1);
      const dur = a.dur || 800 + (a._i * 211) % 600;
      el.style.animationDuration = dur + 'ms'; keepPhase(el, dur);
      out.push(el);
    } else if (a.type === 'particles') {
      if (reducedMotion()) continue;
      const key = baseUrl + '|' + a._i;
      const el = cache.get(key) || particleCanvas(a);
      cache.set(key, el); revive(el);
      Object.assign(el.style, pct(a.rect));
      out.push(el);
    }
  }
  return out;
}

// Looping layer animation: "anim": { "type": "sway|bob|flicker|pulse", "amp": 1, "dur": 3000, "pivot": [x, y] }
export function animateLayer(el, l) {
  const a = typeof l.anim === 'string' ? { type: l.anim } : l.anim;
  if (!a || !a.type) return;
  el.classList.add('ek-anim', 'ek-anim-' + a.type);
  const dur = a.dur || { sway: 3200, bob: 3600, flicker: 1100, pulse: 2400 }[a.type] || 3000;
  el.style.animationDuration = dur + 'ms'; keepPhase(el, dur);
  el.style.setProperty('--amp', a.amp ?? 1);
  if (a.pivot && l.rect) {
    const [x, y, w, hh] = l.rect;
    el.style.transformOrigin = `${(a.pivot[0] - x) / w * 100}% ${(a.pivot[1] - y) / hh * 100}%`;
  }
}

// Entrance animation for a layer that just appeared: "enter": "fade|rise|pop|flash|slide-left|slide-right|slide-up|slide-down|swing|none"
const ENTER = {
  fade: [{ opacity: 0 }, { opacity: 1 }],
  rise: [{ opacity: 0, transform: 'translateY(6%)' }, { opacity: 1, transform: 'none' }],
  pop: [{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'none' }],
  flash: [{ opacity: 0, filter: 'brightness(2.2)' }, { opacity: 1, filter: 'brightness(1.6)', offset: .35 }, { opacity: 1, filter: 'none' }],
  'slide-left': [{ opacity: 0, transform: 'translateX(8%)' }, { opacity: 1, transform: 'none' }],
  'slide-right': [{ opacity: 0, transform: 'translateX(-8%)' }, { opacity: 1, transform: 'none' }],
  'slide-up': [{ opacity: 0, transform: 'translateY(8%)' }, { opacity: 1, transform: 'none' }],
  'slide-down': [{ opacity: 0, transform: 'translateY(-8%)' }, { opacity: 1, transform: 'none' }],
  swing: [{ opacity: .2, transform: 'perspective(1200px) rotateY(-55deg)', transformOrigin: '0% 50%' }, { opacity: 1, transform: 'perspective(1200px) rotateY(0)', transformOrigin: '0% 50%' }],
};
export function enterLayer(el, l) {
  const kind = l.enter || 'fade';
  if (kind === 'none' || reducedMotion() || !ENTER[kind]) return;
  el.animate(ENTER[kind], { duration: kind === 'fade' ? 420 : 620, easing: 'cubic-bezier(.2,.7,.2,1)' });
}

// Item flies from where it was found to its inventory slot.
export function flyToSlot(root, fromRect, slotEl, iconUrl) {
  if (!fromRect || !slotEl || !iconUrl || reducedMotion()) return;
  const to = slotEl.getBoundingClientRect(), rr = root.getBoundingClientRect();
  const size = Math.min(96, Math.max(48, Math.min(fromRect.width, fromRect.height)));
  const im = document.createElement('img');
  im.src = iconUrl; im.alt = ''; im.className = 'ek-fly';
  const fx = fromRect.left + fromRect.width / 2 - size / 2 - rr.left, fy = fromRect.top + fromRect.height / 2 - size / 2 - rr.top;
  const tx = to.left + to.width / 2 - size / 2 - rr.left, ty = to.top + to.height / 2 - size / 2 - rr.top;
  Object.assign(im.style, { width: size + 'px', height: size + 'px', left: fx + 'px', top: fy + 'px' });
  root.append(im);
  const slotImg = slotEl.querySelector('img');
  if (slotImg) slotImg.style.opacity = '0';
  const s = to.width / size * .8;
  const mid = `translate(${(tx - fx) * .5}px, ${(ty - fy) * .5 - 60}px) scale(1.15)`;
  im.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1.1)', opacity: 1, offset: .15 }, { transform: mid, offset: .55 }, { transform: `translate(${tx - fx}px, ${ty - fy}px) scale(${s})`, opacity: 1 }],
    { duration: 750, easing: 'cubic-bezier(.4,.1,.3,1)' }).onfinish = () => { im.remove(); if (slotImg) slotImg.style.opacity = ''; };
  slotEl.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)', offset: .5 }, { transform: 'scale(1)' }], { duration: 300, delay: 700 });
}

// ---------- particles ----------
const KINDS = {
  embers: { color: '#ffa040', size: [1.2, 3], speed: [18, 45], life: [1.6, 3.2], dir: -1, wobble: 14, glow: true, spawn: 'bottom' },
  dust: { color: '#fff1d6', size: [0.8, 2], speed: [2, 6], life: [6, 12], dir: 0, wobble: 6, glow: false, spawn: 'any', alpha: .45 },
  fireflies: { color: '#e9ff8a', size: [1.6, 3], speed: [6, 14], life: [4, 8], dir: 0, wobble: 20, glow: true, spawn: 'any', blink: true },
  snow: { color: '#ffffff', size: [1, 3], speed: [16, 34], life: [6, 9], dir: 1, wobble: 10, glow: false, spawn: 'top', alpha: .85 },
  bubbles: { color: '#c8ffd8', size: [2, 5], speed: [14, 30], life: [1.4, 2.6], dir: -1, wobble: 6, glow: false, spawn: 'bottom', ring: true },
  mist: { color: '#c9d4ff', size: [40, 90], speed: [3, 7], life: [10, 16], dir: 0, wobble: 2, glow: false, spawn: 'any', alpha: .07, soft: true },
};
const systems = new Set();
let raf = 0, last = 0;
const rnd = (a, b) => a + Math.random() * (b - a);

function particleCanvas(a) {
  const cfg = { ...KINDS[a.kind] || KINDS.dust };
  if (a.color) cfg.color = a.color;
  const cv = document.createElement('canvas');
  cv.className = 'ek-particles';
  const sys = { cv, cfg, count: a.count || 30, parts: [], w: 0, h: 0, ctx: cv.getContext('2d') };
  cv._sys = sys;
  return cv;
}
function revive(cv) {
  if (!cv._sys) return;
  cv._sys.idle = 0; systems.add(cv._sys);
  if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
}
function spawn(sys, fresh) {
  const { cfg, w, h } = sys, p = {};
  // Sizes and speeds are in "percent of 1000 px of canvas height" so they scale with the scene.
  const k = h / 400;
  p.r = rnd(...cfg.size) * k; p.v = rnd(...cfg.speed) * k; p.life = rnd(...cfg.life); p.age = fresh ? Math.random() * p.life : 0;
  p.x = Math.random() * w;
  p.y = cfg.spawn === 'bottom' ? h + p.r : cfg.spawn === 'top' ? -p.r : Math.random() * h;
  if (fresh && cfg.spawn !== 'any') p.y = Math.random() * h;
  p.ph = Math.random() * 6.28; p.wb = cfg.wobble * k; p.vx = rnd(-1, 1) * p.v * .3;
  return p;
}
function tick(t) {
  const dt = Math.min(.05, (t - last) / 1000); last = t;
  for (const sys of systems) {
    const { cv, cfg, ctx } = sys;
    if (!cv.isConnected) { sys.idle = (sys.idle || 0) + dt; if (sys.idle > 2) systems.delete(sys); continue; }
    sys.idle = 0;
    const dpr = Math.min(1.5, devicePixelRatio || 1);
    const w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr);
    if (!w || !h) continue;
    if (w !== sys.w || h !== sys.h) { cv.width = sys.w = w; cv.height = sys.h = h; sys.parts = Array.from({ length: sys.count }, () => spawn(sys, true)); }
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = cfg.glow || cfg.soft ? 'lighter' : 'source-over';
    for (let i = 0; i < sys.parts.length; i++) {
      let p = sys.parts[i];
      p.age += dt;
      if (p.age > p.life || p.y < -40 * dpr || p.y > h + 40 * dpr) { p = sys.parts[i] = spawn(sys, false); }
      p.ph += dt * 1.7;
      p.y += (cfg.dir ? cfg.dir * p.v : Math.sin(p.ph * .5) * p.v * .4) * dt;
      p.x += (p.vx + Math.cos(p.ph) * p.wb * .6) * dt;
      if (p.x < -20) p.x += w + 40; else if (p.x > w + 20) p.x -= w + 40;
      const lifeK = Math.sin(Math.PI * Math.min(1, p.age / p.life));
      let alpha = (cfg.alpha ?? .9) * lifeK;
      if (cfg.blink) alpha *= .35 + .65 * Math.max(0, Math.sin(p.ph * 1.3));
      if (alpha <= .01) continue;
      ctx.globalAlpha = alpha;
      if (cfg.soft || cfg.glow) {
        const rr = cfg.soft ? p.r : p.r * 3.2;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr);
        g.addColorStop(0, cfg.color); g.addColorStop(cfg.soft ? 1 : .35, cfg.soft ? 'transparent' : cfg.color + '88'); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, 6.283); ctx.fill();
      } else if (cfg.ring) {
        ctx.strokeStyle = cfg.color; ctx.lineWidth = Math.max(1, p.r * .3); ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.stroke();
      } else {
        ctx.fillStyle = cfg.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
  raf = systems.size ? requestAnimationFrame(tick) : 0;
}
