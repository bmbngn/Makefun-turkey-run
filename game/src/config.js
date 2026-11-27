// Gobble Run — tuning, stages, difficulties and palette.
// One place for every number the game designer would tweak.

export const VIEW_W = 960;
export const VIEW_H = 540;
export const GROUND_H = 84; // ground strip height at the bottom
export const GROUND_Y = VIEW_H - GROUND_H; // y of the ground surface
export const TURKEY_X = 190; // the turkey's fixed screen x
export const GRAVITY = 2600; // px/s^2
export const JUMP_V = 980; // px/s take-off speed
export const COYOTE_MS = 90; // grace after leaving the ground
export const PX_PER_M = 50; // world pixels per metre of distance
export const ESCAPE_M = 3000; // distance that wins the game

// The turkey's body box, standing and sliding (w, h, y offset from feet).
export const TURKEY_STAND = { w: 62, h: 64 };
export const TURKEY_SLIDE = { w: 78, h: 30 };

// Pursuit: the farmer runs behind the turkey. pursuitPx is the gap in pixels;
// a hit shrinks it, clean running and corn grow it back. At 0 the turkey is caught.
export const PURSUIT = {
  regenPerSec: 4,
  hitLoss: 70,
  cornGain: 8,
  featherGain: 40,
};

// Stages the run passes through, from the farmyard toward the kitchen yard
// and out the garden gate. Each stage recolours the sky and changes the mix.
export const STAGES = [
  { name: 'FARMYARD', from: 0, skyTop: '#ff9e57', skyMid: '#ffc98a', skyLow: '#f7b267',
    hill: '#8a5a2b', hillFar: '#b57a3e', ground: '#7a4a21', grass: '#5d8a3c' },
  { name: 'CORNFIELD', from: 600, skyTop: '#f9844a', skyMid: '#ffb26b', skyLow: '#ffd28a',
    hill: '#7a4a1f', hillFar: '#a06a2e', ground: '#6b4218', grass: '#c98f2e' },
  { name: 'WOODS', from: 1500, skyTop: '#7a4a8a', skyMid: '#c97b7a', skyLow: '#f7a76c',
    hill: '#4a2f3a', hillFar: '#6b4250', ground: '#4a3018', grass: '#3d5a2e' },
  { name: 'KITCHEN YARD', from: 2500, skyTop: '#4a3a6e', skyMid: '#8a5a8a', skyLow: '#e08a5a',
    hill: '#33241f', hillFar: '#52332a', ground: '#3a2418', grass: '#4a5a2e' },
];

// Difficulty table: speed range, obstacle spacing, hearts, pursuit head start.
export const DIFFICULTIES = {
  easy:   { label: 'EASY',   sub: 'A gentle stroll', speed0: 300, speed1: 430, gapMin: 430, gapMax: 720, hearts: 4, pursuit: 270, scoreMul: 1 },
  normal: { label: 'NORMAL', sub: 'The farmer means it', speed0: 340, speed1: 520, gapMin: 340, gapMax: 580, hearts: 3, pursuit: 220, scoreMul: 1 },
  hard:   { label: 'HARD',   sub: 'Thanksgiving is tonight', speed0: 400, speed1: 640, gapMin: 280, gapMax: 480, hearts: 2, pursuit: 180, scoreMul: 1 },
};
export const DIFF_ORDER = ['easy', 'normal', 'hard'];

// Obstacle shapes (w, h, how high their base sits above the ground).
// jumpOver: cleared by jumping. slideUnder: cleared by sliding.
export const OBSTACLES = {
  fence:  { w: 36, h: 66, base: 0,  kind: 'jump', weight: 3 },
  hay:    { w: 58, h: 60, base: 0,  kind: 'jump', weight: 3 },
  branch: { w: 46, h: 96, base: 46, kind: 'slide', weight: 2 }, // hangs low: slide under it
  fox:    { w: 74, h: 42, base: 0,  kind: 'jump', weight: 2 },
  knife:  { w: 26, h: 58, base: 0,  kind: 'jump', weight: 2 }, // a carving knife stuck in the dirt
  oven:   { w: 112, h: 80, base: 0, kind: 'jump', weight: 1 }, // brick oven, late stages only
};
// Which obstacles may appear in each stage (index into STAGES).
export const STAGE_OBSTACLES = [
  ['fence', 'hay', 'branch'],
  ['fence', 'hay', 'branch', 'fox'],
  ['fence', 'hay', 'branch', 'fox', 'knife'],
  ['fence', 'hay', 'branch', 'fox', 'knife', 'oven'],
];

export const PICKUPS = {
  corn:    { w: 34, h: 40, score: 10, weight: 8 },
  feather: { w: 30, h: 34, score: 50, weight: 1 }, // golden feather: rare, +1 heart
};

export const COLORS = {
  turkeyBody: '#8a5a2b',
  turkeyDark: '#6b4218',
  turkeyLight: '#c98f4e',
  turkeyWattle: '#d93a2b',
  turkeyBeak: '#f2a541',
  farmerShirt: '#4a6ea8',
  farmerOveralls: '#3a5a8a',
  farmerSkin: '#e8b98a',
  farmerHat: '#8a6a3a',
  foxBody: '#d96a1e',
  foxBelly: '#f7e8c8',
  cornYellow: '#ffd23e',
  featherGold: '#ffd700',
  knifeBlade: '#d8dde2',
  knifeHandle: '#3a2a1a',
  heart: '#e83a4a',
  hudBg: 'rgba(40, 20, 8, 0.55)',
  hudText: '#fff8e8',
};
