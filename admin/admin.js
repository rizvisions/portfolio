(() => {
  "use strict";
  const CONFIG = window.RIZVISIONS_SUPABASE;
  const ADMIN_EMAIL = CONFIG.adminEmail.toLowerCase();
  const BUCKET = CONFIG.bucket;
  const client = window.supabase.createClient(CONFIG.url, CONFIG.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  const $ = (selector, root=document) => root.querySelector(selector);
  const authView = $("#authView"), recoveryView = $("#recoveryView"), managerView = $("#managerView");
  const headerActions = $("#headerActions"), authStatus = $("#authStatus"), libraryStatus = $("#libraryStatus");
  const emailInput = $("#emailInput"), passwordInput = $("#passwordInput"), mediaGrid = $("#mediaGrid");
  const uploadPanel = $("#uploadPanel"), fileInput = $("#fileInput"), uploadQueue = $("#uploadQueue"), queueItems = $("#queueItems"), queueSummary = $("#queueSummary");
  const searchInput = $("#searchInput"), filterSelect = $("#filterSelect"), libraryCount = $("#libraryCount");
  const editDialog = $("#editDialog"), editPreview = $("#editPreview"), editTitle = $("#editTitle");
  let session = null, mediaItems = [], editingItem = null;
  emailInput.value = CONFIG.adminEmail;

  function setStatus(node, message="", error=false){ node.textContent=message; node.classList.toggle("error",error); }
  function showView(name){ authView.hidden=name!=="auth"; recoveryView.hidden=name!=="recovery"; managerView.hidden=name!=="manager"; headerActions.hidden=name!=="manager"; }
  function isAdmin(user){ return user?.email?.toLowerCase()===ADMIN_EMAIL; }
  function publicUrl(path){ return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl; }
  function safeName(name){ return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").toLowerCase() || "media"; }
  function titleFromName(name){ return name.replace(/\.[^.]+$/," ").replace(/[-_]+/g," ").replace(/\s+/g," ").trim().replace(/\b\w/g,c=>c.toUpperCase()); }
  function formatBytes(bytes){ if(!Number.isFinite(bytes))return ""; const units=["B","KB","MB","GB"]; let n=bytes,i=0; while(n>=1024&&i<units.length-1){n/=1024;i++;} return `${n>=10||i===0?n.toFixed(0):n.toFixed(1)} ${units[i]}`; }
  function mediaMarkup(item){ const url=publicUrl(item.storage_path); return item.media_type==="video"?`<video src="${url}" muted playsinline preload="metadata"></video>`:`<img src="${url}" alt="">`; }

  async function handleSession(nextSession){
    session=nextSession;
    if(!session){ showView("auth"); return; }
    if(!isAdmin(session.user)){ await client.auth.signOut(); showView("auth"); setStatus(authStatus,"This account is not authorized for Rizvisions Admin.",true); return; }
    showView("manager"); await loadLibrary();
  }

  $("#signInForm").addEventListener("submit",async(event)=>{
    event.preventDefault(); setStatus(authStatus,"Signing in…");
    const {error}=await client.auth.signInWithPassword({email:emailInput.value.trim(),password:passwordInput.value});
    if(error)setStatus(authStatus,error.message,true);
  });
  $("#createAccountButton").addEventListener("click",async()=>{
    const email=emailInput.value.trim(), password=passwordInput.value;
    if(email.toLowerCase()!==ADMIN_EMAIL)return setStatus(authStatus,"Use the configured admin email.",true);
    if(password.length<12)return setStatus(authStatus,"Choose a password with at least 12 characters.",true);
    setStatus(authStatus,"Creating account…");
    const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:`${location.origin}/admin`}});
    if(error)return setStatus(authStatus,error.message,true);
    setStatus(authStatus,data.session?"Account created. You’re signed in.":"Account created. Check your email once to confirm it, then sign in.");
  });
  $("#magicLinkButton").addEventListener("click",async()=>{
    const email=emailInput.value.trim(); setStatus(authStatus,"Sending login link…");
    const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:`${location.origin}/admin`,shouldCreateUser:false}});
    setStatus(authStatus,error?error.message:"Check your email for the login link.",!!error);
  });
  $("#forgotPasswordButton").addEventListener("click",async()=>{
    const email=emailInput.value.trim(); setStatus(authStatus,"Sending reset email…");
    const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}/admin`});
    setStatus(authStatus,error?error.message:"Check your email for a password-reset link.",!!error);
  });
  $("#recoveryForm").addEventListener("submit",async(event)=>{
    event.preventDefault(); const password=$("#newPasswordInput").value; setStatus($("#recoveryStatus"),"Updating password…");
    const {error}=await client.auth.updateUser({password});
    setStatus($("#recoveryStatus"),error?error.message:"Password updated. Opening the media manager…",!!error);
    if(!error)setTimeout(()=>showView("manager"),700);
  });
  $("#signOutButton").addEventListener("click",()=>client.auth.signOut());

  async function loadLibrary(){
    setStatus(libraryStatus,"Loading library…");
    const {data,error}=await client.from("media_items").select("*").order("sort_order",{ascending:true}).order("created_at",{ascending:false});
    if(error){ setStatus(libraryStatus,`${error.message}. Run supabase/setup.sql if you have not yet.`,true); mediaItems=[]; renderLibrary(); return; }
    mediaItems=data||[]; setStatus(libraryStatus,""); renderLibrary();
  }

  function filteredItems(){
    const q=searchInput.value.trim().toLowerCase(), filter=filterSelect.value;
    return mediaItems.filter(item=>{
      const matches=!q||[item.filename,item.caption,item.alt_text,item.album].some(v=>String(v||"").toLowerCase().includes(q));
      const typeMatches=filter==="all"||(filter==="desktop"&&item.show_on_desktop)||(filter==="published"&&item.is_published)||(filter==="hidden"&&!item.is_published)||filter===item.media_type;
      return matches&&typeMatches;
    });
  }

  function renderLibrary(){
    const items=filteredItems(); libraryCount.textContent=`${mediaItems.length} item${mediaItems.length===1?"":"s"}`;
    if(!items.length){mediaGrid.innerHTML='<div class="empty-library">No media matches this view.</div>';return;}
    mediaGrid.innerHTML=items.map(item=>`<article class="media-card" draggable="true" data-id="${item.id}"><div class="media-thumb">${mediaMarkup(item)}<div class="media-badges">${item.show_on_desktop?'<span class="badge desktop">DESKTOP</span>':''}${!item.is_published?'<span class="badge">HIDDEN</span>':''}${item.media_type==='video'?'<span class="badge">VIDEO</span>':''}</div></div><div class="media-info"><strong>${escapeHtml(item.caption||titleFromName(item.filename))}</strong><small>${escapeHtml(item.album||"Library")} · ${formatBytes(Number(item.size_bytes))}</small></div><div class="media-card-actions"><button type="button" data-edit="${item.id}">Edit</button><button type="button" data-toggle-desktop="${item.id}">${item.show_on_desktop?"Remove from desktop":"Add to desktop"}</button></div></article>`).join("");
    mediaGrid.querySelectorAll("video").forEach(video=>video.addEventListener("mouseenter",()=>video.play().catch(()=>{})));
    mediaGrid.querySelectorAll("video").forEach(video=>video.addEventListener("mouseleave",()=>{video.pause();video.currentTime=0;}));
    mediaGrid.querySelectorAll("[data-edit]").forEach(button=>button.addEventListener("click",()=>openEditor(button.dataset.edit)));
    mediaGrid.querySelectorAll("[data-toggle-desktop]").forEach(button=>button.addEventListener("click",()=>toggleDesktop(button.dataset.toggleDesktop)));
    wireReordering();
  }
  function escapeHtml(value){return String(value??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;",'"':"&quot;"}[c]));}
  searchInput.addEventListener("input",renderLibrary); filterSelect.addEventListener("change",renderLibrary);

  function wireReordering(){
    let sourceId=null;
    mediaGrid.querySelectorAll(".media-card").forEach(card=>{
      card.addEventListener("dragstart",()=>{sourceId=card.dataset.id;card.style.opacity=".45";});
      card.addEventListener("dragend",()=>{card.style.opacity="";sourceId=null;});
      card.addEventListener("dragover",event=>event.preventDefault());
      card.addEventListener("drop",async(event)=>{
        event.preventDefault(); const targetId=card.dataset.id; if(!sourceId||sourceId===targetId)return;
        const from=mediaItems.findIndex(i=>i.id===sourceId),to=mediaItems.findIndex(i=>i.id===targetId); const [moved]=mediaItems.splice(from,1); mediaItems.splice(to,0,moved); renderLibrary();
        const updates=mediaItems.map((item,index)=>client.from("media_items").update({sort_order:index}).eq("id",item.id));
        const results=await Promise.all(updates); if(results.some(r=>r.error)){setStatus(libraryStatus,"Could not save the new order.",true);await loadLibrary();}
      });
    });
  }

  async function toggleDesktop(id){
    const item=mediaItems.find(i=>i.id===id); if(!item)return;
    const next=!item.show_on_desktop;
    if(next&&mediaItems.filter(i=>i.show_on_desktop).length>=8)return setStatus(libraryStatus,"Keep the desktop to eight media files or fewer.",true);
    const {error}=await client.from("media_items").update({show_on_desktop:next}).eq("id",id);
    if(error)return setStatus(libraryStatus,error.message,true); item.show_on_desktop=next;renderLibrary();
  }

  function openEditor(id){
    editingItem=mediaItems.find(i=>i.id===id); if(!editingItem)return;
    editTitle.textContent=editingItem.filename; editPreview.innerHTML=mediaMarkup(editingItem);
    $("#captionInput").value=editingItem.caption||""; $("#altInput").value=editingItem.alt_text||""; $("#albumInput").value=editingItem.album||"Library";
    $("#publishedInput").checked=!!editingItem.is_published; $("#desktopInput").checked=!!editingItem.show_on_desktop; $("#featuredInput").checked=!!editingItem.is_featured; $("#desktopXInput").value=editingItem.desktop_x??""; $("#desktopYInput").value=editingItem.desktop_y??""; $("#desktopRotationInput").value=editingItem.desktop_rotation??0; editDialog.showModal();
  }
  $("#saveButton").addEventListener("click",async()=>{
    if(!editingItem)return; const numberOrNull=(value)=>value===""?null:Number(value); const patch={caption:$("#captionInput").value.trim(),alt_text:$("#altInput").value.trim(),album:$("#albumInput").value.trim()||"Library",is_published:$("#publishedInput").checked,show_on_desktop:$("#desktopInput").checked,is_featured:$("#featuredInput").checked,desktop_x:numberOrNull($("#desktopXInput").value),desktop_y:numberOrNull($("#desktopYInput").value),desktop_rotation:Number($("#desktopRotationInput").value)||0};
    $("#saveButton").disabled=true; const {data,error}=await client.from("media_items").update(patch).eq("id",editingItem.id).select().single(); $("#saveButton").disabled=false;
    if(error)return alert(error.message); Object.assign(editingItem,data); editDialog.close();renderLibrary();
  });
  $("#deleteButton").addEventListener("click",async()=>{
    if(!editingItem||!confirm(`Delete ${editingItem.filename}? This cannot be undone.`))return;
    $("#deleteButton").disabled=true; const storageResult=await client.storage.from(BUCKET).remove([editingItem.storage_path]);
    if(storageResult.error){$("#deleteButton").disabled=false;return alert(storageResult.error.message);}
    const {error}=await client.from("media_items").delete().eq("id",editingItem.id); $("#deleteButton").disabled=false;
    if(error)return alert(error.message); mediaItems=mediaItems.filter(i=>i.id!==editingItem.id);editDialog.close();renderLibrary();
  });

  $("#chooseFilesButton").addEventListener("click",()=>fileInput.click()); fileInput.addEventListener("change",()=>uploadFiles([...fileInput.files]));
  ["dragenter","dragover"].forEach(type=>uploadPanel.addEventListener(type,event=>{event.preventDefault();uploadPanel.classList.add("dragging");}));
  ["dragleave","drop"].forEach(type=>uploadPanel.addEventListener(type,event=>{event.preventDefault();uploadPanel.classList.remove("dragging");}));
  uploadPanel.addEventListener("drop",event=>uploadFiles([...event.dataTransfer.files]));

  async function uploadFiles(files){
    const valid=files.filter(file=>file.type.startsWith("image/")||file.type.startsWith("video/")||/\.(heic|heif)$/i.test(file.name)); if(!valid.length)return;
    uploadQueue.hidden=false; queueItems.innerHTML=""; let done=0;
    const rows=valid.map(file=>{const row=document.createElement("div");row.className="queue-item";row.innerHTML=`<div class="queue-icon">${file.type.startsWith("video/")?"▶":"◫"}</div><div><strong>${escapeHtml(file.name)}</strong><small>${formatBytes(file.size)}</small></div><span class="queue-state">Waiting</span>`;queueItems.appendChild(row);return row;});
    queueSummary.textContent=`0 of ${valid.length}`;
    for(let index=0;index<valid.length;index++){
      const row=rows[index],stateNode=row.querySelector(".queue-state");stateNode.textContent="Preparing…";
      try{await uploadOne(valid[index],stateNode);stateNode.textContent="Uploaded";stateNode.className="queue-state success";}catch(error){stateNode.textContent=error.message;stateNode.className="queue-state error";}
      done++;queueSummary.textContent=`${done} of ${valid.length}`;
    }
    fileInput.value="";await loadLibrary();
  }

  async function uploadOne(original,stateNode){
    if(original.size>50*1024*1024)throw new Error("Over 50 MB");
    const prepared=original.type.startsWith("image/")&&!original.type.includes("gif")?await optimizeImage(original):{file:original,width:null,height:null};
    const file=prepared.file; const stamp=new Date().toISOString().replace(/[:.]/g,"-"); const path=`${new Date().getFullYear()}/${stamp}-${safeName(file.name)}`;
    stateNode.textContent="Uploading…";
    const {error:uploadError}=await client.storage.from(BUCKET).upload(path,file,{cacheControl:"31536000",upsert:false,contentType:file.type});
    if(uploadError)throw uploadError;
    const type=file.type.startsWith("video/")?"video":"image"; let details={width:prepared.width,height:prepared.height,duration:null};
    if(type==="video")details=await getVideoDetails(file);
    const maxSort=mediaItems.reduce((max,item)=>Math.max(max,Number(item.sort_order)||0),-1);
    const record={storage_path:path,filename:original.name,media_type:type,mime_type:file.type,size_bytes:file.size,width:details.width,height:details.height,duration_seconds:details.duration,caption:"",alt_text:titleFromName(original.name),album:"Library",is_published:true,show_on_desktop:false,is_featured:false,sort_order:maxSort+1};
    const {data:inserted,error:insertError}=await client.from("media_items").insert(record).select().single();
    if(insertError){await client.storage.from(BUCKET).remove([path]);throw insertError;}
    if(inserted)mediaItems.push(inserted);
  }

  async function optimizeImage(file){
    let source=file;
    if(/(heic|heif)/i.test(file.type)||/\.(heic|heif)$/i.test(file.name)){
      if(typeof window.heic2any!=="function")throw new Error("HEIC converter did not load");
      const converted=await window.heic2any({blob:file,toType:"image/jpeg",quality:.92});
      const blob=Array.isArray(converted)?converted[0]:converted;
      source=new File([blob],file.name.replace(/\.(heic|heif)$/i,".jpg"),{type:"image/jpeg",lastModified:Date.now()});
    }
    const bitmap=await createImageBitmap(source); const max=2400; const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height)); const width=Math.round(bitmap.width*scale),height=Math.round(bitmap.height*scale);
    const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;canvas.getContext("2d",{alpha:false}).drawImage(bitmap,0,0,width,height);bitmap.close();
    const type="image/webp"; const blob=await new Promise(resolve=>canvas.toBlob(resolve,type,.88));
    if(!blob)throw new Error("Could not optimize image"); const name=file.name.replace(/\.[^.]+$/,"")+".webp";return{file:new File([blob],name,{type,lastModified:Date.now()}),width,height};
  }
  async function getVideoDetails(file){return new Promise(resolve=>{const video=document.createElement("video");video.preload="metadata";video.onloadedmetadata=()=>{const result={width:video.videoWidth||null,height:video.videoHeight||null,duration:Number.isFinite(video.duration)?video.duration:null};URL.revokeObjectURL(video.src);resolve(result);};video.onerror=()=>resolve({width:null,height:null,duration:null});video.src=URL.createObjectURL(file);});}

  client.auth.onAuthStateChange((event,nextSession)=>{if(event==="PASSWORD_RECOVERY"){showView("recovery");return;}handleSession(nextSession);});
  client.auth.getSession().then(({data})=>handleSession(data.session));
})();
