-- =====================================================================
-- Brechó Solidário — banco de dados (Supabase / PostgreSQL)
-- Rode este arquivo inteiro no Supabase: SQL Editor > New query > Run.
-- Pode ser rodado de novo sem perder dados (usa IF NOT EXISTS / OR REPLACE).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Perfis (quem usa o painel)
--    papel: admin | voluntario | pendente (aguardando aprovação)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  papel text not null default 'pendente' check (papel in ('admin','voluntario','pendente')),
  criado_em timestamptz not null default now()
);

-- Funções auxiliares usadas nas políticas (security definer evita recursão no RLS)
create or replace function public.papel_atual() returns text
language sql stable security definer set search_path = public as $$
  select papel from public.profiles where id = auth.uid()
$$;

create or replace function public.is_membro() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.papel_atual() in ('admin','voluntario'), false)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.papel_atual() = 'admin', false)
$$;

-- Cria o perfil quando alguém se cadastra. O PRIMEIRO cadastro vira admin.
create or replace function public.criar_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome, papel)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    case when exists (select 1 from public.profiles) then 'pendente' else 'admin' end
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.criar_perfil();

-- ---------------------------------------------------------------------
-- 2. Doações (lotes recebidos)
-- ---------------------------------------------------------------------
create table if not exists public.doacoes (
  id uuid primary key default gen_random_uuid(),
  doador_nome text not null default 'Anônimo',
  doador_contato text,
  quantidade int not null default 1 check (quantidade > 0),
  observacao text,
  registrado_por uuid references public.profiles(id) default auth.uid(),
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. Peças (estoque)
-- ---------------------------------------------------------------------
create sequence if not exists public.pecas_codigo_seq;

create table if not exists public.pecas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default ('P' || lpad(nextval('public.pecas_codigo_seq')::text, 5, '0')),
  titulo text not null,
  descricao text,
  categoria text not null default 'Outros',
  tamanho text not null default 'Único',
  genero text not null default 'Unissex',
  cor text,
  estado text not null default 'Bom' check (estado in ('Novo','Ótimo','Bom','Regular')),
  preco numeric(10,2) not null default 0 check (preco >= 0),
  status text not null default 'triagem'
    check (status in ('triagem','disponivel','reservada','vendida','repassada')),
  foto_url text,
  doacao_id uuid references public.doacoes(id) on delete set null,
  criado_por uuid references public.profiles(id) default auth.uid(),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists pecas_status_idx on public.pecas(status);
create index if not exists pecas_criado_idx on public.pecas(criado_em desc);

create or replace function public.tocar_atualizado() returns trigger
language plpgsql as $$ begin new.atualizado_em := now(); return new; end $$;

drop trigger if exists pecas_atualizado on public.pecas;
create trigger pecas_atualizado before update on public.pecas
  for each row execute function public.tocar_atualizado();

-- ---------------------------------------------------------------------
-- 4. Reservas (feitas pela vitrine pública)
-- ---------------------------------------------------------------------
create table if not exists public.reservas (
  id uuid primary key default gen_random_uuid(),
  peca_id uuid not null references public.pecas(id) on delete cascade,
  cliente_nome text not null,
  cliente_telefone text not null,
  status text not null default 'pendente' check (status in ('pendente','concluida','cancelada')),
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. Vendas
-- ---------------------------------------------------------------------
create table if not exists public.vendas (
  id uuid primary key default gen_random_uuid(),
  subtotal numeric(10,2) not null,
  desconto numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  forma_pagamento text not null check (forma_pagamento in ('Dinheiro','Pix','Cartão')),
  cliente_nome text,
  vendedor_id uuid references public.profiles(id) default auth.uid(),
  cancelada boolean not null default false,
  criado_em timestamptz not null default now()
);

create table if not exists public.venda_itens (
  venda_id uuid not null references public.vendas(id) on delete cascade,
  peca_id uuid not null references public.pecas(id),
  preco numeric(10,2) not null,
  primary key (venda_id, peca_id)
);

-- ---------------------------------------------------------------------
-- 6. Colaboração: mural (comunicação), tarefas (coordenação),
--    atividades (percepção), avaliações do sistema (validação)
-- ---------------------------------------------------------------------
create table if not exists public.avisos (
  id uuid primary key default gen_random_uuid(),
  texto text not null check (length(texto) between 1 and 1000),
  autor_id uuid references public.profiles(id) default auth.uid(),
  criado_em timestamptz not null default now()
);

create table if not exists public.tarefas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  status text not null default 'a_fazer' check (status in ('a_fazer','fazendo','feito')),
  responsavel_id uuid references public.profiles(id) on delete set null,
  data_prevista date,
  criado_por uuid references public.profiles(id) default auth.uid(),
  criado_em timestamptz not null default now()
);

create table if not exists public.atividades (
  id bigint generated always as identity primary key,
  autor_id uuid references public.profiles(id) on delete set null,
  descricao text not null,
  criado_em timestamptz not null default now()
);
create index if not exists atividades_criado_idx on public.atividades(criado_em desc);

create table if not exists public.avaliacoes (
  id uuid primary key default gen_random_uuid(),
  respostas int[] not null check (array_length(respostas, 1) = 10),
  pontuacao numeric(5,1) not null,
  perfil text,
  comentario text,
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 7. Registro automático de atividades (mecanismo de percepção)
-- ---------------------------------------------------------------------
create or replace function public.registrar_atividade(p_texto text) returns void
language sql security definer set search_path = public as $$
  insert into public.atividades (autor_id, descricao) values (auth.uid(), p_texto)
$$;

create or replace function public.log_pecas() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.registrar_atividade('cadastrou a peça ' || new.codigo || ' – ' || new.titulo);
  elsif new.status is distinct from old.status and new.status not in ('vendida','reservada') then
    perform public.registrar_atividade('mudou a peça ' || new.codigo || ' para "' || new.status || '"');
  end if;
  return new;
end $$;
drop trigger if exists pecas_log on public.pecas;
create trigger pecas_log after insert or update on public.pecas
  for each row execute function public.log_pecas();

create or replace function public.log_doacoes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.registrar_atividade('registrou uma doação de ' || new.quantidade || ' peça(s) de ' || new.doador_nome);
  return new;
end $$;
drop trigger if exists doacoes_log on public.doacoes;
create trigger doacoes_log after insert on public.doacoes
  for each row execute function public.log_doacoes();

create or replace function public.log_avisos() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.registrar_atividade('publicou um aviso no mural');
  return new;
end $$;
drop trigger if exists avisos_log on public.avisos;
create trigger avisos_log after insert on public.avisos
  for each row execute function public.log_avisos();

create or replace function public.log_tarefas() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.registrar_atividade('criou a tarefa "' || new.titulo || '"');
  elsif new.status is distinct from old.status and new.status = 'feito' then
    perform public.registrar_atividade('concluiu a tarefa "' || new.titulo || '"');
  end if;
  return new;
end $$;
drop trigger if exists tarefas_log on public.tarefas;
create trigger tarefas_log after insert or update on public.tarefas
  for each row execute function public.log_tarefas();

-- ---------------------------------------------------------------------
-- 8. Operações atômicas (RPC)
-- ---------------------------------------------------------------------

-- Reserva pela vitrine (qualquer visitante). Só reserva peça disponível.
create or replace function public.reservar_peca(p_peca uuid, p_nome text, p_telefone text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_codigo text;
begin
  if length(trim(coalesce(p_nome,''))) < 2 or length(regexp_replace(coalesce(p_telefone,''), '\D', '', 'g')) < 10 then
    raise exception 'Informe nome e telefone com DDD.';
  end if;
  update public.pecas set status = 'reservada'
   where id = p_peca and status = 'disponivel'
   returning codigo into v_codigo;
  if v_codigo is null then
    raise exception 'Esta peça não está mais disponível.';
  end if;
  insert into public.reservas (peca_id, cliente_nome, cliente_telefone)
  values (p_peca, left(trim(p_nome), 100), left(trim(p_telefone), 20))
  returning id into v_id;
  insert into public.atividades (autor_id, descricao)
  values (null, left(trim(p_nome), 40) || ' reservou a peça ' || v_codigo || ' pela vitrine');
  return v_id;
end $$;

-- Cancela uma reserva e devolve a peça para a vitrine.
create or replace function public.cancelar_reserva(p_reserva uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_peca uuid;
begin
  if not public.is_membro() then raise exception 'Sem permissão.'; end if;
  update public.reservas set status = 'cancelada'
   where id = p_reserva and status = 'pendente' returning peca_id into v_peca;
  if v_peca is null then raise exception 'Reserva não encontrada ou já finalizada.'; end if;
  update public.pecas set status = 'disponivel' where id = v_peca and status = 'reservada';
  perform public.registrar_atividade('cancelou uma reserva');
end $$;

-- Registra uma venda de forma atômica: ou todas as peças são vendidas, ou nenhuma.
create or replace function public.registrar_venda(
  p_pecas uuid[], p_desconto numeric, p_forma text, p_cliente text
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_venda uuid; v_subtotal numeric; v_qtd int; v_desc numeric := greatest(coalesce(p_desconto, 0), 0);
begin
  if not public.is_membro() then raise exception 'Sem permissão.'; end if;
  if p_pecas is null or array_length(p_pecas, 1) is null then raise exception 'Nenhuma peça no carrinho.'; end if;

  -- trava as peças para evitar venda duplicada simultânea
  perform 1 from public.pecas where id = any(p_pecas) for update;

  select count(*), coalesce(sum(preco), 0) into v_qtd, v_subtotal
    from public.pecas where id = any(p_pecas) and status in ('disponivel','reservada');
  if v_qtd <> array_length(p_pecas, 1) then
    raise exception 'Uma ou mais peças já foram vendidas ou não estão à venda.';
  end if;
  if v_desc > v_subtotal then raise exception 'Desconto maior que o valor da venda.'; end if;

  insert into public.vendas (subtotal, desconto, total, forma_pagamento, cliente_nome)
  values (v_subtotal, v_desc, v_subtotal - v_desc, p_forma, nullif(trim(coalesce(p_cliente, '')), ''))
  returning id into v_venda;

  insert into public.venda_itens (venda_id, peca_id, preco)
    select v_venda, id, preco from public.pecas where id = any(p_pecas);

  update public.pecas set status = 'vendida' where id = any(p_pecas);
  update public.reservas set status = 'concluida' where peca_id = any(p_pecas) and status = 'pendente';

  perform public.registrar_atividade('vendeu ' || v_qtd || ' peça(s) por R$ ' ||
    replace(to_char(v_subtotal - v_desc, 'FM999999990.00'), '.', ','));
  return v_venda;
end $$;

-- Cancela a venda e devolve as peças ao estoque.
create or replace function public.cancelar_venda(p_venda uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Só administradores cancelam vendas.'; end if;
  update public.vendas set cancelada = true where id = p_venda and not cancelada;
  if not found then raise exception 'Venda não encontrada ou já cancelada.'; end if;
  update public.pecas set status = 'disponivel'
   where id in (select peca_id from public.venda_itens where venda_id = p_venda);
  perform public.registrar_atividade('cancelou uma venda e devolveu as peças ao estoque');
end $$;

-- Números públicos de impacto (para a vitrine, sem expor dados internos)
create or replace function public.impacto_publico()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'reaproveitadas', (select count(*) from public.pecas where status in ('vendida','repassada')),
    'disponiveis',    (select count(*) from public.pecas where status = 'disponivel'),
    'doacoes',        (select coalesce(sum(quantidade), 0) from public.doacoes)
  )
$$;

-- Avaliação SUS anônima (calcula a nota no servidor)
create or replace function public.enviar_avaliacao(p_respostas int[], p_perfil text, p_comentario text)
returns numeric language plpgsql security definer set search_path = public as $$
declare v_soma int := 0; i int;
begin
  if array_length(p_respostas, 1) <> 10 then raise exception 'Responda as 10 perguntas.'; end if;
  for i in 1..10 loop
    if p_respostas[i] not between 1 and 5 then raise exception 'Resposta inválida.'; end if;
    -- SUS: ímpares = resposta-1 ; pares = 5-resposta
    v_soma := v_soma + case when i % 2 = 1 then p_respostas[i] - 1 else 5 - p_respostas[i] end;
  end loop;
  insert into public.avaliacoes (respostas, pontuacao, perfil, comentario)
  values (p_respostas, v_soma * 2.5, left(p_perfil, 40), left(p_comentario, 1000));
  return v_soma * 2.5;
end $$;

-- Somente quem deve pode chamar cada função
revoke all on function public.reservar_peca(uuid, text, text) from public;
revoke all on function public.cancelar_reserva(uuid) from public;
revoke all on function public.registrar_venda(uuid[], numeric, text, text) from public;
revoke all on function public.cancelar_venda(uuid) from public;
revoke all on function public.impacto_publico() from public;
revoke all on function public.enviar_avaliacao(int[], text, text) from public;
revoke all on function public.registrar_atividade(text) from public, anon;
grant execute on function public.reservar_peca(uuid, text, text) to anon, authenticated;
grant execute on function public.impacto_publico() to anon, authenticated;
grant execute on function public.enviar_avaliacao(int[], text, text) to anon, authenticated;
grant execute on function public.cancelar_reserva(uuid) to authenticated;
grant execute on function public.registrar_venda(uuid[], numeric, text, text) to authenticated;
grant execute on function public.cancelar_venda(uuid) to authenticated;
grant execute on function public.registrar_atividade(text) to authenticated;

-- ---------------------------------------------------------------------
-- 9. Segurança (Row Level Security)
-- ---------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.doacoes     enable row level security;
alter table public.pecas       enable row level security;
alter table public.reservas    enable row level security;
alter table public.vendas      enable row level security;
alter table public.venda_itens enable row level security;
alter table public.avisos      enable row level security;
alter table public.tarefas     enable row level security;
alter table public.atividades  enable row level security;
alter table public.avaliacoes  enable row level security;

-- remove políticas antigas para poder rodar o arquivo de novo
do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- perfis: todo logado vê o próprio; membros veem todos; admin altera papéis
create policy perfil_ver on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_membro());
create policy perfil_editar_proprio on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and papel = public.papel_atual());
create policy perfil_admin on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- peças: vitrine pública vê só as disponíveis; membros fazem o resto
create policy pecas_publico on public.pecas for select to anon, authenticated
  using (status = 'disponivel' or public.is_membro());
create policy pecas_inserir on public.pecas for insert to authenticated with check (public.is_membro());
create policy pecas_editar  on public.pecas for update to authenticated using (public.is_membro()) with check (public.is_membro());
create policy pecas_excluir on public.pecas for delete to authenticated using (public.is_admin());

-- tabelas internas: somente membros
create policy doacoes_ver     on public.doacoes for select to authenticated using (public.is_membro());
create policy doacoes_inserir on public.doacoes for insert to authenticated with check (public.is_membro());
create policy doacoes_excluir on public.doacoes for delete to authenticated using (public.is_admin());

create policy reservas_ver on public.reservas for select to authenticated using (public.is_membro());

create policy vendas_ver on public.vendas for select to authenticated using (public.is_membro());
create policy itens_ver  on public.venda_itens for select to authenticated using (public.is_membro());

create policy avisos_ver     on public.avisos for select to authenticated using (public.is_membro());
create policy avisos_inserir on public.avisos for insert to authenticated with check (public.is_membro());
create policy avisos_excluir on public.avisos for delete to authenticated
  using (autor_id = auth.uid() or public.is_admin());

create policy tarefas_ver     on public.tarefas for select to authenticated using (public.is_membro());
create policy tarefas_inserir on public.tarefas for insert to authenticated with check (public.is_membro());
create policy tarefas_editar  on public.tarefas for update to authenticated using (public.is_membro()) with check (public.is_membro());
create policy tarefas_excluir on public.tarefas for delete to authenticated using (public.is_admin() or criado_por = auth.uid());

create policy atividades_ver on public.atividades for select to authenticated using (public.is_membro());

create policy avaliacoes_ver on public.avaliacoes for select to authenticated using (public.is_membro());

-- ---------------------------------------------------------------------
-- 10. Fotos das peças (Storage)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pecas', 'pecas', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists fotos_ler on storage.objects;
drop policy if exists fotos_enviar on storage.objects;
drop policy if exists fotos_alterar on storage.objects;
drop policy if exists fotos_apagar on storage.objects;
create policy fotos_ler on storage.objects for select to anon, authenticated using (bucket_id = 'pecas');
create policy fotos_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'pecas' and public.is_membro());
create policy fotos_alterar on storage.objects for update to authenticated
  using (bucket_id = 'pecas' and public.is_membro());
create policy fotos_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'pecas' and public.is_membro());

-- ---------------------------------------------------------------------
-- 11. Tempo real no mural e no feed de atividades
-- ---------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.avisos;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.atividades;
exception when duplicate_object then null; when undefined_object then null; end $$;
