# Rizvisions macOS V8

Interactive macOS-style personal desktop for rizvisions.com.

## V8 changes

- Rubber-band desktop selection: drag an empty area to select multiple icons and photos
- Group dragging for selected desktop objects
- Every application window resizes from all four edges and all four corners
- Rizvisions eye icon and faint `RIZVISIONS` wordmark wallpaper branding
- Four coordinated grid appearances: Light, Dark, Maroon, and Forest
- Chicago wallpaper removed
- Résumé app and résumé search results removed
- Customizable Dock with add/remove controls, ordering controls, direct drag reordering, magnification toggle, and restore defaults
- Pinned minimized apps stay in place and use a running dot instead of creating duplicate Dock thumbnails
- Temporary minimized thumbnails are only used for windows whose app is not pinned
- Silver macOS-style Trash artwork replaces the black Trash
- Updated folder artwork, plus an optional one-click extractor for the exact folder and Trash assets installed on your Mac
- Existing V6 features remain: Spotlight, Quick Look, Notification Center, Control Center, Live Reel, draggable photos, draggable Currently widget, Spotify playlist, and local persistence

## Deploy

Upload the **unzipped contents** to the root of the GitHub Pages repository. Keep the `assets` folder intact.

Required root files:

```text
assets/
app.js
CNAME
CUSTOMIZE_PHOTOS.md
EXTRACT_MACOS_SYSTEM_ICONS.command
index.html
README.md
site-content.js
styles.css
```

After GitHub Pages finishes deploying, hard-refresh with `Command + Shift + R`.

V8 uses a fresh local-storage namespace, so its default layout loads independently from the older builds.

## Exact icons from your Mac

Apple's public design resources provide macOS UI kits and app-icon templates, but not a standalone downloadable Finder folder PNG. The included assets are already usable. To substitute the exact icons shipped by your own macOS installation:

1. On your Mac, right-click `EXTRACT_MACOS_SYSTEM_ICONS.command` and choose **Open**.
2. Approve it if macOS asks.
3. The script searches the protected system resource bundles, converts the installed folder and empty-Trash assets to PNG, and replaces:
   - `assets/icons/macos/folder.png`
   - `assets/icons/macos/trash.png`
4. Upload those two changed files to GitHub.

## Keyboard shortcuts

- `Command + Space` — Spotlight
- `Space` — Quick Look the selected desktop photo
- `Escape` — Close Spotlight, Quick Look, or menus
- `Command + N` — Finder
- `Command + Shift + N` — Notes
- `Command + W` — Close active window
- `Command + M` — Minimize active window

See `CUSTOMIZE_PHOTOS.md` to replace the photography and edit the rotating Currently widget.
