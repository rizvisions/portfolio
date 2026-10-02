# Rizvisions Terminal

The terminal runs locally. It uses a curated text bank, topic matching, and session context. It does not call an LLM or send typed questions to a server.

## WarGames Easter egg

Enter `shall we play a game?`, `games`, `wargames`, `wopr`, or `joshua`.

- `1` / `tic tac toe`: play against the computer.
- `2` / `watch`: watch two perfect players reach a draw.
- Enter `1`–`9` to place a mark. Squares run from top left to bottom right.
- Position names work: `top left`, `top middle`, `top right`, `middle left`, `center`, `middle right`, `bottom left`, `bottom middle`, `bottom right`.
- Coordinates work: `a1` is top left, `b2` is center, `c3` is bottom right.
- `play o`: let the computer start. `play x`: start yourself.
- `restart` / `again` / `replay`: start a new round.
- `exit` / `quit` / Escape: disconnect and return to the archive.
- `help` / `rules`: show game instructions.

The computer evaluates all legal continuations with minimax. It is intentionally unbeatable. The green screen, ASCII board, scanlines, and zero-player demonstration refer to WarGames.

## Text bank

`help` lists every topic. `help [topic]` shows recognized aliases for that entry. Matching uses whole words and phrases, prioritizes company names over broad words, and tolerates one missing, added, changed, or transposed character in longer topic words.

Topics: Parker; Blue Specs; Whop / Clip Curator / WAP; Windsurf; Rewards Network; Databricks; photography; creator work; Chicago; Loyola / education; contact / social links; Rizvisions; current work; career history; projects; about Riz.

Examples:

- `What did Riz do at Parker?`
- `Tell me more` / `go deeper` / `what did he do there?` (follows the most recent topic).
- `Compare Databricks versus Rewards Network` (returns both entries).
- `Where did he study?`
- `Where does he live?`
- `Tell me about Databriks` (small typo).
- `What can I ask?`

It also recognizes greetings, how-are-you questions, short replies such as `I'm good`, thanks, questions about how the terminal works, a joke request, and weather requests (it has no live weather).

## Shell controls

- `open`, `launch`, `start`, `show`, `take me to`, `bring up` + an app.
- Apps: Photos, Work / Finder / Projects, Parker, Spotify / Music, Safari / Browser, Messages / iMessage, Notes, About, Instagram, Calendar, Settings, Trash.
- Intervening words work: `show me Parker`, `please open the Spotify app`, `take me to the browser`.
- `history`: show the session’s commands.
- `clear` / `cls`: clear the transcript.
- Up / Down: recall commands; returns to your unsent draft after the newest entry.
- Tab: complete commands and app names. Ambiguous prefixes show the available completions.

Unknown questions receive a topic suggestion. The interpreter does not invent answers or fetch live information. Closing the window ends the session and its command history.

## Global Thermonuclear War campaign

`war` or game-menu option `3` opens an original 18-region territory game. `war easy` adds two reinforcements to your income; `war hard` adds two to the computer’s. Standard mode uses equal rules and budgets.

Win by capturing WOPR’s HQ in China (`CH`) or controlling 12 regions. Your HQ is `US`. The world map shows ownership and troop counts, while dotted routes show allowed movements. Alaska–Siberia is a wraparound connection. Green regions belong to you; amber belongs to WOPR; dim green is neutral.

1. Deploy all reinforcements to regions you own. First-turn example: `deploy CA 4`.
2. Attack a neighboring enemy or neutral region: `attack CA EU 6`.
3. Transfer troops between your regions: `move US CA 3`.
4. Type `end` to give WOPR its turn. It reinforces, expands, transfers interior troops toward its borders, and protects its HQ.

Every region retains one guard. Armies can move once per turn, so arriving troops cannot immediately attack onward. You get four move orders per turn. Income is three armies, plus one per three regions and bonuses for controlling a complete continent: Americas +3, Europe +2, Africa +2, Asia +3, Pacific +2.

Combat is deterministic. Attackers remove 70% of their number from the defending force, rounded down. Defenders remove 60% of their number from the attacking force, rounded down with a minimum of one. A territory is captured when all defenders are eliminated and attackers survive. Surviving attackers return when the attack fails. These are fictional game mechanics.

Click your region to prepare a deployment. Once deployment is complete, select a source and then an adjacent target to prepare an attack or transfer. You may edit the troop count before pressing Enter. `inspect [code]` lists a region’s borders; `rules` shows the complete manual.

`strike CH` requests the nuclear ending. `confirm strike` triggers a launch and WOPR’s retaliation: DEFCON 1, mutual destruction, no winner. `cancel` withdraws the request. Nuclear escalation is a deliberate losing branch; the conventional campaign can be won.

`restart` starts a fresh campaign, `exit` or Escape disconnects. A campaign ends after 40 rounds if neither side has won. Game state lasts for the current Terminal session.

Reference mechanics: [War.app gameplay basics](https://war.app/wiki/Gameplay_Basics). This implementation uses an original map, combat model, AI, rules, and visual assets.
