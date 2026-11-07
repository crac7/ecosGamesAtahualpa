import Phaser from 'phaser'

const GATE_COLOR = 0x6b3a2a // rust_2
const GATE_EDGE_COLOR = 0xd68b4a // rust_4
const WIDTH = 16
const HEIGHT = 128
const INTERACT_RANGE_X = 28
const INTERACT_RANGE_Y = 24
const OPEN_MS = 400

export type GateSide = 'left' | 'right'

/**
 * One-way shortcut gate (greybox): a solid wall that can only be opened
 * from `opensFrom`. Once open it stays open (persisted by the scene).
 */
export class ShortcutGate extends Phaser.GameObjects.Rectangle {
  declare body: Phaser.Physics.Arcade.StaticBody
  readonly id: string
  readonly opensFrom: GateSide
  private opened = false
  private readonly prompt: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene, id: string, x: number, groundY: number, opensFrom: GateSide) {
    super(scene, x, groundY, WIDTH, HEIGHT, GATE_COLOR)
    this.id = id
    this.opensFrom = opensFrom
    this.setOrigin(0.5, 1)
    this.setStrokeStyle(1, GATE_EDGE_COLOR)
    scene.add.existing(this)
    scene.physics.add.existing(this, true)

    this.prompt = scene.add
      .text(x, groundY - HEIGHT - 4, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#939cb0',
      })
      .setOrigin(0.5, 1)
      .setDepth(20)
      .setVisible(false)
  }

  get isOpen() {
    return this.opened
  }

  /** Which side of the gate a point is on. */
  sideOf(x: number): GateSide {
    return x < this.x ? 'left' : 'right'
  }

  inRange(x: number, y: number) {
    return (
      !this.opened &&
      Math.abs(x - this.x) <= WIDTH / 2 + INTERACT_RANGE_X &&
      Math.abs(y - this.y) <= INTERACT_RANGE_Y
    )
  }

  canOpenFrom(x: number) {
    return !this.opened && this.sideOf(x) === this.opensFrom
  }

  /** Opens the gate. `instant` skips the animation (restoring from a save). */
  open(instant = false) {
    if (this.opened) return
    this.opened = true
    this.body.enable = false
    this.setPrompt(null)
    if (instant) {
      this.setVisible(false)
      return
    }
    // Slides into the ground, then hides.
    this.scene.tweens.add({
      targets: this,
      scaleY: 0,
      duration: OPEN_MS,
      ease: 'Quad.easeIn',
      onComplete: () => this.setVisible(false),
    })
  }

  setPrompt(text: string | null) {
    this.prompt.setVisible(text !== null)
    if (text !== null) this.prompt.setText(text)
  }
}
