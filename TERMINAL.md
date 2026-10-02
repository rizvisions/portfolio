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
