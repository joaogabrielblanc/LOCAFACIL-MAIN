// server/routes/admin.js
// Rotas exclusivas do administrador — requer tipo='admin'

const express = require('express');
const router  = express.Router();
const { Admins, Clientes, Afiliados, Cacambas, Pedidos, statsGlobais } = require('../models/database');
const { autenticar, exigirTipo, gerarToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Todas as rotas exigem token + tipo admin
router.use(autenticar, exigirTipo('admin'));

// ── GET /api/admin/stats ──────────────────────────────
router.get('/stats', (req, res) => {
  res.json({ sucesso: true, stats: statsGlobais() });
});

// ══════════════════════════════════════════════════════
// CLIENTES
// ══════════════════════════════════════════════════════

router.get('/clientes', (req, res) => {
  const clientes = Clientes.findAll().map(c => ({
    ...c,
    pedidos: Pedidos.findAll({ clienteId: c.id }).length
  }));
  res.json({ sucesso: true, total: clientes.length, clientes });
});

router.get('/clientes/:id', (req, res) => {
  const c = Clientes.findById(req.params.id);
  if (!c) return res.status(404).json({ sucesso: false, erro: 'Cliente não encontrado.' });
  const { senha_hash, ...dados } = c;
  res.json({ sucesso: true, cliente: { ...dados, pedidos: Pedidos.findAll({ clienteId: c.id }) } });
});

router.put('/clientes/:id', [
  body('nome').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('senha').optional().isLength({ min: 6 }),
], (req, res) => {
  const erros = validationResult(req);
  if (!erros.isEmpty()) return res.status(400).json({ sucesso: false, erro: 'Dados inválidos.', detalhes: erros.array() });

  const { nome, email, senha, telefone, cep, endereco, ativo } = req.body;

  if (email) {
    const existe = Clientes.findByEmail(email);
    if (existe && existe.id !== req.params.id) {
      return res.status(409).json({ sucesso: false, erro: 'E-mail já em uso.' });
    }
  }

  const atualizado = Clientes.update(req.params.id, { nome, email, senha, telefone, cep, endereco, ativo });
  if (!atualizado) return res.status(404).json({ sucesso: false, erro: 'Cliente não encontrado.' });
  res.json({ sucesso: true, mensagem: 'Cliente atualizado.', cliente: atualizado });
});

router.delete('/clientes/:id', (req, res) => {
  const ok = Clientes.delete(req.params.id);
  if (!ok) return res.status(404).json({ sucesso: false, erro: 'Cliente não encontrado.' });
  res.json({ sucesso: true, mensagem: 'Cliente excluído.' });
});

// ══════════════════════════════════════════════════════
// AFILIADOS
// ══════════════════════════════════════════════════════

router.get('/afiliados', (req, res) => {
  const afiliados = Afiliados.findAll().map(a => ({
    ...a,
    cacambas: Cacambas.findAll({ afiliadoId: a.id }).length,
    pedidos:  Pedidos.findAll({ afiliadoId: a.id }).length
  }));
  res.json({ sucesso: true, total: afiliados.length, afiliados });
});

router.get('/afiliados/:id', (req, res) => {
  const a = Afiliados.findById(req.params.id);
  if (!a) return res.status(404).json({ sucesso: false, erro: 'Afiliado não encontrado.' });
  const { senha_hash, ...dados } = a;
  res.json({
    sucesso: true,
    afiliado: {
      ...dados,
      cacambas: Cacambas.findAll({ afiliadoId: a.id }),
      pedidos:  Pedidos.findAll({ afiliadoId: a.id })
    }
  });
});

router.put('/afiliados/:id', [
  body('empresa').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('senha').optional().isLength({ min: 6 }),
], (req, res) => {
  const erros = validationResult(req);
  if (!erros.isEmpty()) return res.status(400).json({ sucesso: false, erro: 'Dados inválidos.', detalhes: erros.array() });

  const { empresa, cnpj, email, senha, telefone, cidade, estado, ativo } = req.body;

  if (email) {
    const existe = Afiliados.findByEmail(email);
    if (existe && existe.id !== req.params.id) {
      return res.status(409).json({ sucesso: false, erro: 'E-mail já em uso.' });
    }
  }

  const atualizado = Afiliados.update(req.params.id, { empresa, cnpj, email, senha, telefone, cidade, estado, ativo });
  if (!atualizado) return res.status(404).json({ sucesso: false, erro: 'Afiliado não encontrado.' });
  res.json({ sucesso: true, mensagem: 'Afiliado atualizado.', afiliado: atualizado });
});

router.delete('/afiliados/:id', (req, res) => {
  const ok = Afiliados.delete(req.params.id);
  if (!ok) return res.status(404).json({ sucesso: false, erro: 'Afiliado não encontrado.' });
  res.json({ sucesso: true, mensagem: 'Afiliado excluído.' });
});

// ══════════════════════════════════════════════════════
// PEDIDOS (visão geral admin)
// ══════════════════════════════════════════════════════

router.get('/pedidos', (req, res) => {
  const pedidos = Pedidos.findAll();
  const cMap = {}; Cacambas.findAll().forEach(c => (cMap[c.id] = c.nome));
  const cliMap = {}; Clientes.findAll().forEach(c => (cliMap[c.id] = c.nome));
  const afMap  = {}; Afiliados.findAll().forEach(a => (afMap[a.id]  = a.empresa));
  const enriquecido = pedidos.map(p => ({
    ...p,
    nomeCliente:  cliMap[p.clienteId]  || p.clienteId,
    nomeAfiliado: afMap[p.afiliadoId]  || p.afiliadoId,
    nomeCacamba:  cMap[p.cacambaId]    || p.cacambaId
  }));
  res.json({ sucesso: true, total: pedidos.length, pedidos: enriquecido });
});

// ══════════════════════════════════════════════════════
// DB EXPORT (download do JSON)
// ══════════════════════════════════════════════════════

router.get('/export', (req, res) => {
  const { db } = require('../models/database');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="locafacil-db.json"');
  res.send(JSON.stringify(db.getState(), null, 2));
});

module.exports = router;
