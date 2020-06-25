// prettier-ignore
export const LAYOUT_STANDARD = [
  5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
  5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
  4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 4, 4, 4, 4, 4,
  4, 1, 4, 1, 4, 0, 0, 1, 0, 0, 4, 1, 4, 1, 4,
  3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3,
  3, 3, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 3, 3,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
];

// prettier-ignore
export const LAYOUT_SMALL_GAPS = [
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 0, 5, 5, 0, 5, 5, 0, 5, 5, 0, 5, 5, 0, 1,
  1, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 1,
  1, 0, 3, 3, 0, 3, 3, 0, 3, 3, 0, 3, 3, 0, 1,
  1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1,
  1, 0, 2, 2, 0, 2, 2, 0, 2, 2, 0, 2, 2, 0, 1,
  1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
  1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1
];

// prettier-ignore
export const LAYOUT_SPACE_INVADER = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2,
  0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 5, 5, 5,
  5, 5, 5, 5, 0, 0, 0, 0, 0, 5, 5, 0, 5, 5, 5,
  0, 5, 5, 0, 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5,
  5, 5, 0, 0, 3, 0, 1, 1, 1, 1, 1, 1, 1, 0, 3,
  0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 3, 0, 3, 0, 0,
  0, 0, 0, 4, 4, 0, 4, 4, 0, 0, 0, 0
];

// prettier-ignore
export const LAYOUT_BOUNCE_GALORE = [
  1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 2,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 3, 1,
  4, 1, 5, 1, 4, 1, 3, 1, 2, 2, 3, 3, 4, 4, 5,
  5, 5, 4, 4, 3, 3, 2, 2, 1, 3, 1, 4, 1, 5, 1,
  4, 1, 3, 1, 2, 2, 2, 3, 3, 4, 4, 5, 4, 4, 3,
  3, 2, 2
];

export const LEVELS = [
  LAYOUT_STANDARD,
  LAYOUT_SMALL_GAPS,
  LAYOUT_SPACE_INVADER,
  LAYOUT_BOUNCE_GALORE
];

export const MAX_LIVES = 3;

export const BRICKS_PER_LINE = 15;

export const BRICK_SIZE = [50, 30];

export const NUMBER_OF_PARTICLES = 200;
export const NEW_PARTICLES_PER_FRAME = 2;

export const COLOR_MAP = {
  0: [0, 0, 0],
  1: [1, 1, 1],
  2: [0.2, 0.6, 1.0],
  3: [0, 0.7, 0],
  4: [0.8, 0.8, 0.4],
  5: [1.0, 0.5, 0]
};

export const SHAKE_TIME = 15;
export const CONFUSE_TIME = 15;
export const CHAOS_TIME = 15;

export const GAME_STATE = {
  MENU: 'MENU',
  STUCK: 'STUCK',
  ACTIVE: 'ACTIVE',
  WON: 'WON',
  FAILED: 'FAILED'
};

export const TEXTURES = [
  {
    name: 'sprite',
    data: 'img/awesomeface.png',
    width: 512,
    height: 512
  },
  {
    name: 'block',
    data: 'img/block.png',
    width: 128,
    height: 128
  },
  {
    name: 'blockSolid',
    data: 'img/block_solid.png',
    width: 128,
    height: 128
  },
  {
    name: 'player',
    data: 'img/paddle.png',
    width: 512,
    height: 128
  },
  {
    name: 'particle',
    data: 'img/particle.png',
    width: 500,
    height: 500
  },
  {
    name: 'speed',
    data: 'img/powerup_speed.png',
    width: 512,
    height: 128
  },
  {
    name: 'sticky',
    data: 'img/powerup_sticky.png',
    width: 512,
    height: 128
  },
  {
    name: 'passthrough',
    data: 'img/powerup_passthrough.png',
    width: 512,
    height: 128
  },
  {
    name: 'increase',
    data: 'img/powerup_increase.png',
    width: 512,
    height: 128
  },
  {
    name: 'confuse',
    data: 'img/powerup_confuse.png',
    width: 512,
    height: 128
  },
  {
    name: 'chaos',
    data: 'img/powerup_chaos.png',
    width: 512,
    height: 128
  }
];
