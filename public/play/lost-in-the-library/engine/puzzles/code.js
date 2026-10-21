// Code lock. { type: "code", answer: "1031", keys?: "digits" | "letters" | ["A","B",...] }
const SETS = { digits: '1234567890'.split(''), letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') };

export default function code(el, p, done, ui) {
  const answer = String(p.answer).toUpperCase();
  const keys = Array.isArray(p.keys) ? p.keys : SETS[p.keys || (/^\d+$/.test(answer) ? 'digits' : 'letters')];
  let value = '';
  el.innerHTML = `<div class="ek-code-display" aria-live="polite"></div><div class="ek-keypad ${keys.length > 12 ? 'wide' : ''}"></div><div class="ek-row"><button class="ek-btn ghost" data-act="clear">Clear</button></div>`;
  const display = el.querySelector('.ek-code-display'), pad = el.querySelector('.ek-keypad');
  const draw = () => {
    display.innerHTML = '';
    for (let i = 0; i < answer.length; i++) {
      const c = document.createElement('span');
      c.className = 'ek-code-cell' + (value[i] ? ' filled' : '');
      c.textContent = value[i] || '';
      display.append(c);
    }
  };
  const press = k => {
    if (value.length >= answer.length) return;
    value += k; draw();
    if (value.length === answer.length) {
      if (value.toUpperCase() === answer) setTimeout(done, 250);
      else setTimeout(() => { ui.fail(); value = ''; draw(); }, 300);
    }
  };
  for (const k of keys) {
    const b = document.createElement('button');
    b.className = 'ek-key'; b.textContent = k; b.onclick = () => press(k);
    pad.append(b);
  }
  el.querySelector('[data-act=clear]').onclick = () => { value = ''; draw(); };
  el.tabIndex = -1;
  el.addEventListener('keydown', e => {
    const k = e.key.length === 1 ? (keys.includes(e.key) ? e.key : keys.includes(e.key.toUpperCase()) ? e.key.toUpperCase() : null) : null;
    if (k) press(k);
    else if (e.key === 'Backspace') { value = value.slice(0, -1); draw(); }
  });
  draw();
}
