// admin-api.js — Camada de dados do admin sobre localStorage (DB)
// Mantém a mesma interface { sucesso, ... } usada pelo dashboard.
// lib/db.js é carregado antes deste arquivo.

const AdminAPI = {

  getSession() {
    const s = DB.getSession();
    return s && s.tipo === 'admin' ? s : null;
  },

  logout() {
    DB.logout();
    location.href = 'login.html';
  },

  async login(email, senha) {
    await DBReady;
    const r = await DB.loginAdmin(email, senha);
    return r.success
      ? { sucesso: true }
      : { sucesso: false, erro: r.error };
  },

  // ── Stats ──────────────────────────────────────────
  stats() {
    return { sucesso: true, stats: DB.statsGlobais() };
  },

  // ── Clientes ───────────────────────────────────────
  getClientes() {
    const clientes = DB.getClientes().map(c => ({
      ...c,
      pedidos: DB.getPedidos({ clienteId: c.id }).length
    }));
    return { sucesso: true, total: clientes.length, clientes };
  },

  getCliente(id) {
    const c = DB.getClienteById(id);
    if (!c) return { sucesso: false, erro: 'Cliente não encontrado.' };
    return { sucesso: true, cliente: c };
  },

  async updateCliente(id, dados) {
    const r = await DB.atualizarCliente(id, dados);
    return r.success ? { sucesso: true } : { sucesso: false, erro: r.error };
  },

  deleteCliente(id) {
    DB.deletarCliente(id);
    return { sucesso: true };
  },

  // ── Afiliados ──────────────────────────────────────
  getAfiliados() {
    const afiliados = DB.getAfiliadosCompleto().map(a => ({
      ...a,
      cacambas: DB.getCacambas({ afiliadoId: a.id }).length,
      pedidos:  DB.getPedidos({ afiliadoId: a.id }).length
    }));
    return { sucesso: true, total: afiliados.length, afiliados };
  },

  getAfiliado(id) {
    const a = DB.getAfiliadoById(id);
    if (!a) return { sucesso: false, erro: 'Empresa não encontrada.' };
    return { sucesso: true, afiliado: a };
  },

  async updateAfiliado(id, dados) {
    const r = await DB.atualizarAfiliado(id, dados);
    return r.success ? { sucesso: true } : { sucesso: false, erro: r.error };
  },

  deleteAfiliado(id) {
    DB.deletarAfiliado(id);
    return { sucesso: true };
  },

  // ── Pedidos ────────────────────────────────────────
  getPedidos() {
    const cliMap = {}; DB.getClientes().forEach(c => cliMap[c.id] = c.nome);
    const afMap  = {}; DB.getAfiliadosCompleto().forEach(a => afMap[a.id] = a.empresa);
    const cMap   = {}; DB.getCacambas().forEach(c => cMap[c.id] = c.nome);
    const pedidos = DB.getPedidos().map(p => ({
      ...p,
      nomeCliente:  cliMap[p.clienteId]  || p.clienteId,
      nomeAfiliado: afMap[p.afiliadoId]  || p.afiliadoId,
      nomeCacamba:  cMap[p.cacambaId]    || p.cacambaId
    }));
    return { sucesso: true, total: pedidos.length, pedidos };
  },

  // ── Visualizador de banco (raw) ────────────────────
  // aba: 'clientes' | 'afiliados' | 'pedidos' | 'cacambas'
  raw(aba) {
    const mapa = {
      clientes:  DB.getClientes(),
      afiliados: DB.getAfiliadosCompleto(),
      pedidos:   DB.getPedidos(),
      cacambas:  DB.getCacambas()
    };
    return mapa[aba] || [];
  },

  // Exportar todo o banco como JSON (download)
  exportar() {
    const dump = {
      clientes:  DB.getClientes(),
      afiliados: DB.getAfiliadosCompleto(),
      cacambas:  DB.getCacambas(),
      pedidos:   DB.getPedidos()
    };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'locafacil-db.json';
    a.click();
    URL.revokeObjectURL(url);
  }
};
