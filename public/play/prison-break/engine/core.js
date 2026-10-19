// Escape Kit core: pure game logic shared by the player, the editor and the validator.
// No DOM access here, so the same file runs in the browser and in Node.

export const ONCE = '_once:';

export function newState(game) {
  return { scene: game.start, inv: [], flags: [], solved: [], won: false };
}

export function cloneState(s) {
  return { scene: s.scene, inv: [...s.inv], flags: [...s.flags], solved: [...s.solved], won: s.won };
}

export function stateKey(s) {
  return [s.scene, [...s.inv].sort().join(','), [...s.flags].sort().join(','), [...s.solved].sort().join(','), s.won ? 1 : 0].join('|');
}

// Conditions: "has:item", "flag:name", "solved:puzzle", "at:scene", "!..." negates.
// An array means all must hold.
export function check(cond, s) {
  if (cond == null || cond === '') return true;
  if (Array.isArray(cond)) return cond.every(c => check(c, s));
  let neg = false, c = String(cond).trim();
  if (c.startsWith('!')) { neg = true; c = c.slice(1).trim(); }
  const i = c.indexOf(':');
  const kind = i < 0 ? 'flag' : c.slice(0, i), val = i < 0 ? c : c.slice(i + 1);
  let r;
  if (kind === 'has') r = s.inv.includes(val);
  else if (kind === 'flag') r = s.flags.includes(val);
  else if (kind === 'solved') r = s.solved.includes(val);
  else if (kind === 'at') r = s.scene === val;
  else throw new Error(`Unknown condition "${cond}"`);
  return neg ? !r : r;
}

export const onceFlag = (sceneId, hs) => ONCE + sceneId + '/' + hs.id;

export function visibleHotspots(game, s, sceneId = s.scene) {
  const scene = game.scenes[sceneId];
  if (!scene) return [];
  return (scene.hotspots || []).filter(h => check(h.if, s) && !(h.once && s.flags.includes(onceFlag(sceneId, h))));
}

export function visibleLayers(game, s, sceneId = s.scene) {
  const scene = game.scenes[sceneId];
  return scene ? (scene.layers || []).filter(l => check(l.if, s)) : [];
}

const add = (arr, v) => { if (!arr.includes(v)) arr.push(v); };
const remove = (arr, v) => { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); };

// Runs a list of actions. Returns { state, events }.
// Events tell the UI what to show: say, goto, give, take, puzzle, win.
export function runActions(game, state, actions, opts = {}) {
  const s = cloneState(state), events = [];
  for (const a of actions || []) {
    if (a.if !== undefined && !check(a.if, s)) continue;
    if (a.say) events.push({ type: 'say', text: a.say });
    if (a.sfx) events.push({ type: 'sfx', name: a.sfx });
    if (a.inspect) events.push({ type: 'inspect', item: a.inspect });
    if (a.play) events.push({ type: 'play', id: a.play });
    if (a.give) { add(s.inv, a.give); events.push({ type: 'give', item: a.give, from: a.from, delay: a.delay }); }
    if (a.take) { remove(s.inv, a.take); events.push({ type: 'take', item: a.take }); }
    if (a.set) for (const f of [].concat(a.set)) add(s.flags, f);
    if (a.unset) for (const f of [].concat(a.unset)) remove(s.flags, f);
    if (a.puzzle) {
      if (s.solved.includes(a.puzzle)) {
        const p = game.puzzles[a.puzzle];
        if (p && p.solvedText) events.push({ type: 'say', text: p.solvedText });
      } else if (opts.autoSolve) {
        // The validator may only solve a puzzle once the player could know the answer.
        const p = game.puzzles[a.puzzle];
        if (p && p.clue !== undefined && !check(p.clue, s)) continue;
        const r = solvePuzzle(game, s, a.puzzle);
        Object.assign(s, r.state); events.push(...r.events);
      } else events.push({ type: 'puzzle', id: a.puzzle });
    }
    if (a.goto) { s.scene = a.goto; events.push({ type: 'goto', scene: a.goto }); }
    if (a.win !== undefined) { s.won = true; events.push({ type: 'win', text: a.win === true ? '' : a.win }); }
  }
  return { state: s, events };
}

// Click on a hotspot, optionally with an inventory item selected.
export function clickHotspot(game, state, hs, selected = null, opts = {}) {
  if (hs.use) {
    if (selected !== hs.use) {
      const text = hs.fail || (selected ? 'That doesn’t work here.' : 'It won’t budge.');
      // "failDo": sounds and animations for a click without the right item (a robot that beeps and jumps). The state never changes.
      if (hs.failDo) return { state, events: [...runActions(game, state, hs.failDo).events.filter(e => e.type === 'sfx' || e.type === 'play'), { type: 'say', text }], blocked: true, quiet: true };
      return { state, events: [{ type: 'say', text }], blocked: true };
    }
  } else if (selected && hs.wrongItem) {
    return { state, events: [{ type: 'say', text: hs.wrongItem }], blocked: true };
  }
  let s = cloneState(state);
  if (hs.use && hs.consume) remove(s.inv, hs.use);
  if (hs.once) add(s.flags, onceFlag(state.scene, hs));
  const r = runActions(game, s, hs.do, opts);
  return { state: r.state, events: r.events, consumed: hs.use && hs.consume ? hs.use : null };
}

export function solvePuzzle(game, state, id) {
  const p = game.puzzles[id];
  const s = cloneState(state);
  add(s.solved, id);
  const r = runActions(game, s, p.do);
  return { state: r.state, events: [{ type: 'solved', id }, ...r.events] };
}

export function combine(game, state, a, b) {
  for (const [x, y] of [[a, b], [b, a]]) {
    const c = game.items[x] && game.items[x].combine;
    if (c && c.with === y) {
      const s = cloneState(state);
      remove(s.inv, x); remove(s.inv, y);
      const r = runActions(game, s, [{ give: c.into }, ...(c.do || [])]);
      return { state: r.state, events: [{ type: 'say', text: c.text || `You combine them into ${itemName(game, c.into)}.` }, ...r.events], ok: true };
    }
  }
  return { state, events: [{ type: 'say', text: 'Those don’t go together.' }], ok: false };
}

export const itemName = (game, id) => (game.items[id] && game.items[id].name) || id;
export const sceneName = (game, id) => (game.scenes[id] && game.scenes[id].title) || id;
export const hotspotName = hs => hs.label || hs.id;

// Every move the player could make from a state (used by the validator and hints).
// Puzzles are treated as solved the moment they are opened, since the validator knows the answer.
export function moves(game, s) {
  const out = [];
  const scene = game.scenes[s.scene];
  if (!scene || s.won) return out;
  if (scene.back) out.push({ kind: 'back', to: scene.back, apply: () => runActions(game, s, [{ goto: scene.back }]) });
  for (const hs of visibleHotspots(game, s)) {
    if (hs.use) {
      if (!s.inv.includes(hs.use)) continue;
      out.push({ kind: 'use', scene: s.scene, hotspot: hs, item: hs.use, apply: () => clickHotspot(game, s, hs, hs.use, { autoSolve: true }) });
    } else {
      out.push({ kind: 'click', scene: s.scene, hotspot: hs, apply: () => clickHotspot(game, s, hs, null, { autoSolve: true }) });
    }
  }
  const inv = s.inv;
  for (let i = 0; i < inv.length; i++) for (let j = i + 1; j < inv.length; j++) {
    const r = combine(game, s, inv[i], inv[j]);
    if (r.ok) out.push({ kind: 'combine', a: inv[i], b: inv[j], apply: () => r });
  }
  return out;
}

export function describeMove(game, m, events = []) {
  const where = m.scene ? sceneName(game, m.scene) : '';
  const solved = events.filter(e => e.type === 'solved').map(e => e.id);
  const got = events.filter(e => e.type === 'give').map(e => itemName(game, e.item));
  let t;
  if (m.kind === 'back') t = `Go back to ${sceneName(game, m.to)}`;
  else if (m.kind === 'combine') t = `Combine ${itemName(game, m.a)} with ${itemName(game, m.b)}`;
  else if (m.kind === 'use') t = `${where}: use ${itemName(game, m.item)} on ${hotspotName(m.hotspot)}`;
  else {
    const g = events.find(e => e.type === 'goto');
    const plain = !solved.length && !got.length && !events.some(e => e.type === 'win' || e.type === 'puzzle');
    t = `${where}: ${plain ? (g ? 'open ' : 'look at ') : ''}${hotspotName(m.hotspot)}`;
  }
  for (const id of solved) t += ` → solve "${(game.puzzles[id] && game.puzzles[id].title) || id}" (answer: ${puzzleAnswerText(game.puzzles[id])})`;
  if (got.length) t += ` → get ${got.join(', ')}`;
  return t;
}

export function puzzleAnswerText(p) {
  if (!p) return '?';
  const a = p.answer;
  if (Array.isArray(a)) return a.join(' ');
  return String(a);
}

// Breadth-first search over every reachable state.
export function explore(game, { maxStates = 50000 } = {}) {
  const start = newState(game);
  const startKey = stateKey(start);
  const nodes = new Map([[startKey, { state: start, parent: null, move: null, events: [], next: [] }]]);
  const queue = [startKey];
  const seen = { scenes: new Set([start.scene]), hotspots: new Set(), items: new Set(), puzzles: new Set(), flags: new Set() };
  let truncated = false;
  while (queue.length) {
    const key = queue.shift();
    const node = nodes.get(key);
    for (const m of moves(game, node.state)) {
      const r = m.apply();
      const k2 = stateKey(r.state);
      if (m.hotspot) seen.hotspots.add(m.scene + '/' + m.hotspot.id);
      if (k2 === key) continue;
      for (const e of r.events) {
        if (e.type === 'solved') seen.puzzles.add(e.id);
        if (e.type === 'give') seen.items.add(e.item);
      }
      seen.scenes.add(r.state.scene);
      r.state.flags.forEach(f => seen.flags.add(f));
      node.next.push(k2);
      if (!nodes.has(k2)) {
        if (nodes.size >= maxStates) { truncated = true; continue; }
        nodes.set(k2, { state: r.state, parent: key, move: m, events: r.events, next: [] });
        queue.push(k2);
      }
    }
  }
  return { nodes, startKey, seen, truncated };
}

export function pathTo(nodes, key) {
  const steps = [];
  for (let n = nodes.get(key); n && n.parent; n = nodes.get(n.parent)) steps.unshift(n);
  return steps;
}

// Shortest path from an arbitrary state to a win (used for in-game hints).
export function shortestWin(game, from, { maxStates = 20000 } = {}) {
  const k0 = stateKey(from);
  const nodes = new Map([[k0, { state: from, parent: null }]]);
  const queue = [k0];
  while (queue.length) {
    const key = queue.shift();
    const node = nodes.get(key);
    if (node.state.won) return pathTo(nodes, key);
    for (const m of moves(game, node.state)) {
      const r = m.apply();
      const k2 = stateKey(r.state);
      if (nodes.has(k2)) continue;
      if (nodes.size >= maxStates) return null;
      nodes.set(k2, { state: r.state, parent: key, move: m, events: r.events });
      queue.push(k2);
    }
  }
  return null;
}

// Static checks for broken references. Returns a list of { level, msg }.
export function lint(game) {
  const out = [];
  const err = msg => out.push({ level: 'error', msg }), warn = msg => out.push({ level: 'warn', msg });
  const scenes = game.scenes || {}, items = game.items || {}, puzzles = game.puzzles || {};
  if (!scenes[game.start]) err(`start scene "${game.start}" does not exist`);
  const checkCond = (cond, where) => {
    for (const c of [].concat(cond || [])) {
      const t = String(c).replace(/^!\s*/, '');
      const [kind, val] = t.includes(':') ? t.split(/:(.*)/s) : ['flag', t];
      if (kind === 'has' && !items[val]) err(`${where}: condition uses unknown item "${val}"`);
      if (kind === 'solved' && !puzzles[val]) err(`${where}: condition uses unknown puzzle "${val}"`);
      if (kind === 'at' && !scenes[val]) err(`${where}: condition uses unknown scene "${val}"`);
      if (!['has', 'flag', 'solved', 'at'].includes(kind)) err(`${where}: unknown condition "${c}"`);
    }
  };
  const checkActions = (acts, where) => {
    for (const a of acts || []) {
      if (a.goto && !scenes[a.goto]) err(`${where}: goto unknown scene "${a.goto}"`);
      if (a.give && !items[a.give]) err(`${where}: gives unknown item "${a.give}"`);
      if (a.take && !items[a.take]) err(`${where}: takes unknown item "${a.take}"`);
      if (a.inspect && !items[a.inspect]) err(`${where}: inspects unknown item "${a.inspect}"`);
      if (a.puzzle && !puzzles[a.puzzle]) err(`${where}: opens unknown puzzle "${a.puzzle}"`);
      if (a.sfx && !((game.audio || {}).sfx || {})[a.sfx]) warn(`${where}: sound "${a.sfx}" is not listed in audio.sfx`);
      checkCond(a.if, where);
    }
  };
  for (const [sid, sc] of Object.entries(scenes)) {
    if (!sc.image) err(`scene "${sid}" has no image`);
    if (sc.back && !scenes[sc.back]) err(`scene "${sid}": back goes to unknown scene "${sc.back}"`);
    const ids = new Set();
    for (const hs of sc.hotspots || []) {
      const w = `scene "${sid}" hotspot "${hs.id}"`;
      if (!hs.id) err(`scene "${sid}" has a hotspot without id`);
      else if (ids.has(hs.id)) err(`${w}: duplicate id`);
      ids.add(hs.id);
      if (!Array.isArray(hs.rect) || hs.rect.length !== 4) err(`${w}: rect must be [x, y, w, h]`);
      if (hs.use && !items[hs.use]) err(`${w}: uses unknown item "${hs.use}"`);
      if (!hs.do || !hs.do.length) warn(`${w}: does nothing`);
      checkCond(hs.if, w); checkActions(hs.do, w);
    }
    for (const l of sc.layers || []) checkCond(l.if, `scene "${sid}" layer`);
  }
  const animIds = new Set([...(game.actors || []).map(a => a.id), ...Object.values(scenes).flatMap(sc => (sc.layers || []).map(l => l.id).filter(Boolean))]);
  for (const a of game.actors || []) {
    if (!a.id) err('an actor has no id');
    if (!Array.isArray(a.path) || !a.path.length) err(`actor "${a.id}" has no path`);
    if (!Array.isArray(a.size) || a.size.length !== 2) err(`actor "${a.id}": size must be [w, h]`);
    checkCond(a.if, `actor "${a.id}"`);
  }
  for (const [sid, sc] of Object.entries(scenes)) for (const hs of sc.hotspots || []) {
    if (hs.actor && !(game.actors || []).some(a => a.id === hs.actor)) err(`scene "${sid}" hotspot "${hs.id}": unknown actor "${hs.actor}"`);
    for (const a of hs.do || []) if (a.play && !animIds.has(a.play)) warn(`scene "${sid}" hotspot "${hs.id}": plays unknown "${a.play}"`);
  }
  for (const a of game.ambient || []) {
    checkCond(a.if, `ambient ${a.type || 'effect'}`);
    if (!['light', 'flame', 'sway', 'particles'].includes(a.type)) warn(`ambient effect has unknown type "${a.type}"`);
  }
  for (const [id, it] of Object.entries(items)) {
    if (it.combine) {
      if (!items[it.combine.with]) err(`item "${id}" combines with unknown item "${it.combine.with}"`);
      if (!items[it.combine.into]) err(`item "${id}" combines into unknown item "${it.combine.into}"`);
    }
  }
  for (const [id, p] of Object.entries(puzzles)) {
    if (!p.type) err(`puzzle "${id}" has no type`);
    if (p.answer === undefined && p.type !== 'switches') err(`puzzle "${id}" has no answer`);
    checkCond(p.clue, `puzzle "${id}" clue`);
    checkActions(p.do, `puzzle "${id}"`);
  }
  return out;
}

// Full validation: lint + reachability + soft-locks + walkthrough.
export function validate(game, opts = {}) {
  const issues = lint(game);
  if (issues.some(i => i.level === 'error')) return { ok: false, issues, walkthrough: [], stats: {} };
  const { nodes, seen, truncated } = explore(game, opts);
  const wins = [...nodes.entries()].filter(([, n]) => n.state.won).map(([k]) => k);
  if (truncated) issues.push({ level: 'warn', msg: `state space is larger than ${opts.maxStates || 50000}; results are partial` });
  if (!wins.length) issues.push({ level: 'error', msg: 'the game cannot be won from the start' });

  // States that can still reach a win.
  const canWin = new Set(wins);
  const prev = new Map();
  for (const [k, n] of nodes) for (const k2 of n.next) { if (!prev.has(k2)) prev.set(k2, []); prev.get(k2).push(k); }
  const q = [...wins];
  while (q.length) { const k = q.shift(); for (const p of prev.get(k) || []) if (!canWin.has(p)) { canWin.add(p); q.push(p); } }
  const locks = [...nodes.keys()].filter(k => !canWin.has(k));
  if (wins.length && locks.length) {
    const ex = pathTo(nodes, locks[0]).map(n => describeMove(game, n.move, n.events));
    issues.push({ level: 'error', msg: `soft-lock: ${locks.length} reachable state(s) can no longer be won. Example path: ${ex.join(' → ') || '(start)'}` });
  }

  for (const sid of Object.keys(game.scenes)) if (!seen.scenes.has(sid)) issues.push({ level: 'warn', msg: `scene "${sid}" is never reached` });
  for (const [sid, sc] of Object.entries(game.scenes)) for (const hs of sc.hotspots || [])
    if (!seen.hotspots.has(sid + '/' + hs.id)) issues.push({ level: 'warn', msg: `hotspot "${sid}/${hs.id}" is never usable` });
  for (const id of Object.keys(game.items || {})) if (!seen.items.has(id)) issues.push({ level: 'warn', msg: `item "${id}" is never obtained` });
  for (const id of Object.keys(game.puzzles || {})) if (!seen.puzzles.has(id)) issues.push({ level: 'warn', msg: `puzzle "${id}" is never solved` });

  let walkthrough = [], path = [];
  if (wins.length) {
    path = wins.map(k => pathTo(nodes, k)).sort((a, b) => a.length - b.length)[0];
    walkthrough = path.map(n => describeMove(game, n.move, n.events));
  }
  return {
    ok: !issues.some(i => i.level === 'error'), issues, walkthrough, path,
    stats: { states: nodes.size, steps: walkthrough.length, scenes: Object.keys(game.scenes).length, puzzles: Object.keys(game.puzzles || {}).length, items: Object.keys(game.items || {}).length }
  };
}

// Pretty JSON that keeps short arrays (rects, answers) on one line.
export function formatJSON(obj) {
  return JSON.stringify(obj, null, 2).replace(/\[\s*([^\[\]{}]*?)\s*\]/g, (m, inner) => {
    const one = '[' + inner.split(/,\s*\n\s*/).join(', ') + ']';
    return one.length <= 90 ? one : m;
  }) + '\n';
}
