import assert from "node:assert/strict";
import test from "node:test";
import "../../war-engine.js";
import "../../terminal-engine.js";
const {createGame,regions}=globalThis.RizvisionsWar;
const region=(g,id)=>g.snapshot().regions.find(r=>r.id===id);

test("the campaign graph is connected, reciprocal, and has 18 unique regions",()=>{
  assert.equal(new Set(regions.map(r=>r.id)).size,18);
  for(const r of regions)for(const n of r.neighbors)assert.ok(regions.find(t=>t.id===n)?.neighbors.includes(r.id),`${r.id} <-> ${n}`);
  const seen=new Set(),queue=[regions[0].id];while(queue.length){const id=queue.shift();if(seen.has(id))continue;seen.add(id);queue.push(...regions.find(r=>r.id===id).neighbors);}
  assert.equal(seen.size,18);
});

test("deployment obeys ownership, budget, and the turn phase",()=>{
  const g=createGame({seed:7}),before=g.snapshot();
  assert.match(g.handle("deploy CH 4").text,/ONLY TO YOUR/);
  assert.match(g.handle("deploy CA 999").text,/INVALID/);
  assert.match(g.handle("attack CA EU 4").text,/FIRST/);
  assert.match(g.handle("end").text,/FIRST/);
  assert.deepEqual(g.snapshot(),before);
  g.handle("deploy CA 4");assert.equal(g.snapshot().reserves,0);assert.equal(region(g,"CA").armies,9);
  assert.match(g.handle("deploy CA 1").text,/INVALID/);
});

test("attacks require adjacency and leave a guard; arrived armies cannot move twice",()=>{
  const g=createGame({seed:7});g.handle("deploy CA 4");
  assert.match(g.handle("attack CA CH 4").text,/NO DIRECT ROUTE/);
  assert.match(g.handle("attack CA EU 9").text,/NOT ENOUGH/);
  const capture=g.handle("attack CA EU 6");assert.match(capture.text,/CAPTURE/);
  assert.equal(region(g,"EU").owner,"human");assert.equal(region(g,"EU").ready,0);
  assert.equal(region(g,"CA").armies,3);assert.equal(g.snapshot().orders,3);
  assert.match(g.handle("attack EU EE 1").text,/NOT ENOUGH/);
  const transferred=g.handle("move US CA 3");assert.match(transferred.text,/TRANSFER/);
  assert.equal(region(g,"CA").armies,6);assert.equal(region(g,"CA").ready,2);
});

test("computer follows the same budgets and completed turns refresh human readiness",()=>{
  const g=createGame({seed:7});g.handle("deploy CA 4");g.handle("attack CA EU 6");
  const before=g.snapshot(),total=before.regions.reduce((s,r)=>s+r.armies,0);
  const after=g.handle("end").war;
  assert.equal(after.round,2);assert.equal(after.orders,4);assert.equal(after.reserves,after.human.income);
  assert.ok(after.events.some(e=>e.startsWith("WOPR DEPLOY")));
  assert.ok(after.events.some(e=>e.startsWith("WOPR CAPTURE")));
  assert.ok(after.regions.reduce((s,r)=>s+r.armies,0)<=total+before.computer.income);
  for(const r of after.regions){assert.ok(Number.isInteger(r.armies)&&r.armies>=1);assert.ok(r.ready>=0&&r.ready<r.armies);}
  for(const r of after.regions.filter(r=>r.owner==="human"))assert.equal(r.ready,r.armies-1);
});

test("nuclear ending requires confirmation, can be cancelled, and ends both sides",()=>{
  const g=createGame({seed:7});assert.match(g.handle("confirm strike").text,/NO LAUNCH/);
  g.handle("strike CH");assert.equal(g.snapshot().defcon,5);assert.equal(g.snapshot().pendingStrike,"CH");
  g.handle("cancel");assert.equal(g.snapshot().pendingStrike,null);
  g.handle("strike CH");const finish=g.handle("confirm strike");
  assert.equal(finish.war.outcome,"mutual");assert.equal(finish.war.defcon,1);
  assert.match(finish.text,/NO WINNER/);
  assert.match(g.handle("deploy CA 1").text,/CAMPAIGN COMPLETE/);
});

test("terminal starts, restarts, and disconnects a campaign while preserving other games",()=>{
  const s=globalThis.RizvisionsTerminal.createSession();
  s.handle("games");assert.equal(s.handle("3").mode,"war");
  const first=s.handle("deploy CA 4");assert.equal(first.war.reserves,0);
  assert.equal(s.handle("restart").war.round,1);assert.equal(s.handle("exit").mode,"normal");
  assert.equal(s.handle("war easy").war.human.income,6);
  s.handle("exit");s.handle("tic tac toe");assert.equal(s.mode,"game");
});

test("seeded campaigns replay identically and snapshots cannot mutate game state",()=>{
  const a=createGame({seed:12}),b=createGame({seed:12});
  assert.deepEqual(a.snapshot(),b.snapshot());
  const state=a.snapshot();state.regions[0].armies=9999;state.regions[0].neighbors.length=0;
  assert.notEqual(region(a,"AL").armies,9999);assert.equal(region(a,"AL").neighbors.length,2);
});

test("many legal campaigns remain valid and terminate with an explicit outcome",()=>{
  for(let seed=1;seed<=12;seed++){
    const g=createGame({seed,difficulty:seed%2?"easy":"standard"});
    for(let turn=0;turn<41 && !g.snapshot().outcome;turn++){
      let st=g.snapshot();
      const own=st.regions.filter(r=>r.owner==="human");
      const front=own.filter(r=>r.neighbors.some(n=>st.regions.find(t=>t.id===n).owner!=="human"));
      const deploy=(front.length?front:own).sort((a,b)=>b.armies-a.armies)[0];
      g.handle(`deploy ${deploy.id} ${st.reserves}`);
      for(let o=0;o<4 && !g.snapshot().outcome;o++){
        st=g.snapshot();let plan=null;
        for(const r of st.regions.filter(r=>r.owner==="human"))for(const n of r.neighbors){
          const target=st.regions.find(t=>t.id===n),count=Math.min(r.ready,r.armies-1);
          if(target.owner!=="human" && count>0 && g.previewBattle(r.id,n,count).capture)plan={from:r.id,to:n,count};
        }
        if(!plan)break;g.handle(`attack ${plan.from} ${plan.to} ${plan.count}`);
      }
      if(!g.snapshot().outcome)g.handle("end");
      for(const r of g.snapshot().regions){assert.ok(r.armies>=1&&Number.isInteger(r.armies));assert.ok(r.ready>=0&&r.ready<r.armies);}
    }
    assert.ok(["victory","defeat","stalemate"].includes(g.snapshot().outcome));
  }
});
