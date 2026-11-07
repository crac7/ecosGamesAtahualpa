import Phaser from 'phaser'
import { SCOUT } from '../settings'
import { Health } from '../systems/combat/Health'
import { MeleeAttack, type Hurtbox } from '../systems/combat/MeleeAttack'

const BODY_COLOR = 0xa35a32 // rust_3
const HIT_FLASH_COLOR = 0x939cb0 // stone_4
const TELEGRAPH_COLOR = 0xe0402e // danger_2 (reserved for telegraphs)
const HITBOX_COLOR = 0xff9a5c // danger_3

type ScoutState = 'patrol' | 'chase' | 'attack' | 'stagger' | 'dead'

/** What the scout hunts: a hurtbox with a feet position. */
export interface ScoutTarget extends Hurtbox {
  readonly x: number
  readonly y: number
}

/**
 * Basic ground enemy (greybox). FSM: patrol -> chase -> attack
 * (telegraphed windup -> active -> recovery), stagger when hit, dead.
 * It turns at walls and ledges and never walks off a platform.
 */
export class Scout extends Phaser.GameObjects.Rectangle implements Hurtbox {
  declare body: Phaser.Physics.Arcade.Body
  readonly health = new Health(SCOUT.maxHp)
  private readonly attack = new MeleeAttack(SCOUT.attack)
  private readonly ground: Phaser.Tilemaps.TilemapLayer
  private readonly hitboxDebug: Phaser.GameObjects.Graphics
  private readonly spawnX: number
  private readonly spawnY: number
  private current: ScoutState = 'patrol'
  private stateTime = 0
  private dir: 1 | -1 = -1
  private readonly onDeath?: () => void

  constructor(
    scene: Phaser.Scene,
    x: number,
    groundY: number,
    ground: Phaser.Tilemaps.TilemapLayer,
    onDeath?: () => void
  ) {
    super(scene, x, groundY, SCOUT.width, SCOUT.height, BODY_COLOR)
    this.setOrigin(0.5, 1)
    this.spawnX = x
    this.spawnY = groundY
    this.ground = ground
    this.onDeath = onDeath
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.body.setCollideWorldBounds(true)
    scene.physics.add.collider(this, ground)
    this.hitboxDebug = scene.add.graphics()
  }

  get aiState() {
    return this.current
  }

  get attackPhase() {
    return this.attack.phase
  }

  getHurtBounds() {
    return this.getBounds()
  }

  onHit(direction: 1 | -1) {
    this.attack.cancel()
    if (this.health.isDead) {
      this.enter('dead')
      this.body.enable = false
      this.setVisible(false)
      this.hitboxDebug.clear()
      this.onDeath?.()
      return
    }
    // No poise: any hit interrupts the swing and pushes the scout back.
    this.enter('stagger')
    this.body.setVelocityX(direction * SCOUT.knockbackSpeed)
    this.setFillStyle(HIT_FLASH_COLOR)
  }

  /** Back to the spawn point with full health (used by checkpoints). */
  reset() {
    this.health.reset()
    this.attack.cancel()
    this.body.enable = true
    this.body.reset(this.spawnX, this.spawnY)
    this.setVisible(true)
    this.dir = -1
    this.enter('patrol')
  }

  tick(deltaMs: number, target: ScoutTarget) {
    if (this.current === 'dead') return
    this.stateTime += deltaMs
    this.health.update(deltaMs)

    const dx = target.x - this.x
    const sameLevel = Math.abs(target.y - this.y) <= SCOUT.verticalSight
    const targetAlive = !target.health.isDead

    switch (this.current) {
      case 'patrol': {
        if (targetAlive && sameLevel && Math.abs(dx) <= SCOUT.sightRange) {
          this.enter('chase')
          break
        }
        if (this.blockedAhead()) this.dir = this.dir === 1 ? -1 : 1
        this.body.setVelocityX(this.dir * SCOUT.patrolSpeed)
        break
      }
      case 'chase': {
        if (!targetAlive || !sameLevel || Math.abs(dx) > SCOUT.loseRange) {
          this.enter('patrol')
          break
        }
        this.dir = dx >= 0 ? 1 : -1
        if (Math.abs(dx) <= SCOUT.attackRange) {
          this.body.setVelocityX(0)
          this.attack.start()
          this.enter('attack')
          break
        }
        // Hold position at a ledge instead of falling after the player.
        this.body.setVelocityX(this.blockedAhead() ? 0 : this.dir * SCOUT.chaseSpeed)
        break
      }
      case 'attack': {
        this.body.setVelocityX(0)
        this.attack.update(deltaMs, this.getBounds(), this.dir, [target])
        if (!this.attack.isBusy) this.enter('chase')
        break
      }
      case 'stagger': {
        if (this.stateTime >= SCOUT.staggerMs) {
          this.body.setVelocityX(0)
          this.enter('chase')
        }
        break
      }
    }

    this.render()
  }

  private enter(next: ScoutState) {
    this.current = next
    this.stateTime = 0
  }

  private blockedAhead() {
    if (this.dir === 1 ? this.body.blocked.right : this.body.blocked.left) {
      return true
    }
    if (!this.body.blocked.down) return false
    const frontX = this.x + this.dir * (this.width / 2 + 2)
    return !this.ground.getTileAtWorldXY(frontX, this.y + 2)
  }

  private render() {
    const telegraph = this.current === 'attack' && this.attack.phase === 'windup'
    if (this.current !== 'stagger') {
      this.setFillStyle(telegraph ? TELEGRAPH_COLOR : BODY_COLOR)
    }
    this.hitboxDebug.clear()
    if (this.attack.phase === 'active') {
      this.hitboxDebug.fillStyle(HITBOX_COLOR, 0.5)
      this.hitboxDebug.fillRectShape(this.attack.hitbox)
    }
  }
}
