alter table public.pedido_itens
add column if not exists updated_at timestamptz not null default timezone('utc', now());
