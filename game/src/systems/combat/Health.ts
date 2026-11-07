/** Hit points with a short invulnerability window after each hit. */
export class Health {
  readonly max: number
  private readonly invulnerableMs: number
  private current: number
  private invulnerableLeft = 0

  constructor(max: number, invulnerableMs = 0) {
    this.max = max
    this.current = max
    this.invulnerableMs = invulnerableMs
  }

  get hp() {
    return this.current
  }

  get isDead() {
    return this.current <= 0
  }

  get isInvulnerable() {
    return this.invulnerableLeft > 0
  }

  /** Returns true when the damage was applied. */
  takeDamage(amount: number): boolean {
    if (this.isDead || this.isInvulnerable || amount <= 0) return false
    this.current = Math.max(0, this.current - amount)
    this.invulnerableLeft = this.invulnerableMs
    return true
  }

  update(deltaMs: number) {
    this.invulnerableLeft = Math.max(0, this.invulnerableLeft - deltaMs)
  }

  reset() {
    this.current = this.max
    this.invulnerableLeft = 0
  }
}
