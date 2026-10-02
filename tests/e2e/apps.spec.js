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
    const title = windowElement.querySelector(".photos-gallery-title").getBoundingClientRect();
    const date = windowElement.querySelector(".photos-gallery-context").getBoundingClientRect();
    const footer = windowElement.querySelector(".photos-gallery > footer").getBoundingClientRect();
    const filmstrip = windowElement.querySelector(".photos-gallery-filmstrip");
    const thumbs = [...windowElement.querySelectorAll("[data-gallery-thumb]")];
    const dock = document.querySelector(".dock-wrap").getBoundingClientRect();
    return {
      centeredTitle:Math.abs((copy.left+copy.width/2)-(header.left+header.width/2)) < 1,
      titleDateAligned:Math.abs((title.left+title.width/2)-(date.left+date.width/2)) < 1,
      filmstripClearsDock:footer.bottom <= dock.top-15,
      filmstripLayout:getComputedStyle(filmstrip).display,
      distinctThumbnailPositions:new Set(thumbs.map((thumb) => Math.round(thumb.getBoundingClientRect().left))).size,
      thumbnailCount:thumbs.length
    };
  });
  expect(viewerChrome).toEqual({
    centeredTitle:true,
    titleDateAligned:true,
    filmstripClearsDock:true,
    filmstripLayout:"flex",
    distinctThumbnailPositions:3,
    thumbnailCount:3
  });
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
  await expect(photosWindow.locator(".photos-gallery")).toHaveClass(/info-open/);
  await expect(photosWindow.locator(".photos-gallery-info")).toContainText("Dimensions");
  await expect(photosWindow.locator(".photos-gallery-info")).toContainText("1920 × 1080");
  await expect(photosWindow.locator(".photos-gallery-info")).toContainText("30 FPS");
  await expect(photosWindow.locator(".photos-gallery-info")).toContainText("Library");
  await expect(photosWindow.locator(".photos-gallery-info iframe")).toHaveAttribute("src", /openstreetmap\.org/);
  const mediaWidthAfterInfo = await photosWindow.locator(".photos-gallery-media").evaluate((node) => node.getBoundingClientRect().width);
  expect(mediaWidthBeforeInfo-mediaWidthAfterInfo).toBeGreaterThan(220);
  const inspectorLayout = await photosWindow.evaluate((windowElement) => {
    const gallery = windowElement.querySelector(".photos-gallery").getBoundingClientRect();
    const stage = windowElement.querySelector(".photos-gallery-stage").getBoundingClientRect();
    const inspector = windowElement.querySelector(".photos-gallery-info");
    const panel = inspector.getBoundingClientRect();
    return {
      position:getComputedStyle(inspector).position,
      spansHeight:Math.abs(panel.top-gallery.top) < 1 && Math.abs(panel.bottom-gallery.bottom) < 1,
      followsMedia:Math.abs(stage.right-panel.left) < 1,
      flushRight:Math.abs(panel.right-gallery.right) < 1
    };
  });
  expect(inspectorLayout).toEqual({ position:"relative", spansHeight:true, followsMedia:true, flushRight:true });
  await photosWindow.locator('[data-info-close]').click();
  await expect(photosWindow.locator(".photos-gallery-info")).toBeHidden();
  await expect(photosWindow.locator(".photos-gallery")).not.toHaveClass(/info-open/);
  const mediaWidthAfterClose = await photosWindow.locator(".photos-gallery-media").evaluate((node) => node.getBoundingClientRect().width);
  expect(Math.abs(mediaWidthAfterClose-mediaWidthBeforeInfo)).toBeLessThan(1);

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
  await expect(terminalWindow.locator(".terminal-wordmark")).toBeVisible();
  await input.fill("help");
  await input.press("Enter");
  await expect(terminalWindow.locator(".terminal-history")).toContainText("Natural-language questions");

  await input.fill("Can you tell me about Parker?");
  await input.press("Enter");
  await expect(terminalWindow.locator(".terminal-history")).toContainText("AI creative-strategy platform");

  const color = await input.evaluate((element) => getComputedStyle(element).color);
  expect(color).not.toBe("rgba(0, 0, 0, 0)");
});

test("Messages provides working threads, search, and a local composer", async ({ page }) => {
  const messagesWindow = await openDesktopApp(page, "messages");
  await expect(messagesWindow.locator('[data-message-thread="riz"]')).toHaveClass(/active/);
  await expect(messagesWindow.locator("[data-chat-body]")).toContainText("welcome to Rizvisions");

  await messagesWindow.locator('[data-message-thread="parker"]').click();
  await expect(messagesWindow.locator("[data-chat-name]")).toHaveText("Parker");

  const input = messagesWindow.locator("[data-message-input]");
  await input.fill("Are you real?");
  await input.press("Enter");
  await expect(messagesWindow.locator("[data-chat-body]")).toContainText("Are you real?");
  await expect(messagesWindow.locator("[data-chat-body]")).toContainText("Now back to work.");
});

test("Notes is a functional local notebook with starter notes and a locked Easter egg", async ({ page }) => {
  const notesWindow = await openDesktopApp(page, "notes");
  const noteRows = notesWindow.locator("[data-note-id]");
  const editor = notesWindow.locator("[data-note-editor]");

  await expect(noteRows).toHaveCount(4);
  await expect(notesWindow.getByText("Quick Notes")).toHaveCount(0);
  await expect(notesWindow.getByPlaceholder("Search")).toHaveCount(0);
  await expect(editor).toBeVisible();
  await expect(editor).toContainText("Rizvisions to-do list");
  await expect(notesWindow.locator("[data-notes-new]")).toBeVisible();
  await expect(notesWindow.locator("[data-notes-format-toggle]")).toBeVisible();
  await expect(notesWindow.locator("[data-notes-checklist]")).toBeVisible();
  await expect(notesWindow.locator(".notes-note-list > h3")).toHaveCount(0);
  await expect(notesWindow.locator("[data-notes-sidebar]")).toHaveCount(0);
  await expect(notesWindow.locator("[data-notes-delete]")).toHaveCount(0);

  await notesWindow.locator('[data-note-id="internet-projects"]').click();
  await expect(notesWindow.locator("[data-note-editor]")).toContainText("Blue Specs");

  await notesWindow.locator('[data-note-id="do-not-open"]').click();
  await expect(notesWindow.locator("[data-note-unlock-form]")).toBeVisible();
  await notesWindow.locator("[data-note-passcode]").fill("20");
  await notesWindow.getByRole("button", { name:"Unlock" }).click();
  await expect(notesWindow.locator(".notes-lock-error")).toHaveText("Enter all four digits.");
  await notesWindow.locator("[data-note-passcode]").fill("1111");
  await expect(notesWindow.locator(".notes-lock-error")).toHaveText("That’s not it.");
  await notesWindow.locator("[data-note-passcode]").fill("2020");
  await expect(notesWindow.locator("[data-note-editor]")).toContainText("You opened it.");

  await notesWindow.locator("[data-notes-new]").click();
  const newEditor = notesWindow.locator("[data-note-editor]");
  await newEditor.fill("My note");
  await expect(notesWindow.locator("[data-note-id]").first().locator("strong")).toHaveText("My note");
  await newEditor.click();
  await notesWindow.locator("[data-notes-checklist]").click();
  await expect(newEditor.locator("[data-checklist]")).toHaveCount(1);
  await newEditor.locator("[data-check-toggle]").click();
  await expect(newEditor.locator("[data-checklist]")).toHaveClass(/checked/);

  const savedState = await page.evaluate(() => JSON.parse(localStorage.getItem("rizvisions-os-v10.6")));
  expect(savedState.noteDocuments[0].title).toBe("My note");
  expect(savedState.noteDocuments[0].bodyHtml).toContain("data-checklist");

  await expect(notesWindow.locator("[data-note-id]")).toHaveCount(5);

  const layout = await notesWindow.evaluate((windowElement) => {
    const editorElement = windowElement.querySelector("[data-note-editor]");
    const bodyElement = windowElement.querySelector(".window-body");
    const sidebarTop = windowElement.querySelector(".notes-sidebar-top").getBoundingClientRect();
    const browserToolbar = windowElement.querySelector(".notes-browser-toolbar").getBoundingClientRect();
    const editorToolbar = windowElement.querySelector(".notes-editor-toolbar").getBoundingClientRect();
    const noteMeta = windowElement.querySelector(".note-meta");
    const editorBox = editorElement.getBoundingClientRect();
    const bodyBox = bodyElement.getBoundingClientRect();
    const tolerance = 0.5;
    return {
      windowWidth: windowElement.clientWidth,
      windowHeight: windowElement.clientHeight,
      headerAlignment: Math.max(sidebarTop.bottom,browserToolbar.bottom,editorToolbar.bottom) - Math.min(sidebarTop.bottom,browserToolbar.bottom,editorToolbar.bottom),
      dateSharesNotePage: noteMeta.parentElement.classList.contains("notes-scroll") && getComputedStyle(noteMeta).borderBottomWidth === "0px",
      editorInside:
        editorBox.left >= bodyBox.left - tolerance &&
        editorBox.right <= bodyBox.right + tolerance &&
        editorBox.top >= bodyBox.top - tolerance &&
        editorBox.bottom <= bodyBox.bottom + tolerance
    };
  });

  expect(layout.windowWidth).toBeGreaterThanOrEqual(760);
  expect(layout.windowHeight).toBeGreaterThanOrEqual(500);
  expect(layout.headerAlignment).toBeLessThan(1);
  expect(layout.dateSharesNotePage).toBe(true);
  expect(layout.editorInside).toBe(true);
});

test("WarGames session is playable, supports observation, and exits cleanly", async ({ page }) => {
  const win=await openDesktopApp(page,"terminal");
  const input=win.locator(".terminal-input");
  const send=async text=>{await input.fill(text);await input.press("Enter");};
  await send("shall we play a game?");
  await expect(win.locator(".terminal-shell")).toHaveClass(/wopr-active/);
  await expect(win.locator(".terminal-history")).toContainText("SHALL WE PLAY A GAME?");
  await send("1");await send("top left");await send("1");
  await expect(win.locator(".terminal-history")).toContainText("SQUARE OCCUPIED");
  await send("restart");await send("play o");
  await expect(win.locator(".terminal-history")).toContainText("YOU: O");
  await input.press("Escape");
  await expect(win.locator(".terminal-shell")).not.toHaveClass(/wopr-active/);
  await send("Can you open the notes app?");
  await expect(page.locator('[data-app-window="notes"]')).toBeVisible();
  await page.locator('[data-app-window="notes"] [data-window-action="close"]').click();
  await send("What did Riz do at Parker?");await send("tell me more");
  await expect(win.locator(".terminal-history")).toContainText("ad-account analysis");
  await input.press("ArrowUp");await expect(input).toHaveValue("tell me more");
  await send("games");await send("2");
  await expect(win.locator(".terminal-history")).toContainText("EVALUATION COMPLETE",{timeout:8000});
  await send("exit");await send("clear");
  await expect(win.locator(".terminal-history")).toBeEmpty();
});

test("Safari favorites use LinkedIn and X brand icons", async ({ page }) => {
  const win=await openDesktopApp(page,"safari");
  for(const [name,asset] of [["LinkedIn","linkedin.svg"],["X","x.svg"]]){
    const image=win.locator(".safari-favorites button").filter({hasText:new RegExp(`^${name}$`)}).locator("img");
    await expect(image).toHaveAttribute("src",new RegExp(asset));
    expect(await image.evaluate(img=>img.complete && img.naturalWidth>0)).toBe(true);
  }
});

test("block wordmark is text with clear faces and outlined depth", async ({ page }) => {
  const win=await openDesktopApp(page,"terminal"),face=win.locator(".terminal-wordmark-face");
  await expect(face).toBeVisible();await expect(win).toHaveCSS("transform","none");
  const layout=await face.evaluate(el=>({font:parseFloat(getComputedStyle(el).fontSize),width:el.getBoundingClientRect().width,available:el.parentElement.clientWidth,text:el.textContent}));
  expect(layout.font).toBeGreaterThanOrEqual(11);expect(layout.width).toBeLessThanOrEqual(layout.available);
  expect(layout.text.split("\n")).toHaveLength(7);expect(layout.text).toContain("██");expect(layout.text).not.toContain("#");
  await expect(win.locator(".terminal-wordmark-shadow")).toHaveCSS("-webkit-text-stroke-width","0.55px");
});

test("campaign queues editable orders, fills the site, animates commit and preserves Escape", async ({ page }) => {
  test.setTimeout(45_000);
  const win=await openDesktopApp(page,"terminal"),input=win.locator(".terminal-input");
  await expect(win).toHaveCSS("transform","none");const initial=await win.boundingBox();
  const send=async text=>{await input.fill(text);await input.press("Enter");};
  await send("war");const panel=win.locator(".terminal-war-panel");
  await expect(win).toHaveClass(/war-immersive/);
  const rect=await win.boundingBox(),viewport=page.viewportSize();expect(rect.width).toBe(viewport.width);expect(rect.height).toBe(viewport.height);
  await expect(page.locator(".dock-wrap")).toBeHidden();expect((await panel.locator("svg.war-world").boundingBox()).height).toBeGreaterThan(240);
  await expect(panel.locator(".war-legend")).toContainText("NEUTRAL");
  expect(await panel.locator(".war-phase-copy").evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBe(true);
  const neutral=panel.locator('[data-war-region="EU"] polygon'),human=panel.locator('[data-war-region="CA"] polygon');
  const neutralFill=await neutral.evaluate(el=>getComputedStyle(el).fill);expect(neutralFill).not.toBe(await human.evaluate(el=>getComputedStyle(el).fill));
  await panel.locator('[data-war-region="EU"]').click();await expect(neutral).toHaveCSS("fill",neutralFill);
  await panel.locator('[data-war-region="CA"]').click();await expect(panel.locator("[data-war-amount]")).toHaveValue("1");
  await panel.locator("[data-war-max]").click();await expect(panel.locator("[data-war-amount]")).toHaveValue("4");await panel.locator("[data-war-queue]").click();
  await expect(panel.locator('[data-war-region="CA"] .war-armies')).toHaveText("9");await expect(panel.locator('[data-war-region="CA"] .war-planned-count')).toContainText("+4 deployed");
  await panel.locator('[data-war-region="CA"]').click();await panel.locator('[data-war-region="EU"]').click();
  await expect(panel.locator("[data-war-amount]")).toHaveValue("3");await expect(panel.locator("[data-war-preview]")).toContainText("capture with 2 survivors");
  await panel.locator("[data-war-amount]").fill("6");await expect(panel.locator("[data-war-preview]")).toContainText("5 survivors");await panel.locator("[data-war-queue]").click();
  await expect(panel.locator('[data-war-region="EU"]')).toHaveClass(/neutral/);
  await send("move US CA 3");await expect(panel.locator(".war-order-list li")).toHaveCount(2);
  await panel.getByRole("button",{name:"Move order 2 up",exact:true}).click();await expect(panel.locator(".war-order-list li").first()).toContainText("Transfer");
  await panel.getByRole("button",{name:"Move order 1 down",exact:true}).click();
  await panel.locator('[data-war-command="commit"]').click();await expect(input).toBeDisabled();
  await expect(panel.locator(".war-event-card")).toContainText("PLANS LOCKED");
  await panel.locator("[data-war-pause]").click();await expect(panel.locator(".war-phase-copy")).toContainText("PAUSED");
  await panel.locator("[data-war-next]").click();await expect(panel.locator(".war-event-card")).toContainText("REINFORCEMENTS");
  await panel.locator("[data-war-next]").click();await expect(panel.locator(".war-event-card")).toContainText("ATTACK IN MOTION");
  await expect(panel.locator(".war-order-path.live")).toBeVisible();await expect(panel.locator('[data-war-region="EU"] .war-armies')).toHaveText("2");
  await panel.locator("[data-war-next]").click();await expect(panel.locator(".war-event-card")).toContainText("TERRITORY CAPTURED");
  await expect(panel.locator(".war-region-changes")).toContainText("2 → 5");await expect(panel.locator(".war-battle-math")).toContainText("Attacker losses 1");
  await panel.locator("[data-war-skip]").click();await expect(input).toBeEnabled();await expect(panel.locator(".war-heading")).toContainText("ROUND 2");
  await expect(panel.locator('[data-war-region="EU"]')).toHaveClass(/human/);
  await send("deploy CA 4");await send("shield US");
  await panel.locator("[data-war-replay]").click();await expect(input).toBeDisabled();await panel.locator("[data-war-skip]").click();await expect(input).toBeEnabled();
  await expect(panel.locator(".war-order-list")).toContainText("Shield US");await expect(panel.locator('[data-war-region="CA"] .war-planned-count')).toContainText("+4 deployed");
  await input.evaluate(el=>el.blur());await page.keyboard.press("Escape");await expect(win).not.toHaveClass(/war-immersive/);await expect(panel).toBeVisible();await expect(page.locator(".dock-wrap")).toBeVisible();
  await panel.locator("[data-war-view]").click();await expect(win).toHaveClass(/war-immersive/);
  await panel.locator("[data-war-sound]").click();await expect(panel.locator("[data-war-sound]")).toHaveAttribute("aria-pressed","false");
  await panel.locator('[data-war-command="rules"]').click();await expect(panel.locator(".war-help")).toContainText("NUCLEAR ESCALATION");await panel.locator("[data-war-close-help]").click();
  await send("exit");await expect(panel).toBeHidden();await expect(win).not.toHaveClass(/war-immersive/);const restored=await win.boundingBox();expect(restored.width).toBe(initial.width);expect(restored.height).toBe(initial.height);
});

test("nuclear launch confirms into the queue and survives one round", async ({ page }) => {
  const win=await openDesktopApp(page,"terminal"),input=win.locator(".terminal-input");
  const send=async text=>{await input.fill(text);await input.press("Enter");};await send("war");const panel=win.locator(".terminal-war-panel");
  await send("deploy CA 4");await panel.locator('[data-war-region="CH"]').click();await panel.locator('[data-war-editor="strike"]').click();
  await expect(panel.locator("[data-war-preview]")).toContainText("DEFCON 5 → 4");await panel.locator("[data-war-queue]").click();
  await expect(panel.locator(".war-order-list")).toContainText("Launch → CH");await expect(panel.locator(".war-heading")).toContainText("DEFCON 5");
  await send("shield US");await panel.locator('[data-war-command="commit"]').click();await panel.locator("[data-war-skip]").click();
  await expect(panel.locator(".war-heading")).toContainText("DEFCON 4");await expect(panel.locator(".war-score")).not.toContainText("MUTUAL DESTRUCTION");
  await expect(panel.locator(".war-human")).toContainText("2 MISSILES");await expect(panel.locator("[data-war-command=commit]")).toBeDisabled();
});


test("campaign can be played without commands and has adjustable event log and edge routes", async ({ page }) => {
  const win=await openDesktopApp(page,"terminal"),input=win.locator(".terminal-input");await input.fill("war");await input.press("Enter");const panel=win.locator(".terminal-war-panel");
  await expect(panel.locator(".war-wrap-route")).toBeVisible();await expect(panel.locator(".war-map-objective")).toContainText("Alaska ↔ Siberia");
  await expect(win.locator(".terminal-history")).toHaveCSS("flex-basis","160px");
  await win.locator("[data-war-log-height]").evaluate(el=>{el.value="240";el.dispatchEvent(new Event("input",{bubbles:true}));});await expect(win.locator(".terminal-history")).toHaveCSS("flex-basis","240px");
  const grip=win.locator(".war-console-grip");await grip.focus();await grip.press("ArrowDown");await expect(win.locator(".terminal-history")).toHaveCSS("flex-basis","224px");
  await win.locator("[data-war-console-toggle]").click();await expect(input).toBeHidden();await expect(win.locator(".terminal-history")).toBeHidden();
  await panel.locator('[data-war-region="CA"]').click();await panel.locator("[data-war-max]").click();await panel.locator("[data-war-queue]").click();
  await expect(panel.locator('[data-war-region="CA"] .war-armies')).toHaveText("9");
  await panel.locator('[data-war-region="US"]').click();await expect(panel.locator(".war-order-editor")).toContainText("Your neighbors are friendly");
  await panel.locator('[data-war-target="CA"]').click();await expect(panel.locator(".war-order-editor")).toContainText("Transfer US → CA");await panel.locator("[data-war-queue]").click();
  await panel.locator('[data-war-region="CA"]').click();await panel.locator('[data-war-target="EU"]').click();await panel.locator("[data-war-queue]").click();
  await panel.locator('[data-war-command="commit"]').click();await panel.locator("[data-war-speed]").selectOption("4000");await expect(panel.locator("[data-war-speed]")).toHaveValue("4000");
  await panel.locator("[data-war-skip]").click();await expect(panel.locator(".war-round-summary")).toContainText("ROUND 1 COMPLETE");
  await panel.locator("[data-war-music]").click();await expect(panel.locator("[data-war-music]")).toHaveAttribute("aria-pressed","true");await panel.locator("[data-war-music]").click();await expect(panel.locator("[data-war-music]")).toHaveAttribute("aria-pressed","false");
  await win.locator("[data-war-console-toggle]").click();await expect(input).toBeVisible();await expect(win.locator(".terminal-history")).toContainText("WOPR");
  await panel.locator("[data-war-leave]").click();await expect(panel).toBeHidden();await expect(input).toBeVisible();
});

test("missile effects happen during firing and reduced motion removes launch shake", async ({ page }) => {
  const win=await openDesktopApp(page,"terminal"),input=win.locator(".terminal-input");const send=async text=>{await input.fill(text);await input.press("Enter");};await send("war");const panel=win.locator(".terminal-war-panel"),shell=win.locator(".terminal-shell");
  await send("deploy CA 4");await send("strike CH");await send("confirm strike");await expect(shell).not.toHaveClass(/war-launch-active/);
  await panel.locator('[data-war-command="commit"]').click();await panel.locator("[data-war-pause]").click();await panel.locator("[data-war-next]").click();await panel.locator("[data-war-next]").click();
  await expect(panel.locator(".war-event-card")).toContainText("MISSILE IN FLIGHT");await expect(shell).toHaveClass(/war-launch-active/);
  await expect(panel.locator('[data-war-region="CH"] .war-armies')).toHaveText("11");
  await page.emulateMedia({reducedMotion:"reduce"});await expect(panel.locator(".war-map-area")).toHaveCSS("animation-name","none");
  await panel.locator("[data-war-next]").click();await expect(panel.locator(".war-event-card")).toContainText("MISSILE IMPACT");await expect(panel.locator(".war-region-changes")).toContainText("11 → 6");
  await panel.locator("[data-war-skip]").click();await expect(shell).not.toHaveClass(/war-launch-active/);
});

test("expanded campaign renders 32 regions and produces audible music with independent volume", async ({page})=>{
  await page.evaluate(()=>{
    window.__warAudio={contexts:[],peaks:[]};
    const Original=window.AudioContext;
    window.AudioContext=class extends Original {
      constructor(...args){super(...args);window.__warAudio.contexts.push(this);}
      createGain(){const gain=super.createGain(),ramp=gain.gain.exponentialRampToValueAtTime.bind(gain.gain);gain.gain.exponentialRampToValueAtTime=(value,time)=>{window.__warAudio.peaks.push(value);return ramp(value,time);};return gain;}
    };
  });
  const win=await openDesktopApp(page,"terminal"),input=win.locator(".terminal-input");await input.fill("war");await input.press("Enter");
  const panel=win.locator(".terminal-war-panel");await expect(panel.locator(".war-region")).toHaveCount(32);await expect(panel.locator(".war-map-objective")).toContainText("22 of 32");
  await panel.locator("[data-war-music]").click();
  await expect.poll(()=>page.evaluate(()=>window.__warAudio.contexts[0]?.state)).toBe("running");
  expect(await page.evaluate(()=>Math.max(...window.__warAudio.peaks))).toBeGreaterThan(.04);
  await panel.locator("[data-war-volume]").focus();await panel.locator("[data-war-volume]").press("End");await page.waitForTimeout(2500);
  expect(await page.evaluate(()=>Math.max(...window.__warAudio.peaks))).toBeGreaterThan(.08);
  await page.screenshot({path:`test-results/campaign-map-${page.viewportSize().width}.png`});
  await panel.locator("[data-war-music]").click();await expect(panel.locator("[data-war-music]")).toHaveAttribute("aria-pressed","false");
});

test("victory presents a campaign debrief then retains the final map and restarts cleanly",async({page})=>{
  // Exercise end-state presentation separately from exhaustive engine campaigns.
  await page.evaluate(()=>{const original=window.RizvisionsTerminal.createSession;window.RizvisionsTerminal.createSession=(...args)=>{const session=original(...args),handle=session.handle.bind(session);session.handle=text=>{const result=handle(text);if(text==="commit"&&result.war){result.war.outcome="victory";result.war.human.regions=22;result.war.stats.captures=19;}return result;};return session;};});
  const win=await openDesktopApp(page,"terminal"),input=win.locator(".terminal-input"),send=async text=>{await input.fill(text);await input.press("Enter");};
  await send("war");await send("deploy CA 4");await send("commit");
  const panel=win.locator(".terminal-war-panel");await panel.locator("[data-war-skip]").click();
  const debrief=panel.getByRole("dialog",{name:"Campaign victory"});await expect(debrief).toBeVisible();await expect(debrief).toContainText("CAMPAIGN WON");await expect(debrief).toContainText("22/32");await expect(debrief).toContainText("Territories captured");
  await page.screenshot({path:`test-results/campaign-victory-${page.viewportSize().width}.png`});
  await debrief.locator("[data-war-victory-close]").click();await expect(debrief).toHaveCount(0);await expect(panel.locator(".war-world")).toBeVisible();
  await panel.locator('[data-war-command="restart"]').click();await expect(panel.locator(".war-score")).toContainText("YOU 3/32");await expect(panel.getByRole("dialog",{name:"Campaign victory"})).toHaveCount(0);
});
