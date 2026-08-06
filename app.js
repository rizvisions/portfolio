(() => {
  "use strict";

  const STORAGE_KEY = "rizvisions-os-v9-5";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;",'"':"&quot;"}[char]));

  const os = $("#os");
  const desktop = $("#desktop");
  const windowsRoot = $("#windows");
  const windowTemplate = $("#window-template");
  const activeAppName = $("#activeAppName");
  const toast = $("#toast");
  const dock = $("#dock");
  const desktopPhotosRoot = $("#desktopPhotos");
  const currentWidget = $("#currentWidget");
  const selectionRectangle = $("#selectionRectangle");
  const contextMenu = $("#desktopContextMenu");
  const photoContextMenu = $("#photoContextMenu");
  const dockContextMenu = $("#dockContextMenu");
  const controlCenter = $("#controlCenterPanel");
  const controlCenterButton = $("#controlCenterButton");
  const notificationCenter = $("#notificationCenter");
  const clockButton = $("#clockButton");
  const spotlightButton = $("#spotlightButton");
  const spotlightBackdrop = $("#spotlightBackdrop");
  const spotlightInput = $("#spotlightInput");
  const spotlightResults = $("#spotlightResults");
  const volumeSlider = $("#volumeSlider");
  const ccFocus = $("#ccFocus");

  const CONTENT = window.RIZVISIONS_CONTENT || { desktopPhotos: [], photoLibrary: [], currentCards: [] };
  const iconNodes = $$(".desktop-item");
  const defaultIcons = Object.fromEntries(iconNodes.map((node) => [node.dataset.id, {
    x: parseFloat(node.style.getPropertyValue("--x")),
    y: parseFloat(node.style.getPropertyValue("--y"))
  }]));
  const defaultPhotos = Object.fromEntries((CONTENT.desktopPhotos || []).map((photo, index) => [photo.id, {
    x: photo.x, y: photo.y, rotation: photo.rotation || 0, z: index + 1
  }]));
  const defaultWidget = { x: 55, y: 5.8, z: 40 };

  const DOCK_CATALOG = {
    finder: { label: "Finder", app: "work", icon: "assets/icons/macos/finder.png", fixed: true, running: true },
    work: { label: "Selected Work", app: "work", icon: "assets/icons/macos/folder.png" },
    photos: { label: "Photos", app: "photos", icon: "assets/icons/macos/photos.png" },
    about: { label: "About Riz", app: "about", icon: "assets/icons/macos/rizvisions.png" },
    settings: { label: "System Settings", app: "settings", icon: "assets/icons/macos/settings.png" },
    messages: { label: "Messages", app: "messages", icon: "assets/icons/macos/messages.png", badge: "1" },
    instagram: { label: "Instagram", app: "instagram", icon: "assets/icons/macos/instagram.png" },
    safari: { label: "Safari", app: "safari", icon: "assets/icons/macos/safari.png" },
    parker: { label: "Parker", app: "parker", icon: "assets/icons/macos/parker.png" },
    notes: { label: "Notes", app: "notes", icon: "assets/icons/macos/notes.png" },
    terminal: { label: "Terminal", app: "terminal", icon: "assets/icons/macos/terminal.png" },
    spotify: { label: "Spotify", app: "spotify", icon: "assets/icons/macos/spotify.png" },
    trash: { label: "Trash", app: "trash", icon: "assets/icons/macos/trash.png", kind: "trash", fixed: true }
  };
  const DEFAULT_DOCK = ["finder", "photos", "about", "messages", "safari", "parker", "notes", "spotify", "trash"];

  const DEFAULT_STATE = {
    wallpaper: "grid",
    brightness: 100,
    volume: 54,
    sound: true,
    focus: false,
    dockMagnification: true,
    dock: [...DEFAULT_DOCK],
    icons: clone(defaultIcons),
    photos: clone(defaultPhotos),
    widget: clone(defaultWidget),
    widgetIndex: 0,
    windows: {},
    notes: "Rizvisions is my permanent internet home.\n\nThings to add:\n• the real photo archive\n• Parker work\n• Blue Specs story\n• WAP / Whop era\n• more personal artifacts\n• an iOS version for mobile"
  };

  let state = loadState();
  let zCounter = 300;
  let photoZCounter = 80;
  let activeWindow = null;
  let selectedPhotoId = null;
  let contextPhotoId = null;
  let spotlightMatches = [];
  let spotlightIndex = 0;
  let toastTimer = null;
  let audioContext = null;

  const projectDefinitions = {
    parker: { title: "Parker", eyebrow: "CURRENTLY", color: "#7f78c5", description: "AI creative strategy for ecommerce teams. I work across GTM, demos, customers, pricing, product feedback, content, and whatever else needs doing.", facts: ["Sales + customer work", "GTM and pricing", "Product storytelling", "Parker Brain"] },
    bluespecs: { title: "Blue Specs", eyebrow: "2020", color: "#3688e8", description: "The ecommerce business I built at 18: blue-light glasses, influencer deals, paid ads, support tickets, SEO, and a crash course in doing everything yourself.", facts: ["$40K+ in six months", "60% margin", "244% ROAS", "50+ influencer contracts"] },
    whop: { title: "Whop / WAP", eyebrow: "CREATOR ECONOMY", color: "#ef4d5f", description: "Creator rewards, clip programs, and performance-based content systems. This was where internet distribution, operations, and incentives really clicked for me.", facts: ["$5.5K peak MRR", "$20K+ earned", "25K community", "$3K in 30 Days winner"] },
    windsurf: { title: "Windsurf", eyebrow: "CAMPAIGN", color: "#21a89b", description: "A creator campaign built around short-form distribution and rewards. The program generated millions of views while exposing exactly where open creator systems break.", facts: ["3.6M views", "$5.75 RPM", "$20K spend", "fraud controls + content rules"] },
    creator: { title: "Rizvisions", eyebrow: "CREATOR", color: "#242426", description: "Photography, video, short-form experiments, internet projects, and the visual identity I have carried since middle school.", facts: ["TikTok @riz.com", "Instagram @rizvisions", "30M+ lifetime views", "Chicago"] }
  };

  const currentCards = (CONTENT.currentCards?.length ? CONTENT.currentCards : [
    { eyebrow: "CURRENTLY", title: "Parker", subtitle: "AI creative strategy", kind: "app", target: "parker" },
    { eyebrow: "CREATOR", title: "30M+ views", subtitle: "short-form videos and internet experiments", kind: "external", target: "https://www.tiktok.com/@riz.com" },
    { eyebrow: "BUILT AT 18", title: "Blue Specs", subtitle: "$40K+ ecommerce story", kind: "project", target: "bluespecs" },
    { eyebrow: "CREATOR ECONOMY", title: "Whop + WAP", subtitle: "$20K+ earned building reward systems", kind: "project", target: "whop" }
  ]).map((card) => ({ ...card }));

  const appDefinitions = {
    work: { name: "Finder", title: "Selected Work", size: [1000, 650], min: [680, 440], render: renderFinder },
    about: { name: "About Riz", title: "About Riz", size: [880, 610], min: [620, 440], render: renderAbout },
    settings: { name: "System Settings", title: "System Settings", size: [850, 620], min: [650, 470], render: renderSettings },
    photos: { name: "Photos", title: "Photos", size: [1180, 740], min: [760, 520], render: renderPhotos },
    messages: { name: "Messages", title: "Messages", size: [920, 620], min: [700, 480], render: renderMessages },
    instagram: { name: "Instagram", title: "Instagram", size: [680, 580], min: [540, 440], render: renderInstagram },
    safari: { name: "Safari", title: "Rizvisions — Safari", size: [1050, 680], min: [720, 500], render: renderSafari },
    parker: { name: "Parker", title: "Parker", size: [1040, 680], min: [720, 500], render: renderParker },
    spotify: { name: "Spotify", title: "Spotify", size: [800, 650], min: [620, 470], render: renderSpotify },
    notes: { name: "Notes", title: "Notes", size: [820, 590], min: [620, 440], render: renderNotes },
    terminal: { name: "Terminal", title: "riz — zsh", size: [780, 520], min: [580, 400], render: renderTerminal },
    trash: { name: "Finder", title: "Trash", size: [720, 500], min: [560, 400], render: renderTrash }
  };

  const appIconMap = Object.fromEntries(Object.entries(DOCK_CATALOG).map(([key, item]) => [item.app, item.icon || "assets/icons/macos/document.png"]));
  Object.assign(appIconMap, { work: "assets/icons/macos/finder.png", media: "assets/icons/macos/photos.png" });

  const spotlightItems = [
    ["About Riz", "Riz Zaheer · Chicago · internet home", "about bio riz zaheer", "about"],
    ["Selected Work", "Parker, Blue Specs, Whop, Windsurf", "finder work portfolio projects", "work"],
    ["Photos", "Photography and visual archive", "photos camera media gallery", "photos"],
    ["Parker", "AI creative strategy", "parker ecommerce ai work", "parker"],
    ["Safari", "Browse Rizvisions links", "web browser links", "safari"],
    ["Instagram", "Choose a profile", "social instagram", "instagram"],
    ["Spotify", "Rizvisions playlist", "music playlist", "spotify"],
    ["System Settings", "Appearance and desktop preferences", "settings appearance wallpaper", "settings"]
  ].map(([title, subtitle, keywords, app]) => ({ title, subtitle, keywords, icon: appIconMap[app], run: () => openApp(app) }));

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!parsed) return clone(DEFAULT_STATE);
      return {
        ...clone(DEFAULT_STATE), ...parsed,
        icons: { ...clone(defaultIcons), ...(parsed.icons || {}) },
        photos: { ...clone(defaultPhotos), ...(parsed.photos || {}) },
        widget: { ...clone(defaultWidget), ...(parsed.widget || {}) },
        windows: parsed.windows || {},
        dock: normalizeDock(parsed.dock || DEFAULT_DOCK)
      };
    } catch { return clone(DEFAULT_STATE); }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage can be blocked */ }
  }

  function normalizeDock(keys) {
    const middle = [];
    (Array.isArray(keys) ? keys : DEFAULT_DOCK).forEach((key) => {
      if (!DOCK_CATALOG[key] || key === "finder" || key === "trash" || middle.includes(key)) return;
      middle.push(key);
    });
    return ["finder", ...middle, "trash"];
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function playSound(kind = "select") {
    if (!state.sound || Number(state.volume) <= 0) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = kind === "open" ? 500 : kind === "close" ? 270 : 390;
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.004, Number(state.volume) / 100 * 0.025), audioContext.currentTime + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.09);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(); oscillator.stop(audioContext.currentTime + 0.1);
    } catch { /* audio is decorative */ }
  }

  function setWallpaper(name, persist = true) {
    const allowed = ["grid", "dark", "maroon", "forest"];
    state.wallpaper = allowed.includes(name) ? name : "grid";
    os.dataset.wallpaper = state.wallpaper;
    $$('[data-check]').forEach((node) => { node.textContent = node.dataset.check === state.wallpaper ? "✓" : ""; });
    if (persist) saveState();
  }

  function cycleWallpaper() {
    const order = ["grid", "dark", "maroon", "forest"];
    setWallpaper(order[(order.indexOf(state.wallpaper) + 1) % order.length]);
    showToast(`${state.wallpaper[0].toUpperCase()}${state.wallpaper.slice(1)} appearance`);
  }

  function applyDisplayState() {
    if (volumeSlider) volumeSlider.value = String(Number(state.volume ?? 54));
    ccFocus?.classList.toggle("active", Boolean(state.focus));
    const focusLabel = $("#ccFocusLabel"); if (focusLabel) focusLabel.textContent = state.focus ? "On" : "Off";
    os.classList.toggle("focus-mode", Boolean(state.focus));
  }

  function applyIconLayout() {
    iconNodes.forEach((node) => {
      const pos = state.icons[node.dataset.id] || defaultIcons[node.dataset.id];
      if (!pos) return;
      node.style.setProperty("--x", `${pos.x}%`);
      node.style.setProperty("--y", `${pos.y}%`);
      node.style.left = "var(--x)"; node.style.top = "var(--y)";
    });
  }

  function applyWidgetLayout() {
    if (!currentWidget) return;
    const pos = state.widget || defaultWidget;
    currentWidget.style.setProperty("--widget-x", `${pos.x}%`);
    currentWidget.style.setProperty("--widget-y", `${pos.y}%`);
    currentWidget.style.left = "var(--widget-x)";
    currentWidget.style.top = "var(--widget-y)";
    currentWidget.style.zIndex = String(pos.z || 40);
  }

  function renderDesktopPhotos() {
    if (!desktopPhotosRoot) return;
    desktopPhotosRoot.innerHTML = "";
    (CONTENT.desktopPhotos || []).forEach((photo, index) => {
      const saved = state.photos[photo.id] || defaultPhotos[photo.id] || {};
      const file = document.createElement("button");
      file.type = "button";
      file.className = "photo-file";
      file.dataset.photoId = photo.id;
      file.dataset.mediaType = photo.type || mediaTypeFromSrc(photo.src);
      file.style.setProperty("--photo-x", `${saved.x ?? photo.x}%`);
      file.style.setProperty("--photo-y", `${saved.y ?? photo.y}%`);
      file.style.setProperty("--photo-rotation", `${saved.rotation ?? photo.rotation ?? 0}deg`);
      file.style.setProperty("--photo-width", `${photo.width || 132}px`);
      file.style.left = "var(--photo-x)"; file.style.top = "var(--photo-y)";
      file.style.zIndex = String(saved.z || index + 1);
      const preview = (photo.type || mediaTypeFromSrc(photo.src)) === "video"
        ? `<video src="${escapeHtml(photo.src)}" muted preload="metadata" playsinline></video><span class="desktop-video-badge">▶</span>`
        : `<img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.alt || "Rizvisions photo")}" draggable="false">`;
      file.innerHTML = `<span class="photo-paper ${photo.monochrome ? "monochrome" : ""}">${preview}</span><span class="photo-label">${escapeHtml(photo.filename || photo.src.split("/").pop())}</span>`;
      file.addEventListener("pointerdown", (event) => beginDesktopObjectDrag(event, file));
      file.addEventListener("click", (event) => {
        event.stopPropagation();
        if (file._suppressClick) return;
        selectDesktopPhoto(file, event.shiftKey || event.metaKey || event.ctrlKey);
      });
      file.addEventListener("dblclick", (event) => { event.preventDefault(); openMediaFile(photo); });
      file.addEventListener("contextmenu", (event) => {
        event.preventDefault(); event.stopPropagation();
        selectDesktopPhoto(file, false); contextPhotoId = photo.id; closeMenus();
        positionPopover(photoContextMenu, event.clientX, event.clientY);
        photoContextMenu.classList.add("open");
      });
      desktopPhotosRoot.appendChild(file);
    });
    photoZCounter = Math.max(80, ...$$(".photo-file", desktopPhotosRoot).map((node) => Number(node.style.zIndex) || 0));
  }

  function applyPhotoLayout() {
    $$(".photo-file", desktopPhotosRoot).forEach((file) => {
      const id = file.dataset.photoId;
      const photo = (CONTENT.desktopPhotos || []).find((item) => item.id === id) || {};
      const saved = state.photos[id] || defaultPhotos[id] || {};
      file.style.setProperty("--photo-x", `${saved.x ?? photo.x}%`);
      file.style.setProperty("--photo-y", `${saved.y ?? photo.y}%`);
      file.style.setProperty("--photo-rotation", `${saved.rotation ?? photo.rotation ?? 0}deg`);
      file.style.left = "var(--photo-x)"; file.style.top = "var(--photo-y)";
      file.style.zIndex = String(saved.z || 1);
    });
  }

  function clearDesktopSelection() {
    iconNodes.forEach((node) => node.classList.remove("selected"));
    $$(".photo-file", desktopPhotosRoot).forEach((node) => node.classList.remove("selected"));
    selectedPhotoId = null;
  }

  function selectDesktopItem(node, additive = false) {
    if (!additive) clearDesktopSelection();
    node.classList.toggle("selected", additive ? !node.classList.contains("selected") : true);
    playSound("select");
  }

  function selectDesktopPhoto(node, additive = false) {
    if (!additive) clearDesktopSelection();
    node.classList.toggle("selected", additive ? !node.classList.contains("selected") : true);
    selectedPhotoId = node.classList.contains("selected") ? node.dataset.photoId : null;
    playSound("select");
  }

  function selectedDesktopObjects() {
    return [...iconNodes, ...$$(".photo-file", desktopPhotosRoot)].filter((node) => node.classList.contains("selected"));
  }

  function objectBox(node) {
    const desktopRect = desktop.getBoundingClientRect();
    const rect = node.getBoundingClientRect();
    return { left: rect.left - desktopRect.left, top: rect.top - desktopRect.top, width: rect.width, height: rect.height, centerX: rect.left - desktopRect.left + rect.width / 2, centerY: rect.top - desktopRect.top + rect.height / 2 };
  }

  function persistObjectPosition(node) {
    const x = parseFloat(node.style.left) / desktop.clientWidth * 100;
    const y = parseFloat(node.style.top) / desktop.clientHeight * 100;
    if (node.classList.contains("desktop-item")) {
      state.icons[node.dataset.id] = { x: +x.toFixed(3), y: +y.toFixed(3) };
      node.style.setProperty("--x", `${x}%`); node.style.setProperty("--y", `${y}%`);
      node.style.left = "var(--x)"; node.style.top = "var(--y)";
    } else {
      const id = node.dataset.photoId;
      const current = state.photos[id] || defaultPhotos[id] || {};
      state.photos[id] = { ...current, x: +x.toFixed(3), y: +y.toFixed(3), z: Number(node.style.zIndex) || current.z || 1 };
      node.style.setProperty("--photo-x", `${x}%`); node.style.setProperty("--photo-y", `${y}%`);
      node.style.left = "var(--photo-x)"; node.style.top = "var(--photo-y)";
    }
  }

  function beginDesktopObjectDrag(event, target) {
    if (event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    const additive = event.shiftKey || event.metaKey || event.ctrlKey;
    if (!target.classList.contains("selected")) {
      if (target.classList.contains("photo-file")) selectDesktopPhoto(target, additive);
      else selectDesktopItem(target, additive);
    }
    let group = selectedDesktopObjects(); if (!group.length) group = [target];
    const startX = event.clientX, startY = event.clientY;
    const starts = new Map(group.map((node) => [node, objectBox(node)]));
    let moved = false, lastX = startX, lastY = startY;
    group.filter((node) => node.classList.contains("photo-file")).forEach((node) => { node.style.zIndex = String(++photoZCounter); });
    document.body.classList.add("desktop-dragging");

    const move = (moveEvent) => {
      lastX = moveEvent.clientX; lastY = moveEvent.clientY;
      let dx = lastX - startX, dy = lastY - startY;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      moved = true;
      const liveDockRect = dock.getBoundingClientRect();
      const overDock = lastX >= liveDockRect.left - 20 && lastX <= liveDockRect.right + 20 && lastY >= liveDockRect.top - 35 && lastY <= liveDockRect.bottom + 20;
      dock.classList.toggle("drop-ready", Boolean(overDock && group.length === 1 && target.classList.contains("desktop-item") && target.dataset.dockKey));
      group.forEach((node) => {
        const start = starts.get(node);
        const halfW = start.width / 2, halfH = start.height / 2;
        const x = Math.min(desktop.clientWidth - halfW - 6, Math.max(halfW + 6, start.centerX + dx));
        const y = Math.min(desktop.clientHeight - halfH - 105, Math.max(halfH + 6, start.centerY + dy));
        node.classList.add("dragging"); node.style.left = `${x}px`; node.style.top = `${y}px`;
      });
    };

    const finish = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      document.body.classList.remove("desktop-dragging");
      dock.classList.remove("drop-ready");
      const dockRect = dock.getBoundingClientRect();
      const droppedOnDock = moved && lastX >= dockRect.left - 20 && lastX <= dockRect.right + 20 && lastY >= dockRect.top - 30 && lastY <= dockRect.bottom + 20;
      const singleDockKey = group.length === 1 && target.classList.contains("desktop-item") ? target.dataset.dockKey : null;
      group.forEach((node) => {
        node.classList.remove("dragging"); node._suppressClick = moved;
        setTimeout(() => { node._suppressClick = false; }, 0);
      });
      if (droppedOnDock && singleDockKey) {
        addAppToDock(singleDockKey, lastX);
        const original = state.icons[target.dataset.id] || defaultIcons[target.dataset.id];
        target.style.setProperty("--x", `${original.x}%`); target.style.setProperty("--y", `${original.y}%`);
        target.style.left = "var(--x)"; target.style.top = "var(--y)";
      } else if (moved) {
        group.forEach(persistObjectPosition); saveState();
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish, { once: true });
  }

  function beginMarqueeSelection(event) {
    if (event.button !== 0 || !(event.target === desktop || event.target.classList.contains("wallpaper"))) return;
    if (event.target.closest(".mac-window,.dock,.now-widget,.photo-file,.desktop-item,.menu-bar")) return;
    event.preventDefault(); closeMenus();
    const desktopRect = desktop.getBoundingClientRect();
    const startX = event.clientX - desktopRect.left, startY = event.clientY - desktopRect.top;
    const additive = event.shiftKey || event.metaKey || event.ctrlKey;
    const preserved = new Set(additive ? selectedDesktopObjects() : []);
    if (!additive) clearDesktopSelection();
    selectionRectangle.hidden = false;
    selectionRectangle.classList.add("active");
    const move = (moveEvent) => {
      const x = moveEvent.clientX - desktopRect.left, y = moveEvent.clientY - desktopRect.top;
      const left = Math.min(startX, x), top = Math.min(startY, y), width = Math.abs(x - startX), height = Math.abs(y - startY);
      Object.assign(selectionRectangle.style, { left:`${left}px`, top:`${top}px`, width:`${width}px`, height:`${height}px` });
      const box = { left, top, right:left+width, bottom:top+height };
      [...iconNodes, ...$$(".photo-file", desktopPhotosRoot)].forEach((node) => {
        const rect = objectBox(node); const hit = rect.left < box.right && rect.left + rect.width > box.left && rect.top < box.bottom && rect.top + rect.height > box.top;
        node.classList.toggle("selected", hit || preserved.has(node));
      });
    };
    const finish = () => {
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", finish);
      selectionRectangle.hidden = true;
      selectionRectangle.classList.remove("active");
      Object.assign(selectionRectangle.style, { width:"0", height:"0" });
      const selectedPhoto = $$(".photo-file.selected", desktopPhotosRoot)[0]; selectedPhotoId = selectedPhoto?.dataset.photoId || null;
    };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", finish, { once:true });
  }

  function beginWidgetDrag(event) {
    if (event.button !== 0 || event.target.closest("button")) return;
    event.preventDefault(); event.stopPropagation();
    const desktopRect = desktop.getBoundingClientRect(); const rect = currentWidget.getBoundingClientRect();
    const startX = event.clientX, startY = event.clientY;
    const startLeft = rect.left - desktopRect.left + rect.width / 2, startTop = rect.top - desktopRect.top;
    let moved = false;
    const move = (moveEvent) => {
      const dx = moveEvent.clientX - startX, dy = moveEvent.clientY - startY;
      if (!moved && Math.hypot(dx,dy) < 4) return;
      moved = true; currentWidget.classList.add("dragging");
      const left = Math.min(desktop.clientWidth - rect.width / 2 - 8, Math.max(rect.width / 2 + 8, startLeft + dx));
      const top = Math.min(desktop.clientHeight - rect.height - 105, Math.max(8, startTop + dy));
      currentWidget.style.left = `${left}px`; currentWidget.style.top = `${top}px`;
    };
    const finish = () => {
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", finish);
      currentWidget.classList.remove("dragging");
      if (moved) {
        const x = parseFloat(currentWidget.style.left) / desktop.clientWidth * 100;
        const y = parseFloat(currentWidget.style.top) / desktop.clientHeight * 100;
        state.widget = { x:+x.toFixed(3), y:+y.toFixed(3), z:40 };
        currentWidget.style.setProperty("--widget-x", `${x}%`); currentWidget.style.setProperty("--widget-y", `${y}%`);
        currentWidget.style.left = "var(--widget-x)"; currentWidget.style.top = "var(--widget-y)"; saveState();
      }
    };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", finish, { once:true });
  }

  function defaultWindowRect(appId, width, height) {
    const w = Math.min(width, desktop.clientWidth - 40);
    const h = Math.min(height, desktop.clientHeight - 118);
    const offset = Math.abs(hashString(appId)) % 5;
    return { left: Math.max(12, Math.round((desktop.clientWidth - w) / 2 + (offset - 2) * 18)), top: Math.max(10, Math.round((desktop.clientHeight - h) / 2 - 25 + offset * 8)), width:w, height:h };
  }

  function clampWindowRect(rect, definition = {}) {
    const minWidth = definition.min?.[0] || 560, minHeight = definition.min?.[1] || 390;
    const width = Math.min(Math.max(minWidth, rect.width), desktop.clientWidth);
    const height = Math.min(Math.max(minHeight, rect.height), desktop.clientHeight - 92);
    return { width, height, left: Math.min(Math.max(-width + 130, rect.left), desktop.clientWidth - 130), top: Math.min(Math.max(0, rect.top), desktop.clientHeight - 145) };
  }

  function createWindow(appId, definition = appDefinitions[appId]) {
    if (!definition) return null;
    const fragment = windowTemplate.content.cloneNode(true);
    const win = $(".mac-window", fragment);
    win.dataset.appWindow = appId;
    win.dataset.appName = definition.name || definition.title;
    win.setAttribute("aria-label", definition.title);
    $(".window-title", win).textContent = definition.title;
    $(".window-body", win).innerHTML = definition.render(appId);
    const saved = state.windows[appId];
    const initial = clampWindowRect(saved || defaultWindowRect(appId, ...definition.size), definition);
    Object.assign(win.style, { left:`${initial.left}px`, top:`${initial.top}px`, width:`${initial.width}px`, height:`${initial.height}px`, zIndex:++zCounter });
    windowsRoot.appendChild(win); wireWindow(win, definition); wireAppSpecific(win, appId); focusWindow(win);
    return win;
  }

  function openApp(appId) {
    closeMenus();
    let win = windowsRoot.querySelector(`[data-app-window="${CSS.escape(appId)}"]`);
    if (!win) win = createWindow(appId);
    if (!win) return;
    win.hidden = false; win.classList.remove("minimizing"); focusWindow(win); playSound("open"); renderDock(); bounceDock(appId);
  }

  function openProject(projectId) {
    const project = projectDefinitions[projectId]; if (!project) return;
    const appId = `project-${projectId}`;
    let win = windowsRoot.querySelector(`[data-app-window="${CSS.escape(appId)}"]`);
    if (!win) win = createWindow(appId, { name:"Preview", title:project.title, size:[760,590], min:[600,450], render:() => renderProject(project) });
    win.hidden = false; focusWindow(win); playSound("open");
  }

  function openMediaFile(media) {
    if (!media?.src) return;
    const idBase = media.id || media.filename || media.src;
    const appId = `media-${safeId(idBase)}`;
    let win = windowsRoot.querySelector(`[data-app-window="${CSS.escape(appId)}"]`);
    if (!win) {
      const type = media.type || mediaTypeFromSrc(media.src);
      const ratio = Number(media.aspectRatio) || (type === "video" ? 16/9 : 4/3);
      const width = Math.min(1080, Math.max(720, desktop.clientWidth * .7));
      const height = Math.min(760, Math.max(500, width / ratio + 56));
      win = createWindow(appId, {
        name: type === "video" ? "Video" : "Preview",
        title: media.filename || media.src.split("/").pop() || "Media",
        size:[width,height], min:[560,380],
        render:() => renderMediaViewer(media, type)
      });
      win.classList.add("media-window");
    }
    win.hidden = false; focusWindow(win); playSound("open");
  }

  function focusWindow(win) {
    if (!win || win.hidden) return;
    activeWindow = win;
    $$(".mac-window", windowsRoot).forEach((node) => node.classList.toggle("inactive", node !== win));
    win.style.zIndex = String(++zCounter);
    activeAppName.textContent = win.dataset.appName || appDefinitions[win.dataset.appWindow]?.name || "Rizvisions";
    renderDock();
  }

  function saveWindowRect(win) {
    if (!win || win.classList.contains("maximized")) return;
    const appId = win.dataset.appWindow;
    state.windows[appId] = { left:win.offsetLeft, top:win.offsetTop, width:win.offsetWidth, height:win.offsetHeight };
    saveState();
  }

  function closeWindow(win = activeWindow) {
    if (!win) return; saveWindowRect(win); win.remove(); playSound("close");
    activeWindow = $$(".mac-window:not([hidden])", windowsRoot).sort((a,b) => Number(a.style.zIndex)-Number(b.style.zIndex)).pop() || null;
    if (activeWindow) focusWindow(activeWindow); else activeAppName.textContent = "Rizvisions";
    renderDock();
  }

  function minimizeWindow(win = activeWindow) {
    if (!win) return; saveWindowRect(win); win.classList.add("minimizing");
    setTimeout(() => { win.hidden = true; win.classList.remove("minimizing"); activeWindow = $$(".mac-window:not([hidden])", windowsRoot).sort((a,b)=>Number(a.style.zIndex)-Number(b.style.zIndex)).pop() || null; if (activeWindow) focusWindow(activeWindow); else activeAppName.textContent = "Rizvisions"; renderDock(); }, 210);
  }

  function zoomWindow(win = activeWindow) {
    if (!win) return;
    if (win.classList.contains("maximized")) {
      const previous = JSON.parse(win.dataset.previousRect || "{}");
      win.classList.remove("maximized"); Object.assign(win.style, { left:`${previous.left || 20}px`, top:`${previous.top || 20}px`, width:`${previous.width || 850}px`, height:`${previous.height || 600}px` });
    } else {
      win.dataset.previousRect = JSON.stringify({ left:win.offsetLeft, top:win.offsetTop, width:win.offsetWidth, height:win.offsetHeight });
      win.classList.add("maximized"); Object.assign(win.style, { left:"0px", top:"0px", width:"100%", height:"calc(100% - 102px)" });
    }
    focusWindow(win);
  }

  function wireWindow(win, definition) {
    win.addEventListener("pointerdown", () => focusWindow(win));
    $$("[data-window-action]", win).forEach((button) => button.addEventListener("click", (event) => {
      event.stopPropagation(); const action = button.dataset.windowAction;
      if (action === "close") closeWindow(win); if (action === "minimize") minimizeWindow(win); if (action === "zoom") zoomWindow(win);
    }));
    $(".drag-handle", win).addEventListener("pointerdown", (event) => beginWindowDrag(event, win));
    $$("[data-resize]", win).forEach((handle) => handle.addEventListener("pointerdown", (event) => beginWindowResize(event, win, handle.dataset.resize, definition)));
  }

  function beginWindowDrag(event, win) {
    if (event.button !== 0 || event.target.closest(".traffic-lights") || win.classList.contains("maximized")) return;
    event.preventDefault(); focusWindow(win);
    const startX = event.clientX, startY = event.clientY, startLeft = win.offsetLeft, startTop = win.offsetTop;
    const move = (moveEvent) => { const clamped = clampWindowRect({ left:startLeft+moveEvent.clientX-startX, top:startTop+moveEvent.clientY-startY, width:win.offsetWidth, height:win.offsetHeight }, { min:[320,220] }); win.style.left=`${clamped.left}px`; win.style.top=`${clamped.top}px`; };
    const finish = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", finish); saveWindowRect(win); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", finish, { once:true });
  }

  function beginWindowResize(event, win, direction, definition) {
    if (event.button !== 0 || win.classList.contains("maximized")) return;
    event.preventDefault(); event.stopPropagation(); focusWindow(win); document.body.classList.add("window-resizing");
    const start = { x:event.clientX, y:event.clientY, left:win.offsetLeft, top:win.offsetTop, width:win.offsetWidth, height:win.offsetHeight };
    const minW = definition.min?.[0] || 560, minH = definition.min?.[1] || 390;
    const move = (moveEvent) => {
      const dx = moveEvent.clientX-start.x, dy = moveEvent.clientY-start.y;
      let left=start.left, top=start.top, width=start.width, height=start.height;
      if (direction.includes("e")) width = Math.max(minW, start.width + dx);
      if (direction.includes("s")) height = Math.max(minH, start.height + dy);
      if (direction.includes("w")) { width=Math.max(minW,start.width-dx); left=start.left+(start.width-width); }
      if (direction.includes("n")) { height=Math.max(minH,start.height-dy); top=start.top+(start.height-height); }
      const clamped = clampWindowRect({ left,top,width,height }, definition);
      Object.assign(win.style, { left:`${clamped.left}px`, top:`${clamped.top}px`, width:`${clamped.width}px`, height:`${clamped.height}px` });
    };
    const finish = () => { window.removeEventListener("pointermove",move); window.removeEventListener("pointerup",finish); document.body.classList.remove("window-resizing"); saveWindowRect(win); };
    window.addEventListener("pointermove",move); window.addEventListener("pointerup",finish,{once:true});
  }

  function renderDock() {
    const oldRects = new Map($$(".dock-item[data-dock-key]", dock).map((node) => [node.dataset.dockKey, node.getBoundingClientRect()]));
    dock.innerHTML = "";
    const pinnedKeys = normalizeDock(state.dock);
    state.dock = pinnedKeys;

    // Any open standard app that is not pinned gets a temporary Dock icon.
    // It remains there while the window is open or minimized, and disappears on close.
    const openAppIds = [...new Set($$(".mac-window", windowsRoot).map((win) => win.dataset.appWindow))];
    const temporaryKeys = [];
    openAppIds.forEach((appId) => {
      const key = Object.keys(DOCK_CATALOG).find((catalogKey) => {
        const item = DOCK_CATALOG[catalogKey];
        return !["finder", "trash"].includes(catalogKey) && item.app === appId;
      });
      if (key && !pinnedKeys.includes(key) && !temporaryKeys.includes(key)) temporaryKeys.push(key);
    });

    const renderKeys = [...pinnedKeys.slice(0, -1), ...temporaryKeys, "trash"];
    renderKeys.forEach((key, index) => {
      if (key === "trash" && index > 0) { const sep = document.createElement("span"); sep.className="dock-separator"; dock.appendChild(sep); }
      const item = DOCK_CATALOG[key];
      const temporary = temporaryKeys.includes(key);
      const button = document.createElement("button");
      button.type="button";
      button.className=`dock-item ${item.kind === "trash" ? "trash-dock" : ""} ${temporary ? "temporary-app" : ""}`;
      button.dataset.dockKey=key; button.dataset.app=item.app; button.dataset.tooltip=item.label;
      const running = item.running || $$(".mac-window", windowsRoot).some((win) => {
        const id=win.dataset.appWindow; return id===item.app || (item.app==="work" && id.startsWith("project-"));
      });
      button.classList.toggle("running", running);
      button.innerHTML = `<img src="${item.icon}" alt="">${item.badge ? `<span class="notification-badge dock-badge">${item.badge}</span>` : ""}<span class="running-dot"></span>`;
      button.addEventListener("click", () => {
        if (button._suppressClick) return;
        const existing = windowsRoot.querySelector(`[data-app-window="${CSS.escape(item.app)}"]`);
        if (existing?.hidden) { existing.hidden=false; focusWindow(existing); playSound("open"); renderDock(); }
        else openApp(item.app);
      });
      if (!temporary) wireDockDrag(button, key);
      dock.appendChild(button);
    });
    updateClockAndCalendar();
    requestAnimationFrame(() => {
      $$(".dock-item[data-dock-key]", dock).forEach((node) => {
        const old = oldRects.get(node.dataset.dockKey); if (!old) return;
        const rect = node.getBoundingClientRect(); const dx=old.left-rect.left;
        if (Math.abs(dx)>1) { node.animate([{ transform:`translateX(${dx}px)` },{ transform:"translateX(0)" }],{duration:190,easing:"cubic-bezier(.2,.8,.2,1)"}); }
      });
    });
  }

  function addAppToDock(key, clientX) {
    if (!DOCK_CATALOG[key]) return;
    const without = state.dock.filter((item) => item !== key && item !== "trash" && item !== "finder");
    const dockItems = $$(".dock-item", dock).filter((node) => !["finder","trash"].includes(node.dataset.dockKey));
    let insertAt = without.length;
    dockItems.some((node, index) => { const rect=node.getBoundingClientRect(); if (clientX < rect.left + rect.width/2) { insertAt=index; return true; } return false; });
    without.splice(insertAt,0,key); state.dock=["finder",...without,"trash"]; saveState(); renderDock(); showToast(`${DOCK_CATALOG[key].label} added to Dock`);
  }

  function wireDockDrag(button, key) {
    button.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      const item = DOCK_CATALOG[key];
      const startX = event.clientX, startY = event.clientY;
      let moved = false, lastX = startX, lastY = startY;
      const move = (moveEvent) => {
        lastX = moveEvent.clientX; lastY = moveEvent.clientY;
        if (!moved && Math.hypot(lastX - startX, lastY - startY) < 5) return;
        moved = true; button.classList.add("dock-dragging");
        const candidates = $$(".dock-item[data-dock-key]", dock).filter((node) => node !== button && !["finder","trash"].includes(node.dataset.dockKey));
        const target = candidates.find((node) => lastX < node.getBoundingClientRect().left + node.offsetWidth / 2);
        const separator = $(".dock-separator", dock);
        if (!item.fixed) {
          if (target) dock.insertBefore(button, target);
          else dock.insertBefore(button, separator || null);
        }
      };
      const finish = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", finish);
        button.classList.remove("dock-dragging");
        if (!moved) return;
        button._suppressClick = true;
        setTimeout(() => { button._suppressClick = false; }, 90);
        const rect = dock.getBoundingClientRect();
        const outside = lastY < rect.top - 45 || lastY > rect.bottom + 45 || lastX < rect.left - 45 || lastX > rect.right + 45;
        if (outside && !item.fixed) {
          state.dock = state.dock.filter((dockKey) => dockKey !== key);
          showToast(`${item.label} removed from Dock`);
        } else {
          state.dock = normalizeDock($$(".dock-item[data-dock-key]", dock).map((node) => node.dataset.dockKey));
        }
        saveState(); renderDock();
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", finish, { once:true });
    });
  }

  function bounceDock(appId) {
    const item = dock.querySelector(`.dock-item[data-app="${CSS.escape(appId)}"]`); if (!item) return;
    item.classList.remove("bounce"); void item.offsetWidth; item.classList.add("bounce"); setTimeout(()=>item.classList.remove("bounce"),650);
  }

  function resetDock() { state.dock=[...DEFAULT_DOCK]; state.dockMagnification=true; saveState(); renderDock(); showToast("Dock restored"); }

  function resetLayout() {
    state.icons=clone(defaultIcons);state.photos=clone(defaultPhotos);state.widget=clone(defaultWidget);state.windows={};state.widgetIndex=0;
    $$(".mac-window",windowsRoot).forEach((win)=>win.remove());activeWindow=null;activeAppName.textContent="Rizvisions";
    applyIconLayout();applyPhotoLayout();applyWidgetLayout();updateCurrentWidget();saveState();renderDock();showToast("Desktop layout restored");
  }

  function fullReset() {
    if (!window.confirm("Reset Rizvisions on this browser? This clears appearance, Dock, icon positions, windows, and Notes.")) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    state=clone(DEFAULT_STATE);setWallpaper(state.wallpaper,false);renderDesktopPhotos();applyIconLayout();applyWidgetLayout();applyDisplayState();resetLayout();renderDock();saveState();showToast("Rizvisions reset");
  }

  function sortIcons() {
    const cols=[34,42.2,50.4,58.6]; const rows=[24.8,41,57.2];
    iconNodes.forEach((node,index)=>{state.icons[node.dataset.id]={x:cols[index%4],y:rows[Math.floor(index/4)]||57.2};});applyIconLayout();saveState();showToast("Icons sorted");
  }

  function updateCurrentWidget(animate=false) {
    const index=((Number(state.widgetIndex)||0)%currentCards.length+currentCards.length)%currentCards.length;state.widgetIndex=index;const card=currentCards[index];if(!card)return;
    currentWidget.classList.toggle("changing",animate);$("#widgetEyebrow").textContent=card.eyebrow;$("#widgetTitle").textContent=card.title;$("#widgetSubtitle").textContent=card.subtitle;
    const ncTitle=$("#ncCurrentTitle"),ncSub=$("#ncCurrentSubtitle");if(ncTitle)ncTitle.textContent=card.title;if(ncSub)ncSub.textContent=card.subtitle;
    $("#widgetProgress").innerHTML=currentCards.map((_,i)=>`<i class="${i===index?"active":""}"></i>`).join("");if(animate)setTimeout(()=>currentWidget.classList.remove("changing"),220);
  }

  function showCurrentCard() { const card=currentCards[state.widgetIndex%currentCards.length]; if(!card)return; if(card.kind==="app")openApp(card.target);else if(card.kind==="project")openProject(card.target);else if(card.kind==="external")window.open(card.target,"_blank","noopener"); }

  function closeMenus() {
    $$(".menu-popover.open,.context-menu.open").forEach((node)=>node.classList.remove("open"));
    $$(".menu-trigger.open").forEach((node)=>node.classList.remove("open"));
    controlCenter?.classList.remove("open");controlCenter?.setAttribute("aria-hidden","true");
    notificationCenter?.classList.remove("open");notificationCenter?.setAttribute("aria-hidden","true");
  }

  function toggleMenu(trigger) { const menu=$(`#${trigger.dataset.menu}`); const open=menu?.classList.contains("open"); closeMenus(); if(menu&&!open){menu.classList.add("open");trigger.classList.add("open");} }
  function positionPopover(node,x,y){node.style.left=`${Math.min(x,window.innerWidth-node.offsetWidth-12)}px`;node.style.top=`${Math.min(y,window.innerHeight-node.offsetHeight-12)}px`;}

  function openSpotlight(){closeMenus();spotlightBackdrop.classList.add("open");spotlightBackdrop.setAttribute("aria-hidden","false");spotlightInput.value="";renderSpotlightResults("");requestAnimationFrame(()=>spotlightInput.focus());}
  function closeSpotlight(){spotlightBackdrop.classList.remove("open");spotlightBackdrop.setAttribute("aria-hidden","true");spotlightInput.blur();}
  function renderSpotlightResults(query){const q=query.trim().toLowerCase();spotlightMatches=spotlightItems.filter((item)=>!q||`${item.title} ${item.subtitle} ${item.keywords}`.toLowerCase().includes(q)).slice(0,9);spotlightIndex=Math.min(spotlightIndex,Math.max(0,spotlightMatches.length-1));spotlightResults.innerHTML=spotlightMatches.length?spotlightMatches.map((item,index)=>`<button class="spotlight-result ${index===spotlightIndex?"active":""}" data-spotlight-index="${index}"><img src="${item.icon}" alt=""><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.subtitle)}</small></span><em>↵</em></button>`).join(""):`<div class="spotlight-empty">No results for “${escapeHtml(query)}”</div>`;$$('[data-spotlight-index]',spotlightResults).forEach((button)=>button.addEventListener("click",()=>runSpotlight(Number(button.dataset.spotlightIndex))));}
  function runSpotlight(index){const item=spotlightMatches[index];if(!item)return;closeSpotlight();item.run();}

  function renderMiniCalendar(date) {
    const root=$("#ncMiniGrid");if(!root)return;const year=date.getFullYear(),month=date.getMonth(),first=new Date(year,month,1),days=new Date(year,month+1,0).getDate();
    root.innerHTML=[...['S','M','T','W','T','F','S'].map((label)=>`<b>${label}</b>`),...Array(first.getDay()).fill("<span></span>"),...Array.from({length:days},(_,i)=>`<span class="${i+1===date.getDate()?"today":""}">${i+1}</span>`)].join("");
  }

  function updateClockAndCalendar(){
    const now=new Date();
    const chicagoDateTime=new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}).format(now).replace(",","");
    $("#clock").textContent=chicagoDateTime;
    const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",weekday:"long",day:"numeric",month:"long",year:"numeric",hour:"numeric",minute:"2-digit"}).formatToParts(now);
    const get=(type,fallback)=>parts.find((part)=>part.type===type)?.value||fallback;
    const weekday=get("weekday","Thursday"), day=get("day","6"), month=get("month","August"), year=get("year","2026");
    if($("#ncWeekday")) $("#ncWeekday").textContent=weekday;
    if($("#ncDay")) $("#ncDay").textContent=day;
    if($("#ncMonth")) $("#ncMonth").textContent=`${month} ${year}`;
    if($("#ncLargeTime")) $("#ncLargeTime").textContent=new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",hour:"numeric",minute:"2-digit"}).format(now);
  }

  function weatherLabel(code){if(code===0)return{label:"Clear"};if([1,2].includes(code))return{label:"Mostly clear"};if(code===3)return{label:"Cloudy"};if([51,53,55,61,63,65,80,81,82].includes(code))return{label:"Rain"};if([71,73,75,85,86].includes(code))return{label:"Snow"};if([95,96,99].includes(code))return{label:"Storms"};return{label:"Chicago"};}
  function weatherGlyph(code){if(code===0)return"☀";if([1,2].includes(code))return"◐";if(code===3)return"☁";if([51,53,55,61,63,65,80,81,82].includes(code))return"☂";if([71,73,75,85,86].includes(code))return"❄";return"☁";}

  function wireAppSpecific(win, appId) {
    if (appId === "terminal") wireTerminal(win);
    if (appId === "notes") { const textarea=$("textarea",win);textarea.value=state.notes;textarea.addEventListener("input",()=>{state.notes=textarea.value;saveState();}); }
    if (appId === "photos") {
      $$('[data-media-index]',win).forEach((button)=>button.addEventListener("dblclick",()=>openMediaFile((CONTENT.photoLibrary||[])[Number(button.dataset.mediaIndex)])));
      $$('[data-photo-filter]',win).forEach((button)=>button.addEventListener("click",()=>{$$('[data-photo-filter]',win).forEach((node)=>node.classList.toggle("active",node===button));}));
    }
    if (appId === "settings") {
      $$('[data-settings-wallpaper]',win).forEach((button)=>button.addEventListener("click",()=>setWallpaper(button.dataset.settingsWallpaper)));
      $("[data-settings-reset]",win)?.addEventListener("click",resetLayout);
    }
  }

  function renderFinder(){return `<div class="finder-shell"><aside class="finder-sidebar"><div class="sidebar-section"><div class="sidebar-title">Favorites</div><div class="sidebar-row active"><span class="sidebar-glyph">◫</span>Selected Work</div><div class="sidebar-row"><span class="sidebar-glyph">◉</span>Recents</div><div class="sidebar-row" data-app="photos"><span class="sidebar-glyph">⌁</span>Photos</div></div><div class="sidebar-section"><div class="sidebar-title">Locations</div><div class="sidebar-row"><span class="sidebar-glyph">▣</span>Rizvisions</div><div class="sidebar-row"><span class="sidebar-glyph">☁</span>iCloud Drive</div></div></aside><main class="finder-main"><div class="finder-toolbar"><button class="toolbar-button">‹</button><button class="toolbar-button">›</button><strong>Selected Work</strong><span class="toolbar-spacer"></span><button class="toolbar-button">▦</button><input class="search-field" placeholder="Search"></div><div class="finder-content"><div class="finder-grid">${[["parker","Parker","#8b7fd1"],["bluespecs","Blue Specs","#2686e8"],["whop","Whop + WAP","#ff453a"],["windsurf","Windsurf","#30b0c7"],["creator","Creator Work","#8e8e93"]].map(([id,label,color])=>`<button class="file-item" data-project="${id}"><span class="finder-folder"><img src="assets/icons/macos/folder.png" alt=""><i style="--tag:${color}"></i></span><span class="file-name">${label}</span></button>`).join("")}<button class="file-item" data-app="photos"><img src="assets/icons/macos/photos.png" alt=""><span class="file-name">Photography</span></button><button class="file-item" data-app="notes"><img src="assets/icons/macos/notes.png" alt=""><span class="file-name">Random Notes</span></button></div></div><div class="finder-statusbar">7 items · Rizvisions</div></main></div>`;}

  function renderAbout(){return `<div class="about-app"><aside class="about-rail"><img class="about-eye" src="assets/icons/macos/rizvisions.png" alt=""><span>RIZVISIONS</span><nav><button class="active">Overview</button><button data-app="work">Work</button><button data-app="photos">Photos</button></nav></aside><main class="about-content"><header><span class="eyebrow">RIZ ZAHEER</span><h1>I build things on the internet and document the rest.</h1><p>Creator and operator in Chicago. I work at Parker, make photos and videos, and have used Rizvisions as a creative identity since middle school.</p></header><section class="about-stats"><div><small>Currently</small><strong>Parker</strong><button data-app="parker">Open app</button></div><div><small>Based</small><strong>Chicago</strong><span>Gold Coast / Oak Brook orbit</span></div><div><small>Internet</small><strong>30M+</strong><span>lifetime short-form views</span></div></section><section class="about-links"><button data-external="https://www.linkedin.com/in/riz-zaheer/">LinkedIn ↗</button><button data-app="instagram">Instagram</button><button data-external="https://x.com/rizvisions">X ↗</button><button data-app="spotify">Spotify</button></section><section class="about-now"><div><small>What this site is</small><p>A catch-all for work, personal stuff, photography, old businesses, current obsessions, and whatever else becomes part of my life.</p></div><div class="about-quote">“Permanent internet home” &gt; polished corporate portfolio.</div></section></main></div>`;}

  function renderSettings(){return `<div class="settings-shell"><aside class="settings-sidebar"><input class="settings-search" placeholder="Search"><div class="settings-profile-mini"><img src="assets/icons/macos/rizvisions.png" alt=""><span><strong>Rizvisions</strong><small>Desktop preferences</small></span></div><div class="settings-list"><div class="settings-row active"><span class="settings-row-icon">◐</span>Appearance</div><div class="settings-row"><span class="settings-row-icon">⌘</span>Desktop & Dock</div><div class="settings-row"><span class="settings-row-icon">♪</span>Sound</div><div class="settings-row"><span class="settings-row-icon">◉</span>About</div></div></aside><main class="settings-main"><h1>Appearance</h1><section class="settings-card"><h2>Wallpaper</h2><p>Choose the grid appearance used across the desktop and interface.</p><div class="settings-theme-grid">${[["grid","Light"],["dark","Dark"],["maroon","Maroon"],["forest","Forest"]].map(([id,label])=>`<button data-settings-wallpaper="${id}" class="theme-choice ${id}"><span></span><strong>${label}</strong></button>`).join("")}</div></section><section class="settings-card"><h2>Desktop & Dock</h2><div class="settings-info-row"><span><strong>Customize the Dock naturally</strong><small>Drag an app from the desktop onto the Dock. Drag Dock apps left or right to reorder, or drag one away to remove it.</small></span></div><button class="mac-button" data-settings-reset>Restore Desktop Layout</button></section><section class="settings-card"><h2>About this build</h2><div class="settings-info-row"><img src="assets/icons/macos/rizvisions.png" alt=""><span><strong>Rizvisions OS 9</strong><small>A personal website pretending to be a Mac.</small></span></div></section></main></div>`;}

  function renderPhotos(){
    const photos=CONTENT.photoLibrary||[];
    const featured=photos[0]||{};
    const mediaPreview=(media,classes="")=>{
      const type=media.type||mediaTypeFromSrc(media.src);
      if(type==="video") return `<video class="${classes}" src="${escapeHtml(media.src)}" muted playsinline preload="metadata" poster="${escapeHtml(media.poster||"")}"></video>`;
      return `<img class="${classes}" src="${escapeHtml(media.src||"")}" alt="${escapeHtml(media.alt||"")}" draggable="false">`;
    };
    return `<div class="photos-app"><aside class="photos-nav"><div class="photos-nav-title"><img src="assets/icons/macos/photos.png" alt=""><strong>Photos</strong></div><div class="sidebar-title">Library</div><button class="active"><span>▦</span>Library</button><button><span>◷</span>Recents</button><button><span>♡</span>Favorites</button><div class="sidebar-title">Albums</div><button><span>▣</span>Chicago</button><button><span>▣</span>Film</button><button><span>▣</span>Rizvisions</button><div class="photos-source-note">Add files to <code>assets/media</code>. V9.5 discovers them automatically.</div></aside><main class="photos-library"><div class="photos-topbar"><div><h1>Library</h1><small>${photos.length} items · Rizvisions archive</small></div><div class="photos-segmented"><button>Years</button><button>Months</button><button class="active">All Photos</button></div><div class="photos-toolbar-actions"><button title="Media upload guide" data-action="media-help">?</button></div></div>${photos.length?`<section class="photos-feature">${mediaPreview(featured)}<div><span>FEATURED</span><strong>Rizvisions Archive</strong><p>Photography, video, Chicago, people, travel, and years of visual experiments.</p></div></section><div class="photos-date-heading"><div><strong>${escapeHtml(featured.date||"Latest")}</strong><small>${escapeHtml(featured.location||"Rizvisions")}</small></div></div><div class="photos-masonry">${photos.map((media,index)=>`<button class="photo-tile tile-${index%7}" data-media-index="${index}">${mediaPreview(media)}<span>${escapeHtml(media.filename||media.alt||`IMG_${index+1}`)}</span>${(media.type||mediaTypeFromSrc(media.src))==="video"?'<i class="video-duration">▶ video</i>':''}</button>`).join("")}</div>`:`<div class="photos-empty"><img src="assets/icons/macos/photos.png" alt=""><h2>Your library is ready</h2><p>Upload photos or MP4 videos to <code>assets/media</code>. They will appear here automatically.</p><button class="mac-button primary" data-action="media-help">See the 3-step guide</button></div>`}</main></div>`;
  }

  function renderMessages(){return `<div class="messages-shell"><aside class="conversation-list"><input class="message-search" placeholder="Search"><div class="conversation active"><span class="avatar">R</span><span><strong>Riz</strong><small>Welcome to my corner of the internet.</small></span><time>now</time></div><div class="conversation"><span class="avatar">P</span><span><strong>Parker</strong><small>Back to work?</small></span><time>1:04 AM</time></div></aside><main class="chat-pane"><div class="chat-header">Riz</div><div class="chat-body"><div class="bubble in">You made it this far. What do you want to know?</div><div class="bubble out">This site is cool. How do I reach you?</div><div class="bubble in">LinkedIn is best for work. Instagram works for everything else.</div><div class="chat-actions"><button class="mac-button primary" data-external="https://www.linkedin.com/in/riz-zaheer/">Open LinkedIn</button><button class="mac-button" data-app="instagram">Open Instagram</button></div></div><div class="chat-input">iMessage</div></main></div>`;}

  function renderInstagram(){
    const accounts=[
      {handle:"@rizvisions",description:"Photography, creative work, and life",initials:"RV",url:"https://www.instagram.com/rizvisions/"},
      {handle:"@rizgoestomarket",description:"AI, GTM, Parker, and work-brain content",initials:"GT",url:"https://www.instagram.com/rizgoestomarket/"},
      {handle:"@rizzaheer",description:"Personal — friends and family",initials:"RZ",url:"https://www.instagram.com/rizzaheer/"}
    ];
    return `<div class="instagram-shell"><div class="instagram-heading"><img src="assets/icons/macos/instagram.png" alt="Instagram"><h2>Choose an Instagram</h2><p>Different accounts for different parts of my life.</p></div><div class="account-list">${accounts.map((account)=>`<button type="button" class="account-row" data-external="${account.url}"><span class="account-avatar">${account.initials}</span><span><strong>${account.handle}</strong><small>${account.description}</small></span><span class="chevron">›</span></button>`).join("")}</div></div>`;
  }

  function renderSafari(){return `<div class="safari-shell"><div class="safari-toolbar"><button>‹</button><button>›</button><button>▣</button><div class="safari-address"><span>🔒</span> rizvisions.com</div><button>↗</button><button>＋</button></div><div class="safari-page"><div class="safari-start"><img src="assets/icons/macos/rizvisions.png" alt=""><h1>Start Page</h1><div class="safari-favorites">${[["Parker","assets/icons/macos/parker.png","https://heyparker.ai/"],["LinkedIn","assets/icons/macos/mail.png","https://www.linkedin.com/in/riz-zaheer/"],["Instagram","assets/icons/macos/instagram.png","https://www.instagram.com/rizvisions/"],["Spotify","assets/icons/macos/spotify.png","https://open.spotify.com/user/riz002"],["X","assets/icons/macos/rizvisions.png","https://x.com/rizvisions"]].map(([label,icon,href])=>`<button data-external="${href}"><span><img src="${icon}" alt=""></span><strong>${label}</strong></button>`).join("")}</div><section class="safari-reading"><div><span>READING LIST</span><strong>The internet home of Riz Zaheer</strong><p>Work, photos, projects, notes, music, and the weird archive still to come.</p></div><button data-app="about">Open About Riz</button></section></div></div></div>`;}

  function renderParker(){return `<div class="parker-app"><header class="parker-hero"><img src="assets/icons/macos/parker.png" alt="Parker"><div><span>CURRENTLY</span><h1>Parker</h1><p>AI creative strategy for ecommerce teams — and the place where most of my work brain lives right now.</p><button class="mac-button primary" data-external="https://heyparker.ai/">Visit heyparker.ai ↗</button></div></header><section class="parker-command"><span>Ask Parker</span><strong>“Cross-reference our reviews with our ad account and find creative angles we haven't tested.”</strong><button data-external="https://heyparker.ai/">→</button></section><section class="parker-grid"><article><span>01</span><h3>Creative intelligence</h3><p>Connect ad performance, customer language, competitors, content, and brand context.</p></article><article><span>02</span><h3>What I do</h3><p>Sales, demos, onboarding, support, customer research, GTM experiments, pricing, and product feedback.</p></article><article><span>03</span><h3>Parker Brain</h3><p>A context layer designed to make AI useful for marketers instead of generic.</p></article></section><footer><button data-project="parker">View my Parker story</button><button data-external="https://heyparker.ai/">Open website ↗</button></footer></div>`;}


  function renderSpotify(){return `<div class="spotify-only"><iframe data-testid="embed-iframe" src="https://open.spotify.com/embed/playlist/76WzEHradeFZfSUMLsxH7I?utm_source=generator&si=565dc6edf9be49a1" width="100%" height="100%" frameborder="0" allowfullscreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Rizvisions Spotify playlist"></iframe></div>`;}
  function renderNotes(){return `<div class="notes-shell"><aside class="notes-list"><div class="note-row active"><strong>Rizvisions roadmap</strong><small>Today · ${escapeHtml(state.notes.slice(0,45))}…</small></div><div class="note-row"><strong>Things I should build</strong><small>Yesterday · Guestbook, archive…</small></div></aside><main class="note-editor"><div class="note-meta">Today at ${new Date().toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}</div><textarea aria-label="Note"></textarea></main></div>`;}
  function renderTerminal(){return `<div class="terminal-shell"><div class="terminal-output">Last login: ${new Date().toLocaleDateString()} on ttys001\n\nRizvisions OS 9.5\nType <span class="terminal-link">help</span> to see available commands.\n</div><div class="terminal-input-row"><span class="terminal-prompt">riz@rizvisions ~ %</span><input class="terminal-input" autocomplete="off" spellcheck="false"></div></div>`;}
  function renderTrash(){return `<div class="empty-state"><div><img src="assets/icons/macos/trash.png" alt="Trash"><h2>Trash is Empty</h2><p>Old domains, failed ideas, embarrassing drafts, and abandoned businesses will eventually live here.</p></div></div>`;}

  function renderProject(project){return `<div class="project-preview"><div class="project-hero" style="--project:${project.color}"><span>${project.eyebrow}</span><h1>${project.title}</h1></div><div class="project-copy"><p>${project.description}</p><div class="project-facts">${project.facts.map((fact)=>`<div>${fact}</div>`).join("")}</div></div></div>`;}
  function renderMediaViewer(media,type){const body=type==="video"?`<video src="${escapeHtml(media.src)}" controls playsinline preload="metadata" poster="${escapeHtml(media.poster||"")}"></video>`:`<img src="${escapeHtml(media.src)}" alt="${escapeHtml(media.alt||"")}">`;return `<div class="media-viewer ${type}">${body}<div class="media-caption"><strong>${escapeHtml(media.filename||media.src.split('/').pop())}</strong>${media.alt?`<span>${escapeHtml(media.alt)}</span>`:""}</div></div>`;}

  function wireTerminal(win){const input=$(".terminal-input",win),output=$(".terminal-output",win);input.focus();input.addEventListener("keydown",(event)=>{if(event.key!=="Enter")return;const command=input.value.trim();output.textContent+=`\nriz@rizvisions ~ % ${command}\n`;input.value="";const lower=command.toLowerCase();if(lower==="help")output.textContent+="about  work  photos  parker  social  spotify  safari  clear\n";else if(["about","work","photos","parker","spotify","safari"].includes(lower)){output.textContent+=`Opening ${lower}…\n`;openApp(lower);}else if(lower==="social"){openApp("instagram");}else if(lower==="clear")output.textContent="";else if(lower==="sudo")output.textContent+="Riz is not in the sudoers file. This incident will be reported.\n";else if(lower)output.textContent+=`zsh: command not found: ${command}\n`;output.scrollTop=output.scrollHeight;});}

  async function discoverMediaLibrary() {
    const config=CONTENT.mediaLibrary||{};
    if(!config.autoDiscover) return;
    const owner=config.owner||"rizvisions",repo=config.repo||"portfolio",branch=config.branch||"main",path=config.path||"assets/media";
    const cacheKey=`rizvisions-media-index:${owner}/${repo}/${branch}/${path}`;
    let entries=null;
    const forceRefresh=performance.getEntriesByType?.("navigation")?.[0]?.type==="reload";
    try {
      const cached=JSON.parse(localStorage.getItem(cacheKey)||"null");
      if(!forceRefresh&&cached&&Date.now()-cached.savedAt<10*60*1000&&Array.isArray(cached.entries)) entries=cached.entries;
    } catch {}
    if(!entries){
      try {
        const endpoint=`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(branch)}`;
        const response=await fetch(endpoint,{headers:{Accept:"application/vnd.github+json"}});
        if(!response.ok) throw new Error(`media index ${response.status}`);
        const data=await response.json();
        entries=(Array.isArray(data)?data:[]).filter((file)=>file.type==="file"&&/\.(jpe?g|png|webp|gif|avif|mp4|m4v|webm|mov)$/i.test(file.name)).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:"base"})).map((file)=>({name:file.name}));
        try { localStorage.setItem(cacheKey,JSON.stringify({savedAt:Date.now(),entries})); } catch {}
      } catch (error) {
        console.info("Rizvisions media auto-discovery used fallback content.",error);
        return;
      }
    }
    if(!entries.length) return;
    const localSrc=(name)=>`${path}/${name.split("/").map(encodeURIComponent).join("/")}`;
    const humanize=(name)=>name.replace(/^desktop-\d*[-_]?/i,"").replace(/\.[^.]+$/,"").replace(/[-_]+/g," ").trim();
    const media=entries.map((file,index)=>{
      const type=mediaTypeFromSrc(file.name);
      const title=humanize(file.name)||`Media ${index+1}`;
      return {id:`auto-${safeId(file.name)}`,type,src:localSrc(file.name),alt:title,filename:file.name,date:"Rizvisions Archive",location:"Chicago"};
    });
    CONTENT.photoLibrary=media;
    const prefix=String(config.desktopPrefix||"desktop-").toLowerCase();
    let desktop=media.filter((item)=>item.filename.toLowerCase().startsWith(prefix));
    if(!desktop.length) desktop=media.slice(0,Math.min(4,media.length));
    desktop=desktop.slice(0,Number(config.maxDesktopItems)||6);
    const positions=[
      {x:78.2,y:28.0,rotation:-8},{x:85.0,y:25.8,rotation:8},{x:79.5,y:48.0,rotation:7},
      {x:86.3,y:49.0,rotation:-6},{x:80.8,y:67.0,rotation:-4},{x:88.0,y:67.5,rotation:6}
    ];
    CONTENT.desktopPhotos=desktop.map((item,index)=>({...item,...positions[index%positions.length],width:132,monochrome:false}));
    renderDesktopPhotos();
    const photosWindow=windowsRoot.querySelector('[data-app-window="photos"]');
    if(photosWindow){
      $(".window-body",photosWindow).innerHTML=renderPhotos();
      wireAppSpecific(photosWindow,"photos");
    }
  }

  function mediaTypeFromSrc(src=""){return /\.(mp4|mov|m4v|webm|ogg)$/i.test(src)?"video":"image";}
  function safeId(value){return String(value).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70)||"file";}
  function hashString(value){let hash=0;for(const char of String(value))hash=((hash<<5)-hash)+char.charCodeAt(0);return hash|0;}

  function handleAction(action){
    if(action==="open-about")openApp("about");
    if(action==="open-settings")openApp("settings");
    if(action==="reset-layout")resetLayout();
    if(action==="reset-os")fullReset();
    if(action==="close-active")closeWindow();
    if(action==="minimize-active")minimizeWindow();
    if(action==="zoom-active")zoomWindow();
    if(action==="bring-all-front")$$(".mac-window:not([hidden])",windowsRoot).forEach(focusWindow);
    if(action==="open-spotlight")openSpotlight();
    if(action==="cycle-wallpaper")cycleWallpaper();
    if(action==="sort-icons")sortIcons();
    if(action==="desktop-info")showToast("Rizvisions Desktop · Version 9.5");
    if(action==="quick-look-photo"){const photo=(CONTENT.desktopPhotos||[]).find((item)=>item.id===(contextPhotoId||selectedPhotoId));if(photo)openMediaFile(photo);}
    if(action==="bring-photo-front"){const file=desktopPhotosRoot.querySelector(`[data-photo-id="${CSS.escape(contextPhotoId||"")}"]`);if(file){file.style.zIndex=String(++photoZCounter);persistObjectPosition(file);saveState();}}
    if(action==="reset-photo-position"){if(contextPhotoId&&defaultPhotos[contextPhotoId]){state.photos[contextPhotoId]=clone(defaultPhotos[contextPhotoId]);applyPhotoLayout();saveState();showToast("Photo put back");}}
    if(action==="show-current-card")showCurrentCard();
    if(action==="dock-reset")resetDock();
    if(action==="dock-magnification"){state.dockMagnification=!state.dockMagnification;dock.classList.toggle("no-magnify",!state.dockMagnification);saveState();showToast(state.dockMagnification?"Dock magnification on":"Dock magnification off");}
    if(action==="media-help")window.alert("Add media in 3 steps:\n\n1. Open assets/media in your GitHub repo.\n2. Drag in JPG, PNG, WebP, GIF, or MP4 files.\n3. Commit and wait for Pages to deploy.\n\nFiles named desktop-01-..., desktop-02-... appear on the desktop. Everything appears in Photos automatically.");
    if(action==="show-shortcuts")window.alert("⌘Space Spotlight\nSpace Open selected photo or video\n⌘N New Finder Window\n⌘W Close Window\n⌘M Minimize\nDrag desktop apps to the Dock.");
  }

  function bindEvents(){
    $$(".menu-trigger").forEach((trigger)=>trigger.addEventListener("click",(event)=>{event.stopPropagation();toggleMenu(trigger);}));
    controlCenterButton?.addEventListener("click",(event)=>{event.stopPropagation();const open=controlCenter.classList.contains("open");closeMenus();controlCenter.classList.toggle("open",!open);controlCenter.setAttribute("aria-hidden",String(open));});
    clockButton?.addEventListener("click",(event)=>{event.stopPropagation();const open=notificationCenter.classList.contains("open");closeMenus();notificationCenter.classList.toggle("open",!open);notificationCenter.setAttribute("aria-hidden",String(open));});
    spotlightButton?.addEventListener("click",(event)=>{event.stopPropagation();openSpotlight();});
    spotlightInput?.addEventListener("input",()=>renderSpotlightResults(spotlightInput.value));
    spotlightInput?.addEventListener("keydown",(event)=>{if(event.key==="Escape")closeSpotlight();if(event.key==="ArrowDown"){event.preventDefault();spotlightIndex=Math.min(spotlightMatches.length-1,spotlightIndex+1);renderSpotlightResults(spotlightInput.value);}if(event.key==="ArrowUp"){event.preventDefault();spotlightIndex=Math.max(0,spotlightIndex-1);renderSpotlightResults(spotlightInput.value);}if(event.key==="Enter"){event.preventDefault();runSpotlight(spotlightIndex);}});
    spotlightBackdrop?.addEventListener("click",(event)=>{if(event.target===spotlightBackdrop)closeSpotlight();});
    ccFocus?.addEventListener("click",()=>{state.focus=!state.focus;saveState();applyDisplayState();});
    volumeSlider?.addEventListener("input",()=>{state.volume=Number(volumeSlider.value);state.sound=state.volume>0;applyDisplayState();saveState();});
    $("#widgetNext")?.addEventListener("click",(event)=>{event.stopPropagation();state.widgetIndex=(state.widgetIndex+1)%currentCards.length;saveState();updateCurrentWidget(true);});
    $("#widgetShow")?.addEventListener("click",(event)=>{event.stopPropagation();showCurrentCard();});
    currentWidget?.addEventListener("pointerdown",beginWidgetDrag);
    desktop.addEventListener("pointerdown",beginMarqueeSelection);
    desktop.addEventListener("contextmenu",(event)=>{if(event.target.closest(".mac-window,.dock,.desktop-item,.photo-file,.now-widget,.menu-bar"))return;event.preventDefault();closeMenus();positionPopover(contextMenu,event.clientX,event.clientY);contextMenu.classList.add("open");});
    dock.addEventListener("contextmenu",(event)=>{event.preventDefault();event.stopPropagation();closeMenus();positionPopover(dockContextMenu,event.clientX,event.clientY);dockContextMenu.classList.add("open");});
    iconNodes.forEach((item)=>{item.addEventListener("pointerdown",(event)=>beginDesktopObjectDrag(event,item));item.addEventListener("click",(event)=>{event.stopPropagation();if(item._suppressClick)return;selectDesktopItem(item,event.shiftKey||event.metaKey||event.ctrlKey);});item.addEventListener("dblclick",()=>openApp(item.dataset.app));});
    document.addEventListener("click",(event)=>{
      const project=event.target.closest("[data-project]");if(project){event.preventDefault();openProject(project.dataset.project);return;}
      const external=event.target.closest("[data-external]");if(external){event.preventDefault();window.open(external.dataset.external,"_blank","noopener");return;}
      const app=event.target.closest("[data-app]");if(app&&!app.classList.contains("desktop-item")){event.preventDefault();openApp(app.dataset.app);return;}
      const action=event.target.closest("[data-action]");if(action){event.preventDefault();handleAction(action.dataset.action);closeMenus();return;}
      const wallpaper=event.target.closest("[data-wallpaper]");if(wallpaper){event.preventDefault();setWallpaper(wallpaper.dataset.wallpaper);closeMenus();return;}
      if(!event.target.closest(".menu-bar,.menu-popover,.context-menu,.control-center-panel,.notification-center,.spotlight-panel"))closeMenus();
      if((event.target===desktop||event.target.classList.contains("wallpaper"))&&!desktop._suppressClear)clearDesktopSelection();
    });
    document.addEventListener("keydown",(event)=>{
      const typing=event.target instanceof Element&&event.target.matches("input,textarea,[contenteditable=true]");
      if(event.key==="Escape"){closeMenus();closeSpotlight();return;}
      if(event.key===" "&&selectedPhotoId&&!typing){event.preventDefault();const photo=(CONTENT.desktopPhotos||[]).find((item)=>item.id===selectedPhotoId);if(photo)openMediaFile(photo);return;}
      if(!(event.metaKey||event.ctrlKey))return;
      if(event.code==="Space"){event.preventDefault();openSpotlight();return;}
      if(event.key.toLowerCase()==="n"&&!event.shiftKey){event.preventDefault();openApp("work");}
      if(event.key.toLowerCase()==="n"&&event.shiftKey){event.preventDefault();openApp("notes");}
      if(event.key.toLowerCase()==="w"){event.preventDefault();closeWindow();}
      if(event.key.toLowerCase()==="m"){event.preventDefault();minimizeWindow();}
    });
    window.addEventListener("resize",()=>{$$(".mac-window",windowsRoot).forEach((win)=>{if(win.classList.contains("maximized"))return;const def=appDefinitions[win.dataset.appWindow]||{min:[500,350]};const rect=clampWindowRect({left:win.offsetLeft,top:win.offsetTop,width:win.offsetWidth,height:win.offsetHeight},def);Object.assign(win.style,{left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`});});});
    os.addEventListener("dragstart",(event)=>event.preventDefault(),true);
  }

  function init(){
    setWallpaper(state.wallpaper,false);renderDesktopPhotos();applyIconLayout();applyWidgetLayout();applyDisplayState();updateCurrentWidget();renderDock();updateClockAndCalendar();bindEvents();discoverMediaLibrary();
    dock.classList.toggle("no-magnify",!state.dockMagnification);
    setInterval(updateClockAndCalendar,30000);
  }

  init();
})();
