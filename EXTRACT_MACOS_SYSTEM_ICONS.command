#!/bin/zsh
set -euo pipefail

# Replaces bundled current-style artwork with the exact icon resources shipped
# by the macOS installation running on this Mac, when those resources are exposed
# as PNG/ICNS files. Newer macOS builds may keep some artwork in compiled asset
# catalogs; in that case the bundled icon is left unchanged.
ROOT="$(cd "$(dirname "$0")" && pwd)"
DEST="$ROOT/assets/icons/macos"
mkdir -p "$DEST"

convert_icon() {
  local source="$1"
  local destination="$2"
  local temporary
  temporary="$(mktemp -t rizvisions-icon).png"

  /usr/bin/sips -s format png "$source" --out "$temporary" >/dev/null
  /usr/bin/sips -Z 1024 "$temporary" --out "$destination" >/dev/null
  rm -f "$temporary"
  echo "✓ $(basename "$destination") ← $source"
}

first_existing() {
  local candidate
  for candidate in "$@"; do
    if [[ -f "$candidate" ]]; then
      printf '%s' "$candidate"
      return 0
    fi
  done
  return 1
}

find_icon_in_app() {
  local app="$1"
  [[ -d "$app" ]] || return 1
  /usr/bin/find "$app/Contents/Resources" -maxdepth 2 -type f \
    \( -iname 'AppIcon.icns' -o -iname '*AppIcon*.icns' -o -iname '*.icns' \) \
    2>/dev/null | /usr/bin/head -n 1
}

extract_named_app() {
  local output="$1"
  shift
  local app source
  source=""
  for app in "$@"; do
    source="$(find_icon_in_app "$app" || true)"
    [[ -n "$source" ]] && break
  done

  if [[ -n "$source" && -f "$source" ]]; then
    convert_icon "$source" "$DEST/$output.png"
  else
    echo "! Exact $output icon was not exposed as an ICNS file; bundled artwork kept."
  fi
}

# Finder has a stable legacy resource path on many macOS releases.
FINDER_ICON="$(first_existing \
  '/System/Library/CoreServices/Finder.app/Contents/Resources/Finder.icns' \
  '/System/Library/CoreServices/Finder.app/Contents/Resources/AppIcon.icns' || true)"
if [[ -n "$FINDER_ICON" ]]; then
  convert_icon "$FINDER_ICON" "$DEST/finder.png"
else
  echo "! Exact Finder icon was not exposed; bundled artwork kept."
fi

extract_named_app settings \
  '/System/Applications/System Settings.app' \
  '/System/Applications/System Preferences.app'
extract_named_app photos '/System/Applications/Photos.app'
extract_named_app messages '/System/Applications/Messages.app'
extract_named_app notes '/System/Applications/Notes.app'
extract_named_app terminal \
  '/System/Applications/Utilities/Terminal.app' \
  '/Applications/Utilities/Terminal.app'
extract_named_app quicktime \
  '/System/Applications/QuickTime Player.app' \
  '/Applications/QuickTime Player.app'
extract_named_app safari \
  '/Applications/Safari.app' \
  '/System/Applications/Safari.app'

FOLDER_ICON="$(first_existing \
  '/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/GenericFolderIcon.icns' \
  '/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/GenericFolder.icns' || true)"
if [[ -n "$FOLDER_ICON" ]]; then
  convert_icon "$FOLDER_ICON" "$DEST/folder.png"
else
  echo "! Exact folder icon was not exposed; bundled artwork kept."
fi

TRASH_ICON="$(/usr/bin/find \
  '/System/Library/CoreServices/Dock.app/Contents/Resources' \
  '/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources' \
  -maxdepth 2 -type f \
  \( -iname 'trashempty*.png' -o -iname '*Trash*Icon*.icns' \) \
  2>/dev/null | /usr/bin/head -n 1 || true)"
if [[ -n "$TRASH_ICON" && -f "$TRASH_ICON" ]]; then
  convert_icon "$TRASH_ICON" "$DEST/trash.png"
else
  echo "! Exact empty-Trash icon was not exposed; bundled artwork kept."
fi

printf '\nDone. Upload any changed PNG files inside assets/icons/macos to GitHub.\n'
printf 'Press Return to close this window.'
read -r _
