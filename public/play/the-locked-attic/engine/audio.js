// Escape Kit audio: looped music + ambience, short sound effects.
// game.audio = { music, ambience, musicVolume, ambienceVolume, sfxVolume, sfx: { name: "assets/audio/x.mp3" } }
// Missing files are skipped silently, so a game works before its sounds exist.
// Browsers block sound until the first click; playback starts on the first user gesture.

const read = k => { try { return localStorage.getItem(k) === '1'; } catch { return false; } };
const write = (k, v) => { try { localStorage.setItem(k, v ? '1' : '0'); } catch { /* storage unavailable */ } };

export function createAudio(game, asset) {
  const cfg = game.audio || {};
  const sfxVol = cfg.sfxVolume ?? 0.8;
  let ctx = null, master = null, muted = read('ek:muted'), musicOff = read('ek:music-off'), unlocked = false, destroyed = false;
  const offFor = name => name === 'music' ? musicOff : muted;
  const buffers = new Map(), loading = new Map();

  const loops = {};
  for (const [name, vol] of [['music', cfg.musicVolume ?? 0.45], ['ambience', cfg.ambienceVolume ?? 0.5]]) {
    if (!cfg[name]) continue;
    const el = new Audio(asset(cfg[name]));
    el.loop = true; el.preload = 'auto'; el.volume = 0; el.dataset.target = vol;
    el.addEventListener('error', () => { loops[name] = null; }, { once: true });
    loops[name] = el;
  }

  function fade(el, to, ms = 900) {
    if (!el) return;
    const from = el.volume, t0 = performance.now();
    const step = t => {
      const k = Math.min(1, (t - t0) / ms);
      el.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k < 1 && !destroyed) requestAnimationFrame(step);
      else if (to === 0) el.pause();
    };
    if (to > 0 && el.paused) el.play().catch(() => {});
    requestAnimationFrame(step);
  }
  function startLoops() { for (const [name, el] of Object.entries(loops)) if (el) fade(el, offFor(name) ? 0 : +el.dataset.target); }

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : sfxVol; master.connect(ctx.destination);
    for (const name of Object.keys(cfg.sfx || {})) load(name);
    return ctx;
  }
  function load(name) {
    const path = cfg.sfx && cfg.sfx[name];
    if (!path || !ctx) return Promise.resolve(null);
    if (!loading.has(name)) loading.set(name, fetch(asset(path))
      .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(b => ctx.decodeAudioData(b))
      .then(buf => { buffers.set(name, buf); return buf; })
      .catch(() => null));
    return loading.get(name);
  }

  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    ensureCtx(); if (ctx && ctx.state === 'suspended') ctx.resume();
    startLoops();
  };
  window.addEventListener('pointerdown', unlock, { once: true, capture: true });
  window.addEventListener('keydown', unlock, { once: true, capture: true });

  return {
    has: name => !!(cfg.sfx && cfg.sfx[name]),
    play(name, { volume = 1, rate = 1 } = {}) {
      if (muted || !name || !(cfg.sfx && cfg.sfx[name]) || !ensureCtx()) return;
      const go = buf => {
        if (!buf || destroyed) return;
        const src = ctx.createBufferSource(), g = ctx.createGain();
        src.buffer = buf; src.playbackRate.value = rate; g.gain.value = volume;
        src.connect(g); g.connect(master); src.start();
      };
      const buf = buffers.get(name);
      buf ? go(buf) : load(name).then(go);
    },
    // Fade the music out for the win screen, keep ambience.
    finale() { fade(loops.music, 0, 1500); },
    restartMusic() { if (unlocked && !musicOff && loops.music) fade(loops.music, +loops.music.dataset.target); },
    hasMusic: !!cfg.music,
    get muted() { return muted; },
    get musicOff() { return musicOff; },
    // Sound effects and the room ambience.
    setMuted(v) {
      muted = v; write('ek:muted', v);
      if (master) master.gain.value = v ? 0 : sfxVol;
      if (unlocked && loops.ambience) fade(loops.ambience, v ? 0 : +loops.ambience.dataset.target, 300);
    },
    setMusicOff(v) {
      musicOff = v; write('ek:music-off', v);
      if (unlocked && loops.music) fade(loops.music, v ? 0 : +loops.music.dataset.target, 400);
    },
    destroy() {
      destroyed = true;
      for (const el of Object.values(loops)) if (el) { el.pause(); el.src = ''; }
      if (ctx) ctx.close();
      window.removeEventListener('pointerdown', unlock, { capture: true });
      window.removeEventListener('keydown', unlock, { capture: true });
    }
  };
}
