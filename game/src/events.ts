/** Scene-level events the HUD subscribes to (emitted on `scene.events`). */
export const PlayerEvents = {
  /** Payload: (hp: number, maxHp: number) */
  HEALTH: 'player-health',
  /** Payload: (ratio: number) in [0, 1] */
  STAMINA: 'player-stamina',
  /** Payload: (eco: number, delta: number) */
  ECO: 'player-eco',
} as const
