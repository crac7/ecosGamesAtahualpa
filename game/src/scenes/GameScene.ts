import Phaser from 'phaser'
import { TrainingDummy } from '../entities/TrainingDummy'
import {
  BASE_HEIGHT,
  CAMERA,
  PLAYER_ATTACK,
  PLAYER_ROLL,
  PLAYER_STAMINA,
} from '../settings'
import { CameraRig } from '../systems/CameraRig'
import { MeleeAttack } from '../systems/combat/MeleeAttack'
import { Roll } from '../systems/combat/Roll'
import { Stamina } from '../systems/combat/Stamina'

const ATTACK_WINDUP_TINT = 0x7ff0e6 // eco_3
const ATTACK_HITBOX_COLOR = 0x2fa3a8 // eco_2
const STAMINA_BAR_COLOR = 0x2fa3a8 // eco_2
const STAMINA_BAR_BG = 0x23283a // shadow_deep
const HELP_TEXT = 'WASD/Arrows: move  Space/W: jump  J: attack  K: roll'

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private playerBody!: Phaser.Physics.Arcade.Body
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd?: {
    left: Phaser.Input.Keyboard.Key
    right: Phaser.Input.Keyboard.Key
    up: Phaser.Input.Keyboard.Key
    jump: Phaser.Input.Keyboard.Key
    attack: Phaser.Input.Keyboard.Key
    roll: Phaser.Input.Keyboard.Key
  }
  private state: PlayerState = 'idle'
  private stateText?: Phaser.GameObjects.Text
  private facing: Facing = 'right'
  private cameraRig?: CameraRig
  private readonly attack = new MeleeAttack(PLAYER_ATTACK)
  private dummies: TrainingDummy[] = []
  private hitboxDebug?: Phaser.GameObjects.Graphics
  private readonly stamina = new Stamina(PLAYER_STAMINA)
  private readonly roll = new Roll(PLAYER_ROLL)
  private staminaBar?: Phaser.GameObjects.Graphics

  constructor() {
    super('Game')
  }

  create() {
    const map = this.make.tilemap({ key: 'zone01' })
    const tileset = map.addTilesetImage('ts_zone01_ruins', 'tileset_ruins')

    if (!tileset) {
      throw new Error('Tileset not found: ts_zone01_ruins')
    }

    const groundLayer = map.createLayer('Ground', tileset, 0, 0)

    if (!groundLayer) {
      throw new Error('Layer not found: Ground')
    }

    groundLayer.setCollisionByExclusion([-1])

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)

    const spawn = map.findObject(
      'Objects',
      (obj) => obj.name === 'player_spawn'
    )
    const spawnX = spawn?.x ?? 96
    const spawnY = spawn?.y ?? BASE_HEIGHT - 64

    this.player = this.physics.add.sprite(spawnX, spawnY, 'player_idle', 0)
    this.player.setOrigin(0.5, 1)

    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body
    this.playerBody.setCollideWorldBounds(true)
    this.playerBody.setMaxVelocity(Math.max(200, PLAYER_ROLL.speed), 700)
    this.playerBody.setSize(24, 40)
    this.playerBody.setOffset(12, 8)

    this.physics.add.collider(this.player, groundLayer)

    this.cameraRig = new CameraRig(this, this.cameras.main, this.player, CAMERA)
    this.cameraRig.snapToTarget()

    this.createAnimations()

    this.cursors = this.input.keyboard?.createCursorKeys()
    this.wasd = this.input.keyboard?.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.W,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      attack: Phaser.Input.Keyboard.KeyCodes.J,
      roll: Phaser.Input.Keyboard.KeyCodes.K,
    }) as GameScene['wasd']

    const floorY = map.heightInPixels - map.tileHeight
    this.dummies = [
      new TrainingDummy(this, 300, floorY),
      new TrainingDummy(this, 760, floorY),
    ]
    this.hitboxDebug = this.add.graphics()

    this.stateText = this.add
      .text(16, 16, `${HELP_TEXT}\nState: idle`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#cdd6df',
      })
      .setScrollFactor(0)

    // Placeholder HUD until the UI task: stamina bar under the help text.
    this.staminaBar = this.add.graphics().setScrollFactor(0)
  }

  update(_time: number, delta: number) {
    if (!this.playerBody) return

    this.stamina.update(delta)
    this.roll.update(delta)

    const grounded = this.playerBody.blocked.down
    const canAct = !this.attack.isBusy && !this.roll.isRolling
    // Read edge-triggered keys every frame so presses made mid-action are
    // dropped instead of firing later (no unbounded input buffer).
    const attackPressed =
      !!this.wasd && Phaser.Input.Keyboard.JustDown(this.wasd.attack)
    const rollPressed =
      !!this.wasd && Phaser.Input.Keyboard.JustDown(this.wasd.roll)

    const left =
      this.cursors?.left?.isDown || this.wasd?.left.isDown || false
    const right =
      this.cursors?.right?.isDown || this.wasd?.right.isDown || false
    const jump =
      this.cursors?.up?.isDown ||
      this.wasd?.up.isDown ||
      this.wasd?.jump.isDown ||
      false

    const speed = 180
    const jumpSpeed = 380

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
      this.playerBody.setVelocityX(this.roll.velocityX)
    } else if (lockedByAttack) {
      this.playerBody.setVelocityX(0)
    } else if (left) {
      this.playerBody.setVelocityX(-speed)
      this.facing = 'left'
    } else if (right) {
      this.playerBody.setVelocityX(speed)
      this.facing = 'right'
    } else {
      this.playerBody.setVelocityX(0)
    }

    if (jump && grounded && !locked) {
      this.playerBody.setVelocityY(-jumpSpeed)
    }

    const b = this.playerBody
    this.attack.update(
      delta,
      new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height),
      this.facing === 'right' ? 1 : -1,
      this.dummies
    )
    this.drawHitbox()
    this.drawStaminaBar()

    this.updateState()
  }

  private updateState() {
    const isGrounded = this.playerBody.blocked.down
    const moving = Math.abs(this.playerBody.velocity.x) > 1

    let nextState: PlayerState
    if (this.roll.isRolling) {
      nextState = 'roll'
    } else if (this.attack.isBusy) {
      nextState = 'attack'
    } else if (isGrounded) {
      nextState = moving ? 'walk' : 'idle'
    } else {
      nextState = this.playerBody.velocity.y < 0 ? 'jump' : 'fall'
    }

    if (nextState !== this.state) {
      this.state = nextState
    }

    this.applyStateAnimation()
  }

  private applyStateAnimation() {
    const frameIndex = this.facing === 'right' ? 0 : 1

    // Placeholder attack visual until real frames exist: tint on windup.
    if (this.attack.phase === 'windup') {
      this.player.setTint(ATTACK_WINDUP_TINT)
    } else {
      this.player.clearTint()
    }
    // Placeholder roll visual: translucent while the i-frames are active.
    this.player.setAlpha(this.roll.isInvulnerable ? 0.5 : 1)

    if (this.state === 'idle' || this.state === 'attack' || this.state === 'roll') {
      this.player.anims.stop()
      this.player.setTexture('player_idle', frameIndex)
    } else if (this.state === 'walk') {
      this.player.anims.play(
        this.facing === 'right' ? 'player-walk-right' : 'player-walk-left',
        true
      )
    } else if (this.state === 'jump') {
      this.player.anims.play(
        this.facing === 'right' ? 'player-jump-right' : 'player-jump-left',
        true
      )
    } else if (this.state === 'fall') {
      this.player.anims.play(
        this.facing === 'right' ? 'player-fall-right' : 'player-fall-left',
        true
      )
    }
    this.stateText?.setText(
      `${HELP_TEXT}\nState: ${this.state}`
    )
  }

  private drawHitbox() {
    const g = this.hitboxDebug
    if (!g) return
    g.clear()
    if (this.attack.phase !== 'active') return
    g.fillStyle(ATTACK_HITBOX_COLOR, 0.5)
    g.fillRectShape(this.attack.hitbox)
  }

  private drawStaminaBar() {
    const g = this.staminaBar
    if (!g) return
    const x = 16
    const y = 48
    const width = 100
    g.clear()
    g.fillStyle(STAMINA_BAR_BG, 1)
    g.fillRect(x, y, width, 4)
    g.fillStyle(STAMINA_BAR_COLOR, 1)
    g.fillRect(x, y, Math.round(width * this.stamina.ratio), 4)
  }

  private createAnimations() {
    if (this.anims.exists('player-walk-right')) return

    this.anims.create({
      key: 'player-walk-right',
      frames: this.anims.generateFrameNumbers('player_walk', {
        start: 0,
        end: 5,
      }),
      frameRate: 10,
      repeat: -1,
    })

    this.anims.create({
      key: 'player-walk-left',
      frames: this.anims.generateFrameNumbers('player_walk', {
        start: 6,
        end: 11,
      }),
      frameRate: 10,
      repeat: -1,
    })

    this.anims.create({
      key: 'player-jump-right',
      frames: this.anims.generateFrameNumbers('player_jump', {
        start: 0,
        end: 1,
      }),
      frameRate: 8,
      repeat: 0,
    })

    this.anims.create({
      key: 'player-jump-left',
      frames: this.anims.generateFrameNumbers('player_jump', {
        start: 2,
        end: 3,
      }),
      frameRate: 8,
      repeat: 0,
    })

    this.anims.create({
      key: 'player-fall-right',
      frames: this.anims.generateFrameNumbers('player_fall', {
        start: 0,
        end: 1,
      }),
      frameRate: 8,
      repeat: -1,
    })

    this.anims.create({
      key: 'player-fall-left',
      frames: this.anims.generateFrameNumbers('player_fall', {
        start: 2,
        end: 3,
      }),
      frameRate: 8,
      repeat: -1,
    })
  }
}

type PlayerState = 'idle' | 'walk' | 'jump' | 'fall' | 'attack' | 'roll'
type Facing = 'left' | 'right'
