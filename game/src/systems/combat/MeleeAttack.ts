import Phaser from 'phaser'
import type { Health } from './Health'

export type AttackPhase = 'ready' | 'windup' | 'active' | 'recovery'

export interface MeleeAttackConfig {
  windupMs: number
  activeMs: number
  recoveryMs: number
  damage: number
  /** Hitbox size in world pixels. */
  width: number
  height: number
}

/** Something that can receive a hit. */
export interface Hurtbox {
  readonly health: Health
  getHurtBounds(): Phaser.Geom.Rectangle
  onHit(direction: 1 | -1, damage: number): void
  /** Extra invulnerability (e.g. roll i-frames). A dodged swing can still hit later in its active window. */
  isInvulnerable?(): boolean
}

/**
 * Timed melee swing: windup (telegraph) -> active (hitbox live) -> recovery
 * (punish window). Each target can be hit at most once per swing.
 */
export class MeleeAttack {
  private readonly config: MeleeAttackConfig
  private current: AttackPhase = 'ready'
  private elapsed = 0
  private readonly hitThisSwing = new Set<Hurtbox>()
  readonly hitbox = new Phaser.Geom.Rectangle()

  constructor(config: MeleeAttackConfig) {
    this.config = config
  }

  get phase() {
    return this.current
  }

  get isBusy() {
    return this.current !== 'ready'
  }

  /** Starts a swing. Returns false when one is already in progress. */
  start(): boolean {
    if (this.isBusy) return false
    this.current = 'windup'
    this.elapsed = 0
    this.hitThisSwing.clear()
    return true
  }

  cancel() {
    this.current = 'ready'
    this.elapsed = 0
  }

  /**
   * Advances the swing and, while active, hits overlapping targets.
   * `ownerBounds` is the attacker's body; the hitbox sits on its facing side.
   */
  update(
    deltaMs: number,
    ownerBounds: Phaser.Geom.Rectangle,
    facing: 1 | -1,
    targets: readonly Hurtbox[]
  ) {
    if (!this.isBusy) return
    this.elapsed += deltaMs

    const { windupMs, activeMs, recoveryMs } = this.config
    if (this.elapsed >= windupMs + activeMs + recoveryMs) {
      this.cancel()
      return
    }
    this.current =
      this.elapsed < windupMs
        ? 'windup'
        : this.elapsed < windupMs + activeMs
          ? 'active'
          : 'recovery'

    if (this.current !== 'active') return

    this.placeHitbox(ownerBounds, facing)
    for (const target of targets) {
      if (this.hitThisSwing.has(target) || target.health.isDead) continue
      if (target.isInvulnerable?.()) continue
      if (!Phaser.Geom.Intersects.RectangleToRectangle(this.hitbox, target.getHurtBounds())) {
        continue
      }
      this.hitThisSwing.add(target)
      if (target.health.takeDamage(this.config.damage)) {
        target.onHit(facing, this.config.damage)
      }
    }
  }

  private placeHitbox(owner: Phaser.Geom.Rectangle, facing: 1 | -1) {
    const { width, height } = this.config
    const x = facing === 1 ? owner.right : owner.x - width
    this.hitbox.setTo(x, owner.centerY - height / 2, width, height)
  }
}
