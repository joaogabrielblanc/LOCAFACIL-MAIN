// suporte.js

// ── Tabs Clientes / Empresas ──────────────────────────
function setTab(id, btn) {
  document.getElementById('painelClientes').style.display = id === 'clientes' ? 'block' : 'none';
  document.getElementById('painelEmpresas').style.display = id === 'empresas' ? 'block' : 'none';
  document.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ── FAQ accordion ─────────────────────────────────────
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  // Fechar todos do mesmo grupo
  btn.closest('.faq-list').querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

// ── FAQ tabs ──────────────────────────────────────────
function setFaqTab(id, btn) {
  document.getElementById('faq-cli').style.display = id === 'faq-cli' ? 'flex' : 'none';
  document.getElementById('faq-emp').style.display = id === 'faq-emp' ? 'flex' : 'none';
  document.querySelectorAll('.faq-tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ── Formulário (simulação) ────────────────────────────
function enviarForm(btn) {
  const panel  = btn.closest('.form-suporte');
  const inputs = panel.querySelectorAll('input, select, textarea');
  let ok = true;
  inputs.forEach(el => {
    if (el.required !== false && !el.value.trim()) { el.style.borderColor = '#c0392b'; ok = false; }
    else el.style.borderColor = '';
  });
  if (!ok) { alert('Preencha todos os campos.'); return; }
  // Simula envio
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
  setTimeout(() => {
    const successId = panel.querySelector('.form-success').id;
    document.getElementById(successId).classList.add('show');
    inputs.forEach(el => el.value = '');
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar mensagem';
    btn.disabled = false;
  }, 1400);
}

// ── Header dinâmico ───────────────────────────────────
const s = DB.getSession();
if (s && s.tipo === 'cliente') {
  const btn = document.getElementById('btnHeaderLogin');
  if (btn) {
    btn.href = '../cliente/dashboard.html';
    document.getElementById('headerLoginTxt').textContent = s.nome.split(' ')[0];
  }
}
