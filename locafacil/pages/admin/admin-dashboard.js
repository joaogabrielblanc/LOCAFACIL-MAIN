// admin-dashboard.js — Lógica completa do painel admin

// ── Guard ─────────────────────────────────────────────
const sess = AdminAPI.getSession();
if (!sess || sess.tipo !== 'admin') { location.href = 'login.html'; throw new Error('redirect'); }
document.getElementById('sUser').textContent = sess.nome + ' · admin';

// ── Dados em memória ──────────────────────────────────
let _clientes  = [];
let _afiliados = [];
let _pedidos   = [];

// ── Toast ─────────────────────────────────────────────
function toast(msg, err = false) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.background = err ? '#c0392b' : '#1a2e1d';
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2600);
}

// ── Navegação ─────────────────────────────────────────
function nav(btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const id = btn.dataset.page;
  document.getElementById('page-' + id).classList.add('active');
  btn.classList.add('active');
  if (id === 'overview')  carregarOverview();
  if (id === 'clientes')  carregarClientes();
  if (id === 'afiliados') carregarAfiliados();
  if (id === 'pedidos')   carregarPedidos();
  if (id === 'banco')     carregarDb('clientes');
}

// ── VISÃO GERAL ───────────────────────────────────────
async function carregarOverview() {
  const [sr, cr, ar] = await Promise.all([
    AdminAPI.stats(), AdminAPI.getClientes(), AdminAPI.getAfiliados()
  ]);

  if (sr.sucesso) {
    const s = sr.stats;
    document.getElementById('statsRow').innerHTML = `
      <div class="stat-card"><div class="stat-ic ic-b"><i class="fas fa-users"></i></div><div><div class="stat-lbl">Clientes</div><div class="stat-val">${s.clientes}</div></div></div>
      <div class="stat-card"><div class="stat-ic ic-g"><i class="fas fa-building"></i></div><div><div class="stat-lbl">Empresas</div><div class="stat-val">${s.afiliados}</div></div></div>
      <div class="stat-card"><div class="stat-ic ic-o"><i class="fas fa-dumpster"></i></div><div><div class="stat-lbl">Caçambas</div><div class="stat-val">${s.cacambas}</div></div></div>
      <div class="stat-card"><div class="stat-ic ic-p"><i class="fas fa-clipboard-list"></i></div><div><div class="stat-lbl">Pedidos</div><div class="stat-val">${s.pedidos}</div></div></div>
      <div class="stat-card"><div class="stat-ic ic-r"><i class="fas fa-dollar-sign"></i></div><div><div class="stat-lbl">Receita Total</div><div class="stat-val">R$ ${(s.receita||0).toLocaleString('pt-BR')}</div></div></div>
    `;
  }

  if (cr.sucesso) {
    const lista = [...cr.clientes].reverse().slice(0, 5);
    document.getElementById('ultClientes').innerHTML = lista.length
      ? lista.map(c => `<div class="mini-item">
          <div class="mini-av">${c.nome[0].toUpperCase()}</div>
          <div class="mini-info"><div class="n">${c.nome}</div><div class="s">${c.email}</div></div>
          <div class="mini-date">${formatData(c.criado_em)}</div>
        </div>`).join('')
      : '<p style="color:#bbb;font-size:13px;padding:10px 0;">Nenhum cliente.</p>';
  }

  if (ar.sucesso) {
    const lista = [...ar.afiliados].reverse().slice(0, 5);
    document.getElementById('ultAfiliados').innerHTML = lista.length
      ? lista.map(a => `<div class="mini-item">
          <div class="mini-av"><i class="fas fa-building" style="font-size:13px;"></i></div>
          <div class="mini-info"><div class="n">${a.empresa}</div><div class="s">${a.cidade||''}${a.estado?' - '+a.estado:''}</div></div>
          <div class="mini-date">${formatData(a.criado_em)}</div>
        </div>`).join('')
      : '<p style="color:#bbb;font-size:13px;padding:10px 0;">Nenhuma empresa.</p>';
  }
}

// ── CLIENTES ─────────────────────────────────────────
async function carregarClientes() {
  const r = await AdminAPI.getClientes();
  if (!r.sucesso) { toast(r.erro, true); return; }
  _clientes = r.clientes;
  document.getElementById('countClientes').textContent = r.total;
  renderClientes(_clientes);
}

function renderClientes(lista) {
  document.getElementById('tbClientes').innerHTML = lista.length
    ? lista.map(c => `<tr>
        <td><strong>${c.nome}</strong></td>
        <td>${c.email}</td>
        <td>${c.telefone || '—'}</td>
        <td>${c.cep || '—'}</td>
        <td><span class="badge ativo">${c.pedidos||0}</span></td>
        <td>${formatData(c.criado_em)}</td>
        <td><span class="badge ${c.ativo!==false?'ativo':'inativo'}">${c.ativo!==false?'Ativo':'Inativo'}</span></td>
        <td><div class="actions">
          <button class="btn-ed" onclick="abrirEdicao('cliente','${c.id}')"><i class="fas fa-edit"></i> Editar</button>
          <button class="btn-del" onclick="confirmarDel('cliente','${c.id}','${c.nome}')"><i class="fas fa-trash"></i></button>
        </div></td>
      </tr>`).join('')
    : '<tr><td colspan="8" style="text-align:center;color:#bbb;padding:28px;">Nenhum cliente encontrado.</td></tr>';
}

function filtrarClientes() {
  const q = document.getElementById('searchClientes').value.toLowerCase();
  renderClientes(_clientes.filter(c =>
    c.nome.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  ));
}

// ── AFILIADOS ────────────────────────────────────────
async function carregarAfiliados() {
  const r = await AdminAPI.getAfiliados();
  if (!r.sucesso) { toast(r.erro, true); return; }
  _afiliados = r.afiliados;
  document.getElementById('countAfiliados').textContent = r.total;
  renderAfiliados(_afiliados);
}

function renderAfiliados(lista) {
  document.getElementById('tbAfiliados').innerHTML = lista.length
    ? lista.map(a => `<tr>
        <td><strong>${a.empresa}</strong></td>
        <td style="font-size:12px;">${a.cnpj || '—'}</td>
        <td>${a.email}</td>
        <td>${a.cidade||''}${a.estado?' - '+a.estado:''}</td>
        <td>${a.cacambas||0}</td>
        <td>${a.pedidos||0}</td>
        <td>${formatData(a.criado_em)}</td>
        <td><span class="badge ${a.ativo!==false?'ativo':'inativo'}">${a.ativo!==false?'Ativo':'Inativo'}</span></td>
        <td><div class="actions">
          <button class="btn-ed" onclick="abrirEdicao('afiliado','${a.id}')"><i class="fas fa-edit"></i> Editar</button>
          <button class="btn-del" onclick="confirmarDel('afiliado','${a.id}','${a.empresa}')"><i class="fas fa-trash"></i></button>
        </div></td>
      </tr>`).join('')
    : '<tr><td colspan="9" style="text-align:center;color:#bbb;padding:28px;">Nenhuma empresa encontrada.</td></tr>';
}

function filtrarAfiliados() {
  const q = document.getElementById('searchAfiliados').value.toLowerCase();
  renderAfiliados(_afiliados.filter(a =>
    a.empresa.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
  ));
}

// ── PEDIDOS ──────────────────────────────────────────
async function carregarPedidos() {
  const r = await AdminAPI.getPedidos();
  if (!r.sucesso) { toast(r.erro, true); return; }
  _pedidos = r.pedidos;
  document.getElementById('countPedidos').textContent = r.total;
  renderPedidos(_pedidos);
}

function renderPedidos(lista) {
  document.getElementById('tbPedidos').innerHTML = lista.length
    ? lista.map(p => `<tr>
        <td style="font-family:monospace;font-size:11px;">#${(p.id||'').slice(-6).toUpperCase()}</td>
        <td>${p.nomeCliente||p.clienteId}</td>
        <td>${p.nomeAfiliado||p.afiliadoId}</td>
        <td style="font-size:12px;">${p.nomeCacamba||p.cacambaId}</td>
        <td>${p.data||'—'}</td>
        <td><strong>R$ ${(p.valor||0).toLocaleString('pt-BR')}</strong></td>
        <td><span class="badge ${p.status||''}">${p.status||'—'}</span></td>
      </tr>`).join('')
    : '<tr><td colspan="7" style="text-align:center;color:#bbb;padding:28px;">Nenhum pedido.</td></tr>';
}

function filtrarPedidos() {
  const q  = document.getElementById('searchPedidos').value.toLowerCase();
  const st = document.getElementById('filtroStatusPedido').value;
  renderPedidos(_pedidos.filter(p => {
    const textOk = !q || (p.nomeCliente||'').toLowerCase().includes(q) || (p.nomeAfiliado||'').toLowerCase().includes(q);
    const stOk   = !st || p.status === st;
    return textOk && stOk;
  }));
}

// ── DB VIEWER ────────────────────────────────────────
let _dbData = {};
function carregarDb(aba) {
  const dados = AdminAPI.raw(aba);
  _dbData[aba] = dados;
  document.getElementById('dbViewer').textContent = JSON.stringify(dados, null, 2);
  document.getElementById('dbTabTitle').textContent = `${dados.length} registro(s) — ${aba}`;
}

function setDbTab(aba, btn) {
  document.querySelectorAll('.db-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  carregarDb(aba);
}

// ── MODAL EDIÇÃO ─────────────────────────────────────
async function abrirEdicao(tipo, id) {
  const r = tipo === 'cliente'
    ? await AdminAPI.getCliente(id)
    : await AdminAPI.getAfiliado(id);

  if (!r.sucesso) { toast(r.erro, true); return; }

  const d = r.cliente || r.afiliado;
  document.getElementById('editId').value   = id;
  document.getElementById('editTipo').value = tipo;

  if (tipo === 'cliente') {
    document.getElementById('modalTitulo').textContent = `Editar Cliente — ${d.nome}`;
    document.getElementById('modalBody').innerHTML = `
      <div class="row2">
        <div class="mfield"><label>Nome *</label><input id="eNome" value="${d.nome||''}"></div>
        <div class="mfield"><label>E-mail *</label><input id="eEmail" type="email" value="${d.email||''}"></div>
      </div>
      <div class="row2">
        <div class="mfield"><label>Telefone</label><input id="eTel" value="${d.telefone||''}"></div>
        <div class="mfield"><label>CEP</label><input id="eCep" value="${d.cep||''}"></div>
      </div>
      <div class="mfield"><label>Endereço</label><input id="eEnd" value="${d.endereco||''}"></div>
      <div class="mfield"><label>Nova Senha <span style="color:#999;font-weight:400;">(deixe vazio para manter)</span></label>
        <input id="eSenha" type="password" placeholder="••••••••">
        <div class="hint-senha">Mínimo 6 caracteres</div>
      </div>
      <div class="mfield"><label>Status</label>
        <select id="eAtivo">
          <option value="true"  ${d.ativo!==false?'selected':''}>Ativo</option>
          <option value="false" ${d.ativo===false?'selected':''}>Inativo</option>
        </select>
      </div>`;
  } else {
    document.getElementById('modalTitulo').textContent = `Editar Empresa — ${d.empresa}`;
    document.getElementById('modalBody').innerHTML = `
      <div class="row2">
        <div class="mfield"><label>Empresa *</label><input id="eEmpresa" value="${d.empresa||''}"></div>
        <div class="mfield"><label>CNPJ</label><input id="eCnpj" value="${d.cnpj||''}"></div>
      </div>
      <div class="row2">
        <div class="mfield"><label>E-mail *</label><input id="eEmail" type="email" value="${d.email||''}"></div>
        <div class="mfield"><label>Telefone</label><input id="eTel" value="${d.telefone||''}"></div>
      </div>
      <div class="row2">
        <div class="mfield"><label>Cidade</label><input id="eCidade" value="${d.cidade||''}"></div>
        <div class="mfield"><label>Estado</label><input id="eEstado" value="${d.estado||''}" maxlength="2"></div>
      </div>
      <div class="mfield"><label>Nova Senha <span style="color:#999;font-weight:400;">(deixe vazio para manter)</span></label>
        <input id="eSenha" type="password" placeholder="••••••••">
        <div class="hint-senha">Mínimo 6 caracteres</div>
      </div>
      <div class="mfield"><label>Status</label>
        <select id="eAtivo">
          <option value="true"  ${d.ativo!==false?'selected':''}>Ativo</option>
          <option value="false" ${d.ativo===false?'selected':''}>Inativo</option>
        </select>
      </div>`;
  }

  document.getElementById('modalSuccess').style.display = 'none';
  document.getElementById('modalEdit').classList.add('open');
}

async function salvar() {
  const id   = document.getElementById('editId').value;
  const tipo = document.getElementById('editTipo').value;
  const senha = document.getElementById('eSenha')?.value;

  let dados = {};
  if (tipo === 'cliente') {
    dados = {
      nome:     document.getElementById('eNome').value.trim(),
      email:    document.getElementById('eEmail').value.trim(),
      telefone: document.getElementById('eTel').value.trim(),
      cep:      document.getElementById('eCep').value.trim(),
      endereco: document.getElementById('eEnd').value.trim(),
      ativo:    document.getElementById('eAtivo').value === 'true'
    };
  } else {
    dados = {
      empresa:  document.getElementById('eEmpresa').value.trim(),
      cnpj:     document.getElementById('eCnpj').value.trim(),
      email:    document.getElementById('eEmail').value.trim(),
      telefone: document.getElementById('eTel').value.trim(),
      cidade:   document.getElementById('eCidade').value.trim(),
      estado:   document.getElementById('eEstado').value.trim().toUpperCase(),
      ativo:    document.getElementById('eAtivo').value === 'true'
    };
  }
  if (senha && senha.length >= 6) dados.senha = senha;
  if (senha && senha.length > 0 && senha.length < 6) { toast('Senha deve ter pelo menos 6 caracteres.', true); return; }

  const r = tipo === 'cliente'
    ? await AdminAPI.updateCliente(id, dados)
    : await AdminAPI.updateAfiliado(id, dados);

  if (r.sucesso) {
    const ms = document.getElementById('modalSuccess');
    ms.textContent = `✅ ${tipo === 'cliente' ? 'Cliente' : 'Empresa'} atualizado com sucesso!`;
    ms.style.display = 'block';
    toast(`✅ ${tipo === 'cliente' ? 'Cliente' : 'Empresa'} atualizado!`);
    setTimeout(() => { fecharModal(); if (tipo === 'cliente') carregarClientes(); else carregarAfiliados(); }, 1200);
  } else {
    toast(r.erro || 'Erro ao salvar.', true);
  }
}

function fecharModal() { document.getElementById('modalEdit').classList.remove('open'); }
document.getElementById('modalEdit').addEventListener('click', e => { if (e.target === document.getElementById('modalEdit')) fecharModal(); });

// ── MODAL DELETE ─────────────────────────────────────
let _delId = null, _delTipo = null;

function confirmarDel(tipo, id, nome) {
  _delId   = id;
  _delTipo = tipo;
  document.getElementById('delTitulo').textContent = `Excluir ${tipo === 'cliente' ? 'cliente' : 'empresa'}?`;
  document.getElementById('delMsg').textContent    = `"${nome}" será removido permanentemente do banco de dados. Esta ação não pode ser desfeita.`;
  document.getElementById('btnConfDel').onclick    = executarDel;
  document.getElementById('modalDel').classList.add('open');
}

async function executarDel() {
  const r = _delTipo === 'cliente'
    ? await AdminAPI.deleteCliente(_delId)
    : await AdminAPI.deleteAfiliado(_delId);

  fecharDel();
  if (r.sucesso) {
    toast(`🗑 ${_delTipo === 'cliente' ? 'Cliente' : 'Empresa'} excluído do banco de dados.`);
    if (_delTipo === 'cliente') carregarClientes(); else carregarAfiliados();
  } else {
    toast(r.erro || 'Erro ao excluir.', true);
  }
}

function fecharDel() { document.getElementById('modalDel').classList.remove('open'); }
document.getElementById('modalDel').addEventListener('click', e => { if (e.target === document.getElementById('modalDel')) fecharDel(); });

// ── Util ─────────────────────────────────────────────
function formatData(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

// ── Init ─────────────────────────────────────────────
carregarOverview();
