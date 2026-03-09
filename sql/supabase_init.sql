-- Supabase initialization for banxuexing
-- Run this in Supabase SQL Editor.

create table if not exists public.app_storage (
  namespace text not null,
  key text not null,
  value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (namespace, key)
);

alter table public.app_storage enable row level security;

drop policy if exists "anon read app_storage" on public.app_storage;
create policy "anon read app_storage"
on public.app_storage
for select
to anon
using (true);

drop policy if exists "anon insert app_storage" on public.app_storage;
create policy "anon insert app_storage"
on public.app_storage
for insert
to anon
with check (true);

drop policy if exists "anon update app_storage" on public.app_storage;
create policy "anon update app_storage"
on public.app_storage
for update
to anon
using (true)
with check (true);

drop policy if exists "anon delete app_storage" on public.app_storage;
create policy "anon delete app_storage"
on public.app_storage
for delete
to anon
using (true);
