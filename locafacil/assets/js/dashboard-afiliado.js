// ── dashboard-afiliado.js ─────────────────────────────

// ── Autenticação ──────────────────────────────────────
const sess = DB.getSession();
if (!sess || sess.tipo !== 'afiliado') { location.href = 'login.html'; throw new Error('redirect'); }

document.getElementById('empNome').textContent    = sess.nome;
document.getElementById('subtituloEmp').textContent = `Bem-vindo, ${sess.nome}!`;

// ── Constantes ────────────────────────────────────────
const ICONS = {
  obra:'fa-hard-hat', organico:'fa-seedling', moveis:'fa-couch',
  gesso:'fa-palette', vidro:'fa-wine-glass', plastico:'fa-recycle'
};
const TIPO_L = {
  obra:'Obra', organico:'Orgânico', moveis:'Móveis',
  gesso:'Gesso', vidro:'Vidro', plastico:'Plástico'
};
const MN = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MA = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// Status possíveis em ordem de progresso
const STATUS_FLOW  = ['pendente', 'a-caminho', 'entregue', 'recolhida'];
const STATUS_LABEL = {
  pendente:  'Pendente',
  'a-caminho':'A caminho',
  entregue:  'Entregue',
  recolhida: 'Recolhida',
  concluido: 'Concluído'
};

// ── Toast ──────────────────────────────────────────────
function toast(msg, dur = 2400) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), dur);
}

// ── Logout ─────────────────────────────────────────────
function sair() { // logout via API
  localStorage.removeItem('lf_token');
  localStorage.removeItem('lf_session');
  location.href = '../../index.html'; location.href = '../../index.html'; }

// ── Navegação ──────────────────────────────────────────
function showPage(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  if (btn) btn.classList.add('active');
  if (id === 'overview')  renderOverview();
  if (id === 'pedidos')   renderPedidos();
  if (id === 'relatorio') renderRelatorio();
  if (id === 'cacambas')  renderCacambas();
  if (id === 'cobertura') renderCobertura();
}

// ── VISÃO GERAL ────────────────────────────────────────
let chR, chS;
function renderOverview() {
  const rel = DB.getRelatorio(sess.id);
  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card"><div class="stat-icon si-green"><i class="fas fa-dollar-sign"></i></div><div class="stat-info"><div class="s-lbl">Receita Total</div><div class="s-val">R$ ${rel.totalReceita.toLocaleString('pt-BR')}</div></div></div>
    <div class="stat-card"><div class="stat-icon si-blue"><i class="fas fa-clipboard-list"></i></div><div class="stat-info"><div class="s-lbl">Pedidos</div><div class="s-val">${rel.totalPedidos}</div></div></div>
    <div class="stat-card"><div class="stat-icon si-orange"><i class="fas fa-truck"></i></div><div class="stat-info"><div class="s-lbl">Pendentes</div><div class="s-val">${rel.pedidosPendentes}</div></div></div>
    <div class="stat-card"><div class="stat-icon si-purple"><i class="fas fa-dumpster"></i></div><div class="stat-info"><div class="s-lbl">Caçambas Ativas</div><div class="s-val">${rel.cacambasAtivas}/${rel.totalCacambas}</div></div></div>
  `;

  const ms  = Object.keys(rel.mensais).sort();
  const lb  = ms.map(m => { const [y, o] = m.split('-'); return MA[+o-1] + ' ' + y.slice(2); });
  const rv  = ms.map(m => rel.mensais[m].receita);

  if (chR) chR.destroy();
  chR = new Chart(document.getElementById('chartReceita'), {
    type: 'line',
    data: { labels: lb, datasets: [{ label: 'Receita', data: rv, borderColor: '#0b6426', backgroundColor: 'rgba(11,100,38,.1)', tension: .4, fill: true, pointBackgroundColor: '#0b6426' }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: v => 'R$' + v } } } }
  });

  const sc = rel.statusCount || {};
  if (chS) chS.destroy();
  chS = new Chart(document.getElementById('chartStatus'), {
    type: 'doughnut',
    data: { labels: ['Concluídos', 'Em andamento', 'Pendentes'], datasets: [{ data: [(sc.concluido||0)+(sc.recolhida||0), (sc['a-caminho']||0)+(sc.entregue||0), sc.pendente||0], backgroundColor: ['#6c757d', '#0b6426', '#f59e0b'], borderWidth: 0 }] },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } }, cutout: '65%' }
  });
}

// ── PEDIDOS ────────────────────────────────────────────
function renderPedidos() {
  const filtro = document.getElementById('filtroStatus').value;
  let pedidos  = DB.getPedidos({ afiliadoId: sess.id });
  if (filtro) pedidos = pedidos.filter(p => p.status === filtro);
  const cMap = {};
  DB.getCacambas().forEach(c => (cMap[c.id] = c));

  document.getElementById('tbodyPedidos').innerHTML = pedidos.length
    ? [...pedidos].reverse().map(p => {
        const c = cMap[p.cacambaId] || {};
        // Select de status com classes dinâmicas
        const opts = [...STATUS_FLOW, 'concluido'].map(s =>
          `<option value="${s}" ${p.status === s ? 'selected' : ''}>${STATUS_LABEL[s]}</option>`
        ).join('');
        return `<tr>
          <td><b>#${p.id.slice(-4).toUpperCase()}</b></td>
          <td><i class="fas ${ICONS[c.tipo]||'fa-dumpster'}" style="color:#0b6426;margin-right:5px;"></i>${c.nome || '-'}</td>
          <td>${p.data}${p.dataFim ? ' → ' + p.dataFim : ''}</td>
          <td style="font-size:12px;color:#555;">${p.endereco || '-'}</td>
          <td><b>R$ ${p.valor.toLocaleString('pt-BR')}</b></td>
          <td>
            <select class="status-select ${p.status}" data-id="${p.id}" onchange="alterarStatus(this)">
              ${opts}
            </select>
          </td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="6" style="text-align:center;padding:28px;color:#bbb;">Nenhum pedido encontrado.</td></tr>';
}

// ── ALTERAR STATUS DO PEDIDO ───────────────────────────
function alterarStatus(sel) {
  const id         = sel.dataset.id;
  const novoStatus = sel.value;

  // Atualiza via camada DB (localStorage) — "recolhida" vira "concluido"
  const pedido = DB.atualizarStatusPedido(id, novoStatus);
  if (!pedido) return;

  // Atualizar visual do select
  sel.value     = pedido.status;
  sel.className = `status-select ${pedido.status}`;

  const msgs = {
    'a-caminho': '🚚 Pedido marcado como "A caminho"!',
    entregue:    '✅ Caçamba entregue!',
    recolhida:   '✔ Recolhida — pedido concluído!',
    concluido:   '✔ Pedido concluído!',
    pendente:    '⏳ Pedido voltou para pendente.'
  };
  toast(msgs[novoStatus] || '✅ Status atualizado!');

  // Atualizar overview se estiver visível
  if (document.getElementById('page-overview').classList.contains('active')) {
    renderOverview();
  }
}

// ── RELATÓRIO ──────────────────────────────────────────
let chP, chA;
function renderRelatorio() {
  const rel = DB.getRelatorio(sess.id);
  const tm  = rel.totalPedidos > 0 ? Math.round(rel.totalReceita / rel.totalPedidos) : 0;

  document.getElementById('relStats').innerHTML = `
    <div class="stat-card"><div class="stat-icon si-green"><i class="fas fa-dollar-sign"></i></div><div class="stat-info"><div class="s-lbl">Receita Total</div><div class="s-val">R$ ${rel.totalReceita.toLocaleString('pt-BR')}</div></div></div>
    <div class="stat-card"><div class="stat-icon si-blue"><i class="fas fa-ticket-alt"></i></div><div class="stat-info"><div class="s-lbl">Ticket Médio</div><div class="s-val">R$ ${tm.toLocaleString('pt-BR')}</div></div></div>
    <div class="stat-card"><div class="stat-icon si-orange"><i class="fas fa-hourglass-half"></i></div><div class="stat-info"><div class="s-lbl">Pendentes</div><div class="s-val">${rel.pedidosPendentes}</div></div></div>
    <div class="stat-card"><div class="stat-icon si-purple"><i class="fas fa-check-circle"></i></div><div class="stat-info"><div class="s-lbl">Concluídos</div><div class="s-val">${(rel.statusCount && (rel.statusCount.concluido || 0)) + (rel.statusCount && (rel.statusCount.recolhida || 0))}</div></div></div>
  `;

  const ms  = Object.keys(rel.mensais).sort();
  const lb  = ms.map(m => { const [, o] = m.split('-'); return MA[+o-1]; });
  const pv  = ms.map(m => rel.mensais[m].pedidos);
  const rv  = ms.map(m => rel.mensais[m].receita);
  let ac = 0;
  const av  = rv.map(r => (ac += r, ac));

  if (chP) chP.destroy();
  chP = new Chart(document.getElementById('chartPedMes'), {
    type: 'bar',
    data: { labels: lb, datasets: [{ label: 'Pedidos', data: pv, backgroundColor: '#0b6426', borderRadius: 6 }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });
  if (chA) chA.destroy();
  chA = new Chart(document.getElementById('chartRecAcum'), {
    type: 'line',
    data: { labels: lb, datasets: [{ label: 'Receita', data: av, borderColor: '#0b6426', backgroundColor: 'rgba(11,100,38,.08)', tension: .4, fill: true }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => 'R$' + v } } } }
  });

  document.getElementById('tbodyRel').innerHTML = ms.length
    ? ms.slice().reverse().map(m => {
        const d = rel.mensais[m], [y, o] = m.split('-');
        const tk = d.pedidos > 0 ? Math.round(d.receita / d.pedidos) : 0;
        return `<tr><td>${MN[+o-1]} ${y}</td><td>${d.pedidos}</td><td><b>R$ ${d.receita.toLocaleString('pt-BR')}</b></td><td>R$ ${tk.toLocaleString('pt-BR')}</td></tr>`;
      }).join('')
    : '<tr><td colspan="4" style="text-align:center;color:#bbb;padding:20px;">Sem dados ainda.</td></tr>';
}

// ── CAÇAMBAS ───────────────────────────────────────────
function renderCacambas() {
  const lista = DB.getCacambas({ afiliadoId: sess.id });
  const cob   = DB.getCobertura(sess.id);

  document.getElementById('alertaCobCacamba').style.display = cob.length ? 'none' : 'inline-flex';

  const cobTxt = cob.length
    ? cob.map(c => `${c.cidade}${c.bairro ? ', ' + c.bairro : ''}${c.cep_inicio && c.cep_fim ? ' (' + c.cep_inicio + '–' + c.cep_fim + ')' : ''}`).join(' · ')
    : 'Nenhuma área de entrega definida';

  document.getElementById('cacambaGrid').innerHTML = lista.length
    ? lista.map(c => `
      <div class="cacamba-card ${c.disponivel ? '' : 'inativa'}">
        <div class="cc-img-area">
          ${c.imagem ? `<img src="${c.imagem}" onerror="this.style.display='none'">` : `<i class="fas ${ICONS[c.tipo]||'fa-dumpster'}"></i>`}
          <span class="cc-tipo-badge">${TIPO_L[c.tipo] || c.tipo}</span>
          <span class="cc-disp-badge ${c.disponivel ? 'on' : 'off'}">${c.disponivel ? 'Disponível' : 'Pausada'}</span>
        </div>
        <div class="cc-body">
          <div class="cc-nome">${c.nome}</div>
          <div class="cc-specs">
            <div class="spec"><div class="k">Capacidade</div><div class="v">${c.capacidade || '—'}</div></div>
            <div class="spec"><div class="k">Dimensões</div><div class="v" style="font-size:11px;">${c.dimensoes || '—'}</div></div>
            <div class="spec"><div class="k">Peso máx.</div><div class="v">${c.peso_max || '—'}</div></div>
            <div class="spec"><div class="k">Preço/sem</div><div class="v">R$ ${(c.preco||0).toLocaleString('pt-BR')}</div></div>
          </div>
          <div class="cc-cobertura"><i class="fas fa-map-marker-alt"></i><span>${cobTxt}</span></div>
          <div class="cc-desc">${c.descricao || ''}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div class="cc-preco">R$ ${(c.preco||0).toLocaleString('pt-BR')}<span>/semana</span></div>
          </div>
          <div class="cc-actions">
            <button class="btn-sm btn-edit" onclick="abrirModal('${c.id}')"><i class="fas fa-edit"></i> Editar</button>
            <button class="btn-sm btn-tog"  onclick="toggleDisp('${c.id}')">${c.disponivel ? '<i class="fas fa-pause"></i> Pausar' : '<i class="fas fa-play"></i> Ativar'}</button>
            <button class="btn-sm btn-del"  onclick="delCacamba('${c.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>`)
    .join('')
    : `<div class="empty-g"><i class="fas fa-dumpster" style="color:#ccc;"></i>Nenhuma caçamba cadastrada.<br>Clique em "Nova Caçamba" para começar.</div>`;
}

// ── MODAL CAÇAMBA ──────────────────────────────────────
function abrirModal(id) {
  document.getElementById('modalTitulo').textContent = id ? 'Editar Caçamba' : 'Nova Caçamba';
  document.getElementById('editId').value = id || '';

  if (id) {
    const c = DB.getCacambaById(id);
    document.getElementById('fNome').value  = c.nome || '';
    document.getElementById('fTipo').value  = c.tipo || 'obra';
    document.getElementById('fCap').value   = c.capacidade || '';
    document.getElementById('fDim').value   = c.dimensoes || '';
    document.getElementById('fPeso').value  = c.peso_max || '';
    document.getElementById('fPreco').value = c.preco || '';
    document.getElementById('fDesc').value  = c.descricao || '';
    document.getElementById('fImg').value   = c.imagem || '';
    document.getElementById('fDisp').checked = c.disponivel !== false;
  } else {
    ['fNome','fCap','fDim','fPeso','fPreco','fDesc','fImg'].forEach(i => document.getElementById(i).value = '');
    document.getElementById('fTipo').value = 'obra';
    document.getElementById('fDisp').checked = true;
  }

  const cob = DB.getCobertura(sess.id);
  document.getElementById('cobAlerta').style.display = cob.length ? 'none' : 'block';
  document.getElementById('cobInfo').style.display   = cob.length ? 'block' : 'none';
  if (cob.length) {
    document.getElementById('cobInfo').innerHTML = `<i class="fas fa-map-marker-alt" style="margin-right:5px;"></i>Ficará visível em: <strong>${cob.map(c => `${c.cidade} — ${c.estado}`).join(', ')}</strong>`;
    document.getElementById('cobTags').innerHTML = cob.map(c => `<span class="cov-tag"><i class="fas fa-map-marker-alt"></i>${c.cidade}${c.estado ? ' – ' + c.estado : ''}</span>`).join('');
  } else {
    document.getElementById('cobTags').innerHTML = '<span style="font-size:12px;color:#bbb;">Nenhuma região cadastrada ainda.</span>';
  }
  document.getElementById('modalCacamba').classList.add('open');
}

function fecharModal() { document.getElementById('modalCacamba').classList.remove('open'); }
document.getElementById('modalCacamba').addEventListener('click', e => {
  if (e.target === document.getElementById('modalCacamba')) fecharModal();
});

function salvarCacamba() {
  const id    = document.getElementById('editId').value;
  const nome  = document.getElementById('fNome').value.trim();
  const preco = parseFloat(document.getElementById('fPreco').value);
  if (!nome)          { alert('Informe o nome da caçamba.'); return; }
  if (!preco || preco <= 0) { alert('Informe um preço válido.'); return; }

  DB.salvarCacamba({
    id: id || undefined, afiliadoId: sess.id,
    nome, tipo: document.getElementById('fTipo').value,
    capacidade: document.getElementById('fCap').value,
    dimensoes:  document.getElementById('fDim').value,
    peso_max:   document.getElementById('fPeso').value,
    preco, descricao: document.getElementById('fDesc').value,
    imagem: document.getElementById('fImg').value || null,
    disponivel: document.getElementById('fDisp').checked
  });

  fecharModal();
  renderCacambas();
  toast('✅ Caçamba salva!');
}

function toggleDisp(id) {
  const c = DB.getCacambaById(id); if (!c) return;
  c.disponivel = !c.disponivel;
  DB.salvarCacamba(c);
  renderCacambas();
  toast(c.disponivel ? '✅ Caçamba ativada!' : '⏸ Caçamba pausada.');
}

function delCacamba(id) {
  if (!confirm('Remover esta caçamba?')) return;
  DB.deletarCacamba(id);
  renderCacambas();
  toast('🗑 Caçamba removida.');
}

// ── COBERTURA (Área de Entrega) ────────────────────────
function renderCobertura() {
  const cob = DB.getCobertura(sess.id);
  document.getElementById('covList').innerHTML = cob.length
    ? cob.map((c, i) => `
      <div class="cov-item">
        <div class="cov-ico"><i class="fas fa-map-marker-alt"></i></div>
        <div class="cov-info">
          <div class="cov-cidade">${c.cidade}${c.estado ? ' — ' + c.estado : ''}${c.bairro ? ' · ' + c.bairro : ''}</div>
          <div class="cov-detalhe">${c.cep_inicio && c.cep_fim ? `Faixa de CEP: ${c.cep_inicio} até ${c.cep_fim}` : 'Cobertura por cidade/estado'}</div>
        </div>
        <button class="btn-rem" onclick="remCob(${i})"><i class="fas fa-trash"></i> Remover</button>
      </div>`)
    .join('')
    : `<div class="empty"><i class="fas fa-map"></i>Nenhuma região cadastrada ainda.</div>`;
}

function addCobertura() {
  const cidade = document.getElementById('covCidade').value.trim();
  const estado = document.getElementById('covEstado').value.trim().toUpperCase();
  const bairro = document.getElementById('covBairro').value.trim();
  const ini    = document.getElementById('covIni').value.trim();
  const fim    = document.getElementById('covFim').value.trim();
  if (!cidade || !estado) { alert('Cidade e Estado são obrigatórios.'); return; }
  const cob = DB.getCobertura(sess.id);
  if (cob.some(c => c.cidade.toLowerCase() === cidade.toLowerCase() && c.estado.toLowerCase() === estado.toLowerCase() && (c.bairro||'') === bairro)) {
    alert('Esta região já está cadastrada.'); return;
  }
  cob.push({ cidade, estado, bairro, cep_inicio: ini, cep_fim: fim });
  DB.salvarCobertura(sess.id, cob);
  ['covCidade','covEstado','covBairro','covIni','covFim','cepLookup'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('lkRes').textContent = '';
  document.getElementById('lkRes').className   = 'lk-res';
  renderCobertura();
  toast('✅ Região adicionada!');
}

function remCob(i) {
  const cob = DB.getCobertura(sess.id);
  cob.splice(i, 1);
  DB.salvarCobertura(sess.id, cob);
  renderCobertura();
  toast('🗑 Região removida.');
}

// ── VIACEP ─────────────────────────────────────────────
function fmtCep(el) {
  let v = el.value.replace(/\D/g, '');
  if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5, 8);
  el.value = v;
}
['cepLookup','covIni','covFim'].forEach(id => {
  document.getElementById(id).addEventListener('input', function () { fmtCep(this); });
});
document.getElementById('cepLookup').addEventListener('keydown', e => e.key === 'Enter' && lookupCep());

async function lookupCep() {
  const cep = document.getElementById('cepLookup').value.replace(/\D/g, '');
  const el  = document.getElementById('lkRes');
  if (cep.length !== 8) { el.textContent = 'CEP deve ter 8 dígitos.'; el.className = 'lk-res err'; return; }
  el.textContent = 'Consultando...'; el.className = 'lk-res';
  try {
    const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const d = await r.json();
    if (d.erro) { el.textContent = 'CEP não encontrado.'; el.className = 'lk-res err'; return; }
    document.getElementById('covCidade').value = d.localidade || '';
    document.getElementById('covEstado').value = d.uf || '';
    if (d.bairro) document.getElementById('covBairro').value = d.bairro;
    el.textContent = `✅ ${d.logradouro ? d.logradouro + ', ' : ''}${d.bairro ? d.bairro + ' — ' : ''}${d.localidade} / ${d.uf}`;
    el.className = 'lk-res ok';
  } catch (e) {
    el.textContent = 'Erro ao consultar. Verifique sua conexão.'; el.className = 'lk-res err';
  }
}

// ── INIT ───────────────────────────────────────────────
renderOverview();
