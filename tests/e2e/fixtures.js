import { expect } from "@playwright/test";

const mediaItems = [
  {
    id: "video-new",
    storage_path: "fixtures/video-new.mp4",
    poster_path: null,
    filename: "video-new.mp4",
    display_name: "New Portrait Video",
    media_type: "video",
    mime_type: "video/mp4",
    size_bytes: 1024,
    width: 1080,
    height: 1920,
    duration_seconds: 12,
    caption: "",
    alt_text: "New portrait video",
    sort_order: 1,
    created_at: "2026-09-02T12:00:00Z",
    captured_at: "2026-09-02T12:00:00Z",
    camera_make: "Apple",
    camera_model: "iPhone",
    lens_model: "",
    metadata: {}
  },
  {
    id: "photo-old",
    storage_path: "fixtures/photo-old.jpg",
    poster_path: null,
    filename: "photo-old.jpg",
    display_name: "Older Landscape Photo",
    media_type: "image",
    mime_type: "image/jpeg",
    size_bytes: 1024,
    width: 1920,
    height: 1080,
    duration_seconds: null,
    caption: "",
    alt_text: "Older landscape photo",
    sort_order: 2,
    created_at: "2026-08-01T12:00:00Z",
    captured_at: "2026-08-01T12:00:00Z",
    camera_make: "Sony",
    camera_model: "A7",
    lens_model: "35mm",
    metadata: {}
  }
];

const mediaPlacements = [
  { id: "desktop-video", media_id: "video-new", surface: "desktop", container: null, sort_order: 1, is_featured: false, desktop_x: 82, desktop_y: 28, desktop_rotation: -5, metadata: {} },
  { id: "photos-video", media_id: "video-new", surface: "photos", container: "Library", sort_order: 1, is_featured: true, desktop_x: null, desktop_y: null, desktop_rotation: null, metadata: {} },
  { id: "desktop-photo", media_id: "photo-old", surface: "desktop", container: null, sort_order: 2, is_featured: false, desktop_x: 84, desktop_y: 52, desktop_rotation: 6, metadata: {} },
  { id: "photos-photo", media_id: "photo-old", surface: "photos", container: "Library", sort_order: 2, is_featured: false, desktop_x: null, desktop_y: null, desktop_rotation: null, metadata: {} }
];

export async function installDeterministicMedia(page, { delay = 0 } = {}) {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.route("**/rest/v1/media_items*", async (route) => {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mediaItems) });
  });
  await page.route("**/rest/v1/media_placements*", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mediaPlacements) });
  });
  await page.route("**/storage/v1/object/public/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/octet-stream", body: "fixture" });
  });
}

export async function openDesktop(page) {
  await page.goto("/?hello=1");
  await page.locator("#bootSkip").click();
  await expect(page.locator("body")).toHaveClass(/desktop-ready/);
}

export async function openDesktopApp(page, appId) {
  const icon = page.locator(`#desktopIcons [data-app="${appId}"]`);
  await icon.dblclick();
  const window = page.locator(`#windows [data-app-window="${appId}"]`);
  await expect(window).toBeVisible();
  return window;
}

