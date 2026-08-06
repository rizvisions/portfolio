# Rizvisions macOS V6

Interactive macOS-style personal desktop for rizvisions.com.

## V6 additions

- Spotlight search with `Command + Space`
- Searchable apps, projects, socials, resume, and desktop actions
- Draggable rotating **Currently** widget with five personal cards
- macOS-style Quick Look for desktop photos, including arrow navigation
- Right-click photo actions: Quick Look, open in Photos, bring forward, and reset position
- Notification Center with Chicago date, calendar, weather, and current project
- Functional Control Center: display brightness, sound level, Focus, and wallpaper shortcuts
- Minimized windows now appear as restorable Dock thumbnails
- New Live Reel app for creator profiles and short-form work
- Expanded desktop context menu and icon sorting
- V6 drag hotfix retained: desktop photos and widget follow the pointer in real time without browser ghost images
- Fresh local-storage namespace so the new defaults load cleanly

## Deploy

Upload the **unzipped contents** to the root of the GitHub Pages repository. Keep the `assets` folder intact.

Required root files:

```text
assets/
app.js
CNAME
CUSTOMIZE_PHOTOS.md
index.html
README.md
site-content.js
styles.css
```

After GitHub Pages finishes deploying, hard-refresh with `Command + Shift + R`.

## Keyboard shortcuts

- `Command + Space` — Spotlight
- `Space` — Quick Look the selected desktop photo
- `Escape` — Close Spotlight, Quick Look, or menus
- `Command + N` — Finder
- `Command + Shift + N` — Notes
- `Command + W` — Close active window
- `Command + M` — Minimize active window

See `CUSTOMIZE_PHOTOS.md` to replace the photography and edit the rotating Currently widget.
