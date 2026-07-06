# DocesJeh

Projeto unico para abrir direto no VS Code, com:

- `Vue 3 + TypeScript` como base do frontend
- `Quasar` para a camada visual
- `Pinia` para gerenciamento de estado
- `React` embutido no mesmo app via um widget isolado
- `Node.js + Express + Supabase` no backend

## Scripts

```bash
npm install
npm run dev
```

O comando `npm run dev` sobe:

- frontend Vite em `http://localhost:5173`
- backend Node em `http://localhost:3333`

## Ambiente

Crie um `.env` a partir do exemplo:

```bash
copy .env.example .env
```

Variaveis usadas:

- `VITE_API_URL`
- `PORT`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Estrutura

- `src/`: frontend Vue/Quasar/Pinia e widget React
- `server/`: backend Node.js com integracao Supabase
