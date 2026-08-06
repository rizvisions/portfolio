# V10 setup — exact order

## 1. Create the database and storage rules

In the Supabase project:

1. Open **SQL Editor**.
2. Click **New query**.
3. Open `supabase/setup.sql` from this package.
4. Copy the entire file into the query editor.
5. Click **Run**.
6. Confirm the result shows the `rizvisions-media` bucket and `media_table_ready = 0`.

## 2. Deploy V10

Upload everything inside the `rizvisions-macos-v10` folder to the root of `rizvisions/portfolio`, replacing the current site files.

Wait for GitHub Pages to finish, then hard-refresh `https://rizvisions.com`.

## 3. Create the admin account

Open `https://rizvisions.com/admin`.

- Email: `rzaheer002@gmail.com`
- Choose a unique password with at least 12 characters.
- Click **First time? Create account**.
- If a confirmation email arrives, click it once.
- Return to `/admin` and sign in.

## 4. Upload media

Drag photos and videos into the upload area.

- Photos are compressed for the web automatically.
- Each video must be under 50 MB on the Free plan.
- Toggle **Show on desktop** for selected items.
- Drag cards in the library to change their order.
- Use Edit for captions, alt text, albums, featured status, and visibility.

The public site reads published media directly from Supabase. No GitHub commit is needed for future uploads.
