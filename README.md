# Rizvisions macOS V9

Interactive macOS-style personal desktop for `rizvisions.com`.

## V9 changes

- Rizvisions wordmark watermark now appears on Light, Dark, Maroon, and Forest grid themes
- Larger custom Rizvisions eye artwork inside the app icon
- Spotify is now the native Spotify playlist embed, edge-to-edge inside its window
- Dark, Maroon, and Forest legibility pass across the menu bar, windows, controls, apps, and widgets
- Dock customization now works directly:
  - drag a desktop app onto the Dock to pin it
  - drag Dock icons to reorder them
  - drag a removable Dock icon away from the Dock to unpin it
  - Finder and Trash stay anchored
- Open pinned apps use a running dot rather than creating duplicate minimized icons
- Updated current-style Finder, Messages, Photos, Settings, Terminal, folder, and Trash artwork
- New Safari, Parker, and QuickTime Player apps
- Trash lives only in the Dock
- Larger, app-appropriate default window sizes
- About Riz and System Settings are now separate apps with separate purposes
- Photos was rebuilt as the main visual showcase, with a library sidebar, featured image, masonry grid, dates, locations, and video support
- Desktop image and video files open as individual Preview/QuickTime-style windows with all three traffic-light controls and no unrelated next/previous navigation
- Liquid-glass-inspired Control Center and calendar/weather panel rebuilt around the current macOS interaction pattern
- Top-right menu bar simplified to Search, Control Center, and Date/Time
- Existing desktop behavior remains: marquee selection, multi-object dragging, draggable photos, draggable Currently widget, resizable windows, Spotlight, context menus, local state, and reset controls

## Deploy

Upload the **unzipped contents** to the root of the GitHub Pages repository. Keep the `assets` folder intact.

Required root files:

```text
assets/
app.js
CNAME
CUSTOMIZE_PHOTOS.md
EXTRACT_MACOS_SYSTEM_ICONS.command
ICON_CREDITS.md
index.html
README.md
site-content.js
styles.css
```

After GitHub Pages finishes deploying, hard-refresh with:

```text
Command + Shift + R
```

V9 uses a fresh local-storage namespace, so its default layout loads independently from older versions.

## Direct Dock controls

- **Pin:** drag a desktop app icon onto the Dock.
- **Reorder:** drag a Dock icon left or right between other icons.
- **Remove:** drag a removable Dock icon away from the Dock and release it.
- **Open/minimized state:** a dot below a pinned app indicates that its window is open or minimized. Clicking the same icon restores it.
- Finder and Trash are fixed bookends and cannot be removed.

## Exact icons from your Mac

The bundled icons are production-ready current-style assets. To substitute the exact assets installed by your own version of macOS:

1. On your Mac, right-click `EXTRACT_MACOS_SYSTEM_ICONS.command` and choose **Open**.
2. Approve it if macOS asks.
3. The script searches your installed system apps and replaces any matching assets it can locate in `assets/icons/macos/`.
4. Upload the changed PNG files to GitHub.

See `ICON_CREDITS.md` for asset notes and `CUSTOMIZE_PHOTOS.md` for adding your own photography and video.

## Keyboard shortcuts

- `Command + Space` — Spotlight
- `Space` — open the selected desktop media file
- `Escape` — close Spotlight, menus, and panels
- `Command + N` — Finder
- `Command + Shift + N` — Notes
- `Command + W` — close the active window
- `Command + M` — minimize the active window
