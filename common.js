const $ = s => document.querySelector(s);
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const SH = ['▲', '◆', '●', '■'];
const fix = st => { st.t = Date.now() - st.elapsed; return st; };
const left = st => Math.max(0, st.time - (Date.now() - st.t) / 1000);

function drawRank(list, myName) {
  const r = $('#rank'); r.textContent = '';
  if (!list.length) { r.appendChild(h('li', 'wait', 'Aguardando jogadores…')); return; }
  list.forEach((p, i) => {
    const li = h('li', p.name === myName ? 'me' : '');
    li.append(h('span', 'pos', ['🥇', '🥈', '🥉'][i] || String(i + 1)), h('span', 'nm', p.emoji + ' ' + p.name), h('span', 'sc', String(p.score)));
    r.appendChild(li);
  });
}

function drawQuestion(app, st, { play, choice, answered, onPick }) {
  const q = st.question;
  const m = h('div', 'meta');
  m.append(h('span', 'badge b-' + q.c, q.c), h('span', null, `Pergunta ${q.i + 1} de ${q.total}`));
  const s = h('span'); s.id = 'sec'; s.textContent = Math.ceil(left(st)); m.appendChild(s);
  const t = h('div', 'timer'), b = h('div'); b.id = 'bar'; b.style.width = left(st) / st.time * 100 + '%'; t.appendChild(b);
  app.append(m, t, h('div', 'big', q.q));
  const o = h('div', 'opts');
  q.a.forEach((txt, i) => {
    const bt = h('button', 'opt o' + i);
    bt.append(h('i', null, SH[i]), h('span', null, txt));
    const rev = st.phase === 'reveal';
    bt.disabled = !play || rev || answered;
    if (rev) bt.classList.add(i === st.correct ? 'ok' : 'dim');
    if (answered && choice === i) bt.classList.add('mine');
    bt.onclick = () => onPick && onPick(i);
    o.appendChild(bt);
  });
  app.appendChild(o);
}

function podium(app, list) {
  app.appendChild(h('h2', 'center', '🏁 Fim de jogo!'));
  const pd = h('div', 'podium');
  [[1, 'p2'], [0, 'p1'], [2, 'p3']].forEach(([i, c]) => {
    const p = list[i]; if (!p) return;
    const d = h('div', 'pod ' + c);
    d.append(h('b', null, p.emoji), h('span', null, p.name), h('span', null, p.score + ' pts'));
    pd.appendChild(d);
  });
  app.appendChild(pd);
  for (let i = 0; i < 40; i++) {
    const s = h('span', 'conf', ['🎉', '✨', '⭐', '🎊'][i % 4]);
    s.style.left = Math.random() * 100 + 'vw';
    s.style.animationDuration = 2.5 + Math.random() * 3 + 's';
    document.body.appendChild(s); setTimeout(() => s.remove(), 6500);
  }
}

// Atualiza barra e contagem sem redesenhar a tela
setInterval(() => {
  const st = window.ST; if (!st || st.phase !== 'q') return;
  const l = left(st), b = $('#bar'), s = $('#sec');
  if (b) b.style.width = l / st.time * 100 + '%';
  if (s) s.textContent = Math.ceil(l);
}, 250);