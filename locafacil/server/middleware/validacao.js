// server/middleware/validacao.js
// Validações de campos usando express-validator

const { body, param, validationResult } = require('express-validator');

// ── Capturar erros de validação ───────────────────────
function checarErros(req, res, next) {
  const erros = validationResult(req);
  if (!erros.isEmpty()) {
    return res.status(400).json({
      sucesso: false,
      erro: 'Dados inválidos.',
      detalhes: erros.array().map(e => ({ campo: e.path, mensagem: e.msg }))
    });
  }
  next();
}

// ── Regras de validação ───────────────────────────────
const regras = {
  cadastroCliente: [
    body('nome').trim().notEmpty().withMessage('Nome é obrigatório.')
      .isLength({ min: 3 }).withMessage('Nome deve ter ao menos 3 caracteres.'),
    body('email').isEmail().withMessage('E-mail inválido.').normalizeEmail(),
    body('senha').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres.'),
    body('telefone').optional().trim(),
    body('cep').optional().trim()
  ],

  cadastroAfiliado: [
    body('empresa').trim().notEmpty().withMessage('Nome da empresa é obrigatório.'),
    body('email').isEmail().withMessage('E-mail inválido.').normalizeEmail(),
    body('senha').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres.'),
    body('cnpj').optional().trim(),
    body('telefone').optional().trim(),
    body('cidade').optional().trim(),
    body('estado').optional().trim().isLength({ max: 2 }).withMessage('Estado deve ter 2 letras.')
  ],

  login: [
    body('email').isEmail().withMessage('E-mail inválido.').normalizeEmail(),
    body('senha').notEmpty().withMessage('Senha é obrigatória.')
  ],

  cacamba: [
    body('nome').trim().notEmpty().withMessage('Nome da caçamba é obrigatório.'),
    body('tipo').isIn(['obra','organico','moveis','gesso','vidro','plastico'])
      .withMessage('Tipo inválido.'),
    body('preco').isFloat({ gt: 0 }).withMessage('Preço deve ser maior que zero.'),
    body('capacidade').optional().trim(),
    body('dimensoes').optional().trim(),
    body('peso_max').optional().trim(),
    body('descricao').optional().trim(),
    body('disponivel').optional().isBoolean()
  ],

  pedido: [
    body('cacambaId').notEmpty().withMessage('ID da caçamba é obrigatório.'),
    body('endereco').trim().notEmpty().withMessage('Endereço de entrega é obrigatório.'),
    body('data').isDate().withMessage('Data inválida.'),
    body('dataFim').optional().isDate(),
    body('valor').isFloat({ gt: 0 }).withMessage('Valor deve ser maior que zero.')
  ],

  atualizarStatus: [
    body('status').isIn(['pendente','a-caminho','entregue','recolhida','concluido'])
      .withMessage('Status inválido.')
  ],

  cobertura: [
    body('cidade').trim().notEmpty().withMessage('Cidade é obrigatória.'),
    body('estado').trim().notEmpty().isLength({ max: 2 }).withMessage('Estado deve ter 2 letras.'),
    body('bairro').optional().trim(),
    body('cep_inicio').optional().trim(),
    body('cep_fim').optional().trim()
  ]
};

module.exports = { checarErros, regras };
