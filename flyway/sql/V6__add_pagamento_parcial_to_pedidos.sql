alter table public.pedidos
add column if not exists pagamento_parcial numeric(10, 2) not null default 0;

update public.pedidos
set pagamento_parcial = total
where forma_pagamento = 'avista';

alter table public.pedidos
drop constraint if exists pedidos_pagamento_parcial_check;

alter table public.pedidos
add constraint pedidos_pagamento_parcial_check
check (pagamento_parcial >= 0 and pagamento_parcial <= total);

comment on column public.pedidos.pagamento_parcial is 'Valor ja recebido parcialmente no pedido.';
