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
