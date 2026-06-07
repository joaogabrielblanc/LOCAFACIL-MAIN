// server/routes/afiliados.js
// Perfil, cobertura e relatório dos afiliados

const express  = require('express');
const router   = express.Router();
const { Afiliados, Cacambas, Pedidos } = require('../models/database');
const { autenticar, exigirTipo } = require('../middleware/auth');
const { regras, checarErros }    = require('../middleware/validacao');

router.use(autenticar);

// ─────────────────────────────────────────────────────
// GET /api/afiliados/:id
// ─────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const { id } = req.params;
  if (req.usuario.tipo === 'afiliado' && req.usuario.id !== id) {
    return res.status(403).json({ sucesso: false, erro: 'Acesso negado.' });
  }
  const af = Afiliados.findById(id);
  if (!af) return res.status(404).json({ sucesso: false, erro: 'Afiliado não encontrado.' });
  const { senha_hash, ...dados } = af;
  res.json({ sucesso: true, afiliado: dados });
});

// ─────────────────────────────────────────────────────
// PUT /api/afiliados/:id
// Atualiza perfil da empresa
// ─────────────────────────────────────────────────────
router.put('/:id', exigirTipo('afiliado'), (req, res) => {
  if (req.usuario.id !== req.params.id) {
    return res.status(403).json({ sucesso: false, erro: 'Acesso negado.' });
  }
  const { empresa, cnpj, telefone, cidade, estado } = req.body;
  const atualizado = Afiliados.update(req.params.id, { empresa, cnpj, telefone, cidade, estado });
  if (!atualizado) return res.status(404).json({ sucesso: false, erro: 'Afiliado não encontrado.' });
  res.json({ sucesso: true, mensagem: 'Perfil atualizado.', afiliado: atualizado });
});

// ─────────────────────────────────────────────────────
// GET /api/afiliados/:id/cobertura
// Lista áreas de entrega
// ─────────────────────────────────────────────────────
router.get('/:id/cobertura', exigirTipo('afiliado'), (req, res) => {
  if (req.usuario.id !== req.params.id) {
    return res.status(403).json({ sucesso: false, erro: 'Acesso negado.' });
  }
  const af = Afiliados.findById(req.params.id);
  if (!af) return res.status(404).json({ sucesso: false, erro: 'Afiliado não encontrado.' });
  res.json({ sucesso: true, cobertura: af.cobertura || [] });
});

// ─────────────────────────────────────────────────────
// POST /api/afiliados/:id/cobertura
// Adiciona uma nova região de entrega
// ─────────────────────────────────────────────────────
router.post('/:id/cobertura', exigirTipo('afiliado'), regras.cobertura, checarErros, (req, res) => {
  if (req.usuario.id !== req.params.id) {
    return res.status(403).json({ sucesso: false, erro: 'Acesso negado.' });
  }
  const af = Afiliados.findById(req.params.id);
  if (!af) return res.status(404).json({ sucesso: false, erro: 'Afiliado não encontrado.' });

  const { cidade, estado, bairro, cep_inicio, cep_fim } = req.body;
  const novaRegiao = { cidade, estado: estado.toUpperCase(), bairro: bairro || '', cep_inicio: cep_inicio || '', cep_fim: cep_fim || '' };

  const cobertura = [...(af.cobertura || []), novaRegiao];
  Afiliados.update(req.params.id, { cobertura });

  res.status(201).json({ sucesso: true, mensagem: 'Região adicionada.', cobertura });
});

// ─────────────────────────────────────────────────────
// DELETE /api/afiliados/:id/cobertura/:idx
// Remove região pelo índice
// ─────────────────────────────────────────────────────
router.delete('/:id/cobertura/:idx', exigirTipo('afiliado'), (req, res) => {
  if (req.usuario.id !== req.params.id) {
    return res.status(403).json({ sucesso: false, erro: 'Acesso negado.' });
  }
  const af = Afiliados.findById(req.params.id);
  if (!af) return res.status(404).json({ sucesso: false, erro: 'Afiliado não encontrado.' });

  const cobertura = [...(af.cobertura || [])];
  const idx = parseInt(req.params.idx, 10);
  if (idx < 0 || idx >= cobertura.length) {
    return res.status(400).json({ sucesso: false, erro: 'Índice inválido.' });
  }
  cobertura.splice(idx, 1);
  Afiliados.update(req.params.id, { cobertura });

  res.json({ sucesso: true, mensagem: 'Região removida.', cobertura });
});

// ─────────────────────────────────────────────────────
// GET /api/afiliados/:id/cacambas
// Lista caçambas do afiliado
// ─────────────────────────────────────────────────────
router.get('/:id/cacambas', exigirTipo('afiliado'), (req, res) => {
  if (req.usuario.id !== req.params.id) {
    return res.status(403).json({ sucesso: false, erro: 'Acesso negado.' });
  }
  const cacambas = Cacambas.findAll({ afiliadoId: req.params.id });
  res.json({ sucesso: true, cacambas });
});

// ─────────────────────────────────────────────────────
// DELETE /api/afiliados/:id
// Exclui conta do afiliado
// ─────────────────────────────────────────────────────
router.delete('/:id', exigirTipo('afiliado'), (req, res) => {
  if (req.usuario.id !== req.params.id) {
    return res.status(403).json({ sucesso: false, erro: 'Acesso negado.' });
  }
  const ok = Afiliados.delete(req.params.id);
  if (!ok) return res.status(404).json({ sucesso: false, erro: 'Afiliado não encontrado.' });
  res.json({ sucesso: true, mensagem: 'Conta excluída com sucesso.' });
});

module.exports = router;
