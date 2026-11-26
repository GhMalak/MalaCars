-- Cole no SQL Editor do Supabase e clique em Run.
-- Cobranças semanais + comprovantes (storage).

create unique index if not exists idx_charges_contract_due
  on public.financial_charges(contract_id, due_date);

create table if not exists public.payment_receipts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  charge_id uuid not null references public.financial_charges(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_receipts_org on public.payment_receipts(organization_id);
create index if not exists idx_receipts_charge on public.payment_receipts(charge_id);

alter table public.payment_receipts enable row level security;

drop policy if exists payment_receipts_select on public.payment_receipts;
drop policy if exists payment_receipts_insert on public.payment_receipts;
drop policy if exists payment_receipts_update on public.payment_receipts;
drop policy if exists payment_receipts_delete on public.payment_receipts;

create policy payment_receipts_select on public.payment_receipts for select
  using (organization_id = auth_org_id());
create policy payment_receipts_insert on public.payment_receipts for insert
  with check (organization_id = auth_org_id());
create policy payment_receipts_update on public.payment_receipts for update
  using (organization_id = auth_org_id());
create policy payment_receipts_delete on public.payment_receipts for delete
  using (organization_id = auth_org_id());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'comprovantes',
  'comprovantes',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

drop policy if exists comprovantes_select on storage.objects;
drop policy if exists comprovantes_insert on storage.objects;
drop policy if exists comprovantes_delete on storage.objects;

create policy comprovantes_select on storage.objects for select to authenticated
  using (bucket_id = 'comprovantes' and (storage.foldername(name))[1] = public.auth_org_id()::text);

create policy comprovantes_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'comprovantes' and (storage.foldername(name))[1] = public.auth_org_id()::text);

create policy comprovantes_delete on storage.objects for delete to authenticated
  using (bucket_id = 'comprovantes' and (storage.foldername(name))[1] = public.auth_org_id()::text);
