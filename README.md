# chatbotdeboletos-automacao-n8n

Sistema de distribuicao automatizada de boletos via WhatsApp com:

- Evolution API v2 (ja existente no seu projeto Coolify)
- N8N (ja existente no seu projeto Coolify)
- PostgreSQL dedicado para o bot/painel
- Painel web React + Vite com backend Express no mesmo deploy

## Estrutura

```txt
chatbotdeboletos-automacao-n8n/
├── painel-web/
│   ├── server/               # API Express
│   ├── src/                  # Frontend React
│   └── Dockerfile
├── n8n/
│   ├── README.md
│   └── workflows/            # 6 workflows JSON
├── docs/
│   └── DEPLOY-COOLIFY.md
├── init.sql
└── .env.example
```

## Endpoints da API do painel

- `GET /api/conversas`
- `GET /api/conversas/:id/mensagens`
- `POST /api/conversas/:id/mensagem`
- `GET /api/clientes`
- `POST /api/clientes`
- `PUT /api/clientes/:id`
- `DELETE /api/clientes/:id`
- `GET /api/boletos`
- `POST /api/boletos`
- `POST /api/boletos/:id/enviar`
- `DELETE /api/boletos/:id`
- `GET /api/configuracao`
- `PUT /api/configuracao`
- `GET /api/gerentes`
- `POST /api/bot-control`
- `GET /api/alertas`

## Execucao local rapida

1. Crie banco PostgreSQL e execute `init.sql`.
2. Configure `.env` com base em `.env.example`.
3. Em `painel-web/`:

```bash
npm install
npm run dev
```

## Deploy em producao

Siga o guia em `docs/DEPLOY-COOLIFY.md`.
