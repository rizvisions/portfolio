#!/bin/zsh
set -euo pipefail

# Replaces the bundled high-fidelity folder/trash artwork with the exact icons
# shipped by the macOS version running on this Mac.
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

find_first() {
  local pattern="$1"
  shift
  local root candidate
  for root in "$@"; do
    [[ -d "$root" ]] || continue
    candidate="$(/usr/bin/find "$root" -maxdepth 3 -type f -iname "$pattern" 2>/dev/null | /usr/bin/head -n 1 || true)"
    if [[ -n "$candidate" ]]; then
      printf '%s' "$candidate"
      return 0
    fi
  done
  return 1
}

FOLDER_ICON="/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/GenericFolderIcon.icns"
if [[ ! -f "$FOLDER_ICON" ]]; then
  FOLDER_ICON="$(find_first '*Generic*Folder*.icns' \
    '/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources' \
    '/System/Library/CoreServices' || true)"
fi

TRASH_ICON="$(find_first 'trashempty*.png' \
  '/System/Library/CoreServices/Dock.app/Contents/Resources' \
  '/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources' || true)"
if [[ -z "$TRASH_ICON" ]]; then
  TRASH_ICON="$(find_first '*Trash*Icon*.icns' \
    '/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources' \
    '/System/Library/CoreServices/Dock.app/Contents/Resources' \
    '/System/Library/CoreServices' || true)"
fi

if [[ -n "$FOLDER_ICON" && -f "$FOLDER_ICON" ]]; then
  convert_icon "$FOLDER_ICON" "$DEST/folder.png"
else
  echo "! macOS folder resource was not found; the bundled folder icon was left unchanged."
fi

if [[ -n "$TRASH_ICON" && -f "$TRASH_ICON" ]]; then
  convert_icon "$TRASH_ICON" "$DEST/trash.png"
else
  echo "! macOS Trash resource was not found; the bundled silver Trash icon was left unchanged."
fi

printf '\nDone. Commit the changed PNG files in assets/icons/macos to GitHub.\n'
printf 'Press Return to close this window.'
read -r _
