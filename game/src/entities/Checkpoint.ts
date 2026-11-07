import Phaser from 'phaser'

const BASE_COLOR = 0x444d63 // stone_2
const UNLIT_COLOR = 0x2e3548 // stone_1
const FLAME_COLOR = 0x7ff0e6 // eco_3 (reserved for checkpoints)
const GLOW_COLOR = 0x2fa3a8 // eco_2
const INTERACT_RANGE_X = 28
const INTERACT_RANGE_Y = 24

/** Bonfire-style checkpoint (greybox). Lit after the first rest. */
export class Checkpoint {
  readonly id: string
  readonly x: number
  readonly y: number
  private lit = false
  private readonly flame: Phaser.GameObjects.Rectangle
  private readonly glow: Phaser.GameObjects.Ellipse
  private readonly prompt: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene, id: string, x: number, groundY: number) {
    this.id = id
    this.x = x
    this.y = groundY

    this.glow = scene.add
      .ellipse(x, groundY - 8, 56, 40, GLOW_COLOR, 0.2)
      .setVisible(false)
    scene.add.rectangle(x, groundY, 20, 6, BASE_COLOR).setOrigin(0.5, 1)
    this.flame = scene.add
      .rectangle(x, groundY - 6, 6, 10, UNLIT_COLOR)
      .setOrigin(0.5, 1)
    this.prompt = scene.add
      .text(x, groundY - 46, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#7ff0e6',
      })
      .setOrigin(0.5, 1)
      .setDepth(20) // above the player standing on the bonfire
      .setVisible(false)
  }

  get isLit() {
    return this.lit
  }

  light() {
    this.lit = true
    this.flame.setFillStyle(FLAME_COLOR)
    this.glow.setVisible(true)
  }

  /** True when a body standing at (x, y feet) can interact with it. */
  inRange(x: number, y: number) {
    return (
      Math.abs(x - this.x) <= INTERACT_RANGE_X &&
      Math.abs(y - this.y) <= INTERACT_RANGE_Y
    )
  }

  /** Shows the interaction hint; null hides it. */
  setPrompt(text: string | null) {
    this.prompt.setVisible(text !== null)
    if (text !== null) this.prompt.setText(text)
  }
}
