# Rizvisions macOS V10.8.1

V10.8.1 refines Photos, individual media windows, and the shared window system while preserving the safe branch, test, review, and preview workflow introduced in V10.7.

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
- Individual videos autoplay muted, loop, preserve the entire frame, remember the shared audio choice, and use a hover-only QuickTime-style control overlay.
- Removed browser-native reset confirmation from the main desktop.

## V10.8 media update

- Kept Photos focused on the direct newest-first All Photos library without an editorial banner.
- Fixed hidden image thumbnails and made posterless video thumbnails open on the first click.
- Kept Featured compact and native to the Photos working surface.
- Standardized the Photos library itself as a clean square thumbnail grid while preserving natural dimensions in full view.
- Rebuilt the in-app viewer as a white, breathable canvas with a fixed, fully contained media stage and a separate draggable Info panel.
- Added camera, lens, dimensions, exposure, aperture, ISO, file size, frame rate, codec, and GPS display when available, plus a map for geotagged media.
- Added optional location, frame-rate, and codec editing in Admin without changing the Supabase schema.
- Standardized desktop media as square Polaroid cards while keeping the hover lift.
- Made individual media windows use decoded source dimensions, stay centered above the Dock, preserve the true aspect ratio, tone-map HDR brightness, and restore exactly after exiting fullscreen.
- Added an explicit muted slash, centered window-control symbols, and normalized the Calendar icon's optical size.
- Integrated traffic lights into each app's own surface and removed the redundant generic app-name row.
- Centered newly opened apps inside the usable desktop area so they never start behind the Dock.
- Centered Photos viewer titles independently of its buttons and made the full media filmstrip horizontally browseable.
- Added an explicit fullscreen image canvas so portrait and landscape photos remain fully contained.

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

New image uploads attempt to read embedded capture metadata in the browser before upload, including GPS coordinates when present. When original capture metadata is not available, the file's last-modified timestamp is used as a fallback. Video uploads store dimensions, duration, and a timestamp fallback from the source file. Location name, coordinates, frame rate, and codec can also be completed manually in Admin.

## Deployment workflow

1. Create a feature branch from `main`.
2. Make focused changes and add a regression test for each bug fix.
3. Run the full suite and review the interactive branch preview.
4. Merge the approved pull request into `main`.
5. GitHub Pages deploys the canonical `rizvisions.com` site.

V10.8.1 does not require a Supabase migration.
