import Phaser from 'phaser'
import type { PlayerInput } from '../input/PlayerInput'
import { PlayerEvents } from '../events'
import { ECO, PLAYER, PLAYER_ATTACK, PLAYER_ROLL, PLAYER_STAMINA } from '../settings'
import { Health } from '../systems/combat/Health'
import { MeleeAttack, type Hurtbox } from '../systems/combat/MeleeAttack'
import { Roll } from '../systems/combat/Roll'
import { Stamina } from '../systems/combat/Stamina'
import type { ScoutTarget } from './Scout'

const WALK_SPEED = 180
const JUMP_SPEED = 380
const ATTACK_WINDUP_TINT = 0x7ff0e6 // eco_3
const ATTACK_HITBOX_COLOR = 0x2fa3a8 // eco_2
const HIT_TINT = 0xe0402e // danger_2

export type PlayerState =
  | 'idle'
  | 'walk'
  | 'jump'
  | 'fall'
  | 'attack'
  | 'roll'
  | 'hit'
  | 'dead'

export type Facing = 'left' | 'right'

export interface PlayerOptions {
  /** Called after the player is moved back to its spawn point. */
  onRespawn?: () => void
  /** Eco carried when the scene starts (from the save). */
  initialEco?: number
}

/**
 * The protagonist: movement, committed actions (attack, roll), stamina,
 * health, hit reactions and placeholder visuals.
 */
export class Player implements ScoutTarget {
  readonly sprite: Phaser.Physics.Arcade.Sprite
  readonly body: Phaser.Physics.Arcade.Body
  readonly health = new Health(PLAYER.maxHp, PLAYER.hitInvulnerableMs)
  readonly stamina = new Stamina(PLAYER_STAMINA)
  readonly roll = new Roll(PLAYER_ROLL)
  readonly attack = new MeleeAttack(PLAYER_ATTACK)
  state: PlayerState = 'idle'
  facing: Facing = 'right'
  hitStunLeft = 0
  private ecoAmount = 0
  // Last values sent to listeners; NaN forces the first publish.
  private publishedHp = Number.NaN
  private publishedStamina = Number.NaN

  private readonly scene: Phaser.Scene
  private readonly spawnPoint: Phaser.Math.Vector2
  private readonly hitboxDebug: Phaser.GameObjects.Graphics
  private readonly options: PlayerOptions

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    ground: Phaser.Tilemaps.TilemapLayer,
    options: PlayerOptions = {}
  ) {
    this.scene = scene
    this.options = options
    this.spawnPoint = new Phaser.Math.Vector2(x, y)
    this.ecoAmount = Math.max(0, Math.floor(options.initialEco ?? 0))

    this.sprite = scene.physics.add.sprite(x, y, 'player_idle', 0)
    this.sprite.setOrigin(0.5, 1)

    this.body = this.sprite.body as Phaser.Physics.Arcade.Body
    this.body.setCollideWorldBounds(true)
    this.body.setMaxVelocity(Math.max(200, PLAYER_ROLL.speed), 700)
    this.body.setSize(24, 40)
    this.body.setOffset(12, 8)

    scene.physics.add.collider(this.sprite, ground)

    // Drawn above world props so the attack hitbox stays visible.
    this.hitboxDebug = scene.add.graphics().setDepth(10)

    createPlayerAnimations(scene)
  }

  get x() {
    return this.sprite.x
  }

  get eco() {
    return this.ecoAmount
  }

  addEco(amount: number) {
    if (amount <= 0) return
    this.setEco(this.ecoAmount + amount)
  }

  get y() {
    return this.sprite.y
  }

  getHurtBounds() {
    const b = this.body
    return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height)
  }

  isInvulnerable() {
    return this.roll.isInvulnerable
  }

  onHit(direction: 1 | -1) {
    this.attack.cancel()
    this.roll.cancel()
    this.drawHitbox()
    this.body.setVelocity(direction * PLAYER.knockbackX, -PLAYER.knockbackY)
    this.hitStunLeft = PLAYER.hitStunMs
    if (this.health.isDead) {
      // Soft penalty: lose a share of the carried eco, nothing to recover.
      this.setEco(this.ecoAmount - Math.floor(this.ecoAmount * ECO.deathLossRatio))
      this.scene.time.delayedCall(PLAYER.respawnDelayMs, () => this.respawn())
    }
  }

  /**
   * Emits HUD events for values that changed since the last call.
   * Eco is emitted immediately by setEco; health and stamina are checked here.
   */
  publishState() {
    const events = this.scene.events
    if (this.health.hp !== this.publishedHp) {
      this.publishedHp = this.health.hp
      events.emit(PlayerEvents.HEALTH, this.health.hp, this.health.max)
    }
    const stamina = Math.round(this.stamina.ratio * 100) / 100
    if (stamina !== this.publishedStamina) {
      this.publishedStamina = stamina
      events.emit(PlayerEvents.STAMINA, stamina)
    }
  }

  /** Re-sends every value, e.g. when a listener subscribes late. */
  publishAll() {
    this.publishedHp = Number.NaN
    this.publishedStamina = Number.NaN
    this.publishState()
    this.scene.events.emit(PlayerEvents.ECO, this.ecoAmount, 0)
  }

  private setEco(value: number) {
    // Guard: NaN/Infinity would persist as null and reset the save on load.
    if (!Number.isFinite(value)) return
    const next = Math.max(0, Math.floor(value))
    const delta = next - this.ecoAmount
    if (delta === 0) return
    this.ecoAmount = next
    this.scene.events.emit(PlayerEvents.ECO, next, delta)
  }

  /** True when the player is free to interact (not mid-action, hurt or airborne). */
  get canInteract() {
    return (this.state === 'idle' || this.state === 'walk') && this.body.blocked.down
  }

  /** Where the player comes back after dying (last checkpoint). */
  setRespawnPoint(x: number, y: number) {
    this.spawnPoint.set(x, y)
  }

  /** Resting at a checkpoint restores health and stamina in place. */
  rest() {
    this.health.reset()
    this.stamina.refill()
  }

  /** Back to the respawn point with full resources. */
  respawn() {
    this.health.reset()
    this.stamina.refill()
    this.hitStunLeft = 0
    this.body.reset(this.spawnPoint.x, this.spawnPoint.y)
    this.options.onRespawn?.()
  }

  /** Advances timers. Runs before enemies act so their hits land this frame. */
  tickTimers(deltaMs: number) {
    this.stamina.update(deltaMs)
    this.roll.update(deltaMs)
    this.health.update(deltaMs)
  }

  update(deltaMs: number, input: PlayerInput, targets: readonly Hurtbox[]) {
    // Consume edge-triggered presses every frame, before any early return, so
    // a key held through a swing, stun or death does not fire on its own later.
    const attackPressed = input.consumeAttack()
    const rollPressed = input.consumeRoll()

    if (this.health.isDead) {
      this.updateState()
      return
    }
    if (this.hitStunLeft > 0) {
      // Knocked back: no control until the stun ends.
      this.hitStunLeft = Math.max(0, this.hitStunLeft - deltaMs)
      this.updateState()
      return
    }

    const body = this.body
    const grounded = body.blocked.down
    const canAct = !this.attack.isBusy && !this.roll.isRolling
    const { left, right, jump } = input

    if (canAct && attackPressed) {
      if (this.stamina.spend(PLAYER_ATTACK.staminaCost)) this.attack.start()
    } else if (canAct && grounded && rollPressed) {
      // Roll toward the held direction, or the facing side when none is held.
      const dir = left ? -1 : right ? 1 : this.facing === 'right' ? 1 : -1
      if (this.stamina.spend(PLAYER_ROLL.staminaCost)) {
        this.roll.start(dir)
        this.facing = dir === 1 ? 'right' : 'left'
      }
    }

    // Committed actions: no steering or jumping while rolling or attacking on the ground.
    const lockedByAttack = this.attack.isBusy && grounded
    const locked = lockedByAttack || this.roll.isRolling

    if (this.roll.isRolling) {
      body.setVelocityX(this.roll.velocityX)
    } else if (lockedByAttack) {
      body.setVelocityX(0)
    } else if (left) {
      body.setVelocityX(-WALK_SPEED)
      this.facing = 'left'
    } else if (right) {
      body.setVelocityX(WALK_SPEED)
      this.facing = 'right'
    } else {
      body.setVelocityX(0)
    }

    if (jump && grounded && !locked) {
      body.setVelocityY(-JUMP_SPEED)
    }

    this.attack.update(
      deltaMs,
      this.getHurtBounds(),
      this.facing === 'right' ? 1 : -1,
      targets
    )
    this.drawHitbox()
    this.updateState()
  }

  private updateState() {
    const body = this.body
    if (this.health.isDead) {
      this.state = 'dead'
    } else if (this.hitStunLeft > 0) {
      this.state = 'hit'
    } else if (this.roll.isRolling) {
      this.state = 'roll'
    } else if (this.attack.isBusy) {
      this.state = 'attack'
    } else if (body.blocked.down) {
      this.state = Math.abs(body.velocity.x) > 1 ? 'walk' : 'idle'
    } else {
      this.state = body.velocity.y < 0 ? 'jump' : 'fall'
    }
    this.applyStateAnimation()
  }

  private applyStateAnimation() {
    const sprite = this.sprite
    const right = this.facing === 'right'

    // Placeholder visuals until real frames exist.
    if (this.state === 'hit' || this.state === 'dead') {
      sprite.setTint(HIT_TINT)
    } else if (this.attack.phase === 'windup') {
      sprite.setTint(ATTACK_WINDUP_TINT)
    } else {
      sprite.clearTint()
    }
    // Translucent during roll i-frames; blinks during post-hit invulnerability.
    const blink =
      this.health.isInvulnerable && Math.floor(this.scene.time.now / 80) % 2 === 0
    sprite.setAlpha(this.roll.isInvulnerable || blink ? 0.5 : 1)

    switch (this.state) {
      case 'walk':
        sprite.anims.play(right ? 'player-walk-right' : 'player-walk-left', true)
        break
      case 'jump':
        sprite.anims.play(right ? 'player-jump-right' : 'player-jump-left', true)
        break
      case 'fall':
        sprite.anims.play(right ? 'player-fall-right' : 'player-fall-left', true)
        break
      default:
        // idle, attack, roll, hit, dead: static idle frame for now.
        sprite.anims.stop()
        sprite.setTexture('player_idle', right ? 0 : 1)
    }
  }

  private drawHitbox() {
    const g = this.hitboxDebug
    g.clear()
    if (this.attack.phase !== 'active') return
    g.fillStyle(ATTACK_HITBOX_COLOR, 0.5)
    g.fillRectShape(this.attack.hitbox)
  }
}

function createPlayerAnimations(scene: Phaser.Scene) {
  const anims = scene.anims
  if (anims.exists('player-walk-right')) return

  const strips: [key: string, texture: string, start: number, end: number, rate: number, repeat: number][] = [
    ['player-walk-right', 'player_walk', 0, 5, 10, -1],
    ['player-walk-left', 'player_walk', 6, 11, 10, -1],
    ['player-jump-right', 'player_jump', 0, 1, 8, 0],
    ['player-jump-left', 'player_jump', 2, 3, 8, 0],
    ['player-fall-right', 'player_fall', 0, 1, 8, -1],
    ['player-fall-left', 'player_fall', 2, 3, 8, -1],
  ]
  for (const [key, texture, start, end, frameRate, repeat] of strips) {
    anims.create({
      key,
      frames: anims.generateFrameNumbers(texture, { start, end }),
      frameRate,
      repeat,
    })
  }
}
