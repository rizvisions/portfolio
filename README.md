# Rizvisions OS v4

Static macOS-inspired personal website for GitHub Pages.

## What changed in v4

- Rebuilt and optically normalized the desktop and Dock icon set.
- Fixed Messages transparency and Spotify/Instagram app-icon silhouettes.
- Added a single editable photo manifest in `site-content.js`.
- Desktop photos are selectable, draggable, layered, and remembered per browser.
- Reset Layout now restores both desktop icons and desktop photos.

## Deploy

Upload the **contents** of this folder to the root of the `main` branch in `rizvisions/portfolio`:

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

Do not upload only the ZIP. Keep the `assets` folder and `site-content.js` at the repository root exactly as shown.

## Add your own photography

See [`CUSTOMIZE_PHOTOS.md`](CUSTOMIZE_PHOTOS.md). The short version:

1. Add image files to `assets/photos/`.
2. Edit `site-content.js`.
3. Add each image to `desktopPhotos`, `photoLibrary`, or both.
4. Commit the changes and wait for GitHub Pages to deploy.

## Saved desktop behavior

The site stores each visitor's layout locally in their own browser under:

```text
rizvisions-os-v4
```

It remembers desktop icon positions, desktop photo positions and stacking order, windows, wallpaper, appearance, sound, and Notes. This data is not uploaded anywhere.

Use **View → Restore Default Layout** to restore icon and photo placement. Use **Rizvisions → Reset Rizvisions…** to clear all saved local preferences.
