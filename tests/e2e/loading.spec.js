import { expect, test } from "@playwright/test";
import { installDeterministicMedia, openDesktop } from "./fixtures.js";

test("does not flash bundled stock media before Supabase hydrates", async ({ page }) => {
  await installDeterministicMedia(page, { delay: 2_000 });
  await openDesktop(page);

  await expect(page.locator("#desktopPhotos .photo-file")).toHaveCount(0);
  await expect(page.locator("#desktopPhotos .photo-file")).toHaveCount(3, { timeout: 5_000 });
});
