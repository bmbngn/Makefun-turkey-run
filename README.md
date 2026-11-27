# Gobble Run — Turkey Escape Game

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/bmbngn/Makefun-turkey-run/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/bmbngn/Makefun-turkey-run/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

Gobble Run is a 2D canvas runner built for make.fun's ["Make the best turkey escape game" bounty](https://make.fun/bounty/turkey-run-game-01). You are a turkey fleeing the farm at dusk, trying not to become Thanksgiving dinner: jump fences and hay bales, slide under low branches, dodge the farmer with his net, foxes and falling carving knives, and collect corn and rare golden feathers. The farmer chases on a pursuit meter — every hit lets him gain, corn pushes him back. Cross 4 stages (Farmyard, Cornfield, Woods, Kitchen Yard) and reach the garden gate at 3000 m to escape. Three difficulties, keyboard and touch controls, and it runs offline on desktop and phone from its own files.

## How to play

- **Jump:** Space / Up / W, or tap the on-screen JUMP button
- **Slide:** Down / S, or the on-screen SLIDE button
- **Pause:** P · **Mute:** M · **Restart:** Enter on the end screen

Corn is worth 10 points, golden feathers 50 points plus a heart. You start with 3 hearts (4 on Easy, 2 on Hard). Lose them all — or let the farmer close the gap — and you're caught.

## Run it

The game is plain static files under `game/` with no build step. Serve `game/` with any static HTTP server, for example:

```sh
npx serve game
```

then open http://localhost:3000. `game/index.html` is the entry point; everything the game loads is a file under `game/`, and it makes no network requests.
