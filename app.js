(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const body = document.body;
  const desktop = $('#desktop');
  const dock = $('#dock');
  const toast = $('#toast');
  const stateKey = 'rizvisions-desktop-v1';
  let z = 100;
  let activeWindow = null;
  let soundEnabled = true;
  let menuOpen = null;
  let toastTimer;

  const appNames = {
    about:'About Riz',work:'Selected Work',photos:'Photos',parker:'Parker',career:'Career History',socials:'Instagram',tiktok:'TikTok',spotify:'Spotify',notes:'Notes',messages:'Messages',weather:'Weather',terminal:'Terminal',resume:'Resume.pdf',trash:'Trash',wallpapers:'Wallpaper'
  };

  const saved = (() => { try { return JSON.parse(localStorage.getItem(stateKey)) || {}; } catch { return {}; } })();
  body.dataset.theme = saved.theme || 'light';
  body.dataset.wallpaper = saved.wallpaper || 'sonoma';
  soundEnabled = saved.sound !== false;

  function persist(extra = {}) {
    const windows = {};
    $$('.app-window').forEach(w => {
      windows[w.dataset.window] = { left:w.style.left, top:w.style.top, width:w.style.width, height:w.style.height, maximized:w.classList.contains('maximized') };
    });
    const icons = {};
    $$('.desktop-icon').forEach(i => icons[i.dataset.app] = { left:i.style.left, top:i.style.top });
    try {
      localStorage.setItem(stateKey, JSON.stringify({ theme:body.dataset.theme, wallpaper:body.dataset.wallpaper, sound:soundEnabled, windows, icons, note:$('#note-text')?.value || '', ...extra }));
    } catch {}
  }

  function restoreLayout() {
    Object.entries(saved.windows || {}).forEach(([name, pos]) => {
      const w = $(`[data-window="${name}"]`);
      if (!w) return;
      if (pos.left) w.style.left = pos.left;
      if (pos.top) w.style.top = pos.top;
      if (pos.width) w.style.width = pos.width;
      if (pos.height) w.style.height = pos.height;
      if (pos.maximized) w.classList.add('maximized');
    });
    Object.entries(saved.icons || {}).forEach(([name, pos]) => {
      const icon = $(`.desktop-icon[data-app="${name}"]`);
      if (!icon) return;
      if (pos.left) icon.style.left = pos.left;
      if (pos.top) icon.style.top = pos.top;
    });
    if (saved.note && $('#note-text')) $('#note-text').value = saved.note;
  }

  function beep(freq = 420, duration = .045) {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq; osc.type = 'sine'; gain.gain.value = .025;
      osc.connect(gain); gain.connect(ctx.destination); osc.start();
      gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + duration);
      osc.stop(ctx.currentTime + duration); setTimeout(() => ctx.close(), 120);
    } catch {}
  }

  function notify(message) {
    clearTimeout(toastTimer); toast.textContent = message; toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
  }

  function focusWindow(win) {
    if (!win) return;
    $$('.app-window').forEach(w => w.classList.add('inactive'));
    win.classList.remove('inactive');
    win.style.zIndex = ++z;
    activeWindow = win;
  }

  function openApp(name) {
    const win = $(`[data-window="${name}"]`);
    if (!win) return;
    win.classList.add('open'); win.classList.remove('minimized'); focusWindow(win);
    const dockIcon = $(`#dock [data-app="${name}"]`); if (dockIcon) dockIcon.classList.add('running');
    closeMenus(); beep(470, .05);
    if (name === 'terminal') setTimeout(() => $('#terminal-input')?.focus(), 80);
  }

  function closeWindow(win) {
    if (!win) return;
    const name = win.dataset.window; win.classList.remove('open','minimized','inactive');
    const dockIcon = $(`#dock [data-app="${name}"]`); if (dockIcon) dockIcon.classList.remove('running');
    activeWindow = null; beep(260, .05); persist();
  }

  function minimizeWindow(win) {
    if (!win) return;
    win.classList.add('minimized'); activeWindow = null; beep(310, .04); persist();
  }

  function maximizeWindow(win) {
    if (!win) return;
    win.classList.toggle('maximized'); focusWindow(win); persist();
  }

  function showDesktop() { $$('.app-window.open').forEach(w => w.classList.add('minimized')); activeWindow = null; closeMenus(); }
  function bringFront() { $$('.app-window.open:not(.minimized)').forEach(w => focusWindow(w)); }

  function positionMenu(trigger, panel) {
    const rect = trigger.getBoundingClientRect();
    panel.style.left = Math.min(rect.left, innerWidth - panel.offsetWidth - 8) + 'px';
  }
  function toggleMenu(trigger) {
    const id = trigger.dataset.menu, panel = $('#' + id);
    if (!panel) return;
    if (menuOpen === panel) { closeMenus(); return; }
    closeMenus(); panel.classList.add('open'); trigger.classList.add('active'); menuOpen = panel;
    requestAnimationFrame(() => positionMenu(trigger,panel));
  }
  function closeMenus() { $$('.menu-panel.open').forEach(p=>p.classList.remove('open')); $$('.menu-trigger.active,.status-button.active').forEach(b=>b.classList.remove('active')); menuOpen=null; }

  $$('.menu-trigger').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); toggleMenu(b); }));
  $('#control-center').addEventListener('click', e => { e.stopPropagation(); closeMenus(); const p=$('#control-panel'); p.classList.add('open'); e.currentTarget.classList.add('active'); menuOpen=p; });
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.menu-panel,.menu-trigger,.status-button')) closeMenus(); });

  function handleAction(action, source) {
    const app = source?.dataset.app;
    const msg = source?.dataset.message;
    switch(action) {
      case 'open': openApp(app); break;
      case 'open-wallpapers': openApp('wallpapers'); break;
      case 'close-active': closeWindow(activeWindow); break;
      case 'minimize-active': minimizeWindow(activeWindow); break;
      case 'maximize-active': maximizeWindow(activeWindow); break;
      case 'bring-front': bringFront(); closeMenus(); break;
      case 'show-desktop': showDesktop(); break;
      case 'sort-icons': sortIcons(); break;
      case 'theme-light': setTheme('light'); break;
      case 'theme-dark': setTheme('dark'); break;
      case 'new-note': openApp('notes'); setTimeout(()=>$('#note-text')?.focus(),100); break;
      case 'copy-email': navigator.clipboard?.writeText('https://rizvisions.com'); notify('Copied rizvisions.com'); closeMenus(); break;
      case 'paste-creativity': notify('Creativity pasted. Results may vary.'); closeMenus(); break;
      case 'select-icons': $$('.desktop-icon').forEach(i=>i.classList.add('selected')); closeMenus(); break;
      case 'restart': restartDesktop(); break;
      case 'sleep': sleepDesktop(); break;
      case 'notify': notify(msg || 'Noted.'); closeMenus(); break;
      case 'secret': loveBurst(); closeMenus(); break;
    }
  }
  document.addEventListener('click', e => {
    const actionEl = e.target.closest('[data-action]'); if (actionEl) handleAction(actionEl.dataset.action, actionEl);
    const appEl = e.target.closest('[data-open-app]'); if (appEl) openApp(appEl.dataset.openApp);
  });

  function setTheme(theme) { body.dataset.theme=theme; $('#control-theme small').textContent=theme[0].toUpperCase()+theme.slice(1); persist(); closeMenus(); notify(`${theme[0].toUpperCase()+theme.slice(1)} appearance`); }
  function setWallpaper(name) { body.dataset.wallpaper=name; persist(); notify('Wallpaper changed'); }
  $$('[data-wallpaper-choice]').forEach(b=>b.addEventListener('click',()=>setWallpaper(b.dataset.wallpaperChoice)));

  $$('.desktop-icon').forEach(icon => {
    icon.style.left = getComputedStyle(icon).getPropertyValue('--x').trim();
    icon.style.top = getComputedStyle(icon).getPropertyValue('--y').trim();
    let start, moved=false;
    icon.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      $$('.desktop-icon').forEach(i=>i.classList.remove('selected')); icon.classList.add('selected');
      start={x:e.clientX,y:e.clientY,left:icon.offsetLeft,top:icon.offsetTop}; moved=false; icon.setPointerCapture(e.pointerId);
    });
    icon.addEventListener('pointermove', e => {
      if (!start || !icon.hasPointerCapture(e.pointerId)) return;
      const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.abs(dx)+Math.abs(dy)>5)moved=true;
      if(moved){icon.classList.add('dragging');icon.style.left=Math.max(0,Math.min(innerWidth-icon.offsetWidth,start.left+dx))+'px';icon.style.top=Math.max(0,Math.min(innerHeight-120-icon.offsetHeight,start.top+dy))+'px';}
    });
    icon.addEventListener('pointerup', e => { if(!start)return;icon.classList.remove('dragging');icon.releasePointerCapture(e.pointerId);if(!moved)openApp(icon.dataset.app);else persist();start=null; });
    icon.addEventListener('click', e => { if (e.detail === 0) openApp(icon.dataset.app); });
  });

  $$('#dock [data-app]').forEach(btn => btn.addEventListener('click',()=>openApp(btn.dataset.app)));

  $$('.app-window').forEach(win => {
    const bar = $('.window-titlebar',win); let drag=null;
    win.addEventListener('pointerdown',()=>focusWindow(win));
    bar.addEventListener('dblclick',e=>{if(!e.target.closest('.traffic-lights'))maximizeWindow(win)});
    bar.addEventListener('pointerdown', e => {
      if(e.target.closest('.traffic-lights')||win.classList.contains('maximized'))return;
      const r=win.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,left:r.left,top:r.top};bar.setPointerCapture(e.pointerId);focusWindow(win);
    });
    bar.addEventListener('pointermove',e=>{if(!drag||!bar.hasPointerCapture(e.pointerId))return;win.style.left=Math.max(0,Math.min(innerWidth-win.offsetWidth,drag.left+e.clientX-drag.x))+'px';win.style.top=Math.max(0,Math.min(innerHeight-110-win.offsetHeight,drag.top+e.clientY-drag.y))+'px';});
    bar.addEventListener('pointerup',e=>{if(!drag)return;bar.releasePointerCapture(e.pointerId);drag=null;persist()});
    $$('.traffic-lights button',win).forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();const a=btn.dataset.windowAction;if(a==='close')closeWindow(win);if(a==='minimize')minimizeWindow(win);if(a==='maximize')maximizeWindow(win)}));
    win.addEventListener('mouseup',()=>persist());
  });

  desktop.addEventListener('contextmenu',e=>{
    if(e.target.closest('.app-window,.desktop-icon,.dock'))return;
    e.preventDefault();closeMenus();const m=$('#context-menu');m.style.left=Math.min(e.clientX,innerWidth-215)+'px';m.style.top=Math.min(e.clientY,innerHeight-230)+'px';m.classList.add('open');menuOpen=m;
  });
  desktop.addEventListener('pointerdown',e=>{if(!e.target.closest('.desktop-icon,.app-window,.menu-panel'))$$('.desktop-icon').forEach(i=>i.classList.remove('selected'))});

  function resetLayout(){
    localStorage.removeItem(STORAGE_KEY);
    $$('.desktop-icon').forEach(icon=>{icon.style.left='';icon.style.top='';});
    $$('.app-window').forEach(win=>{win.style.left='';win.style.top='';win.style.width='';win.style.height='';win.classList.remove('open','minimized','maximized');});
    closeMenus();notify('Default desktop restored');setTimeout(()=>location.reload(),500);
  }
  function resetAll(){
    if(confirm('Reset wallpaper, icon positions, windows, sound, and local notes?')){localStorage.removeItem(STORAGE_KEY);location.reload();}
  }
  function sortIcons(){
    const icons=$$('.desktop-icon');const cols=Math.max(1,Math.floor((innerWidth-30)/96));icons.forEach((icon,i)=>{const col=i%cols,row=Math.floor(i/cols);icon.style.left=(22+col*96)+'px';icon.style.top=(48+row*96)+'px'});persist();closeMenus();notify('Icons sorted');
  }
  function restartDesktop(){closeMenus();$('#boot-screen').classList.remove('done');setTimeout(()=>location.reload(),650)}
  function sleepDesktop(){closeMenus();const s=$('#boot-screen');$('.boot-name',s).textContent='GOOD NIGHT, RIZ';$('.boot-progress',s).style.display='none';s.classList.remove('done');s.addEventListener('click',()=>{s.classList.add('done');$('.boot-name',s).textContent='RIZVISIONS';$('.boot-progress',s).style.display='block'},{once:true})}
  function loveBurst(){const wrap=$('#love-burst');for(let i=0;i<24;i++){const h=document.createElement('span');h.className='heart';h.textContent=['♥','✦','R','★'][Math.floor(Math.random()*4)];h.style.left=(20+Math.random()*60)+'vw';h.style.top=(65+Math.random()*20)+'vh';h.style.animationDelay=(Math.random()*.35)+'s';wrap.appendChild(h);setTimeout(()=>h.remove(),1800)}beep(620,.1)}

  $('#sound-toggle').addEventListener('click',()=>{soundEnabled=!soundEnabled;$('#sound-toggle').textContent=soundEnabled?'◉':'○';$('#control-sound').classList.toggle('active',soundEnabled);$('#control-sound small').textContent=soundEnabled?'On':'Off';persist();notify(`Sound ${soundEnabled?'on':'off'}`)});
  $('#control-sound').addEventListener('click',()=>$('#sound-toggle').click());
  $('#control-theme').addEventListener('click',()=>setTheme(body.dataset.theme==='light'?'dark':'light'));
  $('#brightness-range').addEventListener('input',e=>desktop.style.setProperty('--desktop-brightness',e.target.value/100));
  $('#note-text').addEventListener('input',()=>persist());
  $('#new-note-button').addEventListener('click',()=>{if(confirm('Clear this local note?')){$('#note-text').value='';persist();$('#note-text').focus()}});
  $('#empty-trash').addEventListener('click',()=>{const files=$('.trash-files');files.innerHTML='<p style="grid-column:1/-1;text-align:center;color:var(--muted);padding:70px 0">Trash is empty.<br><small>For now.</small></p>';notify('Trash emptied');beep(180,.08)});
  $('#fake-play').addEventListener('click',e=>{e.currentTarget.textContent=e.currentTarget.textContent==='▶'?'Ⅱ':'▶';notify('Make the playlist first, Riz.');beep(520,.08)});

  const projectData={
    parker:{title:'Parker',icon:'P',cls:'parker-project',copy:'Helping build and grow an AI creative strategist for ecommerce teams.',bullets:['GTM, sales, onboarding, and support','Product concepts and positioning','Parker Brain and workflow ideas'],button:'Open Parker'},
    'blue-specs':{title:'Blue Specs',icon:'B',cls:'blue-project',copy:'The ecommerce business I started in 2020 selling blue-light glasses.',bullets:['$40K+ in six months','Influencer marketing and paid social','A very early lesson in building online'],button:null},
    wap:{title:'WAP',icon:'W',cls:'wap-project',copy:'A creator rewards and clip-curation operation built around performance-based payouts.',bullets:['Creator systems and community','Campaign rules and fraud prevention','Peak around $5.5K MRR'],button:null},
    windsurf:{title:'Windsurf',icon:'↗',cls:'windsurf-project',copy:'A creator campaign that generated roughly 3.6 million views.',bullets:['Performance creative distribution','RPM-based incentives','One of the cleaner internet wins'],button:null},
    rizvisions:{title:'Rizvisions',icon:'R',cls:'riz-project',copy:'The creative identity that started with photography and keeps absorbing everything else.',bullets:['Photography and video','Lifestyle storytelling','The site you are currently inside'],button:'Open Photos'},
    internet:{title:'Internet Stuff',icon:'∞',cls:'internet-project',copy:'Projects that were useful, funny, short-lived, or all three.',bullets:['Client work','Creator programs','Too many domains'],button:null}
  };
  $$('.project-file').forEach(file=>file.addEventListener('click',()=>{
    $$('.project-file').forEach(f=>f.classList.remove('selected'));file.classList.add('selected');const d=projectData[file.dataset.project],p=$('#project-preview');p.innerHTML=`<span class="preview-label">QUICK LOOK</span><div class="preview-icon ${d.cls}">${d.icon}</div><h2>${d.title}</h2><p>${d.copy}</p><ul>${d.bullets.map(x=>`<li>${x}</li>`).join('')}</ul>${d.button?`<button class="primary-button compact" data-open-app="${file.dataset.project==='parker'?'parker':'photos'}">${d.button}</button>`:''}`;
  }));

  function updateClock(){
    const now=new Date();$('#menu-clock').textContent=new Intl.DateTimeFormat('en-US',{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(now);$('#note-date').textContent=new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeStyle:'short'}).format(now);$('#terminal-login').textContent=now.toString().split(' GMT')[0];
  }
  updateClock();setInterval(updateClock,1000);

  async function loadWeather(){
    try{
      const url='https://api.open-meteo.com/v1/forecast?latitude=41.8781&longitude=-87.6298&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FChicago&forecast_days=1';
      const r=await fetch(url);if(!r.ok)throw new Error('weather');const j=await r.json();const c=j.current,d=j.daily;const code=c.weather_code;const desc=code===0?'Clear':code<=3?'Partly Cloudy':code<=48?'Foggy':code<=67?'Rain':code<=77?'Snow':code<=82?'Showers':'Storms';const icon=code===0?'☀':code<=3?'⛅':code<=67?'☂':code<=77?'❄':'☁';
      $('#weather-temp').textContent=Math.round(c.temperature_2m)+'°';$('#weather-condition').textContent=desc;$('#weather-high').textContent='H: '+Math.round(d.temperature_2m_max[0])+'°';$('#weather-low').textContent='L: '+Math.round(d.temperature_2m_min[0])+'°';$('#weather-feels').textContent=Math.round(c.apparent_temperature)+'°';$('#weather-wind').textContent=Math.round(c.wind_speed_10m)+' mph';$('#weather-humidity').textContent=Math.round(c.relative_humidity_2m)+'%';$('#weather-updated').textContent=new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});$('#control-temp').textContent=Math.round(c.temperature_2m)+'°';$('#weather-icon-mini').textContent=icon;
    }catch{$('#weather-condition').textContent='Weather unavailable';$('#control-temp').textContent='--°';}
  }
  loadWeather();setInterval(loadWeather,10*60*1000);

  const termOut=$('#terminal-output'),termForm=$('#terminal-form'),termInput=$('#terminal-input');
  function termPrint(html,cls=''){const p=document.createElement('p');p.className=cls;p.innerHTML=html;termOut.appendChild(p);termOut.parentElement.scrollTop=termOut.parentElement.scrollHeight}
  const commands={
    help:()=>termPrint('Commands: <b>about</b>, <b>work</b>, <b>photos</b>, <b>parker</b>, <b>career</b>, <b>socials</b>, <b>weather</b>, <b>whoami</b>, <b>date</b>, <b>blue-specs</b>, <b>wap</b>, <b>secret</b>, <b>clear</b>'),
    about:()=>{termPrint('Opening About Riz…');openApp('about')},work:()=>{termPrint('Opening Selected Work…');openApp('work')},photos:()=>{termPrint('Opening Photos…');openApp('photos')},parker:()=>{termPrint('Current process: making creative strategy less generic.');openApp('parker')},career:()=>openApp('career'),socials:()=>openApp('socials'),weather:()=>openApp('weather'),whoami:()=>termPrint('riz — creator, operator, and professional tab collector'),date:()=>termPrint(new Date().toString()),'blue-specs':()=>termPrint('Blue Specs: $40K+ in six months, 2020. The lore is being restored.'),wap:()=>termPrint('WAP = creator rewards, performance payouts, and an objectively unfortunate acronym.'),secret:()=>{termPrint('You found it. There will be better secrets later.');loveBurst()},sudo:()=>termPrint('riz is not in the sudoers file. This incident will be reported.','terminal-error'),sleep:()=>sleepDesktop(),clear:()=>termOut.innerHTML=''
  };
  termForm.addEventListener('submit',e=>{e.preventDefault();const cmd=termInput.value.trim().toLowerCase();termPrint(`<span style="color:#7ef290">riz@rizvisions ~ %</span> ${termInput.value}`);termInput.value='';if(commands[cmd])commands[cmd]();else if(cmd)termPrint(`zsh: command not found: ${cmd}`,'terminal-error')});

  document.addEventListener('keydown',e=>{
    const meta=e.metaKey||e.ctrlKey;
    if(e.key==='Escape')closeMenus();
    if(meta&&e.key.toLowerCase()==='w'){e.preventDefault();closeWindow(activeWindow)}
    if(meta&&e.key.toLowerCase()==='m'){e.preventDefault();minimizeWindow(activeWindow)}
    if(meta&&e.key.toLowerCase()==='k'){e.preventDefault();openApp('terminal')}
    if(meta&&e.key.toLowerCase()==='n'){e.preventDefault();openApp('notes')}
  });

  window.addEventListener('resize',persist);
  restoreLayout();
  $('#sound-toggle').textContent=soundEnabled?'◉':'○';
  $('#control-sound').classList.toggle('active',soundEnabled);$('#control-sound small').textContent=soundEnabled?'On':'Off';$('#control-theme small').textContent=body.dataset.theme[0].toUpperCase()+body.dataset.theme.slice(1);
  setTimeout(()=>$('#boot-screen').classList.add('done'),1650);
  setTimeout(()=>{openApp('about');notify('Welcome to Rizvisions. Click anything.')},1900);

  document.addEventListener('click',e=>{const a=e.target.closest('[data-action]')?.dataset.action;if(a==='reset-layout')resetLayout();if(a==='reset-all')resetAll();});


  const iconSVG={
    about:`<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="ab" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#2c2c2e"/><stop offset="1" stop-color="#0b0b0c"/></linearGradient></defs><rect x="2" y="2" width="60" height="60" rx="14" fill="url(#ab)"/><rect x="10" y="10" width="44" height="44" rx="12" fill="#fff" opacity=".09"/><text x="32" y="41" text-anchor="middle" fill="white" font-size="27" font-weight="900" font-family="Arial">rv</text></svg>`,
    work:`<svg viewBox="0 0 64 64"><defs><linearGradient id="fd" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#67d7ff"/><stop offset="1" stop-color="#168bd0"/></linearGradient></defs><path d="M4 17a6 6 0 0 1 6-6h16l5 6h23a6 6 0 0 1 6 6v31a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6z" fill="url(#fd)"/><path d="M4 24h56" stroke="#b9efff" opacity=".8"/></svg>`,
    photos:`<svg viewBox="0 0 64 64"><rect x="2" y="2" width="60" height="60" rx="14" fill="#fff"/><g transform="translate(32 32)">${['#ff3b30','#ff9500','#ffcc00','#34c759','#00c7be','#007aff','#5856d6','#af52de'].map((c,i)=>`<ellipse rx="7" ry="20" fill="${c}" opacity=".92" transform="rotate(${i*45}) translate(0 -10)"/>`).join('')}<circle r="7" fill="#fff"/></g></svg>`,
    parker:`<svg viewBox="0 0 64 64"><defs><linearGradient id="pk" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eeeaff"/><stop offset="1" stop-color="#7f78c5"/></linearGradient></defs><rect x="2" y="2" width="60" height="60" rx="14" fill="url(#pk)"/><path d="M20 48V16h15c9 0 14 5 14 13s-5 13-14 13h-6v6zm9-14h5c4 0 6-2 6-5s-2-5-6-5h-5z" fill="#28243f"/></svg>`,
    career:`<svg viewBox="0 0 64 64"><rect x="2" y="2" width="60" height="60" rx="14" fill="#f3f3f5"/><rect x="13" y="15" width="38" height="35" rx="5" fill="#fff" stroke="#c6c6c8"/><circle cx="22" cy="27" r="5" fill="#7f78c5"/><path d="M31 23h13M31 28h13M18 38h27M18 43h20" stroke="#606066" stroke-width="3" stroke-linecap="round"/></svg>`,
    socials:`<svg viewBox="0 0 64 64"><defs><radialGradient id="ig" cx="30%" cy="100%" r="120%"><stop stop-color="#ffd600"/><stop offset=".35" stop-color="#ff7a00"/><stop offset=".62" stop-color="#ff0169"/><stop offset="1" stop-color="#7638fa"/></radialGradient></defs><rect x="2" y="2" width="60" height="60" rx="14" fill="url(#ig)"/><rect x="15" y="15" width="34" height="34" rx="10" fill="none" stroke="white" stroke-width="4"/><circle cx="32" cy="32" r="8" fill="none" stroke="white" stroke-width="4"/><circle cx="43" cy="21" r="2.5" fill="white"/></svg>`,
    tiktok:`<svg viewBox="0 0 64 64"><rect x="2" y="2" width="60" height="60" rx="14" fill="#080808"/><path d="M37 15c1 7 5 11 12 12v8c-5 0-9-2-12-4v11c0 9-6 15-15 15-8 0-14-6-14-14s6-14 14-14h3v8c-1-.3-2-.4-3-.4-4 0-6 2.6-6 6.3s2.5 6.2 6 6.2c4 0 7-2.5 7-7V15z" fill="#25f4ee" transform="translate(-2 2)"/><path d="M39 13c1 7 5 11 12 12v8c-5 0-9-2-12-4v11c0 9-6 15-15 15-8 0-14-6-14-14s6-14 14-14h3v8c-1-.3-2-.4-3-.4-4 0-6 2.6-6 6.3s2.5 6.2 6 6.2c4 0 7-2.5 7-7V13z" fill="#fe2c55"/><path d="M38 14c1 7 5 11 12 12v6c-5 0-9-2-12-4v12c0 9-6 14-14 14-7 0-12-5-12-12s5-12 12-12h2v6h-2c-4 0-6 2-6 6s2 6 6 6 7-3 7-8V14z" fill="white"/></svg>`,
    spotify:`<svg viewBox="0 0 64 64"><rect x="2" y="2" width="60" height="60" rx="14" fill="#050505"/><circle cx="32" cy="32" r="22" fill="#1ed760"/><path d="M19 26c9-3 21-2 29 2M21 34c8-2 18-1 25 2M23 41c7-1 14 0 20 2" fill="none" stroke="#07120a" stroke-width="4" stroke-linecap="round"/></svg>`,
    notes:`<svg viewBox="0 0 64 64"><rect x="2" y="2" width="60" height="60" rx="14" fill="#fff"/><path d="M2 16h60v10H2z" fill="#ffd60a"/><path d="M12 34h40M12 42h40M12 50h30" stroke="#d2d2d7" stroke-width="2"/></svg>`,
    messages:`<svg viewBox="0 0 64 64"><defs><linearGradient id="msg" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#64ef72"/><stop offset="1" stop-color="#18b736"/></linearGradient></defs><rect x="2" y="2" width="60" height="60" rx="14" fill="url(#msg)"/><ellipse cx="32" cy="30" rx="21" ry="17" fill="white"/><path d="M20 42l-3 9 11-6" fill="white"/></svg>`,
    weather:`<svg viewBox="0 0 64 64"><defs><linearGradient id="we" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#5bb7ff"/><stop offset="1" stop-color="#1d78e8"/></linearGradient></defs><rect x="2" y="2" width="60" height="60" rx="14" fill="url(#we)"/><circle cx="24" cy="24" r="10" fill="#ffd60a"/><path d="M17 45h31c5 0 9-4 9-9s-4-9-9-9c-1 0-2 0-3 .4A15 15 0 0 0 17 32c-5 0-9 3-9 7s4 6 9 6z" fill="white" opacity=".96"/></svg>`,
    resume:`<svg viewBox="0 0 64 64"><path d="M13 4h27l11 11v45H13z" fill="#fff" stroke="#c7c7cc"/><path d="M40 4v12h11" fill="#ececf1"/><rect x="18" y="36" width="28" height="14" rx="3" fill="#ff3b30"/><text x="32" y="46" text-anchor="middle" fill="white" font-size="10" font-weight="800">PDF</text><path d="M20 23h22M20 28h18" stroke="#b7b7bc" stroke-width="2"/></svg>`,
    terminal:`<svg viewBox="0 0 64 64"><defs><linearGradient id="tr" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#454548"/><stop offset="1" stop-color="#111113"/></linearGradient></defs><rect x="2" y="2" width="60" height="60" rx="14" fill="url(#tr)"/><path d="M16 22l10 10-10 10M31 43h17" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    trash:`<svg viewBox="0 0 64 64"><defs><linearGradient id="ts" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f4f4f5"/><stop offset="1" stop-color="#bfc1c5"/></linearGradient></defs><path d="M17 18h30l-3 40H20z" fill="url(#ts)" stroke="#8f9297"/><path d="M14 15h36M25 10h14" stroke="#8f9297" stroke-width="4" stroke-linecap="round"/><path d="M25 25v25M32 25v25M39 25v25" stroke="#9a9da2" stroke-width="2"/></svg>`
  };
  const appAlias={about:'about',work:'work',photos:'photos',parker:'parker',career:'career',socials:'socials',tiktok:'tiktok',spotify:'spotify',notes:'notes',messages:'messages',weather:'weather',resume:'resume',terminal:'terminal',trash:'trash'};
  document.querySelectorAll('.desktop-icon,.dock button').forEach(el=>{
    const app=el.dataset.app; const host=el.querySelector('.app-icon,.file-icon');
    if(host&&iconSVG[appAlias[app]]) host.innerHTML=iconSVG[appAlias[app]];
  });

})();
