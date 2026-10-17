// Rotating wheels. { type: "dials", options: ["🦇","🌕","🎃"], answer: ["🦇","🌕","🎃"] }
// or per-wheel options: { wheels: [["1","2"],["A","B"]], answer: ["2","A"] }. Options may be "#hex" colours.
export default function dials(el, p, done, ui) {
  const wheels = p.wheels || p.answer.map(() => p.options);
  const pos = wheels.map((w, i) => (p.start && p.start[i] != null ? w.indexOf(p.start[i]) : 0));
  el.innerHTML = '<div class="ek-dials"></div>';
  const box = el.firstChild;
  let finished = false;
  const check = () => {
    if (!finished && wheels.every((w, i) => w[pos[i]] === p.answer[i])) { finished = true; setTimeout(done, 400); }
  };
  wheels.forEach((w, i) => {
    const col = document.createElement('div');
    col.className = 'ek-dial';
    const up = document.createElement('button'), face = document.createElement('button'), down = document.createElement('button');
    up.className = down.className = 'ek-dial-arrow'; up.textContent = '▲'; down.textContent = '▼';
    up.setAttribute('aria-label', 'Previous'); down.setAttribute('aria-label', 'Next');
    face.className = 'ek-dial-face';
    const draw = () => { face.replaceChildren(ui.option(w[pos[i]])); face.setAttribute('aria-label', `Wheel ${i + 1}: ${w[pos[i]]}`); };
    const turn = d => { if (finished) return; pos[i] = (pos[i] + d + w.length) % w.length; draw(); face.animate([{ transform: `translateY(${d * -6}px)`, opacity: .4 }, { transform: 'none', opacity: 1 }], 180); check(); };
    up.onclick = () => turn(-1); down.onclick = face.onclick = () => turn(1);
    col.append(up, face, down); box.append(col); draw();
  });
}
