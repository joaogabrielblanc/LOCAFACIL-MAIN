// ── dashboard-cliente.js ──────────────────────────────

// ── Autenticação ──────────────────────────────────────
const sess = DB.getSession();
if (!sess || sess.tipo !== 'cliente') {
  location.href = 'login.html';
  throw new Error('redirect');
}

// Preencher nome
document.getElementById('nomeTopo').textContent   = sess.nome;
document.getElementById('saudacaoTxt').textContent = `Olá, ${sess.nome.split(' ')[0]}! 👋`;

// ── Constantes ────────────────────────────────────────
const ICONS = {
  obra: 'fa-hard-hat', organico: 'fa-seedling', moveis: 'fa-couch',
  gesso: 'fa-palette', vidro: 'fa-wine-glass', plastico: 'fa-recycle'
};
const TIPO_L = {
  obra: 'Obra', organico: 'Orgânico', moveis: 'Móveis',
  gesso: 'Gesso', vidro: 'Vidro', plastico: 'Plástico'
};
const STATUS_LABEL = {
  pendente: 'Pendente', 'a-caminho': 'A caminho',
  entregue: 'Entregue', recolhida: 'Recolhida', concluido: 'Concluído'
};

// ── Logout ────────────────────────────────────────────
function sair() {
  // logout via API
  localStorage.removeItem('lf_token');
  localStorage.removeItem('lf_session');
  location.href = '../../index.html';
  location.href = '../../index.html';
}

// ── Navegação ─────────────────────────────────────────
function showPage(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  if (btn) btn.classList.add('active');
  if (id === 'pedidos') renderPedidosFull();
}

// ── VISÃO GERAL ───────────────────────────────────────
function renderVisao() {
  const pedidos = DB.getPedidos({ clienteId: sess.id });
  const ativos  = pedidos.filter(p => p.status === 'ativo' || p.status === 'a-caminho' || p.status === 'entregue').length;
  const gasto   = pedidos.reduce((s, p) => s + p.valor, 0);

  document.getElementById('statsRow').innerHTML = `
    <div class="stat-card">
      <div class="stat-icon si-green"><i class="fas fa-boxes"></i></div>
      <div class="stat-info"><div class="s-lbl">Total Pedidos</div><div class="s-val">${pedidos.length}</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon si-blue"><i class="fas fa-truck"></i></div>
      <div class="stat-info"><div class="s-lbl">Em andamento</div><div class="s-val">${ativos}</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon si-orange"><i class="fas fa-dollar-sign"></i></div>
      <div class="stat-info"><div class="s-lbl">Total investido</div><div class="s-val">R$ ${gasto.toLocaleString('pt-BR')}</div></div>
    </div>
  `;

  const cacambaMap = {};
  DB.getCacambas().forEach(c => (cacambaMap[c.id] = c));
  const recentes = [...pedidos].reverse().slice(0, 3);

  document.getElementById('pedidosRecentes').innerHTML = recentes.length
    ? recentes.map(p => pedidoHTML(p, cacambaMap)).join('')
    : `<div class="empty"><i class="fas fa-inbox"></i>Nenhum pedido ainda. Busque caçambas!</div>`;
}

function pedidoHTML(p, cacambaMap) {
  const c = cacambaMap[p.cacambaId] || {};
  const lbl = STATUS_LABEL[p.status] || p.status;
  return `
    <div class="pedido-item">
      <div class="pedido-icon"><i class="fas ${ICONS[c.tipo] || 'fa-dumpster'}"></i></div>
      <div class="pedido-info">
        <h4>${c.nome || 'Caçamba'}</h4>
        <span><i class="fas fa-calendar" style="margin-right:4px;"></i>${p.data}${p.dataFim ? ' → ' + p.dataFim : ''}</span>
      </div>
      <div class="pedido-valor">
        <div class="v">R$ ${p.valor.toLocaleString('pt-BR')}</div>
        <span class="badge ${p.status}">${lbl}</span>
      </div>
    </div>`;
}

// ── PEDIDOS FULL ──────────────────────────────────────
function renderPedidosFull() {
  const filtro = document.getElementById('filtroPedido').value;
  let pedidos  = DB.getPedidos({ clienteId: sess.id });
  if (filtro) pedidos = pedidos.filter(p => p.status === filtro);
  const cacambaMap = {};
  DB.getCacambas().forEach(c => (cacambaMap[c.id] = c));
  document.getElementById('listaPedidosFull').innerHTML = pedidos.length
    ? [...pedidos].reverse().map(p => pedidoHTML(p, cacambaMap)).join('')
    : `<div class="empty"><i class="fas fa-filter"></i>Nenhum pedido com esse filtro.</div>`;
}

// ── FORMATAÇÃO CEP ────────────────────────────────────
function formatCep(el) {
  let v = el.value.replace(/\D/g, '');
  if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5, 8);
  el.value = v;
}
document.getElementById('cepBusca').addEventListener('input', function () { formatCep(this); });
document.getElementById('cepVisao').addEventListener('input', function () { formatCep(this); });

// ── BUSCA DA VISÃO GERAL ──────────────────────────────
function buscarDaVisao() {
  const cep = document.getElementById('cepVisao').value;
  document.getElementById('cepBusca').value = cep;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-buscar').classList.add('active');
  document.querySelectorAll('.nav-btn')[2].classList.add('active');
  buscarCacambas();
}

// ── BUSCA POR CEP ─────────────────────────────────────
let todasCacambas = [];
let tipoAtivo     = '';

async function buscarCacambas() {
  const cep = document.getElementById('cepBusca').value.replace(/\D/g, '');
  if (cep.length < 8) { alert('Digite um CEP válido (8 dígitos).'); return; }

  const grid = document.getElementById('resultadosGrid');
  grid.innerHTML = `<div class="empty"><i class="fas fa-spinner fa-spin" style="color:var(--green);"></i>Consultando localização...</div>`;
  document.getElementById('filtrosTipo').style.display = 'none';

  let cidadeApi = '', estadoApi = '';
  try {
    const resp  = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const dados = await resp.json();
    if (!dados.erro) {
      cidadeApi = dados.localidade || '';
      estadoApi = dados.uf || '';
    }
  } catch (e) {
    console.warn('ViaCEP indisponível:', e);
  }

  todasCacambas = DB.buscarCacambasPorLocalidade(cidadeApi, estadoApi, parseInt(cep, 10));
  tipoAtivo     = '';
  document.querySelectorAll('.filtro-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
  document.getElementById('filtrosTipo').style.display = 'flex';

  // Banner de localidade
  if (cidadeApi) {
    const banner = document.createElement('div');
    banner.style.cssText = 'grid-column:1/-1;background:#f0f9f3;border-radius:10px;padding:12px 16px;font-size:13px;color:var(--green);font-weight:700;margin-bottom:4px;display:flex;align-items:center;gap:8px;';
    banner.innerHTML = `<i class="fas fa-map-marker-alt"></i> Buscando caçambas em <b>${cidadeApi} — ${estadoApi}</b>`;
    grid.innerHTML = '';
    grid.appendChild(banner);
  } else {
    grid.innerHTML = '';
  }
  renderCacambas();
}

function filtrarTipo(tipo, btn) {
  tipoAtivo = tipo;
  document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderCacambas();
}

function renderCacambas() {
  const lista    = tipoAtivo ? todasCacambas.filter(c => c.tipo === tipoAtivo) : todasCacambas;
  const afiliados = {};
  DB.getAfiliados().forEach(a => (afiliados[a.id] = a));
  const grid = document.getElementById('resultadosGrid');

  // Preservar banner se existir
  const banner = grid.querySelector('div[style]');

  if (!lista.length) {
    const msg = document.createElement('div');
    msg.className = 'empty';
    msg.innerHTML = '<i class="fas fa-search-minus" style="color:#ccc;"></i>Nenhuma caçamba encontrada com esses filtros.';
    if (banner) { grid.innerHTML = ''; grid.appendChild(banner); }
    else grid.innerHTML = '';
    grid.appendChild(msg);
    return;
  }

  const cards = lista.map(c => {
    const af = afiliados[c.afiliadoId] || {};
    return `
      <div class="cacamba-card">
        <div class="cc-img-area">
          ${c.imagem ? `<img src="${c.imagem}" onerror="this.style.display='none'">` : `<i class="fas ${ICONS[c.tipo] || 'fa-dumpster'}"></i>`}
          <span class="cc-tipo-badge">${TIPO_L[c.tipo] || c.tipo}</span>
        </div>
        <div class="cc-body">
          <div class="cc-nome">${c.nome}</div>
          <div class="cc-empresa"><i class="fas fa-building" style="margin-right:4px;"></i>${af.empresa || 'Empresa Parceira'}${af.cidade ? ' · ' + af.cidade : ''}${af.estado ? ' - ' + af.estado : ''}</div>
          <div class="cc-specs">
            <div class="spec"><div class="k">Capacidade</div><div class="v">${c.capacidade || '—'}</div></div>
            <div class="spec"><div class="k">Dimensões</div><div class="v" style="font-size:11px;">${c.dimensoes || '—'}</div></div>
            <div class="spec"><div class="k">Peso máx.</div><div class="v">${c.peso_max || '—'}</div></div>
            <div class="spec"><div class="k">Tipo</div><div class="v">${TIPO_L[c.tipo] || '—'}</div></div>
          </div>
          <div class="cc-desc">${c.descricao || ''}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div class="cc-preco">R$ ${c.preco.toLocaleString('pt-BR')}<span>/semana</span></div>
            <button class="btn-alugar" onclick="abrirPedido('${c.id}')"><i class="fas fa-shopping-cart"></i> Alugar</button>
          </div>
        </div>
      </div>`;
  }).join('');

  if (banner) { grid.innerHTML = ''; grid.appendChild(banner); grid.insertAdjacentHTML('beforeend', cards); }
  else grid.innerHTML = cards;
}

// ── MODAL PEDIDO ──────────────────────────────────────
let cacambaSelecionada = null;

function abrirPedido(id) {
  cacambaSelecionada = DB.getCacambaById(id);
  if (!cacambaSelecionada) return;
  const c = cacambaSelecionada;

  document.getElementById('resumoModal').innerHTML = `
    <div class="r-nome"><i class="fas ${ICONS[c.tipo] || 'fa-dumpster'}" style="margin-right:6px;color:var(--green);"></i>${c.nome}</div>
    <div class="r-info">${c.capacidade} · ${c.dimensoes} · Peso máx. ${c.peso_max || '—'}</div>
    <div class="r-preco">R$ ${c.preco.toLocaleString('pt-BR')} <span style="font-size:12px;color:#888;font-weight:400;">por semana</span></div>`;

  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('dataInicio').value = hoje;
  document.getElementById('dataInicio').min   = hoje;

  const clientes = JSON.parse(localStorage.getItem('lf_clientes') || '[]');
  const cli = clientes.find(c => c.id === sess.id);
  document.getElementById('enderecoEntrega').value = cli?.endereco || '';

  document.getElementById('successMsg').style.display = 'none';
  document.getElementById('modalPedido').classList.add('open');
}

function fecharModal() { document.getElementById('modalPedido').classList.remove('open'); }
document.getElementById('modalPedido').addEventListener('click', function (e) {
  if (e.target === this) fecharModal();
});

function confirmarPedido() {
  const end    = document.getElementById('enderecoEntrega').value.trim();
  const data   = document.getElementById('dataInicio').value;
  const dias   = parseInt(document.getElementById('periodoAluguel').value);
  if (!end)  { alert('Informe o endereço de entrega.'); return; }
  if (!data) { alert('Selecione uma data de início.'); return; }

  const dataFim = new Date(data);
  dataFim.setDate(dataFim.getDate() + dias);
  const dataFimStr = dataFim.toISOString().split('T')[0];
  const semanas    = Math.ceil(dias / 7);
  const valor      = cacambaSelecionada.preco * semanas;

  DB.criarPedido({
    clienteId:  sess.id,
    cacambaId:  cacambaSelecionada.id,
    afiliadoId: cacambaSelecionada.afiliadoId,
    status:     'pendente',
    data, dataFim: dataFimStr, valor, endereco: end
  });

  document.getElementById('successMsg').style.display = 'block';
  setTimeout(() => { fecharModal(); renderVisao(); }, 1800);
}

// ── ENTER nos campos de busca ─────────────────────────
document.getElementById('cepBusca').addEventListener('keydown', e => e.key === 'Enter' && buscarCacambas());
document.getElementById('cepVisao').addEventListener('keydown', e => e.key === 'Enter' && buscarDaVisao());

// ── INIT ──────────────────────────────────────────────
renderVisao();
