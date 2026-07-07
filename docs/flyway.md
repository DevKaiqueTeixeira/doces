# Flyway no projeto

Este projeto usa o `Flyway CLI` local em `.tools/flyway-12.10.0`.

## O que voce precisa do Supabase

Para migrations:

- `project ref` ou host do banco
- `database password`
- usuario do banco, normalmente `postgres`

Para o app/login:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

## Onde encontrar no Supabase

- `Project Settings > API`
  - URL do projeto
  - Publishable key
  - Service role key
- `Project Settings > Database`
  - Host do Postgres
  - Porta
  - Senha do banco

## Arquivos do Flyway

- `flyway/sql/V1__create_usuarios_table.sql`: primeira migration
- `flyway/conf/flyway.local.conf`: configuracao local da conexao
- `scripts/flyway.ps1`: wrapper para executar o CLI local

## Como criar uma nova migration

Padrao de nome:

```text
V2__create_logs_table.sql
V3__create_pedidos_table.sql
V4__add_status_to_pedidos.sql
```

Regras:

- o prefixo `V` indica versionada
- o numero precisa ser unico e crescente
- use nomes curtos e descritivos

## Como rodar

Primeiro, ajuste `flyway/conf/flyway.local.conf` com os dados reais do seu Supabase.

Depois:

```bash
npm run db:flyway:info
npm run db:flyway:validate
npm run db:flyway:migrate
```

## Comandos uteis

Ver versao do Flyway:

```bash
powershell -ExecutionPolicy Bypass -File scripts/flyway.ps1 version
```

Ver migrations conhecidas e aplicadas:

```bash
npm run db:flyway:info
```

Aplicar migrations pendentes:

```bash
npm run db:flyway:migrate
```

Validar consistencia das migrations:

```bash
npm run db:flyway:validate
```

## Fluxo recomendado para este projeto

1. Criar uma migration nova em `flyway/sql`
2. Rodar `npm run db:flyway:validate`
3. Rodar `npm run db:flyway:migrate`
4. Conferir no Supabase se a tabela apareceu
5. So depois integrar a tabela no backend/frontend

## Sobre autenticacao

Para este caso simples, nao precisa usar `Supabase Auth`.

O projeto esta configurado para:

- salvar os dois operadores em `public.usuarios`
- validar o login no backend com `SUPABASE_SERVICE_ROLE_KEY`
- persistir o usuario autenticado no navegador para usar em logs

Se no futuro voce quiser reset de senha, convite por email ou multiplos perfis externos, ai vale migrar para `Supabase Auth`.
