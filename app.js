(() => {
  "use strict";

  const STORAGE_KEY = "rizvisions-os-v10.6";
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
  const bootIntro = $("#bootIntro");
  const bootGreeting = $("#bootGreeting");
  const bootSkip = $("#bootSkip");

  const CONTENT = window.RIZVISIONS_CONTENT || { mediaLoading: true, allMedia: [], desktopPhotos: [], photoLibrary: [], projectMedia: {}, currentCards: [] };
  CONTENT.projectMedia ||= {};
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
    finder: { label: "Finder", app: "work", icon: "assets/icons/macos/finder.png?v=106", fixed: true, running: true },
    work: { label: "Selected Work", app: "work", icon: "assets/icons/macos/folder.png?v=106" },
    photos: { label: "Photos", app: "photos", icon: "assets/icons/macos/photos.png?v=106" },
    about: { label: "About Riz", app: "about", icon: "assets/icons/macos/rizvisions.png?v=106" },
    settings: { label: "System Settings", app: "settings", icon: "assets/icons/macos/settings.png?v=106" },
    messages: { label: "Messages", app: "messages", icon: "assets/icons/macos/messages.png?v=106", badge: "1" },
    instagram: { label: "Instagram", app: "instagram", icon: "assets/icons/macos/instagram.png?v=106" },
    safari: { label: "Safari", app: "safari", icon: "assets/icons/macos/safari.png?v=106" },
    parker: { label: "Parker", app: "parker", icon: "assets/icons/macos/parker.png?v=106" },
    calendar: { label: "Calendar", app: "calendar", icon: "", calendar: true },
    notes: { label: "Notes", app: "notes", icon: "assets/icons/macos/notes.png?v=106" },
    terminal: { label: "Terminal", app: "terminal", icon: "assets/icons/macos/terminal.png?v=106" },
    spotify: { label: "Spotify", app: "spotify", icon: "assets/icons/macos/spotify.png?v=106" },
    trash: { label: "Trash", app: "trash", icon: "assets/icons/macos/trash.png?v=106", kind: "trash", fixed: true }
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
    calendar: { name: "Calendar", title: "Calendar", size: [980, 680], min: [700, 500], render: renderCalendar },
    notes: { name: "Notes", title: "Notes", size: [1060, 680], min: [760, 500], render: renderNotes },
    terminal: { name: "Terminal", title: "riz — zsh", size: [780, 520], min: [580, 400], render: renderTerminal },
    trash: { name: "Finder", title: "Trash", size: [720, 500], min: [560, 400], render: renderTrash }
  };

  const appIconMap = Object.fromEntries(Object.entries(DOCK_CATALOG).map(([key, item]) => [item.app, item.icon || "assets/icons/macos/document.png?v=106"]));
  Object.assign(appIconMap, { work: "assets/icons/macos/finder.png?v=106", media: "assets/icons/macos/photos.png?v=106", calendar: "assets/icons/macos/document.png?v=106" });

  const spotlightItems = [
    ["About Riz", "Riz Zaheer · Chicago · internet home", "about bio riz zaheer", "about"],
    ["Selected Work", "Parker, Blue Specs, Whop, Windsurf", "finder work portfolio projects", "work"],
    ["Photos", "Photography and visual archive", "photos camera media gallery", "photos"],
    ["Parker", "AI creative strategy", "parker ecommerce ai work", "parker"],
    ["Safari", "Browse Rizvisions links", "web browser links", "safari"],
    ["Instagram", "Choose a profile", "social instagram", "instagram"],
    ["Spotify", "Rizvisions playlist", "music playlist", "spotify"],
    ["Calendar", "Today and the month at a glance", "calendar dates", "calendar"],
    ["Notes", "Rizvisions notes and scratchpad", "notes writing", "notes"],
    ["Terminal", "A tiny command line", "terminal zsh command", "terminal"],
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
      const isVideo = (photo.type || mediaTypeFromSrc(photo.src)) === "video";
      const preview = isVideo
        ? (
            photo.poster
              ? `<img src="${escapeHtml(photo.poster)}" alt="${escapeHtml(photo.alt || "Rizvisions video")}" draggable="false">`
              : photo.src
                ? `<video src="${escapeHtml(photo.src)}" muted playsinline preload="metadata" aria-label="${escapeHtml(photo.alt || "Rizvisions video")}" draggable="false"></video>`
                : `<span class="desktop-video-placeholder" aria-hidden="true">▶</span>`
          ) + `<span class="desktop-video-badge">▶</span>`
        : `<img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.alt || "Rizvisions photo")}" draggable="false">`;
      file.innerHTML = `<span class="photo-paper ${photo.monochrome ? "monochrome" : ""}">${preview}</span><span class="photo-label">${escapeHtml(photo.displayName || photo.filename || photo.src.split("/").pop())}</span>`;
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
    $(".window-body", win).innerHTML = definition.render();
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
    if (!win) return null;
    win.hidden = false; win.classList.remove("minimizing"); focusWindow(win); playSound("open"); renderDock(); bounceDock(appId);
    return win;
  }

  function openProject(projectId) {
    const project = projectDefinitions[projectId]; if (!project) return null;
    const appId = `project-${projectId}`;
    let win = windowsRoot.querySelector(`[data-app-window="${CSS.escape(appId)}"]`);
    if (!win) win = createWindow(appId, { name:"Finder", title:project.title, size:[980,650], min:[660,440], render:() => renderProject(project, projectId) });
    win.hidden = false; focusWindow(win); playSound("open");
    return win;
  }

  function mediaAspectRatio(media, type = media?.type || "image") {
    const width = Number(media?.width), height = Number(media?.height);
    if (width > 0 && height > 0) return width / height;
    if (Number(media?.aspectRatio) > 0) return Number(media.aspectRatio);
    return type === "video" ? 16 / 9 : 4 / 3;
  }

  function mediaWindowSize(media, type) {
    const ratio = Math.max(.28, Math.min(4, mediaAspectRatio(media, type)));
    const availableWidth = Math.max(420, desktop.clientWidth - 100);
    const availableHeight = Math.max(420, desktop.clientHeight - 145);
    let bodyWidth, bodyHeight;
    if (ratio < 1) {
      bodyHeight = Math.min(790, availableHeight);
      bodyWidth = bodyHeight * ratio;
      if (bodyWidth < 330) { bodyWidth = 330; bodyHeight = bodyWidth / ratio; }
    } else {
      bodyWidth = Math.min(1080, availableWidth);
      bodyHeight = bodyWidth / ratio;
      if (bodyHeight > availableHeight) { bodyHeight = availableHeight; bodyWidth = bodyHeight * ratio; }
    }
    return [Math.round(Math.min(availableWidth, bodyWidth)), Math.round(Math.min(availableHeight + 56, bodyHeight + 56))];
  }

  function openMediaFile(media) {
    if (!media?.src) return null;
    const idBase = media.id || media.filename || media.src;
    const appId = `media-${safeId(idBase)}`;
    let win = windowsRoot.querySelector(`[data-app-window="${CSS.escape(appId)}"]`);
    if (!win) {
      const type = media.type || mediaTypeFromSrc(media.src);
      const [width, height] = mediaWindowSize(media, type);
      win = createWindow(appId, {
        name: type === "video" ? "Video" : "Preview",
        title: media.displayName || media.filename || media.src.split("/").pop() || "Media",
        size:[width,height], min:type === "video" && mediaAspectRatio(media,type) < 1 ? [320,430] : [460,340],
        render:() => renderMediaViewer(media, type)
      });
      win.classList.add("media-window", `media-window-${type}`);
      wireMediaPlayback(win, media);
    }
    win.hidden = false; focusWindow(win); playSound("open");
    return win;
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
      if (item.calendar) {
        const now = new Date();
        button.classList.add("dock-calendar");
        button.innerHTML = `<span class="calendar-icon"><span class="calendar-weekday">${now.toLocaleDateString("en-US", { weekday:"short" }).toUpperCase()}</span><span class="calendar-day">${now.getDate()}</span></span><span class="running-dot"></span>`;
      } else {
        button.innerHTML = `<img src="${item.icon}" alt="">${item.badge ? `<span class="notification-badge dock-badge">${item.badge}</span>` : ""}<span class="running-dot"></span>`;
      }
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
    os.classList.add("layout-resetting");
    state.icons = clone(defaultIcons);
    state.photos = clone(defaultPhotos);
    state.widget = clone(defaultWidget);
    state.windows = {};
    state.widgetIndex = 0;
    $$(".mac-window",windowsRoot).forEach((win)=>win.remove());
    activeWindow = null;
    activeAppName.textContent = "Rizvisions";
    requestAnimationFrame(() => {
      applyIconLayout(); applyPhotoLayout(); applyWidgetLayout(); updateCurrentWidget(); saveState(); renderDock();
      setTimeout(() => os.classList.remove("layout-resetting"), 760);
    });
    showToast("Desktop layout restored");
  }

  function fullReset() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    state = clone(DEFAULT_STATE);
    setWallpaper(state.wallpaper,false);
    renderDesktopPhotos(); applyIconLayout(); applyWidgetLayout(); applyDisplayState(); resetLayout(); renderDock(); saveState();
    showToast("Rizvisions reset");
  }

  function sortIcons() {
    const cols=[38,46,54,62]; const rows=[23.5,40.5,57.5];
    os.classList.add("layout-resetting");
    iconNodes.forEach((node,index)=>{state.icons[node.dataset.id]={x:cols[index%4],y:rows[Math.floor(index/4)]||57.5};});
    requestAnimationFrame(()=>{applyIconLayout();saveState();setTimeout(()=>os.classList.remove("layout-resetting"),700);});
    showToast("Icons sorted");
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
    $$(".calendar-icon .calendar-weekday").forEach((node)=>node.textContent=now.toLocaleDateString("en-US",{weekday:"short"}).toUpperCase());
    $$(".calendar-icon .calendar-day").forEach((node)=>node.textContent=String(now.getDate()));
  }

  function weatherLabel(code){if(code===0)return{label:"Clear"};if([1,2].includes(code))return{label:"Mostly clear"};if(code===3)return{label:"Cloudy"};if([51,53,55,61,63,65,80,81,82].includes(code))return{label:"Rain"};if([71,73,75,85,86].includes(code))return{label:"Snow"};if([95,96,99].includes(code))return{label:"Storms"};return{label:"Chicago"};}
  function weatherGlyph(code){if(code===0)return"☀";if([1,2].includes(code))return"◐";if(code===3)return"☁";if([51,53,55,61,63,65,80,81,82].includes(code))return"☂";if([71,73,75,85,86].includes(code))return"❄";return"☁";}

  function wireAppSpecific(win, appId) {
    if (appId === "terminal") wireTerminal(win);
    if (appId === "work") wireFinderApp(win);
    if (appId === "notes") {
      const textarea = $("textarea", win);
      textarea.value = state.notes;
      textarea.addEventListener("input", () => { state.notes = textarea.value; saveState(); });
    }
    if (appId === "photos") wirePhotosApp(win);
    if (appId.startsWith("project-")) {
      const projectId = appId.replace("project-", "");
      $$('[data-project-media-index]', win).forEach((button) => button.addEventListener("dblclick", () => {
        const media = (CONTENT.projectMedia?.[projectId] || [])[Number(button.dataset.projectMediaIndex)];
        if (media) openMediaFile(media);
      }));
    }
    if (appId === "settings") {
      $$('[data-settings-wallpaper]', win).forEach((button) => button.addEventListener("click", () => setWallpaper(button.dataset.settingsWallpaper)));
      $("[data-settings-reset]", win)?.addEventListener("click", resetLayout);
    }
  }

  function wireFinderApp(win) {
    $$('[data-finder-view]', win).forEach((button) => button.addEventListener("click", () => {
      const view = button.dataset.finderView || "recents";
      win.dataset.finderView = view;
      $(".window-body", win).innerHTML = renderFinder(view);
      wireAppSpecific(win, "work");
    }));
    $$('[data-finder-media-id]', win).forEach((button) => button.addEventListener("dblclick", () => {
      const media = (CONTENT.allMedia || []).find((item) => item.id === button.dataset.finderMediaId);
      if (media) openMediaFile(media);
    }));
  }

  function wirePhotosApp(win) {
    const collection = win.dataset.photosCollection || "all";
    const viewMode = win.dataset.photosView || "all";
    const items = photosForCollection(collection);
    win._photosItems = items;
    $$('[data-photo-collection]', win).forEach((button) => button.addEventListener("click", () => {
      win.dataset.photosCollection = button.dataset.photoCollection;
      win.dataset.photosView = win.dataset.photosView || "all";
      $(".window-body", win).innerHTML = renderPhotos(win.dataset.photosCollection, win.dataset.photosView);
      wirePhotosApp(win);
    }));
    $$('[data-photo-view]', win).forEach((button) => button.addEventListener("click", () => {
      win.dataset.photosView = button.dataset.photoView || "all";
      $(".window-body", win).innerHTML = renderPhotos(win.dataset.photosCollection || "all", win.dataset.photosView);
      wirePhotosApp(win);
    }));
    $$('[data-media-id]', win).forEach((button) => button.addEventListener("click", () => {
      const index = items.findIndex((item) => item.id === button.dataset.mediaId);
      if (index >= 0) openPhotosGallery(win, index);
    }));
    $$('[data-featured-id]', win).forEach((button) => button.addEventListener("click", () => {
      const index = items.findIndex((item) => item.id === button.dataset.featuredId);
      if (index >= 0) openPhotosGallery(win, index);
    }));
    $(`[data-gallery-close]`, win)?.addEventListener("click", () => closePhotosGallery(win));
    $(`[data-gallery-prev]`, win)?.addEventListener("click", () => stepPhotosGallery(win, -1));
    $(`[data-gallery-next]`, win)?.addEventListener("click", () => stepPhotosGallery(win, 1));
    $(`[data-gallery-info]`, win)?.addEventListener("click", () => {
      const panel = $(".photos-gallery-info", win);
      const gallery = $(".photos-gallery", win);
      if (panel) {
        panel.hidden = !panel.hidden;
        gallery?.classList.toggle("info-open", !panel.hidden);
      }
    });
    $(".photos-gallery-filmstrip", win)?.addEventListener("click", (event) => {
      const thumb = event.target.closest("[data-gallery-thumb]");
      if (thumb) showPhotosGalleryItem(win, Number(thumb.dataset.galleryThumb));
    });
    if (!win._photosKeyHandler) {
      win._photosKeyHandler = (event) => {
        if ($(".photos-gallery", win)?.hidden) return;
        if (event.key === "ArrowLeft") { event.preventDefault(); stepPhotosGallery(win, -1); }
        if (event.key === "ArrowRight") { event.preventDefault(); stepPhotosGallery(win, 1); }
        if (event.key === "Escape") closePhotosGallery(win);
      };
      win.addEventListener("keydown", win._photosKeyHandler);
    }
    wireMediaPlayback(win);
  }

  function openPhotosAtMedia(media) {
    const win = openApp("photos");
    if (!win) return;
    win.dataset.photosCollection = "all";
    win.dataset.photosView = "all";
    $(".window-body", win).innerHTML = renderPhotos("all", "all");
    wirePhotosApp(win);
    const index = (win._photosItems || []).findIndex((item) => item.id === media?.id);
    if (index < 0) { showToast("This file is not placed in Photos"); return; }
    openPhotosGallery(win, index);
  }

  function openPhotosGallery(win, index) {
    const items = win._photosItems || [];
    if (!items.length) return;
    win._galleryIndex = Math.max(0, Math.min(items.length - 1, index));
    const gallery = $(".photos-gallery", win);
    if (!gallery) return;
    gallery.hidden = false;
    showPhotosGalleryItem(win, win._galleryIndex);
    gallery.focus({ preventScroll: true });
  }

  function closePhotosGallery(win) {
    const gallery = $(".photos-gallery", win);
    if (!gallery) return;
    gallery.hidden = true;
    gallery.classList.remove("info-open");
    const info = $(".photos-gallery-info", win); if (info) info.hidden = true;
    const video = gallery.querySelector("video");
    if (video) video.pause();
  }

  function stepPhotosGallery(win, delta) {
    const items = win._photosItems || [];
    if (!items.length) return;
    const next = ((Number(win._galleryIndex) || 0) + delta + items.length) % items.length;
    showPhotosGalleryItem(win, next);
  }

  function mediaInfoMarkup(media) {
    const capture = new Date(media.capturedAt || media.createdAt || Date.now());
    const details = [
      ["Date", capture.toLocaleString("en-US", { month:"long", day:"numeric", year:"numeric", hour:"numeric", minute:"2-digit" })],
      ["Dimensions", media.width && media.height ? `${media.width} × ${media.height}` : "—"],
      [media.type === "video" ? "Duration" : "Camera", media.type === "video" ? (media.duration ? formatMediaDuration(media.duration) : "—") : ([media.cameraMake, media.cameraModel].filter(Boolean).join(" ") || "—")],
      ["Lens", media.lensModel || "—"]
    ];
    return `<div class="photos-info-card"><strong>${escapeHtml(media.displayName || media.filename || "Untitled")}</strong>${media.caption ? `<p>${escapeHtml(media.caption)}</p>` : ""}<dl>${details.map(([key,value])=>`<div><dt>${key}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl></div>`;
  }

  function showPhotosGalleryItem(win, index) {
    const items = win._photosItems || [];
    const media = items[index];
    if (!media) return;
    win._galleryIndex = index;
    const stage = $(".photos-gallery-media", win);
    const counter = $(".photos-gallery-counter", win);
    const filmstrip = $(".photos-gallery-filmstrip", win);
    const info = $(".photos-gallery-info", win);
    stage.innerHTML = renderGalleryMedia(media);
    $$(".photos-gallery-title", win).forEach((node) => { node.textContent = media.displayName || media.filename || "Untitled"; });
    if (counter) counter.textContent = `${index + 1} of ${items.length}`;
    if (filmstrip) {
      filmstrip.innerHTML = items.map((item, itemIndex) => `<button class="${itemIndex === index ? "active" : ""}" data-gallery-thumb="${itemIndex}" aria-label="Open ${escapeHtml(item.displayName || item.filename || `item ${itemIndex + 1}`)}">${renderMediaThumbnail(item)}</button>`).join("");
      filmstrip.querySelector(".active")?.scrollIntoView({ inline:"center", block:"nearest", behavior:"smooth" });
    }
    if (info) info.innerHTML = mediaInfoMarkup(media);
    wireMediaPlayback(stage, media);
  }

  function finderRecentItems() {
    const projectEntries = Object.entries(projectDefinitions).map(([id, project]) => ({
      kind: "project",
      id,
      label: project.title,
      color: project.color,
      timestamp: 0
    }));
    const mediaEntries = [...(CONTENT.allMedia || [])].map((media) => ({
      kind: "media",
      id: media.id,
      label: media.displayName || media.filename || "Untitled",
      media,
      timestamp: mediaTimestamp(media)
    })).sort((a, b) => b.timestamp - a.timestamp);
    return [...mediaEntries, ...projectEntries];
  }

  function renderFinder(view = "recents") {
    const isApps = view === "applications";
    const recents = finderRecentItems();
    const applications = [
      ["about","About Riz","assets/icons/macos/rizvisions.png?v=106"],
      ["work","Selected Work","assets/icons/macos/folder.png?v=106"],
      ["settings","System Settings","assets/icons/macos/settings.png?v=106"],
      ["messages","Messages","assets/icons/macos/messages.png?v=106"],
      ["photos","Photos","assets/icons/macos/photos.png?v=106"],
      ["instagram","Instagram","assets/icons/macos/instagram.png?v=106"],
      ["safari","Safari","assets/icons/macos/safari.png?v=106"],
      ["parker","Parker","assets/icons/macos/parker.png?v=106"],
      ["calendar","Calendar",null],
      ["notes","Notes","assets/icons/macos/notes.png?v=106"],
      ["terminal","Terminal","assets/icons/macos/terminal.png?v=106"],
      ["spotify","Spotify","assets/icons/macos/spotify.png?v=106"]
    ];
    const recentGrid = recents.map((entry, index) => {
      if (entry.kind === "project") return `<button class="file-item" data-project="${entry.id}"><span class="finder-folder"><img src="assets/icons/macos/folder.png?v=106" alt=""><i style="--tag:${entry.color}"></i></span><span class="file-name">${escapeHtml(entry.label)}</span></button>`;
      const media = entry.media;
      return `<button class="file-item finder-media-item" data-finder-media-id="${escapeHtml(media.id)}">${renderMediaThumbnail(media)}<span class="file-name">${escapeHtml(entry.label)}</span></button>`;
    }).join("");
    const appsGrid = applications.map(([app,label,icon]) => `<button class="file-item application-item" data-app="${app}">${app === "calendar" ? `<span class="calendar-icon finder-calendar"><span class="calendar-weekday">${new Date().toLocaleDateString("en-US",{weekday:"short"}).toUpperCase()}</span><span class="calendar-day">${new Date().getDate()}</span></span>` : `<img src="${icon}" alt="">`}<span class="file-name">${label}</span></button>`).join("");
    const itemCount = isApps ? applications.length : recents.length;
    return `<div class="finder-shell"><aside class="finder-sidebar"><div class="sidebar-section"><button class="sidebar-row ${!isApps ? "active" : ""}" data-finder-view="recents"><span class="sidebar-glyph finder-clock-glyph">◷</span>Recents</button><button class="sidebar-row ${isApps ? "active" : ""}" data-finder-view="applications"><span class="sidebar-glyph">A</span>Applications</button></div></aside><main class="finder-main"><div class="finder-toolbar"><button class="toolbar-button" aria-label="Back">‹</button><button class="toolbar-button" aria-label="Forward">›</button><strong class="finder-title-inline">${isApps ? "Applications" : "Recents"}</strong><span class="toolbar-spacer"></span><button class="toolbar-button" aria-label="Icon view">▦</button><input class="search-field" placeholder="Search"></div><div class="finder-content"><div class="finder-grid ${isApps ? "finder-applications-grid" : ""}">${isApps ? appsGrid : recentGrid}</div></div><div class="finder-statusbar">${itemCount} ${itemCount === 1 ? "item" : "items"} · Rizvisions</div></main></div>`;
  }

  function renderAbout(){return `<div class="about-app"><aside class="about-rail"><img class="about-eye" src="assets/icons/macos/rizvisions.png?v=106" alt=""><span>RIZVISIONS</span><nav><button class="active">Overview</button><button data-app="work">Work</button><button data-app="photos">Photos</button></nav></aside><main class="about-content"><header><span class="eyebrow">RIZ ZAHEER</span><h1>I build things on the internet and document the rest.</h1><p>Creator and operator in Chicago. I work at Parker, make photos and videos, and have used Rizvisions as a creative identity since middle school.</p></header><section class="about-stats"><div><small>Currently</small><strong>Parker</strong><button data-app="parker">Open app</button></div><div><small>Based</small><strong>Chicago</strong><span>Gold Coast / Oak Brook orbit</span></div><div><small>Internet</small><strong>30M+</strong><span>lifetime short-form views</span></div></section><section class="about-links"><button data-external="https://www.linkedin.com/in/riz-zaheer/">LinkedIn ↗</button><button data-app="instagram">Instagram</button><button data-external="https://x.com/rizvisions">X ↗</button><button data-app="spotify">Spotify</button></section><section class="about-now"><div><small>What this site is</small><p>A catch-all for work, personal stuff, photography, old businesses, current obsessions, and whatever else becomes part of my life.</p></div><div class="about-quote">“Permanent internet home” &gt; polished corporate portfolio.</div></section></main></div>`;}

  function renderSettings(){return `<div class="settings-shell"><aside class="settings-sidebar"><input class="settings-search" placeholder="Search"><div class="settings-profile-mini"><img src="assets/icons/macos/rizvisions.png?v=106" alt=""><span><strong>Rizvisions</strong><small>Desktop preferences</small></span></div><div class="settings-list"><div class="settings-row active"><span class="settings-row-icon">◐</span>Appearance</div><div class="settings-row"><span class="settings-row-icon">⌘</span>Desktop & Dock</div><div class="settings-row"><span class="settings-row-icon">♪</span>Sound</div><div class="settings-row"><span class="settings-row-icon">◉</span>About</div></div></aside><main class="settings-main"><h1>Appearance</h1><section class="settings-card"><h2>Wallpaper</h2><p>Choose the grid appearance used across the desktop and interface.</p><div class="settings-theme-grid">${[["grid","Light"],["dark","Dark"],["maroon","Maroon"],["forest","Forest"]].map(([id,label])=>`<button data-settings-wallpaper="${id}" class="theme-choice ${id}"><span></span><strong>${label}</strong></button>`).join("")}</div></section><section class="settings-card"><h2>Desktop & Dock</h2><div class="settings-info-row"><span><strong>Customize the Dock naturally</strong><small>Drag an app from the desktop onto the Dock. Drag Dock apps left or right to reorder, or drag one away to remove it.</small></span></div><button class="mac-button" data-settings-reset>Restore Desktop Layout</button></section><section class="settings-card"><h2>About this build</h2><div class="settings-info-row"><img src="assets/icons/macos/rizvisions.png?v=106" alt=""><span><strong>Rizvisions OS 10.7.0</strong><small>A personal website pretending to be a Mac.</small></span></div></section></main></div>`;}

  function renderVideoElement(media, { className = "", autoplay = false, muted = true } = {}) {
    const poster = media.poster ? ` poster="${escapeHtml(media.poster)}"` : "";
    return `<video class="${escapeHtml(className)}" ${autoplay ? "autoplay" : ""} ${muted ? "muted" : ""} playsinline preload="auto"${poster} src="${escapeHtml(media.src)}"></video>`;
  }

  function renderAppleVideoPlayer(media, { autoplay = true, compact = false } = {}) {
    const speaker = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10H4Z" fill="currentColor"/><path class="sound-wave" d="M16 9.2c1.1 1.5 1.1 4.1 0 5.6M18.7 7c2.3 2.8 2.3 7.2 0 10" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;
    const back = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 6 4.8 12 11 18V6Zm8 0-6.2 6L19 18V6Z" fill="currentColor"/></svg>`;
    const forward = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 6 6.2 6L5 18V6Zm8 0 6.2 6L13 18V6Z" fill="currentColor"/></svg>`;
    const playPause = `<span class="video-icon-play"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z" fill="currentColor"/></svg></span><span class="video-icon-pause"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7V5Zm6 0h4v14h-4V5Z" fill="currentColor"/></svg></span>`;
    const full = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9 20h6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;
    return `<div class="apple-video-player ${compact ? "compact" : ""}">${renderVideoElement(media,{className:"apple-video-element",autoplay,muted:true})}<div class="apple-video-controls"><div class="video-control-primary"><button type="button" data-video-mute data-muted="true" aria-label="Mute or unmute">${speaker}</button><input class="video-volume" data-video-volume type="range" min="0" max="1" step="0.01" value="0.55" aria-label="Volume"><span class="video-control-spacer"></span><button type="button" data-video-skip="-10" aria-label="Back 10 seconds">${back}</button><button type="button" class="video-play" data-video-play data-state="play" aria-label="Play or pause">${playPause}</button><button type="button" data-video-skip="10" aria-label="Forward 10 seconds">${forward}</button><span class="video-control-spacer"></span><button type="button" data-video-fullscreen aria-label="Full screen">${full}</button></div><div class="video-control-timeline"><time data-video-time>0:00</time><input data-video-progress type="range" min="0" max="1000" value="0" aria-label="Video progress"><time data-video-duration>0:00</time></div></div></div>`;
  }

  function renderMediaThumbnail(media) {
    if ((media.type || mediaTypeFromSrc(media.src)) === "video") {
      return media.poster
        ? `<span class="media-thumb-shell"><img src="${escapeHtml(media.poster)}" alt=""><i>▶</i></span>`
        : `<span class="media-thumb-shell">${renderVideoElement(media, { muted: true })}<i>▶</i></span>`;
    }
    return `<img src="${escapeHtml(media.src || "")}" alt="${escapeHtml(media.alt || "")}" draggable="false">`;
  }

  function renderGalleryMedia(media) {
    const type = media.type || mediaTypeFromSrc(media.src);
    return type === "video"
      ? renderAppleVideoPlayer(media, { autoplay:true, compact:true })
      : `<img src="${escapeHtml(media.src)}" alt="${escapeHtml(media.alt || "")}">`;
  }

  function photosForCollection(collection = "all") {
    const photos = [...(CONTENT.photoLibrary || [])].sort((a,b) => mediaTimestamp(b) - mediaTimestamp(a));
    if (collection === "all") return photos;
    if (collection === "photos") return photos.filter((item) => item.type !== "video");
    if (collection === "videos") return photos.filter((item) => item.type === "video");
    const name = collection.startsWith("collection:") ? collection.slice(11) : collection;
    return photos.filter((item) => (item.collection || "Library") === name);
  }

  function photoDateParts(media) {
    const date = new Date(media?.capturedAt || media?.createdAt || Date.now());
    return {
      year: String(date.getFullYear()),
      month: date.toLocaleDateString("en-US", { month:"long", year:"numeric" }),
      day: date.toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" })
    };
  }

  function renderPhotoTiles(items, indexOffset = 0) {
    return `<div class="photos-natural-grid">${items.map((media, index) => `<button class="photo-natural-tile" data-media-id="${escapeHtml(media.id)}" data-media-index="${index + indexOffset}" data-media-type="${escapeHtml(media.type || mediaTypeFromSrc(media.src))}" style="--media-ratio:${mediaAspectRatio(media, media.type)}">${renderMediaThumbnail(media)}${media.type === "video" ? `<i class="video-duration">▶ ${media.duration ? formatMediaDuration(media.duration) : "video"}</i>` : ""}</button>`).join("")}</div>`;
  }

  function renderChronology(items, viewMode) {
    if (viewMode === "all") return renderPhotoTiles(items);
    const keyFor = (item) => viewMode === "years" ? photoDateParts(item).year : photoDateParts(item).month;
    const groups = [];
    items.forEach((item) => {
      const key = keyFor(item);
      let group = groups.find((entry) => entry.key === key);
      if (!group) { group = { key, items: [] }; groups.push(group); }
      group.items.push(item);
    });
    let offset = 0;
    return groups.map((group) => {
      const html = `<section class="photos-date-group"><header><strong>${escapeHtml(group.key)}</strong><small>${group.items.length} ${group.items.length === 1 ? "item" : "items"}</small></header>${renderPhotoTiles(group.items, offset)}</section>`;
      offset += group.items.length;
      return html;
    }).join("");
  }

  function renderPhotos(activeCollection = "all", viewMode = "all") {
    const allPhotos = [...(CONTENT.photoLibrary || [])].sort((a,b) => mediaTimestamp(b) - mediaTimestamp(a));
    const rawCollections = [...new Set(allPhotos.map((item) => item.collection).filter((name) => name && name.toLowerCase() !== "library"))];
    const photos = photosForCollection(activeCollection);
    const featured = activeCollection === "all" ? photos.filter((item) => item.isFeatured) : [];
    const loading = Boolean(CONTENT.mediaLoading);
    const collectionButtons = rawCollections.map((collection) => `<button data-photo-collection="collection:${escapeHtml(collection)}" class="${activeCollection === `collection:${collection}` ? "active" : ""}"><span>▣</span>${escapeHtml(collection)}</button>`).join("");
    const title = activeCollection === "all" ? "All Photos" : activeCollection === "photos" ? "Photos" : activeCollection === "videos" ? "Videos" : activeCollection.replace(/^collection:/, "");

    let body = "";
    if (loading) {
      body = `<div class="photos-loading"><i></i><i></i><i></i><i></i><span>Loading your library…</span></div>`;
    } else if (!photos.length) {
      body = `<div class="photos-empty"><img src="assets/icons/macos/photos.png?v=106" alt=""><h2>${allPhotos.length ? "No items here yet" : "Your library is empty"}</h2><p>${allPhotos.length ? "Choose another view from the sidebar." : "Upload photos or videos at rizvisions.com/admin."}</p></div>`;
    } else {
      const featuredBlock = featured.length ? `<section class="photos-featured-strip"><header><strong>Featured</strong><small>${featured.length}</small></header><div class="photos-featured-track">${featured.map((media) => `<button class="photos-featured-card" data-featured-id="${escapeHtml(media.id)}" style="--media-ratio:${mediaAspectRatio(media, media.type)}">${renderMediaThumbnail(media)}<span>${escapeHtml(media.displayName || media.filename || "Untitled")}</span></button>`).join("")}</div></section>` : "";
      body = `${featuredBlock}<section class="photos-library-feed">${renderChronology(photos, viewMode)}</section>`;
    }

    return `<div class="photos-app"><aside class="photos-nav"><div class="photos-nav-title"><img src="assets/icons/macos/photos.png?v=106" alt=""><strong>Photos</strong></div><div class="sidebar-title">Library</div><button data-photo-collection="all" class="${activeCollection === "all" ? "active" : ""}"><span>▦</span>All Photos</button><button data-photo-collection="photos" class="${activeCollection === "photos" ? "active" : ""}"><span>▧</span>Photos</button><button data-photo-collection="videos" class="${activeCollection === "videos" ? "active" : ""}"><span>▶</span>Videos</button>${collectionButtons ? `<div class="sidebar-title collections-label">Collections</div>${collectionButtons}` : ""}</aside><main class="photos-library"><div class="photos-topbar"><div><h1>${escapeHtml(title)}</h1><small>${photos.length} ${photos.length === 1 ? "item" : "items"}${photos.length ? ` · newest first` : ""}</small></div><div class="photos-segmented"><button data-photo-view="years" class="${viewMode === "years" ? "active" : ""}">Years</button><button data-photo-view="months" class="${viewMode === "months" ? "active" : ""}">Months</button><button data-photo-view="all" class="${viewMode === "all" ? "active" : ""}">All Photos</button></div></div><div class="photos-scroll-content">${body}</div><section class="photos-gallery" tabindex="-1" hidden><header class="photos-viewer-toolbar"><button data-gallery-close class="photos-viewer-back" aria-label="Back">‹</button><div><strong class="photos-gallery-title"></strong><small class="photos-gallery-counter"></small></div><span></span><button data-gallery-info aria-label="Info">ⓘ</button></header><div class="photos-gallery-stage"><button class="gallery-arrow gallery-prev" data-gallery-prev aria-label="Previous item">‹</button><div class="photos-gallery-media"></div><button class="gallery-arrow gallery-next" data-gallery-next aria-label="Next item">›</button></div><footer><div class="photos-gallery-filmstrip"></div></footer><aside class="photos-gallery-info" hidden></aside></section></main></div>`;
  }

  function mediaTimestamp(media) {
    const value = media?.capturedAt || media?.createdAt || media?.created_at || media?.date;
    const time = value ? new Date(value).getTime() : 0;
    return Number.isFinite(time) ? time : 0;
  }

  function formatMediaDuration(seconds) {
    if (!Number.isFinite(Number(seconds))) return "";
    const total = Math.round(Number(seconds));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
  }

  function renderMessages(){return `<div class="messages-shell"><aside class="conversation-list"><input class="message-search" placeholder="Search"><div class="conversation active"><span class="avatar">R</span><span><strong>Riz</strong><small>Welcome to my corner of the internet.</small></span><time>now</time></div><div class="conversation"><span class="avatar">P</span><span><strong>Parker</strong><small>Back to work?</small></span><time>1:04 AM</time></div></aside><main class="chat-pane"><div class="chat-header">Riz</div><div class="chat-body"><div class="bubble in">You made it this far. What do you want to know?</div><div class="bubble out">This site is cool. How do I reach you?</div><div class="bubble in">LinkedIn is best for work. Instagram works for everything else.</div><div class="chat-actions"><button class="mac-button primary" data-external="https://www.linkedin.com/in/riz-zaheer/">Open LinkedIn</button><button class="mac-button" data-app="instagram">Open Instagram</button></div></div><div class="chat-input">iMessage</div></main></div>`;}

  function renderInstagram(){
    const accounts=[
      {handle:"@rizvisions",description:"Photography, creative work, and life",initials:"RV",url:"https://www.instagram.com/rizvisions/"},
      {handle:"@rizgoestomarket",description:"AI, GTM, Parker, and work-brain content",initials:"GT",url:"https://www.instagram.com/rizgoestomarket/"},
      {handle:"@rizzaheer",description:"Personal — friends and family",initials:"RZ",url:"https://www.instagram.com/rizzaheer/"}
    ];
    return `<div class="instagram-shell"><div class="instagram-heading"><img src="assets/icons/macos/instagram.png?v=106" alt="Instagram"><h2>Choose an Instagram</h2><p>Different accounts for different parts of my life.</p></div><div class="account-list">${accounts.map((account)=>`<button type="button" class="account-row" data-external="${account.url}"><span class="account-avatar">${account.initials}</span><span><strong>${account.handle}</strong><small>${account.description}</small></span><span class="chevron">›</span></button>`).join("")}</div></div>`;
  }

  function renderSafari(){return `<div class="safari-shell"><div class="safari-toolbar"><button>‹</button><button>›</button><button>▣</button><div class="safari-address"><span>🔒</span> rizvisions.com</div><button>↗</button><button>＋</button></div><div class="safari-page"><div class="safari-start"><img src="assets/icons/macos/rizvisions.png?v=106" alt=""><h1>Start Page</h1><div class="safari-favorites">${[["Parker","assets/icons/macos/parker.png?v=106","https://heyparker.ai/"],["LinkedIn","assets/icons/macos/mail.png?v=106","https://www.linkedin.com/in/riz-zaheer/"],["Instagram","assets/icons/macos/instagram.png?v=106","https://www.instagram.com/rizvisions/"],["Spotify","assets/icons/macos/spotify.png?v=106","https://open.spotify.com/user/riz002"],["X","assets/icons/macos/rizvisions.png?v=106","https://x.com/rizvisions"]].map(([label,icon,href])=>`<button data-external="${href}"><span><img src="${icon}" alt=""></span><strong>${label}</strong></button>`).join("")}</div><section class="safari-reading"><div><span>READING LIST</span><strong>The internet home of Riz Zaheer</strong><p>Work, photos, projects, notes, music, and the weird archive still to come.</p></div><button data-app="about">Open About Riz</button></section></div></div></div>`;}

  function renderParker(){return `<div class="parker-app"><header class="parker-hero"><img src="assets/icons/macos/parker.png?v=106" alt="Parker"><div><span>CURRENTLY</span><h1>Parker</h1><p>AI creative strategy for ecommerce teams — and the place where most of my work brain lives right now.</p><button class="mac-button primary" data-external="https://heyparker.ai/">Visit heyparker.ai ↗</button></div></header><section class="parker-command"><span>Ask Parker</span><strong>“Cross-reference our reviews with our ad account and find creative angles we haven't tested.”</strong><button data-external="https://heyparker.ai/">→</button></section><section class="parker-grid"><article><span>01</span><h3>Creative intelligence</h3><p>Connect ad performance, customer language, competitors, content, and brand context.</p></article><article><span>02</span><h3>What I do</h3><p>Sales, demos, onboarding, support, customer research, GTM experiments, pricing, and product feedback.</p></article><article><span>03</span><h3>Parker Brain</h3><p>A context layer designed to make AI useful for marketers instead of generic.</p></article></section><footer><button data-project="parker">View my Parker story</button><button data-external="https://heyparker.ai/">Open website ↗</button></footer></div>`;}


  function renderSpotify(){return `<div class="spotify-only"><iframe data-testid="embed-iframe" src="https://open.spotify.com/embed/playlist/76WzEHradeFZfSUMLsxH7I?utm_source=generator&si=565dc6edf9be49a1" width="100%" height="100%" frameborder="0" allowfullscreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Rizvisions Spotify playlist"></iframe></div>`;}

  function renderCalendar(){
    const now = new Date();
    const year = now.getFullYear(), month = now.getMonth();
    const monthName = now.toLocaleDateString("en-US", { month:"long", year:"numeric" });
    const first = new Date(year, month, 1).getDay();
    const count = new Date(year, month + 1, 0).getDate();
    const previousCount = new Date(year, month, 0).getDate();
    const cells = [];
    for (let i = first - 1; i >= 0; i -= 1) cells.push(`<span class="calendar-cell outside">${previousCount - i}</span>`);
    for (let day = 1; day <= count; day += 1) cells.push(`<span class="calendar-cell ${day === now.getDate() ? "today" : ""}">${day}</span>`);
    let nextDay = 1; while (cells.length < 42) cells.push(`<span class="calendar-cell outside">${nextDay++}</span>`);
    return `<div class="calendar-app"><aside class="calendar-sidebar"><div class="calendar-mini-title"><strong>${monthName}</strong></div><div class="calendar-list-title">On My Mac</div><label class="calendar-list-row"><i class="calendar-dot personal"></i><span>Personal</span></label><label class="calendar-list-row"><i class="calendar-dot work"></i><span>Work</span></label><label class="calendar-list-row"><i class="calendar-dot rizvisions"></i><span>Rizvisions</span></label></aside><main class="calendar-main"><div class="calendar-toolbar"><button class="calendar-today-button">Today</button><div class="calendar-toolbar-spacer"></div><button>‹</button><button>›</button><strong>${monthName}</strong><div class="calendar-toolbar-spacer"></div><button class="active">Month</button></div><div class="calendar-weekdays">${["SUN","MON","TUE","WED","THU","FRI","SAT"].map(day=>`<b>${day}</b>`).join("")}</div><div class="calendar-month-grid">${cells.join("")}</div></main></div>`;
  }

  function renderNotes(){
    const now = new Date();
    const dateLabel = now.toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" });
    const timeLabel = now.toLocaleTimeString([], { hour:"numeric", minute:"2-digit" });
    return `<div class="notes-app"><aside class="notes-folders"><div class="notes-sidebar-top"><span></span></div><div class="notes-group"><button><span class="notes-quick-icon">⌁</span><strong>Quick Notes</strong><em>2</em></button></div><div class="notes-sidebar-label">On My Mac</div><div class="notes-group"><button class="active"><span class="notes-folder-icon">▭</span><strong>Notes</strong><em>4</em></button></div></aside><section class="notes-browser"><header class="notes-browser-toolbar"><div><strong>Notes</strong><small>4 notes</small></div><div class="notes-toolbar-actions"><button>•••</button><button class="notes-compose">□</button></div></header><div class="notes-note-list"><h3>Today</h3><button class="active"><strong>New Note</strong><span>${timeLabel}</span><small>${escapeHtml(state.notes.slice(0,42) || "No additional text")}</small></button><h3>Previous 7 Days</h3><button><strong>Supabase Database Setup</strong><span>Thursday</span><small>Media archive, placements, and upload system…</small></button><h3>Previous 30 Days</h3><button><strong>Alright, we're creating...</strong><span>7/24/26</span><small>Ideas for Rizvisions and the permanent internet home.</small></button><h3>2025</h3><button><strong>Hi, this is Riz from...</strong><span>4/24/25</span><small>I can speak to what I was building then.</small></button></div></section><main class="note-editor apple-note-editor"><div class="notes-editor-toolbar"><button>Aa</button><button>☑</button><button>▦</button><button>⌕</button><button>↯</button><span></span><button>≫</button><button>⌕</button></div><div class="note-meta">${dateLabel} at ${timeLabel}</div><textarea class="note-editor-textarea" aria-label="Note" placeholder="Start typing…"></textarea></main></div>`;
  }
  function renderTerminal(){return `<div class="terminal-shell"><div class="terminal-output">Last login: ${new Date().toLocaleDateString()} on ttys001\n\nRizvisions OS 10.7.0\nType <span class="terminal-link">help</span> to see available commands.\n</div><div class="terminal-input-row"><span class="terminal-prompt">riz@rizvisions ~ %</span><input class="terminal-input" autocomplete="off" spellcheck="false"></div></div>`;}
  function renderTrash(){return `<div class="empty-state"><div><img src="assets/icons/macos/trash.png?v=106" alt="Trash"><h2>Trash is Empty</h2><p>Old domains, failed ideas, embarrassing drafts, and abandoned businesses will eventually live here.</p></div></div>`;}

  function renderProject(project, projectId) {
    const media = CONTENT.projectMedia?.[projectId] || [];
    return `<div class="project-environment"><header class="project-folder-header" style="--project:${project.color}"><div><span>${project.eyebrow}</span><h1>${project.title}</h1><p>${project.description}</p></div><div class="project-facts">${project.facts.map((fact) => `<div>${fact}</div>`).join("")}</div></header><section class="project-assets"><div class="project-assets-heading"><strong>Project Files</strong><small>${media.length} ${media.length === 1 ? "item" : "items"}</small></div>${media.length ? `<div class="project-file-grid">${media.map((item, index) => `<button class="project-media-file" data-project-media-index="${index}" style="--media-ratio:${mediaAspectRatio(item, item.type)}">${renderMediaThumbnail(item)}<span>${escapeHtml(item.displayName || item.filename || "Untitled")}</span></button>`).join("")}</div>` : `<div class="project-empty"><img src="assets/icons/macos/folder.png?v=106" alt=""><strong>This folder is ready for artifacts.</strong><p>Place photos and videos here from Rizvisions Admin.</p></div>`}</section></div>`;
  }

  function renderMediaViewer(media, type) {
    const body = type === "video"
      ? renderAppleVideoPlayer(media, { autoplay:true, compact:false })
      : `<img src="${escapeHtml(media.src)}" alt="${escapeHtml(media.alt || "")}">`;
    return `<div class="media-viewer ${type}">${body}<div class="media-playback-error" hidden><strong>This video could not play in this browser.</strong><span>Try an H.264 MP4 export if this file uses an unsupported codec.</span></div></div>`;
  }

  function wireAppleVideoPlayer(player) {
    const video = $("video", player); if (!video) return;
    const play = $("[data-video-play]", player);
    const mute = $("[data-video-mute]", player);
    const volume = $("[data-video-volume]", player);
    const progress = $("[data-video-progress]", player);
    const current = $("[data-video-time]", player);
    const duration = $("[data-video-duration]", player);
    let hideTimer = null;
    const fmt = (seconds) => formatMediaDuration(Number.isFinite(seconds) ? seconds : 0) || "0:00";
    const update = () => {
      if (play) play.dataset.state = video.paused ? "play" : "pause";
      if (mute) mute.dataset.muted = (video.muted || video.volume === 0) ? "true" : "false";
      if (current) current.textContent = fmt(video.currentTime);
      if (duration) duration.textContent = fmt(video.duration);
      if (progress && Number.isFinite(video.duration) && video.duration > 0) progress.value = String(Math.round((video.currentTime / video.duration) * 1000));
    };
    const reveal = () => {
      player.classList.add("controls-visible");
      clearTimeout(hideTimer);
      if (!video.paused) hideTimer = setTimeout(() => player.classList.remove("controls-visible"), 1500);
    };
    video.muted = true;
    video.defaultMuted = true;
    video.volume = Number(volume?.value || .55);
    video.play().catch(() => update());
    ["loadedmetadata","timeupdate","play","pause","volumechange","ended"].forEach((event) => video.addEventListener(event, update));
    play?.addEventListener("click", (event) => { event.stopPropagation(); if (video.paused) video.play().catch(()=>{}); else video.pause(); reveal(); });
    mute?.addEventListener("click", (event) => { event.stopPropagation(); video.muted = !video.muted; reveal(); update(); });
    volume?.addEventListener("input", (event) => { video.volume = Number(event.target.value); video.muted = video.volume === 0; reveal(); });
    progress?.addEventListener("input", (event) => { if (Number.isFinite(video.duration)) video.currentTime = (Number(event.target.value) / 1000) * video.duration; reveal(); });
    $$('[data-video-skip]', player).forEach((button) => button.addEventListener("click", (event) => { event.stopPropagation(); video.currentTime = Math.max(0, Math.min(video.duration || Infinity, video.currentTime + Number(button.dataset.videoSkip))); reveal(); }));
    $("[data-video-fullscreen]", player)?.addEventListener("click", (event) => { event.stopPropagation(); (video.requestFullscreen ? video.requestFullscreen() : player.requestFullscreen?.()); });
    player.addEventListener("pointermove", reveal);
    player.addEventListener("pointerenter", reveal);
    player.addEventListener("pointerleave", () => { if (!video.paused) player.classList.remove("controls-visible"); });
    player.addEventListener("click", (event) => { if (event.target.closest(".apple-video-controls")) return; if (video.paused) video.play().catch(()=>{}); else video.pause(); reveal(); });
    reveal(); update();
  }

  function wireMediaPlayback(root, media = null) {
    $$(".apple-video-player", root).forEach(wireAppleVideoPlayer);
    $$('video', root).forEach((video) => {
      video.addEventListener("error", () => {
        const errorPanel = video.closest(".media-viewer")?.querySelector(".media-playback-error");
        if (errorPanel) errorPanel.hidden = false;
      });
      video.addEventListener("click", (event) => event.stopPropagation());
    });
  }

  function wireTerminal(win){const input=$(".terminal-input",win),output=$(".terminal-output",win);input.focus();input.addEventListener("keydown",(event)=>{if(event.key!=="Enter")return;const command=input.value.trim();output.textContent+=`\nriz@rizvisions ~ % ${command}\n`;input.value="";const lower=command.toLowerCase();if(lower==="help")output.textContent+="about  work  photos  parker  social  spotify  safari  clear\n";else if(["about","work","photos","parker","spotify","safari"].includes(lower)){output.textContent+=`Opening ${lower}…\n`;openApp(lower);}else if(lower==="social"){openApp("instagram");}else if(lower==="clear")output.textContent="";else if(lower==="sudo")output.textContent+="Riz is not in the sudoers file. This incident will be reported.\n";else if(lower)output.textContent+=`zsh: command not found: ${command}\n`;output.scrollTop=output.scrollHeight;});}

  async function discoverMediaLibrary() {
    const config = window.RIZVISIONS_SUPABASE;
    if (!config || !window.supabase?.createClient) {
      CONTENT.mediaLoading = false;
      refreshMediaSurfaces();
      return;
    }
    try {
      const publicClient = window.supabase.createClient(config.url, config.publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      });
      const mediaResult = await publicClient
        .from("media_items")
        .select("id,storage_path,poster_path,filename,display_name,media_type,mime_type,size_bytes,width,height,duration_seconds,caption,alt_text,sort_order,created_at,captured_at,camera_make,camera_model,lens_model,metadata")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (mediaResult.error) throw mediaResult.error;

      const placementResult = await publicClient
        .from("media_placements")
        .select("id,media_id,surface,container,sort_order,is_featured,desktop_x,desktop_y,desktop_rotation,metadata")
        .order("sort_order", { ascending: true });
      if (placementResult.error) throw placementResult.error;

      const placementsByMedia = new Map();
      (placementResult.data || []).forEach((entry) => {
        const list = placementsByMedia.get(entry.media_id) || [];
        list.push(entry);
        placementsByMedia.set(entry.media_id, list);
      });

      const getUrl = (path) => path ? publicClient.storage.from(config.bucket).getPublicUrl(path).data.publicUrl : "";
      const allMedia = (Array.isArray(mediaResult.data) ? mediaResult.data : []).map((row, index) => {
        const placements = placementsByMedia.get(row.id) || [];
        return {
          id: row.id,
          type: row.media_type,
          mimeType: row.mime_type,
          src: getUrl(row.storage_path),
          poster: getUrl(row.poster_path),
          storagePath: row.storage_path,
          displayName: row.display_name || row.filename,
          filename: row.filename,
          alt: row.alt_text || row.display_name || row.caption || row.filename,
          caption: row.caption || "",
          width: Number(row.width) || null,
          height: Number(row.height) || null,
          duration: Number(row.duration_seconds) || null,
          aspectRatio: Number(row.width) > 0 && Number(row.height) > 0 ? Number(row.width) / Number(row.height) : null,
          sortOrder: Number(row.sort_order) || index,
          createdAt: row.created_at,
          capturedAt: row.captured_at || row.created_at,
          cameraMake: row.camera_make || row.metadata?.cameraMake || "",
          cameraModel: row.camera_model || row.metadata?.cameraModel || "",
          lensModel: row.lens_model || row.metadata?.lensModel || "",
          metadata: row.metadata || {},
          date: new Date(row.captured_at || row.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          placements
        };
      });

      CONTENT.allMedia = allMedia;
      CONTENT.photoLibrary = allMedia.flatMap((item) => item.placements.filter((entry) => entry.surface === "photos").map((entry) => ({
        ...item,
        collection: entry.container || "Library",
        isFeatured: Boolean(entry.is_featured),
        placementSortOrder: Number(entry.sort_order) || item.sortOrder
      }))).sort((a, b) => mediaTimestamp(b) - mediaTimestamp(a));

      CONTENT.projectMedia = {};
      allMedia.forEach((item) => {
        item.placements.filter((entry) => entry.surface === "selected_work").forEach((entry) => {
          const projectId = entry.container || "creator";
          (CONTENT.projectMedia[projectId] ||= []).push({ ...item, placementSortOrder: Number(entry.sort_order) || item.sortOrder });
        });
      });
      Object.values(CONTENT.projectMedia).forEach((items) => items.sort((a, b) => a.placementSortOrder - b.placementSortOrder || a.sortOrder - b.sortOrder));

      const defaults = [
        {x:78.2,y:28.0,rotation:-8},{x:85.0,y:25.8,rotation:8},{x:79.5,y:48.0,rotation:7},
        {x:86.3,y:49.0,rotation:-6},{x:80.8,y:67.0,rotation:-4},{x:88.0,y:67.5,rotation:6},
        {x:73.5,y:65.0,rotation:5},{x:91.0,y:33.0,rotation:-5}
      ];
      CONTENT.desktopPhotos = allMedia.flatMap((item) => item.placements.filter((entry) => entry.surface === "desktop").map((entry) => ({
        ...item,
        x: entry.desktop_x == null ? null : Number(entry.desktop_x),
        y: entry.desktop_y == null ? null : Number(entry.desktop_y),
        rotation: Number(entry.desktop_rotation) || 0,
        placementSortOrder: Number(entry.sort_order) || item.sortOrder
      }))).sort((a, b) => a.placementSortOrder - b.placementSortOrder || a.sortOrder - b.sortOrder).slice(0, 10).map((item, index) => ({
        ...item,
        x: item.x ?? defaults[index % defaults.length].x,
        y: item.y ?? defaults[index % defaults.length].y,
        rotation: item.rotation || defaults[index % defaults.length].rotation,
        width: 132,
        monochrome: false
      }));

      /* Reconcile persisted positions with the live placement list. Removed placements cannot ghost on refresh. */
      const liveDesktopIds = new Set(CONTENT.desktopPhotos.map((item) => item.id));
      Object.keys(state.photos || {}).forEach((id) => { if (!liveDesktopIds.has(id)) delete state.photos[id]; });
      CONTENT.desktopPhotos.forEach((item, index) => {
        defaultPhotos[item.id] = { x:item.x, y:item.y, rotation:item.rotation || 0, z:index + 1 };
        state.photos[item.id] ||= clone(defaultPhotos[item.id]);
      });
      saveState();
    } catch (error) {
      CONTENT.allMedia = [];
      CONTENT.photoLibrary = [];
      CONTENT.desktopPhotos = [];
      CONTENT.projectMedia = {};
      console.info("Rizvisions media could not load.", error);
    } finally {
      CONTENT.mediaLoading = false;
      refreshMediaSurfaces();
    }
  }

  function refreshMediaSurfaces() {
    renderDesktopPhotos();
    const photosWindow = windowsRoot.querySelector('[data-app-window="photos"]');
    if (photosWindow) {
      const collection = photosWindow.dataset.photosCollection || "all";
      const viewMode = photosWindow.dataset.photosView || "all";
      $(".window-body", photosWindow).innerHTML = renderPhotos(collection, viewMode);
      wirePhotosApp(photosWindow);
    }
    const finderWindow = windowsRoot.querySelector('[data-app-window="work"]');
    if (finderWindow) {
      const view = finderWindow.dataset.finderView || "recents";
      $(".window-body", finderWindow).innerHTML = renderFinder(view);
      wireFinderApp(finderWindow);
    }
    $$('[data-app-window^="project-"]', windowsRoot).forEach((projectWindow) => {
      const projectId = projectWindow.dataset.appWindow.replace("project-", "");
      const project = projectDefinitions[projectId];
      if (!project) return;
      $(".window-body", projectWindow).innerHTML = renderProject(project, projectId);
      wireAppSpecific(projectWindow, `project-${projectId}`);
    });
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
    if(action==="desktop-info")showToast("Rizvisions Desktop · Version 10.7");
    if(action==="quick-look-photo"){const photo=(CONTENT.desktopPhotos||[]).find((item)=>item.id===(contextPhotoId||selectedPhotoId));if(photo)openMediaFile(photo);}
    if(action==="view-photo-library"){const photo=(CONTENT.desktopPhotos||[]).find((item)=>item.id===(contextPhotoId||selectedPhotoId));if(photo)openPhotosAtMedia(photo);}
    if(action==="bring-photo-front"){const file=desktopPhotosRoot.querySelector(`[data-photo-id="${CSS.escape(contextPhotoId||"")}"]`);if(file){file.style.zIndex=String(++photoZCounter);persistObjectPosition(file);saveState();}}
    if(action==="reset-photo-position"){if(contextPhotoId&&defaultPhotos[contextPhotoId]){state.photos[contextPhotoId]=clone(defaultPhotos[contextPhotoId]);applyPhotoLayout();saveState();showToast("Desktop position reset");}}
    if(action==="show-current-card")showCurrentCard();
    if(action==="dock-reset")resetDock();
    if(action==="dock-magnification"){state.dockMagnification=!state.dockMagnification;dock.classList.toggle("no-magnify",!state.dockMagnification);saveState();showToast(state.dockMagnification?"Dock magnification on":"Dock magnification off");}
    if(action==="media-help")window.open("/admin", "_blank", "noopener");
    if(action==="show-shortcuts")showToast("⌘Space Spotlight · ⌘N Finder · ⌘M Minimize · ⌘W Close");
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

  function greetingForNow() {
    const hour = new Date().getHours();
    if (hour < 5) return "go to sleep.";
    if (hour < 12) return "Good morning.";
    if (hour < 17) return "Good afternoon.";
    return "Good evening.";
  }

  function runBootIntro() {
    if (!bootIntro) { document.body.classList.add("desktop-ready"); return; }
    const force = new URLSearchParams(location.search).get("hello") === "1";
    let seen = false;
    try { seen = sessionStorage.getItem("rizvisions-intro-v106") === "1"; } catch {}
    if (seen && !force) {
      bootIntro.remove();
      document.body.classList.remove("boot-pending");
      document.body.classList.add("desktop-ready");
      return;
    }
    if (bootGreeting) bootGreeting.textContent = greetingForNow();
    document.body.classList.add("boot-active");
    const paths = $$(".boot-hello-path", bootIntro);
    const configs = [{ duration:720, delay:120 }, { duration:2350, delay:620 }];
    paths.forEach((path,index)=>{
      const length = path.getTotalLength();
      path.style.strokeDasharray = String(length);
      path.style.strokeDashoffset = String(length);
      path.animate([
        { strokeDashoffset:length, opacity:0 },
        { strokeDashoffset:length * .985, opacity:1, offset:.06 },
        { strokeDashoffset:0, opacity:1 }
      ], { duration:configs[index]?.duration || 1800, delay:configs[index]?.delay || 0, easing:"cubic-bezier(.55,.02,.34,1)", fill:"forwards" });
    });
    const finish = () => {
      if (!bootIntro?.isConnected) return;
      document.body.classList.add("desktop-ready");
      bootIntro.classList.add("leaving");
      try { sessionStorage.setItem("rizvisions-intro-v106","1"); } catch {}
      setTimeout(()=>{ bootIntro.remove(); document.body.classList.remove("boot-pending","boot-active"); }, 900);
    };
    bootSkip?.addEventListener("click", finish, { once:true });
    setTimeout(()=>bootIntro.classList.add("greeting-visible"), 820);
    setTimeout(finish, 3450);
  }

  function init(){
    setWallpaper(state.wallpaper,false);renderDesktopPhotos();applyIconLayout();applyWidgetLayout();applyDisplayState();updateCurrentWidget();renderDock();updateClockAndCalendar();bindEvents();runBootIntro();discoverMediaLibrary();
    dock.classList.toggle("no-magnify",!state.dockMagnification);
    setInterval(updateClockAndCalendar,30000);
  }

  init();
})();
