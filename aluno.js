// Tela do ALUNO: conecta direto ao navegador do professor (WebRTC via PeerJS).
const EM = ['🚀', '🦊', '🐼', '🤖', '🐙', '🦄', '🔥', '👾', '🐯', '🎮', '🧠', '🌟'];
let lastRev = '', st = null, me = null, emo = EM[0], peer = null, conn = null, aviso = '';
let prof = null;
try { prof = JSON.parse(sessionStorage.getItem('prof') || 'null'); } catch (e) {}
const salaURL = (new URLSearchParams(location.search).get('sala') || '').toUpperCase();

function connect() {
  clearTimeout(connect.t);
  if (peer) { try { peer.destroy(); } catch (e) {} }
  st = null; aviso = 'Conectando à sala ' + prof.room + '…'; render();
  peer = new Peer();
  const retry = msg => { aviso = msg; render(); connect.t = setTimeout(connect, 3000); };
  peer.on('open', () => {
    conn = peer.connect('techarena-' + prof.room, { reliable: true });
    conn.on('open', () => conn.send({ t: 'join', pid: prof.pid, name: prof.name, emoji: prof.emoji }));
    conn.on('data', d => {
      if (d.t === 'state') st = window.ST = fix(d.s);
      else if (d.t === 'me') me = d.m;
      render();
    });
    conn.on('close', () => retry('Conexão perdida. Reconectando…'));
  });
  peer.on('error', e => retry(e.type === 'peer-unavailable' ? 'Sala não encontrada. Confira o código com o professor.' : 'Erro de conexão. Tentando de novo…'));
}

function buildForm(app) {
  app.append(h('h2', null, '🎮 Entre na arena'));
  const nm = h('input'); nm.id = 'nm'; nm.placeholder = 'Seu nome'; nm.maxLength = 18;
  const rm = h('input'); rm.id = 'rm'; rm.placeholder = 'Código da sala'; rm.maxLength = 4; rm.value = salaURL;
  rm.style.textTransform = 'uppercase';
  const ev = h('div', 'emojis');
  EM.forEach(e => {
    const b = h('button', e === emo ? 'sel' : '', e);
    b.onclick = () => { emo = e; [...ev.children].forEach(c => c.classList.toggle('sel', c.textContent === e)); };
    ev.appendChild(b);
  });
  const go = h('button', 'cta', 'Entrar ⚡');
  go.onclick = () => {
    const name = nm.value.trim(), room = rm.value.trim().toUpperCase();
    if (!name || room.length !== 4) return;
    prof = { pid: Date.now().toString(36) + Math.random().toString(36).slice(2), name, emoji: emo, room };
    try { sessionStorage.setItem('prof', JSON.stringify(prof)); } catch (e) {}
    som('tic'); connect();
  };
  app.append(nm, rm, ev, go);
}

function render() {
  const app = $('#app');
  if (!prof) { if (!$('#nm')) buildForm(app); return; } // não apaga o campo enquanto digita
  app.textContent = '';
  $('#who').textContent = prof.emoji + ' ' + prof.name;
  if (st) drawRank(st.ranking, prof.name);
  if (!st) { app.append(h('h2', 'wait', aviso || 'Conectando…')); return; }
  if (st.phase === 'lobby') { app.append(h('h2', 'wait', 'Tudo pronto, ' + prof.name + '! 🚀'), h('p', null, 'Aguardando o professor iniciar…')); return; }
  if (st.phase === 'cd') { drawCountdown(app, st); return; }
  if (st.phase === 'end') { podium(app, st.ranking); if (lastRev !== 'fim') { lastRev = 'fim'; som('fim'); } return; }
  const answered = !!me && me.last === st.question.i;
  drawQuestion(app, st, { play: true, choice: me && me.choice, answered, onPick: i => { som('tic'); conn && conn.open && conn.send({ t: 'answer', i }); } });
  if (st.phase === 'reveal') {
    const k = 'r' + st.question.i;
    if (lastRev !== k) { lastRev = k; som(answered && me.pts ? 'ok' : 'erro'); }
    app.appendChild(answered ? h('div', 'gain ' + (me.pts ? 'plus' : 'zero'), me.pts ? `+${me.pts} pts 🔥` : 'Errou! 😅') : h('div', 'gain zero', '⏱ Sem resposta'));
    if (answered && me.pts && me.streak > 1) app.appendChild(h('p', 'destaque', `🔥 Combo x${me.streak}! Bônus de pontos`));
    drawDestaque(app, st);
  } else if (answered) app.appendChild(h('p', 'center wait', 'Resposta enviada! Aguarde… 🤞'));
}

if (prof) connect(); else render();