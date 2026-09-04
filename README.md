# Rizvisions macOS V10.8.0

V10.8.0 turns Photos into a more personal Rizvisions Archive while preserving the macOS desktop and safe branch, test, review, and preview workflow introduced in V10.7.

## Product baseline

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

## V10.8 archive update

- Added a personal archive masthead with live moment, photo, and video counts.
- Grouped All Photos into readable day-based moments while retaining newest-first ordering.
- Refined Featured into a compact editorial strip with capture dates and media types.
- Added filenames, orientation, collection, camera, lens, dimensions, and duration to the immersive viewer information panel.
- Made the information panel immediately visible on larger windows and synchronized its accessible toggle state.
- Preserved real portrait, landscape, and square proportions for desktop media placements.

## Release safeguards

- Static integrity tests guard local assets, frontend secrets, migration guidance, and version labels.
- Playwright exercises the desktop at 1440×900 and 1280×800.
- GitHub Actions runs the complete suite for pull requests and `codex/**` branches.
- Browser traces, screenshots, and videos are retained when a regression fails.
- `AGENTS.md` preserves the product and engineering rules for future work.

Run the checks with `npm install` followed by `npm test`.

## First-load intro testing

The intro shows once per browser tab session. Add `?hello=1` to the site URL to force it to replay while testing.

## Media metadata

New image uploads attempt to read embedded capture metadata in the browser before upload. When original capture metadata is not available, the file's last-modified timestamp is used as a fallback. Video uploads store dimensions, duration, and a timestamp fallback from the source file.

## Deployment workflow

1. Create a feature branch from `main`.
2. Make focused changes and add a regression test for each bug fix.
3. Run the full suite and review the interactive branch preview.
4. Merge the approved pull request into `main`.
5. GitHub Pages deploys the canonical `rizvisions.com` site.

V10.8.0 does not require a Supabase migration.
