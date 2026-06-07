// server/middleware/auth.js
// Middleware de autenticação e autorização via JWT

const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'locafacil_jwt_secret_2025';

// ── Gerar token ───────────────────────────────────────
function gerarToken(payload) {
  return jwt.sign(payload, SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

// ── Verificar token (middleware) ──────────────────────
function autenticar(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({
      sucesso: false,
      erro: 'Token de autenticação não fornecido.'
    });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.usuario = decoded; // { id, tipo, email, nome/empresa }
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Token expirado. Faça login novamente.'
      : 'Token inválido.';
    return res.status(401).json({ sucesso: false, erro: msg });
  }
}

// ── Exigir tipo específico ────────────────────────────
function exigirTipo(...tipos) {
  return (req, res, next) => {
    if (!tipos.includes(req.usuario?.tipo)) {
      return res.status(403).json({
        sucesso: false,
        erro: `Acesso negado. Requer perfil: ${tipos.join(' ou ')}.`
      });
    }
    next();
  };
}

// ── Exigir que o recurso pertença ao usuário logado ──
function exigirProprietario(campo = 'id') {
  return (req, res, next) => {
    const idRecurso = req.params[campo];
    if (req.usuario.id !== idRecurso) {
      return res.status(403).json({
        sucesso: false,
        erro: 'Você não tem permissão para acessar este recurso.'
      });
    }
    next();
  };
}

module.exports = { gerarToken, autenticar, exigirTipo, exigirProprietario };
