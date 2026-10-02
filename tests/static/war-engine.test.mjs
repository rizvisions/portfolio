import assert from "node:assert/strict";
import test from "node:test";
import "../../war-engine.js";
import "../../terminal-engine.js";
const {createGame,regions}=globalThis.RizvisionsWar;
const region=(g,id)=>g.snapshot().regions.find(r=>r.id===id);
const deployAll=g=>{const s=g.snapshot(),id=s.regions.find(r=>r.owner==="human").id;g.handle(`deploy ${id} ${s.reserves}`);};

test("the campaign graph remains reciprocal and connected",()=>{
  assert.equal(new Set(regions.map(r=>r.id)).size,32);
  for(const r of regions)for(const n of r.neighbors)assert.ok(regions.find(t=>t.id===n).neighbors.includes(r.id));
  const seen=new Set(),queue=["US"];while(queue.length){const id=queue.shift();if(seen.has(id))continue;seen.add(id);queue.push(...regions.find(r=>r.id===id).neighbors);}assert.equal(seen.size,32);
});
test("deployments apply instantly while movement stays queued and guards against overassignment",()=>{
  const g=createGame({seed:7}),before=g.snapshot();
  assert.match(g.handle("deploy CH 4").text,/ONLY TO YOUR/);assert.match(g.handle("commit").text,/FIRST/);
  g.handle("deploy CA 4");assert.equal(region(g,"CA").armies,9);assert.equal(region(g,"CA").deployed,4);assert.equal(region(g,"CA").available,8);
  assert.match(g.handle("attack CA CH 4").text,/NO DIRECT ROUTE/);
  assert.match(g.handle("attack CA EU 9").text,/NOT ENOUGH/);
  g.handle("attack CA EU 6");assert.equal(region(g,"EU").owner,"neutral");assert.equal(region(g,"CA").available,2);
  assert.match(g.handle("attack CA AL 3").text,/NOT ENOUGH/);
  assert.match(g.handle("attack EU EE 1").text,/SOURCE NOT OWNED/);
  assert.equal(region(g,"CA").armies,9);assert.equal(region(g,"EU").armies,2);
  g.handle("remove 1");g.handle("undeploy 1");assert.deepEqual(g.snapshot().regions.map(r=>[r.id,r.owner,r.armies]),before.regions.map(r=>[r.id,r.owner,r.armies]));
  g.handle("deploy CA 4");g.handle("attack CA EU 6");
  assert.match(g.handle("undeploy 1").text,/MOVEMENT ORDERS FIRST/);
});
test("queues can be removed and reordered; the fourth action never auto commits",()=>{
  const g=createGame({seed:7});g.handle("deploy CA 4");
  for(const order of ["attack CA EU 3","attack CA AL 2","move US CA 3","shield US"])g.handle(order);
  assert.equal(g.snapshot().queue.length,4);assert.equal(g.snapshot().round,1);assert.equal(region(g,"EU").owner,"neutral");
  assert.match(g.handle("move MX US 1").text,/FOUR ACTIONS/);
  g.handle("up 4");assert.equal(g.snapshot().queue[2].type,"shield");g.handle("down 3");assert.equal(g.snapshot().queue[3].type,"shield");
  g.handle("remove 1");assert.equal(region(g,"CA").available,6);g.handle("reset orders");assert.equal(g.snapshot().reserves,4);assert.equal(g.snapshot().queue.length,0);
});
test("combat follows simultaneous 60/70 nearest-round losses and no 1 vs 1 capture",()=>{
  const g=createGame({seed:7});
  assert.deepEqual(g.previewBattle("CA","EU",3),{remaining:2,defending:0,capture:true});
  assert.deepEqual(g.previewBattle("CA","EU",2),{remaining:1,defending:1,capture:false});
  const one=g.snapshot().regions.find(r=>r.armies===1);if(one)assert.deepEqual(g.previewBattle("CA",one.id,1),{remaining:0,defending:1,capture:false});
});
test("commit reveals AI deployment, avoids duplicate human reinforcements and carries before/after results",()=>{
  const g=createGame({seed:7});g.handle("deploy CA 4");g.handle("attack CA EU 6");g.handle("move US CA 3");
  const r=g.handle("commit");assert.equal(r.war.round,2);assert.equal(r.war.first,"computer");assert.equal(r.war.queue.length,0);assert.equal(r.war.reserves,r.war.human.income);
  assert.equal(region(g,"EU").owner,"human");assert.equal(region(g,"EU").armies,5);
  assert.equal(region(g,"CA").armies,6);assert.equal(region(g,"CA").available,5);
  const kinds=r.resolution.map(f=>f.type),firstAction=kinds.findIndex(k=>["attack","capture","move"].includes(k));assert.ok(firstAction>0);
  assert.ok(!kinds.slice(firstAction).includes("deploy"));assert.ok(r.resolution.some(f=>f.who==="computer"&&["attack","capture"].includes(f.type)));
  assert.equal(r.resolution.find(f=>["attack","capture","move"].includes(f.type)).who,"human");
  assert.ok(r.resolution.every(f=>f.war.phase==="resolving"));
  assert.ok(r.resolution.filter(f=>f.type==="deploy").every(f=>f.who==="computer"));
  const capture=r.resolution.find(f=>f.type==="capture"&&f.who==="human");
  assert.equal(capture.beforeWar.regions.find(r=>r.id==="EU").armies,2);assert.equal(capture.war.regions.find(r=>r.id==="EU").armies,5);
  assert.equal(capture.detail.sent,6);assert.equal(capture.detail.attackersLost,1);assert.equal(capture.detail.defendersLost,2);
  assert.deepEqual(capture.changes.find(c=>c.id==="EU"),{id:"EU",name:"Western Europe",armiesBefore:2,armiesAfter:5,ownerBefore:"neutral",ownerAfter:"human"});
});
test("computer plan is independent of the visitor's pending plan",()=>{
  const a=createGame({seed:19}),b=createGame({seed:19});
  a.handle("deploy CA 4");a.handle("attack CA EU 6");b.handle("deploy US 4");b.handle("shield US");
  const ar=a.handle("commit"),br=b.handle("commit");
  const deployments=r=>r.resolution.filter(f=>f.who==="computer"&&f.type==="deploy").map(f=>f.text);
  assert.deepEqual(deployments(ar),deployments(br));
  assert.deepEqual(ar.resolution.filter(f=>f.who==="computer").map(f=>[f.type,f.from,f.to]),br.resolution.filter(f=>f.who==="computer").map(f=>[f.type,f.from,f.to]));
});
test("nuclear launches are queued, limited, interceptable and followed by cooling",()=>{
  const g=createGame({seed:7});deployAll(g);g.handle("strike CH");assert.equal(g.snapshot().pendingStrike,"CH");g.handle("cancel");assert.equal(g.snapshot().pendingStrike,null);
  g.handle("strike CH");g.handle("confirm strike");assert.equal(g.snapshot().arsenal.human,3);assert.equal(g.snapshot().defcon,5);assert.match(g.handle("strike SI").text,/ONE LAUNCH/);
  const r=g.handle("commit");assert.equal(r.war.defcon,4);assert.equal(r.war.arsenal.human,2);assert.equal(r.war.outcome,null);assert.ok(r.resolution.some(f=>f.type==="strike"));assert.equal(r.war.stats.enemyTroopsLost,r.resolution.reduce((sum,f)=>sum+(f.type==="strike"&&f.who==="human"?f.detail.defendersLost:f.who==="computer"&&f.detail.attackersLost!==undefined?f.detail.attackersLost:0),0));
  deployAll(g);g.handle("shield CA");assert.match(g.handle("shield US").text,/ONE SHIELD/);const intercepted=g.handle("commit");
  assert.equal(intercepted.war.defcon,3);assert.equal(intercepted.war.arsenal.computer,2);assert.ok(intercepted.resolution.some(f=>f.type==="intercept"&&f.to==="CA"));
  const shieldIndex=intercepted.resolution.findIndex(f=>f.type==="shield"&&f.who==="human"),launchIndex=intercepted.resolution.findIndex(f=>f.type==="intercept");assert.ok(shieldIndex<launchIndex);
  let cooled=false;
  for(let i=0;i<3&&!cooled;i++){const before=g.snapshot().defcon;deployAll(g);const r=g.handle("commit");if(r.resolution.some(f=>f.type==="cooldown")){cooled=true;assert.equal(r.war.defcon,Math.min(5,before+1));}}
  assert.ok(cooled);
});
test("repeated escalation can reach mutual destruction without ending at the first launch",()=>{
  let found=false;
  for(let seed=1;seed<=15&&!found;seed++){
    const g=createGame({seed});for(let t=0;t<8&&!g.snapshot().outcome;t++){
      deployAll(g);const s=g.snapshot(),target=s.regions.find(r=>r.owner==="computer");
      if(s.arsenal.human&&target){g.handle(`strike ${target.id}`);g.handle("confirm strike");}
      g.handle("commit");
    }
    if(g.snapshot().outcome==="mutual"){found=true;assert.equal(g.snapshot().defcon,1);assert.match(g.handle("deploy CA 1").text,/COMPLETE/);}
  }
  assert.equal(found,true);
});
test("seeded sessions are isolated and restart/exit preserve other Terminal games",()=>{
  const a=createGame({seed:12}),b=createGame({seed:12});assert.deepEqual(a.snapshot(),b.snapshot());
  const state=a.snapshot();state.regions[0].armies=9999;state.queue.push({type:"strike"});assert.notEqual(region(a,"AL").armies,9999);assert.equal(a.snapshot().queue.length,0);
  const s=globalThis.RizvisionsTerminal.createSession();assert.equal(s.handle("war easy").war.reserves,6);s.handle("deploy CA 6");assert.equal(s.handle("restart").war.queue.length,0);s.handle("exit");s.handle("tic tac toe");assert.equal(s.mode,"game");
});
test("many complete campaigns preserve positive armies and resolve explicitly",()=>{
  for(let seed=1;seed<=12;seed++){
    const g=createGame({seed,difficulty:"easy"});for(let t=0;t<41&&!g.snapshot().outcome;t++){
      const st=g.snapshot(),front=st.regions.filter(r=>r.owner==="human"&&r.neighbors.some(n=>st.regions.find(t=>t.id===n).owner!=="human"));const d=(front.length?front:st.regions.filter(r=>r.owner==="human")).sort((a,b)=>b.armies-a.armies)[0];g.handle(`deploy ${d.id} ${st.reserves}`);
      for(let o=0;o<4;o++){const s=g.snapshot();let plan=null;for(const r of s.regions.filter(r=>r.owner==="human"))for(const n of r.neighbors){const target=s.regions.find(t=>t.id===n);if(target.owner!=="human"&&r.available>0&&g.previewBattle(r.id,n,r.available).capture)plan={from:r.id,to:n,count:r.available};}if(!plan)break;g.handle(`attack ${plan.from} ${plan.to} ${plan.count}`);}
      const r=g.handle("commit");for(const f of [...r.resolution,{war:r.war}])for(const region of f.war.regions){assert.ok(Number.isInteger(region.armies)&&region.armies>=1);assert.ok(Number.isInteger(region.available)&&region.available>=0);}
    }assert.ok(["victory","defeat","stalemate"].includes(g.snapshot().outcome));
  }
});


test("immediate reinforcement can be undone and reset without creating extra armies",()=>{
  const g=createGame({seed:7});g.handle("deploy CA 2");g.handle("deploy US 2");assert.equal(region(g,"CA").armies,7);assert.equal(region(g,"US").armies,9);
  g.handle("undo");assert.equal(region(g,"US").armies,7);assert.equal(g.snapshot().reserves,2);
  g.handle("deploy CA 2");g.handle("attack CA EU 8");assert.match(g.handle("undeploy 1").text,/MOVEMENT ORDERS FIRST/);
  g.handle("reset orders");assert.equal(region(g,"CA").armies,5);assert.equal(region(g,"US").armies,7);assert.equal(g.snapshot().reserves,4);
  g.handle("deploy CA 4");assert.equal(region(g,"CA").armies,9);g.handle("commit");assert.equal(region(g,"CA").armies,9);assert.equal(region(g,"CA").deployed,0);
});


test("expanded campaign has a scaled victory objective and trustworthy final statistics",()=>{
  const g=createGame({seed:5,difficulty:"easy"});assert.equal(g.snapshot().victoryTarget,22);
  let captured=0,lost=0,launches=0;
  for(let turn=0;turn<41&&!g.snapshot().outcome;turn++){
    const st=g.snapshot(),front=st.regions.filter(r=>r.owner==="human"&&r.neighbors.some(n=>st.regions.find(t=>t.id===n).owner!=="human"));
    const source=(front.length?front:st.regions.filter(r=>r.owner==="human")).sort((a,b)=>b.armies-a.armies)[0];g.handle(`deploy ${source.id} ${st.reserves}`);
    for(let order=0;order<4;order++){const s=g.snapshot();let best=null;for(const r of s.regions.filter(r=>r.owner==="human"))for(const id of r.neighbors){const t=s.regions.find(t=>t.id===id);if(t.owner!=="human"&&g.previewBattle(r.id,id,r.available).capture)best={from:r.id,to:id,count:r.available};}if(!best)break;g.handle(`attack ${best.from} ${best.to} ${best.count}`);}
    const result=g.handle("commit");for(const f of result.resolution){if(f.type==="capture"&&f.who==="human")captured++;if(f.detail.attackersLost!==undefined)lost+=f.who==="human"?f.detail.attackersLost:f.beforeWar.regions.find(r=>r.id===f.to).owner==="human"?f.detail.defendersLost:0;if(["strike","intercept"].includes(f.type)){if(f.who==="human")launches++;else lost+=f.detail.defendersLost;}}
    assert.equal(result.war.stats.captures,captured);assert.equal(result.war.stats.troopsLost,lost);assert.equal(result.war.stats.launches,launches);
    if(result.war.outcome==="victory")assert.ok(result.war.human.regions>=22||result.war.regions.find(r=>r.id==="CH").owner==="human");
  }assert.ok(g.snapshot().outcome);
});


test("shield phase ignores list position, can renew each round and cannot shield future captures",()=>{
 const a=createGame({seed:7}),b=createGame({seed:7});
 for(const g of [a,b]){g.handle("deploy CA 4");assert.match(g.handle("shield EU").text,/ONLY YOUR/);}
 a.handle("shield CA");a.handle("attack CA EU 6");b.handle("attack CA EU 6");b.handle("shield CA");
 const ar=a.handle("commit"),br=b.handle("commit");
 assert.deepEqual(ar.war.regions,br.war.regions);assert.deepEqual(ar.resolution.map(f=>[f.type,f.who,f.from,f.to]),br.resolution.map(f=>[f.type,f.who,f.from,f.to]));
 assert.match(a.handle("shield EU").text,/QUEUED SHIELD/);assert.match(a.handle("shield CA").text,/ONE SHIELD/);
 assert.ok(ar.war.bonusGroups.find(g=>g.name==="EUROPE").missing.includes("EE"));
});

test("every territory uses geographic paths with visible labels in map bounds",()=>{for(const r of regions){assert.match(r.path,/^M/);assert.ok(r.path.length>80);assert.ok(r.x>0&&r.x<1100&&r.y>0&&r.y<560);}});
