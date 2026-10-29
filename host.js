// Tela do PROFESSOR: este navegador é o "servidor" do jogo (fase, cronômetro, placar).
const TIME = 20; // segundos por pergunta
const ALFA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O/1/I para não confundir
let game = { phase: 'lobby', q: 0, t: 0 }; // lobby | q | reveal | end
let st = null, peer = null, room = '', timer = null, erro = '';
const players = new Map(); // pid -> { name, emoji, score, last, choice, pts }
const conns = new Map();   // conexão -> pid

const ranking = () => [...players.values()].sort((a, b) => b.score - a.score);

function snapshot() {
  const q = QUESTIONS[game.q];
  const inPlay = game.phase === 'q' || game.phase === 'reveal';
  return {
    phase: game.phase, time: TIME, count: players.size,
    elapsed: Date.now() - game.t,
    question: inPlay ? { c: q.c, q: q.q, a: q.a, i: game.q, total: QUESTIONS.length } : null,
    correct: game.phase === 'reveal' ? q.r : null,
    ranking: ranking().slice(0, 10).map(p => ({ name: p.name, emoji: p.emoji, score: p.score })),
  };
}

function broadcast() {
  const s = snapshot();
  st = window.ST = fix(Object.assign({}, s));
  const rk = ranking();
  conns.forEach((pid, c) => {
    if (!c.open) return;
    c.send({ t: 'state', s });
    const p = players.get(pid);
    if (p) c.send({ t: 'me', m: { last: p.last, choice: p.choice, pts: p.pts, score: p.score, rank: rk.indexOf(p) + 1 } });
  });
  render();
}

function reveal() {
  clearTimeout(timer);
  if (game.phase === 'q') { game.phase = 'reveal'; broadcast(); }
}
function startQuestion(i) {
  game = { phase: 'q', q: i, t: Date.now() };
  clearTimeout(timer); timer = setTimeout(reveal, TIME * 1000);
  broadcast();
}
function next() {
  if (game.q + 1 < QUESTIONS.length) startQuestion(game.q + 1);
  else { game.phase = 'end'; broadcast(); }
}
function reset() {
  if (!confirm('Zerar o placar e voltar ao início?')) return;
  clearTimeout(timer);
  players.forEach(p => Object.assign(p, { score: 0, last: -1, choice: -1, pts: 0 }));
  game = { phase: 'lobby', q: 0, t: 0 };
  broadcast();
}

function onData(c, d) {
  if (!d) return;
  if (d.t === 'join' && d.pid && d.name) {
    conns.set(c, d.pid);
    if (!players.has(d.pid)) {
      players.set(d.pid, { name: String(d.name).slice(0, 18), emoji: String(d.emoji || '⭐').slice(0, 4), score: 0, last: -1, choice: -1, pts: 0 });
    }
    broadcast();
  } else if (d.t === 'answer') {
    const p = players.get(conns.get(c));
    if (!p || game.phase !== 'q' || p.last === game.q) return; // 1 resposta por pergunta
    const left = Math.max(0, TIME - (Date.now() - game.t) / 1000);
    p.last = game.q; p.choice = d.i;
    p.pts = d.i === QUESTIONS[game.q].r ? 500 + Math.round(500 * left / TIME) : 0;
    p.score += p.pts;
    broadcast();
  }
}

function openRoom() {
  room = Array.from({ length: 4 }, () => ALFA[Math.floor(Math.random() * ALFA.length)]).join('');
  peer = new Peer('techarena-' + room);
  peer.on('open', () => { erro = ''; broadcast(); });
  peer.on('connection', c => {
    c.on('data', d => onData(c, d));
    c.on('close', () => conns.delete(c));
  });
  peer.on('error', e => {
    if (e.type === 'unavailable-id') { peer.destroy(); openRoom(); return; }
    erro = 'Erro de conexão (' + e.type + '). Recarregue a página.'; render();
  });
}

function render() {
  const app = $('#app'); app.textContent = '';
  $('#tag').textContent = room ? `Sala ${room} · ${players.size} jogador(es)` : '';
  if (st) drawRank(st.ranking);
  if (erro) { app.append(h('h2', null, '⚠️ ' + erro)); return; }
  if (!st) { app.append(h('h2', 'wait', 'Criando sala…')); return; }
  const bar = h('div', 'hostbar');
  const btn = (txt, fn, ghost) => { const b = h('button', 'cta' + (ghost ? ' ghost' : ''), txt); b.onclick = fn; bar.appendChild(b); };
  if (st.phase === 'lobby') {
    const link = new URL('index.html?sala=' + room, location.href).href;
    app.append(h('h2', null, '🎛️ Painel do professor'), h('p', null, 'Peça aos alunos para abrir o link e digitar o código da sala:'),
      h('div', 'code', room), h('p', 'link', link), h('p', null, `${st.count} jogador(es) na sala. Mantenha esta aba aberta durante o jogo.`));
    btn('▶ Iniciar jogo', () => startQuestion(0));
  } else if (st.phase === 'end') {
    podium(app, st.ranking); btn('🔄 Novo jogo', reset);
  } else {
    drawQuestion(app, st, { play: false });
    if (st.phase === 'q') btn('⏭ Revelar agora', reveal);
    else btn(st.question.i + 1 < st.question.total ? '➡ Próxima pergunta' : '🏁 Ver pódio', next);
    btn('Reiniciar', reset, true);
  }
  app.appendChild(bar);
}

if (typeof Peer === "undefined") { erro = "Não carregou o PeerJS. Verifique a internet e recarregue."; render(); } else { render(); openRoom(); }