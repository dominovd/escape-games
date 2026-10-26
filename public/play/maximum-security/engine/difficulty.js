// Escape Kit difficulty: a score worked out from the shortest walkthrough, so every game is rated the same way.
// Two separate numbers: "difficulty" (how hard it is to figure out) and "minutes" (how long it takes).
// Pure logic, no DOM: used by tools/validate.mjs, which writes the result into walkthrough.json.

// Scale agreed with Denis: up to ~7 tasks is easy, from ~10 medium, from ~15 hard.
// A task is a step that changes something (gets an item, uses one, solves a puzzle, opens the way); modifiers add a little on top.
export const LEVELS = [['easy', 0], ['medium', 9], ['hard', 15]];

const W = 3840 * 2160;
const puzzleWeight = p => {
  const n = Array.isArray(p.answer) ? p.answer.length : String(p.answer ?? '').length;
  const wheels = (p.wheels || []).length || n;
  switch (p.type) {
    case 'code': return 1.5 + 0.25 * n;
    case 'sequence': return 1 + 0.2 * n;
    case 'dials': return 1.5 + 0.4 * wheels;
    case 'switches': return 2 + 0.2 * ((p.switches || p.labels || []).length || 4);
    default: return 2.5;
  }
};
const condTrue = (cond, s) => [].concat(cond).every(c => {
  const neg = String(c).startsWith('!'), t = String(c).replace(/^!/, '');
  const [k, v] = t.includes(':') ? t.split(/:(.*)/s) : ['flag', t];
  const r = k === 'flag' ? s.flags.includes(v) : k === 'has' ? s.inv.includes(v) : k === 'solved' ? s.solved.includes(v) : k === 'at' ? s.scene === v : false;
  return neg ? !r : r;
});

// path: walkthrough nodes from core.validate ({ move, events, state }), start: the state before the first move.
export function rate(game, path, start) {
  const f = { tasks: 0, actions: 0, scenes: 0, puzzles: 0, clueAway: 0, clueNear: 0, itemsCarried: 0, combines: 0, hidden: 0, tiny: 0, decoys: 0 };
  const parts = { actions: 0, puzzles: 0, clues: 0, items: 0, combines: 0, hidden: 0, decoys: 0 };
  const gotAt = new Map(), seenScenes = new Set([start.scene]), used = new Set();
  let prev = start;
  path.forEach((n, i) => {
    const m = n.move, ev = n.events || [];
    const nav = m.kind === 'back' || (m.kind === 'click' && ev.some(e => e.type === 'goto') && !ev.some(e => ['give', 'solved', 'win'].includes(e.type)));
    if (!nav) f.actions++;
    const changed = n.state.inv.join() !== prev.inv.join() || n.state.flags.join() !== prev.flags.join() || n.state.solved.join() !== prev.solved.join() || n.state.won;
    if (!nav && changed) f.tasks++;
    seenScenes.add(n.state.scene);
    if (m.hotspot) used.add(m.scene + '/' + m.hotspot.id);
    for (const e of ev) if (e.type === 'give') gotAt.set(e.item, { scene: m.scene, i });
    if (m.kind === 'combine') f.combines++;
    if (m.kind === 'use') {
      const g = gotAt.get(m.item);
      if (g && (g.scene !== m.scene || i - g.i > 3)) f.itemsCarried++;
    }
    if (m.hotspot) {
      if (m.hotspot.actor) f.hidden++;
      const r = m.hotspot.rect;
      if (r && !nav && r[2] * r[3] < W * 0.004) f.tiny++;
    }
    for (const e of ev) if (e.type === 'solved') {
      const p = game.puzzles[e.id];
      f.puzzles++; parts.puzzles += puzzleWeight(p);
      if (p.clue) {
        // Where did the clue become known? Further away from the puzzle means harder.
        let k = i; while (k > 0 && condTrue(p.clue, path[k - 1].state)) k--;
        const clueScene = k > 0 ? path[k].move.scene : start.scene;
        if (clueScene && clueScene !== m.scene) f.clueAway++; else f.clueNear++;
      }
    }
    prev = n.state;
  });
  f.scenes = seenScenes.size;
  for (const [sid, sc] of Object.entries(game.scenes)) for (const hs of sc.hotspots || []) {
    const isNav = (hs.do || []).some(a => a.goto) && !(hs.do || []).some(a => a.give || a.puzzle || a.win);
    if (!used.has(sid + '/' + hs.id) && !isNav && !hs.use) f.decoys++;
  }
  parts.actions = f.tasks;
  parts.puzzles = Math.max(0, parts.puzzles - f.puzzles * 2.5) * 0.5;   // only long codes and many dials add on top of the task itself
  parts.clues = f.clueAway * 1;
  parts.items = f.itemsCarried * 0.25;
  parts.combines = f.combines * 1;
  parts.hidden = f.hidden * 0.5 + f.tiny * 0.25;
  parts.decoys = 0;
  const score = Math.round(Object.values(parts).reduce((a, b) => a + b, 0) * 10) / 10;
  const level = LEVELS.filter(([, min]) => score >= min).pop()[0];
  const sec = f.actions * 30 + f.puzzles * 75 + f.clueAway * 40 + f.combines * 30 + f.hidden * 20 + f.decoys * 8;
  // x2: a first-time player looks around and tries things before finding the way.
  const minutes = Math.max(5, Math.round(sec * 2 / 60 / 5) * 5);
  const rooms = new Set(Object.values(game.scenes).filter(s => !s.back).map(s => s.image)).size;
  return { level, score, minutes, rooms, factors: f };
}
