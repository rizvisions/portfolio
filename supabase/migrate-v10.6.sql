-- Rizvisions V10.6 media metadata migration
-- Safe to run after V10.5. Existing uploads and placements are preserved.

alter table public.media_items
  add column if not exists captured_at timestamptz,
  add column if not exists camera_make text,
  add column if not exists camera_model text,
  add column if not exists lens_model text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.media_items
set captured_at = coalesce(captured_at, created_at)
where captured_at is null;

create index if not exists media_items_captured_at_idx
  on public.media_items (captured_at desc, created_at desc);

select count(*) as media_metadata_ready from public.media_items;
