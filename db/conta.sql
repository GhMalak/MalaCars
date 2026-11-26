-- Cole no SQL Editor do Supabase e clique em Run.
-- Perfil do usuário, equipe por convite, preferências e registro de segurança.
-- Pode rodar mais de uma vez sem problema.

-- ---------- Perfil ----------
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists preferences jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists last_seen_at timestamptz;

-- ---------- Foto do motorista (avatar) ----------
alter table public.drivers add column if not exists photo_path text;

-- ---------- Código de convite da empresa ----------
alter table public.organizations add column if not exists invite_code text;
create unique index if not exists idx_organizations_invite_code on public.organizations(invite_code);

update public.organizations
set invite_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where invite_code is null;

-- ---------- Helper: o usuário logado é admin? ----------
-- security definer para não disparar RLS de novo dentro das próprias políticas.
create or replace function public.auth_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- ---------- Políticas: renomear empresa e gerenciar equipe ----------
drop policy if exists org_update on public.organizations;
create policy org_update on public.organizations for update
  using (id = auth_org_id() and auth_is_admin());

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles for update
  using (organization_id = auth_org_id() and auth_is_admin());

-- ---------- Gerar um novo código de convite ----------
create or replace function public.rotate_invite_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target_org uuid;
  new_code text;
begin
  select organization_id into target_org from public.profiles where id = auth.uid();
  if target_org is null then
    raise exception 'Perfil não encontrado.';
  end if;
  if not public.auth_is_admin() then
    raise exception 'Apenas administradores podem gerar convites.';
  end if;

  new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  update public.organizations set invite_code = new_code where id = target_org;
  return new_code;
end;
$$;

-- ---------- Registro de eventos de segurança ----------
create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event text not null,
  detail text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_security_events_org on public.security_events(organization_id, created_at desc);
create index if not exists idx_security_events_user on public.security_events(user_id, created_at desc);

alter table public.security_events enable row level security;

drop policy if exists security_events_select on public.security_events;
drop policy if exists security_events_insert on public.security_events;

-- Cada um vê o histórico da própria empresa; admin vê de todos os colegas.
create policy security_events_select on public.security_events for select
  using (user_id = auth.uid() or (organization_id = auth_org_id() and auth_is_admin()));

create policy security_events_insert on public.security_events for insert
  with check (user_id = auth.uid());

-- ---------- Avatares ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatares', 'avatares', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists avatares_select on storage.objects;
drop policy if exists avatares_insert on storage.objects;
drop policy if exists avatares_update on storage.objects;
drop policy if exists avatares_delete on storage.objects;

create policy avatares_select on storage.objects for select to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = public.auth_org_id()::text);

create policy avatares_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatares' and (storage.foldername(name))[1] = public.auth_org_id()::text);

create policy avatares_update on storage.objects for update to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = public.auth_org_id()::text);

create policy avatares_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = public.auth_org_id()::text);

-- ---------- Signup: entrar por convite ou criar empresa nova ----------
-- Se o cadastro trouxer um invite_code válido, o usuário entra na empresa
-- existente como operador. Sem convite, cria a própria empresa como admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  org_name text;
  org_slug text;
  invite text;
  invited_org uuid;
begin
  invite := nullif(trim(new.raw_user_meta_data ->> 'invite_code'), '');

  if invite is not null then
    select id into invited_org from public.organizations where invite_code = upper(invite);
  end if;

  if invited_org is not null then
    insert into public.profiles (id, organization_id, full_name, role)
    values (
      new.id,
      invited_org,
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), new.email),
      'operador'
    );
    return new;
  end if;

  org_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'organization_name'), ''), 'Minha Frota');
  org_slug := trim(both '-' from lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g')));
  if org_slug = '' then
    org_slug := 'frota';
  end if;
  org_slug := org_slug || '-' || substr(replace(new.id::text, '-', ''), 1, 8);

  insert into public.organizations (id, name, slug, invite_code)
  values (
    gen_random_uuid(),
    org_name,
    org_slug,
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  )
  returning id into new_org_id;

  insert into public.profiles (id, organization_id, full_name, role)
  values (
    new.id,
    new_org_id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), new.email),
    'admin'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
