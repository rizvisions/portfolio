# Add photos and videos — simplest method

V9.5 automatically discovers media from one folder. You do **not** need to edit `site-content.js` for normal uploads.

## The entire workflow

1. Open your GitHub repository and enter:

   `assets` → `media`

2. Click:

   `Add file` → `Upload files`

3. Drag in all of the photos and videos you want, then commit the upload to `main`.

After GitHub Pages finishes deploying, the files appear automatically in the Photos app.

## Put specific files on the desktop

Rename the files you want on the desktop so they begin with `desktop-`:

```text
desktop-01-chicago-river.jpg
desktop-02-camera.jpg
desktop-03-friends.mp4
desktop-04-film-scan.webp
```

The number controls the order. Up to six prefixed files appear on the desktop.

When there are no `desktop-` files, the site temporarily uses the first four media files in alphabetical order.

## Recommended formats

Photos:

```text
.jpg
.jpeg
.png
.webp
.gif
.avif
```

Videos:

```text
.mp4   ← recommended
.webm
.m4v
.mov
```

MP4 is the safest video format across browsers. Export web copies rather than uploading full-resolution camera originals.

## Naming and order

Files are sorted alphabetically. Number prefixes give you precise order:

```text
001-chicago.jpg
002-parker-launch.mp4
003-loyola.jpg
```

The filename is also used as the temporary caption, so readable names look better than `IMG_7392.JPG`.

## Uploading a large batch

For dozens or hundreds of files, the cleanest workflow is GitHub Desktop:

1. Clone the `rizvisions/portfolio` repository in GitHub Desktop.
2. Open the local repository folder.
3. Drag the full batch into `assets/media` in Finder.
4. Return to GitHub Desktop.
5. Commit the files and click **Push origin**.

That avoids selecting files one page at a time in GitHub's web uploader.

## Important size note

The GitHub browser uploader accepts individual files up to 25 MiB. Regular Git pushes are blocked above 100 MiB per file. Compress large videos before adding them. A dedicated media host such as Cloudinary can be added for V10 if the library becomes too large for a code repository.

## Refreshing after an upload

The site caches the directory listing for ten minutes to avoid repeatedly calling GitHub. After a new upload:

- wait for the Pages deployment to finish, then
- hard-refresh with `Command + Shift + R`.

The new media usually appears immediately after the deployment; otherwise it appears when the short cache expires.
