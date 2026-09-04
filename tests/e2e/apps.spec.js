import { expect, test } from "@playwright/test";
import { installDeterministicMedia, openDesktop, openDesktopApp } from "./fixtures.js";

test.beforeEach(async ({ page }) => {
  await installDeterministicMedia(page);
  await openDesktop(page);
});

test("Photos opens to All Photos, newest first, with contained media", async ({ page }) => {
  const photosWindow = await openDesktopApp(page, "photos");

  await expect(photosWindow.locator('[data-photo-collection="all"]')).toHaveClass(/active/);
  await expect(photosWindow.locator('[data-photo-view="all"]')).toHaveClass(/active/);
  await expect(photosWindow.locator(".photos-archive-band")).toContainText("2");
  await expect(photosWindow.locator(".photos-archive-band")).toContainText("Photos, videos, and fragments worth keeping.");
  await expect(photosWindow.locator(".photos-date-group")).toHaveCount(2);
  await expect(photosWindow.locator(".photo-natural-tile").first()).toHaveAttribute("data-media-id", "video-new");

  await photosWindow.locator('.photo-natural-tile[data-media-id="video-new"]').click();
  await expect(photosWindow.locator(".photos-gallery")).toBeVisible();
  await expect(photosWindow.locator(".photos-gallery-media video")).toHaveCSS("object-fit", "contain");
  await expect(photosWindow.locator('[data-gallery-info]')).toHaveAttribute("aria-pressed", "true");
  await expect(photosWindow.locator(".photos-gallery-info")).toContainText("Dimensions");
  await expect(photosWindow.locator(".photos-gallery-info")).toContainText("1080 × 1920");
  await expect(photosWindow.locator(".photos-gallery-info")).toContainText("Library");
});

test("Terminal input stays visible and accepts commands", async ({ page }) => {
  const terminalWindow = await openDesktopApp(page, "terminal");
  const input = terminalWindow.locator(".terminal-input");

  await expect(input).toBeVisible();
  await input.fill("help");
  await input.press("Enter");
  await expect(terminalWindow.locator(".terminal-output")).toContainText("about  work  photos");

  const color = await input.evaluate((element) => getComputedStyle(element).color);
  expect(color).not.toBe("rgba(0, 0, 0, 0)");
});

test("Notes opens at a usable size with the editor inside the window", async ({ page }) => {
  const notesWindow = await openDesktopApp(page, "notes");
  const editor = notesWindow.locator("textarea");

  await expect(editor).toBeVisible();
  const layout = await notesWindow.evaluate((windowElement) => {
    const editorElement = windowElement.querySelector("textarea");
    const bodyElement = windowElement.querySelector(".window-body");
    const editorBox = editorElement.getBoundingClientRect();
    const bodyBox = bodyElement.getBoundingClientRect();
    const tolerance = 0.5;
    return {
      windowWidth: windowElement.clientWidth,
      windowHeight: windowElement.clientHeight,
      editorInside:
        editorBox.left >= bodyBox.left - tolerance &&
        editorBox.right <= bodyBox.right + tolerance &&
        editorBox.top >= bodyBox.top - tolerance &&
        editorBox.bottom <= bodyBox.bottom + tolerance
    };
  });

  expect(layout.windowWidth).toBeGreaterThanOrEqual(760);
  expect(layout.windowHeight).toBeGreaterThanOrEqual(500);
  expect(layout.editorInside).toBe(true);
});
