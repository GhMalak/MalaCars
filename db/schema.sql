-- =========================================================
-- Athena Frotas — Schema Supabase/Postgres (multi-tenant / SaaS)
-- =========================================================
-- Rode este script no SQL Editor do Supabase (projeto novo).
-- Ele cria as tabelas, os relacionamentos, e as políticas de
-- Row Level Security (RLS) que isolam os dados de cada empresa
-- (organization) automaticamente.

-- ---------- Extensões ----------
create extension if not exists "pgcrypto";

-- ---------- organizations (cada empresa/cliente do SaaS) ----------
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  invite_code text,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_organizations_invite_code on organizations(invite_code);

-- ---------- profiles (1 linha por usuário autenticado, ligado a auth.users) ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'operador')),
  phone text,
  avatar_path text,
  preferences jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_org on profiles(organization_id);

-- ---------- security_events (histórico de acessos e alterações sensíveis) ----------
create table if not exists security_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event text not null,
  detail text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_security_events_org on security_events(organization_id, created_at desc);
create index if not exists idx_security_events_user on security_events(user_id, created_at desc);

-- ---------- vehicles ----------
create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  plate text not null,
  brand text,
  model text,
  year int,
  color text,
  mileage_km int not null default 0,
  status text not null default 'ativo' check (status in ('ativo', 'em_manutencao', 'inativo', 'alugado')),
  notes text,
  renavam text,
  chassis text,
  licensing_due date,
  ipva_due date,
  insurer text,
  insurance_due date,
  purchase_date date,
  purchase_value numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vehicles_org on vehicles(organization_id);
create unique index if not exists idx_vehicles_org_plate on vehicles(organization_id, plate);

-- ---------- drivers ----------
create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  full_name text not null,
  cpf text,
  phone text,
  cnh_number text,
  cnh_category text,
  cnh_expiration date,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  notes text,
  photo_path text,
  rg text,
  birth_date date,
  address text,
  emergency_name text,
  emergency_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_drivers_org on drivers(organization_id);

-- ---------- contracts (vínculo veículo <-> motorista, com valores) ----------
create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  driver_id uuid not null references drivers(id) on delete cascade,
  start_date date not null,
  end_date date,
  weekly_value numeric(10,2) not null default 0,
  due_weekday int not null default 1 check (due_weekday between 0 and 6), -- 0=domingo
  status text not null default 'ativo' check (status in ('ativo', 'encerrado', 'suspenso')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contracts_org on contracts(organization_id);
create index if not exists idx_contracts_vehicle on contracts(vehicle_id);
create index if not exists idx_contracts_driver on contracts(driver_id);

-- ---------- financial_charges (cobranças geradas a partir dos contratos) ----------
create table if not exists financial_charges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  contract_id uuid not null references contracts(id) on delete cascade,
  reference_date date not null,
  due_date date not null,
  amount numeric(10,2) not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'atrasado', 'cancelado')),
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_charges_org on financial_charges(organization_id);
create index if not exists idx_charges_contract on financial_charges(contract_id);
create index if not exists idx_charges_status on financial_charges(status);
create unique index if not exists idx_charges_contract_due on financial_charges(contract_id, due_date);

-- ---------- payment_receipts (comprovantes das cobranças semanais) ----------
create table if not exists payment_receipts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  charge_id uuid not null references financial_charges(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_receipts_org on payment_receipts(organization_id);
create index if not exists idx_receipts_charge on payment_receipts(charge_id);

-- ---------- documents (CNH, CRLV, contrato assinado, fotos...) ----------
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  owner_type text not null check (owner_type in ('vehicle', 'driver', 'contract')),
  owner_id uuid not null,
  doc_type text not null,
  file_path text not null,
  file_name text not null,
  expires_at date,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_documents_org on documents(organization_id);
create index if not exists idx_documents_owner on documents(owner_type, owner_id);

-- ---------- maintenances ----------
create table if not exists maintenances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  type text not null, -- ex: revisão, troca de óleo, pneus...
  scheduled_date date,
  scheduled_km int, -- revisão marcada por quilometragem, não por data
  completed_date date,
  mileage_km int,
  cost numeric(10,2),
  status text not null default 'pendente' check (status in ('pendente', 'agendada', 'concluida', 'cancelada')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_maint_org on maintenances(organization_id);
create index if not exists idx_maint_vehicle on maintenances(vehicle_id);

-- ---------- recurring_expenses (seguro mensal, financiamento, rastreador...) ----------
create table if not exists recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  vehicle_id uuid references vehicles(id) on delete cascade,
  category text not null default 'seguro',
  description text,
  amount numeric(10,2) not null default 0,
  day_of_month int not null default 5 check (day_of_month between 1 and 28),
  start_date date not null default current_date,
  end_date date,
  status text not null default 'ativo' check (status in ('ativo', 'pausado')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_recurring_org on recurring_expenses(organization_id);
create index if not exists idx_recurring_vehicle on recurring_expenses(vehicle_id);

-- ---------- expenses (gastos lançados; revisão continua em maintenances) ----------
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  vehicle_id uuid references vehicles(id) on delete cascade,
  recurring_id uuid references recurring_expenses(id) on delete set null,
  category text not null default 'outros',
  description text,
  amount numeric(10,2) not null default 0,
  date date not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago')),
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_expenses_org on expenses(organization_id);
create index if not exists idx_expenses_vehicle on expenses(vehicle_id);
create index if not exists idx_expenses_date on expenses(date);
create unique index if not exists idx_expenses_recurring_date
  on expenses(recurring_id, date) where recurring_id is not null;

-- =========================================================
-- Trigger genérica para updated_at
-- =========================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  foreach t in array array['vehicles','drivers','contracts','financial_charges','maintenances','expenses','recurring_expenses'] loop
    execute format('drop trigger if exists trg_set_updated_at on %I;', t);
    execute format('create trigger trg_set_updated_at before update on %I for each row execute function set_updated_at();', t);
  end loop;
end $$;

-- =========================================================
-- Row Level Security (RLS)
-- =========================================================
-- Função auxiliar: organization_id do usuário logado
create or replace function auth_org_id()
returns uuid as $$
  select organization_id from profiles where id = auth.uid();
$$ language sql stable security definer;

-- Função auxiliar: o usuário logado é administrador?
-- security definer para não disparar RLS de novo dentro das próprias políticas.
create or replace function auth_is_admin()
returns boolean as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false);
$$ language sql stable security definer;

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table vehicles enable row level security;
alter table drivers enable row level security;
alter table contracts enable row level security;
alter table financial_charges enable row level security;
alter table maintenances enable row level security;
alter table expenses enable row level security;
alter table recurring_expenses enable row level security;
alter table payment_receipts enable row level security;
alter table documents enable row level security;
alter table security_events enable row level security;

-- organizations: só enxerga a própria; só admin renomeia
create policy org_select on organizations for select
  using (id = auth_org_id());
create policy org_update on organizations for update
  using (id = auth_org_id() and auth_is_admin());

-- profiles: só enxerga colegas da mesma org
create policy profiles_select on profiles for select
  using (organization_id = auth_org_id());
create policy profiles_update_self on profiles for update
  using (id = auth.uid());
create policy profiles_update_admin on profiles for update
  using (organization_id = auth_org_id() and auth_is_admin());

-- security_events: cada um vê o próprio histórico; admin vê o da equipe
create policy security_events_select on security_events for select
  using (user_id = auth.uid() or (organization_id = auth_org_id() and auth_is_admin()));
create policy security_events_insert on security_events for insert
  with check (user_id = auth.uid());

-- Política padrão (CRUD completo, restrito à própria organização) para as tabelas de negócio
do $$
declare
  t text;
begin
  foreach t in array array['vehicles','drivers','contracts','financial_charges','maintenances','expenses','recurring_expenses','payment_receipts','documents'] loop
    execute format('create policy %I_select on %I for select using (organization_id = auth_org_id());', t, t);
    execute format('create policy %I_insert on %I for insert with check (organization_id = auth_org_id());', t, t);
    execute format('create policy %I_update on %I for update using (organization_id = auth_org_id());', t, t);
    execute format('create policy %I_delete on %I for delete using (organization_id = auth_org_id());', t, t);
  end loop;
end $$;

-- =========================================================
-- Convite de equipe
-- =========================================================
-- Gera um novo código de convite para a empresa do admin logado.
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

-- =========================================================
-- Signup: entra por convite ou cria a própria empresa
-- =========================================================
-- O app envia, em raw_user_meta_data, o nome da empresa (`organization_name`),
-- o nome da pessoa (`full_name`) e, opcionalmente, um `invite_code`.
-- Com convite válido, o usuário entra na empresa existente como operador.
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

-- =========================================================
-- Storage: comprovantes, documentos da frota e avatares
-- =========================================================
-- Cada organização só acessa a própria pasta (primeiro nível do caminho).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('comprovantes', 'comprovantes', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('documentos', 'documentos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('avatares', 'avatares', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

do $$
declare
  b text;
begin
  foreach b in array array['comprovantes','documentos','avatares'] loop
    execute format('drop policy if exists %I_select on storage.objects;', b);
    execute format('drop policy if exists %I_insert on storage.objects;', b);
    execute format('drop policy if exists %I_update on storage.objects;', b);
    execute format('drop policy if exists %I_delete on storage.objects;', b);

    execute format(
      'create policy %I_select on storage.objects for select to authenticated using (bucket_id = %L and (storage.foldername(name))[1] = public.auth_org_id()::text);',
      b, b);
    execute format(
      'create policy %I_insert on storage.objects for insert to authenticated with check (bucket_id = %L and (storage.foldername(name))[1] = public.auth_org_id()::text);',
      b, b);
    execute format(
      'create policy %I_update on storage.objects for update to authenticated using (bucket_id = %L and (storage.foldername(name))[1] = public.auth_org_id()::text);',
      b, b);
    execute format(
      'create policy %I_delete on storage.objects for delete to authenticated using (bucket_id = %L and (storage.foldername(name))[1] = public.auth_org_id()::text);',
      b, b);
  end loop;
end $$;
