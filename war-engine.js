/* An original, fictional territory game. All combat numbers are game rules. */
(() => {
  "use strict";
  const regions=[
    {id:"AL",name:"Alaska",group:"AMERICAS",x:95,y:128,shape:"45,95 110,83 142,116 124,155 72,154",neighbors:["CA","SI"]},
    {id:"CA",name:"Canada",group:"AMERICAS",x:218,y:125,shape:"145,88 234,73 318,93 291,151 224,172 147,149",neighbors:["AL","US","EU"]},
    {id:"US",name:"United States",group:"AMERICAS",x:210,y:209,shape:"126,157 223,176 286,159 287,207 245,241 154,232 120,192",neighbors:["CA","MX"]},
    {id:"MX",name:"Central America",group:"AMERICAS",x:244,y:279,shape:"169,240 229,248 249,278 292,299 286,326 251,309 218,285",neighbors:["US","BR"]},
    {id:"BR",name:"Brazil",group:"AMERICAS",x:315,y:367,shape:"275,323 330,309 384,336 368,400 322,433 279,399 265,350",neighbors:["MX","AR","NA"]},
    {id:"AR",name:"Southern Cone",group:"AMERICAS",x:310,y:470,shape:"279,405 322,440 352,428 328,492 296,535 273,487",neighbors:["BR"]},
    {id:"EU",name:"Western Europe",group:"EUROPE",x:513,y:173,shape:"458,130 514,121 548,153 541,195 496,220 465,190",neighbors:["CA","EE","NA","ME"]},
    {id:"EE",name:"Eastern Europe",group:"EUROPE",x:597,y:150,shape:"550,109 614,95 653,119 644,167 600,196 550,184",neighbors:["EU","SI","ME"]},
    {id:"NA",name:"North Africa",group:"AFRICA",x:518,y:291,shape:"458,238 532,219 581,245 575,308 511,326 455,290",neighbors:["BR","EU","EA","SA","ME"]},
    {id:"EA",name:"East Africa",group:"AFRICA",x:602,y:355,shape:"582,265 621,268 651,316 628,375 584,405 552,369 564,321",neighbors:["NA","SA","ME","IN"]},
    {id:"SA",name:"Southern Africa",group:"AFRICA",x:554,y:445,shape:"506,334 548,374 580,410 616,390 588,462 543,496 515,435",neighbors:["NA","EA"]},
    {id:"ME",name:"Middle East",group:"ASIA",x:665,y:252,shape:"608,200 670,191 711,224 711,277 662,302 623,270",neighbors:["EU","EE","NA","EA","SI","CH","IN"]},
    {id:"SI",name:"Siberia",group:"ASIA",x:775,y:121,shape:"661,71 765,57 889,78 965,107 927,155 817,176 736,166 658,143",neighbors:["AL","EE","ME","CH","JP"]},
    {id:"CH",name:"China",group:"ASIA",x:801,y:226,shape:"721,174 815,183 902,170 928,206 880,266 816,297 755,262 716,214",neighbors:["SI","ME","IN","JP","AU"]},
    {id:"IN",name:"India",group:"ASIA",x:748,y:336,shape:"718,284 761,272 807,309 787,353 755,396 725,349",neighbors:["ME","EA","CH","AU"]},
    {id:"JP",name:"East Asia",group:"ASIA",x:948,y:264,shape:"938,179 966,187 981,220 970,281 999,308 974,334 942,300 949,246 924,210",neighbors:["SI","CH","AU"]},
    {id:"AU",name:"Australia",group:"PACIFIC",x:896,y:445,shape:"827,407 908,388 955,409 974,451 940,493 865,496 816,462",neighbors:["IN","CH","JP","NZ"]},
    {id:"NZ",name:"Oceania",group:"PACIFIC",x:1022,y:480,shape:"1013,423 1037,437 1028,473 1052,491 1041,519 1000,505 1008,474 991,453",neighbors:["AU"]}
  ];
  const groups={AMERICAS:3,EUROPE:2,AFRICA:2,ASIA:3,PACIFIC:2};
  const factions={human:"YOU",computer:"WOPR",neutral:"NEUTRAL"};
  const rules=`PLAN / COMMIT / WATCH
Deploy all reinforcements, then queue up to 4 actions. Nothing moves until commit.
Click a source and destination to choose troop count and preview combat.
One army stays to hold each region. Each army moves once per round.
Your queued deployments and assigned troops are shown separately from the real board.
Both sides plan independently. All deployments resolve first. Shields then activate.
Movement and launches interleave: priority reverses between action slots and between rounds.
Combat: attackers eliminate 60% of their number; defenders eliminate 70% of theirs, nearest whole number. Losses are simultaneous.
If both forces die, one defender remains. Capturing armies cannot move again this round.
Capture CH (WOPR HQ), or control 12 regions. WOPR targets US. 40 rounds is a stalemate.
Income: 3 + one per 3 regions + full-continent bonuses.

NUCLEAR ESCALATION / FICTIONAL GAME RULES
3 missiles per side; at most 1 launch per side per round.
A strike halves the target army (rounded up, minimum 1); it does not capture territory.
shield US protects one owned territory from one missile this round. One shield per side.
Launches and shields each use 1 action slot. A launch lowers shared DEFCON by 1, even if intercepted.
A round without launches restores DEFCON by 1 (maximum 5). At DEFCON 1, both sides lose.
WOPR can launch and defend too. Shield phases resolve before launches, regardless of queue position.

COMMANDS
 deploy CA 4 / attack CA EU 6 / move US CA 3
 shield US / strike CH / confirm strike / cancel
 remove 1 / up 2 / down 1 / undo / reset orders
 inspect EU / status / commit (or end) / rules / restart / exit
Escape returns to the desktop without ending the game. Expand resumes the large view.
Closing Terminal ends the session. No campaign is sent to a server.`;
  const clone=v=>JSON.parse(JSON.stringify(v));
  function createGame({seed=Date.now(),difficulty="standard"}={}) {
    seed=Number(seed)>>>0;let randomState=seed||1;
    const rand=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;};
    let round=1,defcon=5,outcome=null,pendingStrike=null,queue=[],deployments=[],events=[],serial=0;
    const arsenal={human:3,computer:3};let lastHumanLaunch=null;
    const map=Object.fromEntries(regions.map(r=>[r.id,{owner:"neutral",armies:2}]));
    for(const [id,armies] of [["CA",5],["US",7],["MX",3]])map[id]={owner:"human",armies};
    for(const [id,armies] of [["SI",5],["CH",7],["JP",3]])map[id]={owner:"computer",armies};
    for(const id of ["AL","AR","SA","NZ"])map[id].armies=1+Math.floor(rand()*3);
    const owned=who=>regions.filter(r=>map[r.id].owner===who);
    const bonuses=who=>Object.keys(groups).filter(g=>regions.filter(r=>r.group===g).every(r=>map[r.id].owner===who));
    const income=who=>3+Math.floor(owned(who).length/3)+bonuses(who).reduce((s,g)=>s+groups[g],0)+(who==="human"&&difficulty==="easy"?2:who==="computer"&&difficulty==="hard"?2:0);
    let budget=income("human");
    const reserves=()=>budget-deployments.reduce((s,d)=>s+d.count,0);
    const resolve=value=>map[String(value).toUpperCase()]?String(value).toUpperCase():regions.find(r=>r.name.toLowerCase()===String(value).toLowerCase())?.id;
    const adjacent=(a,b)=>regions.find(r=>r.id===a)?.neighbors.includes(b);
    const planned=id=>deployments.filter(d=>d.to===id).reduce((s,d)=>s+d.count,0);
    const assigned=id=>queue.filter(o=>o.from===id).reduce((s,o)=>s+o.count,0);
    const available=id=>map[id]?.owner==="human"?Math.max(0,map[id].armies+planned(id)-1-assigned(id)):0;
    const snapshot=()=>clone({round,defcon,difficulty,seed,outcome,pendingStrike,queue,deployments,arsenal,budget,reserves:reserves(),orders:4-queue.length,phase:"planning",first:round%2?"human":"computer",regions:regions.map(r=>({...r,...map[r.id],plannedDeploy:planned(r.id),assigned:assigned(r.id),available:available(r.id)})),human:{regions:owned("human").length,income:income("human"),bonuses:bonuses("human")},computer:{regions:owned("computer").length,income:income("computer"),bonuses:bonuses("computer")},events});
    const respond=(text,extra={})=>({text,war:snapshot(),...extra});
    const remember=text=>{events.push(text);events=events.slice(-12);};
    const previewBattle=(from,to,count)=>{
      const defenders=map[to].armies,remaining=Math.max(0,count-Math.round(defenders*.7)),defending=Math.max(0,defenders-Math.round(count*.6));
      return {remaining,defending:remaining===0&&defending===0?1:defending,capture:defending===0&&remaining>0};
    };
    const checkVictory=()=>{if(map.US.owner==="computer"||owned("computer").length>=12)outcome="defeat";else if(map.CH.owner==="human"||owned("human").length>=12)outcome="victory";};
    // This planner reads only the real start-of-round board, never the visitor's queue.
    function computerPlan(){
      const plan=[],ds=[],board=clone(map),avail={};let pool=income("computer");
      const frontline=owned("computer").filter(r=>r.neighbors.some(n=>board[n].owner!=="computer"));
      const strongest=frontline.sort((a,b)=>board[b.id].armies-board[a.id].armies)[0]||owned("computer")[0];
      const threat=regions.find(r=>r.id==="CH").neighbors.filter(n=>board[n].owner==="human").reduce((s,n)=>Math.max(s,board[n].armies-1),0);
      const defense=Math.min(pool,Math.max(0,Math.round(threat*.6)+1-board.CH.armies));
      if(defense){ds.push({type:"deploy",to:"CH",count:defense});board.CH.armies+=defense;pool-=defense;}
      if(pool){ds.push({type:"deploy",to:strongest.id,count:pool});board[strongest.id].armies+=pool;}
      for(const r of owned("computer"))avail[r.id]=board[r.id].armies-1;
      if(lastHumanLaunch || defcon<5){plan.push({type:"shield",to:lastHumanLaunch&&board[lastHumanLaunch].owner==="computer"?lastHumanLaunch:"CH"});}
      const enemy=owned("human").sort((a,b)=>board[b.id].armies-board[a.id].armies)[0];
      if(arsenal.computer>0 && enemy && defcon>2 && (lastHumanLaunch || board[enemy.id].armies>=12 || round>=5&&rand()<.2))plan.push({type:"strike",to:enemy.id});
      while(plan.length<4){
        const candidates=[];
        for(const r of owned("computer"))for(const n of r.neighbors){
          const count=avail[r.id];if(count<1||board[n].owner==="computer"||plan.some(o=>o.type==="attack"&&o.to===n))continue;
          if(Math.round(count*.6)>=board[n].armies && count>Math.round(board[n].armies*.7))candidates.push({type:"attack",from:r.id,to:n,count,score:(n==="US"?100:0)+(board[n].owner==="human"?10:4)+count*.2+rand()});
        }
        candidates.sort((a,b)=>b.score-a.score);
        if(candidates.length){const o=candidates[0];plan.push(o);avail[o.from]-=o.count;continue;}
        const interior=owned("computer").filter(r=>avail[r.id]>0&&r.neighbors.every(n=>board[n].owner==="computer"));
        let transfer=null;
        for(const r of interior){const n=r.neighbors.find(n=>regions.find(t=>t.id===n).neighbors.some(k=>board[k].owner!=="computer"));if(n){transfer={type:"move",from:r.id,to:n,count:avail[r.id]};break;}}
        if(!transfer)break;plan.push(transfer);avail[transfer.from]=0;
      }
      return {queue:plan,deployments:ds};
    }
    function commit(){
      if(reserves()>0)return respond(`DEPLOY ${reserves()} REINFORCEMENTS FIRST.`);
      const ai=computerPlan(),human=clone(queue),humanDeploy=clone(deployments),resolution=[];
      queue=[];deployments=[];pendingStrike=null;
      const frame=(text,type,who,from,to)=>{remember(text);resolution.push({text,type,who,from,to,war:{...snapshot(),phase:"resolving"}});};
      frame(`ROUND ${round}: both plans locked. ${factions[round%2?"human":"computer"]} has first action priority.`,"lock");
      const sides=round%2?["human","computer"]:["computer","human"],plans={human,computer:ai.queue},ds={human:humanDeploy,computer:ai.deployments};
      for(const who of sides)for(const d of ds[who]){map[d.to].armies+=d.count;frame(`${factions[who]} DEPLOY ${d.to}: +${d.count}.`,"deploy",who,null,d.to);}
      const movable={human:{},computer:{}};for(const who of sides)for(const r of owned(who))movable[who][r.id]=map[r.id].armies-1;
      const shields={human:new Set(),computer:new Set()};
      for(const who of sides)for(const o of plans[who].filter(o=>o.type==="shield")){if(map[o.to].owner===who){shields[who].add(o.to);frame(`${factions[who]} SHIELD ${o.to}: interception active this round.`,"shield",who,null,o.to);}}
      let launches=0,newHumanLaunch=null;
      for(let slot=0;slot<4&&!outcome;slot++)for(const who of (slot%2?[...sides].reverse():sides)){
        if(outcome)break;const o=plans[who][slot];if(!o||o.type==="shield")continue;
        const other=who==="human"?"computer":"human";
        if(o.type==="strike"){
          if(arsenal[who]<1){frame(`${factions[who]} LAUNCH CANCELLED: arsenal empty.`,"cancel",who,null,o.to);continue;}
          if(map[o.to].owner!==other){frame(`${factions[who]} LAUNCH ${o.to} CANCELLED: target no longer hostile.`,"cancel",who,null,o.to);continue;}
          arsenal[who]--;launches++;defcon=Math.max(1,defcon-1);if(who==="human")newHumanLaunch=o.to;
          const blocked=shields[other].delete(o.to);if(!blocked){map[o.to].armies=Math.max(1,Math.ceil(map[o.to].armies/2));movable[other][o.to]=Math.min(movable[other][o.to]||0,map[o.to].armies-1);}
          if(defcon===1)outcome="mutual";
          frame(`${factions[who]} LAUNCH > ${o.to}: ${blocked?"INTERCEPTED":"army halved"}. DEFCON ${defcon}.${outcome?" MUTUAL DESTRUCTION. NO WINNER.":""}`,blocked?"intercept":"strike",who,who==="human"?"US":"CH",o.to);continue;
        }
        const source=map[o.from],target=map[o.to];
        if(source.owner!==who){frame(`${factions[who]} ${o.from} > ${o.to} CANCELLED: source captured.`,"cancel",who,o.from,o.to);continue;}
        if(o.type==="move"&&target.owner!==who || o.type==="attack"&&target.owner===who){frame(`${factions[who]} ${o.from} > ${o.to} CANCELLED: target ownership changed.`,"cancel",who,o.from,o.to);continue;}
        const count=Math.min(o.count,movable[who][o.from]||0,source.armies-1);
        if(count<1){frame(`${factions[who]} ${o.from} > ${o.to} CANCELLED: no available troops.`,"cancel",who,o.from,o.to);continue;}
        source.armies-=count;movable[who][o.from]-=count;
        if(o.type==="move"){target.armies+=count;frame(`${factions[who]} TRANSFER ${o.from} > ${o.to}: ${count}. Arrivals can move next round.`,"move",who,o.from,o.to);continue;}
        const fight=previewBattle(o.from,o.to,count);let text;
        if(fight.capture){target.owner=who;target.armies=fight.remaining;movable[who][o.to]=0;movable[other][o.to]=0;text=`${factions[who]} CAPTURE ${o.from} > ${o.to}: ${fight.remaining} survivors.`;}
        else{target.armies=Math.max(1,fight.defending);source.armies+=fight.remaining;movable[other][o.to]=Math.min(movable[other][o.to]||0,target.armies-1);text=`${factions[who]} ATTACK ${o.from} > ${o.to}: repelled; ${fight.remaining} return, ${target.armies} defend.`;}
        checkVictory();frame(text+(count<o.count?` Sent ${count}/${o.count}: earlier losses reduced troops.`:""),fight.capture?"capture":"attack",who,o.from,o.to);
      }
      lastHumanLaunch=newHumanLaunch;
      if(!launches&&!outcome){defcon=Math.min(5,defcon+1);frame(`NO LAUNCHES: tension eases to DEFCON ${defcon}.`,"cooldown");}
      if(!outcome){round++;if(round>40)outcome="stalemate";budget=income("human");}
      const text=outcome?({victory:"CAMPAIGN WON",defeat:"WOPR WINS",mutual:"MUTUAL DESTRUCTION. NO WINNER",stalemate:"FORTY ROUNDS: STALEMATE"}[outcome]):`ROUND ${round}: planning your orders. Deploy ${budget} reinforcements.`;
      remember(text);return respond(text,{resolution});
    }
    function handle(raw){
      const text=String(raw).toLowerCase().trim().replace(/\s+/g," ");
      if(/^(help|rules|how to play)$/.test(text))return respond(rules);
      if(/^(status|map|sitrep)$/.test(text))return respond(`ROUND ${round}: planning / ${reserves()} to deploy / ${queue.length}/4 actions queued / DEFCON ${defcon}. Nothing executes until commit.`);
      const inspect=text.match(/^(?:inspect|info) (.+)$/);if(inspect){const id=resolve(inspect[1]);if(!id)return respond("UNKNOWN REGION.");const r=regions.find(r=>r.id===id);return respond(`${id} / ${r.name} / ${factions[map[id].owner]}\n${map[id].armies} total + ${planned(id)} planned deployment / ${assigned(id)} assigned / ${available(id)} available\nConnected: ${r.neighbors.join(" / ")}\n${r.group}: +${groups[r.group]} when fully controlled.`);}
      if(outcome)return respond("CAMPAIGN COMPLETE. Type restart or exit.");
      if(/^(commit|end|end turn|done|next)$/.test(text))return commit();
      if(text==="reset orders"){queue=[];deployments=[];pendingStrike=null;return respond("PLAN CLEARED. The real board is unchanged.");}
      if(text==="cancel"){pendingStrike=null;return respond("LAUNCH REQUEST CANCELLED.");}
      const edit=text.match(/^(remove|up|down) (\d+)$/);
      if(edit){const i=Number(edit[2])-1;if(!queue[i])return respond("NO ORDER AT THAT POSITION.");if(edit[1]==="remove")queue.splice(i,1);else{const j=i+(edit[1]==="up"?-1:1);if(j>=0&&j<queue.length)[queue[i],queue[j]]=[queue[j],queue[i]];}pendingStrike=null;return respond("ORDER QUEUE UPDATED. Nothing has executed.");}
      if(text==="undo"){if(queue.length)queue.pop();else deployments.pop();pendingStrike=null;return respond("LAST PLANNED ORDER REMOVED.");}
      const undeploy=text.match(/^undeploy (\d+)$/);if(undeploy){const i=Number(undeploy[1])-1,d=deployments[i];if(!d)return respond("NO DEPLOYMENT AT THAT POSITION.");if(assigned(d.to)>map[d.to].armies+planned(d.to)-d.count-1)return respond("REMOVE THAT REGION’S MOVEMENT ORDERS FIRST.");deployments.splice(i,1);return respond("DEPLOYMENT REMOVED.");}
      const deploy=text.match(/^(?:deploy|reinforce|place) ([a-z]{2}) (\d+)$/);
      if(deploy){const id=resolve(deploy[1]),count=Number(deploy[2]);if(!id||map[id].owner!=="human")return respond("DEPLOY ONLY TO YOUR REGIONS.");if(!Number.isSafeInteger(count)||count<1||count>reserves())return respond(`INVALID DEPLOYMENT: ${reserves()} remaining.`);deployments.push({id:++serial,type:"deploy",to:id,count});return respond(`QUEUED: deploy ${id} +${count}. ${reserves()} remain. Board changes on commit.`);}
      const strike=text.match(/^(?:strike|nuke|launch) ([a-z]{2})$/);
      if(strike){const id=resolve(strike[1]);if(!id||map[id].owner!=="computer")return respond("SELECT A WOPR TERRITORY.");if(!arsenal.human)return respond("ARSENAL EMPTY.");if(queue.some(o=>o.type==="strike"))return respond("ONE LAUNCH PER ROUND.");if(queue.length===4)return respond("FOUR ACTIONS QUEUED. Remove one before requesting a launch.");pendingStrike=id;return respond(`LAUNCH REQUEST: ${id}. Costs 1 missile and 1 action. Lowers DEFCON by 1, even if intercepted.\n${defcon<=2?"WARNING: this launch reaches DEFCON 1; both sides lose.":"WOPR may retaliate this or a later round."}\nconfirm strike queues it; cancel withdraws it.`);}
      if(text==="confirm strike"){if(!pendingStrike)return respond("NO LAUNCH REQUEST.");if(queue.length===4)return respond("FOUR ACTIONS QUEUED.");const id=pendingStrike;pendingStrike=null;queue.push({id:++serial,type:"strike",to:id});return respond(`QUEUED LAUNCH > ${id}. Nothing fires until commit.`);}
      const shield=text.match(/^shield ([a-z]{2})$/);
      if(shield){const id=resolve(shield[1]);if(!id||map[id].owner!=="human")return respond("SHIELD ONLY YOUR TERRITORIES.");if(queue.some(o=>o.type==="shield"))return respond("ONE SHIELD PER ROUND.");if(queue.length===4)return respond("FOUR ACTIONS QUEUED.");queue.push({id:++serial,type:"shield",to:id});pendingStrike=null;return respond(`QUEUED SHIELD ${id}. Blocks 1 missile this round; activates before launches.`);}
      const action=text.match(/^(attack|move|transfer) ([a-z]{2}) (?:to )?([a-z]{2}) (\d+)$/);
      if(action){const type=action[1]==="transfer"?"move":action[1],from=resolve(action[2]),to=resolve(action[3]),count=Number(action[4]);if(reserves()>0)return respond(`DEPLOY ${reserves()} REINFORCEMENTS FIRST.`);if(queue.length===4)return respond("FOUR ACTIONS QUEUED. Review, then commit.");if(!from||!to)return respond("UNKNOWN REGION.");if(map[from].owner!=="human")return respond("SOURCE NOT OWNED.");if(!adjacent(from,to))return respond("NO DIRECT ROUTE.");if(type==="move"&&map[to].owner!=="human" || type==="attack"&&map[to].owner==="human")return respond("TARGET OWNERSHIP DOES NOT MATCH ORDER TYPE.");if(!Number.isSafeInteger(count)||count<1||count>available(from))return respond(`NOT ENOUGH AVAILABLE TROOPS: ${available(from)}. Leave one guard; assigned armies move once.`);queue.push({id:++serial,type,from,to,count});pendingStrike=null;return respond(`QUEUED ${type.toUpperCase()} ${from} > ${to}: ${count}. ${queue.length}/4 actions. Review, then commit.`);}
      return respond("ORDER NOT RECOGNIZED. deploy / attack / move / shield / strike / commit / rules");
    }
    return {handle,snapshot,income,previewBattle,opening:()=>respond(`GLOBAL THERMONUCLEAR WAR / ${difficulty.toUpperCase()}\nPLAN → COMMIT → WATCH\nDeploy ${budget} reinforcements. Queue up to 4 actions, then commit.\nClick a territory to start. The real board stays unchanged while planning.\nCapture CH or control 12 regions. Type rules for the manual.`)};
  }
  globalThis.RizvisionsWar={createGame,regions,groups,rules};
})();
