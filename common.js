const $ = s => document.querySelector(s);
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const SH = ['▲', '◆', '●', '■'];
const fix = st => { st.t = Date.now() - st.elapsed; return st; };
const left = st => Math.max(0, st.time - (Date.now() - st.t) / 1000);

// Sons feitos no navegador (sem arquivos). Só tocam depois de um clique do usuário.
let AC = null;
function som(tipo) {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const seq = { ok: [[660, .1], [880, .18]], erro: [[220, .3]], tic: [[800, .05]], go: [[523, .1], [659, .1], [784, .2]], fim: [[523, .12], [659, .12], [784, .12], [1047, .35]] }[tipo] || [];
    let t = AC.currentTime;
    seq.forEach(([f, d]) => {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(.15, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d); t += d;
    });
  } catch (e) {}
}

function drawRank(list, myName) {
  const r = $('#rank'); r.textContent = '';
  if (!list.length) { r.appendChild(h('li', 'wait', 'Aguardando jogadores…')); return; }
  list.forEach((p, i) => {
    const li = h('li', p.name === myName ? 'me' : '');
    li.append(h('span', 'pos' + (i < 3 ? ' top' + (i + 1) : ''), String(i + 1)), h('span', 'av', p.emoji), h('span', 'nm', p.name), h('span', 'sc', String(p.score)));
    r.appendChild(li);
  });
}

function drawCountdown(app, st) {
  app.append(h('h2', 'center', `Pergunta ${st.qi + 1} de ${st.total}`), h('p', 'center', 'Prepare-se'));
  const n = h('div', 'cdn', String(Math.max(1, Math.ceil(st.cd - (Date.now() - st.t) / 1000)))); n.id = 'cdn';
  app.appendChild(n);
}

function drawDestaque(app, st) {
  if (st.destaque) app.appendChild(h('p', 'destaque', `${st.destaque.emoji} ${st.destaque.name} foi quem mais subiu: +${st.destaque.up} posição(ões)`));
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
  app.appendChild(h('h2', 'center', 'Resultado final'));
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

// Atualiza barra, contagem e "3, 2, 1" sem redesenhar a tela
setInterval(() => {
  const st = window.ST; if (!st) return;
  if (st.phase === 'q') {
    const l = left(st), b = $('#bar'), s = $('#sec');
    if (b) { b.style.width = l / st.time * 100 + '%'; b.classList.toggle('low', l <= 5); }
    if (s) s.textContent = Math.ceil(l);
  } else if (st.phase === 'cd') {
    const n = Math.max(1, Math.ceil(st.cd - (Date.now() - st.t) / 1000)), e = $('#cdn');
    if (e && e.textContent !== String(n)) { e.textContent = n; som('tic'); }
  }
}, 250);