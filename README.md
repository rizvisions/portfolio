# Rizvisions macOS V9.5

A stabilization and cleanup release before V10.

## V9.5 fixes

- Restored the visible blue desktop selection marquee.
- Fixed desktop photo/video files so their paper cards no longer render as long white bars.
- Replaced Safari, System Settings, Parker, Trash, and Rizvisions artwork with the supplied assets.
- Removed the dedicated QuickTime / Live Reel app.
- Rebuilt the Instagram chooser and fixed all three profile links.
- Simplified Control Center and the date panel; removed fake or low-value weather/calendar UI.
- Fixed unpinned open/minimized applications so they remain available as temporary Dock icons.
- Added automatic photo/video discovery from `assets/media/`.
- Updated the storage namespace to V9.5 so V9 layout state does not cause regressions.

## Deploy

Upload everything inside this folder to the root of the GitHub Pages repository, replacing the existing files.

After the Pages deployment turns green, hard-refresh `rizvisions.com` with `Command + Shift + R`.

## Add media

See [CUSTOMIZE_PHOTOS.md](CUSTOMIZE_PHOTOS.md). Normal uploads no longer require editing JavaScript.
