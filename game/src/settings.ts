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
} as const
