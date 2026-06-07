// server/routes/clientes.js
// CRUD de clientes — requer autenticação

const express  = require('express');
const router   = express.Router();
const { Clientes, Pedidos } = require('../models/database');
const { autenticar, exigirTipo } = require('../middleware/auth');
const { regras, checarErros }    = require('../middleware/validacao');

// Todas as rotas exigem token
router.use(autenticar);

// ─────────────────────────────────────────────────────
// GET /api/clientes
// Lista todos os clientes (somente afiliados podem ver)
// ─────────────────────────────────────────────────────
router.get('/', exigirTipo('afiliado'), (req, res) => {
  res.json({ sucesso: true, clientes: Clientes.findAll() });
});

// ─────────────────────────────────────────────────────
// GET /api/clientes/:id
// Busca cliente por ID (próprio cliente ou afiliado)
// ─────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const { id } = req.params;
  // Cliente só pode ver o próprio perfil
  if (req.usuario.tipo === 'cliente' && req.usuario.id !== id) {
    return res.status(403).json({ sucesso: false, erro: 'Acesso negado.' });
  }
  const cliente = Clientes.findById(id);
  if (!cliente) return res.status(404).json({ sucesso: false, erro: 'Cliente não encontrado.' });
  const { senha_hash, ...dados } = cliente;
  res.json({ sucesso: true, cliente: dados });
});

// ─────────────────────────────────────────────────────
// PUT /api/clientes/:id
// Atualiza dados do cliente (somente o próprio)
// ─────────────────────────────────────────────────────
router.put('/:id', exigirTipo('cliente'), (req, res) => {
  const { id } = req.params;
  if (req.usuario.id !== id) {
    return res.status(403).json({ sucesso: false, erro: 'Você só pode alterar seu próprio perfil.' });
  }
  // Campos permitidos
  const { nome, telefone, cep, endereco } = req.body;
  const atualizado = Clientes.update(id, { nome, telefone, cep, endereco });
  if (!atualizado) return res.status(404).json({ sucesso: false, erro: 'Cliente não encontrado.' });
  res.json({ sucesso: true, mensagem: 'Perfil atualizado.', cliente: atualizado });
});

// ─────────────────────────────────────────────────────
// DELETE /api/clientes/:id
// Exclui a conta do próprio cliente
// ─────────────────────────────────────────────────────
router.delete('/:id', exigirTipo('cliente'), (req, res) => {
  const { id } = req.params;
  if (req.usuario.id !== id) {
    return res.status(403).json({ sucesso: false, erro: 'Você só pode excluir sua própria conta.' });
  }
  const ok = Clientes.delete(id);
  if (!ok) return res.status(404).json({ sucesso: false, erro: 'Cliente não encontrado.' });
  res.json({ sucesso: true, mensagem: 'Conta excluída com sucesso.' });
});

// ─────────────────────────────────────────────────────
// GET /api/clientes/:id/pedidos
// Lista pedidos do cliente
// ─────────────────────────────────────────────────────
router.get('/:id/pedidos', exigirTipo('cliente'), (req, res) => {
  const { id } = req.params;
  if (req.usuario.id !== id) {
    return res.status(403).json({ sucesso: false, erro: 'Acesso negado.' });
  }
  const pedidos = Pedidos.findAll({ clienteId: id });
  res.json({ sucesso: true, pedidos });
});

module.exports = router;
