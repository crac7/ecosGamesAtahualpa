export interface StaminaConfig {
  max: number
  regenPerSecond: number
  /** Pause before regen starts again after spending. */
  regenDelayMs: number
}

/**
 * Souls-style stamina: any action is allowed while stamina is above zero
 * (it can bottom out at 0), and regen waits a moment after each spend.
 */
export class Stamina {
  private readonly config: StaminaConfig
  private current: number
  private delayLeft = 0

  constructor(config: StaminaConfig) {
    this.config = config
    this.current = config.max
  }

  get value() {
    return this.current
  }

  get max() {
    return this.config.max
  }

  get ratio() {
    return this.current / this.config.max
  }

  /** Spends `cost` if any stamina is left. Returns false when exhausted. */
  spend(cost: number): boolean {
    if (this.current <= 0) return false
    this.current = Math.max(0, this.current - cost)
    this.delayLeft = this.config.regenDelayMs
    return true
  }

  update(deltaMs: number) {
    if (this.delayLeft > 0) {
      this.delayLeft = Math.max(0, this.delayLeft - deltaMs)
      return
    }
    this.current = Math.min(
      this.config.max,
      this.current + (this.config.regenPerSecond * deltaMs) / 1000
    )
  }
}
