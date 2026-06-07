# LocaFácil — Plataforma de Aluguel de Caçambas

Site de intermediação entre **clientes** e **empresas (afiliados)** para aluguel de caçambas de entulho, com busca por CEP, painel de empresa, painel de cliente e painel administrativo.

---

## Arquitetura

O projeto tem **duas camadas independentes**:

### 1. Frontend (produção — Vercel)
Roda 100% no navegador. **Não precisa de servidor.** Os dados ficam no **localStorage**, com:
- Senhas com **hash SHA-256** (Web Crypto API) — nunca em texto puro
- **Token de sessão** assinado em base64 com expiração de 7 dias
- CRUD completo de clientes, empresas, caçambas e pedidos

É esta camada que vai para o Vercel.

### 2. Backend (demonstração acadêmica — DBEI)
Servidor **Node.js + Express** que cumpre os requisitos do DBEI:

| Requisito DBEI | Implementação |
|----------------|---------------|
| Linguagem de servidor | **Node.js** |
| Framework | **Express** |
| API RESTful | rotas `/api/auth`, `/api/clientes`, `/api/afiliados`, `/api/cacambas`, `/api/pedidos`, `/api/admin` |
| Autenticação e autorização | **JWT** (token) + middleware de perfil |
| Criptografia | **bcrypt** (hash de senha, salt 10) |
| CRUD de usuário | Cadastro, leitura, edição e exclusão |

Roda localmente com `npm start` e demonstra a mesma lógica no lado do servidor.

---

## Estrutura de Pastas

```
locafacil/
├── index.html                  # Página principal (busca por CEP)
├── style.css
├── vercel.json                 # Config de deploy Vercel
│
├── lib/
│   └── db.js                   # BANCO localStorage (SHA-256 + token) — usado pelo site
│
├── assets/
│   ├── css/                    # Estilos (auth, dashboard, index, paginas)
│   └── js/
│       ├── index.js            # Busca por CEP (ViaCEP + localStorage)
│       ├── login-cliente.js
│       ├── login-afiliado.js
│       ├── dashboard-cliente.js
│       └── dashboard-afiliado.js
│
├── pages/
│   ├── cliente/                # Login + painel do cliente
│   ├── afiliado/               # Login + painel da empresa
│   ├── admin/                  # Login + painel administrativo
│   │   ├── admin-api.js        # Camada de dados do admin (localStorage)
│   │   └── admin-dashboard.js
│   └── publica/                # Suporte + Descarte Correto
│
└── server/                     # BACKEND Node/Express (DBEI)
    ├── index.js                # Servidor Express
    ├── models/database.js      # Modelo em memória
    ├── middleware/
    │   ├── auth.js             # JWT: gerar/verificar token, autorização
    │   └── validacao.js        # express-validator
    ├── routes/                 # auth, clientes, afiliados, cacambas, pedidos, admin
    └── tests/api.test.js       # Testes de integração da API
```

---

## Como rodar

### Site (frontend) — basta abrir
O site funciona abrindo `index.html` no navegador, ou publicando no Vercel.
Os dados são salvos no localStorage do próprio navegador.

### Backend (opcional, para a apresentação DBEI)
```bash
npm install
cp .env.example .env
npm start        # http://localhost:3001
npm test         # roda os testes da API
```

---

## Deploy no Vercel

1. Suba o projeto para o GitHub
2. Em vercel.com → **New Project** → importe o repositório
3. **Framework Preset:** Other · **Build Command:** (vazio) · **Output Directory:** (raiz)
4. Deploy

O `vercel.json` já está configurado para servir os arquivos estáticos.

---

## Contas de Demonstração

| Perfil  | E-mail                | Senha    |
|---------|-----------------------|----------|
| Admin   | admin@locafacil.com   | admin123 |
| Empresa | afiliado@demo.com     | 123456   |
| Cliente | cliente@demo.com      | 123456   |

> O painel admin fica em `pages/admin/login.html` e permite **editar e excluir** clientes e empresas, além de visualizar e exportar o banco.
