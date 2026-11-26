-- Cole no SQL Editor do Supabase e clique em Run.
-- Documentação da frota: dados de documento do veículo, dados extras do
-- motorista e arquivos anexos (CNH, CRLV, contrato assinado, etc).
-- Pode rodar mais de uma vez sem problema.

-- ---------- Documentos e custos do veículo ----------
alter table public.vehicles add column if not exists renavam text;
alter table public.vehicles add column if not exists chassis text;
alter table public.vehicles add column if not exists licensing_due date;
alter table public.vehicles add column if not exists ipva_due date;
alter table public.vehicles add column if not exists insurer text;
alter table public.vehicles add column if not exists insurance_due date;
alter table public.vehicles add column if not exists purchase_date date;
alter table public.vehicles add column if not exists purchase_value numeric(12,2);

-- ---------- Dados extras do motorista ----------
alter table public.drivers add column if not exists rg text;
alter table public.drivers add column if not exists birth_date date;
alter table public.drivers add column if not exists address text;
alter table public.drivers add column if not exists emergency_name text;
alter table public.drivers add column if not exists emergency_phone text;

-- ---------- Arquivos anexos ----------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_type text not null check (owner_type in ('vehicle', 'driver', 'contract')),
  owner_id uuid not null,
  doc_type text not null,
  file_path text not null,
  file_name text not null,
  expires_at date,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_documents_org on public.documents(organization_id);
create index if not exists idx_documents_owner on public.documents(owner_type, owner_id);

alter table public.documents enable row level security;

drop policy if exists documents_select on public.documents;
drop policy if exists documents_insert on public.documents;
drop policy if exists documents_update on public.documents;
drop policy if exists documents_delete on public.documents;

create policy documents_select on public.documents for select
  using (organization_id = auth_org_id());
create policy documents_insert on public.documents for insert
  with check (organization_id = auth_org_id());
create policy documents_update on public.documents for update
  using (organization_id = auth_org_id());
create policy documents_delete on public.documents for delete
  using (organization_id = auth_org_id());

-- ---------- Bucket dos arquivos ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documentos',
  'documentos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

drop policy if exists documentos_select on storage.objects;
drop policy if exists documentos_insert on storage.objects;
drop policy if exists documentos_delete on storage.objects;

create policy documentos_select on storage.objects for select to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = public.auth_org_id()::text);

create policy documentos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and (storage.foldername(name))[1] = public.auth_org_id()::text);

create policy documentos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = public.auth_org_id()::text);
