# Workflows N8N

Arquivos JSON prontos para importacao no N8N:

1. `01-receber-rotear-mensagem.json`
2. `02-responder-cliente.json`
3. `03-enviar-boleto.json`
4. `04-notificacao-gerente.json`
5. `05-agendador-boletos-cron.json`
6. `06-controle-bot-webhook.json`

## Credenciais esperadas

- Credencial Postgres com nome: `Postgres Bot Boletos`
- Variaveis de ambiente no N8N:
  - `EVOLUTION_API_URL`
  - `EVOLUTION_API_KEY`
  - `EVOLUTION_INSTANCE_NAME`
  - `OPENAI_API_KEY`

## Webhooks usados

- `POST /webhook/whatsapp`
- `POST /webhook/bot-control`
