// Tela do PROFESSOR: este navegador é o "servidor" do jogo.
const SENHA = '1234'; // TROQUE a senha do painel aqui
if (sessionStorage.getItem('ok') !== SENHA) {
  if (prompt('Senha do professor:') !== SENHA) { document.body.textContent = 'Acesso negado. Recarregue a página.'; throw new Error('senha'); }
  sessionStorage.setItem('ok', SENHA);
}
const TIME = 20, CD = 3, PAUSA = 5; // segundos: pergunta, contagem, pausa na resposta
const CATS = ['Excel', 'Word', 'PowerPoint', 'Windows'];
const ALFA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
let game = { phase: 'lobby', q: 0, t: 0 }; // lobby | cd | q | reveal | end
let st = null, peer = null, room = '', timer = null, auto = null, erro = '', deck = [], paused = false, destaque = null;
const escolha = { cats: new Set(CATS), n: 12 };
const players = new Map(); // pid -> jogador
const conns = new Map();   // conexão -> pid
const ranking = () => [...players.values()].sort((a, b) => b.score - a.score);
const emb = a => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [x[i], x[j]] = [x[j], x[i]]; } return x; };

function buildDeck() {
  return emb(QUESTIONS.filter(q => escolha.cats.has(q.c))).slice(0, escolha.n).map(q => {
    if (q.a.length !== 4) return q; // verdadeiro/falso mantém a ordem
    const certa = q.a[q.r], a = emb(q.a); return Object.assign({}, q, { a, r: a.indexOf(certa) });
  });
}

function snapshot() {
  const q = deck[game.q], inPlay = game.phase === 'q' || game.phase === 'reveal';
  return {
    phase: game.phase, time: TIME, cd: CD, count: players.size, paused, destaque,
    elapsed: Date.now() - game.t, qi: game.q, total: deck.length,
    question: inPlay && q ? { c: q.c, q: q.q, a: q.a, i: game.q, total: deck.length } : null,
    correct: game.phase === 'reveal' && q ? q.r : null,
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
    if (p) c.send({ t: 'me', m: { last: p.last, choice: p.choice, pts: p.pts, score: p.score, streak: p.streak, rank: rk.indexOf(p) + 1 } });
  });
  render();
}

function limpa() { clearTimeout(timer); clearTimeout(auto); }

function startQuestion(i) {
  limpa();
  ranking().forEach((p, k) => { p.prev = k; });
  destaque = null;
  game = { phase: 'cd', q: i, t: Date.now() };
  broadcast(); som('go');
  timer = setTimeout(() => {
    game = { phase: 'q', q: i, t: Date.now() };
    timer = setTimeout(reveal, TIME * 1000);
    broadcast();
  }, CD * 1000);
}

function reveal() {
  if (game.phase !== 'q') return;
  clearTimeout(timer);
  players.forEach(p => { if (p.last !== game.q) p.streak = 0; });
  let best = null;
  ranking().forEach((p, k) => { const up = p.prev - k; if (up > 0 && (!best || up > best.up)) best = { name: p.name, emoji: p.emoji, up }; });
  destaque = best; game.phase = 'reveal';
  broadcast();
  if (!paused) auto = setTimeout(next, PAUSA * 1000);
}

function next() {
  limpa();
  if (game.q + 1 < deck.length) startQuestion(game.q + 1);
  else { game.phase = 'end'; broadcast(); som('fim'); }
}

function togglePausa() {
  paused = !paused; clearTimeout(auto);
  if (!paused && game.phase === 'reveal') auto = setTimeout(next, PAUSA * 1000);
  broadcast();
}

function iniciar() {
  if (!escolha.cats.size) return;
  deck = buildDeck(); paused = false; startQuestion(0);
}

function reset() {
  if (!confirm('Zerar o placar e voltar ao início?')) return;
  limpa();
  players.forEach(p => Object.assign(p, { score: 0, last: -1, choice: -1, pts: 0, streak: 0, hits: 0, resp: 0 }));
  game = { phase: 'lobby', q: 0, t: 0 }; deck = []; destaque = null;
  broadcast();
}

function baixar() {
  const safe = c => { c = String(c); return /^[=+\-@]/.test(c) ? "'" + c : c; }; // evita fórmulas maliciosas na planilha
  const linhas = [['Posição', 'Nome', 'Pontos', 'Acertos', 'Respondidas', 'Perguntas']]
    .concat(ranking().map((p, i) => [i + 1, p.name, p.score, p.hits, p.resp, deck.length]));
  const csv = '\ufeff' + linhas.map(l => l.map(c => '"' + safe(c).replace(/"/g, '""') + '"').join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'resultado-tech-arena.csv'; a.click();
}

function onData(c, d) {
  if (!d) return;
  if (d.t === 'join' && d.pid && d.name) {
    conns.set(c, d.pid);
    if (!players.has(d.pid)) players.set(d.pid, { name: String(d.name).slice(0, 18), emoji: String(d.emoji || '⭐').slice(0, 4), score: 0, last: -1, choice: -1, pts: 0, streak: 0, hits: 0, resp: 0, prev: 99 });
    broadcast();
  } else if (d.t === 'answer') {
    const p = players.get(conns.get(c));
    if (!p || game.phase !== 'q' || p.last === game.q) return;
    const lf = Math.max(0, TIME - (Date.now() - game.t) / 1000);
    p.last = game.q; p.choice = d.i; p.resp++;
    if (d.i === deck[game.q].r) { p.streak++; p.hits++; p.pts = 500 + Math.round(500 * lf / TIME) + Math.min(p.streak - 1, 4) * 50; } // combo: +50 por acerto seguido (até +200)
    else { p.streak = 0; p.pts = 0; }
    p.score += p.pts;
    broadcast();
  }
}

function openRoom() {
  room = Array.from({ length: 4 }, () => ALFA[Math.floor(Math.random() * ALFA.length)]).join('');
  peer = new Peer('techarena-' + room);
  peer.on('open', () => { erro = ''; broadcast(); });
  peer.on('connection', c => { c.on('data', d => onData(c, d)); c.on('close', () => conns.delete(c)); });
  peer.on('error', e => {
    if (e.type === 'unavailable-id') { peer.destroy(); openRoom(); return; }
    erro = 'Erro de conexão (' + e.type + '). Recarregue a página.'; render();
  });
}

function lobby(app, bar, btn) {
  const link = new URL('index.html?sala=' + room, location.href).href;
  app.append(h('h2', null, '🎛️ Painel do professor'), h('p', null, 'Alunos: abram o link ou leiam o QR Code e digitem o código.'), h('div', 'code', room));
  const qr = h('div', 'qr'); app.appendChild(qr);
  if (typeof QRCode !== 'undefined') new QRCode(qr, { text: link, width: 150, height: 150 });
  app.append(h('p', 'link', link), h('p', null, `${st.count} jogador(es) na sala. Mantenha esta aba aberta.`));
  const cats = h('div', 'cats');
  CATS.forEach(c => {
    const l = h('label', 'pill'), i = h('input'); i.type = 'checkbox'; i.checked = escolha.cats.has(c);
    i.onchange = () => { i.checked ? escolha.cats.add(c) : escolha.cats.delete(c); };
    l.append(i, c); cats.appendChild(l);
  });
  const sel = h('select');
  [8, 12, 20, 32].forEach(n => { const o = h('option', null, n + ' perguntas'); o.value = n; o.selected = n === escolha.n; sel.appendChild(o); });
  sel.onchange = () => { escolha.n = +sel.value; };
  app.append(h('p', null, 'Categorias e quantidade (sorteadas a cada jogo):'), cats, sel);
  btn('▶ Iniciar jogo', iniciar);
}

function render() {
  const app = $('#app'); app.textContent = '';
  $('#tag').textContent = room ? `Sala ${room} · ${players.size} jogador(es)` : '';
  if (st) drawRank(st.ranking);
  if (erro) { app.append(h('h2', null, '⚠️ ' + erro)); return; }
  if (!st) { app.append(h('h2', 'wait', 'Criando sala…')); return; }
  const bar = h('div', 'hostbar');
  const btn = (txt, fn, ghost) => { const b = h('button', 'cta' + (ghost ? ' ghost' : ''), txt); b.onclick = fn; bar.appendChild(b); };
  if (st.phase === 'lobby') lobby(app, bar, btn);
  else if (st.phase === 'end') { podium(app, st.ranking); btn('📥 Baixar resultado (.csv)', baixar); btn('🔄 Novo jogo', reset); }
  else if (st.phase === 'cd') { drawCountdown(app, st); btn('Reiniciar', reset, true); }
  else {
    drawQuestion(app, st, { play: false });
    if (st.phase === 'q') btn('⏭ Revelar agora', reveal);
    else {
      drawDestaque(app, st);
      btn(st.question.i + 1 < st.question.total ? '➡ Próxima agora' : '🏁 Ver pódio', next);
      btn(paused ? '▶ Retomar avanço automático' : '⏸ Pausar avanço automático', togglePausa, true);
    }
    btn('Reiniciar', reset, true);
  }
  app.appendChild(bar);
}

if (typeof Peer === 'undefined') { erro = 'Não carregou o PeerJS. Verifique a internet e recarregue.'; render(); } else { render(); openRoom(); }