export const TILE_SIZE = 32
export const VIEW_TILES_X = 20
export const VIEW_TILES_Y = 12

export const BASE_WIDTH = TILE_SIZE * VIEW_TILES_X
export const BASE_HEIGHT = TILE_SIZE * VIEW_TILES_Y
export const SCALE = 3

export const CAMERA = {
  deadzoneHalfWidth: 24,
  deadzoneHalfHeight: 48,
  lookAhead: 64,
  followRateX: 8,
  followRateY: 5,
  lookAheadRate: 3,
} as const

/** Placeholder timings: tune these before drawing attack animations. */
export const PLAYER_ATTACK = {
  windupMs: 120,
  activeMs: 100,
  recoveryMs: 260,
  damage: 1,
  width: 28,
  height: 24,
  staminaCost: 20,
} as const

export const PLAYER_STAMINA = {
  max: 100,
  regenPerSecond: 45,
  regenDelayMs: 600,
} as const

export const PLAYER = {
  maxHp: 5,
  /** Invulnerability after taking a hit. */
  hitInvulnerableMs: 700,
  /** Input lock after taking a hit. */
  hitStunMs: 250,
  knockbackX: 160,
  knockbackY: 160,
  respawnDelayMs: 1000,
} as const

/** Basic ground enemy. Long windup = readable telegraph, long recovery = punish window. */
export const SCOUT = {
  width: 22,
  height: 32,
  maxHp: 3,
  patrolSpeed: 40,
  chaseSpeed: 95,
  sightRange: 160,
  loseRange: 224,
  verticalSight: 40,
  attackRange: 30,
  staggerMs: 300,
  knockbackSpeed: 120,
  attack: {
    windupMs: 450,
    activeMs: 120,
    recoveryMs: 600,
    damage: 1,
    width: 26,
    height: 20,
  },
} as const

/** Eco (currency). Soft death penalty: lose a share, nothing to recover. */
export const ECO = {
  scoutReward: 15,
  deathLossRatio: 0.3,
} as const

export const PLAYER_ROLL = {
  durationMs: 360,
  speed: 260,
  iFrameStartMs: 40,
  iFrameEndMs: 280,
  staminaCost: 25,
} as const
