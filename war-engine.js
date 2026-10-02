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
  const rules="GLOBAL THERMONUCLEAR WAR // RULES\n\nOBJECTIVE: capture the opposing HQ (US / CH), or control 12 regions.\nEach turn: deploy all reinforcements, then make up to 4 attack / transfer orders.\nIncome: 3 + one per 3 regions + full-continent bonuses.\nEach army moves once per turn. Keep one army to hold its region.\nBattle: attackers remove 70% of their number; defenders remove 60% of theirs, rounded down (minimum 1). Survivors return if the attack fails.\n\ndeploy CA 4         Reinforce an owned region\nattack CA EU 6      Attack a connected region\nmove US CA 3        Transfer to a friendly neighbor\ninspect EU         Show its borders and troops\nend                Hand the turn to WOPR\n\nstrike CH          Request the fictional nuclear option\nconfirm strike     DEFCON drops. WOPR retaliates; at DEFCON 1, both lose.\ncancel             Cancel a pending strike\nrestart            New campaign\nexit               Disconnect\n\nClick your region to prepare a deploy / attack order. Click a neighboring region to select a target. All orders use the command line.";
  function createGame({seed=Date.now(),difficulty="standard"}={}) {
    seed=Number(seed)>>>0;let randomState=seed || 1;
    const rand=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;};
    let round=1,defcon=5,orders=4,outcome=null,pendingStrike=null,events=[];
    const map=Object.fromEntries(regions.map(r=>[r.id,{owner:"neutral",armies:2,ready:0}]));
    for(const [id,armies] of [["CA",5],["US",7],["MX",3]])map[id]={owner:"human",armies,ready:armies-1};
    for(const [id,armies] of [["SI",5],["CH",7],["JP",3]])map[id]={owner:"computer",armies,ready:armies-1};
    // Neutral forces vary slightly between campaigns; both sides use identical rules.
    for(const id of ["AL","AR","SA","NZ"])map[id].armies=1+Math.floor(rand()*3);
    const owned=(who)=>regions.filter(r=>map[r.id].owner===who);
    const bonuses=(who)=>Object.keys(groups).filter(g=>regions.filter(r=>r.group===g).every(r=>map[r.id].owner===who));
    const income=(who)=>3+Math.floor(owned(who).length/3)+bonuses(who).reduce((s,g)=>s+groups[g],0)+(who==="human"&&difficulty==="easy"?2:who==="computer"&&difficulty==="hard"?2:0);
    let reserves=income("human");
    const resolve=(value)=>{const key=String(value||"").toUpperCase();if(map[key])return key;const normal=String(value||"").toLowerCase();return regions.find(r=>r.name.toLowerCase()===normal)?.id;};
    const isNeighbor=(a,b)=>regions.find(r=>r.id===a)?.neighbors.includes(b);
    const snapshot=()=>({round,defcon,orders,reserves,difficulty,seed,outcome,pendingStrike,regions:regions.map(r=>({...r,...map[r.id],neighbors:[...r.neighbors]})),human:{regions:owned("human").length,armies:owned("human").reduce((s,r)=>s+map[r.id].armies,0),income:income("human"),bonuses:bonuses("human")},computer:{regions:owned("computer").length,armies:owned("computer").reduce((s,r)=>s+map[r.id].armies,0),income:income("computer"),bonuses:bonuses("computer")},events:[...events]});
    const respond=(text)=>({text,war:snapshot()});
    const remember=(text)=>{events.push(text);events=events.slice(-6);};
    const previewBattle=(from,to,count)=>{
      const defenders=map[to].armies;
      const losses=Math.min(count,Math.max(1,Math.floor(defenders*.6)));
      const defenderLosses=Math.min(defenders,Math.floor(count*.7));
      return {remaining:count-losses,defending:defenders-defenderLosses,capture:defenderLosses===defenders && count-losses>0};
    };
    function checkVictory(){
      if(map.US.owner==="computer" || owned("computer").length>=12)outcome="defeat";
      else if(map.CH.owner==="human" || owned("human").length>=12)outcome="victory";
      if(outcome)remember(outcome==="victory"?"CAMPAIGN WON. Conventional control secured. No launches required.":"WOPR WINS. Your command network has fallen. Try another opening.");
    }
    function move(who,from,to,count){
      const source=map[from],target=map[to];
      if(!source || !target)return {text:"UNKNOWN REGION. Use its two-letter map code.",ok:false};
      if(source.owner!==who)return {text:"SOURCE NOT OWNED. Choose one of your regions.",ok:false};
      if(from===to || !isNeighbor(from,to))return {text:"NO DIRECT ROUTE. Inspect the source to see its neighbors.",ok:false};
      if(!Number.isSafeInteger(count) || count<1)return {text:"ENTER A POSITIVE WHOLE NUMBER OF ARMIES.",ok:false};
      if(count>Math.min(source.ready,source.armies-1))return {text:"NOT ENOUGH READY ARMIES. Leave one behind; each army moves only once per turn.",ok:false};
      source.armies-=count;source.ready-=count;
      if(target.owner===who){target.armies+=count;const msg=`${factions[who]} TRANSFER ${from} > ${to}: ${count} armies. Arrivals move next turn.`;remember(msg);return {text:msg,ok:true};}
      const combat=previewBattle(from,to,count);
      let msg;
      if(combat.capture){target.owner=who;target.armies=combat.remaining;target.ready=0;msg=`${factions[who]} CAPTURE ${from} > ${to}: ${combat.remaining} survive.`;}
      else{target.armies=Math.max(1,combat.defending);source.armies+=combat.remaining;msg=`${factions[who]} ATTACK ${from} > ${to}: repelled. ${combat.remaining} return; ${target.armies} defend.`;}
      remember(msg);checkVictory();return {text:msg,ok:true};
    }
    const resetReady=(who)=>owned(who).forEach(r=>map[r.id].ready=map[r.id].armies-1);
    function distanceToEnemy(start,who){
      const queue=[[start,0]],seen=new Set([start]);
      while(queue.length){const [id,d]=queue.shift();if(map[id].owner!==who)return d;for(const n of regions.find(r=>r.id===id).neighbors)if(!seen.has(n)){seen.add(n);queue.push([n,d+1]);}}
      return 99;
    }
    function computerTurn(){
      resetReady("computer");let pool=income("computer");
      const frontier=owned("computer").filter(r=>r.neighbors.some(n=>map[n].owner!=="computer"));
      const choose=frontier.sort((a,b)=>{
        const score=r=>r.neighbors.reduce((s,n)=>s+(map[n].owner==="human"?map[n].armies:0),0)*.6+map[r.id].armies+(r.neighbors.includes("US")?12:0)+(r.id==="CH"?3:0);
        return score(b)-score(a);
      })[0] || owned("computer")[0];
      if(!choose)return;
      // Protect the HQ when a human force can reach it this turn.
      const threat=regions.find(r=>r.id==="CH").neighbors.filter(n=>map[n].owner==="human").reduce((s,n)=>Math.max(s,map[n].armies-1),0);
      const defense=Math.min(pool,Math.max(0,Math.ceil(threat*.7)+1-map.CH.armies));
      if(map.CH.owner==="computer"){map.CH.armies+=defense;map.CH.ready+=defense;pool-=defense;}
      map[choose.id].armies+=pool;map[choose.id].ready+=pool;remember(`WOPR DEPLOY: ${pool+defense} reinforcements.`);
      for(let order=0;order<4 && !outcome;order++){
        const candidates=[];
        for(const r of owned("computer")){
          const amount=Math.min(map[r.id].ready,map[r.id].armies-1);if(amount<1)continue;
          for(const n of r.neighbors)if(map[n].owner!=="computer"){
            const fight=previewBattle(r.id,n,amount);if(!fight.capture)continue;
            const target=regions.find(t=>t.id===n);
            const groupOwned=owned("computer").filter(t=>t.group===target.group).length;
            const score=(n==="US"?100:0)+(map[n].owner==="human"?9:4)+groupOwned*3+fight.remaining*.4-map[n].armies*.3+rand();
            candidates.push({from:r.id,to:n,amount,score});
          }
        }
        candidates.sort((a,b)=>b.score-a.score);
        if(candidates.length){const c=candidates[0];move("computer",c.from,c.to,c.amount);continue;}
        const interior=owned("computer").filter(r=>map[r.id].ready>0 && !r.neighbors.some(n=>map[n].owner!=="computer")).sort((a,b)=>map[b.id].ready-map[a.id].ready);
        let transferred=false;
        for(const r of interior){
          const neighbor=r.neighbors.filter(n=>map[n].owner==="computer").sort((a,b)=>distanceToEnemy(a,"computer")-distanceToEnemy(b,"computer"))[0];
          if(neighbor && distanceToEnemy(neighbor,"computer")<distanceToEnemy(r.id,"computer")){move("computer",r.id,neighbor,map[r.id].ready);transferred=true;break;}
        }
        if(!transferred)break;
      }
    }
    function handle(raw){
      const text=String(raw).toLowerCase().trim().replace(/\s+/g," ");
      if(/^(help|rules|how to play)$/.test(text))return respond(rules);
      if(/^(status|map|sitrep)$/.test(text))return respond(`ROUND ${round} // ${reserves} TO DEPLOY // ${orders} ORDERS\nYOU ${owned("human").length}/18 regions · WOPR ${owned("computer").length}/18\nObjective: capture CH or control 12 regions.`);
      if(outcome)return respond("CAMPAIGN COMPLETE. Type restart for a new map, or exit to disconnect.");
      if(text==="cancel"){pendingStrike=null;return respond("LAUNCH REQUEST CANCELLED.");}
      const strike=text.match(/^(?:strike|nuke|launch) ([a-z]{2})$/);
      if(strike){const to=resolve(strike[1]);if(!to || map[to].owner!=="computer")return respond("SELECT A WOPR REGION BY ITS MAP CODE.");pendingStrike=to;return respond(`NUCLEAR OPTION REQUESTED: ${to}.\nWOPR will retaliate. DEFCON 1 ends the campaign for both sides.\nType confirm strike to proceed, or cancel to keep playing conventionally.`);}
      if(text==="confirm strike"){
        if(!pendingStrike)return respond("NO LAUNCH REQUEST. Type strike [region] or cancel.");
        const target=pendingStrike;pendingStrike=null;map[target].armies=1;defcon=1;outcome="mutual";
        remember(`YOU LAUNCH > ${target}. WOPR RETALIATES > US.`);remember("DEFCON 1 // MUTUAL DESTRUCTION. NO WINNER.");
        return respond("LAUNCH DETECTED. WOPR RETALIATES.\nDEFCON 1 // MUTUAL DESTRUCTION. NO WINNER.\nThe conventional board was winnable. Escalation was not.\nType restart to try again.");
      }
      const inspect=text.match(/^(?:inspect|info) (.+)$/);
      if(inspect){const id=resolve(inspect[1]);if(!id)return respond("UNKNOWN REGION. Use the two-letter code printed on the map.");const r=regions.find(r=>r.id===id);return respond(`${id} / ${r.name.toUpperCase()}\n${factions[map[id].owner]} · ${map[id].armies} armies · ${map[id].ready} ready\nConnected: ${r.neighbors.join(" / ")}\n${r.group}: +${groups[r.group]} income when fully controlled.`);}
      const deploy=text.match(/^(?:deploy|reinforce|place) ([a-z]{2}) (\d+)$/);
      if(deploy){
        const id=resolve(deploy[1]),count=Number(deploy[2]);if(!id || map[id].owner!=="human")return respond("DEPLOY ONLY TO YOUR REGIONS. They are bright green.");
        if(!Number.isSafeInteger(count) || count<1 || count>reserves)return respond(`INVALID DEPLOYMENT. You have ${reserves} reinforcements remaining.`);
        map[id].armies+=count;map[id].ready+=count;reserves-=count;pendingStrike=null;const msg=`YOU DEPLOY ${id}: +${count}. ${reserves} remaining.`;remember(msg);return respond(msg+(reserves===0?"\nReinforcements placed. Attack or transfer; type end when finished.":""));
      }
      const order=text.match(/^(attack|move|transfer) ([a-z]{2}) (?:to )?([a-z]{2}) (\d+)$/);
      if(order){
        if(reserves>0)return respond(`DEPLOY ${reserves} REINFORCEMENTS FIRST. Example: deploy CA ${reserves}`);
        if(orders===0)return respond("NO ORDERS LEFT. Type end to resolve WOPR’s turn.");
        const from=resolve(order[2]),to=resolve(order[3]),count=Number(order[4]);
        if(!from || !to)return respond("UNKNOWN REGION. Use two-letter map codes.");
        if(order[1]==="attack" && map[to].owner==="human")return respond("FRIENDLY TARGET. Use move to transfer armies.");
        if(order[1]!=="attack" && map[to].owner!=="human")return respond("HOSTILE TARGET. Use attack for enemy or neutral regions.");
        const action=move("human",from,to,count);
        if(action.ok){orders--;pendingStrike=null;}
        return respond(action.text+(outcome?"\n"+events.at(-1):`\n${orders} orders left. Type end when finished.`));
      }
      if(/^(end|end turn|done|next|commit)$/.test(text)){
        if(reserves>0)return respond(`DEPLOY ${reserves} REINFORCEMENTS FIRST.`);
        pendingStrike=null;computerTurn();
        if(!outcome){round++;orders=4;resetReady("human");reserves=income("human");if(round>40){outcome="stalemate";remember("FORTY ROUNDS // STALEMATE. Both command networks remain intact.");}}
        return respond(events.slice(-4).join("\n")+(outcome?"\nCAMPAIGN COMPLETE. Type restart.":`\nROUND ${round}. Deploy ${reserves} reinforcements.`));
      }
      return respond("ORDER NOT RECOGNIZED.\ndeploy CA 4 / attack CA EU 6 / move US CA 3 / inspect EU / end\nType rules for the full manual.");
    }
    remember("COMMAND LINK OPEN. YOUR HQ: US. WOPR HQ: CH.");
    return {handle,snapshot,income,previewBattle,opening:()=>respond(`GLOBAL THERMONUCLEAR WAR // ${difficulty.toUpperCase()}\nCapture WOPR HQ (CH), or control 12 regions.\nDeploy ${reserves} reinforcements. Try: deploy CA ${reserves}\nType rules for the manual. Click map regions to prepare orders.`)};
  }
  globalThis.RizvisionsWar={createGame,regions,groups,rules};
})();
