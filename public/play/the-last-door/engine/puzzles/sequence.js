// Press buttons in the right order. { type: "sequence", buttons: ["A","B","C","D"], answer: ["C","A","D"] }
export default function sequence(el, p, done, ui) {
  let step = 0, finished = false;
  el.innerHTML = '<div class="ek-progress"></div><div class="ek-seq"></div>';
  const prog = el.querySelector('.ek-progress'), box = el.querySelector('.ek-seq');
  const draw = () => { prog.innerHTML = p.answer.map((_, i) => `<i class="${i < step ? 'on' : ''}"></i>`).join(''); };
  for (const b of p.buttons) {
    const btn = document.createElement('button');
    btn.className = 'ek-seq-btn'; btn.append(ui.option(b));
    btn.onclick = () => {
      if (finished) return;
      btn.animate([{ transform: 'scale(.92)' }, { transform: 'none' }], 150);
      if (b === p.answer[step]) { step++; draw(); if (step === p.answer.length) { finished = true; setTimeout(done, 350); } }
      else { step = 0; draw(); ui.fail(); }
    };
    box.append(btn);
  }
  draw();
}
