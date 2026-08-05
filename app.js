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
})();
