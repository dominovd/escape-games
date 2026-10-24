// Grid of switches. { type: "switches", rows: 3, cols: 3, start: "000000000", answer: "101010101",
//   mode: "single" | "cross" }   "cross" also flips the neighbours (lights-out style).
export default function switches(el, p, done) {
  const rows = p.rows || 3, cols = p.cols || 3, n = rows * cols;
  const target = (p.answer || '1'.repeat(n)).split('').map(Number);
  const cells = (p.start || '0'.repeat(n)).split('').map(Number);
  let finished = false;
  el.innerHTML = `<div class="ek-switches" style="grid-template-columns:repeat(${cols},1fr)"></div>`;
  const grid = el.firstChild;
  const btns = cells.map((_, i) => {
    const b = document.createElement('button');
    b.className = 'ek-switch';
    b.onclick = () => {
      if (finished) return;
      const flip = j => { cells[j] ^= 1; };
      flip(i);
      if (p.mode === 'cross') {
        const r = Math.floor(i / cols), c = i % cols;
        if (r > 0) flip(i - cols); if (r < rows - 1) flip(i + cols);
        if (c > 0) flip(i - 1); if (c < cols - 1) flip(i + 1);
      }
      draw();
      if (cells.every((v, j) => v === target[j])) { finished = true; setTimeout(done, 400); }
    };
    grid.append(b); return b;
  });
  const draw = () => btns.forEach((b, i) => { b.classList.toggle('on', !!cells[i]); b.setAttribute('aria-pressed', !!cells[i]); });
  draw();
}
