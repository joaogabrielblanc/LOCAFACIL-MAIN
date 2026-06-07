// server/index.js
// Servidor principal — Node.js + Express
// API RESTful com JWT, bcrypt e CORS

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// ── Middlewares globais ───────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Servir frontend estático ──────────────────────────
// O Express serve os arquivos HTML/CSS/JS do projeto
app.use(express.static(path.join(__dirname, '..')));

// ── Rotas da API ──────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/clientes',  require('./routes/clientes'));
app.use('/api/afiliados', require('./routes/afiliados'));
app.use('/api/cacambas',  require('./routes/cacambas'));
app.use('/api/pedidos',   require('./routes/pedidos'));
app.use('/api/admin',     require('./routes/admin'));

// ── Rota de health check ──────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    sucesso: true,
    status: 'online',
    versao: '1.0.0',
    ambiente: process.env.NODE_ENV || 'development',
    horario: new Date().toISOString()
  });
});

// ── Documentação da API (overview) ───────────────────
app.get('/api', (req, res) => {
  res.json({
    nome: 'LocaFácil API',
    versao: '1.0.0',
    descricao: 'API RESTful para gerenciamento de aluguel de caçambas',
    autenticacao: 'JWT Bearer Token',
    endpoints: {
      auth: {
        'POST /api/auth/cadastro/cliente':  'Cadastrar novo cliente',
        'POST /api/auth/cadastro/afiliado': 'Cadastrar nova empresa',
        'POST /api/auth/login/cliente':     'Login do cliente',
        'POST /api/auth/login/afiliado':    'Login da empresa',
        'GET  /api/auth/me':                'Dados do usuário logado (requer token)'
      },
      clientes: {
        'GET    /api/clientes':            'Listar clientes (afiliado)',
        'GET    /api/clientes/:id':        'Buscar cliente',
        'PUT    /api/clientes/:id':        'Atualizar perfil',
        'DELETE /api/clientes/:id':        'Excluir conta',
        'GET    /api/clientes/:id/pedidos':'Pedidos do cliente'
      },
      afiliados: {
        'GET    /api/afiliados/:id':              'Dados do afiliado',
        'PUT    /api/afiliados/:id':              'Atualizar perfil',
        'DELETE /api/afiliados/:id':              'Excluir conta',
        'GET    /api/afiliados/:id/cobertura':    'Listar áreas de entrega',
        'POST   /api/afiliados/:id/cobertura':    'Adicionar área de entrega',
        'DELETE /api/afiliados/:id/cobertura/:i': 'Remover área de entrega',
        'GET    /api/afiliados/:id/cacambas':     'Caçambas do afiliado'
      },
      cacambas: {
        'GET    /api/cacambas':                       'Listar caçambas (pública) ?cidade=&cep=&tipo=',
        'GET    /api/cacambas/:id':                   'Buscar caçamba',
        'POST   /api/cacambas':                       'Criar caçamba (afiliado)',
        'PUT    /api/cacambas/:id':                   'Atualizar caçamba',
        'PATCH  /api/cacambas/:id/disponibilidade':   'Ativar/pausar',
        'DELETE /api/cacambas/:id':                   'Remover caçamba'
      },
      pedidos: {
        'GET   /api/pedidos':             'Meus pedidos (cliente ou afiliado)',
        'GET   /api/pedidos/relatorio':   'Relatório de vendas (afiliado)',
        'GET   /api/pedidos/:id':         'Buscar pedido',
        'POST  /api/pedidos':             'Criar pedido (cliente)',
        'PATCH /api/pedidos/:id/status':  'Atualizar status (afiliado)'
      }
    }
  });
});

// ── Tratamento de rotas não encontradas ───────────────
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ sucesso: false, erro: `Rota ${req.method} ${req.path} não encontrada.` });
  }
  // Para rotas HTML, serve o index
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ── Tratamento global de erros ────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERRO]', err.message);
  res.status(err.status || 500).json({
    sucesso: false,
    erro: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor.' : err.message
  });
});

// ── Iniciar servidor ──────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log(`║  LocaFácil API — rodando na porta ${PORT}   ║`);
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  Frontend:  http://localhost:${PORT}         ║`);
  console.log(`║  API docs:  http://localhost:${PORT}/api     ║`);
  console.log(`║  Health:    http://localhost:${PORT}/api/health ║`);
  console.log('╚══════════════════════════════════════════╝\n');
});

module.exports = app;
