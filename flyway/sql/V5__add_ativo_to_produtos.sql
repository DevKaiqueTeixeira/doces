alter table public.produtos
add column if not exists ativo boolean not null default true;

update public.produtos
set ativo = true
where ativo is distinct from true and ativo is null;
