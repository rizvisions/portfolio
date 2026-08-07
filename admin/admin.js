(() => {
  "use strict";

  const CONFIG = window.RIZVISIONS_SUPABASE;
  const ADMIN_EMAIL = CONFIG.adminEmail.toLowerCase();
  const BUCKET = CONFIG.bucket;
  const client = window.supabase.createClient(CONFIG.url, CONFIG.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const authView = $("#authView");
  const recoveryView = $("#recoveryView");
  const managerView = $("#managerView");
  const headerActions = $("#headerActions");
  const authStatus = $("#authStatus");
  const libraryStatus = $("#libraryStatus");
  const emailInput = $("#emailInput");
  const passwordInput = $("#passwordInput");
  const mediaGrid = $("#mediaGrid");
  const uploadPanel = $("#uploadPanel");
  const fileInput = $("#fileInput");
  const uploadQueue = $("#uploadQueue");
  const queueItems = $("#queueItems");
  const queueSummary = $("#queueSummary");
  const searchInput = $("#searchInput");
  const filterSelect = $("#filterSelect");
  const libraryCount = $("#libraryCount");
  const editDialog = $("#editDialog");
  const editPreview = $("#editPreview");
  const editTitle = $("#editTitle");
  const fullPreviewDialog = $("#fullPreviewDialog");
  const fullPreviewStage = $("#fullPreviewStage");
  const fullPreviewMeta = $("#fullPreviewMeta");

  let session = null;
  let mediaItems = [];
  let editingItem = null;
  let draggedId = null;
  emailInput.value = CONFIG.adminEmail;

  function setStatus(node, message = "", error = false) {
    node.textContent = message;
    node.classList.toggle("error", error);
  }

  function showView(name) {
    authView.hidden = name !== "auth";
    recoveryView.hidden = name !== "recovery";
    managerView.hidden = name !== "manager";
    headerActions.hidden = name !== "manager";
  }

  function isAdmin(user) {
    return user?.email?.toLowerCase() === ADMIN_EMAIL;
  }

  function publicUrl(path) {
    if (!path) return "";
    return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;"
    })[char]);
  }

  function safeName(name) {
    return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "media";
  }

  function titleFromName(name) {
    return name.replace(/\.[^.]+$/, " ").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(Number(bytes))) return "";
    const units = ["B", "KB", "MB", "GB"];
    let n = Number(bytes), index = 0;
    while (n >= 1024 && index < units.length - 1) { n /= 1024; index += 1; }
    return `${n >= 10 || index === 0 ? n.toFixed(0) : n.toFixed(1)} ${units[index]}`;
  }

  function formatDuration(seconds) {
    if (!Number.isFinite(Number(seconds))) return "";
    const total = Math.round(Number(seconds));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
  }

  function itemTitle(item) {
    return item.display_name?.trim() || titleFromName(item.filename || "Untitled media");
  }

  function placement(item, surface) {
    return (item.media_placements || []).find((entry) => entry.surface === surface) || null;
  }

  function hasPlacement(item, surface) {
    return Boolean(placement(item, surface));
  }

  function normalizedVideoType(item) {
    if (item.mime_type === "video/quicktime" || /\.mov$/i.test(item.storage_path || item.filename || "")) return "video/mp4";
    return item.mime_type || "video/mp4";
  }

  function videoMarkup(item, controls = false, autoplay = false) {
    const url = publicUrl(item.storage_path);
    const poster = item.poster_path ? publicUrl(item.poster_path) : "";
    return `<video ${controls ? "controls" : ""} ${autoplay ? "autoplay" : ""} playsinline preload="metadata" ${poster ? `poster="${escapeHtml(poster)}"` : ""}><source src="${escapeHtml(url)}" type="${escapeHtml(normalizedVideoType(item))}"></video>`;
  }

  function mediaMarkup(item, controls = false, autoplay = false) {
    const url = publicUrl(item.storage_path);
    return item.media_type === "video"
      ? videoMarkup(item, controls, autoplay)
      : `<img src="${escapeHtml(url)}" alt="${escapeHtml(item.alt_text || itemTitle(item))}">`;
  }

  function wireAdminVideo(root) {
    $$("video", root).forEach((video) => {
      video.addEventListener("error", async () => {
        if (video.dataset.compatibilityRetry) return;
        const source = video.querySelector("source")?.src || video.currentSrc || "";
        if (!/\.mov(?:$|\?)/i.test(source)) return;
        video.dataset.compatibilityRetry = "1";
        try {
          const response = await fetch(source);
          if (!response.ok) return;
          const blob = await response.blob();
          video.src = URL.createObjectURL(blob.slice(0, blob.size, "video/mp4"));
          video.load();
        } catch {}
      });
    });
  }

  async function handleSession(nextSession) {
    session = nextSession;
    if (!session) { showView("auth"); return; }
    if (!isAdmin(session.user)) {
      await client.auth.signOut();
      showView("auth");
      setStatus(authStatus, "This account is not authorized for Rizvisions Admin.", true);
      return;
    }
    showView("manager");
    await loadLibrary();
  }

  $("#signInForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(authStatus, "Signing in…");
    const { error } = await client.auth.signInWithPassword({ email: emailInput.value.trim(), password: passwordInput.value });
    if (error) setStatus(authStatus, error.message, true);
  });

  $("#createAccountButton").addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (email.toLowerCase() !== ADMIN_EMAIL) return setStatus(authStatus, "Use the configured admin email.", true);
    if (password.length < 12) return setStatus(authStatus, "Choose a password with at least 12 characters.", true);
    setStatus(authStatus, "Creating account…");
    const { data, error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/admin/` } });
    if (error) return setStatus(authStatus, error.message, true);
    setStatus(authStatus, data.session ? "Account created. You’re signed in." : "Account created. Check your email once to confirm it, then sign in.");
  });

  $("#magicLinkButton").addEventListener("click", async () => {
    setStatus(authStatus, "Sending login link…");
    const { error } = await client.auth.signInWithOtp({ email: emailInput.value.trim(), options: { emailRedirectTo: `${location.origin}/admin/`, shouldCreateUser: false } });
    setStatus(authStatus, error ? error.message : "Check your email for the login link.", Boolean(error));
  });

  $("#forgotPasswordButton").addEventListener("click", async () => {
    setStatus(authStatus, "Sending reset email…");
    const { error } = await client.auth.resetPasswordForEmail(emailInput.value.trim(), { redirectTo: `${location.origin}/admin/` });
    setStatus(authStatus, error ? error.message : "Check your email for a password-reset link.", Boolean(error));
  });

  $("#recoveryForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = $("#newPasswordInput").value;
    setStatus($("#recoveryStatus"), "Updating password…");
    const { error } = await client.auth.updateUser({ password });
    setStatus($("#recoveryStatus"), error ? error.message : "Password updated. Opening the media manager…", Boolean(error));
    if (!error) setTimeout(() => showView("manager"), 700);
  });

  $("#signOutButton").addEventListener("click", () => client.auth.signOut());

  async function loadLibrary() {
    setStatus(libraryStatus, "Loading library…");
    const { data, error } = await client
      .from("media_items")
      .select("*,media_placements(*)")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      const migrationHint = /media_placements|relationship|schema cache/i.test(error.message)
        ? " Run supabase/migrate-v10.5.sql once in the SQL Editor."
        : "";
      setStatus(libraryStatus, `${error.message}${migrationHint}`, true);
      return;
    }

    mediaItems = Array.isArray(data) ? data : [];
    setStatus(libraryStatus, "");
    renderLibrary();
  }

  function filteredItems() {
    const query = searchInput.value.trim().toLowerCase();
    const filter = filterSelect.value;
    return mediaItems.filter((item) => {
      const searchable = `${itemTitle(item)} ${item.filename} ${item.caption || ""} ${item.alt_text || ""} ${(item.media_placements || []).map((p) => `${p.surface} ${p.container}`).join(" ")}`.toLowerCase();
      if (query && !searchable.includes(query)) return false;
      if (filter === "photos" && !hasPlacement(item, "photos")) return false;
      if (filter === "desktop" && !hasPlacement(item, "desktop")) return false;
      if (filter === "selected_work" && !hasPlacement(item, "selected_work")) return false;
      if (filter === "hidden" && item.is_published && (item.media_placements || []).length) return false;
      if (filter === "image" && item.media_type !== "image") return false;
      if (filter === "video" && item.media_type !== "video") return false;
      return true;
    });
  }

  function renderLibrary() {
    const items = filteredItems();
    libraryCount.textContent = `${mediaItems.length} asset${mediaItems.length === 1 ? "" : "s"}`;
    if (!items.length) {
      mediaGrid.innerHTML = `<div class="empty-library">${mediaItems.length ? "No media matches this filter." : "Your archive is empty. Upload your first photo or video above."}</div>`;
      return;
    }

    mediaGrid.innerHTML = items.map((item) => {
      const placements = item.media_placements || [];
      const badges = [
        ...placements.filter((p) => p.surface === "photos").map((p) => `<span class="badge">Photos · ${escapeHtml(p.container || "Library")}</span>`),
        ...placements.filter((p) => p.surface === "desktop").map(() => `<span class="badge desktop">Desktop</span>`),
        ...placements.filter((p) => p.surface === "selected_work").map((p) => `<span class="badge work">Work · ${escapeHtml(projectLabel(p.container))}</span>`),
        !item.is_published ? `<span class="badge hidden">Private</span>` : ""
      ].join("");
      const meta = [item.media_type === "video" ? formatDuration(item.duration_seconds) : `${item.width || "?"}×${item.height || "?"}`, formatBytes(item.size_bytes)].filter(Boolean).join(" · ");
      return `<article class="media-card" draggable="true" data-media-id="${item.id}">
        <div class="media-thumb">${mediaMarkup(item)}<div class="media-badges">${badges}</div></div>
        <div class="media-info"><strong>${escapeHtml(itemTitle(item))}</strong><small>${escapeHtml(meta || item.filename)}</small></div>
        <div class="media-card-actions"><button type="button" data-preview-id="${item.id}">Preview</button><button type="button" data-edit-id="${item.id}">Edit</button></div>
      </article>`;
    }).join("");

    $$('[data-edit-id]', mediaGrid).forEach((button) => button.addEventListener("click", () => openEdit(button.dataset.editId)));
    $$('[data-preview-id]', mediaGrid).forEach((button) => button.addEventListener("click", () => openFullPreview(mediaItems.find((item) => item.id === button.dataset.previewId))));
    $$(".media-card", mediaGrid).forEach((card) => {
      card.addEventListener("dragstart", () => { draggedId = card.dataset.mediaId; card.style.opacity = ".48"; });
      card.addEventListener("dragend", () => { draggedId = null; card.style.opacity = ""; });
      card.addEventListener("dragover", (event) => event.preventDefault());
      card.addEventListener("drop", async (event) => {
        event.preventDefault();
        const targetId = card.dataset.mediaId;
        if (!draggedId || draggedId === targetId) return;
        const from = mediaItems.findIndex((item) => item.id === draggedId);
        const to = mediaItems.findIndex((item) => item.id === targetId);
        const [moved] = mediaItems.splice(from, 1);
        mediaItems.splice(to, 0, moved);
        mediaItems.forEach((item, index) => { item.sort_order = index; });
        renderLibrary();
        await Promise.all(mediaItems.map((item, index) => client.from("media_items").update({ sort_order: index }).eq("id", item.id)));
      });
    });
  }

  function projectLabel(key) {
    return ({ parker: "Parker", bluespecs: "Blue Specs", whop: "Whop / WAP", windsurf: "Windsurf", creator: "Rizvisions" })[key] || key || "Project";
  }

  function openEdit(id) {
    editingItem = mediaItems.find((item) => item.id === id);
    if (!editingItem) return;
    const photos = placement(editingItem, "photos");
    const desktop = placement(editingItem, "desktop");
    const work = placement(editingItem, "selected_work");

    editTitle.textContent = itemTitle(editingItem);
    editPreview.innerHTML = mediaMarkup(editingItem, editingItem.media_type === "video");
    wireAdminVideo(editPreview);
    $("#displayNameInput").value = itemTitle(editingItem);
    $("#captionInput").value = editingItem.caption || "";
    $("#altInput").value = editingItem.alt_text || "";
    $("#publishedInput").checked = Boolean(editingItem.is_published);
    $("#photosInput").checked = Boolean(photos);
    $("#collectionInput").value = photos?.container || "Library";
    $("#featuredInput").checked = Boolean(photos?.is_featured);
    $("#desktopInput").checked = Boolean(desktop);
    $("#desktopXInput").value = desktop?.desktop_x ?? "";
    $("#desktopYInput").value = desktop?.desktop_y ?? "";
    $("#desktopRotationInput").value = desktop?.desktop_rotation ?? 0;
    $("#workInput").checked = Boolean(work);
    $("#projectInput").value = work?.container || "parker";
    $("#originalFilename").textContent = editingItem.filename || "";
    $("#mediaDimensions").textContent = `${editingItem.width || "?"} × ${editingItem.height || "?"}${editingItem.duration_seconds ? ` · ${formatDuration(editingItem.duration_seconds)}` : ""}`;
    $("#storagePath").textContent = editingItem.storage_path || "";
    updatePlacementOptions();
    editDialog.showModal();
  }

  function updatePlacementOptions() {
    $("#photosOptions").hidden = !$("#photosInput").checked;
    $("#desktopOptions").hidden = !$("#desktopInput").checked;
    $("#workOptions").hidden = !$("#workInput").checked;
    $("#featuredInput").disabled = !$("#photosInput").checked;
    if ($("#photosInput").checked || $("#desktopInput").checked || $("#workInput").checked) $("#publishedInput").checked = true;
  }

  ["#photosInput", "#desktopInput", "#workInput"].forEach((selector) => $(selector).addEventListener("change", updatePlacementOptions));

  async function replacePlacement(surface, enabled, values) {
    const existing = (editingItem.media_placements || []).filter((entry) => entry.surface === surface);
    if (existing.length) {
      const { error } = await client.from("media_placements").delete().eq("media_id", editingItem.id).eq("surface", surface);
      if (error) throw error;
    }
    if (!enabled) return [];
    const record = { media_id: editingItem.id, surface, ...values };
    const { data, error } = await client.from("media_placements").insert(record).select().single();
    if (error) throw error;
    return [data];
  }

  $("#saveButton").addEventListener("click", async () => {
    if (!editingItem) return;
    const numberOrNull = (value) => value === "" ? null : Number(value);
    const patch = {
      display_name: $("#displayNameInput").value.trim(),
      caption: $("#captionInput").value.trim(),
      alt_text: $("#altInput").value.trim(),
      is_published: $("#publishedInput").checked
    };
    $("#saveButton").disabled = true;
    try {
      const { data: updated, error } = await client.from("media_items").update(patch).eq("id", editingItem.id).select().single();
      if (error) throw error;
      const untouched = (editingItem.media_placements || []).filter((entry) => !["photos", "desktop", "selected_work"].includes(entry.surface));
      const photoRows = await replacePlacement("photos", $("#photosInput").checked, {
        container: $("#collectionInput").value.trim() || "Library",
        sort_order: Number(editingItem.sort_order) || 0,
        is_featured: $("#featuredInput").checked
      });
      const desktopRows = await replacePlacement("desktop", $("#desktopInput").checked, {
        container: "desktop",
        sort_order: Number(editingItem.sort_order) || 0,
        desktop_x: numberOrNull($("#desktopXInput").value),
        desktop_y: numberOrNull($("#desktopYInput").value),
        desktop_rotation: Number($("#desktopRotationInput").value) || 0
      });
      const workRows = await replacePlacement("selected_work", $("#workInput").checked, {
        container: $("#projectInput").value,
        sort_order: Number(editingItem.sort_order) || 0
      });
      Object.assign(editingItem, updated, { media_placements: [...untouched, ...photoRows, ...desktopRows, ...workRows] });
      editDialog.close();
      renderLibrary();
    } catch (error) {
      alert(error.message || String(error));
    } finally {
      $("#saveButton").disabled = false;
    }
  });

  $("#deleteButton").addEventListener("click", async () => {
    if (!editingItem || !confirm(`Delete ${itemTitle(editingItem)}? This cannot be undone.`)) return;
    $("#deleteButton").disabled = true;
    try {
      const paths = [editingItem.storage_path, editingItem.poster_path].filter(Boolean);
      if (paths.length) {
        const storageResult = await client.storage.from(BUCKET).remove(paths);
        if (storageResult.error) throw storageResult.error;
      }
      const { error } = await client.from("media_items").delete().eq("id", editingItem.id);
      if (error) throw error;
      mediaItems = mediaItems.filter((item) => item.id !== editingItem.id);
      editDialog.close();
      renderLibrary();
    } catch (error) {
      alert(error.message || String(error));
    } finally {
      $("#deleteButton").disabled = false;
    }
  });

  function openFullPreview(item = editingItem) {
    if (!item) return;
    fullPreviewStage.innerHTML = mediaMarkup(item, item.media_type === "video", false);
    wireAdminVideo(fullPreviewStage);
    fullPreviewMeta.innerHTML = `<strong>${escapeHtml(itemTitle(item))}</strong>${item.caption ? `<span>${escapeHtml(item.caption)}</span>` : ""}`;
    fullPreviewDialog.showModal();
  }

  editPreview.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.tagName === "VIDEO") return;
    openFullPreview();
  });
  editPreview.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openFullPreview(); } });
  $("#fullPreviewClose").addEventListener("click", () => fullPreviewDialog.close());
  fullPreviewDialog.addEventListener("click", (event) => { if (event.target === fullPreviewDialog) fullPreviewDialog.close(); });

  $("#chooseFilesButton").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => uploadFiles([...fileInput.files]));
  ["dragenter", "dragover"].forEach((type) => uploadPanel.addEventListener(type, (event) => { event.preventDefault(); uploadPanel.classList.add("dragging"); }));
  ["dragleave", "drop"].forEach((type) => uploadPanel.addEventListener(type, (event) => { event.preventDefault(); uploadPanel.classList.remove("dragging"); }));
  uploadPanel.addEventListener("drop", (event) => uploadFiles([...event.dataTransfer.files]));

  async function uploadFiles(files) {
    const valid = files.filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/") || /\.(heic|heif|mov|m4v|mp4|webm)$/i.test(file.name));
    if (!valid.length) return;
    uploadQueue.hidden = false;
    queueItems.innerHTML = "";
    let done = 0;
    const rows = valid.map((file) => {
      const row = document.createElement("div");
      row.className = "queue-item";
      row.innerHTML = `<div class="queue-icon">${file.type.startsWith("video/") || /\.(mov|m4v|mp4|webm)$/i.test(file.name) ? "▶" : "◫"}</div><div><strong>${escapeHtml(file.name)}</strong><small>${formatBytes(file.size)}</small></div><span class="queue-state">Waiting</span>`;
      queueItems.appendChild(row);
      return row;
    });
    queueSummary.textContent = `0 of ${valid.length}`;

    for (let index = 0; index < valid.length; index += 1) {
      const stateNode = rows[index].querySelector(".queue-state");
      stateNode.textContent = "Preparing…";
      try {
        await uploadOne(valid[index], stateNode);
        stateNode.textContent = "Uploaded";
        stateNode.className = "queue-state success";
      } catch (error) {
        stateNode.textContent = error.message || String(error);
        stateNode.className = "queue-state error";
      }
      done += 1;
      queueSummary.textContent = `${done} of ${valid.length}`;
    }
    fileInput.value = "";
    await loadLibrary();
  }

  async function uploadOne(original, stateNode) {
    if (original.size > 50 * 1024 * 1024) throw new Error("Over 50 MB");
    const isVideo = original.type.startsWith("video/") || /\.(mov|m4v|mp4|webm)$/i.test(original.name);
    const prepared = isVideo ? await prepareVideo(original) : await optimizeImage(original);
    const file = prepared.file;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const path = `${new Date().getFullYear()}/${stamp}-${safeName(file.name)}`;
    stateNode.textContent = "Uploading…";
    const { error: uploadError } = await client.storage.from(BUCKET).upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
    if (uploadError) throw uploadError;

    let posterPath = null;
    if (prepared.posterBlob) {
      posterPath = `posters/${new Date().getFullYear()}/${stamp}-${safeName(file.name.replace(/\.[^.]+$/, ""))}.webp`;
      const { error: posterError } = await client.storage.from(BUCKET).upload(posterPath, prepared.posterBlob, { cacheControl: "31536000", upsert: false, contentType: "image/webp" });
      if (posterError) posterPath = null;
    }

    const maxSort = mediaItems.reduce((max, item) => Math.max(max, Number(item.sort_order) || 0), -1);
    const record = {
      storage_path: path,
      poster_path: posterPath,
      filename: original.name,
      display_name: titleFromName(original.name),
      media_type: isVideo ? "video" : "image",
      mime_type: file.type,
      size_bytes: file.size,
      width: prepared.width,
      height: prepared.height,
      duration_seconds: prepared.duration,
      caption: "",
      alt_text: titleFromName(original.name),
      album: "Library",
      is_published: true,
      show_on_desktop: false,
      is_featured: false,
      sort_order: maxSort + 1
    };

    const { data: inserted, error: insertError } = await client.from("media_items").insert(record).select().single();
    if (insertError) {
      await client.storage.from(BUCKET).remove([path, posterPath].filter(Boolean));
      throw insertError;
    }

    const { data: placementRow, error: placementError } = await client.from("media_placements").insert({
      media_id: inserted.id,
      surface: "photos",
      container: "Library",
      sort_order: maxSort + 1,
      is_featured: false
    }).select().single();
    if (placementError) throw placementError;
    inserted.media_placements = [placementRow];
    mediaItems.push(inserted);
  }

  async function optimizeImage(file) {
    let source = file;
    if (/(heic|heif)/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)) {
      if (typeof window.heic2any !== "function") throw new Error("HEIC converter did not load");
      const converted = await window.heic2any({ blob: file, toType: "image/jpeg", quality: .92 });
      const blob = Array.isArray(converted) ? converted[0] : converted;
      source = new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg", lastModified: Date.now() });
    }
    const bitmap = await createImageBitmap(source);
    const max = 2400;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d", { alpha: false }).drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", .88));
    if (!blob) throw new Error("Could not optimize image");
    return { file: new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp", lastModified: Date.now() }), width, height, duration: null, posterBlob: null };
  }

  async function prepareVideo(original) {
    const isQuickTime = original.type === "video/quicktime" || /\.mov$/i.test(original.name);
    const file = isQuickTime
      ? new File([original], original.name.replace(/\.mov$/i, ".mp4"), { type: "video/mp4", lastModified: original.lastModified })
      : original;
    const details = await getVideoDetails(file);
    return { file, ...details };
  }

  async function getVideoDetails(file) {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(file);
      let settled = false;
      const finish = (posterBlob = null) => {
        if (settled) return;
        settled = true;
        const result = {
          width: video.videoWidth || null,
          height: video.videoHeight || null,
          duration: Number.isFinite(video.duration) ? video.duration : null,
          posterBlob
        };
        URL.revokeObjectURL(url);
        resolve(result);
      };
      video.onerror = () => finish(null);
      video.onloadedmetadata = () => {
        const capture = () => {
          try {
            const max = 1200;
            const scale = Math.min(1, max / Math.max(video.videoWidth || max, video.videoHeight || max));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round((video.videoWidth || 1200) * scale));
            canvas.height = Math.max(1, Math.round((video.videoHeight || 675) * scale));
            canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => finish(blob), "image/webp", .84);
          } catch { finish(null); }
        };
        if (Number.isFinite(video.duration) && video.duration > .2) {
          video.currentTime = Math.min(.25, video.duration / 5);
          video.onseeked = capture;
          setTimeout(capture, 1400);
        } else capture();
      };
      video.src = url;
    });
  }

  searchInput.addEventListener("input", renderLibrary);
  filterSelect.addEventListener("change", renderLibrary);

  client.auth.onAuthStateChange((event, nextSession) => {
    if (event === "PASSWORD_RECOVERY") { showView("recovery"); return; }
    handleSession(nextSession);
  });
  client.auth.getSession().then(({ data }) => handleSession(data.session));
})();
