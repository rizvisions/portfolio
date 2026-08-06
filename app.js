(() => {
  "use strict";

  const STORAGE_KEY = "rizvisions-os-v8";
  const os = document.getElementById("os");
  const desktop = document.getElementById("desktop");
  const windowsRoot = document.getElementById("windows");
  const windowTemplate = document.getElementById("window-template");
  const activeAppName = document.getElementById("activeAppName");
  const toast = document.getElementById("toast");
  const contextMenu = document.getElementById("desktopContextMenu");
  const controlCenter = document.getElementById("controlCenterPanel");
  const controlCenterButton = document.getElementById("controlCenterButton");
  const soundStatus = document.getElementById("soundStatus");
  const desktopPhotosRoot = document.getElementById("desktopPhotos");
  const currentWidget = document.getElementById("currentWidget");
  const photoContextMenu = document.getElementById("photoContextMenu");
  const dock = document.getElementById("dock");
  const dockContextMenu = document.getElementById("dockContextMenu");
  const dockCustomizerBackdrop = document.getElementById("dockCustomizerBackdrop");
  const dockCustomizerList = document.getElementById("dockCustomizerList");
  const dockCustomizerDone = document.getElementById("dockCustomizerDone");
  const selectionRectangle = document.getElementById("selectionRectangle");
  const spotlightButton = document.getElementById("spotlightButton");
  const spotlightBackdrop = document.getElementById("spotlightBackdrop");
  const spotlightInput = document.getElementById("spotlightInput");
  const spotlightResults = document.getElementById("spotlightResults");
  const notificationCenter = document.getElementById("notificationCenter");
  const clockButton = document.getElementById("clockButton");
  const quickLookBackdrop = document.getElementById("quickLookBackdrop");
  const quickLookImage = document.getElementById("quickLookImage");
  const quickLookTitle = document.getElementById("quickLookTitle");
  const quickLookMeta = document.getElementById("quickLookMeta");
  const displayDimmer = document.getElementById("displayDimmer");
  const brightnessSlider = document.getElementById("brightnessSlider");
  const volumeSlider = document.getElementById("volumeSlider");
  const ccFocus = document.getElementById("ccFocus");
  const ccSound = document.getElementById("ccSound");

  const CONTENT = window.RIZVISIONS_CONTENT || { desktopPhotos: [], photoLibrary: [], currentCards: [] };
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const iconNodes = [...document.querySelectorAll(".desktop-item")];
  const defaultIcons = Object.fromEntries(iconNodes.map((node) => [
    node.dataset.id,
    { x: parseFloat(node.style.getPropertyValue("--x")), y: parseFloat(node.style.getPropertyValue("--y")) }
  ]));
  const defaultPhotos = Object.fromEntries((CONTENT.desktopPhotos || []).map((photo, index) => [
    photo.id,
    { x: photo.x, y: photo.y, rotation: photo.rotation || 0, z: index + 1 }
  ]));
  const defaultWidget = { x: 55, y: 5.8, z: 12 };

  const DOCK_CATALOG = {
    finder: { label: "Finder", app: "work", icon: "assets/icons/macos/finder.png", alwaysRunning: true, tracksRunning: true },
    work: { label: "Selected Work", app: "work", icon: "assets/icons/macos/folder.png", tracksRunning: false },
    photos: { label: "Photos", app: "photos", icon: "assets/icons/macos/photos.png", tracksRunning: true },
    about: { label: "About Riz", app: "about", icon: "assets/icons/macos/rizvisions.png", tracksRunning: true },
    messages: { label: "Messages", app: "messages", icon: "assets/icons/macos/messages.png", badge: "1", tracksRunning: true },
    calendar: { label: "Calendar", app: "calendar", kind: "calendar", tracksRunning: true },
    instagram: { label: "Instagram", app: "instagram", icon: "assets/icons/macos/instagram.png", tracksRunning: true },
    reel: { label: "Live Reel", app: "reel", icon: "assets/icons/macos/photos.png", tracksRunning: true },
    notes: { label: "Notes", app: "notes", icon: "assets/icons/macos/notes.png", tracksRunning: true },
    terminal: { label: "Terminal", app: "terminal", icon: "assets/icons/macos/terminal.png", tracksRunning: true },
    spotify: { label: "Spotify", app: "spotify", icon: "assets/icons/macos/spotify.png", tracksRunning: true },
    trash: { label: "Trash", app: "trash", icon: "assets/icons/macos/trash.png", kind: "trash", tracksRunning: true }
  };
  const DEFAULT_DOCK = ["finder", "work", "photos", "about", "messages", "calendar", "notes", "terminal", "spotify", "trash"];

  const DEFAULT_STATE = {
    wallpaper: "grid",
    sound: true,
    volume: 54,
    brightness: 100,
    focus: false,
    dock: [...DEFAULT_DOCK],
    dockMagnification: true,
    widgetIndex: 0,
    icons: clone(defaultIcons),
    photos: clone(defaultPhotos),
    widget: clone(defaultWidget),
    windows: {},
    notes: "Rizvisions is supposed to be a permanent internet home.\n\nThings to add:\n• real photography archives\n• Parker work\n• Blue Specs story\n• WAP / Whop era\n• better easter eggs\n• an iOS version for mobile"
  };

  let state = loadState();
  let zCounter = 200;
  let activeWindow = null;
  let audioContext = null;
  let toastTimer = null;
  let selectedPhotoId = null;
  let contextPhotoId = null;
  let quickLookIndex = 0;
  let spotlightIndex = 0;
  let spotlightMatches = [];
  let photoZCounter = Math.max(20, ...(Object.values(state.photos || {}).map((photo) => Number(photo.z) || 0)));

  const appDefinitions = {
    work: { name: "Finder", title: "Selected Work", size: [920, 610], render: renderFinder },
    about: { name: "System Settings", title: "About Riz", size: [760, 550], render: renderAbout },
    photos: { name: "Photos", title: "Photos", size: [900, 590], render: renderPhotos },
    messages: { name: "Messages", title: "Messages", size: [790, 540], render: renderMessages },
    instagram: { name: "Instagram", title: "Instagram", size: [560, 515], render: renderInstagram },
    terminal: { name: "Terminal", title: "riz — zsh", size: [690, 450], render: renderTerminal },
    notes: { name: "Notes", title: "Notes", size: [720, 510], render: renderNotes },
    spotify: { name: "Spotify", title: "Spotify", size: [690, 520], render: renderSpotify },
    calendar: { name: "Calendar", title: "Calendar", size: [720, 510], render: renderCalendar },
    trash: { name: "Finder", title: "Trash", size: [620, 430], render: renderTrash },
    reel: { name: "QuickTime Player", title: "Live Reel", size: [850, 570], render: renderLiveReel }
  };

  const projectDefinitions = {
    parker: {
      title: "Parker",
      eyebrow: "CURRENTLY",
      color: "#7f78c5",
      description: "AI creative strategy for ecommerce teams. I work across GTM, demos, customers, pricing, product feedback, content, and whatever else needs doing.",
      facts: ["Sales + customer work", "GTM and pricing", "Product storytelling", "Parker Brain"]
    },
    bluespecs: {
      title: "Blue Specs",
      eyebrow: "2020",
      color: "#3688e8",
      description: "The ecommerce business I built at 18: blue-light glasses, influencer deals, paid ads, support tickets, SEO, and a crash course in doing everything yourself.",
      facts: ["$40K+ in six months", "60% margin", "244% ROAS", "50+ influencer contracts"]
    },
    whop: {
      title: "Whop / WAP",
      eyebrow: "CREATOR ECONOMY",
      color: "#ef4d5f",
      description: "Creator rewards, clip programs, and performance-based content systems. This was where internet distribution, operations, and incentives really clicked for me.",
      facts: ["$5.5K peak MRR", "$20K+ earned", "25K community", "$3K in 30 Days winner"]
    },
    windsurf: {
      title: "Windsurf",
      eyebrow: "CAMPAIGN",
      color: "#21a89b",
      description: "A creator campaign built around short-form distribution and rewards. The program generated millions of views while exposing exactly where open creator systems break.",
      facts: ["3.6M views", "$5.75 RPM", "$20K spend", "fraud controls + content rules"]
    },
    creator: {
      title: "Rizvisions",
      eyebrow: "CREATOR",
      color: "#242426",
      description: "Photography, video, short-form experiments, internet projects, and the visual identity I have carried since middle school.",
      facts: ["TikTok @riz.com", "Instagram @rizvisions", "30M+ lifetime views", "Chicago"]
    }
  };

  const currentCards = (CONTENT.currentCards && CONTENT.currentCards.length ? CONTENT.currentCards : [
    { eyebrow: "CURRENTLY", title: "Parker", subtitle: "AI creative strategy", kind: "project", target: "parker" },
    { eyebrow: "CREATOR", title: "30M+ views", subtitle: "short-form videos and internet experiments", kind: "app", target: "reel" },
    { eyebrow: "BUILT AT 18", title: "Blue Specs", subtitle: "$40K+ ecommerce story", kind: "project", target: "bluespecs" },
    { eyebrow: "CREATOR ECONOMY", title: "Whop + WAP", subtitle: "$20K+ earned building reward systems", kind: "project", target: "whop" }
  ]).map((card) => ({ ...card }));

  const appIconMap = {
    work: "assets/icons/macos/finder.png", settings: "assets/icons/macos/settings.png", about: "assets/icons/macos/rizvisions.png", photos: "assets/icons/macos/photos.png",
    messages: "assets/icons/macos/messages.png", instagram: "assets/icons/macos/instagram.png", terminal: "assets/icons/macos/terminal.png",
    notes: "assets/icons/macos/notes.png", spotify: "assets/icons/macos/spotify.png", calendar: "assets/icons/macos/document.png",
    trash: "assets/icons/macos/trash.png", reel: "assets/icons/macos/photos.png"
  };

  const spotlightItems = [
    { title:"About Riz", subtitle:"Riz Zaheer · Chicago · internet home", icon:appIconMap.about, keywords:"about bio riz zaheer", run:()=>openApp("about") },
    { title:"Selected Work", subtitle:"Parker, Blue Specs, Whop, Windsurf", icon:appIconMap.work, keywords:"finder work portfolio projects", run:()=>openApp("work") },
    { title:"Photos", subtitle:"Photography and camera roll", icon:appIconMap.photos, keywords:"photos photography film chicago", run:()=>openApp("photos") },
    { title:"Live Reel", subtitle:"Creator work and short-form videos", icon:appIconMap.reel, keywords:"video tiktok reel creator", run:()=>openApp("reel") },
    { title:"Messages", subtitle:"Find the best way to reach Riz", icon:appIconMap.messages, keywords:"message contact email linkedin", run:()=>openApp("messages") },
    { title:"Instagram", subtitle:"Choose one of Riz's three accounts", icon:appIconMap.instagram, keywords:"instagram social rizvisions rizgoestomarket", run:()=>openApp("instagram") },
    { title:"Spotify", subtitle:"Play Riz's current playlist", icon:appIconMap.spotify, keywords:"spotify music playlist", run:()=>openApp("spotify") },
    { title:"Parker", subtitle:"Current work · AI creative strategy", icon:appIconMap.work, keywords:"parker ai work", run:()=>openProject("parker") },
    { title:"Blue Specs", subtitle:"The ecommerce business built at 18", icon:appIconMap.work, keywords:"blue specs ecommerce", run:()=>openProject("bluespecs") },
    { title:"Whop + WAP", subtitle:"Creator rewards and distribution", icon:appIconMap.work, keywords:"whop wap creator rewards", run:()=>openProject("whop") },
    { title:"Windsurf", subtitle:"3.6M-view creator campaign", icon:appIconMap.work, keywords:"windsurf campaign views", run:()=>openProject("windsurf") },
    { title:"Change Wallpaper", subtitle:"Cycle Light, Dark, Maroon, and Forest", icon:appIconMap.photos, keywords:"wallpaper background appearance", run:()=>cycleWallpaper() },
    { title:"Restore Default Layout", subtitle:"Put desktop objects back", icon:appIconMap.settings, keywords:"reset restore layout", run:()=>resetLayout() }
  ];

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!parsed || typeof parsed !== "object") return clone(DEFAULT_STATE);
      return {
        ...clone(DEFAULT_STATE),
        ...parsed,
        icons: { ...clone(defaultIcons), ...(parsed.icons || {}) },
        photos: { ...clone(defaultPhotos), ...(parsed.photos || {}) },
        widget: { ...clone(defaultWidget), ...(parsed.widget || {}) },
        dock: Array.isArray(parsed.dock) ? parsed.dock.filter((key) => DOCK_CATALOG[key]) : [...DEFAULT_DOCK],
        dockMagnification: parsed.dockMagnification !== false,
        windows: parsed.windows || {}
      };
    } catch {
      return clone(DEFAULT_STATE);
    }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage can be disabled */ }
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function playSound(kind = "open") {
    if (!state.sound) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = kind === "close" ? 310 : kind === "select" ? 520 : 420;
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      const volumeScale = Math.max(0.02, Number(state.volume || 54) / 100);
      gain.gain.exponentialRampToValueAtTime((kind === "select" ? 0.018 : 0.028) * volumeScale, audioContext.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.12);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(); oscillator.stop(audioContext.currentTime + 0.13);
    } catch { /* audio is optional */ }
  }

  function setWallpaper(name, persist = true) {
    if (!["grid", "dark", "maroon", "forest"].includes(name)) return;
    state.wallpaper = name;
    os.dataset.wallpaper = name;
    document.querySelectorAll(".menu-check").forEach((check) => {
      check.textContent = check.dataset.check === name ? "✓" : "";
    });
    if (persist) saveState();
  }

  function applyIconLayout() {
    iconNodes.forEach((node) => {
      const saved = state.icons[node.dataset.id] || defaultIcons[node.dataset.id];
      node.style.setProperty("--x", `${saved.x}%`);
      node.style.setProperty("--y", `${saved.y}%`);
      node.style.left = "var(--x)";
      node.style.top = "var(--y)";
    });
  }

  function applyWidgetLayout() {
    if (!currentWidget) return;
    const saved = state.widget || defaultWidget;
    currentWidget.style.setProperty("--widget-x", `${saved.x}%`);
    currentWidget.style.setProperty("--widget-y", `${saved.y}%`);
    currentWidget.style.left = "var(--widget-x)";
    currentWidget.style.top = "var(--widget-y)";
    currentWidget.style.zIndex = String(saved.z || defaultWidget.z);
  }

  function renderDesktopPhotos() {
    if (!desktopPhotosRoot) return;
    desktopPhotosRoot.innerHTML = "";
    (CONTENT.desktopPhotos || []).forEach((photo, index) => {
      const saved = state.photos[photo.id] || defaultPhotos[photo.id] || { x: photo.x, y: photo.y, rotation: photo.rotation || 0, z: index + 1 };
      const file = document.createElement("div");
      file.className = `photo-file${photo.monochrome ? " monochrome" : ""}`;
      file.dataset.photoId = photo.id;
      file.setAttribute("role", "button");
      file.setAttribute("tabindex", "0");
      file.setAttribute("draggable", "false");
      file.setAttribute("aria-label", `${photo.filename}. Double-click to open Photos.`);
      file.style.setProperty("--photo-x", `${saved.x}%`);
      file.style.setProperty("--photo-y", `${saved.y}%`);
      file.style.setProperty("--photo-rotation", `${saved.rotation || 0}deg`);
      file.style.setProperty("--photo-width", `${photo.width || 132}px`);
      file.style.zIndex = String(saved.z || index + 1);
      file.innerHTML = `<img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.alt || "")}" draggable="false"><span>${escapeHtml(photo.filename || "photo.jpg")}</span>`;
      file.ondragstart = () => false;
      file.addEventListener("dragstart", (event) => event.preventDefault(), true);
      file.addEventListener("mousedown", (event) => event.preventDefault(), true);
      file.addEventListener("pointerdown", (event) => beginPhotoDrag(event, file));
      file.addEventListener("click", (event) => {
        event.stopPropagation();
        if (file._suppressClick) { event.preventDefault(); return; }
        selectDesktopPhoto(file, event.shiftKey || event.metaKey || event.ctrlKey);
      });
      file.addEventListener("dblclick", (event) => {
        if (file._suppressClick) { event.preventDefault(); return; }
        event.preventDefault();
        openQuickLook(photo.id);
      });
      file.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        contextPhotoId = photo.id;
        selectDesktopPhoto(file);
        closeMenus();
        photoContextMenu.style.left = `${Math.min(event.clientX, window.innerWidth - 250)}px`;
        photoContextMenu.style.top = `${Math.min(event.clientY, window.innerHeight - 190)}px`;
        photoContextMenu.classList.add("open");
      });
      file.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openApp("photos");
        }
      });
      desktopPhotosRoot.appendChild(file);
    });
  }

  function applyPhotoLayout() {
    if (!desktopPhotosRoot) return;
    desktopPhotosRoot.querySelectorAll(".photo-file").forEach((file) => {
      const saved = state.photos[file.dataset.photoId] || defaultPhotos[file.dataset.photoId];
      if (!saved) return;
      file.style.setProperty("--photo-x", `${saved.x}%`);
      file.style.setProperty("--photo-y", `${saved.y}%`);
      file.style.setProperty("--photo-rotation", `${saved.rotation || 0}deg`);
      file.style.left = "var(--photo-x)";
      file.style.top = "var(--photo-y)";
      file.style.zIndex = String(saved.z || 1);
    });
  }

  function beginPhotoDrag(event, file) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const desktopRect = desktop.getBoundingClientRect();
    const fileRect = file.getBoundingClientRect();
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startY = event.clientY;
    const startLeft = fileRect.left - desktopRect.left + fileRect.width / 2;
    const startTop = fileRect.top - desktopRect.top + fileRect.height / 2;
    let moved = false;
    let latestX = startX;
    let latestY = startY;
    let frame = 0;

    photoZCounter += 1;
    file.style.zIndex = String(photoZCounter);
    selectDesktopPhoto(file);
    file.classList.add("pointer-active");
    document.body.classList.add("desktop-dragging");

    const paint = () => {
      frame = 0;
      const dx = latestX - startX;
      const dy = latestY - startY;
      if (!moved && Math.hypot(dx, dy) < 3) return;
      if (!moved) {
        moved = true;
        file.classList.add("dragging");
      }
      const halfW = file.offsetWidth / 2;
      const halfH = file.offsetHeight / 2;
      const left = Math.min(Math.max(halfW + 8, startLeft + dx), desktop.clientWidth - halfW - 8);
      const top = Math.min(Math.max(halfH + 8, startTop + dy), desktop.clientHeight - halfH - 105);
      file.style.left = `${left}px`;
      file.style.top = `${top}px`;
    };

    const onMove = (moveEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      moveEvent.preventDefault();
      latestX = moveEvent.clientX;
      latestY = moveEvent.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const finish = (upEvent) => {
      if (upEvent && upEvent.pointerId !== pointerId) return;
      document.removeEventListener("pointermove", onMove, true);
      document.removeEventListener("pointerup", finish, true);
      document.removeEventListener("pointercancel", finish, true);
      window.removeEventListener("blur", finish);
      if (frame) {
        cancelAnimationFrame(frame);
        paint();
      }
      document.body.classList.remove("desktop-dragging");
      file.classList.remove("dragging", "pointer-active");

      const current = state.photos[file.dataset.photoId] || defaultPhotos[file.dataset.photoId] || {};
      if (moved) {
        const x = (parseFloat(file.style.left) / desktop.clientWidth) * 100;
        const y = (parseFloat(file.style.top) / desktop.clientHeight) * 100;
        state.photos[file.dataset.photoId] = { ...current, x: +x.toFixed(3), y: +y.toFixed(3), z: photoZCounter };
        file.style.setProperty("--photo-x", `${x}%`);
        file.style.setProperty("--photo-y", `${y}%`);
        file.style.left = "var(--photo-x)";
        file.style.top = "var(--photo-y)";
        file._suppressClick = true;
        setTimeout(() => { file._suppressClick = false; }, 0);
      } else {
        state.photos[file.dataset.photoId] = { ...current, z: photoZCounter };
      }
      saveState();
    };

    document.addEventListener("pointermove", onMove, true);
    document.addEventListener("pointerup", finish, true);
    document.addEventListener("pointercancel", finish, true);
    window.addEventListener("blur", finish, { once: true });
  }

  function beginWidgetDrag(event) {
    if (!currentWidget || event.button !== 0 || event.target.closest("button")) return;
    event.preventDefault();
    event.stopPropagation();

    const desktopRect = desktop.getBoundingClientRect();
    const widgetRect = currentWidget.getBoundingClientRect();
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startY = event.clientY;
    const startLeft = widgetRect.left - desktopRect.left + widgetRect.width / 2;
    const startTop = widgetRect.top - desktopRect.top;
    let moved = false;
    let latestX = startX;
    let latestY = startY;
    let frame = 0;

    currentWidget.style.zIndex = "60";
    currentWidget.classList.add("pointer-active");
    document.body.classList.add("desktop-dragging");

    const paint = () => {
      frame = 0;
      const dx = latestX - startX;
      const dy = latestY - startY;
      if (!moved && Math.hypot(dx, dy) < 3) return;
      if (!moved) {
        moved = true;
        currentWidget.classList.add("dragging");
      }
      const halfW = widgetRect.width / 2;
      const left = Math.min(Math.max(halfW + 8, startLeft + dx), desktop.clientWidth - halfW - 8);
      const top = Math.min(Math.max(8, startTop + dy), desktop.clientHeight - widgetRect.height - 105);
      currentWidget.style.left = `${left}px`;
      currentWidget.style.top = `${top}px`;
    };

    const onMove = (moveEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      moveEvent.preventDefault();
      latestX = moveEvent.clientX;
      latestY = moveEvent.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const finish = (upEvent) => {
      if (upEvent && upEvent.pointerId !== pointerId) return;
      document.removeEventListener("pointermove", onMove, true);
      document.removeEventListener("pointerup", finish, true);
      document.removeEventListener("pointercancel", finish, true);
      window.removeEventListener("blur", finish);
      if (frame) {
        cancelAnimationFrame(frame);
        paint();
      }
      document.body.classList.remove("desktop-dragging");
      currentWidget.classList.remove("dragging", "pointer-active");

      if (moved) {
        const x = (parseFloat(currentWidget.style.left) / desktop.clientWidth) * 100;
        const y = (parseFloat(currentWidget.style.top) / desktop.clientHeight) * 100;
        state.widget = { x: +x.toFixed(3), y: +y.toFixed(3), z: 12 };
        currentWidget.style.setProperty("--widget-x", `${x}%`);
        currentWidget.style.setProperty("--widget-y", `${y}%`);
        currentWidget.style.left = "var(--widget-x)";
        currentWidget.style.top = "var(--widget-y)";
        currentWidget._suppressClick = true;
        setTimeout(() => { currentWidget._suppressClick = false; }, 0);
        saveState();
      } else {
        currentWidget.style.zIndex = String((state.widget || defaultWidget).z || 12);
      }
    };

    document.addEventListener("pointermove", onMove, true);
    document.addEventListener("pointerup", finish, true);
    document.addEventListener("pointercancel", finish, true);
    window.addEventListener("blur", finish, { once: true });
  }

  function selectDesktopPhoto(file) {
    selectedPhotoId = file?.dataset.photoId || null;
    iconNodes.forEach((node) => node.classList.remove("selected"));
    desktopPhotosRoot?.querySelectorAll(".photo-file").forEach((node) => node.classList.toggle("selected", node === file));
    playSound("select");
  }

  function resetLayout() {
    state.icons = clone(defaultIcons);
    state.photos = clone(defaultPhotos);
    state.widget = clone(defaultWidget);
    photoZCounter = Math.max(20, ...(Object.values(state.photos || {}).map((photo) => Number(photo.z) || 0)));
    state.windows = {};
    state.widgetIndex = 0;
    saveState();
    applyIconLayout();
    applyPhotoLayout();
    applyWidgetLayout();
    [...windowsRoot.children].forEach((win) => win.remove());
    activeWindow = null;
    activeAppName.textContent = "Rizvisions";
    renderMinimizedDock();
    updateCurrentWidget();
    applyDisplayState();
    updateDockRunning();
    showToast("Desktop layout restored");
  }

  function fullReset() {
    const confirmed = window.confirm("Reset Rizvisions? This clears appearance, Dock, desktop icon and photo positions, window positions, and saved Notes on this browser.");
    if (!confirmed) return;
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && key.toLowerCase().includes("rizvisions")) keys.push(key);
      }
      keys.forEach((key) => localStorage.removeItem(key));
    } catch { /* private browsing can disable storage */ }
    state = clone(DEFAULT_STATE);
    photoZCounter = Math.max(20, ...(Object.values(state.photos || {}).map((photo) => Number(photo.z) || 0)));
    setWallpaper(state.wallpaper, false);
    applyIconLayout();
    renderDesktopPhotos();
    applyWidgetLayout();
    [...windowsRoot.children].forEach((win) => win.remove());
    activeWindow = null;
    activeAppName.textContent = "Rizvisions";
    selectedPhotoId = null;
    renderMinimizedDock();
    updateCurrentWidget();
    applyDisplayState();
    updateDockRunning();
    saveState();
    showToast("Rizvisions reset");
  }

  function defaultWindowRect(appId, width, height) {
    const desktopRect = desktop.getBoundingClientRect();
    const index = Math.max(0, Object.keys(appDefinitions).indexOf(appId));
    const w = Math.min(width, desktopRect.width - 34);
    const h = Math.min(height, desktopRect.height - 122);
    const left = Math.max(10, Math.round((desktopRect.width - w) / 2 + ((index % 4) - 1.5) * 22));
    const top = Math.max(10, Math.round((desktopRect.height - h) / 2 - 32 + (index % 3) * 16));
    return { left, top, width: w, height: h };
  }

  function clampWindowRect(rect) {
    const maxWidth = desktop.clientWidth;
    const maxHeight = desktop.clientHeight - 91;
    const width = Math.min(Math.max(540, rect.width), maxWidth);
    const height = Math.min(Math.max(360, rect.height), maxHeight);
    return {
      width,
      height,
      left: Math.min(Math.max(-width + 110, rect.left), maxWidth - 110),
      top: Math.min(Math.max(0, rect.top), maxHeight - 52)
    };
  }

  function createWindow(appId, definition = appDefinitions[appId]) {
    if (!definition) return null;
    const fragment = windowTemplate.content.cloneNode(true);
    const win = fragment.querySelector(".mac-window");
    win.dataset.appWindow = appId;
    win.setAttribute("aria-label", definition.title);
    win.querySelector(".window-title").textContent = definition.title;
    win.querySelector(".window-body").innerHTML = definition.render(appId);

    const saved = state.windows[appId];
    const initial = clampWindowRect(saved || defaultWindowRect(appId, ...definition.size));
    Object.assign(win.style, {
      left: `${initial.left}px`, top: `${initial.top}px`, width: `${initial.width}px`, height: `${initial.height}px`, zIndex: ++zCounter
    });

    windowsRoot.appendChild(win);
    wireWindow(win);
    wireAppSpecific(win, appId);
    requestAnimationFrame(() => focusWindow(win));
    return win;
  }

  function openApp(appId) {
    closeMenus();
    let win = windowsRoot.querySelector(`[data-app-window="${CSS.escape(appId)}"]`);
    if (!win) win = createWindow(appId);
    if (!win) return;
    win.hidden = false;
    win.classList.remove("minimizing");
    removeMinimizedWindow(appId);
    focusWindow(win);
    bounceDock(appId);
    playSound("open");
  }

  function openProject(projectId) {
    const project = projectDefinitions[projectId];
    if (!project) return;
    const appId = `project-${projectId}`;
    let win = windowsRoot.querySelector(`[data-app-window="${appId}"]`);
    if (!win) {
      const definition = {
        name: "Quick Look",
        title: project.title,
        size: [660, 535],
        render: () => renderProject(project)
      };
      win = createWindow(appId, definition);
      win.dataset.appName = "Quick Look";
    }
    win.hidden = false;
    focusWindow(win);
    playSound("open");
  }

  function focusWindow(win) {
    if (!win || win.hidden) return;
    activeWindow = win;
    [...windowsRoot.children].forEach((other) => other.classList.toggle("inactive", other !== win));
    win.style.zIndex = ++zCounter;
    const id = win.dataset.appWindow;
    const app = appDefinitions[id];
    activeAppName.textContent = app?.name || win.dataset.appName || "Rizvisions";
    updateDockRunning();
  }

  function saveWindowRect(win) {
    if (!win || win.classList.contains("maximized")) return;
    const rect = {
      left: parseFloat(win.style.left) || win.offsetLeft,
      top: parseFloat(win.style.top) || win.offsetTop,
      width: win.offsetWidth,
      height: win.offsetHeight
    };
    state.windows[win.dataset.appWindow] = clampWindowRect(rect);
    saveState();
  }

  function closeWindow(win = activeWindow) {
    if (!win) return;
    saveWindowRect(win);
    playSound("close");
    removeMinimizedWindow(win.dataset.appWindow);
    win.remove();
    activeWindow = [...windowsRoot.children].filter((node) => !node.hidden).sort((a, b) => (+a.style.zIndex) - (+b.style.zIndex)).pop() || null;
    if (activeWindow) focusWindow(activeWindow); else activeAppName.textContent = "Rizvisions";
    updateDockRunning();
  }

  function minimizeWindow(win = activeWindow) {
    if (!win) return;
    saveWindowRect(win);
    win.classList.add("minimizing");
    setTimeout(() => {
      win.hidden = true;
      win.classList.remove("minimizing");
      activeWindow = [...windowsRoot.children].filter((node) => !node.hidden).sort((a, b) => (+a.style.zIndex) - (+b.style.zIndex)).pop() || null;
      if (activeWindow) focusWindow(activeWindow); else activeAppName.textContent = "Rizvisions";
      renderMinimizedDock();
      updateDockRunning();
    }, 230);
  }

  function zoomWindow(win = activeWindow) {
    if (!win) return;
    if (win.classList.contains("maximized")) {
      const previous = JSON.parse(win.dataset.previousRect || "{}");
      win.classList.remove("maximized");
      Object.assign(win.style, {
        left: `${previous.left || 20}px`, top: `${previous.top || 20}px`,
        width: `${previous.width || 760}px`, height: `${previous.height || 520}px`
      });
    } else {
      win.dataset.previousRect = JSON.stringify({ left: win.offsetLeft, top: win.offsetTop, width: win.offsetWidth, height: win.offsetHeight });
      win.classList.add("maximized");
      Object.assign(win.style, { left: "0px", top: "0px", width: "100%", height: "calc(100% - 103px)" });
    }
    focusWindow(win);
  }

  function wireWindow(win) {
    win.addEventListener("pointerdown", () => focusWindow(win));
    win.querySelectorAll("[data-window-action]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const action = button.dataset.windowAction;
        if (action === "close") closeWindow(win);
        if (action === "minimize") minimizeWindow(win);
        if (action === "zoom") zoomWindow(win);
      });
    });
    win.querySelector(".drag-handle").addEventListener("pointerdown", (event) => beginWindowDrag(event, win));
    const observer = new ResizeObserver(() => {
      clearTimeout(win._saveTimer);
      win._saveTimer = setTimeout(() => saveWindowRect(win), 260);
    });
    observer.observe(win);
  }

  function beginWindowDrag(event, win) {
    if (event.button !== 0 || event.target.closest(".traffic-lights") || win.classList.contains("maximized")) return;
    event.preventDefault();
    focusWindow(win);
    const startX = event.clientX;
    const startY = event.clientY;
    const startLeft = win.offsetLeft;
    const startTop = win.offsetTop;
    const onMove = (moveEvent) => {
      const left = startLeft + moveEvent.clientX - startX;
      const top = startTop + moveEvent.clientY - startY;
      const clamped = clampWindowRect({ left, top, width: win.offsetWidth, height: win.offsetHeight });
      win.style.left = `${clamped.left}px`;
      win.style.top = `${clamped.top}px`;
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      saveWindowRect(win);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  }

  function updateDockRunning() {
    document.querySelectorAll(".dock-item[data-app]").forEach((item) => {
      const id = item.dataset.app;
      const running = [...windowsRoot.children].some((win) => {
        const windowId = win.dataset.appWindow;
        return windowId === id || (id === "work" && windowId.startsWith("project-"));
      });
      item.classList.toggle("running", running || id === "work");
    });
  }

  function bounceDock(appId) {
    const item = document.querySelector(`.dock-item[data-app="${CSS.escape(appId)}"]`);
    if (!item) return;
    item.classList.remove("bounce");
    void item.offsetWidth;
    item.classList.add("bounce");
    setTimeout(() => item.classList.remove("bounce"), 700);
  }

  function beginIconDrag(event, item) {
    if (event.button !== 0) return;
    event.preventDefault();
    const desktopRect = desktop.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startLeft = itemRect.left - desktopRect.left + itemRect.width / 2;
    const startTop = itemRect.top - desktopRect.top + itemRect.height / 2;
    let moved = false;

    selectDesktopItem(item);
    const onMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      moved = true;
      item.classList.add("dragging");
      const left = Math.min(Math.max(54, startLeft + dx), desktop.clientWidth - 54);
      const top = Math.min(Math.max(55, startTop + dy), desktop.clientHeight - 118);
      item.style.left = `${left}px`;
      item.style.top = `${top}px`;
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (moved) {
        const x = (parseFloat(item.style.left) / desktop.clientWidth) * 100;
        const y = (parseFloat(item.style.top) / desktop.clientHeight) * 100;
        state.icons[item.dataset.id] = { x: +x.toFixed(3), y: +y.toFixed(3) };
        item.style.setProperty("--x", `${x}%`);
        item.style.setProperty("--y", `${y}%`);
        item.style.left = "var(--x)";
        item.style.top = "var(--y)";
        item.classList.remove("dragging");
        saveState();
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  }

  function selectDesktopItem(item) {
    desktopPhotosRoot?.querySelectorAll(".photo-file").forEach((node) => node.classList.remove("selected"));
    iconNodes.forEach((node) => node.classList.toggle("selected", node === item));
    playSound("select");
  }

  function closeMenus() {
    document.querySelectorAll(".menu-popover.open, .context-menu.open").forEach((menu) => menu.classList.remove("open"));
    document.querySelectorAll(".menu-trigger.open").forEach((trigger) => trigger.classList.remove("open"));
    controlCenter.classList.remove("open");
    controlCenter.setAttribute("aria-hidden", "true");
    notificationCenter?.classList.remove("open");
    notificationCenter?.setAttribute("aria-hidden", "true");
  }

  function toggleMenu(trigger) {
    const menu = document.getElementById(trigger.dataset.menu);
    const wasOpen = menu.classList.contains("open");
    closeMenus();
    if (!wasOpen) {
      menu.classList.add("open");
      trigger.classList.add("open");
    }
  }

  function wireAppSpecific(win, appId) {
    if (appId === "terminal") wireTerminal(win);
    if (appId === "photos") {
      win.querySelectorAll("[data-photo-library-index]").forEach((button) => button.addEventListener("dblclick", () => openQuickLookByLibraryIndex(Number(button.dataset.photoLibraryIndex))));
    }
    if (appId === "notes") {
      const textarea = win.querySelector("textarea");
      textarea.value = state.notes;
      textarea.addEventListener("input", () => { state.notes = textarea.value; saveState(); });
    }
  }

  function renderFinder() {
    return `
      <div class="finder-shell">
        <aside class="finder-sidebar">
          <div class="sidebar-section"><div class="sidebar-title">Favorites</div>
            <div class="sidebar-row active"><span class="sidebar-glyph">◫</span>Selected Work</div>
            <div class="sidebar-row"><span class="sidebar-glyph">◉</span>Recents</div>
            <div class="sidebar-row"><span class="sidebar-glyph">⌁</span>Photos</div>
            <div class="sidebar-row"><span class="sidebar-glyph">⇩</span>Downloads</div>
          </div>
          <div class="sidebar-section"><div class="sidebar-title">Locations</div>
            <div class="sidebar-row"><span class="sidebar-glyph">▣</span>Rizvisions</div>
            <div class="sidebar-row"><span class="sidebar-glyph">☁</span>iCloud Drive</div>
          </div>
          <div class="sidebar-section"><div class="sidebar-title">Tags</div>
            <div class="sidebar-row"><span class="sidebar-glyph" style="color:#ff3b30">●</span>Work</div>
            <div class="sidebar-row"><span class="sidebar-glyph" style="color:#ff9f0a">●</span>Internet</div>
            <div class="sidebar-row"><span class="sidebar-glyph" style="color:#30d158">●</span>Personal</div>
          </div>
        </aside>
        <main class="finder-main">
          <div class="finder-toolbar">
            <button class="toolbar-button" aria-label="Back">‹</button><button class="toolbar-button" aria-label="Forward">›</button>
            <span class="finder-title-inline">Selected Work</span><span class="toolbar-spacer"></span>
            <button class="toolbar-button" aria-label="Icon view">▦</button><button class="toolbar-button" aria-label="List view">☷</button>
            <input class="search-field" aria-label="Search" placeholder="Search" />
          </div>
          <div class="finder-content"><div class="finder-grid">
            <button class="file-item" data-project="parker"><span class="finder-folder"><img src="assets/icons/macos/folder.png" alt=""><i style="--tag:#8b7fd1"></i></span><span class="file-name">Parker</span></button>
            <button class="file-item" data-project="bluespecs"><span class="finder-folder"><img src="assets/icons/macos/folder.png" alt=""><i style="--tag:#2686e8"></i></span><span class="file-name">Blue Specs</span></button>
            <button class="file-item" data-project="whop"><span class="finder-folder"><img src="assets/icons/macos/folder.png" alt=""><i style="--tag:#ff453a"></i></span><span class="file-name">Whop + WAP</span></button>
            <button class="file-item" data-project="windsurf"><span class="finder-folder"><img src="assets/icons/macos/folder.png" alt=""><i style="--tag:#30b0c7"></i></span><span class="file-name">Windsurf</span></button>
            <button class="file-item" data-project="creator"><span class="finder-folder"><img src="assets/icons/macos/folder.png" alt=""><i style="--tag:#8e8e93"></i></span><span class="file-name">Creator Work</span></button>
            <button class="file-item" data-app="photos"><img src="assets/icons/macos/photos.png" alt=""><span class="file-name">Photography</span></button>
            <button class="file-item" data-app="reel"><span class="finder-video-file"><img src="assets/photos/chicago-river-bw.jpg" alt=""><i>▶</i></span><span class="file-name">Live Reel.mov</span></button>
            <button class="file-item" data-app="notes"><img src="assets/icons/macos/notes.png" alt=""><span class="file-name">Random Notes</span></button>
          </div></div>
          <div class="finder-statusbar">9 items, 42.6 GB available</div>
        </main>
      </div>`;
  }

  function renderAbout() {
    return `
      <div class="settings-shell">
        <aside class="settings-sidebar">
          <input class="settings-search" placeholder="Search" aria-label="Search settings">
          <div class="settings-profile-mini"><img src="assets/icons/macos/rizvisions.png" alt=""><span><strong>Riz Zaheer</strong><small>Rizvisions</small></span></div>
          <div class="settings-list">
            <div class="settings-row active"><span class="settings-row-icon">R</span>About Riz</div>
            <div class="settings-row"><span class="settings-row-icon" style="background:#0a84ff">◎</span>Work</div>
            <div class="settings-row"><span class="settings-row-icon" style="background:#30b755">⌁</span>Socials</div>
            <div class="settings-row"><span class="settings-row-icon" style="background:#ff9f0a">♫</span>Currently</div>
            <div class="settings-row"><span class="settings-row-icon" style="background:#8e8e93">•••</span>Whatever</div>
          </div>
        </aside>
        <main class="settings-main">
          <h1>About Riz</h1>
          <section class="profile-card">
            <div class="profile-hero"><img src="assets/icons/macos/rizvisions.png" alt="Rizvisions icon"><div><h2>Riz Zaheer</h2><p>Creator and operator in Chicago. I work at Parker, build things on the internet, take photos, make videos, and have been using Rizvisions as a creative moniker since I was a kid.</p></div></div>
            <div class="profile-detail-row"><span class="label">Currently</span><strong>Parker AI</strong><button class="mac-button" data-project="parker">Open</button></div>
            <div class="profile-detail-row"><span class="label">Based in</span><strong>Chicago, Illinois</strong><span></span></div>
            <div class="profile-detail-row"><span class="label">Internet home</span><strong>rizvisions.com</strong><span></span></div>
            <div class="profile-links">
              <button class="mac-button primary" data-external="https://www.linkedin.com/in/riz-zaheer/">LinkedIn</button>
              <button class="mac-button" data-external="https://x.com/rizvisions">X</button>
              <button class="mac-button" data-app="instagram">Instagram</button>
              <button class="mac-button" data-external="https://open.spotify.com/user/riz002?si=eb580719d3ed4637">Spotify</button>
            </div>
          </section>
        </main>
      </div>`;
  }

  function renderPhotos() {
    return `
      <div class="photos-shell">
        <aside class="photos-sidebar">
          <div class="sidebar-section"><div class="sidebar-title">Library</div><div class="sidebar-row active"><span class="sidebar-glyph">⌁</span>All Photos</div><div class="sidebar-row"><span class="sidebar-glyph">▣</span>Recents</div><div class="sidebar-row"><span class="sidebar-glyph">♡</span>Favorites</div></div>
          <div class="sidebar-section"><div class="sidebar-title">Albums</div><div class="sidebar-row"><span class="sidebar-glyph">□</span>Chicago</div><div class="sidebar-row"><span class="sidebar-glyph">□</span>Film</div><div class="sidebar-row"><span class="sidebar-glyph">□</span>Rizvisions</div></div>
        </aside>
        <main class="photos-main">
          <div class="photos-toolbar"><h2>Library</h2><span class="toolbar-spacer"></span><button class="toolbar-button">−</button><button class="toolbar-button">+</button></div>
          <div class="photos-grid">
            ${(CONTENT.photoLibrary || []).map((photo, index) => `<button class="${escapeHtml(photo.layout || "")}" data-photo-library-index="${index}"><img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.alt || "")}" draggable="false"></button>`).join("")}
          </div>
        </main>
      </div>`;
  }

  function renderMessages() {
    return `
      <div class="messages-shell">
        <aside class="conversation-list">
          <input class="message-search" placeholder="Search" aria-label="Search messages">
          <div class="conversation active"><span class="avatar">R</span><span><strong>Riz</strong><small>Welcome to my corner of the internet.</small></span><time>now</time></div>
          <div class="conversation"><span class="avatar">P</span><span><strong>Parker</strong><small>Back to work?</small></span><time>1:04 AM</time></div>
        </aside>
        <main class="chat-pane">
          <div class="chat-header">Riz</div>
          <div class="chat-body">
            <div class="bubble in">You made it this far. What do you want to know?</div>
            <div class="bubble out">This site is cool. How do I reach you?</div>
            <div class="bubble in">LinkedIn is best for work. Instagram works for everything else.</div>
            <div class="chat-actions"><button class="mac-button primary" data-external="https://www.linkedin.com/in/riz-zaheer/">Open LinkedIn</button><button class="mac-button" data-app="instagram">Open Instagram</button></div>
          </div>
          <div class="chat-input"><input placeholder="iMessage" aria-label="Message field"></div>
        </main>
      </div>`;
  }

  function renderInstagram() {
    return `
      <div class="instagram-shell">
        <div class="instagram-heading"><img src="assets/icons/macos/instagram.png" alt="Instagram"><h2>Choose an account</h2><p>Different corners of the same internet person.</p></div>
        <div class="account-list">
          <a class="account-row" href="https://www.instagram.com/rizvisions/" target="_blank" rel="noopener"><span class="account-avatar">RV</span><span><strong>@rizvisions</strong><small>Photography, video, life, and creative stuff</small></span><span class="chevron">›</span></a>
          <a class="account-row" href="https://www.instagram.com/rizgoestomarket/" target="_blank" rel="noopener"><span class="account-avatar">GT</span><span><strong>@rizgoestomarket</strong><small>AI, GTM, Parker, and work-brain content</small></span><span class="chevron">›</span></a>
          <a class="account-row" href="https://www.instagram.com/rizzaheer/" target="_blank" rel="noopener"><span class="account-avatar">RZ</span><span><strong>@rizzaheer</strong><small>Personal — friends and family</small></span><span class="chevron">›</span></a>
        </div>
      </div>`;
  }

  function renderTerminal() {
    return `<div class="terminal-shell"><div class="terminal-output">Last login: ${new Date().toLocaleDateString()} on ttys001\n\nRizvisions OS 5.0\nType <span class="terminal-link">help</span> to see available commands.\n</div><div class="terminal-input-row"><span class="terminal-prompt">riz@rizvisions ~ %</span><input class="terminal-input" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Terminal command"></div></div>`;
  }

  function renderNotes() {
    return `<div class="notes-shell"><aside class="notes-list"><div class="note-row active"><strong>Rizvisions roadmap</strong><small>Today&nbsp;&nbsp; ${escapeHtml(state.notes.slice(0, 45))}…</small></div><div class="note-row"><strong>Things I should build</strong><small>Yesterday&nbsp;&nbsp; Guestbook, timeline…</small></div></aside><main class="note-editor"><div class="note-meta">Today at ${new Date().toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}</div><textarea aria-label="Note"></textarea></main></div>`;
  }

  function renderSpotify() {
    return `
      <div class="spotify-shell spotify-embed-shell">
        <div class="spotify-window-header">
          <img src="assets/icons/macos/spotify.png" alt="Spotify">
          <div><span class="type">PLAYLIST</span><h2>Rizvisions</h2><p>A rotating soundtrack for the site.</p></div>
          <button class="mac-button spotify-link" data-external="https://open.spotify.com/playlist/76WzEHradeFZfSUMLsxH7I?si=565dc6edf9be49a1">Open in Spotify</button>
        </div>
        <div class="spotify-embed-wrap">
          <iframe
            data-testid="embed-iframe"
            src="https://open.spotify.com/embed/playlist/76WzEHradeFZfSUMLsxH7I?utm_source=generator&si=565dc6edf9be49a1"
            width="100%"
            height="352"
            frameborder="0"
            allowfullscreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Rizvisions Spotify playlist">
          </iframe>
        </div>
      </div>`;
  }

  function renderCalendar() {
    const today = new Date();
    const month = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const day = today.getDate();
    const cells = Array.from({length: 35}, (_, i) => i + 1).map((n) => `<span class="${n === day ? "today" : ""}">${n <= 31 ? n : ""}</span>`).join("");
    return `<div class="calendar-shell"><aside class="calendar-sidebar"><div class="mini-calendar"><strong>${month}</strong><div class="mini-grid">${["S","M","T","W","T","F","S"].map(d=>`<span>${d}</span>`).join("")}${cells}</div></div></aside><main class="calendar-main"><h2>${today.toLocaleDateString("en-US", {weekday:"long", month:"long", day:"numeric"})}</h2><div class="calendar-event"><strong>Coffee chat with Riz</strong><p>No booking link yet. Reach out on LinkedIn or Instagram and we’ll figure it out like normal people.</p><p><button class="mac-button primary" data-external="https://www.linkedin.com/in/riz-zaheer/">Message on LinkedIn</button></p></div></main></div>`;
  }

  function renderTrash() {
    return `<div class="empty-state"><div><img src="assets/icons/macos/trash.png" alt="Trash"><h2>Nothing worth deleting</h2><p>Old domains, failed ideas, embarrassing drafts, and abandoned businesses will eventually live here.</p></div></div>`;
  }


  function renderLiveReel() {
    const reelItems = [
      { eyebrow:"LIFESTYLE + CREATIVE", title:"@rizvisions", copy:"Photography, mixed-media reels, Chicago, and whatever I feel like making.", href:"https://www.instagram.com/rizvisions/", image:"assets/photos/chicago-river-bw.jpg" },
      { eyebrow:"AI + GTM", title:"@rizgoestomarket", copy:"Parker, AI, ecommerce, product thinking, and the work-brain side of the internet.", href:"https://www.instagram.com/rizgoestomarket/", image:"assets/photos/camera-bw.jpg" },
      { eyebrow:"SHORT FORM", title:"@riz.com", copy:"The TikTok account behind millions of views and years of internet experiments.", href:"https://www.tiktok.com/@riz.com", image:"assets/photos/chicago-skyline.jpg" }
    ];
    return `<div class="reel-shell"><header class="reel-header"><div><span>LIVE REEL</span><h1>Things I make</h1><p>A living index until the actual video archive is fully wired in.</p></div><button class="mac-button" data-external="https://www.tiktok.com/@riz.com">Open TikTok</button></header><div class="reel-grid">${reelItems.map((item,index)=>`<a class="reel-card" href="${item.href}" target="_blank" rel="noopener"><img src="${item.image}" alt=""><span class="reel-number">0${index+1}</span><div><small>${item.eyebrow}</small><strong>${item.title}</strong><p>${item.copy}</p><em>Open ↗</em></div></a>`).join("")}</div></div>`;
  }

  function renderProject(project) {
    return `<div style="height:100%;display:flex;flex-direction:column;background:#f4f4f4;overflow:auto;user-select:text"><div style="min-height:230px;padding:34px 38px;color:white;background:linear-gradient(145deg,${project.color},color-mix(in srgb, ${project.color} 55%, #101014));display:flex;flex-direction:column;justify-content:flex-end"><span style="font-size:10px;font-weight:700;letter-spacing:.12em;opacity:.76">${project.eyebrow}</span><h1 style="margin:8px 0 0;font-size:48px;letter-spacing:-.055em">${project.title}</h1></div><div style="padding:28px 36px 36px"><p style="font-size:16px;line-height:1.52;margin:0 0 24px;max-width:640px">${project.description}</p><div style="display:grid;grid-template-columns:1fr 1fr;border:1px solid rgba(0,0,0,.12);border-radius:11px;overflow:hidden;background:white">${project.facts.map((fact,i)=>`<div style="min-height:64px;padding:14px 16px;display:flex;align-items:center;font-size:13px;font-weight:600;border-${i%2===0?'right':'left'}:0;border-bottom:${i<2?'1px solid rgba(0,0,0,.09)':'0'}">${fact}</div>`).join("")}</div></div></div>`;
  }

  function wireTerminal(win) {
    const input = win.querySelector(".terminal-input");
    const output = win.querySelector(".terminal-output");
    input.focus();
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      const command = input.value.trim();
      output.textContent += `\nriz@rizvisions ~ % ${command}\n`;
      input.value = "";
      const lower = command.toLowerCase();
      if (!lower) return;
      if (lower === "help") output.textContent += "about  work  photos  reel  social  spotify  spotlight  clear  reset\n";
      else if (lower === "about") { output.textContent += "Opening About Riz…\n"; openApp("about"); }
      else if (lower === "work") { output.textContent += "Opening Selected Work…\n"; openApp("work"); }
      else if (lower === "photos") { output.textContent += "Opening Photos…\n"; openApp("photos"); }
      else if (lower === "reel") { output.textContent += "Opening Live Reel…\n"; openApp("reel"); }
      else if (lower === "spotlight") { output.textContent += "Opening Spotlight…\n"; openSpotlight(); }
      else if (lower === "social") { output.textContent += "Opening Instagram…\n"; openApp("instagram"); }
      else if (lower === "spotify") { output.textContent += "Opening Spotify…\n"; openApp("spotify"); }
      else if (lower === "clear") output.textContent = "";
      else if (lower === "reset") { output.textContent += "Use the Rizvisions menu to confirm a full reset.\n"; }
      else if (lower === "sudo") output.textContent += "Riz is not in the sudoers file. This incident will be reported.\n";
      else output.textContent += `zsh: command not found: ${command}\n`;
      output.scrollTop = output.scrollHeight;
    });
  }

  function applyDisplayState() {
    const brightness = Math.min(100, Math.max(45, Number(state.brightness || 100)));
    const dimOpacity = ((100 - brightness) / 100) * 0.62;
    displayDimmer.style.opacity = String(dimOpacity);
    brightnessSlider.value = String(brightness);
    volumeSlider.value = String(Number(state.volume ?? 54));
    soundStatus.style.opacity = state.sound ? "1" : ".42";
    soundStatus.setAttribute("aria-label", state.sound ? "Sound on" : "Sound off");
    ccSound.classList.toggle("active", state.sound);
    document.getElementById("ccSoundLabel").textContent = state.sound ? `${state.volume || 54}%` : "Off";
    ccFocus.classList.toggle("active", Boolean(state.focus));
    document.getElementById("ccFocusLabel").textContent = state.focus ? "On" : "Off";
    os.classList.toggle("focus-mode", Boolean(state.focus));
  }

  function updateCurrentWidget(animate = false) {
    const normalizedIndex = (Number(state.widgetIndex || 0) % currentCards.length + currentCards.length) % currentCards.length;
    state.widgetIndex = normalizedIndex;
    const card = currentCards[normalizedIndex];
    if (!card) return;
    currentWidget.classList.toggle("changing", animate);
    document.getElementById("widgetEyebrow").textContent = card.eyebrow;
    document.getElementById("widgetTitle").textContent = card.title;
    document.getElementById("widgetSubtitle").textContent = card.subtitle;
    document.getElementById("ncCurrentTitle").textContent = card.title;
    document.getElementById("ncCurrentSubtitle").textContent = card.subtitle;
    const progress = document.getElementById("widgetProgress");
    progress.innerHTML = currentCards.map((_, index) => `<i class="${index === normalizedIndex ? "active" : ""}"></i>`).join("");
    if (animate) setTimeout(() => currentWidget.classList.remove("changing"), 240);
  }

  function showCurrentCard() {
    const card = currentCards[Number(state.widgetIndex || 0) % currentCards.length];
    if (!card) return;
    if (card.kind === "project") openProject(card.target);
    else if (card.kind === "app") openApp(card.target);
    else if (card.kind === "external") window.open(card.target, "_blank", "noopener");
    else if (card.kind === "wallpaper") { setWallpaper(card.target); showToast(`${card.title} wallpaper`); }
  }

  function cycleWallpaper() {
    const order = ["grid", "dark", "maroon", "forest"];
    setWallpaper(order[(order.indexOf(state.wallpaper) + 1) % order.length]);
    showToast(`${state.wallpaper[0].toUpperCase()}${state.wallpaper.slice(1)} wallpaper`);
  }

  function sortIcons() {
    const cols = [36.1, 44.4, 52.6, 60.8];
    const rows = [24.8, 40.9, 57.1];
    iconNodes.forEach((node, index) => { state.icons[node.dataset.id] = { x: cols[index % cols.length], y: rows[Math.floor(index / cols.length)] || 57.1 }; });
    applyIconLayout(); saveState(); showToast("Icons sorted");
  }

  function getQuickLookPhotos() {
    const seen = new Set();
    const list = [];
    (CONTENT.desktopPhotos || []).forEach((photo) => { if (!seen.has(photo.src)) { seen.add(photo.src); list.push({ ...photo }); } });
    (CONTENT.photoLibrary || []).forEach((photo, index) => { if (!seen.has(photo.src)) { seen.add(photo.src); list.push({ ...photo, id:`library-${index}`, filename:(photo.src.split("/").pop() || `photo-${index+1}.jpg`) }); } });
    return list;
  }

  function openQuickLook(photoId) {
    const photos = getQuickLookPhotos();
    const index = Math.max(0, photos.findIndex((photo) => photo.id === photoId));
    quickLookIndex = index;
    renderQuickLook();
    quickLookBackdrop.classList.add("open");
    quickLookBackdrop.setAttribute("aria-hidden", "false");
    playSound("open");
  }

  function openQuickLookByLibraryIndex(index) {
    const target = (CONTENT.photoLibrary || [])[index];
    if (!target) return;
    const photos = getQuickLookPhotos();
    quickLookIndex = Math.max(0, photos.findIndex((photo) => photo.src === target.src));
    renderQuickLook();
    quickLookBackdrop.classList.add("open");
    quickLookBackdrop.setAttribute("aria-hidden", "false");
  }

  function renderQuickLook() {
    const photos = getQuickLookPhotos();
    if (!photos.length) return;
    quickLookIndex = (quickLookIndex + photos.length) % photos.length;
    const photo = photos[quickLookIndex];
    quickLookImage.src = photo.src;
    quickLookImage.alt = photo.alt || "Photography by Riz";
    quickLookTitle.textContent = photo.filename || photo.src.split("/").pop() || "photo.jpg";
    quickLookMeta.textContent = `${quickLookIndex + 1} of ${photos.length} · ${photo.alt || "Rizvisions Photos"}`;
  }

  function stepQuickLook(direction) { quickLookIndex += direction; renderQuickLook(); }
  function closeQuickLook() { quickLookBackdrop.classList.remove("open"); quickLookBackdrop.setAttribute("aria-hidden", "true"); }

  function bringPhotoToFront(photoId) {
    const file = desktopPhotosRoot.querySelector(`[data-photo-id="${CSS.escape(photoId || "")}"]`);
    if (!file) return;
    photoZCounter += 1; file.style.zIndex = String(photoZCounter);
    const current = state.photos[photoId] || defaultPhotos[photoId]; state.photos[photoId] = { ...current, z: photoZCounter }; saveState();
  }

  function resetPhotoPosition(photoId) {
    if (!photoId || !defaultPhotos[photoId]) return;
    state.photos[photoId] = clone(defaultPhotos[photoId]); applyPhotoLayout(); saveState(); showToast("Photo put back");
  }

  function renderMinimizedDock() {
    minimizedDock.innerHTML = "";
    [...windowsRoot.children].filter((win) => win.hidden).forEach((win) => {
      const id = win.dataset.appWindow;
      const button = document.createElement("button");
      button.type = "button"; button.className = "minimized-window"; button.dataset.restoreWindow = id;
      button.innerHTML = `<span class="minimized-preview"><img src="${appIconMap[id] || appIconMap.work}" alt=""></span><small>${escapeHtml(win.querySelector(".window-title")?.textContent || "Window")}</small>`;
      button.addEventListener("click", () => { win.hidden = false; button.remove(); focusWindow(win); playSound("open"); updateDockRunning(); });
      minimizedDock.appendChild(button);
    });
  }

  function removeMinimizedWindow(appId) { minimizedDock.querySelector(`[data-restore-window="${CSS.escape(appId)}"]`)?.remove(); }

  function openSpotlight() {
    closeMenus();
    spotlightBackdrop.classList.add("open");
    spotlightBackdrop.setAttribute("aria-hidden", "false");
    spotlightInput.value = "";
    renderSpotlightResults("");
    requestAnimationFrame(() => spotlightInput.focus());
  }

  function closeSpotlight() { spotlightBackdrop.classList.remove("open"); spotlightBackdrop.setAttribute("aria-hidden", "true"); spotlightInput.blur(); }

  function renderSpotlightResults(query) {
    const q = query.trim().toLowerCase();
    spotlightMatches = spotlightItems.filter((item) => !q || `${item.title} ${item.subtitle} ${item.keywords}`.toLowerCase().includes(q)).slice(0, 8);
    spotlightIndex = Math.min(spotlightIndex, Math.max(0, spotlightMatches.length - 1));
    spotlightResults.innerHTML = spotlightMatches.length ? spotlightMatches.map((item,index)=>`<button type="button" class="spotlight-result ${index===spotlightIndex?"active":""}" data-spotlight-index="${index}"><img src="${item.icon}" alt=""><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.subtitle)}</small></span><em>↵</em></button>`).join("") : `<div class="spotlight-empty">No results for “${escapeHtml(query)}”</div>`;
    spotlightResults.querySelectorAll("[data-spotlight-index]").forEach((button) => button.addEventListener("click", () => runSpotlightItem(Number(button.dataset.spotlightIndex))));
  }

  function handleSpotlightKeys(event) {
    if (event.key === "Escape") { event.preventDefault(); closeSpotlight(); return; }
    if (event.key === "ArrowDown") { event.preventDefault(); spotlightIndex = Math.min(spotlightMatches.length - 1, spotlightIndex + 1); renderSpotlightResults(spotlightInput.value); }
    if (event.key === "ArrowUp") { event.preventDefault(); spotlightIndex = Math.max(0, spotlightIndex - 1); renderSpotlightResults(spotlightInput.value); }
    if (event.key === "Enter") { event.preventDefault(); runSpotlightItem(spotlightIndex); }
  }

  function runSpotlightItem(index) { const item = spotlightMatches[index]; if (!item) return; closeSpotlight(); item.run(); }

  function renderMiniCalendar(date) {
    const root = document.getElementById("ncMiniGrid");
    const year = date.getFullYear(); const month = date.getMonth();
    const first = new Date(year, month, 1); const days = new Date(year, month + 1, 0).getDate();
    const labels = ["S","M","T","W","T","F","S"].map((label)=>`<b>${label}</b>`);
    const blanks = Array(first.getDay()).fill("<span></span>");
    const cells = Array.from({length:days},(_,index)=>`<span class="${index+1===date.getDate()?"today":""}">${index+1}</span>`);
    root.innerHTML = [...labels,...blanks,...cells].join("");
  }

  function weatherLabel(code) {
    if ([0].includes(code)) return { label:"Clear", icon:"☀︎" };
    if ([1,2].includes(code)) return { label:"Partly cloudy", icon:"☀︎" };
    if ([3].includes(code)) return { label:"Cloudy", icon:"☁︎" };
    if ([45,48].includes(code)) return { label:"Foggy", icon:"≋" };
    if ([51,53,55,61,63,65,80,81,82].includes(code)) return { label:"Rain", icon:"☂︎" };
    if ([71,73,75,77,85,86].includes(code)) return { label:"Snow", icon:"❄︎" };
    if ([95,96,99].includes(code)) return { label:"Storms", icon:"ϟ" };
    return { label:"Chicago weather", icon:"☁︎" };
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;",'"':"&quot;"}[char]));
  }

  function updateClockAndCalendar() {
    const now = new Date();
    const chicago = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
    }).format(now).replace(",", "");
    document.getElementById("clock").textContent = chicago;
    const chicagoDate = new Date(new Intl.DateTimeFormat("en-US", { timeZone:"America/Chicago", year:"numeric", month:"numeric", day:"numeric" }).format(now));
    const parts = new Intl.DateTimeFormat("en-US", { timeZone:"America/Chicago", weekday:"long", day:"numeric", month:"long", year:"numeric" }).formatToParts(now);
    const weekday = parts.find(p=>p.type==="weekday")?.value || "Wednesday";
    const day = parts.find(p=>p.type==="day")?.value || "5";
    const month = parts.find(p=>p.type==="month")?.value || "August";
    const year = parts.find(p=>p.type==="year")?.value || "2026";
    document.querySelectorAll(".calendar-weekday").forEach(n => n.textContent = weekday.slice(0,3).toUpperCase());
    document.querySelectorAll(".calendar-day").forEach(n => n.textContent = day);
    document.getElementById("ncWeekday").textContent = weekday;
    document.getElementById("ncDay").textContent = day;
    document.getElementById("ncMonth").textContent = `${month} ${year}`;
    renderMiniCalendar(chicagoDate);
  }

  async function updateWeather() {
    const tempNode = document.getElementById("weatherTemp");
    try {
      const url = "https://api.open-meteo.com/v1/forecast?latitude=41.8781&longitude=-87.6298&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FChicago&forecast_days=1";
      const response = await fetch(url, { cache:"no-store" });
      if (!response.ok) throw new Error("weather unavailable");
      const data = await response.json();
      const current = data.current || {};
      const temp = Math.round(current.temperature_2m);
      tempNode.textContent = `${temp}°F`;
      document.getElementById("ncWeatherTemp").textContent = `${temp}°`;
      document.getElementById("ncFeels").textContent = `${Math.round(current.apparent_temperature)}°`;
      document.getElementById("ncHigh").textContent = `${Math.round(data.daily.temperature_2m_max[0])}°`;
      document.getElementById("ncLow").textContent = `${Math.round(data.daily.temperature_2m_min[0])}°`;
      const weather = weatherLabel(current.weather_code);
      document.getElementById("ncWeatherSummary").textContent = `${weather.label} · Humidity ${current.relative_humidity_2m}% · Wind ${Math.round(current.wind_speed_10m)} mph`;
      document.getElementById("ncWeatherIcon").textContent = weather.icon;
    } catch {
      tempNode.textContent = "Chicago";
      document.getElementById("ncWeatherSummary").textContent = "Chicago weather is temporarily unavailable.";
    }
  }


  /* V8: Mac-like selection, window resizing, and a customizable Dock. */
  function clearDesktopSelection() {
    iconNodes.forEach((node) => node.classList.remove("selected"));
    desktopPhotosRoot?.querySelectorAll(".photo-file").forEach((node) => node.classList.remove("selected"));
    selectedPhotoId = null;
  }

  function selectedDesktopObjects() {
    return [...iconNodes, ...(desktopPhotosRoot ? [...desktopPhotosRoot.querySelectorAll(".photo-file")] : [])]
      .filter((node) => node.classList.contains("selected"));
  }

  function selectDesktopItem(item, additive = false) {
    if (!additive) clearDesktopSelection();
    item.classList.toggle("selected", additive ? !item.classList.contains("selected") : true);
    playSound("select");
  }

  function selectDesktopPhoto(file, additive = false) {
    if (!additive) clearDesktopSelection();
    file.classList.toggle("selected", additive ? !file.classList.contains("selected") : true);
    selectedPhotoId = file.classList.contains("selected") ? file.dataset.photoId : null;
    playSound("select");
  }

  function objectCenter(node) {
    const dr = desktop.getBoundingClientRect();
    const r = node.getBoundingClientRect();
    return { x: r.left - dr.left + r.width / 2, y: r.top - dr.top + r.height / 2, width: r.width, height: r.height };
  }

  function persistMovedObject(node) {
    const x = (parseFloat(node.style.left) / desktop.clientWidth) * 100;
    const y = (parseFloat(node.style.top) / desktop.clientHeight) * 100;
    if (node.classList.contains("desktop-item")) {
      state.icons[node.dataset.id] = { x: +x.toFixed(3), y: +y.toFixed(3) };
      node.style.setProperty("--x", `${x}%`); node.style.setProperty("--y", `${y}%`);
      node.style.left = "var(--x)"; node.style.top = "var(--y)";
    } else if (node.classList.contains("photo-file")) {
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
    let group = selectedDesktopObjects();
    if (!group.length) group = [target];
    const start = new Map(group.map((node) => [node, objectCenter(node)]));
    const startX = event.clientX, startY = event.clientY, pointerId = event.pointerId;
    let moved = false, latestX = startX, latestY = startY, frame = 0;

    const bounds = { minX: -Infinity, maxX: Infinity, minY: -Infinity, maxY: Infinity };
    group.forEach((node) => {
      const st = start.get(node);
      const pad = node.classList.contains("photo-file") ? 8 : 4;
      const bottomPad = node.classList.contains("photo-file") ? 106 : 112;
      bounds.minX = Math.max(bounds.minX, pad + st.width/2 - st.x);
      bounds.maxX = Math.min(bounds.maxX, desktop.clientWidth - pad - st.width/2 - st.x);
      bounds.minY = Math.max(bounds.minY, pad + st.height/2 - st.y);
      bounds.maxY = Math.min(bounds.maxY, desktop.clientHeight - bottomPad - st.height/2 - st.y);
    });

    group.filter((node) => node.classList.contains("photo-file")).forEach((node) => {
      photoZCounter += 1; node.style.zIndex = String(photoZCounter);
    });
    document.body.classList.add("desktop-dragging");

    const paint = () => {
      frame = 0;
      let dx = latestX - startX, dy = latestY - startY;
      if (!moved && Math.hypot(dx,dy) < 3) return;
      moved = true;
      dx = Math.max(bounds.minX, Math.min(bounds.maxX, dx));
      dy = Math.max(bounds.minY, Math.min(bounds.maxY, dy));
      group.forEach((node) => {
        node.classList.add("dragging");
        const st = start.get(node);
        node.style.left = `${st.x + dx}px`;
        node.style.top = `${st.y + dy}px`;
      });
    };
    const onMove = (e) => { if (e.pointerId !== pointerId) return; e.preventDefault(); latestX=e.clientX; latestY=e.clientY; if(!frame) frame=requestAnimationFrame(paint); };
    const finish = (e) => {
      if (e && e.pointerId !== pointerId) return;
      document.removeEventListener("pointermove",onMove,true); document.removeEventListener("pointerup",finish,true); document.removeEventListener("pointercancel",finish,true);
      if(frame){cancelAnimationFrame(frame);paint();}
      document.body.classList.remove("desktop-dragging");
      group.forEach((node) => {
        node.classList.remove("dragging");
        if(moved){ persistMovedObject(node); node._suppressClick=true; setTimeout(()=>{node._suppressClick=false;},0); }
      });
      if(moved) saveState();
    };
    document.addEventListener("pointermove",onMove,true); document.addEventListener("pointerup",finish,true); document.addEventListener("pointercancel",finish,true);
  }

  function beginIconDrag(event, item) { beginDesktopObjectDrag(event, item); }
  function beginPhotoDrag(event, file) { beginDesktopObjectDrag(event, file); }

  function rectsIntersect(a,b) { return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top; }
  function beginMarqueeSelection(event) {
    if (event.button !== 0 || event.target !== desktop && !event.target.classList.contains("wallpaper")) return;
    if (event.target.closest(".mac-window,.dock,.now-widget,.photo-file,.desktop-item,.menu-bar")) return;
    event.preventDefault(); closeMenus();
    const dr=desktop.getBoundingClientRect(); const sx=event.clientX-dr.left, sy=event.clientY-dr.top; const additive=event.shiftKey||event.metaKey||event.ctrlKey;
    const preserved = new Set(additive ? selectedDesktopObjects() : []);
    if(!additive) clearDesktopSelection();
    let moved=false;
    selectionRectangle.style.left=`${sx}px`; selectionRectangle.style.top=`${sy}px`; selectionRectangle.style.width="0px"; selectionRectangle.style.height="0px";
    selectionRectangle.classList.add("active");
    const onMove=(e)=>{
      const x=e.clientX-dr.left,y=e.clientY-dr.top; if(!moved&&Math.hypot(x-sx,y-sy)<2)return; moved=true;
      const left=Math.max(0,Math.min(sx,x)), top=Math.max(0,Math.min(sy,y)); const right=Math.min(desktop.clientWidth,Math.max(sx,x)), bottom=Math.min(desktop.clientHeight,Math.max(sy,y));
      Object.assign(selectionRectangle.style,{left:`${left}px`,top:`${top}px`,width:`${right-left}px`,height:`${bottom-top}px`});
      const selection={left:dr.left+left,top:dr.top+top,right:dr.left+right,bottom:dr.top+bottom};
      [...iconNodes,...(desktopPhotosRoot?[...desktopPhotosRoot.querySelectorAll(".photo-file")]:[])].forEach((node)=>{
        node.classList.toggle("selected",preserved.has(node)||rectsIntersect(selection,node.getBoundingClientRect()));
      });
      const selectedPhoto=desktopPhotosRoot?.querySelector(".photo-file.selected"); selectedPhotoId=selectedPhoto?.dataset.photoId||null;
    };
    const finish=()=>{window.removeEventListener("pointermove",onMove);window.removeEventListener("pointerup",finish);selectionRectangle.classList.remove("active"); if(moved){desktop._suppressClear=true;setTimeout(()=>desktop._suppressClear=false,0);}};
    window.addEventListener("pointermove",onMove); window.addEventListener("pointerup",finish,{once:true});
  }

  function clampWindowRect(rect) {
    const maxWidth = desktop.clientWidth;
    const maxHeight = desktop.clientHeight - 91;
    const width = Math.min(Math.max(410, rect.width), maxWidth);
    const height = Math.min(Math.max(280, rect.height), maxHeight);
    return { width, height, left: Math.min(Math.max(-width + 110, rect.left), maxWidth - 110), top: Math.min(Math.max(0, rect.top), maxHeight - 52) };
  }

  function beginWindowResize(event, win, direction) {
    if(event.button!==0||win.classList.contains("maximized"))return;
    event.preventDefault();event.stopPropagation();focusWindow(win);
    const start={x:event.clientX,y:event.clientY,left:win.offsetLeft,top:win.offsetTop,width:win.offsetWidth,height:win.offsetHeight};
    const minW=410,minH=280,maxW=desktop.clientWidth,maxH=desktop.clientHeight-91;
    document.body.classList.add("window-resizing");
    const move=(e)=>{
      const dx=e.clientX-start.x,dy=e.clientY-start.y; let {left,top,width,height}=start;
      if(direction.includes("e"))width=Math.min(maxW-left,Math.max(minW,start.width+dx));
      if(direction.includes("s"))height=Math.min(maxH-top,Math.max(minH,start.height+dy));
      if(direction.includes("w")){const nl=Math.max(0,Math.min(start.left+start.width-minW,start.left+dx));width=start.width+(start.left-nl);left=nl;}
      if(direction.includes("n")){const nt=Math.max(0,Math.min(start.top+start.height-minH,start.top+dy));height=start.height+(start.top-nt);top=nt;}
      Object.assign(win.style,{left:`${left}px`,top:`${top}px`,width:`${width}px`,height:`${height}px`});
    };
    const up=()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",up);document.body.classList.remove("window-resizing");saveWindowRect(win);};
    window.addEventListener("pointermove",move);window.addEventListener("pointerup",up,{once:true});
  }

  function wireWindow(win) {
    win.addEventListener("pointerdown",()=>focusWindow(win));
    win.querySelectorAll("[data-window-action]").forEach((button)=>button.addEventListener("click",(event)=>{event.stopPropagation();const action=button.dataset.windowAction;if(action==="close")closeWindow(win);if(action==="minimize")minimizeWindow(win);if(action==="zoom")zoomWindow(win);}));
    win.querySelector(".drag-handle").addEventListener("pointerdown",(event)=>beginWindowDrag(event,win));
    win.querySelectorAll("[data-resize]").forEach((handle)=>handle.addEventListener("pointerdown",(event)=>beginWindowResize(event,win,handle.dataset.resize)));
    const observer=new ResizeObserver(()=>{clearTimeout(win._saveTimer);win._saveTimer=setTimeout(()=>saveWindowRect(win),260);});observer.observe(win);
  }

  function updateDateIcons() {
    const now = new Date();
    const weekday = new Intl.DateTimeFormat("en-US", { timeZone:"America/Chicago", weekday:"short" }).format(now).toUpperCase();
    const day = new Intl.DateTimeFormat("en-US", { timeZone:"America/Chicago", day:"numeric" }).format(now);
    document.querySelectorAll(".calendar-weekday").forEach((node) => { node.textContent = weekday; });
    document.querySelectorAll(".calendar-day").forEach((node) => { node.textContent = day; });
  }

  function dockItemMarkup(key, item) {
    const runningDot = item.tracksRunning || item.alwaysRunning ? '<span class="running-dot"></span>' : '';
    const badge = item.badge ? `<span class="notification-badge dock-badge">${item.badge}</span>` : '';
    const content = item.kind === "calendar" ? '<span class="calendar-icon"><span class="calendar-weekday">WED</span><span class="calendar-day">5</span></span>' : `<img src="${item.icon}" alt="${escapeHtml(item.label)}" draggable="false" />`;
    return `<button class="dock-item ${item.kind==="trash"?"trash-dock":""}" data-dock-key="${key}" data-app="${item.app}" data-tooltip="${escapeHtml(item.label)}">${content}${badge}${runningDot}</button>`;
  }

  function renderDock() {
    if(!dock)return;
    const keys=(state.dock||DEFAULT_DOCK).filter((key)=>DOCK_CATALOG[key]);
    state.dock=keys;
    const normal=keys.filter((key)=>key!=="trash"), hasTrash=keys.includes("trash");
    dock.innerHTML=normal.map((key)=>dockItemMarkup(key,DOCK_CATALOG[key])).join("") + (hasTrash?'<span class="dock-separator" aria-hidden="true"></span>'+dockItemMarkup("trash",DOCK_CATALOG.trash):"");
    dock.classList.toggle("no-magnify",state.dockMagnification===false);
    renderMinimizedDock();
    dock.querySelectorAll("[data-dock-key]").forEach(wireDockReorder);
    updateDockRunning();
    updateDateIcons();
  }

  function wireDockReorder(item) {
    item.addEventListener("pointerdown",(event)=>{
      if(event.button!==0)return; const startX=event.clientX; let moved=false;
      const move=(e)=>{if(!moved&&Math.abs(e.clientX-startX)<7)return;moved=true;item.classList.add("dock-dragging");const over=document.elementFromPoint(e.clientX,e.clientY)?.closest(".dock-item[data-dock-key]");if(!over||over===item||!dock.contains(over))return;const r=over.getBoundingClientRect();dock.insertBefore(item,e.clientX<r.left+r.width/2?over:over.nextSibling);};
      const up=()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",up);item.classList.remove("dock-dragging");if(moved){state.dock=[...dock.querySelectorAll(".dock-item[data-dock-key]")].map((n)=>n.dataset.dockKey).filter((key)=>DOCK_CATALOG[key]);saveState();item._suppressClick=true;setTimeout(()=>item._suppressClick=false,0);renderDock();}};
      window.addEventListener("pointermove",move);window.addEventListener("pointerup",up,{once:true});
    });
  }

  function isAppRunning(appId) { return [...windowsRoot.children].some((win)=>win.dataset.appWindow===appId||(appId==="work"&&win.dataset.appWindow.startsWith("project-"))); }
  function updateDockRunning() {
    dock?.querySelectorAll(".dock-item[data-dock-key]").forEach((node)=>{const item=DOCK_CATALOG[node.dataset.dockKey];node.classList.toggle("running",!!item&&(item.alwaysRunning||item.tracksRunning&&isAppRunning(item.app)));});
  }
  function renderMinimizedDock() {
    if(!dock)return;
    dock.querySelectorAll(".temporary-window").forEach((node)=>node.remove());
    const pinnedApps=new Set((state.dock||[]).map((key)=>DOCK_CATALOG[key]?.app));
    const hidden=[...windowsRoot.children].filter((win)=>win.hidden&&!pinnedApps.has(win.dataset.appWindow));
    if(!hidden.length)return;
    let separator=dock.querySelector(".dock-separator");
    hidden.forEach((win)=>{const id=win.dataset.appWindow;const button=document.createElement("button");button.type="button";button.className="dock-item temporary-window";button.dataset.restoreWindow=id;button.dataset.tooltip=win.querySelector(".window-title")?.textContent||"Window";button.innerHTML=`<span class="minimized-preview"><img src="${appIconMap[id]||appIconMap.work}" alt=""></span>`;button.addEventListener("click",()=>{win.hidden=false;focusWindow(win);playSound("open");renderDock();});dock.insertBefore(button,separator||null);});
  }
  function removeMinimizedWindow(){ renderDock(); }
  function bounceDock(appId){const item=dock?.querySelector(`.dock-item[data-app="${CSS.escape(appId)}"]`);if(!item)return;item.classList.remove("bounce");void item.offsetWidth;item.classList.add("bounce");setTimeout(()=>item.classList.remove("bounce"),700);}

  function openApp(appId) {
    closeMenus(); let win=windowsRoot.querySelector(`[data-app-window="${CSS.escape(appId)}"]`); if(!win)win=createWindow(appId); if(!win)return;
    win.hidden=false;win.classList.remove("minimizing");focusWindow(win);bounceDock(appId);playSound("open");renderDock();
  }
  function closeWindow(win=activeWindow){if(!win)return;saveWindowRect(win);playSound("close");win.remove();activeWindow=[...windowsRoot.children].filter((node)=>!node.hidden).sort((a,b)=>(+a.style.zIndex)-(+b.style.zIndex)).pop()||null;if(activeWindow)focusWindow(activeWindow);else activeAppName.textContent="Rizvisions";renderDock();}
  function minimizeWindow(win=activeWindow){if(!win)return;saveWindowRect(win);win.classList.add("minimizing");setTimeout(()=>{win.hidden=true;win.classList.remove("minimizing");activeWindow=[...windowsRoot.children].filter((node)=>!node.hidden).sort((a,b)=>(+a.style.zIndex)-(+b.style.zIndex)).pop()||null;if(activeWindow)focusWindow(activeWindow);else activeAppName.textContent="Rizvisions";renderDock();},230);}

  function openDockCustomizer(){closeMenus();renderDockCustomizer();dockCustomizerBackdrop.classList.add("open");dockCustomizerBackdrop.setAttribute("aria-hidden","false");}
  function closeDockCustomizer(){dockCustomizerBackdrop.classList.remove("open");dockCustomizerBackdrop.setAttribute("aria-hidden","true");}
  function renderDockCustomizer(){
    dockCustomizerList.innerHTML=Object.entries(DOCK_CATALOG).map(([key,item])=>{const index=state.dock.indexOf(key),enabled=index>=0;const preview=item.kind==="calendar"?`<span class="calendar-icon customizer-calendar"><span class="calendar-weekday">WED</span><span class="calendar-day">5</span></span>`:`<img src="${item.icon||appIconMap.work}" alt="">`;return `<div class="dock-customizer-row" data-customize-key="${key}">${preview}<label><input type="checkbox" ${enabled?"checked":""}> <span>${escapeHtml(item.label)}</span></label><div><button type="button" data-dock-move="up" ${!enabled||index<=0?"disabled":""}>↑</button><button type="button" data-dock-move="down" ${!enabled||index===state.dock.length-1?"disabled":""}>↓</button></div></div>`;}).join("");
    dockCustomizerList.querySelectorAll("[data-customize-key]").forEach((row)=>{const key=row.dataset.customizeKey;row.querySelector("input").addEventListener("change",(e)=>{if(e.target.checked&&!state.dock.includes(key))state.dock.push(key);if(!e.target.checked)state.dock=state.dock.filter((k)=>k!==key);saveState();renderDock();renderDockCustomizer();});row.querySelectorAll("[data-dock-move]").forEach((button)=>button.addEventListener("click",()=>{const i=state.dock.indexOf(key),d=button.dataset.dockMove==="up"?-1:1,j=i+d;if(i<0||j<0||j>=state.dock.length)return;[state.dock[i],state.dock[j]]=[state.dock[j],state.dock[i]];saveState();renderDock();renderDockCustomizer();}));});
  }
  function resetDock(){state.dock=[...DEFAULT_DOCK];state.dockMagnification=true;saveState();renderDock();if(dockCustomizerBackdrop.classList.contains("open"))renderDockCustomizer();showToast("Dock restored");}

  function handleAction(action) {
    if (action === "open-about") openApp("about");
    if (action === "open-settings") openApp("about");
    if (action === "reset-layout") resetLayout();
    if (action === "reset-os") fullReset();
    if (action === "close-active") closeWindow();
    if (action === "minimize-active") minimizeWindow();
    if (action === "zoom-active") zoomWindow();
    if (action === "bring-all-front") [...windowsRoot.children].filter(n=>!n.hidden).forEach(focusWindow);
    if (action === "show-shortcuts") window.alert("⌘Space Spotlight\nSpace Quick Look selected photo\n⌘N New Finder Window\n⌘W Close Window\n⌘M Minimize\nDouble-click desktop icons to open them.");
    if (action === "open-spotlight") openSpotlight();
    if (action === "cycle-wallpaper") cycleWallpaper();
    if (action === "sort-icons") sortIcons();
    if (action === "desktop-info") showToast("Rizvisions Desktop · Version 8");
    if (action === "quick-look-photo") openQuickLook(contextPhotoId || selectedPhotoId);
    if (action === "bring-photo-front") bringPhotoToFront(contextPhotoId);
    if (action === "reset-photo-position") resetPhotoPosition(contextPhotoId);
    if (action === "show-current-card") showCurrentCard();
    if (action === "customize-dock") openDockCustomizer();
    if (action === "dock-reset") resetDock();
    if (action === "dock-magnification") { state.dockMagnification = !state.dockMagnification; saveState(); renderDock(); showToast(state.dockMagnification ? "Dock magnification on" : "Dock magnification off"); }
  }

  document.querySelectorAll(".menu-trigger").forEach((trigger) => trigger.addEventListener("click", (event) => {
    event.stopPropagation(); toggleMenu(trigger);
  }));

  controlCenterButton.addEventListener("click", (event) => {
    event.stopPropagation();
    const wasOpen = controlCenter.classList.contains("open");
    closeMenus();
    controlCenter.classList.toggle("open", !wasOpen);
    controlCenter.setAttribute("aria-hidden", String(wasOpen));
  });

  spotlightButton.addEventListener("click", (event) => { event.stopPropagation(); openSpotlight(); });
  clockButton.addEventListener("click", (event) => {
    event.stopPropagation();
    const wasOpen = notificationCenter.classList.contains("open");
    closeMenus();
    notificationCenter.classList.toggle("open", !wasOpen);
    notificationCenter.setAttribute("aria-hidden", String(wasOpen));
  });

  soundStatus.addEventListener("click", () => {
    state.sound = !state.sound; saveState();
    soundStatus.style.opacity = state.sound ? "1" : ".42";
    soundStatus.setAttribute("aria-label", state.sound ? "Sound on" : "Sound off");
    applyDisplayState();
    showToast(state.sound ? "Sound on" : "Sound off");
  });

  document.addEventListener("click", (event) => {
    const appTarget = event.target.closest("[data-app]");
    const actionTarget = event.target.closest("[data-action]");
    const wallpaperTarget = event.target.closest("[data-wallpaper]");
    const projectTarget = event.target.closest("[data-project]");
    const externalTarget = event.target.closest("[data-external]");

    if (event.target.closest(".menu-popover, .context-menu, .control-center-panel, .notification-center, .spotlight-panel, .quicklook-panel")) event.stopPropagation();
    if (projectTarget) { event.preventDefault(); openProject(projectTarget.dataset.project); return; }
    if (externalTarget) { event.preventDefault(); window.open(externalTarget.dataset.external, "_blank", "noopener"); return; }
    if (appTarget && !appTarget.classList.contains("desktop-item")) {
      if (appTarget._suppressClick) { event.preventDefault(); return; }
      event.preventDefault(); openApp(appTarget.dataset.app); return;
    }
    if (actionTarget) { event.preventDefault(); handleAction(actionTarget.dataset.action); closeMenus(); return; }
    if (wallpaperTarget && wallpaperTarget.dataset.wallpaper) { event.preventDefault(); setWallpaper(wallpaperTarget.dataset.wallpaper); closeMenus(); return; }
    if (!event.target.closest(".menu-bar, .menu-popover, .context-menu, .control-center-panel, .notification-center, .spotlight-panel, .quicklook-panel")) closeMenus();
    if ((event.target === desktop || event.target.classList.contains("wallpaper")) && !desktop._suppressClear) clearDesktopSelection();
  });

  desktop.addEventListener("contextmenu", (event) => {
    if (event.target.closest(".mac-window, .dock, .desktop-item, .photo-file, .now-widget")) return;
    event.preventDefault(); closeMenus();
    contextMenu.style.left = `${Math.min(event.clientX, window.innerWidth - 250)}px`;
    contextMenu.style.top = `${Math.min(event.clientY, window.innerHeight - 230)}px`;
    contextMenu.classList.add("open");
  });

  iconNodes.forEach((item) => {
    item.addEventListener("pointerdown", (event) => beginIconDrag(event, item));
    item.addEventListener("click", (event) => { event.stopPropagation(); if (item._suppressClick) { event.preventDefault(); return; } selectDesktopItem(item, event.shiftKey || event.metaKey || event.ctrlKey); });
    item.addEventListener("dblclick", (event) => { event.preventDefault(); openApp(item.dataset.app); });
  });


  desktop.addEventListener("pointerdown", beginMarqueeSelection);
  dock?.addEventListener("contextmenu", (event) => { event.preventDefault(); event.stopPropagation(); closeMenus(); dockContextMenu.style.left=`${Math.min(event.clientX,window.innerWidth-240)}px`; dockContextMenu.style.top=`${Math.max(42,Math.min(event.clientY-150,window.innerHeight-180))}px`; dockContextMenu.classList.add("open"); });
  dockCustomizerDone?.addEventListener("click", closeDockCustomizer);
  dockCustomizerBackdrop?.addEventListener("click", (event) => { if(event.target===dockCustomizerBackdrop) closeDockCustomizer(); });

  document.getElementById("widgetNext")?.addEventListener("click", (event) => { event.stopPropagation(); state.widgetIndex = (Number(state.widgetIndex || 0) + 1) % currentCards.length; saveState(); updateCurrentWidget(true); });
  document.getElementById("widgetShow")?.addEventListener("click", (event) => { event.stopPropagation(); showCurrentCard(); });
  document.getElementById("quickLookClose")?.addEventListener("click", closeQuickLook);
  document.getElementById("quickLookPrev")?.addEventListener("click", () => stepQuickLook(-1));
  document.getElementById("quickLookNext")?.addEventListener("click", () => stepQuickLook(1));
  quickLookBackdrop?.addEventListener("click", (event) => { if (event.target === quickLookBackdrop) closeQuickLook(); });
  spotlightBackdrop?.addEventListener("click", (event) => { if (event.target === spotlightBackdrop) closeSpotlight(); });
  spotlightInput?.addEventListener("input", () => renderSpotlightResults(spotlightInput.value));
  spotlightInput?.addEventListener("keydown", handleSpotlightKeys);
  ccFocus?.addEventListener("click", () => { state.focus = !state.focus; saveState(); applyDisplayState(); showToast(state.focus ? "Focus on" : "Focus off"); });
  ccSound?.addEventListener("click", () => { state.sound = !state.sound; saveState(); applyDisplayState(); });
  brightnessSlider?.addEventListener("input", () => { state.brightness = Number(brightnessSlider.value); applyDisplayState(); saveState(); });
  volumeSlider?.addEventListener("input", () => { state.volume = Number(volumeSlider.value); if (state.volume === 0) state.sound = false; else state.sound = true; applyDisplayState(); saveState(); });

  currentWidget?.setAttribute("draggable", "false");
  currentWidget?.addEventListener("pointerdown", beginWidgetDrag);
  currentWidget?.addEventListener("mousedown", (event) => {
    if (!event.target.closest("button")) event.preventDefault();
  }, true);

  // The desktop is an interface, not a browser drag surface. Disable native
  // HTML dragging and selection so photos/widgets always follow our pointer logic.
  os.addEventListener("dragstart", (event) => event.preventDefault(), true);
  os.addEventListener("drop", (event) => event.preventDefault(), true);
  os.addEventListener("selectstart", (event) => {
    if (event.target.closest(".photo-file, .now-widget, .desktop-item")) event.preventDefault();
  }, true);

  document.addEventListener("keydown", (event) => {
    if (spotlightBackdrop.classList.contains("open")) return;
    if (event.key === "Escape") { closeQuickLook(); closeMenus(); return; }
    const typingTarget = event.target instanceof Element && event.target.matches("input,textarea,[contenteditable=true]");
    if (event.key === " " && selectedPhotoId && !typingTarget) { event.preventDefault(); openQuickLook(selectedPhotoId); return; }
    if (quickLookBackdrop.classList.contains("open") && event.key === "ArrowLeft") { event.preventDefault(); stepQuickLook(-1); return; }
    if (quickLookBackdrop.classList.contains("open") && event.key === "ArrowRight") { event.preventDefault(); stepQuickLook(1); return; }
    if (!(event.metaKey || event.ctrlKey)) return;
    if (event.code === "Space") { event.preventDefault(); openSpotlight(); return; }
    if (event.key.toLowerCase() === "n" && !event.shiftKey) { event.preventDefault(); openApp("work"); }
    if (event.key.toLowerCase() === "n" && event.shiftKey) { event.preventDefault(); openApp("notes"); }
    if (event.key.toLowerCase() === "w") { event.preventDefault(); closeWindow(); }
    if (event.key.toLowerCase() === "m") { event.preventDefault(); minimizeWindow(); }
  });

  window.addEventListener("resize", () => {
    [...windowsRoot.children].forEach((win) => {
      if (win.classList.contains("maximized")) return;
      const clamped = clampWindowRect({ left: win.offsetLeft, top: win.offsetTop, width: win.offsetWidth, height: win.offsetHeight });
      Object.assign(win.style, { left:`${clamped.left}px`, top:`${clamped.top}px`, width:`${clamped.width}px`, height:`${clamped.height}px` });
    });
  });

  setWallpaper(state.wallpaper, false);
  renderDesktopPhotos();
  applyIconLayout();
  applyWidgetLayout();
  applyDisplayState();
  updateCurrentWidget();
  renderDock();
  updateClockAndCalendar();
  setInterval(updateClockAndCalendar, 30_000);
  updateWeather();
  updateDockRunning();
})();
