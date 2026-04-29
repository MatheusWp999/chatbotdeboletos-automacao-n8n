# painel-web

Aplicacao unica com:

- API Express (`server/index.js`)
- Frontend React + Vite (`src/`)
- Upload de PDFs para `PDF_STORAGE_PATH`

## Rodar local

1. Copie `.env.example` da raiz para `.env` dentro de `painel-web`.
2. Instale dependencias:

```bash
npm install
```

3. Modo desenvolvimento (API + frontend):

```bash
npm run dev
```

4. Build de producao:

```bash
npm run build
npm run start
```
