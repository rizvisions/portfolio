-- Rizvisions V10 media system
-- Run this entire file once in Supabase: SQL Editor -> New query -> Run.

create extension if not exists pgcrypto;

create or replace function public.is_rizvisions_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'rzaheer002@gmail.com';
$$;

create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  filename text not null,
  media_type text not null check (media_type in ('image', 'video')),
  mime_type text,
  size_bytes bigint not null default 0,
  width integer,
  height integer,
  duration_seconds numeric,
  caption text not null default '',
  alt_text text not null default '',
  album text not null default 'Library',
  is_published boolean not null default true,
  show_on_desktop boolean not null default false,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  desktop_x numeric,
  desktop_y numeric,
  desktop_rotation numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists media_items_public_order_idx
  on public.media_items (is_published, sort_order, created_at desc);
create index if not exists media_items_desktop_idx
  on public.media_items (show_on_desktop, sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists media_items_set_updated_at on public.media_items;
create trigger media_items_set_updated_at
before update on public.media_items
for each row execute function public.set_updated_at();

alter table public.media_items enable row level security;

drop policy if exists "Public can view published Rizvisions media" on public.media_items;
create policy "Public can view published Rizvisions media"
on public.media_items for select
to anon, authenticated
using (is_published = true or public.is_rizvisions_admin());

drop policy if exists "Riz can insert media" on public.media_items;
create policy "Riz can insert media"
on public.media_items for insert
to authenticated
with check (public.is_rizvisions_admin());

drop policy if exists "Riz can update media" on public.media_items;
create policy "Riz can update media"
on public.media_items for update
to authenticated
using (public.is_rizvisions_admin())
with check (public.is_rizvisions_admin());

drop policy if exists "Riz can delete media" on public.media_items;
create policy "Riz can delete media"
on public.media_items for delete
to authenticated
using (public.is_rizvisions_admin());

grant usage on schema public to anon, authenticated;
grant select on public.media_items to anon, authenticated;
grant insert, update, delete on public.media_items to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'rizvisions-media',
  'rizvisions-media',
  true,
  52428800,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view Rizvisions media files" on storage.objects;
create policy "Public can view Rizvisions media files"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'rizvisions-media');

drop policy if exists "Riz can upload media files" on storage.objects;
create policy "Riz can upload media files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'rizvisions-media'
  and public.is_rizvisions_admin()
);

drop policy if exists "Riz can update media files" on storage.objects;
create policy "Riz can update media files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'rizvisions-media'
  and public.is_rizvisions_admin()
)
with check (
  bucket_id = 'rizvisions-media'
  and public.is_rizvisions_admin()
);

drop policy if exists "Riz can delete media files" on storage.objects;
create policy "Riz can delete media files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'rizvisions-media'
  and public.is_rizvisions_admin()
);

-- Verification: these should both return one row after the script succeeds.
select id, public, file_size_limit from storage.buckets where id = 'rizvisions-media';
select count(*) as media_table_ready from public.media_items;
-- Rizvisions V10.5 media architecture migration
-- Safe to run after the original V10 setup. Existing uploads are preserved.

alter table public.media_items
  add column if not exists display_name text,
  add column if not exists poster_path text;

update public.media_items
set display_name = initcap(regexp_replace(regexp_replace(filename, '\.[^.]+$', ''), '[-_]+', ' ', 'g'))
where coalesce(display_name, '') = '';

alter table public.media_items
  alter column display_name set default '';

create table if not exists public.media_placements (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.media_items(id) on delete cascade,
  surface text not null check (surface in ('photos', 'desktop', 'selected_work', 'messages')),
  container text not null default 'library',
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  desktop_x numeric,
  desktop_y numeric,
  desktop_rotation numeric not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (media_id, surface, container)
);

create index if not exists media_placements_surface_idx
  on public.media_placements (surface, container, sort_order, created_at);
create index if not exists media_placements_media_idx
  on public.media_placements (media_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists media_placements_set_updated_at on public.media_placements;
create trigger media_placements_set_updated_at
before update on public.media_placements
for each row execute function public.set_updated_at();

alter table public.media_placements enable row level security;

drop policy if exists "Public can view Rizvisions media placements" on public.media_placements;
create policy "Public can view Rizvisions media placements"
on public.media_placements for select
to anon, authenticated
using (
  public.is_rizvisions_admin()
  or exists (
    select 1 from public.media_items
    where media_items.id = media_placements.media_id
      and media_items.is_published = true
  )
);

drop policy if exists "Riz can insert media placements" on public.media_placements;
create policy "Riz can insert media placements"
on public.media_placements for insert
to authenticated
with check (public.is_rizvisions_admin());

drop policy if exists "Riz can update media placements" on public.media_placements;
create policy "Riz can update media placements"
on public.media_placements for update
to authenticated
using (public.is_rizvisions_admin())
with check (public.is_rizvisions_admin());

drop policy if exists "Riz can delete media placements" on public.media_placements;
create policy "Riz can delete media placements"
on public.media_placements for delete
to authenticated
using (public.is_rizvisions_admin());

grant select on public.media_placements to anon, authenticated;
grant insert, update, delete on public.media_placements to authenticated;

-- Preserve existing V10 behavior by translating the old flags into placements.
insert into public.media_placements (media_id, surface, container, sort_order, is_featured)
select id, 'photos', coalesce(nullif(album, ''), 'Library'), sort_order, is_featured
from public.media_items
where is_published = true
on conflict (media_id, surface, container) do nothing;

insert into public.media_placements (media_id, surface, container, sort_order, desktop_x, desktop_y, desktop_rotation)
select id, 'desktop', 'desktop', sort_order, desktop_x, desktop_y, desktop_rotation
from public.media_items
where show_on_desktop = true
on conflict (media_id, surface, container) do nothing;

select count(*) as placement_table_ready from public.media_placements;
