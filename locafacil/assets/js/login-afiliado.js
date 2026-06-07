// login-afiliado.js — autenticação via localStorage (DB) + validação

(async function () {
  await DBReady;
  const s = DB.getSession();
  if (s && s.tipo === 'afiliado') location.href = 'dashboard.html';
  if (s && s.tipo === 'cliente') location.href = '../cliente/dashboard.html';
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
const elLEmail   = document.getElementById('lEmail');
const elLSenha   = document.getElementById('lSenha');
const elCEmpresa = document.getElementById('cEmpresa');
const elCCnpj    = document.getElementById('cCnpj');
const elCEmail   = document.getElementById('cEmail');
const elCTel     = document.getElementById('cTel');
const elCCidade  = document.getElementById('cCidade');
const elCEstado  = document.getElementById('cEstado');
const elCSenha   = document.getElementById('cSenha');

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

function vEmpresa(input, fieldId) {
  const field = document.getElementById(fieldId);
  const v = input.value.trim();
  if (!v) { setEstado(field, 'neutro'); return false; }
  if (v.length >= 3) { setEstado(field, 'valido', 'Tudo certo'); return true; }
  setEstado(field, 'invalido', 'Informe o nome da empresa');
  return false;
}

function vCnpj(input, fieldId) {
  const field = document.getElementById(fieldId);
  if (!input.value.trim()) { setEstado(field, 'neutro'); return true; } // opcional
  if (Validador.cnpj(input.value)) { setEstado(field, 'valido', 'CNPJ válido'); return true; }
  setEstado(field, 'invalido', 'CNPJ inválido — verifique os números');
  return false;
}

function vTelefone(input, fieldId) {
  const field = document.getElementById(fieldId);
  if (!input.value.trim()) { setEstado(field, 'neutro'); return true; } // opcional
  if (Validador.telefone(input.value)) { setEstado(field, 'valido', 'Telefone válido'); return true; }
  setEstado(field, 'invalido', 'Telefone incompleto');
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

// ── Listeners em tempo real ───────────────────────────
elLEmail.addEventListener('input', () => vEmail(elLEmail, 'f-lEmail'));
elLEmail.addEventListener('blur',  () => vEmail(elLEmail, 'f-lEmail'));
elLSenha.addEventListener('input', () => vSenhaLogin(elLSenha, 'f-lSenha'));

elCEmpresa.addEventListener('input', () => vEmpresa(elCEmpresa, 'f-cEmpresa'));
elCCnpj.addEventListener('input',    () => { Mascaras.cnpj(elCCnpj); vCnpj(elCCnpj, 'f-cCnpj'); });
elCEmail.addEventListener('input',   () => vEmail(elCEmail, 'f-cEmail'));
elCEmail.addEventListener('blur',    () => vEmail(elCEmail, 'f-cEmail'));
elCTel.addEventListener('input',     () => { Mascaras.telefone(elCTel); vTelefone(elCTel, 'f-cTel'); });
elCEstado.addEventListener('input',  () => Mascaras.estado(elCEstado));
elCSenha.addEventListener('input',   () => vSenhaCadastro(elCSenha, 'f-cSenha', 'bar-cSenha'));

// ── Submeter login ────────────────────────────────────
async function login() {
  hideError('errLogin');
  const email = elLEmail.value.trim();
  const senha = elLSenha.value;

  if (!email || !senha) { showError('errLogin', 'Preencha os campos.'); return; }
  if (!vEmail(elLEmail, 'f-lEmail')) { showError('errLogin', 'Verifique o e-mail informado.'); return; }

  const btn = document.querySelector('#panelLogin .btn-auth');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
  btn.disabled = true;

  await DBReady;
  const r = await DB.loginAfiliado(email, senha);
  btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Acessar o portal';
  btn.disabled = false;

  if (r.success) { location.href = 'dashboard.html'; }
  else { showError('errLogin', r.error || 'Erro ao fazer login.'); }
}

// ── Submeter cadastro ─────────────────────────────────
async function cadastrar() {
  hideError('errCad');
  const empresa = elCEmpresa.value.trim();
  const cnpj    = elCCnpj.value.trim();
  const email   = elCEmail.value.trim();
  const tel     = elCTel.value.trim();
  const cidade  = elCCidade.value.trim();
  const estado  = elCEstado.value.trim().toUpperCase();
  const senha   = elCSenha.value;

  if (!empresa || !email || !senha) { showError('errCad', 'Preencha os campos obrigatórios.'); return; }
  if (!vEmpresa(elCEmpresa, 'f-cEmpresa')) { showError('errCad', 'Informe o nome da empresa.'); return; }
  if (!vCnpj(elCCnpj, 'f-cCnpj'))          { showError('errCad', 'CNPJ inválido. Confira os números.'); return; }
  if (!vEmail(elCEmail, 'f-cEmail'))       { showError('errCad', 'Digite um e-mail válido.'); return; }
  if (senha.length < 6) { vSenhaCadastro(elCSenha, 'f-cSenha', 'bar-cSenha'); showError('errCad', 'A senha deve ter pelo menos 6 caracteres.'); return; }
  if (!vTelefone(elCTel, 'f-cTel'))        { showError('errCad', 'Telefone incompleto.'); return; }

  const btn = document.querySelector('#panelCadastro .btn-auth');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
  btn.disabled = true;

  await DBReady;
  const r = await DB.cadastrarAfiliado({ empresa, cnpj, email, senha, telefone: tel, cidade, estado });
  btn.innerHTML = '<i class="fas fa-building"></i> Cadastrar minha empresa';
  btn.disabled = false;

  if (r.success) { location.href = 'dashboard.html'; }
  else { showError('errCad', r.error || 'Erro ao cadastrar.'); }
}

// ── Enter para enviar ─────────────────────────────────
elLSenha.addEventListener('keydown', e => e.key === 'Enter' && login());
elCSenha.addEventListener('keydown', e => e.key === 'Enter' && cadastrar());
