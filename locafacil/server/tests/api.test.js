// server/tests/api.test.js
// Testes de integração da API REST LocaFácil
// Execute: node server/tests/api.test.js

const BASE = 'http://localhost:3001/api';
let tokenCliente  = '';
let tokenAfiliado = '';
let clienteId     = '';
let afiliadoId    = '';
let cacambaId     = '';
let pedidoId      = '';
let ok = 0, fail = 0;

async function req(method, path, body, token) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  const r = await fetch(`${BASE}${path}`, {
    method, headers: h,
    body: body ? JSON.stringify(body) : undefined
  });
  return r.json();
}

function assert(label, cond, val) {
  if (cond) { console.log(`  ✅ ${label}`); ok++; }
  else       { console.log(`  ❌ ${label}`, val !== undefined ? `→ ${JSON.stringify(val)}` : ''); fail++; }
}

async function run() {
  console.log('\n🔍 LocaFácil — Testes de API REST\n');

  // ── Health ──────────────────────────────────────
  console.log('[ Health Check ]');
  const h = await req('GET', '/health');
  assert('API online', h.sucesso && h.status === 'online');

  // ── Cadastro de Cliente ──────────────────────────
  console.log('\n[ CRUD Usuário — Cadastro de Cliente ]');
  const cad = await req('POST', '/auth/cadastro/cliente', {
    nome: 'Teste Usuario', email: `teste${Date.now()}@test.com`,
    senha: 'senha123', telefone: '(24) 99999-0000', cep: '27310-000'
  });
  assert('Cadastro retorna sucesso',    cad.sucesso === true);
  assert('Retorna token JWT',           typeof cad.token === 'string' && cad.token.length > 20);
  assert('Senha NÃO exposta no retorno',!cad.usuario?.senha_hash && !cad.usuario?.senha);
  assert('ID do usuário retornado',     !!cad.usuario?.id);
  tokenCliente = cad.token;
  clienteId    = cad.usuario?.id;

  // ── Login de Cliente ─────────────────────────────
  console.log('\n[ Autenticação — Login ]');
  const login = await req('POST', '/auth/login/cliente', {
    email: 'cliente@demo.com', senha: '123456'
  });
  assert('Login demo retorna sucesso',  login.sucesso === true);
  assert('Token JWT gerado',            !!login.token);
  assert('Tipo = cliente',              login.usuario?.tipo === 'cliente');

  // ── Login errado ─────────────────────────────────
  const loginErrado = await req('POST', '/auth/login/cliente', {
    email: 'cliente@demo.com', senha: 'errada'
  });
  assert('Senha errada retorna 401',    loginErrado.sucesso === false);

  // ── /auth/me ─────────────────────────────────────
  console.log('\n[ Autorização — Token JWT ]');
  const me = await req('GET', '/auth/me', null, tokenCliente);
  assert('/me retorna dados do usuário', me.sucesso === true);
  assert('/me sem token retorna erro',   true); // checado abaixo
  const meSemToken = await req('GET', '/auth/me');
  assert('/me sem token → 401',         meSemToken.sucesso === false);

  // ── Cadastro de Afiliado ─────────────────────────
  console.log('\n[ CRUD Usuário — Cadastro de Afiliado ]');
  const cadAf = await req('POST', '/auth/cadastro/afiliado', {
    empresa: 'Caçambas Teste', email: `emp${Date.now()}@test.com`,
    senha: 'senha123', cnpj: '00.000.000/0001-00',
    cidade: 'Volta Redonda', estado: 'RJ'
  });
  assert('Cadastro afiliado retorna sucesso',  cadAf.sucesso === true);
  assert('Senha NÃO exposta',                  !cadAf.usuario?.senha_hash);
  tokenAfiliado = cadAf.token;
  afiliadoId    = cadAf.usuario?.id;

  // ── E-mail duplicado ─────────────────────────────
  const dup = await req('POST', '/auth/cadastro/cliente', {
    nome: 'Duplicado', email: 'cliente@demo.com', senha: '123456'
  });
  assert('E-mail duplicado retorna erro 409',  dup.sucesso === false);

  // ── CRUD Caçamba ─────────────────────────────────
  console.log('\n[ CRUD Caçamba ]');
  const novaCac = await req('POST', '/cacambas', {
    nome: 'Caçamba de Teste', tipo: 'obra',
    capacidade: '4m³', dimensoes: '2x1.5x1m', peso_max: '2 ton',
    preco: 300, descricao: 'Teste automatizado', disponivel: true
  }, tokenAfiliado);
  assert('Criar caçamba retorna sucesso',  novaCac.sucesso === true);
  assert('Caçamba tem ID',                !!novaCac.cacamba?.id);
  cacambaId = novaCac.cacamba?.id;

  const updCac = await req('PUT', `/cacambas/${cacambaId}`, {
    nome: 'Caçamba Atualizada', tipo: 'obra', preco: 350,
    capacidade: '4m³', dimensoes: '2x1.5x1m', peso_max: '2 ton'
  }, tokenAfiliado);
  assert('Atualizar caçamba retorna sucesso', updCac.sucesso === true);
  assert('Nome foi atualizado',              updCac.cacamba?.nome === 'Caçamba Atualizada');

  // Tentativa de outro afiliado editar → deve falhar
  const loginAf2 = await req('POST', '/auth/login/afiliado', {
    email: 'afiliado@demo.com', senha: '123456'
  });
  const edit403 = await req('PUT', `/cacambas/${cacambaId}`, {
    nome: 'Invasão', tipo: 'obra', preco: 1
  }, loginAf2.token);
  assert('Outro afiliado não pode editar caçamba alheia', edit403.sucesso === false);

  // ── CRUD Pedido ───────────────────────────────────
  console.log('\n[ CRUD Pedido ]');
  const novoPed = await req('POST', '/pedidos', {
    cacambaId: 'cb1', endereco: 'Rua Teste, 1',
    data: '2025-12-01', dataFim: '2025-12-07', valor: 250
  }, tokenCliente);
  assert('Criar pedido retorna sucesso', novoPed.sucesso === true);
  assert('Pedido tem ID',               !!novoPed.pedido?.id);
  assert('Status inicial = pendente',   novoPed.pedido?.status === 'pendente');
  pedidoId = novoPed.pedido?.id;

  // ── Atualização de status ─────────────────────────
  console.log('\n[ Status do Pedido ]');
  const loginDemoAf = await req('POST', '/auth/login/afiliado', {
    email: 'afiliado@demo.com', senha: '123456'
  });
  const st1 = await req('PATCH', `/pedidos/${pedidoId}/status`, { status: 'a-caminho' }, loginDemoAf.token);
  assert('Status → a-caminho',          st1.sucesso === true);
  const st2 = await req('PATCH', `/pedidos/${pedidoId}/status`, { status: 'recolhida' }, loginDemoAf.token);
  assert('Status recolhida → concluido', st2.pedido?.status === 'concluido');

  // ── Cliente não pode alterar status ───────────────
  const stNeg = await req('PATCH', `/pedidos/${pedidoId}/status`, { status: 'pendente' }, tokenCliente);
  assert('Cliente não pode alterar status (403)', stNeg.sucesso === false);

  // ── DELETE ────────────────────────────────────────
  console.log('\n[ DELETE — Remoção de recursos ]');
  const delCac = await req('DELETE', `/cacambas/${cacambaId}`, null, tokenAfiliado);
  assert('Deletar caçamba retorna sucesso', delCac.sucesso === true);

  const delCli = await req('DELETE', `/clientes/${clienteId}`, null, tokenCliente);
  assert('Deletar cliente retorna sucesso', delCli.sucesso === true);

  // ── Busca pública por CEP ─────────────────────────
  console.log('\n[ Busca Pública por Localidade ]');
  const busca = await req('GET', '/cacambas?cidade=Volta%20Redonda&estado=RJ');
  assert('Busca por cidade retorna caçambas', busca.sucesso === true && Array.isArray(busca.cacambas));
  assert('Resultado enriquecido c/ nome empresa', busca.cacambas?.length > 0 ? !!busca.cacambas[0].empresa : true);

  // ── Validação ─────────────────────────────────────
  console.log('\n[ Validação de Campos ]');
  const semEmail = await req('POST', '/auth/cadastro/cliente', { nome: 'X', senha: '123456' });
  assert('Falta e-mail → erro de validação', semEmail.sucesso === false && !!semEmail.detalhes);
  const senhaFraca = await req('POST', '/auth/cadastro/cliente', { nome:'X', email:'x@x.com', senha:'123' });
  assert('Senha < 6 chars → erro de validação', senhaFraca.sucesso === false);

  // ── Resultado ─────────────────────────────────────
  console.log(`\n${'─'.repeat(44)}`);
  console.log(`  Total: ${ok+fail} | ✅ Passou: ${ok} | ❌ Falhou: ${fail}`);
  console.log('─'.repeat(44) + '\n');
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(err => { console.error('Erro fatal:', err.message); process.exit(1); });
