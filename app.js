(() => {
  "use strict";

  const STORAGE_KEY = "rizvisions-os-v5";
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

  const CONTENT = window.RIZVISIONS_CONTENT || { desktopPhotos: [], photoLibrary: [] };
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

  const DEFAULT_STATE = {
    wallpaper: "grid",
    sound: true,
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
    resume: { name: "Preview", title: "Resume.pdf", size: [690, 650], render: renderResume }
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
      gain.gain.exponentialRampToValueAtTime(kind === "select" ? 0.018 : 0.028, audioContext.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.12);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(); oscillator.stop(audioContext.currentTime + 0.13);
    } catch { /* audio is optional */ }
  }

  function setWallpaper(name, persist = true) {
    if (!["grid", "chicago", "dark"].includes(name)) return;
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
      const file = document.createElement("button");
      file.type = "button";
      file.className = `photo-file${photo.monochrome ? " monochrome" : ""}`;
      file.dataset.photoId = photo.id;
      file.setAttribute("aria-label", `${photo.filename}. Double-click to open Photos.`);
      file.style.setProperty("--photo-x", `${saved.x}%`);
      file.style.setProperty("--photo-y", `${saved.y}%`);
      file.style.setProperty("--photo-rotation", `${saved.rotation || 0}deg`);
      file.style.setProperty("--photo-width", `${photo.width || 132}px`);
      file.style.zIndex = String(saved.z || index + 1);
      file.innerHTML = `<img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.alt || "")}" draggable="false"><span>${escapeHtml(photo.filename || "photo.jpg")}</span>`;
      file.addEventListener("dragstart", (event) => event.preventDefault());
      file.addEventListener("pointerdown", (event) => beginPhotoDrag(event, file));
      file.addEventListener("click", (event) => {
        event.stopPropagation();
        if (file._suppressClick) { event.preventDefault(); return; }
        selectDesktopPhoto(file);
      });
      file.addEventListener("dblclick", (event) => {
        if (file._suppressClick) { event.preventDefault(); return; }
        event.preventDefault();
        openApp("photos");
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
    const startX = event.clientX;
    const startY = event.clientY;
    const startLeft = fileRect.left - desktopRect.left + fileRect.width / 2;
    const startTop = fileRect.top - desktopRect.top + fileRect.height / 2;
    const pointerId = event.pointerId;
    let moved = false;

    photoZCounter += 1;
    file.style.zIndex = String(photoZCounter);
    selectDesktopPhoto(file);
    try { file.setPointerCapture(pointerId); } catch { /* pointer capture is progressive enhancement */ }

    const onMove = (moveEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      moveEvent.preventDefault();
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < 3) return;
      if (!moved) {
        moved = true;
        file.classList.add("dragging");
        document.body.classList.add("desktop-dragging");
      }
      const halfW = file.offsetWidth / 2;
      const halfH = file.offsetHeight / 2;
      const left = Math.min(Math.max(halfW + 8, startLeft + dx), desktop.clientWidth - halfW - 8);
      const top = Math.min(Math.max(halfH + 8, startTop + dy), desktop.clientHeight - halfH - 105);
      file.style.left = `${left}px`;
      file.style.top = `${top}px`;
    };

    const finish = (upEvent) => {
      if (upEvent && upEvent.pointerId !== pointerId) return;
      file.removeEventListener("pointermove", onMove);
      file.removeEventListener("pointerup", finish);
      file.removeEventListener("pointercancel", finish);
      try { file.releasePointerCapture(pointerId); } catch { /* no-op */ }
      document.body.classList.remove("desktop-dragging");

      const current = state.photos[file.dataset.photoId] || defaultPhotos[file.dataset.photoId] || {};
      if (moved) {
        const x = (parseFloat(file.style.left) / desktop.clientWidth) * 100;
        const y = (parseFloat(file.style.top) / desktop.clientHeight) * 100;
        state.photos[file.dataset.photoId] = { ...current, x: +x.toFixed(3), y: +y.toFixed(3), z: photoZCounter };
        file.style.setProperty("--photo-x", `${x}%`);
        file.style.setProperty("--photo-y", `${y}%`);
        file.style.left = "var(--photo-x)";
        file.style.top = "var(--photo-y)";
        file.classList.remove("dragging");
        file._suppressClick = true;
        setTimeout(() => { file._suppressClick = false; }, 0);
      } else {
        state.photos[file.dataset.photoId] = { ...current, z: photoZCounter };
      }
      saveState();
    };

    file.addEventListener("pointermove", onMove);
    file.addEventListener("pointerup", finish);
    file.addEventListener("pointercancel", finish);
  }

  function beginWidgetDrag(event) {
    if (!currentWidget || event.button !== 0 || event.target.closest("button")) return;
    event.preventDefault();
    event.stopPropagation();

    const desktopRect = desktop.getBoundingClientRect();
    const widgetRect = currentWidget.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startLeft = widgetRect.left - desktopRect.left + widgetRect.width / 2;
    const startTop = widgetRect.top - desktopRect.top;
    const pointerId = event.pointerId;
    let moved = false;

    currentWidget.style.zIndex = "60";
    try { currentWidget.setPointerCapture(pointerId); } catch { /* no-op */ }

    const onMove = (moveEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      moveEvent.preventDefault();
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < 3) return;
      if (!moved) {
        moved = true;
        currentWidget.classList.add("dragging");
        document.body.classList.add("desktop-dragging");
      }
      const halfW = widgetRect.width / 2;
      const left = Math.min(Math.max(halfW + 8, startLeft + dx), desktop.clientWidth - halfW - 8);
      const top = Math.min(Math.max(8, startTop + dy), desktop.clientHeight - widgetRect.height - 105);
      currentWidget.style.left = `${left}px`;
      currentWidget.style.top = `${top}px`;
    };

    const finish = (upEvent) => {
      if (upEvent && upEvent.pointerId !== pointerId) return;
      currentWidget.removeEventListener("pointermove", onMove);
      currentWidget.removeEventListener("pointerup", finish);
      currentWidget.removeEventListener("pointercancel", finish);
      try { currentWidget.releasePointerCapture(pointerId); } catch { /* no-op */ }
      document.body.classList.remove("desktop-dragging");
      currentWidget.classList.remove("dragging");

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

    currentWidget.addEventListener("pointermove", onMove);
    currentWidget.addEventListener("pointerup", finish);
    currentWidget.addEventListener("pointercancel", finish);
  }

  function selectDesktopPhoto(file) {
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
    saveState();
    applyIconLayout();
    applyPhotoLayout();
    applyWidgetLayout();
    [...windowsRoot.children].forEach((win) => win.remove());
    activeWindow = null;
    activeAppName.textContent = "Rizvisions";
    updateDockRunning();
    showToast("Desktop layout restored");
  }

  function fullReset() {
    const confirmed = window.confirm("Reset Rizvisions? This clears the wallpaper, desktop icon and photo positions, window positions, and saved Notes on this browser.");
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
    soundStatus.style.opacity = "1";
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
            <button class="file-item" data-app="resume"><img src="assets/icons/macos/document.png" alt=""><span class="file-name">Resume.pdf</span></button>
            <button class="file-item" data-app="notes"><img src="assets/icons/macos/notes.png" alt=""><span class="file-name">Random Notes</span></button>
          </div></div>
          <div class="finder-statusbar">8 items, 42.6 GB available</div>
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
            ${(CONTENT.photoLibrary || []).map((photo) => `<button class="${escapeHtml(photo.layout || "")}"><img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.alt || "")}"></button>`).join("")}
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

  function renderResume() {
    return `<div style="height:100%;background:#707070;padding:25px;overflow:auto"><article style="width:min(100%,560px);min-height:760px;margin:auto;background:white;box-shadow:0 8px 30px rgba(0,0,0,.35);padding:48px 54px;color:#1e1e1f;user-select:text"><h1 style="margin:0;font-size:29px;letter-spacing:-.04em">Riz Zaheer</h1><p style="margin:5px 0 28px;color:#666;font-size:12px">Chicago, IL · Creator, operator, GTM person</p><h2 style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid #bbb;padding-bottom:5px">Experience</h2><h3 style="font-size:15px;margin-bottom:3px">Parker AI</h3><p style="font-size:12px;color:#666;margin-top:0">Sales, customer success, GTM, product feedback, pricing, content and operations · 2026—present</p><h3 style="font-size:15px;margin-bottom:3px">Databricks</h3><p style="font-size:12px;color:#666;margin-top:0">Solutions Specialist · 2025</p><h3 style="font-size:15px;margin-bottom:3px">Rewards Network</h3><p style="font-size:12px;color:#666;margin-top:0">#1 SDR / Qualification Specialist · 2024—2025</p><h2 style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid #bbb;padding-bottom:5px;margin-top:30px">Things built</h2><p style="font-size:12px;line-height:1.6">Blue Specs · Rizvisions · Whop creator programs · WAP · short-form content · various internet experiments</p><p style="font-size:11px;color:#888;margin-top:45px">This is intentionally not the final downloadable résumé yet.</p></article></div>`;
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
      if (lower === "help") output.textContent += "about  work  photos  social  spotify  clear  reset\n";
      else if (lower === "about") { output.textContent += "Opening About Riz…\n"; openApp("about"); }
      else if (lower === "work") { output.textContent += "Opening Selected Work…\n"; openApp("work"); }
      else if (lower === "photos") { output.textContent += "Opening Photos…\n"; openApp("photos"); }
      else if (lower === "social") { output.textContent += "Opening Instagram…\n"; openApp("instagram"); }
      else if (lower === "spotify") { output.textContent += "Opening Spotify…\n"; openApp("spotify"); }
      else if (lower === "clear") output.textContent = "";
      else if (lower === "reset") { output.textContent += "Use the Rizvisions menu to confirm a full reset.\n"; }
      else if (lower === "sudo") output.textContent += "Riz is not in the sudoers file. This incident will be reported.\n";
      else output.textContent += `zsh: command not found: ${command}\n`;
      output.scrollTop = output.scrollHeight;
    });
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
    const parts = new Intl.DateTimeFormat("en-US", { timeZone:"America/Chicago", weekday:"short", day:"numeric" }).formatToParts(now);
    const weekday = parts.find(p=>p.type==="weekday")?.value || "WED";
    const day = parts.find(p=>p.type==="day")?.value || "5";
    document.querySelectorAll(".calendar-weekday").forEach(n => n.textContent = weekday.toUpperCase());
    document.querySelectorAll(".calendar-day").forEach(n => n.textContent = day);
  }

  async function updateWeather() {
    const tempNode = document.getElementById("weatherTemp");
    try {
      const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=41.8781&longitude=-87.6298&current=temperature_2m&temperature_unit=fahrenheit&timezone=America%2FChicago", { cache:"no-store" });
      if (!response.ok) throw new Error("weather unavailable");
      const data = await response.json();
      tempNode.textContent = `${Math.round(data.current.temperature_2m)}°F`;
    } catch {
      tempNode.textContent = "Chicago";
    }
  }

  function handleAction(action) {
    if (action === "open-about") openApp("about");
    if (action === "open-settings") openApp("about");
    if (action === "reset-layout") resetLayout();
    if (action === "reset-os") fullReset();
    if (action === "close-active") closeWindow();
    if (action === "minimize-active") minimizeWindow();
    if (action === "zoom-active") zoomWindow();
    if (action === "bring-all-front") [...windowsRoot.children].filter(n=>!n.hidden).forEach(focusWindow);
    if (action === "show-shortcuts") window.alert("⌘N New Finder Window\n⌘W Close Window\n⌘M Minimize\nDouble-click desktop icons to open them.\nRight-click the desktop for more options.");
  }

  document.querySelectorAll(".menu-trigger").forEach((trigger) => trigger.addEventListener("click", (event) => {
    event.stopPropagation(); toggleMenu(trigger);
  }));

  controlCenterButton.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = controlCenter.classList.toggle("open");
    controlCenter.setAttribute("aria-hidden", String(!open));
    document.querySelectorAll(".menu-popover.open").forEach(m => m.classList.remove("open"));
  });

  soundStatus.addEventListener("click", () => {
    state.sound = !state.sound; saveState();
    soundStatus.style.opacity = state.sound ? "1" : ".42";
    soundStatus.setAttribute("aria-label", state.sound ? "Sound on" : "Sound off");
    showToast(state.sound ? "Sound on" : "Sound off");
  });

  document.addEventListener("click", (event) => {
    const appTarget = event.target.closest("[data-app]");
    const actionTarget = event.target.closest("[data-action]");
    const wallpaperTarget = event.target.closest("[data-wallpaper]");
    const projectTarget = event.target.closest("[data-project]");
    const externalTarget = event.target.closest("[data-external]");

    if (event.target.closest(".menu-popover, .context-menu, .control-center-panel")) event.stopPropagation();
    if (projectTarget) { event.preventDefault(); openProject(projectTarget.dataset.project); return; }
    if (externalTarget) { event.preventDefault(); window.open(externalTarget.dataset.external, "_blank", "noopener"); return; }
    if (appTarget && !appTarget.classList.contains("desktop-item")) { event.preventDefault(); openApp(appTarget.dataset.app); return; }
    if (actionTarget) { event.preventDefault(); handleAction(actionTarget.dataset.action); closeMenus(); return; }
    if (wallpaperTarget && wallpaperTarget.dataset.wallpaper) { event.preventDefault(); setWallpaper(wallpaperTarget.dataset.wallpaper); closeMenus(); return; }
    if (!event.target.closest(".menu-bar, .menu-popover, .context-menu, .control-center-panel")) closeMenus();
    if (event.target === desktop || event.target.classList.contains("wallpaper")) {
      iconNodes.forEach(node => node.classList.remove("selected"));
      desktopPhotosRoot?.querySelectorAll(".photo-file").forEach(node => node.classList.remove("selected"));
    }
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
    item.addEventListener("click", (event) => { event.stopPropagation(); selectDesktopItem(item); });
    item.addEventListener("dblclick", (event) => { event.preventDefault(); openApp(item.dataset.app); });
  });


  currentWidget?.addEventListener("pointerdown", beginWidgetDrag);
  currentWidget?.addEventListener("dragstart", (event) => event.preventDefault());

  document.addEventListener("dragstart", (event) => {
    if (event.target.closest("#os img, #os a")) event.preventDefault();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenus();
    if (!(event.metaKey || event.ctrlKey)) return;
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
  soundStatus.style.opacity = state.sound ? "1" : ".42";
  updateClockAndCalendar();
  setInterval(updateClockAndCalendar, 30_000);
  updateWeather();
  updateDockRunning();
})();
