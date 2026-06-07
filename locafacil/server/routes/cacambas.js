// server/routes/cacambas.js
// CRUD de caçambas + busca pública por localidade

const express  = require('express');
const router   = express.Router();
const { Cacambas, Afiliados } = require('../models/database');
const { autenticar, exigirTipo } = require('../middleware/auth');
const { regras, checarErros }    = require('../middleware/validacao');

// ─────────────────────────────────────────────────────
// GET /api/cacambas
// Lista caçambas disponíveis (pública)
// Query: ?cidade=&estado=&cep=&tipo=
// ─────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const { cidade, estado, cep, tipo } = req.query;

  let lista;
  if (cidade || cep) {
    const cepNum = cep ? parseInt(cep.replace(/\D/g, ''), 10) : 0;
    lista = Cacambas.buscarPorLocalidade(cidade || '', estado || '', cepNum);
  } else {
    lista = Cacambas.findAll({ disponivel: true });
  }

  if (tipo) lista = lista.filter(c => c.tipo === tipo);

  // Enriquecer com nome da empresa
  const afiliados = {};
  Afiliados.findAll().forEach(a => (afiliados[a.id] = a));
  const enriquecido = lista.map(c => ({
    ...c,
    empresa: afiliados[c.afiliadoId]?.empresa || '',
    cidadeEmpresa: afiliados[c.afiliadoId]?.cidade || '',
    estadoEmpresa: afiliados[c.afiliadoId]?.estado || ''
  }));

  res.json({ sucesso: true, total: enriquecido.length, cacambas: enriquecido });
});

// ─────────────────────────────────────────────────────
// GET /api/cacambas/:id
// Busca caçamba por ID (pública)
// ─────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const cacamba = Cacambas.findById(req.params.id);
  if (!cacamba) return res.status(404).json({ sucesso: false, erro: 'Caçamba não encontrada.' });
  res.json({ sucesso: true, cacamba });
});

// ─────────────────────────────────────────────────────
// POST /api/cacambas
// Cria nova caçamba (afiliado autenticado)
// ─────────────────────────────────────────────────────
router.post('/', autenticar, exigirTipo('afiliado'), regras.cacamba, checarErros, (req, res) => {
  const { nome, tipo, capacidade, dimensoes, peso_max, preco, descricao, imagem, disponivel } = req.body;

  const nova = Cacambas.create({
    afiliadoId: req.usuario.id,
    nome, tipo, capacidade, dimensoes, peso_max,
    preco: parseFloat(preco),
    descricao: descricao || '',
    imagem: imagem || null,
    disponivel: disponivel !== false
  });

  res.status(201).json({ sucesso: true, mensagem: 'Caçamba cadastrada.', cacamba: nova });
});

// ─────────────────────────────────────────────────────
// PUT /api/cacambas/:id
// Atualiza caçamba (somente o afiliado dono)
// ─────────────────────────────────────────────────────
router.put('/:id', autenticar, exigirTipo('afiliado'), regras.cacamba, checarErros, (req, res) => {
  const cacamba = Cacambas.findById(req.params.id);
  if (!cacamba) return res.status(404).json({ sucesso: false, erro: 'Caçamba não encontrada.' });
  if (cacamba.afiliadoId !== req.usuario.id) {
    return res.status(403).json({ sucesso: false, erro: 'Você não é o dono desta caçamba.' });
  }
  const { nome, tipo, capacidade, dimensoes, peso_max, preco, descricao, imagem, disponivel } = req.body;
  const atualizada = Cacambas.update(req.params.id, {
    nome, tipo, capacidade, dimensoes, peso_max,
    preco: parseFloat(preco), descricao, imagem,
    disponivel: Boolean(disponivel)
  });
  res.json({ sucesso: true, mensagem: 'Caçamba atualizada.', cacamba: atualizada });
});

// ─────────────────────────────────────────────────────
// PATCH /api/cacambas/:id/disponibilidade
// Ativar / pausar disponibilidade
// ─────────────────────────────────────────────────────
router.patch('/:id/disponibilidade', autenticar, exigirTipo('afiliado'), (req, res) => {
  const cacamba = Cacambas.findById(req.params.id);
  if (!cacamba) return res.status(404).json({ sucesso: false, erro: 'Caçamba não encontrada.' });
  if (cacamba.afiliadoId !== req.usuario.id) {
    return res.status(403).json({ sucesso: false, erro: 'Acesso negado.' });
  }
  const atualizada = Cacambas.update(req.params.id, { disponivel: !cacamba.disponivel });
  res.json({ sucesso: true, mensagem: `Caçamba ${atualizada.disponivel ? 'ativada' : 'pausada'}.`, cacamba: atualizada });
});

// ─────────────────────────────────────────────────────
// DELETE /api/cacambas/:id
// Remove caçamba (somente o dono)
// ─────────────────────────────────────────────────────
router.delete('/:id', autenticar, exigirTipo('afiliado'), (req, res) => {
  const cacamba = Cacambas.findById(req.params.id);
  if (!cacamba) return res.status(404).json({ sucesso: false, erro: 'Caçamba não encontrada.' });
  if (cacamba.afiliadoId !== req.usuario.id) {
    return res.status(403).json({ sucesso: false, erro: 'Acesso negado.' });
  }
  Cacambas.delete(req.params.id);
  res.json({ sucesso: true, mensagem: 'Caçamba removida.' });
});

module.exports = router;
