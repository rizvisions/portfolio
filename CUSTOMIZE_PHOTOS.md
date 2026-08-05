# Add your own photos

Rizvisions uses `site-content.js` as a simple photo manifest. You do not need to change the HTML or app logic.

## 1. Prepare the files

Use JPG, PNG, or WebP files. For a fast-loading site, resize large originals before uploading:

- Long edge: roughly 1600–2400 px
- File size: ideally below 1 MB each
- Filenames: lowercase with hyphens, for example `chicago-river.jpg`

GitHub Pages filenames are case-sensitive, so `Chicago.jpg` and `chicago.jpg` are different paths.

## 2. Upload them to `assets/photos/`

On GitHub:

1. Open `assets`, then `photos`.
2. Choose **Add file → Upload files**.
3. Drag your images into the upload area.
4. Commit directly to `main`.

You can delete the placeholder images after nothing in `site-content.js` references them.

## 3. Edit `site-content.js`

Open `site-content.js` on GitHub and click the pencil icon.

There are two independent lists:

- `desktopPhotos`: loose photo files on the desktop
- `photoLibrary`: images shown inside the Photos app

The same image may appear in both lists.

## Desktop photo example

```js
{
  id: "desktop-photo-chicago",
  src: "assets/photos/chicago-river.jpg",
  alt: "Chicago River at night",
  filename: "chicago.jpg",
  x: 78,
  y: 28,
  rotation: -7,
  width: 132,
  monochrome: false
}
```

### Desktop photo fields

- `id`: unique internal ID; never reuse an ID.
- `src`: exact path to the uploaded image.
- `alt`: accessible description of the image.
- `filename`: label shown below the photo on the desktop.
- `x`: default horizontal position as a percentage of the screen width.
- `y`: default vertical position as a percentage of the desktop height.
- `rotation`: default tilt in degrees. Negative tilts left; positive tilts right.
- `width`: displayed photo width in pixels.
- `monochrome`: `true` makes the image black-and-white; `false` preserves color.

Visitors can drag these photo files anywhere. Their personal positions and stacking order are saved only in their browser. Your `x`, `y`, and `rotation` values remain the public first-visit and reset defaults.

## Photos app example

```js
{
  src: "assets/photos/chicago-river.jpg",
  alt: "Chicago River at night",
  layout: "wide"
}
```

### Photos app layout values

- `""`: standard tile
- `"wide"`: spans two columns
- `"tall"`: spans two rows

Example library:

```js
photoLibrary: [
  { src: "assets/photos/chicago-river.jpg", alt: "Chicago River", layout: "wide" },
  { src: "assets/photos/portrait.jpg", alt: "Portrait", layout: "tall" },
  { src: "assets/photos/film-camera.jpg", alt: "Film camera", layout: "" }
]
```

## 4. Commit and test

Commit the `site-content.js` edit to `main`, wait for the GitHub Pages deployment, and hard-refresh the site with:

```text
Command + Shift + R
```

Because your browser remembers prior photo positions, use **View → Restore Default Layout** after changing public defaults. Use **Rizvisions → Reset Rizvisions…** for a full clean test.
