// Gobble Run — main: boot, state machine, game loop, scaling.
// States: title → playing ⇄ paused → over (caught / escaped).
// Also stages screenshots (?shot=title|play|over|escaped) and exposes a
// small window.GOBBLE handle the playtest uses (start, state, debug hooks).

import { VIEW_W, VIEW_H, GROUND_Y, DIFF_ORDER } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createWorld, updateWorld, computeScore } from './world.js';
import {
  drawGame, drawTitle, drawPaused, drawEnd, HUD_BUTTONS,
} from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const sfx = createAudio();

function loadBest() {
  try { return Number(localStorage.getItem('gobble-best') || 0) || 0; } catch { return 0; }
}
function saveBest(v) {
  try { localStorage.setItem('gobble-best', String(v)); } catch { /* storage off */ }
}

const game = {
  state: 'title', // title | playing | paused | over
  world: createWorld('normal'),
  best: loadBest(),
  selectedDiff: 'normal',
  isNewBest: false,
  titleButtons: null,
  pauseButtons: null,
  endButtons: null,
  shotStaged: false,
};

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

function startRun(diffKey) {
  game.world = createWorld(diffKey);
  game.selectedDiff = diffKey;
  game.state = 'playing';
  game.isNewBest = false;
  input.consumeJump();
  input.consumeAny();
  sfx.unlock();
  sfx.gobble();
  document.body.classList.remove('touch'); // touch buttons show via body.touch only when touch
  if (input.state.isTouch) document.body.classList.add('touch');
}

function endRun() {
  game.state = 'over';
  const score = computeScore(game.world);
  if (score > game.best) {
    game.best = score;
    game.isNewBest = true;
    saveBest(score);
  }
}

function inRect(p, r) {
  return p && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

function update(dt) {
  // Mute is global.
  if (input.consumeMute()) sfx.toggleMute();

  if (game.state === 'title') {
    const click = input.consumeClick();
    if (click && game.titleButtons) {
      for (const b of game.titleButtons.diffButtons) {
        if (inRect(click, b)) { game.selectedDiff = b.key; sfx.unlock(); sfx.click(); }
      }
      if (inRect(click, game.titleButtons.startButton)) startRun(game.selectedDiff);
    } else if (input.consumeAny()) {
      sfx.unlock();
      startRun(game.selectedDiff);
    }
    return;
  }

  if (game.state === 'playing') {
    input.consumeAny(); // jumps set this flag too; it must not leak into the end screen
    if (input.consumePause()) {
      game.state = 'paused';
      input.consumeAny(); // the same press must not instantly resume
      input.consumeJump();
      return;
    }
    const click = input.consumeClick();
    if (click) {
      if (inRect(click, HUD_BUTTONS.pause)) { game.state = 'paused'; return; }
      if (inRect(click, HUD_BUTTONS.mute)) { sfx.toggleMute(); return; }
    }
    updateWorld(game.world, dt, input, sfx);
    if (game.world.over) endRun();
    return;
  }

  if (game.state === 'paused') {
    if (input.consumePause()) {
      input.consumeAny(); // the same press must not instantly re-pause
      game.state = 'playing';
      return;
    }
    const click = input.consumeClick();
    if (click && game.pauseButtons && inRect(click, game.pauseButtons.resumeButton)) {
      game.state = 'playing';
    } else if (input.consumeAny()) {
      game.state = 'playing';
    }
    return;
  }

  if (game.state === 'over') {
    const click = input.consumeClick();
    if (click && game.endButtons && inRect(click, game.endButtons.againButton)) {
      startRun(game.selectedDiff);
    } else if (input.consumeAny()) {
      startRun(game.selectedDiff);
    }
  }
}

function render(time) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (game.state === 'title') {
    game.titleButtons = drawTitle(ctx, game.world, game.best, game.selectedDiff);
  } else if (game.state === 'playing' || game.state === 'paused') {
    drawGame(ctx, game.world, time, sfx.isMuted());
    if (game.state === 'paused') game.pauseButtons = drawPaused(ctx);
  } else if (game.state === 'over') {
    // Keep the last run visible behind the end panel.
    drawGame(ctx, game.world, time, sfx.isMuted());
    game.endButtons = drawEnd(ctx, game.world, game.best, game.isNewBest);
  }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render(now / 1000);
  requestAnimationFrame(loop);
}

// --- screenshot staging: ?shot=title|play|over|escaped ---
// Puts the game in a photogenic state on load. Only affects the first paint.
function stageShot() {
  const shot = new URLSearchParams(location.search).get('shot');
  if (!shot) return;
  if (shot === 'title') { game.state = 'title'; return; }
  if (shot === 'play' || shot === 'over' || shot === 'escaped') {
    startRun('normal');
    const w = game.world;
    // Run the world forward so the scene is mid-chase, then freeze it.
    // The fake player jumps jumpable obstacles and slides under branches.
    const fakeInput = {
      consumeJump: () => {
        const near = w.obstacles.find((o) => !o.falling && o.landed && o.kind === 'jump' && o.x > 150 && o.x < 430);
        return !!near && w.turkey.onGround;
      },
      isSliding: () => !!w.obstacles.find((o) => o.kind === 'slide' && o.x > 120 && o.x < 430),
    };
    const silent = {
      jump: () => {}, pickup: () => {}, feather: () => {},
      hit: () => {}, caught: () => {}, escaped: () => {},
    };
    for (let i = 0; i < 60 * 7; i++) updateWorld(w, 1 / 60, fakeInput, silent);
    w.turkey.invuln = 0;
    if (shot === 'play') {
      // Dress the scene so the cover reads at a glance: full hearts, the
      // farmer close behind, a fence and a hay bale ahead, corn to grab.
      w.hearts = w.maxHearts;
      w.pursuit = 130;
      w.turkey.y = GROUND_Y;
      w.turkey.vy = 0;
      w.turkey.onGround = true;
      w.turkey.sliding = false;
      w.obstacles = [
        { type: 'fence', x: 620, y: GROUND_Y - 66, w: 36, h: 66, kind: 'jump', falling: false, landed: true, passed: false },
        { type: 'hay', x: 830, y: GROUND_Y - 60, w: 58, h: 60, kind: 'jump', falling: false, landed: true, passed: false },
      ];
      w.pickups = [
        { kind: 'corn', x: 520, y: 410, w: 34, h: 40, taken: false, bob: 0 },
        { kind: 'corn', x: 564, y: 410, w: 34, h: 40, taken: false, bob: 1 },
        { kind: 'corn', x: 700, y: 300, w: 34, h: 40, taken: false, bob: 2 },
        { kind: 'feather', x: 760, y: 290, w: 30, h: 34, taken: false, bob: 3 },
      ];
      w.knifeWarn = null;
    }
    if (shot === 'over') {
      w.hearts = 0;
      w.over = true;
      w.overKind = 'caught';
      endRun();
    } else if (shot === 'escaped') {
      w.over = true;
      w.overKind = 'escaped';
      endRun();
    } else {
      // Freeze mid-run: stop the loop from advancing the world by pausing
      // the clock — the loop still renders, but update() is skipped while
      // we hold a flag the playtest clears with GOBBLE.unfreeze().
      game.frozen = true;
    }
    game.shotStaged = true;
  }
}
stageShot();

// The frozen play shot: keep rendering, skip updating, until unfrozen.
const baseUpdate = update;
update = function frozenUpdate(dt) {
  if (game.frozen) {
    input.consumeJump(); input.consumePause(); input.consumeMute();
    input.consumeAny(); input.consumeClick();
    return;
  }
  baseUpdate(dt);
};

// --- playtest / debug handle (invisible, no effect on normal play) ---
window.GOBBLE = {
  get state() { return game.state; },
  get world() { return game.world; },
  get best() { return game.best; },
  get selectedDiff() { return game.selectedDiff; },
  get muted() { return sfx.isMuted(); },
  start: (d) => startRun(d || game.selectedDiff),
  unfreeze: () => { game.frozen = false; },
  debug: {
    setDistanceM(m) { game.world.distancePx = m * 50; },
    setHearts(n) { game.world.hearts = n; },
    setPursuit(px) { game.world.pursuit = px; },
    forceHit() { game.world.hearts = Math.max(0, game.world.hearts - 1); if (game.world.hearts === 0) { game.world.over = true; game.world.overKind = 'caught'; endRun(); } },
    spawn(kind) {
      const w = game.world;
      const defs = { fence: { w: 36, h: 66 }, hay: { w: 58, h: 60 }, fox: { w: 74, h: 42 } };
      const d = defs[kind] || defs.fence;
      w.obstacles.push({ type: kind, x: 700, y: 540 - 84 - d.h, w: d.w, h: d.h, kind: 'jump', falling: false, landed: true, passed: false });
    },
  },
};

requestAnimationFrame(loop);
