-- Cole no SQL Editor do Supabase e clique em Run.
-- Gastos da frota: despesas fixas mensais, despesas avulsas e revisão por km.
-- Pode rodar de novo sem medo: tudo é "if not exists".

-- ---------- despesas fixas (seguro mensal, financiamento, rastreador...) ----------
create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete cascade,
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

create index if not exists idx_recurring_org on public.recurring_expenses(organization_id);
create index if not exists idx_recurring_vehicle on public.recurring_expenses(vehicle_id);

-- ---------- despesas lançadas ----------
-- O custo das revisões continua em maintenances; aqui ficam seguro, IPVA,
-- licenciamento, financiamento, multa, combustível e afins.
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete cascade,
  recurring_id uuid references public.recurring_expenses(id) on delete set null,
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

create index if not exists idx_expenses_org on public.expenses(organization_id);
create index if not exists idx_expenses_vehicle on public.expenses(vehicle_id);
create index if not exists idx_expenses_date on public.expenses(date);

-- Evita gerar duas vezes a mesma parcela de uma despesa fixa.
create unique index if not exists idx_expenses_recurring_date
  on public.expenses(recurring_id, date) where recurring_id is not null;

-- ---------- revisão por quilometragem ----------
alter table public.maintenances add column if not exists scheduled_km int;

-- ---------- updated_at ----------
do $$
declare
  t text;
begin
  foreach t in array array['expenses', 'recurring_expenses'] loop
    execute format('drop trigger if exists trg_set_updated_at on %I;', t);
    execute format('create trigger trg_set_updated_at before update on %I for each row execute function set_updated_at();', t);
  end loop;
end $$;

-- ---------- RLS ----------
alter table public.expenses enable row level security;
alter table public.recurring_expenses enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['expenses', 'recurring_expenses'] loop
    execute format('drop policy if exists %I_select on %I;', t, t);
    execute format('drop policy if exists %I_insert on %I;', t, t);
    execute format('drop policy if exists %I_update on %I;', t, t);
    execute format('drop policy if exists %I_delete on %I;', t, t);
    execute format('create policy %I_select on %I for select using (organization_id = auth_org_id());', t, t);
    execute format('create policy %I_insert on %I for insert with check (organization_id = auth_org_id());', t, t);
    execute format('create policy %I_update on %I for update using (organization_id = auth_org_id());', t, t);
    execute format('create policy %I_delete on %I for delete using (organization_id = auth_org_id());', t, t);
  end loop;
end $$;
