create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_nome text not null,
  forma_pagamento text not null check (forma_pagamento in ('aberto', 'avista')),
  total numeric(10, 2) not null check (total >= 0),
  usuario_id uuid references public.usuarios(id),
  usuario_nome text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pedido_itens (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  produto_id uuid not null references public.produtos(id),
  produto_nome text not null,
  quantidade integer not null check (quantidade > 0),
  preco_unitario numeric(10, 2) not null check (preco_unitario >= 0),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.pedidos enable row level security;
alter table public.pedido_itens enable row level security;

comment on table public.pedidos is 'Pedidos cadastrados no painel da Jessy Doces.';
comment on table public.pedido_itens is 'Itens vinculados aos pedidos da Jessy Doces.';
