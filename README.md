# Rizvisions macOS V10.5

V10.5 turns media into reusable assets with placements instead of one overloaded set of checkboxes.

## What changed

- Removed every bundled stock-media fallback and the refresh flash it caused.
- Added a proper Photos gallery viewer with arrows, keyboard navigation, filmstrip thumbnails, captions, and natural aspect ratios.
- Added a multi-item Featured carousel in Photos.
- Made desktop media open as individual aspect-aware Preview/video windows.
- Added editable display names without renaming the stored file.
- Replaced Album with Photos Collections.
- Added reusable placements for Photos, Desktop, and Selected Work project folders.
- Added project-file environments for Parker, Blue Specs, Whop/WAP, Windsurf, and Creator Work.
- Added full-size photo/video preview inside Admin.
- Added video poster generation and web-friendly handling for iPhone MOV uploads.
- Made Desktop-only media possible.
- Renamed confusing desktop commands to Move to Front, Reset Desktop Position, and View in Photos Library.

## Existing V10 installation

Run `supabase/migrate-v10.5.sql` once in Supabase, then deploy this folder to GitHub Pages.

The migration preserves existing uploads and converts the old Photos/Desktop flags into placements.

## New installation

Run `supabase/setup.sql`, then deploy the site.

## Security

The website contains only the Supabase project URL and publishable key. Upload, edit, and delete permissions remain protected by Row Level Security and restricted to the configured admin email.
