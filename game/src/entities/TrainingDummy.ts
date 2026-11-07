import Phaser from 'phaser'
import { Health } from '../systems/combat/Health'
import type { Hurtbox } from '../systems/combat/MeleeAttack'

const BODY_COLOR = 0x66708a // stone_3
const HIT_COLOR = 0xe6fffb // eco_4
const RESPAWN_MS = 1200

/** Greybox target for tuning combat before real enemies exist. */
export class TrainingDummy extends Phaser.GameObjects.Rectangle implements Hurtbox {
  readonly health: Health
  private readonly label: Phaser.GameObjects.Text
  private readonly baseX: number

  constructor(scene: Phaser.Scene, x: number, groundY: number, maxHp = 5) {
    super(scene, x, groundY, 24, 40, BODY_COLOR)
    this.setOrigin(0.5, 1)
    this.baseX = x
    this.health = new Health(maxHp)
    scene.add.existing(this)

    this.label = scene.add
      .text(x, groundY - 44, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#939cb0',
      })
      .setOrigin(0.5, 1)
    this.refreshLabel()
  }

  getHurtBounds() {
    return this.getBounds()
  }

  onHit(direction: 1 | -1) {
    this.setFillStyle(HIT_COLOR)
    this.scene.tweens.killTweensOf(this)
    this.x = this.baseX
    this.scene.tweens.add({
      targets: this,
      x: this.baseX + direction * 3,
      duration: 50,
      yoyo: true,
      onComplete: () => this.setFillStyle(BODY_COLOR),
    })
    this.refreshLabel()

    if (this.health.isDead) {
      this.setAlpha(0.3)
      this.scene.time.delayedCall(RESPAWN_MS, () => {
        this.health.reset()
        this.setAlpha(1)
        this.refreshLabel()
      })
    }
  }

  private refreshLabel() {
    this.label.setText(`${this.health.hp}/${this.health.max}`)
  }
}
