import assert from "node:assert/strict";
import test from "node:test";
import "../../war-engine.js";
import "../../terminal-engine.js";
const {createSession,bestMove,winner}=globalThis.RizvisionsTerminal;

test("natural phrases resolve specific topics, typos, and contextual follow-ups",()=>{
  const session=createSession();
  assert.match(session.handle("What did Riz do at Parker?").text,/AI creative-strategy/);
  assert.match(session.handle("tell me more").text,/ad-account analysis/);
  assert.match(session.handle("Tell me about Databriks").text,/750K/);
  assert.match(session.handle("What did he do there?").text,/DBUs/);
  assert.match(session.handle("Where did he study?").text,/Loyola/);
  assert.match(session.handle("Where does he live?").text,/Chicago/);
  assert.match(session.handle("What are his projects?").text,/Blue Specs/);
  assert.match(session.handle("unknown banana fruit").text,/haven’t got an entry/);
  assert.match(session.handle("help parker").text,/Recognized words and phrases: parker/);
  assert.match(session.handle("compare Parker versus Blue Specs").text,/40K/);
});

test("natural app-opening requests include intervening words",()=>{
  assert.equal(createSession().handle("Please open the Spotify app").openApp,"spotify");
  assert.equal(createSession().handle("Show me Parker").openApp,"parker");
  assert.equal(createSession().handle("Take me to the browser").openApp,"safari");
});

test("game menu, legal moves, occupied squares, replay and disconnect work",()=>{
  const s=createSession();
  assert.equal(s.handle("Shall we play a game?").mode,"menu");
  const start=s.handle("1");assert.deepEqual(start.board,Array(9).fill(null));
  const move=s.handle("top left");assert.equal(move.board[0],"X");assert.equal(move.board[4],"O");
  assert.match(s.handle("1").text,/OCCUPIED/);
  assert.match(s.handle("10").text,/ENTER A SQUARE/);
  assert.equal(s.handle("restart").board.filter(Boolean).length,0);
  assert.equal(s.handle("play o").board[4],"X");
  assert.equal(s.handle("exit").mode,"normal");
  assert.match(s.handle("Parker").text,/AI creative-strategy/);
});

test("perfect computer cannot lose to any human sequence as X or O",()=>{
  function explore(board,human){
    if(winner(board)){assert.notEqual(winner(board),human);return;}
    for(let i=0;i<9;i++)if(!board[i]){
      const next=[...board];next[i]=human;
      assert.notEqual(winner(next),human);
      if(!winner(next))next[bestMove(next,human==="X"?"O":"X")]=human==="X"?"O":"X";
      explore(next,human);
    }
  }
  explore(Array(9).fill(null),"X");
  const board=Array(9).fill(null);board[bestMove(board,"X")]="X";explore(board,"O");
});

test("zero-player evaluation ends in a draw with a route back into play",()=>{
  const s=createSession();s.handle("games");assert.equal(s.handle("watch").observe,true);
  const frames=s.observe();assert.equal(frames.length,10);assert.match(frames.at(-1),/DRAW/);
  assert.equal(s.handle("1").mode,"game");
});
