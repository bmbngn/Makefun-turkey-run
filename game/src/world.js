// Gobble Run — world: the run itself. Spawning, physics, collisions,
// the farmer's pursuit, stages and scoring. No drawing happens here.

import {
  VIEW_W, GROUND_Y, TURKEY_X, GRAVITY, JUMP_V, COYOTE_MS,
  PX_PER_M, ESCAPE_M, TURKEY_STAND, TURKEY_SLIDE, PURSUIT,
  STAGES, DIFFICULTIES, OBSTACLES, STAGE_OBSTACLES, PICKUPS,
} from './config.js';

function rand(a, b) { return a + Math.random() * (b - a); }
function pickWeighted(entries) {
  let total = 0;
  for (const e of entries) total += e.weight;
  let roll = Math.random() * total;
  for (const e of entries) { roll -= e.weight; if (roll <= 0) return e; }
  return entries[entries.length - 1];
}

export function createWorld(diffKey) {
  const diff = DIFFICULTIES[diffKey];
  const world = {
    diffKey,
    diff,
    time: 0,
    distancePx: 0,
    speed: diff.speed0,
    hearts: diff.hearts,
    maxHearts: diff.hearts,
    corn: 0,
    feathers: 0,
    pursuit: diff.pursuit, // px gap to the farmer; 0 = caught
    pursuitMax: diff.pursuit,
    shake: 0, // screen shake timer, set on a hit for impact feedback
    turkey: { y: GROUND_Y, vy: 0, onGround: true, sliding: false, slideT: 0, coyote: 0, invuln: 0, runPhase: 0 },
    obstacles: [], // {type, x, y, w, h, kind, passed, falling, vy, landed}
    pickups: [], // {kind, x, y, w, h, taken, bob}
    particles: [], // {x, y, vx, vy, life, color, size}
    nextSpawnX: VIEW_W + 200,
    knifeWarn: null, // {x} — a knife is about to fall here
    over: false,
    overKind: null, // 'caught' | 'escaped'
    score: 0,
  };
  return world;
}

export function stageIndex(distancePx) {
  const m = distancePx / PX_PER_M;
  let idx = 0;
  for (let i = 0; i < STAGES.length; i++) if (m >= STAGES[i].from) idx = i;
  return idx;
}

export function currentSpeed(world) {
  const m = world.distancePx / PX_PER_M;
  const t = Math.min(1, m / ESCAPE_M);
  return world.diff.speed0 + (world.diff.speed1 - world.diff.speed0) * t;
}

export function computeScore(world) {
  const m = Math.floor(world.distancePx / PX_PER_M);
  return m + world.corn * PICKUPS.corn.score + world.feathers * PICKUPS.feather.score;
}

function spawnObstacle(world) {
  const si = stageIndex(world.distancePx);
  const allowed = STAGE_OBSTACLES[si];
  const entries = allowed.map((k) => ({ key: k, weight: OBSTACLES[k].weight }));
  const { key } = pickWeighted(entries);
  const def = OBSTACLES[key];
  const x = world.nextSpawnX;
  if (key === 'knife') {
    // A carving knife falls from the sky with a warning, then sticks in the dirt.
    world.knifeWarn = { x, t: 0.55 };
    world.obstacles.push({ type: 'knife', x, y: -80, w: def.w, h: def.h, kind: 'jump', falling: true, vy: 0, landed: false, passed: false });
    return;
  }
  world.obstacles.push({
    type: key, x, y: GROUND_Y - def.h + def.base, w: def.w, h: def.h,
    kind: def.kind, base: def.base, falling: false, landed: true, passed: false,
  });
}

function spawnPickup(world, x) {
  const kind = Math.random() < 0.12 ? 'feather' : 'corn';
  const def = PICKUPS[kind];
  // Corn rides low (easy grab), feathers ride high (earn it with a jump).
  const y = kind === 'feather'
    ? GROUND_Y - 150 - rand(0, 40)
    : GROUND_Y - 46 - rand(0, 30);
  world.pickups.push({ kind, x, y, w: def.w, h: def.h, taken: false, bob: rand(0, 6) });
}

function burst(world, x, y, color, n = 10) {
  for (let i = 0; i < n; i++) {
    world.particles.push({
      x, y, vx: rand(-140, 60), vy: rand(-260, -40),
      life: rand(0.3, 0.7), color, size: rand(2, 5),
    });
  }
}

function turkeyBox(world) {
  const t = world.turkey;
  const shape = t.sliding ? TURKEY_SLIDE : TURKEY_STAND;
  // The box is forgiving: a little narrower than the drawing.
  return { x: TURKEY_X - shape.w / 2 + 8, y: t.y - shape.h, w: shape.w - 16, h: shape.h };
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function updateWorld(world, dt, input, sfx) {
  const t = world.turkey;
  world.time += dt;
  world.speed = currentSpeed(world);
  world.distancePx += world.speed * dt;
  world.score = computeScore(world);

  // The farmer closes in slowly unless the turkey runs clean or eats corn.
  world.pursuit = Math.min(world.pursuitMax, world.pursuit + PURSUIT.regenPerSec * dt);
  if (world.pursuit <= 0) {
    world.over = true;
    world.overKind = 'caught';
    sfx.caught();
    return;
  }

  // --- turkey physics ---
  const wantSlide = input.isSliding() && t.onGround;
  t.sliding = wantSlide;
  if (wantSlide) t.slideT += dt; else t.slideT = 0;
  if (t.onGround) t.coyote = COYOTE_MS / 1000;
  else t.coyote -= dt;
  if (input.consumeJump() && (t.onGround || t.coyote > 0)) {
    t.vy = -JUMP_V;
    t.onGround = false;
    t.sliding = false;
    t.coyote = 0;
    sfx.jump();
    burst(world, TURKEY_X, GROUND_Y, '#e8d8b0', 5);
  }
  t.vy += GRAVITY * dt;
  t.y += t.vy * dt;
  if (t.y >= GROUND_Y) {
    if (!t.onGround && t.vy > 500) burst(world, TURKEY_X, GROUND_Y, '#c8a878', 4);
    t.y = GROUND_Y;
    t.vy = 0;
    t.onGround = true;
  }
  t.runPhase += dt * world.speed / 40;
  if (t.invuln > 0) t.invuln -= dt;

  // --- spawning ---
  const gap = rand(world.diff.gapMin, world.diff.gapMax);
  world.nextSpawnX -= world.speed * dt;
  if (world.nextSpawnX < VIEW_W + 60) {
    spawnObstacle(world);
    // Sometimes a corn trail leads over / under the new obstacle.
    const last = world.obstacles[world.obstacles.length - 1];
    if (last && last.type !== 'knife' && Math.random() < 0.6) {
      const n = 3;
      for (let i = 0; i < n; i++) spawnPickup(world, last.x + 30 + i * 44);
    } else if (Math.random() < 0.35) {
      spawnPickup(world, world.nextSpawnX + rand(0, 120));
    }
    world.nextSpawnX += gap + (last ? last.w : 0);
  }

  // --- knife warning + falling ---
  if (world.knifeWarn) {
    world.knifeWarn.t -= dt;
    if (world.knifeWarn.t <= 0) world.knifeWarn = null;
  }

  // --- move + collide ---
  const box = turkeyBox(world);
  const hit = (ob) => {
    if (t.invuln > 0 || world.over) return;
    world.hearts -= 1;
    t.invuln = 1.6;
    world.shake = 0.3;
    world.pursuit = Math.max(0, world.pursuit - PURSUIT.hitLoss);
    sfx.hit();
    burst(world, TURKEY_X, t.y - 30, '#e83a4a', 12);
    if (world.hearts <= 0 || world.pursuit <= 0) {
      world.over = true;
      world.overKind = 'caught';
      sfx.caught();
    }
  };

  for (const ob of world.obstacles) {
    if (ob.falling) {
      ob.vy += 4200 * dt;
      ob.y += ob.vy * dt;
      const restY = GROUND_Y - ob.h;
      if (ob.y >= restY) {
        ob.y = restY;
        ob.falling = false;
        ob.landed = true;
        burst(world, ob.x + ob.w / 2, GROUND_Y, '#c8a878', 8);
      }
      continue; // a falling knife cannot hit yet
    }
    ob.x -= world.speed * dt;
    if (!ob.passed && ob.x + ob.w < TURKEY_X - TURKEY_STAND.w / 2) {
      ob.passed = true;
    }
    if (ob.landed) {
      // A low branch hangs from the top of the screen down to its tip:
      // the whole hanging limb is solid, so the only way past is to slide.
      const obBox = ob.type === 'branch'
        ? { x: ob.x + 4, y: 0, w: ob.w - 8, h: GROUND_Y - 50 }
        : { x: ob.x + 4, y: ob.y, w: ob.w - 8, h: ob.h };
      if (overlap(box, obBox)) hit(ob);
    }
  }
  world.obstacles = world.obstacles.filter((o) => o.x + o.w > -80);

  for (const p of world.pickups) {
    p.x -= world.speed * dt;
    p.bob += dt * 4;
    if (!p.taken) {
      const pBox = { x: p.x, y: p.y + Math.sin(p.bob) * 4, w: p.w, h: p.h };
      if (overlap(box, pBox)) {
        p.taken = true;
        if (p.kind === 'corn') {
          world.corn += 1;
          world.pursuit = Math.min(world.pursuitMax, world.pursuit + PURSUIT.cornGain);
          sfx.pickup();
          burst(world, p.x + p.w / 2, p.y + p.h / 2, '#ffd23e', 6);
        } else {
          world.feathers += 1;
          world.hearts = Math.min(world.maxHearts, world.hearts + 1);
          world.pursuit = Math.min(world.pursuitMax, world.pursuit + PURSUIT.featherGain);
          sfx.feather();
          burst(world, p.x + p.w / 2, p.y + p.h / 2, '#ffd700', 14);
        }
      }
    }
  }
  world.pickups = world.pickups.filter((p) => !p.taken && p.x + p.w > -40);

  for (const pt of world.particles) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vy += 900 * dt;
    pt.life -= dt;
  }
  world.particles = world.particles.filter((p) => p.life > 0);
  if (world.shake > 0) world.shake -= dt;

  // --- escape: out the garden gate at 3000 m ---
  if (world.distancePx / PX_PER_M >= ESCAPE_M) {
    world.over = true;
    world.overKind = 'escaped';
    sfx.escaped();
  }
}
