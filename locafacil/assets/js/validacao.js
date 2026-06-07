// ============================================================
// validacao.js — Validação e máscaras dos formulários
// Compartilhado entre login de cliente, empresa e admin.
// Dá feedback visual (verde/vermelho) em tempo real.
// ============================================================

// ── MÁSCARAS DE ENTRADA ───────────────────────────────────
const Mascaras = {
  // (00) 00000-0000
  telefone(el) {
    let v = el.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 7)       v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else if (v.length > 2)  v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    else if (v.length > 0)  v = `(${v}`;
    el.value = v;
  },
  // 00000-000
  cep(el) {
    let v = el.value.replace(/\D/g, '').slice(0, 8);
    if (v.length > 5) v = `${v.slice(0,5)}-${v.slice(5)}`;
    el.value = v;
  },
  // 00.000.000/0001-00
  cnpj(el) {
    let v = el.value.replace(/\D/g, '').slice(0, 14);
    v = v.replace(/^(\d{2})(\d)/, '$1.$2')
         .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
         .replace(/\.(\d{3})(\d)/, '.$1/$2')
         .replace(/(\d{4})(\d)/, '$1-$2');
    el.value = v;
  },
  // 2 letras maiúsculas
  estado(el) {
    el.value = el.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2);
  }
};

// ── VALIDADORES ───────────────────────────────────────────
const Validador = {
  email(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((v || '').trim());
  },

  telefone(v) {
    const n = (v || '').replace(/\D/g, '');
    return n.length === 10 || n.length === 11;
  },

  cep(v) {
    return (v || '').replace(/\D/g, '').length === 8;
  },

  // Força da senha → { nivel, label, cor, pct }
  forcaSenha(v) {
    let p = 0;
    if (v.length >= 6)  p++;
    if (v.length >= 10) p++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) p++;
    if (/\d/.test(v))   p++;
    if (/[^A-Za-z0-9]/.test(v)) p++;
    if (p <= 2) return { nivel: 0, label: 'Fraca', cor: '#e74c3c', pct: 33 };
    if (p <= 3) return { nivel: 1, label: 'Média', cor: '#f39c12', pct: 66 };
    return { nivel: 2, label: 'Forte', cor: '#27ae60', pct: 100 };
  },

  // Validação real de CNPJ com dígitos verificadores
  cnpj(v) {
    const c = (v || '').replace(/\D/g, '');
    if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
    const calc = (base) => {
      let soma = 0, pos = base.length - 7;
      for (let i = 0; i < base.length; i++) {
        soma += parseInt(base[i], 10) * pos--;
        if (pos < 2) pos = 9;
      }
      const r = soma % 11;
      return r < 2 ? 0 : 11 - r;
    };
    const d1 = calc(c.slice(0, 12));
    const d2 = calc(c.slice(0, 12) + d1);
    return c.slice(12) === `${d1}${d2}`;
  }
};

// ── ESTADO VISUAL DO CAMPO ────────────────────────────────
// estado: 'valido' | 'invalido' | 'neutro'
function setEstado(fieldEl, estado, msg) {
  if (!fieldEl) return;
  fieldEl.classList.remove('valido', 'invalido');
  const hint = fieldEl.querySelector('.field-hint');
  if (estado === 'valido') {
    fieldEl.classList.add('valido');
    if (hint) { hint.textContent = msg || ''; hint.className = msg ? 'field-hint ok' : 'field-hint'; }
  } else if (estado === 'invalido') {
    fieldEl.classList.add('invalido');
    if (hint) { hint.textContent = msg || ''; hint.className = 'field-hint err'; }
  } else {
    if (hint) { hint.textContent = ''; hint.className = 'field-hint'; }
  }
}

// ── MOSTRAR / OCULTAR SENHA ───────────────────────────────
function toggleSenha(btn) {
  const input = btn.parentElement.querySelector('input');
  const icon  = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fas fa-eye-slash';
    btn.setAttribute('aria-label', 'Ocultar senha');
  } else {
    input.type = 'password';
    icon.className = 'fas fa-eye';
    btn.setAttribute('aria-label', 'Mostrar senha');
  }
}
