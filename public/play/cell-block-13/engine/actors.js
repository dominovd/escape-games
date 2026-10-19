// Escape Kit actors: pictures that move around the room on their own (a mouse along the skirting board,
// a bat across the window) and one-shot animations started by the "play" action (a rocking horse rocks).
//
// "actors": [{
//   "id": "mouse", "image": "assets/mouse.png",        // or "frames": [...] with "fps"
//   "size": [w, h],                                    // in picture pixels
//   "path": [[x, y], [x, y], ...],                     // where the actor's bottom centre goes
//   "speed": 300,                                      // picture pixels per second (or "dur" for the whole path)
//   "wait": 2000,                                      // pause after each run, ms
//   "loop": true, "hideEnds": true,                    // invisible at the first and last point (a hole)
//   "flip": true,                                      // mirror the picture when moving left
//   "face": "left", "idle": "sniff",                   // for an actor that stands still: which way it looks, a small idle motion
//   "hop": 1,                                          // small bouncing while it moves
//   "if": "!flag:mouse_scared",
//   "exit": { "path": [[x, y], ...], "speed": 900,      // where it runs off when "if" stops being true
//             "frames": [...], "hop": 1 },             // optional running frames for the exit only (a sitting mouse that runs)
//   "thread": [x, y], "threadAt": 10,                 // a spider's thread from a fixed point to the actor's top (+ threadAt px down)
//   "shadow": 0.55,                                    // soft contact shadow under the feet (its darkness), or {"opacity", "width", "height"} as parts of the size
//   "filter": "brightness(.7) saturate(.8)",           // CSS filter to fit a separately drawn picture into the room's light
//   "blend": true,                                     // crossfade between frames (slow, soft creatures); or the fade time in ms
//   "idle": "float",                                   // idle motion for a standing actor: "sniff", "float" (slow drift in water or air) or "jelly" (drift with a soft sway of the lower body)
//   "delay": 1500,                                     // when it appears during play, wait this long and fade in (after another actor's exit run)
//   "play": { "type": "frames", "frames": [...], "fps": 8, "hold": 600 }   // one-shot frame sequence for the "play" action
// }]
// A hotspot with "actor": "mouse" sticks to the actor and moves with it.
import { reducedMotion } from './fx.js';

const T0 = performance.now();
const now = () => performance.now() - T0;

export function actorDefsFor(game, image) {
  const def = game.scenes[game.start] && game.scenes[game.start].image;
  return (game.actors || []).filter(a => (a.sceneImage || def) === image);
}

function timeline(a, pts) {
  const speed = a.speed || 300;
  const seg = [];
  let travel = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); travel += d; }
  const travelMs = a.dur || (travel / speed) * 1000 || 1;
  const times = [0]; let acc = 0;
  for (const d of seg) { acc += d; times.push(travel ? acc / travel * travelMs : 0); }
  return { times, travelMs, total: travelMs + (a.wait || 0) };
}

const place = (el, [x, y], [w, h], W, H) => Object.assign(el.style, { left: (x - w / 2) / W * 100 + '%', top: (y - h) / H * 100 + '%', width: w / W * 100 + '%', height: h / H * 100 + '%' });
const pos = ([x, y], [w, h], W, H) => ({ left: (x - w / 2) / W * 100 + '%', top: (y - h) / H * 100 + '%' });

function frameLoop(img, a, asset) {
  if (!a.frames || a.frames.length < 2) return;
  img.classList.add('ek-looping');
  const urls = a.frames.map(asset), fps = a.fps || 8;
  for (const u of urls) { const i = new Image(); i.src = u; }
  const top = img._top;   // "blend": the next frame fades in over the current one instead of a hard swap
  let shown = -1;
  const t = setInterval(() => {
    if (!img.isConnected) { clearInterval(t); return; }
    if (img._hold) { if (top) top.style.opacity = 0; return; }
    const k = Math.floor(now() / (1000 / fps)) % urls.length;
    if (k === shown) return;
    if (!top || shown < 0) { img.src = urls[k]; shown = k; return; }
    shown = k;
    top.src = urls[k];
    const ms = Math.min(a.blend === true ? 0.8 * 1000 / fps : a.blend, 1000 / fps);
    top.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms, easing: 'ease-in-out' }).onfinish = () => { img.src = urls[k]; top.style.opacity = 0; };
    top.style.opacity = 1;
  }, Math.min(100, 1000 / fps / 2));
}

function build(a, W, H, h, asset) {
  const el = h('div', 'ek-actor'); el.dataset.actor = a.id;
  const flipper = h('div', 'ek-actor-flip');
  const img = h('img'); img.alt = ''; img.draggable = false;
  img.src = asset((a.frames && a.frames[0]) || a.image);
  if (a.hop) { img.classList.add('ek-hop'); img.style.setProperty('--amp', a.hop); }
  let body = img;
  if (a.blend && a.frames && a.frames.length > 1) {
    // two stacked pictures for crossfading frames, moved together by the idle motion
    body = h('div', 'ek-actor-body');
    const top = h('img'); top.alt = ''; top.draggable = false; top.style.opacity = 0;
    img._top = top; body.append(img, top);
  }
  if (a.idle && a.path.length < 2) body.classList.add('ek-idle-' + a.idle);
  if (a.filter) (body === img ? img : body).style.filter = a.filter;
  if (a.shadow) {
    const s = typeof a.shadow === 'number' ? { opacity: a.shadow } : a.shadow;
    const sh = h('div', 'ek-shadow');
    sh.style.setProperty('--o', s.opacity ?? .5);
    sh.style.width = (s.width ?? .8) * 100 + '%'; sh.style.left = (1 - (s.width ?? .8)) / 2 * 100 + '%';
    sh.style.height = (s.height ?? .16) * 100 + '%'; sh.style.bottom = -(s.height ?? .16) / 2 * 100 + '%';
    el.append(sh);
  }
  flipper.append(body); el.append(flipper);
  // A spider's thread: a line from a fixed point ("thread": [x, y]) down to the top of the actor.
  if (a.thread) {
    const t = h('div', 'ek-thread'); el.append(t); el._thread = t;
    t.style.bottom = (100 - (a.threadAt || 0) / a.size[1] * 100) + '%';
    t.style.left = ((a.thread[0] - (a.path[0][0] - a.size[0] / 2)) / a.size[0] * 100) + '%';
    t.style.height = Math.max(0, a.path[0][1] - a.size[1] + (a.threadAt || 0) - a.thread[1]) / a.size[1] * 100 + '%';
  }
  place(el, a.path[0], a.size, W, H);
  frameLoop(img, a, asset);
  return { el, flipper, img };
}

// Builds the actor elements for the current state and starts their motion at the right phase,
// so a re-render (any click) never restarts a run.
export function renderActors(list, W, H, h, asset) {
  const out = new Map();
  for (const a of list) {
    const { el, flipper } = build(a, W, H, h, asset);
    out.set(a.id, el);
    const pts = a.path;
    if (reducedMotion() || pts.length < 2) {
      place(el, pts[Math.floor(pts.length / 2)], a.size, W, H);
      if (a.face === 'left') flipper.style.transform = 'scaleX(-1)';
      continue;
    }
    const { times, travelMs, total } = timeline(a, pts);
    const frames = pts.map((p, i) => ({ ...pos(p, a.size, W, H), offset: times[i] / total }));
    if (a.wait) frames.push({ ...pos(pts[pts.length - 1], a.size, W, H), offset: 1 });
    const opts = { duration: total, iterations: a.loop === false ? 1 : Infinity, fill: 'forwards' };
    const anims = [el.animate(frames, opts)];
    if (el._thread) {
      const th = p => ({ height: Math.max(0, p[1] - a.size[1] + (a.threadAt || 0) - a.thread[1]) / a.size[1] * 100 + '%' });
      const tf = pts.map((p, i) => ({ ...th(p), offset: times[i] / total }));
      if (a.wait) tf.push({ ...th(pts[pts.length - 1]), offset: 1 });
      anims.push(el._thread.animate(tf, opts));
    }
    if (a.flip !== false) {
      const fl = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const left = pts[i + 1][0] < pts[i][0];
        fl.push({ transform: `scaleX(${left ? -1 : 1})`, offset: times[i] / total, easing: 'step-end' });
      }
      fl.push({ transform: fl[fl.length - 1].transform, offset: 1 });
      anims.push(flipper.animate(fl, opts));
    }
    if (a.hideEnds) {
      const f = Math.min(250, travelMs / 6) / total, e = travelMs / total;
      anims.push(el.animate([
        { opacity: 0, visibility: 'hidden', offset: 0 }, { opacity: 1, visibility: 'visible', offset: f },
        { opacity: 1, visibility: 'visible', offset: e - f }, { opacity: 0, visibility: 'hidden', offset: e },
        { opacity: 0, visibility: 'hidden', offset: 1 }], opts));
    }
    const t = a.loop === false ? 0 : now() % total;
    for (const an of anims) an.currentTime = t;
  }
  return out;
}

// Where an actor element is right now, in picture pixels (bottom centre).
export function actorPoint(a, el, W, H) {
  const par = el && el.parentElement;
  if (!par || !par.clientWidth) return null;
  const cs = getComputedStyle(el);
  if (cs.visibility === 'hidden' || +cs.opacity < .05) return null;
  return [parseFloat(cs.left) / par.clientWidth * W + a.size[0] / 2, parseFloat(cs.top) / par.clientHeight * H + a.size[1]];
}

// An actor that just left the state runs off along its exit path from wherever it was.
export function exitActor(a, start, canvas, W, H, h, asset) {
  if (!a.exit || !start || reducedMotion()) return;
  const { el, flipper } = build({ ...a, idle: null, frames: a.exit.frames || a.frames, hop: a.exit.hop ?? a.hop }, W, H, h, asset);
  canvas.append(el);
  const pts = [start, ...a.exit.path];
  const ea = { ...a, speed: a.exit.speed || (a.speed || 300) * 2.5, wait: 0, dur: a.exit.dur };
  const { times, total } = timeline(ea, pts);
  el.animate(pts.map((p, i) => ({ ...pos(p, a.size, W, H), offset: times[i] / total })), { duration: total, easing: 'ease-in', fill: 'forwards' })
    .onfinish = () => el.remove();
  if (a.flip !== false) flipper.style.transform = `scaleX(${pts[1][0] < pts[0][0] ? -1 : 1})`;
  el.animate([{ opacity: 1 }, { opacity: 1, offset: .8 }, { opacity: a.exit.fade === false ? 1 : 0 }], { duration: total, fill: 'forwards' });
}

// One-shot animations for the "play" action: { "play": "horse" } on a layer or actor with that "id".
const ONE_SHOT = {
  rock: amp => [0, amp, -amp * .8, amp * .6, -amp * .4, amp * .2, 0].map(r => ({ transform: `rotate(${r}deg)` })),
  shake: amp => [0, amp, -amp, amp, -amp, 0].map(x => ({ transform: `translateX(${x}%)` })),
  jump: amp => [{ transform: 'none' }, { transform: `translateY(${-amp}%)`, offset: .35 }, { transform: 'none', offset: .7 }, { transform: `translateY(${-amp * .25}%)`, offset: .85 }, { transform: 'none' }],
  spin: () => [{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }],
  pop: amp => [{ transform: 'scale(1)' }, { transform: `scale(${1 + amp / 100})`, offset: .4 }, { transform: 'scale(1)' }],
};
export function delayIn(el, ms) {
  if (!el || reducedMotion()) return;
  el.animate([{ opacity: 0 }, { opacity: 0, offset: ms / (ms + 350) }, { opacity: 1 }], { duration: ms + 350 });
}

// A sequence of pictures played once (a creature turning to look at you), then back to the actor's own loop.
function playFrames(el, s, asset) {
  const img = el.tagName === 'IMG' ? el : el.querySelector('img');
  if (!img || !s.frames || !s.frames.length) return;
  const urls = s.frames.map(asset), step = 1000 / (s.fps || 8), back = img.src;
  for (const u of urls) { const i = new Image(); i.src = u; }
  img._hold = true;
  urls.forEach((u, i) => setTimeout(() => { img.src = u; }, i * step));
  setTimeout(() => { img._hold = false; if (!img.classList.contains('ek-looping')) img.src = back; }, urls.length * step + (s.hold || 0));
}

export function playOnce(el, spec, rect, asset = p => p) {
  if (!el || reducedMotion()) return;
  const s = typeof spec === 'string' ? { type: spec } : spec || {};
  if (s.type === 'frames') return playFrames(el, s, asset);
  const make = ONE_SHOT[s.type || 'shake'];
  if (!make) return;
  const amp = s.amp ?? { rock: 9, shake: 2, jump: 12, pop: 8 }[s.type || 'shake'] ?? 5;
  if (s.pivot && rect) el.style.transformOrigin = `${(s.pivot[0] - rect[0]) / rect[2] * 100}% ${(s.pivot[1] - rect[1]) / rect[3] * 100}%`;
  el.animate(make(amp), { duration: s.dur || 2200, easing: 'ease-in-out' });
}
