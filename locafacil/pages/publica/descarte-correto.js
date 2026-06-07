// descarte-correto.js

// ── Accordion tipos de resíduo ────────────────────────
function toggleTipo(card) {
  // Fecha outros abertos
  document.querySelectorAll('.tipo-card.open').forEach(c => {
    if (c !== card) c.classList.remove('open');
  });
  card.classList.toggle('open');
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
