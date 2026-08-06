# Customize Photos and desktop media

Rizvisions uses `site-content.js` as a simple media manifest. You do not need to edit `index.html` or `app.js` to replace the temporary photography.

## 1. Prepare the files

Recommended formats:

- Images: JPG, PNG, or WebP
- Video: MP4 or WebM; MP4 with H.264 video and AAC audio has the broadest browser support
- Image long edge: roughly 1600–2400 px
- Image size: ideally below 1–2 MB each
- Video size: keep short web clips reasonably compressed
- Filenames: lowercase, hyphenated, and simple, such as `chicago-river.jpg` or `parker-launch.mp4`

GitHub Pages paths are case-sensitive.

## 2. Upload media to `assets/photos/`

On GitHub:

1. Open `assets`, then `photos`.
2. Choose **Add file → Upload files**.
3. Drag the files into the upload area.
4. Commit directly to `main`.

You can delete the temporary images only after nothing in `site-content.js` references them.

## 3. Edit `site-content.js`

The file has three main lists:

- `desktopPhotos`: loose, draggable image/video files on the desktop
- `photoLibrary`: media shown inside the Photos app
- `currentCards`: slides inside the draggable Currently widget

The same media item may appear on the desktop and inside Photos.

## Desktop image example

```js
{
  id: "desktop-chicago-river",
  type: "image",
  src: "assets/photos/chicago-river.jpg",
  alt: "Chicago River at night",
  filename: "chicago-river.jpg",
  x: 78,
  y: 28,
  rotation: -7,
  width: 136,
  monochrome: false
}
```

## Desktop video example

```js
{
  id: "desktop-parker-launch",
  type: "video",
  src: "assets/photos/parker-launch.mp4",
  poster: "assets/photos/parker-launch-poster.jpg",
  alt: "Parker launch video",
  filename: "parker-launch.mp4",
  x: 84,
  y: 44,
  rotation: 5,
  width: 144,
  monochrome: false
}
```

Desktop media fields:

- `id`: unique internal ID; never reuse it
- `type`: `"image"` or `"video"`
- `src`: exact path to the uploaded file
- `poster`: optional preview image for a video
- `alt`: accessible description
- `filename`: desktop label and window title
- `x`, `y`: default position as percentages of the desktop
- `rotation`: default tilt in degrees
- `width`: displayed desktop width in pixels
- `monochrome`: whether the desktop thumbnail appears black-and-white

Visitors can drag desktop media. Their arrangement is saved only in their own browser. Your manifest values remain the first-visit and reset defaults.

Double-clicking a desktop item—or selecting it and pressing Space—opens only that file in its own Preview/QuickTime-style window. It does not start a slideshow or navigate to unrelated files.

## Photos library image example

```js
{
  id: "river-01",
  type: "image",
  src: "assets/photos/chicago-river.jpg",
  alt: "Chicago River at night",
  filename: "chicago-river.jpg",
  date: "August 2026",
  location: "Chicago"
}
```

## Photos library video example

```js
{
  id: "parker-video-01",
  type: "video",
  src: "assets/photos/parker-launch.mp4",
  poster: "assets/photos/parker-launch-poster.jpg",
  alt: "Parker launch video",
  filename: "parker-launch.mp4",
  date: "August 2026",
  location: "Chicago"
}
```

Photos automatically lays the library out responsively. Videos receive a duration/play treatment and open in their own native-control video window.

## 4. Commit and test

Commit the `site-content.js` edit, wait for GitHub Pages to deploy, and hard-refresh:

```text
Command + Shift + R
```

Use **View → Restore Default Layout** after changing public desktop positions. Use **Rizvisions → Reset Rizvisions…** for a completely clean browser test.

## Customize the Currently widget

```js
{
  eyebrow: "CURRENTLY",
  title: "Parker",
  subtitle: "AI creative strategy",
  kind: "app",
  target: "parker"
}
```

Supported actions:

- `kind: "app"` opens an app such as `parker`, `photos`, `spotify`, `reel`, `about`, or `safari`
- `kind: "project"` opens a project such as `bluespecs`, `whop`, or `windsurf`
- `kind: "wallpaper"` changes the appearance to `grid`, `dark`, `maroon`, or `forest`
- `kind: "external"` opens the URL in `target`
