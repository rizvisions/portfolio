import { expect, test } from "@playwright/test";
import { installDeterministicMedia, openDesktop, openDesktopApp } from "./fixtures.js";

test.beforeEach(async ({ page }) => {
  await installDeterministicMedia(page);
  await openDesktop(page);
});

test("opens and closes every desktop app without a page error", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const appIds = ["about", "work", "settings", "messages", "photos", "instagram", "safari", "parker", "calendar", "notes", "terminal", "spotify"];

  for (const appId of appIds) {
    const window = await openDesktopApp(page, appId);
    await window.locator('[data-window-action="close"]').click();
    await expect(window).toHaveCount(0);
  }

  expect(pageErrors).toEqual([]);
});

test("renders mixed desktop photos and posterless videos together", async ({ page }) => {
  const files = page.locator("#desktopPhotos .photo-file");
  await expect(files).toHaveCount(2);
  await expect(page.locator('#desktopPhotos .photo-file[data-media-type="image"]')).toHaveCount(1);
  await expect(page.locator('#desktopPhotos .photo-file[data-media-type="video"]')).toHaveCount(1);
  await expect(page.locator('#desktopPhotos .photo-file[data-media-type="image"]')).toHaveAttribute("data-media-orientation", "landscape");
  await expect(page.locator('#desktopPhotos .photo-file[data-media-type="video"]')).toHaveAttribute("data-media-orientation", "portrait");
  await expect(page.locator('#desktopPhotos .photo-file[data-media-type="video"] video')).toHaveCount(1);
});

test("keeps a minimized unpinned app in the Dock", async ({ page }) => {
  const terminalWindow = await openDesktopApp(page, "terminal");
  const terminalDockItem = page.locator('#dock [data-app="terminal"]');
  await expect(terminalDockItem).toHaveClass(/temporary-app/);

  await terminalWindow.locator('[data-window-action="minimize"]').click();
  await expect(terminalWindow).toBeHidden();
  await expect(terminalDockItem).toBeVisible();

  await terminalDockItem.click();
  await expect(terminalWindow).toBeVisible();
});

test("shows the selection marquee while dragging on the desktop", async ({ page }) => {
  await page.mouse.move(60, 620);
  await page.mouse.down();
  await page.mouse.move(290, 735, { steps: 6 });
  await expect(page.locator("#selectionRectangle")).toHaveClass(/active/);
  await page.mouse.up();
  await expect(page.locator("#selectionRectangle")).toBeHidden();
});
