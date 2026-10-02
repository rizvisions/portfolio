/* Local terminal interpreter and WarGames-inspired tic-tac-toe. No network calls. */
(() => {
  "use strict";
  const normalize = (value) => String(value).toLowerCase().replace(/[’']/g, "").replace(/[_-]+/g, " ").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  const topics = [
    { id:"parker", label:"Parker", aliases:["parker","heyparker","creative strategy"], answer:"Parker is an AI creative-strategy platform for ecommerce teams. Riz works across GTM, demos, onboarding, customer research, support, pricing, and product feedback.", more:"The product brings ad-account analysis, briefs, scripts, personas, competitor research, and reporting into a creative strategist’s workflow. Riz’s work connects customer conversations with product and go-to-market decisions." },
    { id:"bluespecs", label:"Blue Specs", aliases:["blue specs","bluespecs","glasses","ecommerce business"], answer:"Blue Specs was the ecommerce business Riz built at 18: more than $40K in six months, a 60% margin, 244% ROAS, 50+ influencer contracts, and 200+ support tickets.", more:"He worked on the storefront, acquisition, influencer partnerships, and customer support. The business reached the number-one SEO position for “blue specs.”" },
    { id:"whop", label:"Whop / Clip Curator", aliases:["whop","clip curator","wap","creator rewards","reward programs"], answer:"The Whop chapter included Clip Curator, creator reward programs, a 25K community, roughly $20K earned, and a trip to Whop HQ after winning its $3K in 30 Days competition.", more:"The work centered on distribution: giving creators incentives to make and publish content, then managing the community and reward system around it." },
    { id:"windsurf", label:"Windsurf", aliases:["windsurf","windsurf campaign"], answer:"The Windsurf campaign generated 3.6M views through creator incentives and became a practical lesson in distribution, fraud controls, and content systems.", more:"It connected paid creator rewards with measurable short-form distribution. It sits in the same creator-program chapter as Clip Curator and Whop." },
    { id:"rewards", label:"Rewards Network", aliases:["rewards network","rn","restaurant sales","first sales job"], answer:"At Rewards Network, Riz became the top SDR, averaged 11 closed deals per month, and contributed roughly $1.04M in incremental annual revenue.", more:"His win rate was 38%. He built a phone script used by his manager, and his fastest closed deal took 2 hours and 51 minutes." },
    { id:"databricks", label:"Databricks", aliases:["databricks","data bricks"], answer:"At Databricks, Riz worked as a Solutions Specialist, built roughly $750K in ARR pipeline, and finished as the number-one outbound performer over his final 90 days.", more:"The pipeline represented about $63K in monthly DBUs. He also helped close a $12K deal in under 24 hours." },
    { id:"photos", label:"Photography", aliases:["photography","photos","photo","camera","pictures","images","visual archive"], answer:"Photography is where Rizvisions started. The Photos app contains the growing visual archive. Type “open photos” to look around.", more:"Desktop Polaroids open individual pieces of media. Photos gives you the full archive, a filmstrip, and an information drawer for available media details." },
    { id:"creator", label:"Creator work", aliases:["tiktok","creator","content","views","social media","video","videos","followers"], answer:"Riz is a creator with more than 30M lifetime short-form views. His personal work spans photography, video, lifestyle, internet experiments, and business content.", more:"TikTok: @riz.com. Instagram: @rizvisions. Rizvisions started as a photography identity and grew into a home for the rest of his creative work." },
    { id:"location", label:"Chicago", aliases:["chicago","location","where is riz","where are you","where does he live","where do you live","based","live in","located"], answer:"Riz is based in Chicago.", more:"Chicago is home. You’ll see bits of the city throughout the photo archive." },
    { id:"education", label:"Loyola / education", aliases:["loyola","college","university","school","education","studied","study","degree","graduated"], answer:"Riz graduated cum laude from Loyola University Chicago in 2024 with a BBA in Marketing and Entrepreneurship.", more:"Marketing and Entrepreneurship connect to the businesses, creator programs, and go-to-market work in the portfolio." },
    { id:"contact", label:"Contact / social links", aliases:["contact","reach","email","linkedin","instagram","twitter","socials","get in touch","message riz"], answer:"LinkedIn is best for work. Instagram is best for everything else. Type “open messages” for direct links.", more:"LinkedIn: linkedin.com/in/riz-zaheer/\nInstagram: instagram.com/rizvisions/\nX: x.com/rizvisions\nTikTok: tiktok.com/@riz.com" },
    { id:"site", label:"Rizvisions / this site", aliases:["rizvisions","this site","this website","website","internet home","desktop","how does this work"], answer:"Rizvisions is Riz’s permanent internet home: work, photography, old businesses, current projects, personal artifacts, and whatever comes next.", more:"Open apps from the desktop or Dock. Windows can be dragged, resized, and minimized. Notes are saved locally in your browser. This terminal uses a local text bank and a playable game; it has no live AI connection." },
    { id:"now", label:"Current work", aliases:["current","currently","right now","now","working on","these days","what do you do","what does riz do","what does he do"], answer:"Currently: working at Parker across GTM, customer conversations, product feedback, support, pricing, and storytelling—while continuing to build Rizvisions.", more:"Ask about Parker for the startup chapter, or projects for the businesses and creator work alongside it." },
    { id:"career", label:"Career history", aliases:["career","resume","job history","work history","where has","experience","previous jobs","past jobs","background","sales","sdr"], answer:"Riz’s path runs through entrepreneurship, creator programs, Rewards Network, Databricks, and Parker. Ask about any of those chapters for the details.", more:"Rewards Network: May 2024–April 2025.\nDatabricks: April–September 2025.\nParker: February 2026 onward.\nThe earlier business chapter includes Blue Specs in 2020." },
    { id:"projects", label:"Projects / work", aliases:["work","projects","project","portfolio","businesses","built","business","entrepreneur","startup"], answer:"The archive covers Parker, Blue Specs, creator-economy work through Whop, the Windsurf campaign, photography, and the projects that came before and after them.", more:"Try “tell me about Blue Specs,” “what was Clip Curator?” or “open work” to explore the project folders." },
    { id:"about", label:"About Riz", aliases:["who is riz","who are you","about riz","riz","rizwan","zaheer","introduce yourself","tell me about yourself"], answer:"Riz Zaheer is a Chicago-based creator and operator. He works at Parker, makes photos and videos, and has used Rizvisions as a creative identity since middle school.", more:"Ask about his career, education, photography, or businesses. Those chapters have their own entries here." }
  ];
  const contains = (text, phrase) => (` ${text} `).includes(` ${phrase} `);
  function nearWord(a,b) {
    if (a.length < 5 || Math.abs(a.length-b.length)>1) return false;
    if(a.length===b.length){
      const differing=[...a].map((c,i)=>c===b[i]?-1:i).filter(i=>i>=0);
      if(differing.length===2 && differing[1]===differing[0]+1 && a[differing[0]]===b[differing[1]] && a[differing[1]]===b[differing[0]])return true;
    }
    let i=0,j=0,errors=0;
    while(i<a.length && j<b.length) { if(a[i]===b[j]){i++;j++;continue;} if(++errors>1)return false; if(a.length>=b.length)i++; if(b.length>=a.length)j++; }
    return errors+(a.length-i)+(b.length-j)<=1;
  }
  const help = () => "Natural-language questions:\n" + topics.map(t=>`  ${t.label}`).join("\n") + "\n\nAsk a question, then type ‘tell me more’ or ‘go deeper’ for a follow-up.\nExamples: what does Riz do? / where did he study? / tell me about Blue Specs\n\nCommands:\n  open [app]     Photos, Work, Parker, Spotify, Safari, Messages, Notes,\n                 About, Instagram, Calendar, Settings, or Trash\n  games          Shall we play a game?\n  help [topic]   Show a topic’s wording and aliases\n  history        Show your command history\n  clear          Clear the transcript\n  exit / quit    Leave a game\n\nUse ↑ / ↓ to recall commands. Tab completes app names and commands.";
  const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const winner=(board)=>{for(const [a,b,c] of lines)if(board[a] && board[a]===board[b] && board[a]===board[c])return board[a];return board.every(Boolean)?"draw":null;};
  function bestMove(board, player) {
    const opponent=player==="X"?"O":"X";
    const score=(turn,depth)=>{
      const end=winner(board);if(end)return end==="draw"?0:end===player?10-depth:depth-10;
      const values=[]; for(const n of [4,0,2,6,8,1,3,5,7])if(!board[n]){board[n]=turn;values.push(score(turn===player?opponent:player,depth+1));board[n]=null;}
      return turn===player?Math.max(...values):Math.min(...values);
    };
    let chosen=null,best=-Infinity;
    for(const n of [4,0,2,6,8,1,3,5,7])if(!board[n]){board[n]=player;const value=score(opponent,1);board[n]=null;if(value>best){best=value;chosen=n;}}
    return chosen;
  }
  const boardText=(board)=>["",...Array.from({length:3},(_,row)=>"       "+board.slice(row*3,row*3+3).map((v,i)=>` ${v || row*3+i+1} `).join("| ")+(row<2?"\n       ----+----+----":"")),""].join("\n");
  const menu="RIZVISIONS / WOPR LINK\nCONNECTION ESTABLISHED\n\nSHALL WE PLAY A GAME?\n\n  1  TIC-TAC-TOE         Human vs computer\n  2  ZERO-PLAYER MODE   Watch perfect play\n  3  THERMONUCLEAR WAR  Territory campaign vs WOPR\n\nType 1 or 2 for tic-tac-toe, or 3 for the world campaign.\nType exit to return to the terminal.";
  function createSession() {
    let lastTopic=null, mode="normal", board=null, human="X", finished=false,war=null;
    const result=(text,extra={})=>({text,mode,...extra});
    const start=(symbol="X")=>{mode="game";human=symbol;board=Array(9).fill(null);finished=false;if(human==="O")board[bestMove(board,"X")]="X";return result(`TIC-TAC-TOE // YOU: ${human}  COMPUTER: ${human==="X"?"O":"X"}\n${boardText(board)}\nEnter a square 1–9 (or ‘top left’, ‘center’, ‘bottom right’).\n‘play o’ lets the computer start. ‘restart’ resets. ‘exit’ disconnects.`,{board:[...board],status:"YOUR MOVE"});};
    const positions={"top left":0,"top middle":1,"top center":1,"top right":2,"middle left":3,"center":4,"centre":4,"middle":4,"middle right":5,"bottom left":6,"bottom middle":7,"bottom center":7,"bottom right":8};
    function handle(query) {
      const text=normalize(query);
      if(!text)return result("");
      if(text==="clear" || text==="cls")return result("",{clear:true,...(mode==="war"?{war:war.snapshot()}:{})});
      if(/^(exit|quit|disconnect|back|stop|leave)( the)?( game)?$/.test(text)){mode="normal";board=null;war=null;return result("WOPR LINK CLOSED.\nBack at riz@rizvisions. Type help for the archive.");}
      const warStart=/^(?:war|risk|warlight|warapp|war app|thermonuclear war|global thermonuclear war)(?: (easy|standard|hard))?$/.exec(text);
      if(warStart || (mode==="menu" && text==="3")){
        mode="war";war=globalThis.RizvisionsWar.createGame({difficulty:warStart?.[1]||"standard"});return result(war.opening().text,{war:war.snapshot()});
      }
      if(mode==="war"){
        if(/^(restart|again|new game)$/.test(text)){war=globalThis.RizvisionsWar.createGame({difficulty:war.snapshot().difficulty});return result(war.opening().text,{war:war.snapshot()});}
        const response=war.handle(text);return result(response.text,{war:response.war});
      }
      if(/\b(shall we play a game|play a game|lets play|games|wargames|war games|wopr|joshua|global thermonuclear war)\b/.test(text)){
        mode="menu";return result(menu);
      }
      if(mode==="menu"){
        if(text==="1" || /\b(tic tac toe|tictactoe|noughts|play|yes|sure|lets go|lets play)\b/.test(text))return start();
        if(text==="2" || /\b(watch|zero player|demo|observe)\b/.test(text)){
          mode="observe";return result("ZERO-PLAYER MODE // X vs O\nBoth sides are evaluating every possible move.",{observe:true});
        }
        return result(menu);
      }
      if(mode==="game"){
        if(/^(restart|again|replay|new game|play again)$/.test(text))return start(human);
        if(/^(play|choose|be|i am|im|i want to be) (x|o)$/.test(text))return start(text.endsWith("o")?"O":"X");
        if(text==="help" || text==="rules")return result("You and WOPR alternate turns. Three marks in a row wins.\nSquares run 1–9 from top left to bottom right.\nType a number, ‘center’, or a corner name.\nrestart / play o / exit");
        if(finished)return result("GAME COMPLETE. Type again for another round, or exit to disconnect.");
        const number=text.match(/^(?:move |square |position |play |put (?:x|o) (?:in |on )?)?([1-9])$/);
        let move=number?Number(number[1])-1:positions[text];
        const coordinate=text.match(/^([abc])([123])$/);if(coordinate)move=(Number(coordinate[2])-1)*3+coordinate[1].charCodeAt(0)-97;
        if(move===undefined)return result("ENTER A SQUARE 1–9. You can also type ‘top left’ or ‘center’.\nType help for rules, or exit to disconnect.");
        if(board[move])return result("SQUARE OCCUPIED. Choose an empty square.",{board:[...board]});
        board[move]=human;let end=winner(board);
        const computer=human==="X"?"O":"X";
        if(!end){board[bestMove(board,computer)]=computer;end=winner(board);}
        finished=Boolean(end);
        const outcome=end==="draw"?"DRAW. Perfect play reaches a stalemate.\nA STRANGE GAME. THE ONLY WINNING MOVE IS NOT TO PLAY.":end===human?"YOU WIN.":end?"WOPR WINS. Try a different opening.":"YOUR MOVE. Enter an empty square.";
        return result(boardText(board)+outcome+(end?"\nType again to replay, or exit to disconnect.":""),{board:[...board],status:end?"GAME COMPLETE":"YOUR MOVE"});
      }
      if(/\b(tic tac toe|tictactoe|noughts and crosses)\b/.test(text))return start();
      const open=text.match(/\b(?:open|launch|start|show|take me to|bring up) (?:me |the )?(photos|pictures|work|finder|projects|parker|spotify|music|safari|browser|messages|imessage|notes|about|instagram|calendar|settings|trash)(?: app)?\b/);
      if(open){const aliases={pictures:"photos",finder:"work",projects:"work",music:"spotify",browser:"safari",imessage:"messages"};const app=aliases[open[1]]||open[1];return result(`Opening ${app}…`,{openApp:app});}
      if(/^(help|commands|topics|what can you do|what do you know|how do i use this|what can i ask|list commands)( please)?$/.test(text))return result(help());
      if(/^(hi|hey|hello|yo|sup|whats up|hey there|hello there)( riz| rizvisions| joshua)?$/.test(text))return result("Hey. Welcome to Rizvisions. Ask about Riz’s work, or type ‘shall we play a game?’");
      if(/\b(how are you|how is it going|hows it going|how are things)\b/.test(text))return result("Running locally and doing fine. How are you?");
      if(/^(good|great|fine|not bad|im good|im fine|doing well|im doing well)$/.test(text))return result("Good to hear. What would you like to explore?");
      if(/\b(thanks|thank you|thankyou)\b/.test(text))return result("You’re welcome.");
      if(/\b(are you ai|are you real|are you an ai|are you a bot|how do you work|is this ai|llm)\b/.test(text))return result("This is a local interpreter with a curated text bank. I match phrases, remember the last topic in this session, and run tic-tac-toe. No API, no live model.");
      if(/\b(weather|forecast)\b/.test(text))return result("No live weather feed here. Ask about Chicago, or play a game while it rains.");
      if(/\b(joke|make me laugh)\b/.test(text))return result("I told WOPR to touch grass. It calculated every blade.");
      if(/^(more|tell me more|go deeper|elaborate|continue|what else|and then|more details|expand on that|tell me more about (it|that|him)|what about (it|that)|what did (he|you) do there|what does that mean|can you elaborate)$/.test(text))return result(lastTopic?lastTopic.more:"Give me a topic first: Parker, Blue Specs, photography, career history…");
      if(text==="why" && mode==="observe")return result("Two perfect players can block every winning line. Try 1 to play yourself, or exit to leave.");
      if(mode==="observe" && /^(1|play|again|restart)$/.test(text))return start();
      if(/\b(where.*(live|from|located)|where.*based)\b/.test(text)) {lastTopic=topics.find(t=>t.id==="location");return result(lastTopic.answer);}
      if(/\b(what.*(studied|degree)|where.*(study|studied|graduate))\b/.test(text)) {lastTopic=topics.find(t=>t.id==="education");return result(lastTopic.answer);}
      const helpTopic=text.startsWith("help ");
      const matched=topics.map((topic,index)=>{
        const aliases=topic.aliases.filter(a=>contains(text,a));
        const specific=["parker","bluespecs","whop","windsurf","rewards","databricks"].includes(topic.id);
        return {topic,index,score:aliases.length?Math.max(...aliases.map(a=>a.split(" ").length*10))+(specific?30:0):0};
      }).filter(item=>item.score>0).sort((a,b)=>b.score-a.score || a.index-b.index);
      let topic=matched[0]?.topic;
      if(!topic){const words=text.split(" ");topic=topics.find(t=>t.aliases.some(a=>!a.includes(" ") && words.some(w=>nearWord(w,a))));}
      if(topic){lastTopic=topic;
        if(helpTopic)return result(`${topic.label}\nRecognized words and phrases: ${topic.aliases.join(", ")}\nAsk a question using one of these, or follow up with ‘tell me more’.`);
        if(/\b(more|detail|details|deeper)\b/.test(text))return result(topic.answer+"\n\n"+topic.more);
        const second=matched[1]?.topic;
        if(second && /\b(compare|versus|vs|difference|both)\b/.test(text))return result(topic.answer+"\n\n"+second.answer);
        return result(topic.answer);
      }
      if(text==="about") {lastTopic=topics.find(t=>t.id==="about");return result(lastTopic.answer);}
      return result("I haven’t got an entry for that yet. Try a subject like Parker, photography, career, or education.\nType help for every topic, or ‘shall we play a game?’ to take a detour.");
    }
    function observe() {
      const b=Array(9).fill(null),frames=[];let turn="X";
      while(!winner(b)){b[bestMove(b,turn)]=turn;frames.push(boardText(b));turn=turn==="X"?"O":"X";}
      frames.push("EVALUATION COMPLETE // DRAW\nA STRANGE GAME. THE ONLY WINNING MOVE IS NOT TO PLAY.\n\nType 1 to play yourself, again to start a game, or exit to disconnect.");
      return frames;
    }
    return {handle,observe,get mode(){return mode;}};
  }
  const completions=["help","help parker","help photography","games","shall we play a game?","tic tac toe","war","war easy","war hard","deploy ","attack ","move ","inspect ","end","rules","restart","exit","tell me more","history","clear",... ["photos","work","parker","spotify","safari","messages","notes","about","instagram","calendar","settings","trash"].map(a=>`open ${a}`)];
  globalThis.RizvisionsTerminal={createSession,topics,normalize,bestMove,winner,completions};
})();
