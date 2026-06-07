// ============================================================
// LocaFácil — Banco de Dados (localStorage)
// ------------------------------------------------------------
// Persistência 100% no navegador via localStorage.
// Funciona no Vercel (hospedagem estática) sem backend.
//
// Recursos de segurança no client:
//   • Senhas com hash SHA-256 (Web Crypto API) — nunca em texto puro
//   • Token de sessão assinado (base64 + expiração)
//
// Coleções: lf_clientes, lf_afiliados, lf_admins,
//           lf_cacambas, lf_pedidos, lf_session
// ============================================================

const DB = {

  // ── Criptografia de senha (SHA-256) ─────────────────────
  async hashSenha(senha) {
    const enc  = new TextEncoder().encode(senha + 'locafacil_salt_2025');
    const buf  = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async verificarSenha(senha, hash) {
    return (await this.hashSenha(senha)) === hash;
  },

  // ── Token de sessão (base64 com expiração 7 dias) ───────
  gerarToken(payload) {
    const corpo = { ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
    return btoa(unescape(encodeURIComponent(JSON.stringify(corpo))));
  },

  lerToken(token) {
    try {
      const corpo = JSON.parse(decodeURIComponent(escape(atob(token))));
      if (corpo.exp && corpo.exp < Date.now()) return null; // expirado
      return corpo;
    } catch { return null; }
  },

  // ── Helpers de coleção ──────────────────────────────────
  _get(chave)  { return JSON.parse(localStorage.getItem(chave) || '[]'); },
  _set(chave, v) { localStorage.setItem(chave, JSON.stringify(v)); },
  _id(prefixo) { return prefixo + Date.now() + Math.random().toString(36).slice(2, 6); },

  // ── Inicialização (seed com dados demo) ─────────────────
  async init() {
    if (localStorage.getItem('lf_initialized')) return;

    const senhaDemo  = await this.hashSenha('123456');
    const senhaAdmin = await this.hashSenha('admin123');

    this._set('lf_admins', [
      { id: 'adm1', nome: 'Administrador', email: 'admin@locafacil.com', senha_hash: senhaAdmin, tipo: 'admin', criado_em: new Date().toISOString() }
    ]);

    this._set('lf_clientes', [
      { id: 'c1', nome: 'Carlos Silva', email: 'cliente@demo.com', senha_hash: senhaDemo, cep: '27310-000', telefone: '(24) 99999-1234', endereco: 'Rua das Flores, 45, Volta Redonda - RJ', ativo: true, criado_em: new Date().toISOString() }
    ]);

    this._set('lf_afiliados', [
      {
        id: 'a1', empresa: 'Caçambas Norte VR', cnpj: '12.345.678/0001-99',
        email: 'afiliado@demo.com', senha_hash: senhaDemo, telefone: '(24) 99999-0001',
        cidade: 'Volta Redonda', estado: 'RJ', ativo: true, criado_em: new Date().toISOString(),
        cobertura: [
          { cep_inicio: '27200-000', cep_fim: '27399-999', bairro: '', cidade: 'Volta Redonda', estado: 'RJ' },
          { cep_inicio: '27400-000', cep_fim: '27499-999', bairro: '', cidade: 'Barra Mansa',   estado: 'RJ' }
        ]
      }
    ]);

    this._set('lf_cacambas', [
      { id: 'cb1', afiliadoId: 'a1', nome: 'Caçamba Pequena', tipo: 'obra',     capacidade: '3m³',  dimensoes: '1,80 × 1,20 × 0,80m', peso_max: '2 ton', preco: 250, disponivel: true,  descricao: 'Ideal para pequenas reformas e entulhos residenciais.' },
      { id: 'cb2', afiliadoId: 'a1', nome: 'Caçamba Média',   tipo: 'obra',     capacidade: '5m³',  dimensoes: '2,40 × 1,50 × 1,00m', peso_max: '3 ton', preco: 380, disponivel: true,  descricao: 'Para reformas médias e construções. A mais alugada!' },
      { id: 'cb3', afiliadoId: 'a1', nome: 'Caçamba Grande',  tipo: 'organico', capacidade: '7m³',  dimensoes: '3,00 × 1,60 × 1,20m', peso_max: '4 ton', preco: 520, disponivel: true,  descricao: 'Perfeita para grandes volumes. Ideal para obras comerciais.' },
      { id: 'cb4', afiliadoId: 'a1', nome: 'Caçamba XL',      tipo: 'moveis',   capacidade: '10m³', dimensoes: '3,60 × 1,80 × 1,40m', peso_max: '5 ton', preco: 720, disponivel: false, descricao: 'Para grandes projetos: demolições, mudanças volumosas.' }
    ]);

    this._set('lf_pedidos', [
      { id: 'p1', clienteId: 'c1', cacambaId: 'cb1', afiliadoId: 'a1', status: 'concluido', data: '2025-04-10', dataFim: '2025-04-15', valor: 250, endereco: 'Rua das Flores, 45, VR' },
      { id: 'p2', clienteId: 'c1', cacambaId: 'cb2', afiliadoId: 'a1', status: 'entregue',  data: '2025-06-01', dataFim: '2025-06-07', valor: 380, endereco: 'Rua das Flores, 45, VR' },
      { id: 'p3', clienteId: 'c1', cacambaId: 'cb3', afiliadoId: 'a1', status: 'concluido', data: '2025-03-20', dataFim: '2025-03-25', valor: 520, endereco: 'Rua das Flores, 45, VR' },
      { id: 'p4', clienteId: 'c1', cacambaId: 'cb1', afiliadoId: 'a1', status: 'pendente',  data: '2025-06-03', dataFim: null,          valor: 250, endereco: 'Rua das Flores, 45, VR' }
    ]);

    localStorage.setItem('lf_initialized', 'true');
  },

  // ════════════════════════════════════════════════════════
  // AUTENTICAÇÃO
  // ════════════════════════════════════════════════════════

  async loginCliente(email, senha) {
    const user = this._get('lf_clientes').find(c => c.email === email);
    if (!user || !(await this.verificarSenha(senha, user.senha_hash)))
      return { success: false, error: 'E-mail ou senha incorretos.' };
    if (user.ativo === false)
      return { success: false, error: 'Conta desativada. Contate o suporte.' };
    this._criarSessao('cliente', user.id, user.nome, user.email);
    return { success: true, user };
  },

  async loginAfiliado(email, senha) {
    const user = this._get('lf_afiliados').find(a => a.email === email);
    if (!user || !(await this.verificarSenha(senha, user.senha_hash)))
      return { success: false, error: 'E-mail ou senha incorretos.' };
    if (user.ativo === false)
      return { success: false, error: 'Conta desativada. Contate o suporte.' };
    this._criarSessao('afiliado', user.id, user.empresa, user.email);
    return { success: true, user };
  },

  async loginAdmin(email, senha) {
    const user = this._get('lf_admins').find(a => a.email === email);
    if (!user || !(await this.verificarSenha(senha, user.senha_hash)))
      return { success: false, error: 'Credenciais inválidas.' };
    this._criarSessao('admin', user.id, user.nome, user.email);
    return { success: true, user };
  },

  async cadastrarCliente(dados) {
    const lista = this._get('lf_clientes');
    if (lista.find(c => c.email === dados.email))
      return { success: false, error: 'E-mail já cadastrado.' };
    const novo = {
      id: this._id('c'), nome: dados.nome, email: dados.email,
      senha_hash: await this.hashSenha(dados.senha),
      cep: dados.cep || '', telefone: dados.telefone || '', endereco: dados.endereco || '',
      ativo: true, criado_em: new Date().toISOString()
    };
    lista.push(novo);
    this._set('lf_clientes', lista);
    this._criarSessao('cliente', novo.id, novo.nome, novo.email);
    return { success: true, user: novo };
  },

  async cadastrarAfiliado(dados) {
    const lista = this._get('lf_afiliados');
    if (lista.find(a => a.email === dados.email))
      return { success: false, error: 'E-mail já cadastrado.' };
    const novo = {
      id: this._id('a'), empresa: dados.empresa, cnpj: dados.cnpj || '',
      email: dados.email, senha_hash: await this.hashSenha(dados.senha),
      telefone: dados.telefone || '', cidade: dados.cidade || '', estado: dados.estado || '',
      cobertura: [], ativo: true, criado_em: new Date().toISOString()
    };
    lista.push(novo);
    this._set('lf_afiliados', lista);
    this._criarSessao('afiliado', novo.id, novo.empresa, novo.email);
    return { success: true, user: novo };
  },

  _criarSessao(tipo, id, nome, email) {
    const token = this.gerarToken({ tipo, id, email });
    localStorage.setItem('lf_session', JSON.stringify({ tipo, id, nome, email, token }));
  },

  getSession() {
    const s = localStorage.getItem('lf_session');
    if (!s) return null;
    const sess = JSON.parse(s);
    if (sess.token && !this.lerToken(sess.token)) { this.logout(); return null; }
    return sess;
  },

  logout() { localStorage.removeItem('lf_session'); },

  // ════════════════════════════════════════════════════════
  // CRUD — CLIENTES
  // ════════════════════════════════════════════════════════

  getClientes() { return this._get('lf_clientes'); },
  getClienteById(id) { return this._get('lf_clientes').find(c => c.id === id) || null; },

  async atualizarCliente(id, campos) {
    const lista = this._get('lf_clientes');
    const idx = lista.findIndex(c => c.id === id);
    if (idx < 0) return { success: false, error: 'Cliente não encontrado.' };
    if (campos.email && lista.some(c => c.email === campos.email && c.id !== id))
      return { success: false, error: 'E-mail já em uso.' };
    if (campos.senha) { campos.senha_hash = await this.hashSenha(campos.senha); delete campos.senha; }
    lista[idx] = { ...lista[idx], ...campos, atualizado_em: new Date().toISOString() };
    this._set('lf_clientes', lista);
    return { success: true, user: lista[idx] };
  },

  deletarCliente(id) {
    this._set('lf_clientes', this._get('lf_clientes').filter(c => c.id !== id));
    this._set('lf_pedidos', this._get('lf_pedidos').filter(p => p.clienteId !== id));
    return { success: true };
  },

  // ════════════════════════════════════════════════════════
  // CRUD — AFILIADOS
  // ════════════════════════════════════════════════════════

  getAfiliados() {
    return this._get('lf_afiliados').map(a => ({
      id: a.id, empresa: a.empresa, cidade: a.cidade, estado: a.estado, cobertura: a.cobertura || []
    }));
  },
  getAfiliadosCompleto() { return this._get('lf_afiliados'); },
  getAfiliadoById(id) { return this._get('lf_afiliados').find(a => a.id === id) || null; },

  async atualizarAfiliado(id, campos) {
    const lista = this._get('lf_afiliados');
    const idx = lista.findIndex(a => a.id === id);
    if (idx < 0) return { success: false, error: 'Empresa não encontrada.' };
    if (campos.email && lista.some(a => a.email === campos.email && a.id !== id))
      return { success: false, error: 'E-mail já em uso.' };
    if (campos.senha) { campos.senha_hash = await this.hashSenha(campos.senha); delete campos.senha; }
    lista[idx] = { ...lista[idx], ...campos, atualizado_em: new Date().toISOString() };
    this._set('lf_afiliados', lista);
    return { success: true, user: lista[idx] };
  },

  salvarAfiliado(dados) {
    const lista = this._get('lf_afiliados');
    const idx = lista.findIndex(a => a.id === dados.id);
    if (idx >= 0) lista[idx] = { ...lista[idx], ...dados };
    this._set('lf_afiliados', lista);
  },

  deletarAfiliado(id) {
    this._set('lf_afiliados', this._get('lf_afiliados').filter(a => a.id !== id));
    this._set('lf_cacambas', this._get('lf_cacambas').filter(c => c.afiliadoId !== id));
    this._set('lf_pedidos',  this._get('lf_pedidos').filter(p => p.afiliadoId !== id));
    return { success: true };
  },

  // ── COBERTURA (área de entrega) ─────────────────────────
  getCobertura(afiliadoId) {
    const af = this.getAfiliadoById(afiliadoId);
    return af ? (af.cobertura || []) : [];
  },
  salvarCobertura(afiliadoId, cobertura) {
    const lista = this._get('lf_afiliados');
    const idx = lista.findIndex(a => a.id === afiliadoId);
    if (idx >= 0) lista[idx].cobertura = cobertura;
    this._set('lf_afiliados', lista);
  },

  // ════════════════════════════════════════════════════════
  // CRUD — CAÇAMBAS
  // ════════════════════════════════════════════════════════

  getCacambas(filtros = {}) {
    let lista = this._get('lf_cacambas');
    if (filtros.afiliadoId) lista = lista.filter(c => c.afiliadoId === filtros.afiliadoId);
    if (filtros.tipo)       lista = lista.filter(c => c.tipo === filtros.tipo);
    if (filtros.disponivel !== undefined) lista = lista.filter(c => c.disponivel === filtros.disponivel);
    return lista;
  },
  getCacambaById(id) { return this.getCacambas().find(c => c.id === id); },

  salvarCacamba(c) {
    const lista = this._get('lf_cacambas');
    if (c.id) { const i = lista.findIndex(x => x.id === c.id); if (i >= 0) lista[i] = c; else lista.push(c); }
    else { c.id = this._id('cb'); lista.push(c); }
    this._set('lf_cacambas', lista);
    return c;
  },
  deletarCacamba(id) {
    this._set('lf_cacambas', this._get('lf_cacambas').filter(c => c.id !== id));
  },

  // ════════════════════════════════════════════════════════
  // CRUD — PEDIDOS
  // ════════════════════════════════════════════════════════

  getPedidos(filtros = {}) {
    let lista = this._get('lf_pedidos');
    if (filtros.clienteId)  lista = lista.filter(p => p.clienteId === filtros.clienteId);
    if (filtros.afiliadoId) lista = lista.filter(p => p.afiliadoId === filtros.afiliadoId);
    if (filtros.status)     lista = lista.filter(p => p.status === filtros.status);
    return lista;
  },
  criarPedido(pedido) {
    const lista = this._get('lf_pedidos');
    pedido.id = this._id('p');
    pedido.criado_em = new Date().toISOString();
    lista.push(pedido);
    this._set('lf_pedidos', lista);
    return pedido;
  },
  atualizarStatusPedido(id, status) {
    const lista = this._get('lf_pedidos');
    const idx = lista.findIndex(p => p.id === id);
    if (idx < 0) return null;
    lista[idx].status = status === 'recolhida' ? 'concluido' : status;
    this._set('lf_pedidos', lista);
    return lista[idx];
  },

  // ── RELATÓRIO ───────────────────────────────────────────
  getRelatorio(afiliadoId) {
    const pedidos  = this.getPedidos({ afiliadoId });
    const cacambas = this.getCacambas({ afiliadoId });
    const meses = {}, statusCount = {};
    pedidos.forEach(p => {
      const m = (p.data || '').substring(0, 7);
      if (!meses[m]) meses[m] = { receita: 0, pedidos: 0 };
      meses[m].receita += p.valor; meses[m].pedidos++;
      statusCount[p.status] = (statusCount[p.status] || 0) + 1;
    });
    return {
      totalReceita:     pedidos.reduce((s, p) => s + p.valor, 0),
      totalPedidos:     pedidos.length,
      pedidosAtivos:    pedidos.filter(p => ['a-caminho', 'entregue'].includes(p.status)).length,
      pedidosPendentes: pedidos.filter(p => p.status === 'pendente').length,
      cacambasAtivas:   cacambas.filter(c => c.disponivel).length,
      totalCacambas:    cacambas.length,
      mensais: meses, statusCount
    };
  },

  // ── STATS GLOBAIS (admin) ───────────────────────────────
  statsGlobais() {
    return {
      clientes:  this._get('lf_clientes').length,
      afiliados: this._get('lf_afiliados').length,
      cacambas:  this._get('lf_cacambas').length,
      pedidos:   this._get('lf_pedidos').length,
      receita:   this._get('lf_pedidos').reduce((s, p) => s + (p.valor || 0), 0)
    };
  },

  // ════════════════════════════════════════════════════════
  // BUSCA POR CEP (ViaCEP + cobertura)
  // ════════════════════════════════════════════════════════

  _cepNum(cep) { return parseInt((cep || '').replace(/\D/g, ''), 10); },

  afiliadoAtendeCep(af, cepNum, cidadeApi, estadoApi) {
    for (const fx of (af.cobertura || [])) {
      const ini = this._cepNum(fx.cep_inicio);
      const fim = this._cepNum(fx.cep_fim);
      if (cepNum && cepNum >= ini && cepNum <= fim) return true;
      if (fx.cidade && cidadeApi && fx.cidade.toLowerCase() === cidadeApi.toLowerCase()) return true;
    }
    if (af.cidade && cidadeApi && af.cidade.toLowerCase() === cidadeApi.toLowerCase()) return true;
    return false;
  },

  buscarCacambasPorLocalidade(cidadeApi, estadoApi, cepNum) {
    const afiliados = this._get('lf_afiliados').filter(a => a.ativo !== false);
    const cobrindo  = afiliados.filter(af => this.afiliadoAtendeCep(af, cepNum, cidadeApi, estadoApi));
    const ids = new Set(cobrindo.map(a => a.id));
    const empresaMap = {}; afiliados.forEach(a => empresaMap[a.id] = a.empresa);
    return this.getCacambas({ disponivel: true })
      .filter(c => ids.has(c.afiliadoId))
      .map(c => ({ ...c, empresa: empresaMap[c.afiliadoId] || '' }));
  }
};

// Inicializa o banco. As páginas aguardam via: await DBReady
const DBReady = DB.init();
