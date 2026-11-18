-- ============================================================================
-- GIFMint Market — Schema SQL Completo para Supabase
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================================

-- 1. Tabla de perfiles de usuario (roles: 'cliente' | 'admin')
create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre text not null default '',
  avatar_url text default '',
  rol text not null default 'cliente' check (rol in ('admin', 'cliente')),
  created_at timestamptz not null default now()
);

-- 2. Tabla de ventas / órdenes minteadas
create table if not exists public.ventas (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  comprador_email text not null,
  comprador_nombre text not null default '',
  items jsonb not null default '[]'::jsonb,
  cantidad_items integer not null default 1,
  total_usd numeric(10, 2) not null,
  total_eth numeric(12, 6) not null default 0,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'minteado', 'completada')),
  hash_transaccion text not null,
  created_at timestamptz not null default now()
);

-- 3. Tabla de mensajes para chat en tiempo real
create table if not exists public.mensajes (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  autor_nombre text not null,
  autor_email text not null,
  autor_rol text not null default 'cliente' check (autor_rol in ('admin', 'cliente')),
  avatar_url text default '',
  contenido text not null,
  nft_referencia text default '',
  created_at timestamptz not null default now()
);

-- 4. Función helper SECURITY DEFINER para verificar si el usuario es admin sin recursión RLS
create or replace function public.es_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.perfiles
    where id = auth.uid()
      and rol = 'admin'
  );
$$;

-- 5. Trigger automático al registrarse en auth.users -> crea fila en public.perfiles con rol 'cliente'
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, email, nombre, rol)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(coalesce(new.email, 'usuario'), '@', 1)),
    'cliente'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. Habilitar Row Level Security (RLS) en todas las tablas
alter table public.perfiles enable row level security;
alter table public.ventas enable row level security;
alter table public.mensajes enable row level security;

-- ============================================================================
-- Políticas RLS para public.perfiles
-- ============================================================================
drop policy if exists "perfiles_select_authenticated" on public.perfiles;
create policy "perfiles_select_authenticated" on public.perfiles
  for select to authenticated
  using (true);

drop policy if exists "perfiles_insert_own" on public.perfiles;
create policy "perfiles_insert_own" on public.perfiles
  for insert to authenticated
  with check ((select auth.uid()) = id and rol = 'cliente');

drop policy if exists "perfiles_update_own_or_admin" on public.perfiles;
create policy "perfiles_update_own_or_admin" on public.perfiles
  for update to authenticated
  using ((select auth.uid()) = id or public.es_admin())
  with check (
    public.es_admin()
    or (
      (select auth.uid()) = id
      and rol = (select p.rol from public.perfiles p where p.id = auth.uid())
    )
  );

-- ============================================================================
-- Políticas RLS para public.ventas
-- ============================================================================
drop policy if exists "ventas_select_own_or_admin" on public.ventas;
create policy "ventas_select_own_or_admin" on public.ventas
  for select to authenticated
  using ((select auth.uid()) = user_id or public.es_admin());

drop policy if exists "ventas_insert_own" on public.ventas;
create policy "ventas_insert_own" on public.ventas
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "ventas_update_admin" on public.ventas;
create policy "ventas_update_admin" on public.ventas
  for update to authenticated
  using (public.es_admin())
  with check (public.es_admin());

drop policy if exists "ventas_delete_admin" on public.ventas;
create policy "ventas_delete_admin" on public.ventas
  for delete to authenticated
  using (public.es_admin());

-- ============================================================================
-- Políticas RLS para public.mensajes
-- ============================================================================
drop policy if exists "mensajes_select_authenticated" on public.mensajes;
create policy "mensajes_select_authenticated" on public.mensajes
  for select to authenticated
  using (true);

drop policy if exists "mensajes_insert_own" on public.mensajes;
create policy "mensajes_insert_own" on public.mensajes
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "mensajes_delete_own_or_admin" on public.mensajes;
create policy "mensajes_delete_own_or_admin" on public.mensajes
  for delete to authenticated
  using ((select auth.uid()) = user_id or public.es_admin());

-- ============================================================================
-- 7. Habilitar Supabase Realtime para tablas en vivo
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ventas'
  ) then
    alter publication supabase_realtime add table public.ventas;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mensajes'
  ) then
    alter publication supabase_realtime add table public.mensajes;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'perfiles'
  ) then
    alter publication supabase_realtime add table public.perfiles;
  end if;
end $$;

-- ============================================================================
-- 8. Storage: Bucket 'avatars' y políticas RLS (Clase 10 - Diapositivas 12-13)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select to public
  using (bucket_id = 'avatars');

drop policy if exists "subir a mi carpeta" on storage.objects;
create policy "subir a mi carpeta" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "reemplazar mis archivos" on storage.objects;
create policy "reemplazar mis archivos" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "eliminar mis archivos" on storage.objects;
create policy "eliminar mis archivos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ============================================================================
-- 9. Backfill opcional si ya existían usuarios en auth.users antes de este script
-- ============================================================================
insert into public.perfiles (id, email, nombre, rol)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data ->> 'nombre', split_part(coalesce(u.email, 'usuario'), '@', 1)),
  'cliente'
from auth.users u
on conflict (id) do nothing;

-- ============================================================================
-- 10. ASIGNAR ROL ADMIN A UN USUARIO REGISTRADO
-- Registra primero la cuenta en la app (o en Supabase Auth) y luego ejecuta:
-- UPDATE public.perfiles SET rol = 'admin' WHERE email = 'admin@gifmint.com';
-- ============================================================================
