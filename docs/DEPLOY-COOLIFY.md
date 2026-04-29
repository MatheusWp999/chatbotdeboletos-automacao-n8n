# Deploy no Coolify (Projeto com Evolution + N8N ja existentes)

## 1) Criar recurso PostgreSQL dedicado

No mesmo projeto do Coolify:

1. `+ New` -> `Resource` -> `PostgreSQL`
2. Nome sugerido: `postgres-bot-boletos`
3. Deploy
4. Copie a `DATABASE_URL`

## 2) Executar schema

No editor SQL do Postgres novo, rode o arquivo `init.sql` da raiz do repositorio.

## 3) Criar app `painel-web`

1. `+ New` -> `Application`
2. Conecte este repositorio
3. Base directory: `painel-web`
4. Build pack: `Dockerfile`
5. Porta exposta: `3000`

## 4) Variaveis de ambiente do app

Configure no Coolify:

- `PORT=3000`
- `DATABASE_URL=postgresql://...`
- `EVOLUTION_API_URL=http://evolution-api:8080` (ou URL interna do seu servico)
- `EVOLUTION_API_KEY=...`
- `EVOLUTION_INSTANCE_NAME=bot-boletos`
- `N8N_URL=http://n8n:5678` (ou URL interna do seu servico)
- `OPENAI_API_KEY=sk-...`
- `JWT_SECRET=...`
- `PDF_STORAGE_PATH=/pdfs`

## 5) Volume persistente para PDFs

No app `painel-web`:

1. Aba de storage
2. Adicione volume com mount path `/pdfs`

## 6) Importar workflows no N8N

Importe os 6 arquivos de `n8n/workflows`.

Depois ajuste no N8N:

- Credencial Postgres
- Variaveis de ambiente (`EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE_NAME`, `OPENAI_API_KEY`)
- Ative os workflows

## 7) Ajustes na Evolution API

Garanta que o webhook global da instancia aponta para:

- `POST /webhook/whatsapp` no N8N

## 8) Checklist de validacao final

1. Cadastrar cliente no painel
2. Cadastrar boleto PDF
3. Enviar boleto manual (`Enviar agora`)
4. Testar conversa via WhatsApp
5. Validar logs em `mensagens`
6. Testar toggle bot ligado/desligado
7. Validar alerta para gerente
