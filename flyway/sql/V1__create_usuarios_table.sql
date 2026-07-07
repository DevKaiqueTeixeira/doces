create extension if not exists pgcrypto;

create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  senha text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.usuarios enable row level security;

comment on table public.usuarios is 'Usuarios internos do painel JessyDoces.';

insert into public.usuarios (nome, senha)
values
  ('jessy', 'jessy1229'),
  ('lis', 'lis1229')
on conflict (nome) do update
set senha = excluded.senha;
