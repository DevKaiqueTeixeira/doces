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

Migracoes com Flyway:

```bash
npm run db:flyway:info
npm run db:flyway:validate
npm run db:flyway:migrate
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
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `PORT`
- `SUPABASE_SECRET_KEY`

Para o Flyway, a conexao com o Postgres do Supabase fica em:

- `flyway/conf/flyway.local.conf`

Valores que voce precisa preencher nesse arquivo:

- `flyway.url`: host JDBC do banco do Supabase
- `flyway.user`: normalmente `postgres`
- `flyway.password`: senha do banco

Onde pegar no painel do Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`: `Project Settings > API`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: `Project Settings > API`
- `SUPABASE_SERVICE_ROLE_KEY`: `Project Settings > API`
- `host do banco` e `senha do banco`: `Project Settings > Database`

## Estrutura

- `src/`: frontend Vue/Quasar/Pinia e widget React
- `server/`: backend Node.js com integracao Supabase
- `flyway/sql`: migrations SQL versionadas
- `scripts/flyway.ps1`: atalho local para executar o Flyway instalado no projeto
