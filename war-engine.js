/* An original, fictional territory game. All combat numbers are game rules. */
(() => {
  "use strict";
  const regions=[
  {
    "id": "AL",
    "name": "Alaska",
    "group": "AMERICAS",
    "x": 95,
    "y": 128,
    "shape": "45,95 110,83 142,116 124,155 72,154",
    "neighbors": [
      "CA",
      "SI"
    ]
  },
  {
    "id": "CA",
    "name": "Canada",
    "group": "AMERICAS",
    "x": 218,
    "y": 125,
    "shape": "145,88 234,73 318,93 291,151 224,172 147,149",
    "neighbors": [
      "AL",
      "US",
      "EU",
      "GL",
      "UK"
    ]
  },
  {
    "id": "US",
    "name": "United States",
    "group": "AMERICAS",
    "x": 210,
    "y": 209,
    "shape": "126,157 223,176 286,159 287,207 245,241 154,232 120,192",
    "neighbors": [
      "CA",
      "MX"
    ]
  },
  {
    "id": "MX",
    "name": "Central America",
    "group": "AMERICAS",
    "x": 244,
    "y": 279,
    "shape": "169,240 229,248 249,278 292,299 286,326 251,309 218,285",
    "neighbors": [
      "US",
      "BR",
      "CO"
    ]
  },
  {
    "id": "BR",
    "name": "Brazil",
    "group": "AMERICAS",
    "x": 330,
    "y": 370,
    "shape": "300,325 345,322 384,336 368,400 322,433 300,395",
    "neighbors": [
      "MX",
      "AR",
      "NA",
      "CO",
      "VE",
      "PE",
      "WA"
    ]
  },
  {
    "id": "AR",
    "name": "Southern Cone",
    "group": "AMERICAS",
    "x": 310,
    "y": 470,
    "shape": "279,405 322,440 352,428 328,492 296,535 273,487",
    "neighbors": [
      "BR",
      "PE"
    ]
  },
  {
    "id": "EU",
    "name": "Western Europe",
    "group": "EUROPE",
    "x": 513,
    "y": 173,
    "shape": "458,130 514,121 548,153 541,195 496,220 465,190",
    "neighbors": [
      "CA",
      "EE",
      "NA",
      "ME",
      "UK",
      "SC"
    ]
  },
  {
    "id": "EE",
    "name": "Eastern Europe",
    "group": "EUROPE",
    "x": 588,
    "y": 166,
    "shape": "550,140 607,130 642,145 630,178 591,197 550,184",
    "neighbors": [
      "EU",
      "SI",
      "ME",
      "SC",
      "KA"
    ]
  },
  {
    "id": "NA",
    "name": "North Africa",
    "group": "AFRICA",
    "x": 500,
    "y": 283,
    "shape": "458,238 532,219 538,279 511,309 455,290",
    "neighbors": [
      "BR",
      "EU",
      "EA",
      "SA",
      "ME",
      "WA",
      "EG"
    ]
  },
  {
    "id": "EA",
    "name": "East Africa",
    "group": "AFRICA",
    "x": 604,
    "y": 352,
    "shape": "580,290 621,290 651,316 628,375 589,405 570,354",
    "neighbors": [
      "NA",
      "SA",
      "ME",
      "IN",
      "WA",
      "EG",
      "MG"
    ]
  },
  {
    "id": "SA",
    "name": "Southern Africa",
    "group": "AFRICA",
    "x": 554,
    "y": 445,
    "shape": "506,334 548,374 580,410 616,390 588,462 543,496 515,435",
    "neighbors": [
      "NA",
      "EA",
      "WA",
      "MG"
    ]
  },
  {
    "id": "ME",
    "name": "Middle East",
    "group": "ASIA",
    "x": 650,
    "y": 252,
    "shape": "608,200 650,195 685,230 681,278 646,297 623,270",
    "neighbors": [
      "EU",
      "EE",
      "NA",
      "EA",
      "SI",
      "CH",
      "IN",
      "EG",
      "KA"
    ]
  },
  {
    "id": "SI",
    "name": "Siberia",
    "group": "ASIA",
    "x": 776,
    "y": 113,
    "shape": "661,71 765,57 889,78 965,107 927,148 820,147 736,137 658,125",
    "neighbors": [
      "AL",
      "EE",
      "ME",
      "CH",
      "JP",
      "SC",
      "KA",
      "MO",
      "KR"
    ]
  },
  {
    "id": "CH",
    "name": "China",
    "group": "ASIA",
    "x": 805,
    "y": 238,
    "shape": "733,208 815,206 899,195 918,222 880,266 816,297 755,262",
    "neighbors": [
      "SI",
      "ME",
      "IN",
      "JP",
      "AU",
      "KA",
      "MO",
      "KR",
      "SE"
    ]
  },
  {
    "id": "IN",
    "name": "India",
    "group": "ASIA",
    "x": 741,
    "y": 333,
    "shape": "707,282 749,272 780,309 765,350 750,396 725,349",
    "neighbors": [
      "ME",
      "EA",
      "CH",
      "AU",
      "SE"
    ]
  },
  {
    "id": "JP",
    "name": "Japan",
    "group": "ASIA",
    "x": 973,
    "y": 251,
    "shape": "969,190 985,215 977,247 997,272 981,286 964,263",
    "neighbors": [
      "SI",
      "CH",
      "AU",
      "KR",
      "SE",
      "ID"
    ]
  },
  {
    "id": "AU",
    "name": "Australia",
    "group": "PACIFIC",
    "x": 896,
    "y": 445,
    "shape": "827,407 908,388 955,409 974,451 940,493 865,496 816,462",
    "neighbors": [
      "IN",
      "CH",
      "JP",
      "NZ",
      "ID"
    ]
  },
  {
    "id": "NZ",
    "name": "Oceania",
    "group": "PACIFIC",
    "x": 1022,
    "y": 480,
    "shape": "1013,423 1037,437 1028,473 1052,491 1041,519 1000,505 1008,474 991,453",
    "neighbors": [
      "AU"
    ]
  },
  {
    "id": "GL",
    "name": "Greenland",
    "group": "AMERICAS",
    "x": 365,
    "y": 93,
    "shape": "330,48 391,40 413,72 380,126 340,120",
    "neighbors": [
      "CA",
      "SC"
    ]
  },
  {
    "id": "CO",
    "name": "Colombia",
    "group": "AMERICAS",
    "x": 282,
    "y": 325,
    "shape": "255,304 291,300 304,328 279,349 256,340",
    "neighbors": [
      "MX",
      "VE",
      "PE",
      "BR"
    ]
  },
  {
    "id": "VE",
    "name": "Venezuela",
    "group": "AMERICAS",
    "x": 329,
    "y": 296,
    "shape": "299,284 339,282 366,307 340,322 302,319",
    "neighbors": [
      "CO",
      "BR"
    ]
  },
  {
    "id": "PE",
    "name": "Peru",
    "group": "AMERICAS",
    "x": 278,
    "y": 382,
    "shape": "252,345 277,350 297,335 300,393 285,415 265,399",
    "neighbors": [
      "CO",
      "BR",
      "AR"
    ]
  },
  {
    "id": "UK",
    "name": "British Isles",
    "group": "EUROPE",
    "x": 435,
    "y": 152,
    "shape": "421,121 441,114 451,145 445,175 418,174",
    "neighbors": [
      "CA",
      "EU",
      "SC"
    ]
  },
  {
    "id": "SC",
    "name": "Scandinavia",
    "group": "EUROPE",
    "x": 558,
    "y": 98,
    "shape": "529,66 562,51 596,68 610,102 577,132 547,119",
    "neighbors": [
      "GL",
      "UK",
      "EU",
      "EE",
      "SI"
    ]
  },
  {
    "id": "WA",
    "name": "West Africa",
    "group": "AFRICA",
    "x": 471,
    "y": 350,
    "shape": "445,297 487,312 523,321 512,368 478,388 453,355",
    "neighbors": [
      "NA",
      "BR",
      "EA",
      "SA"
    ]
  },
  {
    "id": "EG",
    "name": "Egypt",
    "group": "AFRICA",
    "x": 559,
    "y": 257,
    "shape": "539,223 581,245 581,282 543,287",
    "neighbors": [
      "NA",
      "ME",
      "EA"
    ]
  },
  {
    "id": "MG",
    "name": "Madagascar",
    "group": "AFRICA",
    "x": 665,
    "y": 438,
    "shape": "657,405 676,399 682,426 669,468 650,458",
    "neighbors": [
      "EA",
      "SA"
    ]
  },
  {
    "id": "KA",
    "name": "Central Asia",
    "group": "ASIA",
    "x": 702,
    "y": 185,
    "shape": "649,143 730,148 766,180 733,205 690,214 650,190",
    "neighbors": [
      "EE",
      "SI",
      "ME",
      "CH",
      "MO"
    ]
  },
  {
    "id": "MO",
    "name": "Mongolia",
    "group": "ASIA",
    "x": 820,
    "y": 176,
    "shape": "767,150 832,151 901,150 902,190 815,201 761,202",
    "neighbors": [
      "SI",
      "KA",
      "CH"
    ]
  },
  {
    "id": "KR",
    "name": "Korea",
    "group": "ASIA",
    "x": 936,
    "y": 226,
    "shape": "926,189 947,190 956,220 948,251 926,244",
    "neighbors": [
      "CH",
      "JP",
      "SI"
    ]
  },
  {
    "id": "SE",
    "name": "Southeast Asia",
    "group": "ASIA",
    "x": 829,
    "y": 329,
    "shape": "788,301 816,299 855,319 875,351 848,375 815,351 797,335",
    "neighbors": [
      "IN",
      "CH",
      "JP",
      "ID"
    ]
  },
  {
    "id": "ID",
    "name": "Indonesia",
    "group": "PACIFIC",
    "x": 876,
    "y": 386,
    "shape": "817,366 850,376 890,363 942,373 970,392 930,401 881,389 846,397",
    "neighbors": [
      "SE",
      "AU",
      "JP"
    ]
  }
];
  const victoryTarget=Math.ceil(regions.length*2/3);
  const groups={AMERICAS:5,EUROPE:3,AFRICA:4,ASIA:6,PACIFIC:2};
  const factions={human:"YOU",computer:"WOPR",neutral:"NEUTRAL"};
  const rules=`PLAN / COMMIT / WATCH
Deploy reinforcements instantly, then queue up to 4 actions. Attacks, transfers and launches wait for commit.
Click a source and destination to choose troop count and preview combat.
One army stays to hold each region. Each army moves once per round.
Deployed troops are included in the map count immediately. You can undo deployment before committing.
Both sides plan independently. WOPR reveals its deployment on commit. Shields then activate.
Movement and launches interleave: priority reverses between action slots and between rounds.
Combat: attackers eliminate 60% of their number; defenders eliminate 70% of theirs, nearest whole number. Losses are simultaneous.
If both forces die, one defender remains. Capturing armies cannot move again this round.
Capture CH (WOPR HQ), or control ${victoryTarget} of ${regions.length} regions. WOPR targets US. 40 rounds is a stalemate.
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
    const stats={captures:0,losses:0,troopsLost:0,enemyTroopsLost:0,launches:0};
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
    let roundStartMap=clone(map);
    const available=id=>map[id]?.owner==="human"?Math.max(0,map[id].armies-1-assigned(id)):0;
    const snapshot=()=>clone({stats,victoryTarget,round,defcon,difficulty,seed,outcome,pendingStrike,queue,deployments,arsenal,budget,reserves:reserves(),orders:4-queue.length,phase:"planning",first:round%2?"human":"computer",regions:regions.map(r=>({...r,...map[r.id],deployed:planned(r.id),assigned:assigned(r.id),available:available(r.id)})),human:{regions:owned("human").length,income:income("human"),bonuses:bonuses("human")},computer:{regions:owned("computer").length,income:income("computer"),bonuses:bonuses("computer")},events});
    const respond=(text,extra={})=>({text,war:snapshot(),...extra});
    const remember=text=>{events.push(text);events=events.slice(-12);};
    const previewBattle=(from,to,count)=>{
      const defenders=map[to].armies,remaining=Math.max(0,count-Math.round(defenders*.7)),defending=Math.max(0,defenders-Math.round(count*.6));
      return {remaining,defending:remaining===0&&defending===0?1:defending,capture:defending===0&&remaining>0};
    };
    const checkVictory=()=>{if(map.US.owner==="computer"||owned("computer").length>=victoryTarget)outcome="defeat";else if(map.CH.owner==="human"||owned("human").length>=victoryTarget)outcome="victory";};
    // This planner reads only the real start-of-round board, never the visitor's queue.
    function computerPlan(){
      const plan=[],ds=[],board=clone(roundStartMap),avail={};let pool=income("computer");
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
        for(const r of interior){const visited=new Set([r.id]),routes=r.neighbors.filter(n=>board[n].owner==="computer").map(n=>({id:n,first:n}));let destination=null;
          while(routes.length){const step=routes.shift();if(visited.has(step.id))continue;visited.add(step.id);const t=regions.find(t=>t.id===step.id);if(t.neighbors.some(k=>board[k].owner!=="computer")){destination=step.first;break;}for(const n of t.neighbors)if(board[n].owner==="computer"&&!visited.has(n))routes.push({id:n,first:step.first});}
          if(destination){transfer={type:"move",from:r.id,to:destination,count:avail[r.id]};break;}}
        if(!transfer)break;plan.push(transfer);avail[transfer.from]=0;
      }
      return {queue:plan,deployments:ds};
    }
    function commit(){
      if(reserves()>0)return respond(`DEPLOY ${reserves()} REINFORCEMENTS FIRST.`);
      const ai=computerPlan(),human=clone(queue),resolution=[];
      queue=[];deployments=[];pendingStrike=null;
      let previous={...snapshot(),phase:"resolving"};
      const frame=(text,type,who,from,to,detail={})=>{const after={...snapshot(),phase:"resolving"};const changes=after.regions.flatMap(r=>{const before=previous.regions.find(t=>t.id===r.id);return before.armies!==r.armies||before.owner!==r.owner?[{id:r.id,name:r.name,armiesBefore:before.armies,armiesAfter:r.armies,ownerBefore:before.owner,ownerAfter:r.owner}]:[];});remember(text);resolution.push({text,type,who,from,to,detail,changes,beforeWar:previous,war:after});previous=after;};
      frame(`ROUND ${round}: both plans locked. ${factions[round%2?"human":"computer"]} has first action priority.`,"lock");
      const sides=round%2?["human","computer"]:["computer","human"],plans={human,computer:ai.queue};
      for(const d of ai.deployments){map[d.to].armies+=d.count;frame(`WOPR DEPLOYS ${d.count} TO ${d.to}. ${map[d.to].armies} armies now.`,"deploy","computer",null,d.to,{sent:d.count});}
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
          arsenal[who]--;launches++;if(who==="human")stats.launches++;defcon=Math.max(1,defcon-1);if(who==="human")newHumanLaunch=o.to;
          const beforeArmy=map[o.to].armies,blocked=shields[other].delete(o.to);if(!blocked){map[o.to].armies=Math.max(1,Math.ceil(map[o.to].armies/2));movable[other][o.to]=Math.min(movable[other][o.to]||0,map[o.to].armies-1);}
          if(!blocked){if(other==="human")stats.troopsLost+=beforeArmy-map[o.to].armies;else stats.enemyTroopsLost+=beforeArmy-map[o.to].armies;}
          if(defcon===1)outcome="mutual";
          frame(`${factions[who]} LAUNCH > ${o.to}: ${blocked?"INTERCEPTED":`${beforeArmy} → ${map[o.to].armies} armies`}. DEFCON ${defcon}.${outcome?" MUTUAL DESTRUCTION. NO WINNER.":""}`,blocked?"intercept":"strike",who,who==="human"?"US":"CH",o.to,{defconBefore:defcon+1,defconAfter:defcon,blocked,defendersLost:beforeArmy-map[o.to].armies});continue;
        }
        const source=map[o.from],target=map[o.to];
        if(source.owner!==who){frame(`${factions[who]} ${o.from} > ${o.to} CANCELLED: source captured.`,"cancel",who,o.from,o.to);continue;}
        if(o.type==="move"&&target.owner!==who || o.type==="attack"&&target.owner===who){frame(`${factions[who]} ${o.from} > ${o.to} CANCELLED: target ownership changed.`,"cancel",who,o.from,o.to);continue;}
        const count=Math.min(o.count,movable[who][o.from]||0,source.armies-1);
        if(count<1){frame(`${factions[who]} ${o.from} > ${o.to} CANCELLED: no available troops.`,"cancel",who,o.from,o.to);continue;}
        source.armies-=count;movable[who][o.from]-=count;
        if(o.type==="move"){target.armies+=count;frame(`${factions[who]} TRANSFERS ${count}: ${o.from} > ${o.to}. ${source.armies} stay; ${target.armies} at destination. Arrivals move next round.`,"move",who,o.from,o.to,{sent:count,requested:o.count});continue;}
        const defendingBefore=target.armies,fight=previewBattle(o.from,o.to,count);let text;
        if(fight.capture){target.owner=who;target.armies=fight.remaining;movable[who][o.to]=0;movable[other][o.to]=0;text=`${factions[who]} CAPTURE ${o.from} > ${o.to}: ${fight.remaining} survivors.`;}
        else{target.armies=Math.max(1,fight.defending);source.armies+=fight.remaining;movable[other][o.to]=Math.min(movable[other][o.to]||0,target.armies-1);text=`${factions[who]} ATTACK ${o.from} > ${o.to}: repelled; ${fight.remaining} return, ${target.armies} defend.`;}
        if(fight.capture){if(who==="human")stats.captures++;else if(other==="human" && defendingBefore>0 && previous.regions.find(r=>r.id===o.to).owner==="human")stats.losses++;}
        stats.troopsLost+=who==="human"?count-fight.remaining:previous.regions.find(r=>r.id===o.to).owner==="human"?defendingBefore-fight.defending:0;
        stats.enemyTroopsLost+=who==="computer"?count-fight.remaining:previous.regions.find(r=>r.id===o.to).owner==="computer"?defendingBefore-fight.defending:0;
        checkVictory();frame(text+(count<o.count?` Sent ${count}/${o.count}: earlier losses reduced troops.`:""),fight.capture?"capture":"attack",who,o.from,o.to,{sent:count,requested:o.count,attackersLost:count-fight.remaining,defendersLost:defendingBefore-fight.defending,capture:fight.capture});
      }
      lastHumanLaunch=newHumanLaunch;
      if(!launches&&!outcome){defcon=Math.min(5,defcon+1);frame(`NO LAUNCHES: tension eases to DEFCON ${defcon}.`,"cooldown");}
      if(!outcome){round++;if(round>40)outcome="stalemate";budget=income("human");roundStartMap=clone(map);}
      const text=outcome?({victory:"CAMPAIGN WON",defeat:"WOPR WINS",mutual:"MUTUAL DESTRUCTION. NO WINNER",stalemate:"FORTY ROUNDS: STALEMATE"}[outcome]):`ROUND ${round}: planning your orders. Deploy ${budget} reinforcements.`;
      remember(text);return respond(text,{resolution});
    }
    function handle(raw){
      const text=String(raw).toLowerCase().trim().replace(/\s+/g," ");
      if(/^(help|rules|how to play)$/.test(text))return respond(rules);
      if(/^(status|map|sitrep)$/.test(text))return respond(`ROUND ${round}: planning / ${reserves()} to deploy / ${queue.length}/4 actions queued / DEFCON ${defcon}. Deployment is immediate; actions execute on commit.`);
      const inspect=text.match(/^(?:inspect|info) (.+)$/);if(inspect){const id=resolve(inspect[1]);if(!id)return respond("UNKNOWN REGION.");const r=regions.find(r=>r.id===id);return respond(`${id} / ${r.name} / ${factions[map[id].owner]}\n${map[id].armies} armies now (${planned(id)} deployed this round) / ${assigned(id)} assigned / ${available(id)} available\nConnected: ${r.neighbors.join(" / ")}\n${r.group}: +${groups[r.group]} when fully controlled.`);}
      if(outcome)return respond("CAMPAIGN COMPLETE. Type restart or exit.");
      if(/^(commit|end|end turn|done|next)$/.test(text))return commit();
      if(text==="reset orders"){queue=[];for(const d of deployments)map[d.to].armies-=d.count;deployments=[];pendingStrike=null;return respond("PLAN RESET. Deployments returned to your reinforcement pool; all queued actions removed.");}
      if(text==="cancel"){pendingStrike=null;return respond("LAUNCH REQUEST CANCELLED.");}
      const edit=text.match(/^(remove|up|down) (\d+)$/);
      if(edit){const i=Number(edit[2])-1;if(!queue[i])return respond("NO ORDER AT THAT POSITION.");if(edit[1]==="remove")queue.splice(i,1);else{const j=i+(edit[1]==="up"?-1:1);if(j>=0&&j<queue.length)[queue[i],queue[j]]=[queue[j],queue[i]];}pendingStrike=null;return respond("ORDER QUEUE UPDATED. Nothing has executed.");}
      if(text==="undo"){if(queue.length)queue.pop();else{const d=deployments.pop();if(d)map[d.to].armies-=d.count;}pendingStrike=null;return respond("LAST ACTION OR DEPLOYMENT UNDONE.");}
      const undeploy=text.match(/^undeploy (\d+)$/);if(undeploy){const i=Number(undeploy[1])-1,d=deployments[i];if(!d)return respond("NO DEPLOYMENT AT THAT POSITION.");if(assigned(d.to)>map[d.to].armies-d.count-1)return respond("REMOVE THAT REGION’S MOVEMENT ORDERS FIRST.");map[d.to].armies-=d.count;deployments.splice(i,1);return respond("DEPLOYMENT UNDONE. Troops returned to your reinforcement pool.");}
      const deploy=text.match(/^(?:deploy|reinforce|place) ([a-z]{2}) (\d+)$/);
      if(deploy){const id=resolve(deploy[1]),count=Number(deploy[2]);if(!id||map[id].owner!=="human")return respond("DEPLOY ONLY TO YOUR REGIONS.");if(!Number.isSafeInteger(count)||count<1||count>reserves())return respond(`INVALID DEPLOYMENT: ${reserves()} remaining.`);map[id].armies+=count;deployments.push({id:++serial,type:"deploy",to:id,count});return respond(`DEPLOYED ${count} TO ${id}. ${map[id].armies} armies now; ${reserves()} reinforcements remain. You can undo before Commit.`);}
      const strike=text.match(/^(?:strike|nuke|launch) ([a-z]{2})$/);
      if(strike){const id=resolve(strike[1]);if(!id||map[id].owner!=="computer")return respond("SELECT A WOPR TERRITORY.");if(!arsenal.human)return respond("ARSENAL EMPTY.");if(queue.some(o=>o.type==="strike"))return respond("ONE LAUNCH PER ROUND.");if(queue.length===4)return respond("FOUR ACTIONS QUEUED. Remove one before requesting a launch.");pendingStrike=id;return respond(`LAUNCH REQUEST: ${id}. Costs 1 missile and 1 action. Lowers DEFCON by 1, even if intercepted.\n${defcon<=2?"WARNING: this launch reaches DEFCON 1; both sides lose.":"WOPR may retaliate this or a later round."}\nconfirm strike queues it; cancel withdraws it.`);}
      if(text==="confirm strike"){if(!pendingStrike)return respond("NO LAUNCH REQUEST.");if(queue.length===4)return respond("FOUR ACTIONS QUEUED.");const id=pendingStrike;pendingStrike=null;queue.push({id:++serial,type:"strike",to:id});return respond(`QUEUED LAUNCH > ${id}. Nothing fires until commit.`);}
      const shield=text.match(/^shield ([a-z]{2})$/);
      if(shield){const id=resolve(shield[1]);if(!id||map[id].owner!=="human")return respond("SHIELD ONLY YOUR TERRITORIES.");if(queue.some(o=>o.type==="shield"))return respond("ONE SHIELD PER ROUND.");if(queue.length===4)return respond("FOUR ACTIONS QUEUED.");queue.push({id:++serial,type:"shield",to:id});pendingStrike=null;return respond(`QUEUED SHIELD ${id}. Blocks 1 missile this round; activates before launches.`);}
      const action=text.match(/^(attack|move|transfer) ([a-z]{2}) (?:to )?([a-z]{2}) (\d+)$/);
      if(action){const type=action[1]==="transfer"?"move":action[1],from=resolve(action[2]),to=resolve(action[3]),count=Number(action[4]);if(reserves()>0)return respond(`DEPLOY ${reserves()} REINFORCEMENTS FIRST.`);if(queue.length===4)return respond("FOUR ACTIONS QUEUED. Review, then commit.");if(!from||!to)return respond("UNKNOWN REGION.");if(map[from].owner!=="human")return respond("SOURCE NOT OWNED.");if(!adjacent(from,to))return respond("NO DIRECT ROUTE.");if(type==="move"&&map[to].owner!=="human" || type==="attack"&&map[to].owner==="human")return respond("TARGET OWNERSHIP DOES NOT MATCH ORDER TYPE.");if(!Number.isSafeInteger(count)||count<1||count>available(from))return respond(`NOT ENOUGH AVAILABLE TROOPS: ${available(from)}. Leave one guard; assigned armies move once.`);queue.push({id:++serial,type,from,to,count});pendingStrike=null;return respond(`QUEUED ${type.toUpperCase()} ${from} > ${to}: ${count}. ${queue.length}/4 actions. Review, then commit.`);}
      return respond("ORDER NOT RECOGNIZED. deploy / attack / move / shield / strike / commit / rules");
    }
    return {handle,snapshot,income,previewBattle,opening:()=>respond(`GLOBAL THERMONUCLEAR WAR / ${difficulty.toUpperCase()}\n1 REINFORCE → 2 PLAN ACTIONS → 3 COMMIT & WATCH\nClick your territory and deploy ${budget} reinforcements: the count changes immediately.\nThen choose a source and a neighbor. Queue up to 4 actions; Commit resolves both sides.\nCapture CH or control ${victoryTarget} of ${regions.length} regions. All controls are available on screen; commands are optional.`)};
  }
  globalThis.RizvisionsWar={createGame,regions,groups,rules};
})();
