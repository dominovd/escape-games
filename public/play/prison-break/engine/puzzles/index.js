// Puzzle modules. Each module renders into a container and calls done() when solved.
// To add a type: write a function (el, puzzle, done, ui) and register it below.
// ui.fail() plays the "wrong" shake; ui.option(value) renders an option (text, emoji or #color).

import code from './code.js';
import dials from './dials.js';
import sequence from './sequence.js';
import switches from './switches.js';

export const puzzleTypes = { code, dials, sequence, switches };

export function renderOption(v) {
  const s = document.createElement('span');
  if (typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) {
    s.className = 'ek-swatch'; s.style.background = v; s.setAttribute('aria-label', v);
  } else s.textContent = v;
  return s;
}
