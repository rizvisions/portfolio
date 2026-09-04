# Rizvisions engineering rules

- Treat this repository as the canonical source for `rizvisions.com`.
- The site intentionally emulates current macOS. Prefer native macOS interaction patterns over generic web UI.
- Preserve existing behavior outside the requested feature or fix.
- Photos must open to All Photos and show newest media first.
- Full-view photos and videos must use contained sizing and never crop.
- Desktop placements must support photos and videos at the same time. One invalid media item must not stop the rest from rendering.
- Avoid broad CSS selectors when an app-scoped selector will work.
- Every bug fix needs a regression test.
- Run the static and browser suites at both supported Mac-sized viewports before requesting review.
- Supabase schema changes must be additive, data-preserving migrations.
- Frontend code may contain only the Supabase publishable key. Never commit service-role keys, database credentials, passwords, or tokens.
- Use a feature branch and pull request for significant work. Do not push unreviewed changes directly to `main`.

