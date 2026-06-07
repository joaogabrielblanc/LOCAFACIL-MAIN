// server/routes/auth.js
// Rotas de autenticação: cadastro, login, perfil

const express  = require('express');
const router   = express.Router();
const { Clientes, Afiliados } = require('../models/database');
const { gerarToken, autenticar } = require('../middleware/auth');
const { regras, checarErros }    = require('../middleware/validacao');

// ─────────────────────────────────────────────────────
// POST /api/auth/cadastro/cliente
// Cadastra um novo cliente com senha criptografada
// ─────────────────────────────────────────────────────
router.post('/cadastro/cliente', regras.cadastroCliente, checarErros, (req, res) => {
  const { nome, email, senha, telefone, cep, endereco } = req.body;

  // Verificar e-mail duplicado
  if (Clientes.findByEmail(email)) {
    return res.status(409).json({ sucesso: false, erro: 'E-mail já cadastrado.' });
  }

  const usuario = Clientes.create({ nome, email, senha, telefone, cep, endereco });
  const token   = gerarToken({ id: usuario.id, tipo: 'cliente', email: usuario.email, nome: usuario.nome });

  res.status(201).json({
    sucesso: true,
    mensagem: 'Cliente cadastrado com sucesso.',
    token,
    usuario
  });
});

// ─────────────────────────────────────────────────────
// POST /api/auth/cadastro/afiliado
// Cadastra uma nova empresa afiliada
// ─────────────────────────────────────────────────────
router.post('/cadastro/afiliado', regras.cadastroAfiliado, checarErros, (req, res) => {
  const { empresa, cnpj, email, senha, telefone, cidade, estado } = req.body;

  if (Afiliados.findByEmail(email)) {
    return res.status(409).json({ sucesso: false, erro: 'E-mail já cadastrado.' });
  }

  const usuario = Afiliados.create({ empresa, cnpj, email, senha, telefone, cidade, estado });
  const token   = gerarToken({ id: usuario.id, tipo: 'afiliado', email: usuario.email, nome: usuario.empresa });

  res.status(201).json({
    sucesso: true,
    mensagem: 'Empresa cadastrada com sucesso.',
    token,
    usuario
  });
});

// ─────────────────────────────────────────────────────
// POST /api/auth/login/cliente
// Login com e-mail + senha → retorna JWT
// ─────────────────────────────────────────────────────
router.post('/login/cliente', regras.login, checarErros, (req, res) => {
  const { email, senha } = req.body;

  const usuario = Clientes.findByEmail(email);
  if (!usuario || !Clientes.verificarSenha(usuario, senha)) {
    return res.status(401).json({ sucesso: false, erro: 'E-mail ou senha incorretos.' });
  }

  const token = gerarToken({ id: usuario.id, tipo: 'cliente', email: usuario.email, nome: usuario.nome });

  res.json({
    sucesso: true,
    mensagem: 'Login realizado com sucesso.',
    token,
    usuario: {
      id: usuario.id, nome: usuario.nome,
      email: usuario.email, tipo: 'cliente'
    }
  });
});

// ─────────────────────────────────────────────────────
// POST /api/auth/login/afiliado
// ─────────────────────────────────────────────────────
router.post('/login/afiliado', regras.login, checarErros, (req, res) => {
  const { email, senha } = req.body;

  const usuario = Afiliados.findByEmail(email);
  if (!usuario || !Afiliados.verificarSenha(usuario, senha)) {
    return res.status(401).json({ sucesso: false, erro: 'E-mail ou senha incorretos.' });
  }

  const token = gerarToken({ id: usuario.id, tipo: 'afiliado', email: usuario.email, nome: usuario.empresa });

  res.json({
    sucesso: true,
    mensagem: 'Login realizado com sucesso.',
    token,
    usuario: {
      id: usuario.id, nome: usuario.empresa,
      email: usuario.email, tipo: 'afiliado'
    }
  });
});

// ─────────────────────────────────────────────────────
// GET /api/auth/me
// Retorna dados do usuário logado (token obrigatório)
// ─────────────────────────────────────────────────────
router.get('/me', autenticar, (req, res) => {
  const { id, tipo } = req.usuario;
  const usuario = tipo === 'cliente'
    ? Clientes.findById(id)
    : Afiliados.findById(id);

  if (!usuario) {
    return res.status(404).json({ sucesso: false, erro: 'Usuário não encontrado.' });
  }

  // Remover hash da senha antes de retornar
  const { senha_hash, ...dados } = usuario;
  res.json({ sucesso: true, usuario: { ...dados, tipo } });
});

module.exports = router;

// ─────────────────────────────────────────────────────
// POST /api/auth/login/admin
// Login exclusivo do administrador
// ─────────────────────────────────────────────────────
const { Admins } = require('../models/database');

router.post('/login/admin', regras.login, checarErros, (req, res) => {
  const { email, senha } = req.body;
  const admin = Admins.findByEmail(email);
  if (!admin || !Admins.verificarSenha(admin, senha)) {
    return res.status(401).json({ sucesso: false, erro: 'Credenciais inválidas.' });
  }
  const token = gerarToken({ id: admin.id, tipo: 'admin', email: admin.email, nome: admin.nome });
  res.json({
    sucesso: true,
    mensagem: 'Login de administrador realizado.',
    token,
    usuario: { id: admin.id, nome: admin.nome, email: admin.email, tipo: 'admin' }
  });
});
