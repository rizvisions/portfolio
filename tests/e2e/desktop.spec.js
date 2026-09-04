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
  await expect(files).toHaveCount(3);
  await expect(page.locator('#desktopPhotos .photo-file[data-media-type="image"]')).toHaveCount(1);
  await expect(page.locator('#desktopPhotos .photo-file[data-media-type="video"]')).toHaveCount(2);
  await expect(page.locator('#desktopPhotos .photo-file[data-media-type="video"] video')).toHaveCount(2);
  const cards = await files.evaluateAll((items) => items.map((item) => ({
    width: getComputedStyle(item).width,
    previewRatio: getComputedStyle(item.querySelector(".photo-paper > img, .photo-paper > video")).aspectRatio
  })));
  expect(new Set(cards.map((card) => card.width)).size).toBe(1);
  expect(cards.every((card) => card.previewRatio === "1 / 1")).toBe(true);
});

test("opens desktop video at its true ratio and keeps that ratio while resizing", async ({ page }) => {
  await page.locator('#desktopPhotos .photo-file[data-photo-id="video-new"]').dblclick();
  const mediaWindow = page.locator("#windows .media-window-video");
  await expect(mediaWindow).toBeVisible();

  const initial = await mediaWindow.boundingBox();
  expect(Math.abs(initial.width / initial.height - 1080 / 1920)).toBeLessThan(.01);

  const handle = mediaWindow.locator('[data-resize="se"]');
  const handleBox = await handle.boundingBox();
  await page.mouse.move(handleBox.x + 2, handleBox.y + 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x - 55, handleBox.y - 25, { steps: 5 });
  await page.mouse.up();
  const resized = await mediaWindow.boundingBox();
  expect(Math.abs(resized.width / resized.height - 1080 / 1920)).toBeLessThan(.01);

  await expect(mediaWindow.locator(".video-muted-slash")).toBeVisible();
  await page.mouse.move(5, 5);
  await expect(mediaWindow.locator(".window-titlebar")).toHaveCSS("opacity", "0");
  await mediaWindow.hover();
  await expect(mediaWindow.locator(".window-titlebar")).toHaveCSS("opacity", "1");

  await mediaWindow.locator('[data-window-action="zoom"]').click();
  await expect(page.locator(".media-viewer:fullscreen")).toHaveCount(1);
  await page.evaluate(() => document.exitFullscreen());
  await expect(page.locator(".media-viewer:fullscreen")).toHaveCount(0);
  const afterFullscreen = await mediaWindow.boundingBox();
  expect(Math.abs(afterFullscreen.width / afterFullscreen.height - 1080 / 1920)).toBeLessThan(.01);
});

test("keeps a landscape video frame stable while controls appear and hide", async ({ page }) => {
  await page.locator('#desktopPhotos .photo-file[data-photo-id="video-landscape"]').dblclick();
  const mediaWindow = page.locator("#windows .media-window-video");
  await expect(mediaWindow).toBeVisible();
  await page.waitForTimeout(300);
  const before = await mediaWindow.locator(".apple-video-element").boundingBox();
  expect(Math.abs(before.width / before.height - 1920 / 1080)).toBeLessThan(.01);

  await page.mouse.move(before.x+before.width/2, before.y+before.height/2);
  await page.waitForTimeout(1800);
  const after = await mediaWindow.locator(".apple-video-element").boundingBox();
  expect(Math.abs(after.x-before.x)).toBeLessThan(.5);
  expect(Math.abs(after.y-before.y)).toBeLessThan(.5);
  expect(Math.abs(after.width-before.width)).toBeLessThan(.5);
  expect(Math.abs(after.height-before.height)).toBeLessThan(.5);
});

test("centers traffic-light symbols and optically sizes Calendar", async ({ page }) => {
  const calendar = page.locator('.desktop-item[data-id="calendar"] .calendar-icon');
  await expect(calendar).toHaveCSS("width", "64px");
  await expect(calendar).toHaveCSS("height", "64px");

  const settingsWindow = await openDesktopApp(page, "settings");
  await settingsWindow.locator(".traffic-lights").hover();
  const minimizeSymbol = await settingsWindow.locator(".traffic.minimize").evaluate((button) => {
    const style = getComputedStyle(button, "::after");
    return { inset: style.inset, width: style.width, height: style.height };
  });
  expect(minimizeSymbol).toEqual({ inset: "0px", width: "6px", height: "1px" });
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
