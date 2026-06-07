// login-cliente.js — autenticação via localStorage (DB) + validação

(async function () {
  await DBReady;
  const s = DB.getSession();
  if (s && s.tipo === 'cliente') location.href = 'dashboard.html';
  if (s && s.tipo === 'afiliado') location.href = '../afiliado/dashboard.html';
})();

function setTab(t) {
  document.querySelectorAll('.auth-tab').forEach((el, i) =>
    el.classList.toggle('active', i === (t === 'login' ? 0 : 1))
  );
  document.getElementById('panelLogin').style.display    = t === 'login'    ? 'block' : 'none';
  document.getElementById('panelCadastro').style.display = t === 'cadastro' ? 'block' : 'none';
}

function showError(id, msg) {
  const el = document.getElementById(id);
  el.querySelector('span').textContent = msg;
  el.classList.add('visible');
}
function hideError(id) { document.getElementById(id).classList.remove('visible'); }

// ── Elementos ─────────────────────────────────────────
const elLoginEmail = document.getElementById('loginEmail');
const elLoginSenha = document.getElementById('loginSenha');
const elCadNome    = document.getElementById('cadNome');
const elCadEmail   = document.getElementById('cadEmail');
const elCadTel     = document.getElementById('cadTel');
const elCadCep     = document.getElementById('cadCep');
const elCadSenha   = document.getElementById('cadSenha');

// ── Validações de campo ───────────────────────────────
function vEmail(input, fieldId) {
  const field = document.getElementById(fieldId);
  const v = input.value.trim();
  if (!v) { setEstado(field, 'neutro'); return false; }
  if (Validador.email(v)) { setEstado(field, 'valido', 'E-mail válido'); return true; }
  setEstado(field, 'invalido', 'Digite um e-mail válido (ex: nome@email.com)');
  return false;
}

function vSenhaLogin(input, fieldId) {
  const field = document.getElementById(fieldId);
  if (!input.value) { setEstado(field, 'neutro'); return false; }
  setEstado(field, 'valido');
  return true;
}

function vNome(input, fieldId) {
  const field = document.getElementById(fieldId);
  const v = input.value.trim();
  if (!v) { setEstado(field, 'neutro'); return false; }
  if (v.length >= 3) { setEstado(field, 'valido', 'Tudo certo'); return true; }
  setEstado(field, 'invalido', 'Informe seu nome completo');
  return false;
}

function vSenhaCadastro(input, fieldId, barId) {
  const field = document.getElementById(fieldId);
  const v = input.value;
  const bar = document.querySelector('#' + barId + ' span');
  if (!v) { setEstado(field, 'neutro'); if (bar) bar.style.width = '0'; return false; }
  const f = Validador.forcaSenha(v);
  if (bar) { bar.style.width = f.pct + '%'; bar.style.background = f.cor; }
  if (v.length < 6) { setEstado(field, 'invalido', 'Minimo de 6 caracteres'); return false; }
  setEstado(field, 'valido', 'Senha ' + f.label.toLowerCase());
  return true;
}

function vTelefone(input, fieldId) {
  const field = document.getElementById(fieldId);
  if (!input.value.trim()) { setEstado(field, 'neutro'); return true; } // opcional
  if (Validador.telefone(input.value)) { setEstado(field, 'valido', 'Telefone valido'); return true; }
  setEstado(field, 'invalido', 'Telefone incompleto');
  return false;
}

function vCep(input, fieldId) {
  const field = document.getElementById(fieldId);
  if (!input.value.trim()) { setEstado(field, 'neutro'); return true; } // opcional
  if (Validador.cep(input.value)) { setEstado(field, 'valido', 'CEP valido'); return true; }
  setEstado(field, 'invalido', 'CEP incompleto');
  return false;
}

// ── Listeners em tempo real ───────────────────────────
elLoginEmail.addEventListener('input', () => vEmail(elLoginEmail, 'f-loginEmail'));
elLoginEmail.addEventListener('blur',  () => vEmail(elLoginEmail, 'f-loginEmail'));
elLoginSenha.addEventListener('input', () => vSenhaLogin(elLoginSenha, 'f-loginSenha'));

elCadNome.addEventListener('input',  () => vNome(elCadNome, 'f-cadNome'));
elCadEmail.addEventListener('input', () => vEmail(elCadEmail, 'f-cadEmail'));
elCadEmail.addEventListener('blur',  () => vEmail(elCadEmail, 'f-cadEmail'));
elCadSenha.addEventListener('input', () => vSenhaCadastro(elCadSenha, 'f-cadSenha', 'bar-cadSenha'));
elCadTel.addEventListener('input',   () => { Mascaras.telefone(elCadTel); vTelefone(elCadTel, 'f-cadTel'); });
elCadCep.addEventListener('input',   () => { Mascaras.cep(elCadCep); vCep(elCadCep, 'f-cadCep'); });

// ── Submeter login ────────────────────────────────────
async function fazerLogin() {
  hideError('errLogin');
  const email = elLoginEmail.value.trim();
  const senha = elLoginSenha.value;

  if (!email || !senha) { showError('errLogin', 'Preencha e-mail e senha.'); return; }
  if (!vEmail(elLoginEmail, 'f-loginEmail')) { showError('errLogin', 'Verifique o e-mail informado.'); return; }

  const btn = document.querySelector('#panelLogin .btn-auth');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
  btn.disabled = true;

  await DBReady;
  const r = await DB.loginCliente(email, senha);
  btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar na minha conta';
  btn.disabled = false;

  if (r.success) { location.href = 'dashboard.html'; }
  else { showError('errLogin', r.error || 'Erro ao fazer login.'); }
}

// ── Submeter cadastro ─────────────────────────────────
async function cadastrar() {
  hideError('errCad');
  const nome  = elCadNome.value.trim();
  const email = elCadEmail.value.trim();
  const tel   = elCadTel.value.trim();
  const cep   = elCadCep.value.trim();
  const senha = elCadSenha.value;

  if (!nome || !email || !senha) { showError('errCad', 'Preencha os campos obrigatórios.'); return; }
  if (!vNome(elCadNome, 'f-cadNome'))    { showError('errCad', 'Informe seu nome completo.'); return; }
  if (!vEmail(elCadEmail, 'f-cadEmail')) { showError('errCad', 'Digite um e-mail válido.'); return; }
  if (senha.length < 6) { vSenhaCadastro(elCadSenha, 'f-cadSenha', 'bar-cadSenha'); showError('errCad', 'A senha deve ter pelo menos 6 caracteres.'); return; }
  if (!vTelefone(elCadTel, 'f-cadTel'))  { showError('errCad', 'Telefone incompleto.'); return; }
  if (!vCep(elCadCep, 'f-cadCep'))       { showError('errCad', 'CEP incompleto.'); return; }

  const btn = document.querySelector('#panelCadastro .btn-auth');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando conta...';
  btn.disabled = true;

  await DBReady;
  const r = await DB.cadastrarCliente({ nome, email, senha, telefone: tel, cep });
  btn.innerHTML = '<i class="fas fa-user-plus"></i> Criar minha conta';
  btn.disabled = false;

  if (r.success) { location.href = 'dashboard.html'; }
  else { showError('errCad', r.error || 'Erro ao cadastrar.'); }
}

// ── Enter para enviar ─────────────────────────────────
elLoginSenha.addEventListener('keydown', e => e.key === 'Enter' && fazerLogin());
elCadSenha.addEventListener('keydown',   e => e.key === 'Enter' && cadastrar());
