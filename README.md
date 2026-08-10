# Rizvisions macOS V10.6.3

V10.6.3 is a front-end hotfix on top of the desktop-polish and media-metadata release.

## What changed

- Centered the 12-app desktop grid and added Calendar, Notes, and Terminal to the third row.
- Simplified Finder / Selected Work navigation to Recents and Applications.
- Recents now surfaces the media and project files that actually exist; Applications shows every desktop app.
- Rebuilt Notes around the native three-column macOS Notes hierarchy.
- Added a native-style Calendar month app.
- Added smooth Gilly-like restore/sort animations instead of teleporting desktop objects.
- Added the handwritten Apple-style `hello` first-load experience, followed by a local-time greeting.
- Rebuilt Photos around newest-first chronology, Photos / Videos filters, Years / Months / All Photos views, a smaller Featured strip, and a contained gallery viewer.
- Added image capture metadata ingestion in Admin when metadata is available: capture date, camera, lens, dimensions, and selected EXIF fields.
- Individual videos autoplay muted, preserve the entire frame, and use a hover-only QuickTime-style control overlay.
- Removed browser-native reset confirmation from the main desktop.

## Existing V10.5 installation

2. Upload everything inside this folder to the root of `rizvisions/portfolio`, replacing the current site files.
3. Wait for GitHub Pages to finish, then hard-refresh the site.

The migration preserves all existing uploads and placements.

## First-load intro testing

The intro shows once per browser tab session. Add `?hello=1` to the site URL to force it to replay while testing.

## Media metadata

New image uploads attempt to read embedded capture metadata in the browser before upload. When original capture metadata is not available, the file's last-modified timestamp is used as a fallback. Video uploads store dimensions, duration, and a timestamp fallback from the source file.

## V10.6.3 hotfix

- Fixes mixed photo + video Desktop placements disappearing together.
- Root cause: desktop videos without a poster called a removed JavaScript helper, which aborted the entire desktop-media render.
- Videos now use a safe passive video thumbnail fallback when no poster exists.
- No Supabase migration is required for V10.6.3.
