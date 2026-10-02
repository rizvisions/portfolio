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

`war` or game-menu option `3` opens an original 32-region territory game across the website viewport. `war easy` adds two reinforcements to your income; `war hard` adds two to WOPR's. Chrome's real browser bar stays visible. Escape returns to the desktop without ending the campaign; Expand brings the game back. `exit` disconnects. Closing Terminal ends the session.

Win by capturing China (`CH`, WOPR HQ) or controlling 22 regions. WOPR wins by capturing `US` or controlling 22. Green is YOU, amber is WOPR, and gray is NEUTRAL. Selection adds a white outline without changing the faction color. Dotted routes show neighboring regions, including Alaska–Siberia.

### Plan, commit, watch

1. Deploy reinforcements immediately to regions you own. First-round example: `deploy CA 4` changes Canada from five armies to nine right away. Deploy now does the same through the map editor. Undo or reset deployment before committing if you change your mind.
2. Queue up to four actions. `attack CA EU 6` attacks a neighboring hostile or neutral region. `move US CA 3` transfers between regions you own. Launches and shields also occupy one action slot.
3. Review your queue. Remove or reorder actions; clear the whole plan if needed. You may commit fewer than four actions. Queuing the fourth never commits automatically.
4. Click Commit turn or type `commit`. Both sides' action plans lock. WOPR chose its orders independently from the start-of-round board, without reading your deployments or pending actions.
5. Watch both sides resolve. WOPR reveals and applies its deployment, then shields activate. Your deployment has already happened and is not added again. Other actions interleave. YOU has first action priority on odd rounds, WOPR on even rounds; priority also reverses between action slots. Each moving action first shows its route and starting troops, then its result with casualties and before/after counts. Pause stops playback; Show result and Next event advance it manually. Slow, Normal, and Fast control timing. Skip to summary jumps to the result while preserving the full event log. Review this round changes no game state and preserves any newly edited deployment or actions.

Click an owned region to deploy, or select a source followed by an adjacent destination to prepare movement. After deploying, clicking another owned region selects it as a new source. Friendly transfers can be prepared with the Transfer destination buttons; enemy or neutral neighbors can be clicked on the map or selected using Attack buttons. The US starts with only friendly neighbors, so its initial role is to send troops toward the frontier. Alaska–Siberia is drawn as two connected routes across the left and right map edges.

The numeric editor starts with a small useful troop count, not automatically the maximum. Max is an explicit choice. It shows troops available, troops left defending, and estimated combat losses. Estimates use the current board; earlier orders or the opponent can change the result.

One army stays behind to hold a region. Available means its current army, which already includes deployed troops, minus the guard and troops already assigned to other actions. Each army moves once per round. Arriving troops, returning survivors, and newly captured territories cannot attack onward until next round. You can issue multiple orders from the same source using different unassigned troops. If an earlier action captures a source, its later orders cancel. If casualties leave fewer troops, a later order sends only what remains available. Changed target ownership can also cancel an order; playback explains why.

Income is three armies, plus one per three regions and full-continent bonuses: Americas +5, Europe +3, Africa +4, Asia +6, Pacific +2. A campaign ends in stalemate after 40 rounds if neither side wins.

### Combat

Attackers eliminate 60% of their number from the defending force. Defenders eliminate 70% of their number from the attacking force. Both losses are rounded to the nearest whole army and applied simultaneously. Capture requires all defenders eliminated and at least one attacker surviving. If both forces are eliminated, one defender remains. Failed attacks return surviving attackers to their source; they have used their move for that round.

Example: three attackers against two defenders eliminate two defenders and lose one attacker, capturing with two survivors. Two against two eliminate one defender and lose one attacker, leaving one defender and returning one survivor.

### Nuclear escalation

Each side begins with three missiles. Each can queue at most one launch and one shield per round.

- `strike CH` requests a launch; `confirm strike` queues it, while `cancel` withdraws the request. Nothing fires or consumes a missile until resolution.
- A strike halves the target army, rounded up with at least one survivor. It does not capture territory. A target that is no longer hostile cancels the launch.
- `shield US` protects that owned region from one missile during this round. Shields activate before any launch or movement, regardless of queue position. Shield orders are excluded from movement-slot numbering, so moving a shield in the list does not delay other actions. You can queue one every round, with no shield stock limit; the cost is one of four order slots. It stops one missile, not conventional troop attacks. You can shield a friendly transfer destination, but cannot shield a territory you only plan to capture. A shield occupies one action slot, as does a launch.
- Every fired missile lowers shared DEFCON by one, including intercepted missiles. A round without launches restores one level, up to DEFCON 5.
- Reaching DEFCON 1 ends the campaign in mutual destruction. Neither side wins.
- WOPR can defend, retaliate, and initiate escalation. It considers previous launches, strong opposing armies, and later-round opportunities; it does not inspect your current queue.

These are fictional game rules. Nuclear escalation is a playable risk, rather than an immediate ending on the first launch.

### Commands and controls

| Purpose | Commands |
| --- | --- |
| Reinforce | `deploy CA 4`, `reinforce CA 4`, `place CA 4` |
| Move or attack | `attack CA EU 6`, `move US CA 3`, `transfer US CA 3` |
| Nuclear actions | `strike CH`, `confirm strike`, `cancel`, `shield US` |
| Edit plan | `remove 1`, `up 2`, `down 1`, `undo`, `undeploy 1`, `reset orders` |
| Inspect | `inspect EU`, `info Western Europe`, `status`, `map`, `sitrep` |
| Resolve | `commit`, `end`, `end turn`, `done`, `next` |
| Manual or session | `rules`, `help`, `how to play`, `restart`, `exit` |

SFX toggles locally synthesized movement and launch cues. Music toggles an original 2:59 arranged synth score, Night Watch, with a sparse intro, melodic theme, suspended bridge, development, climax, and coda; it starts only when enabled and pauses on returning to the desktop. Music starts off; enable Music on and adjust its dedicated Volume slider (default 65%). Missile flight and impact have distinct event cards and a brief map shake only during actual firing. Reduced-motion settings suppress the shake.

The event log accumulates the turn history. Its default height is 160 pixels; drag its separator, use the Height slider, or focus the separator and press Up/Down to resize it. Hide console hides the log and command input while retaining all map, order, playback, rules, restart, and Leave game controls. Commands are optional during the campaign. Rules opens the full manual in the game. Escape closes the manual first if it is open, otherwise returns the expanded game to the desktop. All campaign state remains local to the current Terminal session.

Reference mechanics: [War.app combat basics](https://war.app/wiki/Combat_Basics) and [move order](https://war.app/wiki/Move_Order). The map, AI, nuclear rules, and visual assets are original to this implementation.

Victory opens a mission-complete debrief with the winning objective, rounds fought, territories held and captured, troop losses, missiles launched, and final DEFCON. Inspect final map dismisses it without ending the campaign; New campaign starts fresh. The completion sound respects SFX. The 32-region map retains reciprocal world routes and expands continent bonuses; world-control victory requires 22 territories.

Map selection is separate from movement. Click a region to inspect it; click it again, Clear selection, or the empty map to deselect. Attack/Transfer buttons preview their destination on hover or keyboard focus. Use Pick destination on map to explicitly enter movement targeting. Enemy selection exposes a single Queue launch action with casualties and DEFCON shown in advance. Already queued launches and shields are labeled and disabled; remove their queue entry to replace them.

The bonus buttons show each group’s reward and your held/required territory counts. Click one to list missing regions; hover highlights its territories. Income is broken down into base, territory and continent armies. Geographic shapes use public-domain Natural Earth data, grouped into fictional game regions; travel routes remain explicit game rules.

On-map troop receipts distinguish reinforcements, transferred armies, attacking armies, defender losses and occupying survivors. Playback pace and pause/step controls remain unchanged. The final debrief is presented as a restrained text transmission instead of neon statistic cards.
