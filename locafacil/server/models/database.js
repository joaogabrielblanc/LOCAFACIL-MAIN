// server/models/database.js
// ─────────────────────────────────────────────────────
// Modelo de dados EM MEMÓRIA para o backend de demonstração.
//
// Arquitetura:
//   • O SITE em produção (Vercel) usa localStorage no navegador
//     (lib/db.js) — não depende deste backend.
//   • Este backend Node/Express cumpre o requisito acadêmico DBEI
//     (Node, Express, API RESTful, JWT, bcrypt, CRUD). Roda local
//     com `npm start` e demonstra a mesma lógica no servidor.
//   • Dados em memória, re-semeados a cada reinício.
// ─────────────────────────────────────────────────────

const bcrypt = require('bcryptjs');

const _data = {
  admins: [
    { id:'adm1', nome:'Administrador', email:'admin@locafacil.com',
      senha_hash: bcrypt.hashSync('admin123', 10), tipo:'admin', criado_em:new Date().toISOString() }
  ],
  clientes: [
    { id:'c1', nome:'Carlos Silva', email:'cliente@demo.com',
      senha_hash: bcrypt.hashSync('123456', 10), cep:'27310-000',
      telefone:'(24) 99999-1234', endereco:'Rua das Flores, 45, Volta Redonda - RJ',
      ativo:true, criado_em:new Date().toISOString() }
  ],
  afiliados: [
    { id:'a1', empresa:'Caçambas Norte VR', cnpj:'12.345.678/0001-99',
      email:'afiliado@demo.com', senha_hash: bcrypt.hashSync('123456', 10),
      telefone:'(24) 99999-0001', cidade:'Volta Redonda', estado:'RJ',
      ativo:true, criado_em:new Date().toISOString(),
      cobertura:[
        { cep_inicio:'27200-000', cep_fim:'27399-999', bairro:'', cidade:'Volta Redonda', estado:'RJ' },
        { cep_inicio:'27400-000', cep_fim:'27499-999', bairro:'', cidade:'Barra Mansa',   estado:'RJ' }
      ] }
  ],
  cacambas: [
    { id:'cb1', afiliadoId:'a1', nome:'Caçamba Pequena', tipo:'obra',     capacidade:'3m³',  dimensoes:'1,80 × 1,20 × 0,80m', peso_max:'2 ton', preco:250, disponivel:true,  descricao:'Ideal para pequenas reformas.' },
    { id:'cb2', afiliadoId:'a1', nome:'Caçamba Média',   tipo:'obra',     capacidade:'5m³',  dimensoes:'2,40 × 1,50 × 1,00m', peso_max:'3 ton', preco:380, disponivel:true,  descricao:'Para reformas médias. A mais alugada!' },
    { id:'cb3', afiliadoId:'a1', nome:'Caçamba Grande',  tipo:'organico', capacidade:'7m³',  dimensoes:'3,00 × 1,60 × 1,20m', peso_max:'4 ton', preco:520, disponivel:true,  descricao:'Para grandes volumes.' },
    { id:'cb4', afiliadoId:'a1', nome:'Caçamba XL',      tipo:'moveis',   capacidade:'10m³', dimensoes:'3,60 × 1,80 × 1,40m', peso_max:'5 ton', preco:720, disponivel:false, descricao:'Para grandes projetos.' }
  ],
  pedidos: [
    { id:'p1', clienteId:'c1', cacambaId:'cb1', afiliadoId:'a1', status:'concluido', data:'2025-04-10', dataFim:'2025-04-15', valor:250, endereco:'Rua das Flores, 45, VR' },
    { id:'p2', clienteId:'c1', cacambaId:'cb2', afiliadoId:'a1', status:'entregue',  data:'2025-06-01', dataFim:'2025-06-07', valor:380, endereco:'Rua das Flores, 45, VR' },
    { id:'p3', clienteId:'c1', cacambaId:'cb3', afiliadoId:'a1', status:'concluido', data:'2025-03-20', dataFim:'2025-03-25', valor:520, endereco:'Rua das Flores, 45, VR' },
    { id:'p4', clienteId:'c1', cacambaId:'cb1', afiliadoId:'a1', status:'pendente',  data:'2025-06-03', dataFim:null,          valor:250, endereco:'Rua das Flores, 45, VR' }
  ]
};

const gerarId = (p) => p + Date.now() + Math.random().toString(36).slice(2, 6);
const semSenha = ({ senha_hash, ...r }) => r;

console.log('[DB] Backend usando modelo em memoria (demonstracao DBEI)');

const Admins = {
  findByEmail: (e)  => _data.admins.find(a => a.email === e),
  findById:    (id) => _data.admins.find(a => a.id === id),
  findAll:     ()   => _data.admins.map(semSenha),
  verificarSenha: (u, s) => bcrypt.compareSync(s, u.senha_hash),
  create(d) {
    const n = { id: gerarId('adm'), nome:d.nome, email:d.email, senha_hash:bcrypt.hashSync(d.senha,10), tipo:'admin', criado_em:new Date().toISOString() };
    _data.admins.push(n); return semSenha(n);
  }
};

const Clientes = {
  findAll:     ()   => _data.clientes.map(semSenha),
  findById:    (id) => _data.clientes.find(c => c.id === id),
  findByEmail: (e)  => _data.clientes.find(c => c.email === e),
  count:       ()   => _data.clientes.length,
  verificarSenha: (u, s) => bcrypt.compareSync(s, u.senha_hash),
  create(d) {
    if (_data.clientes.find(c => c.email === d.email)) return null;
    const n = { id:gerarId('c'), nome:d.nome, email:d.email, senha_hash:bcrypt.hashSync(d.senha,10), cep:d.cep||'', telefone:d.telefone||'', endereco:d.endereco||'', ativo:true, criado_em:new Date().toISOString() };
    _data.clientes.push(n); return semSenha(n);
  },
  update(id, campos) {
    const i = _data.clientes.findIndex(c => c.id === id);
    if (i < 0) return null;
    if (campos.senha) { campos.senha_hash = bcrypt.hashSync(campos.senha,10); delete campos.senha; }
    _data.clientes[i] = { ..._data.clientes[i], ...campos, atualizado_em:new Date().toISOString() };
    return semSenha(_data.clientes[i]);
  },
  delete(id) {
    const before = _data.clientes.length;
    _data.clientes = _data.clientes.filter(c => c.id !== id);
    _data.pedidos  = _data.pedidos.filter(p => p.clienteId !== id);
    return _data.clientes.length < before;
  }
};

const Afiliados = {
  findAll:     ()   => _data.afiliados.map(semSenha),
  findById:    (id) => _data.afiliados.find(a => a.id === id),
  findByEmail: (e)  => _data.afiliados.find(a => a.email === e),
  count:       ()   => _data.afiliados.length,
  verificarSenha: (u, s) => bcrypt.compareSync(s, u.senha_hash),
  create(d) {
    if (_data.afiliados.find(a => a.email === d.email)) return null;
    const n = { id:gerarId('a'), empresa:d.empresa, cnpj:d.cnpj||'', email:d.email, senha_hash:bcrypt.hashSync(d.senha,10), telefone:d.telefone||'', cidade:d.cidade||'', estado:d.estado||'', cobertura:[], ativo:true, criado_em:new Date().toISOString() };
    _data.afiliados.push(n); return semSenha(n);
  },
  update(id, campos) {
    const i = _data.afiliados.findIndex(a => a.id === id);
    if (i < 0) return null;
    if (campos.senha) { campos.senha_hash = bcrypt.hashSync(campos.senha,10); delete campos.senha; }
    _data.afiliados[i] = { ..._data.afiliados[i], ...campos, atualizado_em:new Date().toISOString() };
    return semSenha(_data.afiliados[i]);
  },
  delete(id) {
    const before = _data.afiliados.length;
    _data.afiliados = _data.afiliados.filter(a => a.id !== id);
    _data.cacambas  = _data.cacambas.filter(c => c.afiliadoId !== id);
    _data.pedidos   = _data.pedidos.filter(p => p.afiliadoId !== id);
    return _data.afiliados.length < before;
  },
  getCobertura: (id) => { const a = _data.afiliados.find(x => x.id === id); return a ? (a.cobertura||[]) : []; },
  addCobertura(id, regiao) {
    const a = _data.afiliados.find(x => x.id === id); if (!a) return null;
    a.cobertura = [...(a.cobertura||[]), regiao]; return a.cobertura;
  },
  removeCobertura(id, idx) {
    const a = _data.afiliados.find(x => x.id === id); if (!a) return false;
    a.cobertura = (a.cobertura||[]).filter((_, i) => i !== idx); return true;
  }
};

const Cacambas = {
  findAll(f = {}) {
    let l = _data.cacambas;
    if (f.afiliadoId) l = l.filter(c => c.afiliadoId === f.afiliadoId);
    if (f.tipo)       l = l.filter(c => c.tipo === f.tipo);
    if (f.disponivel !== undefined) l = l.filter(c => c.disponivel === f.disponivel);
    return l;
  },
  findById: (id) => _data.cacambas.find(c => c.id === id),
  count:    ()   => _data.cacambas.length,
  create(d) {
    const n = { id: d.id || gerarId('cb'), ...d, criado_em:new Date().toISOString() };
    _data.cacambas.push(n); return n;
  },
  update(id, campos) {
    const i = _data.cacambas.findIndex(c => c.id === id);
    if (i < 0) return null;
    _data.cacambas[i] = { ..._data.cacambas[i], ...campos, atualizado_em:new Date().toISOString() };
    return _data.cacambas[i];
  },
  delete(id) {
    const before = _data.cacambas.length;
    _data.cacambas = _data.cacambas.filter(c => c.id !== id);
    return _data.cacambas.length < before;
  },
  buscarPorLocalidade(cidade, estado, cepNum) {
    const afs = _data.afiliados.filter(af => {
      for (const fx of (af.cobertura||[])) {
        const ini = parseInt((fx.cep_inicio||'').replace(/\D/g,''),10);
        const fim = parseInt((fx.cep_fim||'').replace(/\D/g,''),10);
        if (cepNum && cepNum >= ini && cepNum <= fim) return true;
        if (fx.cidade && cidade && fx.cidade.toLowerCase() === cidade.toLowerCase()) return true;
      }
      return af.cidade && cidade && af.cidade.toLowerCase() === cidade.toLowerCase();
    });
    const ids = new Set(afs.map(a => a.id));
    return _data.cacambas.filter(c => c.disponivel && ids.has(c.afiliadoId));
  }
};

const Pedidos = {
  findAll(f = {}) {
    let l = _data.pedidos;
    if (f.clienteId)  l = l.filter(p => p.clienteId === f.clienteId);
    if (f.afiliadoId) l = l.filter(p => p.afiliadoId === f.afiliadoId);
    if (f.status)     l = l.filter(p => p.status === f.status);
    return l;
  },
  findById: (id) => _data.pedidos.find(p => p.id === id),
  count:    ()   => _data.pedidos.length,
  create(d) {
    const n = { id:gerarId('p'), ...d, criado_em:new Date().toISOString() };
    _data.pedidos.push(n); return n;
  },
  update(id, campos) {
    const i = _data.pedidos.findIndex(p => p.id === id);
    if (i < 0) return null;
    _data.pedidos[i] = { ..._data.pedidos[i], ...campos, atualizado_em:new Date().toISOString() };
    return _data.pedidos[i];
  },
  relatorio(afiliadoId) {
    const pedidos  = this.findAll({ afiliadoId });
    const cacambas = Cacambas.findAll({ afiliadoId });
    const meses = {}, statusCount = {};
    pedidos.forEach(p => {
      const m = (p.data||'').substring(0,7);
      if (!meses[m]) meses[m] = { receita:0, pedidos:0 };
      meses[m].receita += p.valor; meses[m].pedidos++;
      statusCount[p.status] = (statusCount[p.status]||0) + 1;
    });
    return {
      totalReceita:     pedidos.reduce((s,p) => s+p.valor, 0),
      totalPedidos:     pedidos.length,
      pedidosAtivos:    pedidos.filter(p => ['a-caminho','entregue'].includes(p.status)).length,
      pedidosPendentes: pedidos.filter(p => p.status === 'pendente').length,
      cacambasAtivas:   cacambas.filter(c => c.disponivel).length,
      totalCacambas:    cacambas.length,
      mensais: meses, statusCount
    };
  }
};

function statsGlobais() {
  return {
    clientes:  _data.clientes.length,
    afiliados: _data.afiliados.length,
    cacambas:  _data.cacambas.length,
    pedidos:   _data.pedidos.length,
    receita:   _data.pedidos.reduce((s,p) => s + (p.valor||0), 0)
  };
}

module.exports = { _data, Admins, Clientes, Afiliados, Cacambas, Pedidos, statsGlobais };
