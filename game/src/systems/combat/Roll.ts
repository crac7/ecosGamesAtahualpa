export interface RollConfig {
  durationMs: number
  speed: number
  /** Invulnerability window inside the roll, in ms from its start. */
  iFrameStartMs: number
  iFrameEndMs: number
}

/** Committed dodge roll with a mid-roll invulnerability window. */
export class Roll {
  private readonly config: RollConfig
  private elapsed = 0
  private rolling = false
  private dir: 1 | -1 = 1

  constructor(config: RollConfig) {
    this.config = config
  }

  get isRolling() {
    return this.rolling
  }

  get direction() {
    return this.dir
  }

  get velocityX() {
    return this.rolling ? this.dir * this.config.speed : 0
  }

  get isInvulnerable() {
    return (
      this.rolling &&
      this.elapsed >= this.config.iFrameStartMs &&
      this.elapsed < this.config.iFrameEndMs
    )
  }

  /** Starts a roll. Returns false when one is already in progress. */
  start(direction: 1 | -1): boolean {
    if (this.rolling) return false
    this.rolling = true
    this.elapsed = 0
    this.dir = direction
    return true
  }

  update(deltaMs: number) {
    if (!this.rolling) return
    this.elapsed += deltaMs
    if (this.elapsed >= this.config.durationMs) {
      this.rolling = false
      this.elapsed = 0
    }
  }
}
