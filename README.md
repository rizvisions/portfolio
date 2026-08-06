# Rizvisions macOS V10

V10 moves the photo and video archive out of GitHub and into a private Supabase-powered media manager.

## What changed

- Added a private `/admin` page with persistent email/password login.
- Added first-time account creation, password reset, and magic-link fallback.
- Added drag-and-drop batch uploads for photos and videos.
- Photos are automatically resized and converted to WebP before upload.
- Added captions, alt text, albums, publish/hide, featured, and desktop controls.
- Added drag-to-reorder in the admin library.
- Added direct deletion through the Supabase Storage API.
- Connected the public Photos app and desktop media to published Supabase records.
- Kept bundled media as a fallback until Supabase is configured or while the library is empty.

## One-time setup

1. Open Supabase → SQL Editor → New query.
2. Paste the complete contents of `supabase/setup.sql`.
3. Click Run.
4. Upload this package to the GitHub repository root.
5. Open `https://rizvisions.com/admin`.
6. Choose **First time? Create account**, using `rzaheer002@gmail.com` and a unique password with at least 12 characters.
7. Confirm the email once if Supabase asks you to.

After setup, media updates happen through `/admin` and do not require GitHub.

## Security

The browser contains only the Supabase project URL and publishable key. Upload, edit, and delete permissions are enforced by Row Level Security and restricted to `rzaheer002@gmail.com`. Never add a Supabase secret key or service-role key to this repository.
