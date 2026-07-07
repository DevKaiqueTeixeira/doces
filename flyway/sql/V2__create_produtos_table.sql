create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  preco numeric(10, 2) not null check (preco >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.produtos enable row level security;

comment on table public.produtos is 'Catalogo de produtos da Jessy Doces.';
