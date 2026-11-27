// Gobble Run — render: every pixel the player sees, drawn on canvas.
// Vector art only (no image assets). Background, turkey, farmer, obstacles,
// pickups, particles, HUD, and the title / pause / end screens.

import {
  VIEW_W, VIEW_H, GROUND_Y, GROUND_H, TURKEY_X,
  TURKEY_STAND, TURKEY_SLIDE, STAGES, COLORS, ESCAPE_M, PX_PER_M,
} from './config.js';
import { stageIndex } from './world.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function heart(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.2, y, x - s * 0.5, y - s, x, y - s * 0.3);
  ctx.bezierCurveTo(x + s * 0.5, y - s, x + s * 1.2, y, x, y + s * 0.9);
  ctx.fill();
}

// --- the turkey, drawn facing right; runPhase animates the legs ---
function drawTurkey(ctx, x, feetY, runPhase, sliding, invuln, time) {
  ctx.save();
  if (invuln > 0 && Math.floor(time * 12) % 2 === 0) ctx.globalAlpha = 0.35;
  ctx.translate(x, feetY);
  if (sliding) {
    // Low, stretched-out slide: tail up, head forward.
    ctx.fillStyle = COLORS.turkeyBody;
    ellipse(ctx, 0, -16, 40, 15);
    ctx.fillStyle = COLORS.turkeyDark;
    ellipse(ctx, -34, -20, 16, 10);
    ctx.fillStyle = COLORS.turkeyLight;
    ellipse(ctx, 30, -24, 12, 9); // head
    ctx.fillStyle = COLORS.turkeyWattle;
    ellipse(ctx, 38, -16, 4, 7);
    ctx.fillStyle = COLORS.turkeyBeak;
    ctx.beginPath(); ctx.moveTo(40, -26); ctx.lineTo(54, -22); ctx.lineTo(40, -19); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(31, -27, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(32, -27, 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return;
  }
  const bob = Math.sin(runPhase) * 3;
  const legSwing = Math.sin(runPhase) * 10;
  // Fanned tail feathers.
  ctx.fillStyle = COLORS.turkeyDark;
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.translate(-26, -46);
    ctx.rotate(i * 0.38);
    ctx.beginPath();
    ctx.ellipse(0, -22, 9, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = COLORS.turkeyLight;
  for (let i = -1; i <= 1; i++) {
    ctx.save();
    ctx.translate(-26, -44);
    ctx.rotate(i * 0.42);
    ctx.beginPath();
    ctx.ellipse(0, -18, 5, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Legs.
  ctx.strokeStyle = '#e8a33d';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -14); ctx.lineTo(-6 + legSwing, 0);
  ctx.moveTo(8, -14); ctx.lineTo(8 - legSwing, 0);
  ctx.stroke();
  // Body.
  ctx.fillStyle = COLORS.turkeyBody;
  ellipse(ctx, 0, -34 + bob * 0.3, 30, 26);
  ctx.fillStyle = COLORS.turkeyLight;
  ellipse(ctx, 6, -28 + bob * 0.3, 20, 16);
  // Wing.
  ctx.fillStyle = COLORS.turkeyDark;
  ctx.beginPath();
  ctx.ellipse(-4, -34 + bob * 0.3, 16, 11, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // Head + wattle + beak.
  ctx.fillStyle = COLORS.turkeyLight;
  ellipse(ctx, 26, -62 + bob * 0.3, 11, 10);
  ctx.fillStyle = COLORS.turkeyWattle;
  ellipse(ctx, 30, -50 + bob * 0.3, 4, 8);
  ctx.fillStyle = COLORS.turkeyBeak;
  ctx.beginPath(); ctx.moveTo(34, -64); ctx.lineTo(48, -60); ctx.lineTo(34, -56); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(28, -65, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(29, -65, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// --- the farmer, chasing from behind with his net ---
function drawFarmer(ctx, x, feetY, runPhase) {
  const bob = Math.abs(Math.sin(runPhase * 0.9)) * 4;
  ctx.save();
  ctx.translate(x, feetY - bob);
  // Legs (running).
  const swing = Math.sin(runPhase * 0.9) * 12;
  ctx.strokeStyle = '#2a2a3a';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, -34); ctx.lineTo(-4 + swing, 0);
  ctx.moveTo(6, -34); ctx.lineTo(6 - swing, 0);
  ctx.stroke();
  // Overalls + shirt.
  ctx.fillStyle = COLORS.farmerOveralls;
  rr(ctx, -16, -66, 32, 36, 6); ctx.fill();
  ctx.fillStyle = COLORS.farmerShirt;
  rr(ctx, -18, -78, 36, 18, 6); ctx.fill();
  // Head + hat.
  ctx.fillStyle = COLORS.farmerSkin;
  ellipse(ctx, 2, -88, 11, 11);
  ctx.fillStyle = COLORS.farmerHat;
  rr(ctx, -10, -98, 26, 7, 3); ctx.fill();
  rr(ctx, -6, -108, 16, 12, 3); ctx.fill();
  // Arm + net, held high and forward.
  ctx.strokeStyle = COLORS.farmerSkin;
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(10, -72); ctx.lineTo(30, -92); ctx.stroke();
  ctx.strokeStyle = '#8a6a3a';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(38, -100, 16, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(220, 220, 220, 0.7)';
  ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.moveTo(38 - 14, -100 + i * 8); ctx.lineTo(38 + 14, -100 + i * 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(38 + i * 8, -100 - 14); ctx.lineTo(38 + i * 8, -100 + 14); ctx.stroke();
  }
  ctx.restore();
}

function drawFox(ctx, x, feetY, time) {
  ctx.save();
  ctx.translate(x, feetY);
  const bob = Math.sin(time * 10) * 2;
  ctx.fillStyle = COLORS.foxBody;
  ellipse(ctx, 0, -22 + bob, 36, 16); // body
  ctx.beginPath(); ctx.moveTo(28, -30); ctx.lineTo(52, -44 + bob); ctx.lineTo(48, -18); ctx.closePath(); ctx.fill(); // tail
  ctx.fillStyle = COLORS.foxBelly;
  ellipse(ctx, 26, -30 + bob, 10, 9); // head
  ctx.fillStyle = COLORS.foxBody;
  ctx.beginPath(); ctx.moveTo(20, -38); ctx.lineTo(24, -52); ctx.lineTo(30, -38); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(30, -38); ctx.lineTo(36, -52); ctx.lineTo(38, -36); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(30, -31, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawFence(ctx, x, y, w, h) {
  ctx.fillStyle = '#6b4a2a';
  ctx.fillRect(x, y, 6, h);
  ctx.fillRect(x + w - 6, y, 6, h);
  ctx.fillStyle = '#8a6238';
  ctx.fillRect(x - 4, y + 8, w + 8, 8);
  ctx.fillRect(x - 4, y + h - 18, w + 8, 8);
  ctx.fillStyle = '#a87a48';
  ctx.fillRect(x - 4, y + 8, w + 8, 3);
}

function drawHay(ctx, x, y, w, h) {
  ctx.fillStyle = '#d8a83e';
  ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#b8892a';
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 6, h / 2 - 6, 0, i * 0.9, i * 0.9 + 1.2);
    ctx.stroke();
  }
}

function drawBranch(ctx, x, bottomY, w) {
  // A low limb hanging from the top of the screen, leaves at its tip.
  ctx.strokeStyle = '#5a3a22';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - 14, -10);
  ctx.quadraticCurveTo(x + w / 2 + 6, bottomY * 0.5, x + w / 2, bottomY);
  ctx.stroke();
  ctx.fillStyle = '#4a7a2e';
  ellipse(ctx, x + w / 2 - 8, bottomY - 8, 16, 10);
  ellipse(ctx, x + w / 2 + 12, bottomY - 2, 14, 9);
  ctx.fillStyle = '#c98f2e';
  ellipse(ctx, x + w / 2 + 2, bottomY + 2, 7, 5);
}

function drawKnife(ctx, x, y, w, h, falling) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (falling) ctx.rotate(0.5);
  ctx.fillStyle = COLORS.knifeBlade;
  ctx.beginPath();
  ctx.moveTo(-5, -h / 2);
  ctx.lineTo(5, -h / 2);
  ctx.lineTo(0, h / 2 - 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLORS.knifeHandle;
  rr(ctx, -4, h / 2 - 12, 8, 12, 3); ctx.fill();
  ctx.restore();
}

function drawOven(ctx, x, y, w, h) {
  ctx.fillStyle = '#7a3a2a';
  rr(ctx, x, y, w, h, 8); ctx.fill();
  ctx.fillStyle = '#5a2a1e';
  rr(ctx, x + 8, y + 8, w - 16, 22, 4); ctx.fill();
  // Fire glow in the oven mouth.
  ctx.fillStyle = '#ff9e2e';
  rr(ctx, x + 14, y + 38, w - 28, h - 48, 6); ctx.fill();
  ctx.fillStyle = '#ffd23e';
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - 14, y + h - 12);
  ctx.quadraticCurveTo(x + w / 2, y + 44, x + w / 2 + 14, y + h - 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(x + 6, y - 6, w - 12, 6); // chimney ledge
}

function drawCorn(ctx, x, y, bob) {
  ctx.save();
  ctx.translate(x + 17, y + 20 + Math.sin(bob) * 4);
  ctx.fillStyle = '#3d7a2e';
  ctx.beginPath(); ctx.moveTo(-12, 8); ctx.lineTo(-20, -14); ctx.lineTo(-6, -2); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(12, 8); ctx.lineTo(20, -14); ctx.lineTo(6, -2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = COLORS.cornYellow;
  ctx.beginPath(); ctx.ellipse(0, 0, 9, 16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8a33d';
  for (let i = -1; i <= 1; i++) {
    ctx.fillRect(i * 5 - 1, -12, 2, 24);
  }
  ctx.restore();
}

function drawFeather(ctx, x, y, bob, time) {
  ctx.save();
  ctx.translate(x + 15, y + 17 + Math.sin(bob) * 4);
  ctx.rotate(Math.sin(time * 2) * 0.15);
  ctx.fillStyle = COLORS.featherGold;
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 15, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b8892a';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(0, 15); ctx.stroke();
  ctx.restore();
}

// --- background: dusk sky, sun, far hills, barn, trees, ground ---
function drawBackground(ctx, world, scrollPx) {
  const stage = STAGES[stageIndex(world.distancePx)];
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, stage.skyTop);
  g.addColorStop(0.55, stage.skyMid);
  g.addColorStop(1, stage.skyLow);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, GROUND_Y);
  // Low sun.
  ctx.fillStyle = '#fff2c8';
  ctx.beginPath(); ctx.arc(760, 120, 34, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255, 242, 200, 0.35)';
  ctx.beginPath(); ctx.arc(760, 120, 52, 0, Math.PI * 2); ctx.fill();
  // Far hills.
  ctx.fillStyle = stage.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= VIEW_W; x += 40) {
    const px = x + scrollPx * 0.15;
    ctx.lineTo(x, GROUND_Y - 70 - Math.sin(px * 0.006) * 34);
  }
  ctx.lineTo(VIEW_W, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  // Near hills + barn silhouette + trees, parallax 0.35.
  ctx.fillStyle = stage.hill;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= VIEW_W; x += 40) {
    const px = x + scrollPx * 0.35;
    ctx.lineTo(x, GROUND_Y - 34 - Math.sin(px * 0.008 + 2) * 18);
  }
  ctx.lineTo(VIEW_W, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  const barnX = 820 - ((scrollPx * 0.35) % 1400);
  ctx.fillStyle = '#5a2a1e';
  ctx.fillRect(barnX, GROUND_Y - 96, 110, 96);
  ctx.beginPath();
  ctx.moveTo(barnX - 8, GROUND_Y - 96);
  ctx.lineTo(barnX + 55, GROUND_Y - 130);
  ctx.lineTo(barnX + 118, GROUND_Y - 96);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3d1e14';
  ctx.fillRect(barnX + 42, GROUND_Y - 52, 26, 52);
  // Trees.
  ctx.fillStyle = stage.hill;
  for (let i = 0; i < 6; i++) {
    const tx = ((i * 230 - scrollPx * 0.5) % 1150 + 1150) % 1150 - 80;
    ctx.beginPath();
    ctx.moveTo(tx, GROUND_Y - 60);
    ctx.lineTo(tx + 22, GROUND_Y - 130);
    ctx.lineTo(tx + 44, GROUND_Y - 60);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(tx + 18, GROUND_Y - 62, 8, 16);
  }
  // Ground.
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, GROUND_Y, VIEW_W, GROUND_H);
  ctx.fillStyle = stage.grass;
  ctx.fillRect(0, GROUND_Y, VIEW_W, 10);
  // Grass tufts scrolling by.
  ctx.strokeStyle = stage.grass;
  ctx.lineWidth = 2;
  for (let i = 0; i < 24; i++) {
    const gx = ((i * 137 - scrollPx) % 1100 + 1100) % 1100 - 60;
    ctx.beginPath();
    ctx.moveTo(gx, GROUND_Y + 12);
    ctx.lineTo(gx + 3, GROUND_Y + 4);
    ctx.moveTo(gx + 6, GROUND_Y + 12);
    ctx.lineTo(gx + 9, GROUND_Y + 5);
    ctx.stroke();
  }
  // Corn stalks in the cornfield stage, fence posts in the farmyard.
  if (stageIndex(world.distancePx) === 1) {
    ctx.strokeStyle = '#7a8a2e';
    ctx.lineWidth = 3;
    for (let i = 0; i < 10; i++) {
      const sx = ((i * 173 - scrollPx * 0.8) % 1100 + 1100) % 1100 - 60;
      ctx.beginPath(); ctx.moveTo(sx, GROUND_Y); ctx.lineTo(sx + 6, GROUND_Y - 66); ctx.stroke();
      ctx.fillStyle = '#c98f2e';
      ellipse(ctx, sx + 8, GROUND_Y - 52, 6, 12);
    }
  }
}

function drawHud(ctx, world, muted) {
  const m = Math.floor(world.distancePx / PX_PER_M);
  ctx.fillStyle = COLORS.hudBg;
  rr(ctx, 12, 12, 300, 64, 10); ctx.fill();
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 26px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`SCORE ${world.score}`, 24, 32);
  ctx.font = '16px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`${m} m  •  🌽 ${world.corn}  •  Stage: ${STAGES[stageIndex(world.distancePx)].name}`, 24, 58);
  // Hearts.
  for (let i = 0; i < world.maxHearts; i++) {
    heart(ctx, 340 + i * 30, 34, 11, i < world.hearts ? COLORS.heart : 'rgba(255,255,255,0.25)');
  }
  // Pursuit meter: how close the farmer is.
  ctx.fillStyle = COLORS.hudBg;
  rr(ctx, VIEW_W - 232, 12, 220, 30, 8); ctx.fill();
  ctx.fillStyle = '#3a2a1a';
  rr(ctx, VIEW_W - 222, 22, 200, 10, 5); ctx.fill();
  const frac = world.pursuit / world.pursuitMax;
  ctx.fillStyle = frac > 0.5 ? '#7ac74f' : frac > 0.25 ? '#ffd23e' : '#e83a4a';
  rr(ctx, VIEW_W - 222, 22, 200 * frac, 10, 5); ctx.fill();
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 12px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillText('FARMER', VIEW_W - 121, 28);
  ctx.fillStyle = COLORS.hudText;
  ctx.fillText('FARMER', VIEW_W - 122, 27);
  // Pause + mute buttons (top right, clickable).
  ctx.fillStyle = COLORS.hudBg;
  rr(ctx, VIEW_W - 52, 48, 40, 32, 8); ctx.fill();
  rr(ctx, VIEW_W - 98, 48, 40, 32, 8); ctx.fill();
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 18px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('II', VIEW_W - 32, 65);
  ctx.fillText(muted ? '✕' : '♪', VIEW_W - 78, 65);
  ctx.textAlign = 'left';
}

export const HUD_BUTTONS = {
  pause: { x: VIEW_W - 52, y: 48, w: 40, h: 32 },
  mute: { x: VIEW_W - 98, y: 48, w: 40, h: 32 },
};

// --- screens ---
function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(30, 15, 5, 0.78)';
  rr(ctx, x, y, w, h, 16); ctx.fill();
  ctx.strokeStyle = 'rgba(255, 210, 62, 0.7)';
  ctx.lineWidth = 2;
  rr(ctx, x, y, w, h, 16); ctx.stroke();
}

function drawButton(ctx, rect, label, sub) {
  ctx.fillStyle = '#e8873a';
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 12); ctx.fill();
  ctx.strokeStyle = '#fff2c8';
  ctx.lineWidth = 2;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 12); ctx.stroke();
  ctx.fillStyle = '#fff8e8';
  ctx.font = `bold ${sub ? 22 : 24}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 - (sub ? 8 : 0));
  if (sub) {
    ctx.font = '14px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(sub, rect.x + rect.w / 2, rect.y + rect.h / 2 + 16);
  }
  ctx.textAlign = 'left';
}

export function drawTitle(ctx, world, best, selectedDiff) {
  drawBackground(ctx, world, 0);
  // A turkey posing on the ground, gobbling.
  drawTurkey(ctx, 700, GROUND_Y, 0, false, 0, world.time);
  ctx.fillStyle = 'rgba(30, 15, 5, 0.45)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 84px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('GOBBLE RUN', VIEW_W / 2, 108);
  ctx.fillStyle = '#fff8e8';
  ctx.font = 'bold 26px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('One turkey. One farmer. Thanksgiving is tonight.', VIEW_W / 2, 168);
  ctx.font = '18px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('Run, jump the fences, slide under the branches — don\'t let the farmer catch you.', VIEW_W / 2, 198);
  ctx.fillText('Reach the garden gate at 3000 m and you\'re free!', VIEW_W / 2, 222);
  // Difficulty buttons.
  const diffs = ['easy', 'normal', 'hard'];
  const bw = 190, bh = 64, gap = 24;
  const total = bw * 3 + gap * 2;
  const x0 = (VIEW_W - total) / 2;
  const buttons = [];
  diffs.forEach((key, i) => {
    const r = { x: x0 + i * (bw + gap), y: 258, w: bw, h: bh, key };
    const sel = key === selectedDiff;
    ctx.fillStyle = sel ? '#e8873a' : 'rgba(60, 30, 10, 0.75)';
    rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
    ctx.strokeStyle = sel ? '#fff2c8' : 'rgba(255,255,255,0.4)';
    ctx.lineWidth = sel ? 3 : 2;
    rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.stroke();
    ctx.fillStyle = '#fff8e8';
    ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(key.toUpperCase(), r.x + bw / 2, r.y + 24);
    ctx.font = '13px "Trebuchet MS", Verdana, sans-serif';
    const sub = { easy: 'slow • 4 hearts', normal: 'steady • 3 hearts', hard: 'fast • 2 hearts' }[key];
    ctx.fillText(sub, r.x + bw / 2, r.y + 46);
    buttons.push(r);
  });
  // Start button.
  const start = { x: VIEW_W / 2 - 130, y: 348, w: 260, h: 60 };
  drawButton(ctx, start, '▶  START RUN');
  ctx.fillStyle = '#fff8e8';
  ctx.font = '16px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('Space / ↑ / tap: jump    ↓: slide    P: pause    M: mute', VIEW_W / 2, 436);
  if (best > 0) {
    ctx.font = 'bold 18px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillStyle = '#ffd23e';
    ctx.fillText(`BEST SCORE: ${best}`, VIEW_W / 2, 466);
  }
  ctx.textAlign = 'left';
  return { diffButtons: buttons, startButton: start };
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(20, 10, 5, 0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  panel(ctx, VIEW_W / 2 - 210, 150, 420, 200);
  ctx.fillStyle = '#fff8e8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 44px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('PAUSED', VIEW_W / 2, 200);
  ctx.font = '18px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('P or tap to keep running', VIEW_W / 2, 244);
  const resume = { x: VIEW_W / 2 - 110, y: 272, w: 220, h: 52 };
  drawButton(ctx, resume, 'RESUME');
  ctx.textAlign = 'left';
  return { resumeButton: resume };
}

export function drawEnd(ctx, world, best, isNewBest) {
  const escaped = world.overKind === 'escaped';
  const m = Math.floor(world.distancePx / PX_PER_M);
  ctx.fillStyle = escaped ? 'rgba(20, 60, 20, 0.55)' : 'rgba(40, 10, 5, 0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  panel(ctx, VIEW_W / 2 - 260, 110, 520, 300);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = escaped ? '#7ac74f' : '#ff6a5a';
  ctx.font = 'bold 56px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', VIEW_W / 2, 168);
  ctx.fillStyle = '#fff8e8';
  ctx.font = '20px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(
    escaped
      ? 'Through the garden gate and into the woods — free!'
      : 'The farmer got you. Thanksgiving dinner is served.',
    VIEW_W / 2, 214,
  );
  ctx.font = 'bold 30px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`SCORE ${world.score}`, VIEW_W / 2, 262);
  ctx.font = '18px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`${m} m  •  🌽 ${world.corn} corn  •  ${world.feathers} golden feathers`, VIEW_W / 2, 296);
  if (isNewBest) {
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 20px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('★ NEW BEST SCORE! ★', VIEW_W / 2, 326);
  } else {
    ctx.fillStyle = '#fff8e8';
    ctx.font = '16px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(`Best: ${best}`, VIEW_W / 2, 326);
  }
  const again = { x: VIEW_W / 2 - 130, y: 344, w: 260, h: 54 };
  drawButton(ctx, again, '↻  RUN AGAIN');
  ctx.textAlign = 'left';
  return { againButton: again };
}

// --- the run itself ---
export function drawGame(ctx, world, time, muted) {
  ctx.save();
  if (world.shake > 0) {
    const s = world.shake * 14;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }
  drawBackground(ctx, world, world.distancePx);
  // Knife warning: a flashing shadow where the knife will land.
  if (world.knifeWarn) {
    const blink = Math.floor(time * 10) % 2 === 0;
    ctx.fillStyle = blink ? 'rgba(232, 58, 74, 0.5)' : 'rgba(232, 58, 74, 0.2)';
    ellipse(ctx, world.knifeWarn.x + 13, GROUND_Y + 8, 26, 7);
    ctx.fillStyle = '#e83a4a';
    ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', world.knifeWarn.x + 13, GROUND_Y - 66);
    ctx.textAlign = 'left';
  }
  // Pickups.
  for (const p of world.pickups) {
    if (p.kind === 'corn') drawCorn(ctx, p.x, p.y, p.bob);
    else drawFeather(ctx, p.x, p.y, p.bob, time);
  }
  // Obstacles.
  for (const ob of world.obstacles) {
    if (ob.type === 'fence') drawFence(ctx, ob.x, ob.y, ob.w, ob.h);
    else if (ob.type === 'hay') drawHay(ctx, ob.x, ob.y, ob.w, ob.h);
    else if (ob.type === 'branch') drawBranch(ctx, ob.x, GROUND_Y - 50, ob.w);
    else if (ob.type === 'fox') drawFox(ctx, ob.x + ob.w / 2, GROUND_Y, time);
    else if (ob.type === 'knife') drawKnife(ctx, ob.x, ob.y, ob.w, ob.h, ob.falling);
    else if (ob.type === 'oven') drawOven(ctx, ob.x, ob.y, ob.w, ob.h);
  }
  // Particles.
  for (const pt of world.particles) {
    ctx.globalAlpha = Math.max(0, pt.life * 2);
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;
  // The farmer, trailing behind by the pursuit gap.
  const farmerX = TURKEY_X - world.pursuit;
  if (farmerX > -80) drawFarmer(ctx, farmerX, GROUND_Y, world.turkey.runPhase);
  // The turkey.
  const t = world.turkey;
  drawTurkey(ctx, TURKEY_X, t.y, t.runPhase, t.sliding, t.invuln, time);
  ctx.restore(); // end shake: the HUD stays steady
  drawHud(ctx, world, muted);
}
