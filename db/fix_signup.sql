-- Cole este script no SQL Editor do Supabase e clique em Run.
-- Corrige o gatilho de cadastro: "Database error saving new user".

alter table if exists public.organizations alter column id set default gen_random_uuid();
alter table if exists public.vehicles alter column id set default gen_random_uuid();
alter table if exists public.drivers alter column id set default gen_random_uuid();
alter table if exists public.contracts alter column id set default gen_random_uuid();
alter table if exists public.financial_charges alter column id set default gen_random_uuid();
alter table if exists public.maintenances alter column id set default gen_random_uuid();

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
begin
  org_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'organization_name'), ''), 'Minha Frota');
  org_slug := trim(both '-' from lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g')));
  if org_slug = '' then
    org_slug := 'frota';
  end if;
  org_slug := org_slug || '-' || substr(replace(new.id::text, '-', ''), 1, 8);

  insert into public.organizations (id, name, slug)
  values (gen_random_uuid(), org_name, org_slug)
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
