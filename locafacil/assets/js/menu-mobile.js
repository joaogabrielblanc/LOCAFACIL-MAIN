// ============================================================
// menu-mobile.js — Menu hambúrguer para celular
// Monta o painel a partir dos links já existentes no header,
// então funciona em qualquer página sem duplicar HTML.
// Deve ser carregado por ÚLTIMO (após os scripts que ajustam
// o botão "Entrar" para usuários logados).
// ============================================================

(function () {
  const toggle = document.querySelector('.mobile-menu-toggle');
  const header = document.querySelector('.header');
  if (!toggle || !header) return;

  // Evita montar duas vezes
  if (header.querySelector('.mobile-nav')) return;

  // ── Cria o painel ───────────────────────────────────────
  const panel = document.createElement('nav');
  panel.className = 'mobile-nav';
  panel.id = 'mobileNav';
  panel.setAttribute('aria-label', 'Menu de navegação');

  // 1) Links de navegação
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    navLinks.querySelectorAll('a').forEach(a => {
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.className = 'mobile-nav-link';
      link.innerHTML = a.innerHTML;
      if (a.classList.contains('active')) link.classList.add('active');
      panel.appendChild(link);
    });
  }

  // 2) Divisória
  const actions = document.querySelector('.header-actions');
  if (navLinks && actions) {
    const hr = document.createElement('div');
    hr.className = 'mobile-nav-divider';
    panel.appendChild(hr);
  }

  // 3) Botões de ação (Entrar / Sou Empresa)
  if (actions) {
    actions.querySelectorAll('a').forEach(a => {
      const btn = a.cloneNode(true);
      btn.removeAttribute('id');
      btn.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
      // troca as classes de desktop pela classe do menu mobile
      const ehLogin = btn.classList.contains('btn-login-cliente');
      btn.className = 'mobile-nav-btn' + (ehLogin ? ' primary' : '');
      panel.appendChild(btn);
    });
  }

  header.appendChild(panel);

  // ── Abrir / fechar ──────────────────────────────────────
  const icon = toggle.querySelector('i');

  function abrir() {
    panel.classList.add('open');
    toggle.classList.add('active');
    if (icon) icon.className = 'fas fa-times';
    document.body.classList.add('menu-open');
    toggle.setAttribute('aria-expanded', 'true');
  }
  function fechar() {
    panel.classList.remove('open');
    toggle.classList.remove('active');
    if (icon) icon.className = 'fas fa-bars';
    document.body.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  function alternar(e) {
    e.stopPropagation();
    panel.classList.contains('open') ? fechar() : abrir();
  }

  toggle.setAttribute('role', 'button');
  toggle.setAttribute('aria-label', 'Abrir menu');
  toggle.setAttribute('aria-expanded', 'false');

  toggle.addEventListener('click', alternar);

  // Fecha ao clicar em qualquer link/botão do menu
  panel.querySelectorAll('a').forEach(a => a.addEventListener('click', fechar));

  // Fecha ao clicar fora do menu
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('open') && !panel.contains(e.target) && !toggle.contains(e.target)) {
      fechar();
    }
  });

  // Fecha com a tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fechar();
  });

  // Fecha automaticamente ao voltar para tela grande
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) fechar();
  });
})();
