// server/routes/pedidos.js
// CRUD de pedidos + atualização de status

const express  = require('express');
const router   = express.Router();
const { Pedidos, Cacambas } = require('../models/database');
const { autenticar, exigirTipo } = require('../middleware/auth');
const { regras, checarErros }    = require('../middleware/validacao');

router.use(autenticar);

// ─────────────────────────────────────────────────────
// GET /api/pedidos
// Cliente: seus pedidos / Afiliado: pedidos da empresa
// ─────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const { tipo, id } = req.usuario;
  const filtro = tipo === 'cliente'
    ? { clienteId: id }
    : { afiliadoId: id };
  if (req.query.status) filtro.status = req.query.status;
  res.json({ sucesso: true, pedidos: Pedidos.findAll(filtro) });
});

// ─────────────────────────────────────────────────────
// GET /api/pedidos/relatorio
// Relatório do afiliado logado
// ─────────────────────────────────────────────────────
router.get('/relatorio', exigirTipo('afiliado'), (req, res) => {
  const rel = Pedidos.relatorio(req.usuario.id);
  res.json({ sucesso: true, relatorio: rel });
});

// ─────────────────────────────────────────────────────
// GET /api/pedidos/:id
// ─────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const pedido = Pedidos.findById(req.params.id);
  if (!pedido) return res.status(404).json({ sucesso: false, erro: 'Pedido não encontrado.' });
  // Somente quem pertence ao pedido pode ver
  const { tipo, id } = req.usuario;
  if (tipo === 'cliente' && pedido.clienteId !== id) {
    return res.status(403).json({ sucesso: false, erro: 'Acesso negado.' });
  }
  if (tipo === 'afiliado' && pedido.afiliadoId !== id) {
    return res.status(403).json({ sucesso: false, erro: 'Acesso negado.' });
  }
  res.json({ sucesso: true, pedido });
});

// ─────────────────────────────────────────────────────
// POST /api/pedidos
// Criar pedido (somente cliente autenticado)
// ─────────────────────────────────────────────────────
router.post('/', exigirTipo('cliente'), regras.pedido, checarErros, (req, res) => {
  const { cacambaId, endereco, data, dataFim, valor } = req.body;

  const cacamba = Cacambas.findById(cacambaId);
  if (!cacamba) return res.status(404).json({ sucesso: false, erro: 'Caçamba não encontrada.' });
  if (!cacamba.disponivel) return res.status(400).json({ sucesso: false, erro: 'Caçamba indisponível.' });

  const novo = Pedidos.create({
    clienteId:  req.usuario.id,
    cacambaId,
    afiliadoId: cacamba.afiliadoId,
    status:     'pendente',
    data, dataFim: dataFim || null,
    valor:      parseFloat(valor),
    endereco
  });

  res.status(201).json({ sucesso: true, mensagem: 'Pedido criado com sucesso.', pedido: novo });
});

// ─────────────────────────────────────────────────────
// PATCH /api/pedidos/:id/status
// Atualizar status (somente afiliado dono)
// Fluxo: pendente → a-caminho → entregue → recolhida → concluido
// ─────────────────────────────────────────────────────
router.patch('/:id/status', exigirTipo('afiliado'), regras.atualizarStatus, checarErros, (req, res) => {
  const pedido = Pedidos.findById(req.params.id);
  if (!pedido) return res.status(404).json({ sucesso: false, erro: 'Pedido não encontrado.' });
  if (pedido.afiliadoId !== req.usuario.id) {
    return res.status(403).json({ sucesso: false, erro: 'Acesso negado.' });
  }
  // "recolhida" é tratada como "concluido" no sistema
  const novoStatus = req.body.status === 'recolhida' ? 'concluido' : req.body.status;
  const atualizado = Pedidos.update(req.params.id, { status: novoStatus });
  res.json({ sucesso: true, mensagem: `Status atualizado para "${novoStatus}".`, pedido: atualizado });
});

module.exports = router;
