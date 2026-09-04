import { expect, test } from "@playwright/test";
import { installDeterministicMedia, openDesktop, openDesktopApp } from "./fixtures.js";

test.beforeEach(async ({ page }) => {
  await installDeterministicMedia(page);
  await openDesktop(page);
});

test("Photos opens to a clean square All Photos grid and a contained white viewer", async ({ page }) => {
  const photosWindow = await openDesktopApp(page, "photos");

  await expect(photosWindow.locator('[data-photo-collection="all"]')).toHaveClass(/active/);
  await expect(photosWindow.locator('[data-photo-view="all"]')).toHaveClass(/active/);
  await expect(photosWindow.locator(".photos-archive-band")).toHaveCount(0);
  await expect(photosWindow.locator(".photos-date-group")).toHaveCount(0);
  await expect(photosWindow.locator(".photo-natural-tile")).toHaveCount(3);
  await expect(photosWindow.locator(".photo-natural-tile").first()).toHaveAttribute("data-media-id", "video-landscape");
  await expect(photosWindow.locator('.photo-natural-tile[data-media-id="photo-old"] > img')).toHaveCSS("opacity", "1");
  const tileLayout = await photosWindow.locator(".photo-natural-tile").evaluateAll((tiles) => tiles.map((tile) => {
    const rect = tile.getBoundingClientRect();
    return { left:rect.left, top:rect.top, right:rect.right, bottom:rect.bottom, ratio:rect.width/rect.height };
  }));
  expect(tileLayout.every((tile) => Math.abs(tile.ratio-1) < .01)).toBe(true);
  for (let index = 0; index < tileLayout.length; index += 1) {
    for (let other = index+1; other < tileLayout.length; other += 1) {
      const a = tileLayout[index], b = tileLayout[other];
      expect(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top).toBe(true);
    }
  }

  await photosWindow.locator('.photo-natural-tile[data-media-id="video-landscape"]').click();
  await expect(photosWindow.locator(".photos-gallery")).toBeVisible();
  await expect(photosWindow.locator(".photos-gallery")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(photosWindow.locator(".photos-gallery-media video")).toHaveCSS("object-fit", "contain");
  const viewerChrome = await photosWindow.evaluate((windowElement) => {
    const header = windowElement.querySelector(".photos-viewer-toolbar").getBoundingClientRect();
    const copy = windowElement.querySelector(".photos-viewer-copy").getBoundingClientRect();
    const footer = windowElement.querySelector(".photos-gallery > footer").getBoundingClientRect();
    const dock = document.querySelector(".dock-wrap").getBoundingClientRect();
    return {
      centeredTitle:Math.abs((copy.left+copy.width/2)-(header.left+header.width/2)) < 1,
      filmstripClearsDock:footer.bottom <= dock.top-15,
      thumbnailCount:windowElement.querySelectorAll("[data-gallery-thumb]").length
    };
  });
  expect(viewerChrome).toEqual({ centeredTitle:true, filmstripClearsDock:true, thumbnailCount:3 });
  await expect(photosWindow.locator("[data-gallery-thumb]")).toHaveCount(3);
  await photosWindow.locator('[data-gallery-thumb="1"]').click();
  await expect(photosWindow.locator(".photos-gallery-counter")).toHaveText("2 of 3");
  await expect(photosWindow.locator(".photos-gallery-title")).toHaveText("New Portrait Video");
  await photosWindow.locator('[data-gallery-thumb="0"]').click();
  await expect(photosWindow.locator(".photos-gallery-counter")).toHaveText("1 of 3");
  await expect(photosWindow.locator('[data-gallery-info]')).toHaveAttribute("aria-pressed", "false");
  const mediaWidthBeforeInfo = await photosWindow.locator(".photos-gallery-media").evaluate((node) => node.getBoundingClientRect().width);
  await photosWindow.locator('[data-gallery-info]').click();
  await expect(photosWindow.locator('[data-gallery-info]')).toHaveAttribute("aria-pressed", "true");
  await expect(photosWindow.locator(".photos-gallery-info")).toBeVisible();
  await expect(photosWindow.locator(".photos-gallery-info")).toContainText("Dimensions");
  await expect(photosWindow.locator(".photos-gallery-info")).toContainText("1920 × 1080");
  await expect(photosWindow.locator(".photos-gallery-info")).toContainText("30 FPS");
  await expect(photosWindow.locator(".photos-gallery-info")).toContainText("Library");
  await expect(photosWindow.locator(".photos-gallery-info iframe")).toHaveAttribute("src", /openstreetmap\.org/);
  const mediaWidthAfterInfo = await photosWindow.locator(".photos-gallery-media").evaluate((node) => node.getBoundingClientRect().width);
  expect(Math.abs(mediaWidthAfterInfo-mediaWidthBeforeInfo)).toBeLessThan(1);

  await photosWindow.locator('[data-gallery-close]').click();
  await photosWindow.locator('.photo-natural-tile[data-media-id="photo-old"]').click();
  const photoContainment = await photosWindow.locator(".photos-gallery-media").evaluate((stage) => {
    const image = stage.querySelector("img");
    const stageRect = stage.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    return {
      complete: image.complete && image.naturalWidth === 800 && image.naturalHeight === 1200,
      objectFit: getComputedStyle(image).objectFit,
      inside:
        imageRect.left >= stageRect.left && imageRect.right <= stageRect.right &&
        imageRect.top >= stageRect.top && imageRect.bottom <= stageRect.bottom,
      noOverflow: stage.scrollWidth <= stage.clientWidth && stage.scrollHeight <= stage.clientHeight
    };
  });
  expect(photoContainment).toEqual({ complete:true, objectFit:"contain", inside:true, noOverflow:true });
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
