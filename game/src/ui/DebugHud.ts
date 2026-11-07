import Phaser from 'phaser'
import type { Player } from '../entities/Player'

const STAMINA_BAR_COLOR = 0x2fa3a8 // eco_2
const BAR_BG = 0x23283a // shadow_deep
const HEALTH_BAR_COLOR = 0x8e2b3a // textile_red
const HELP_TEXT = 'WASD/Arrows: move  Space/W: jump  J: attack  K: roll  L: rest'

/** Placeholder HUD until the UI task: controls, player state, health and stamina. */
export class DebugHud {
  private readonly text: Phaser.GameObjects.Text
  private readonly bars: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene) {
    this.text = scene.add
      .text(16, 16, `${HELP_TEXT}\nState: idle`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#cdd6df',
      })
      .setScrollFactor(0)
    this.bars = scene.add.graphics().setScrollFactor(0)
  }

  draw(player: Player) {
    this.text.setText(`${HELP_TEXT}\nState: ${player.state}`)

    const g = this.bars
    const x = 16
    const y = 60
    const width = 100
    g.clear()
    g.fillStyle(BAR_BG, 1)
    g.fillRect(x, y, width, 4)
    g.fillStyle(STAMINA_BAR_COLOR, 1)
    g.fillRect(x, y, Math.round(width * player.stamina.ratio), 4)

    // Health as one segment per hit point, above the stamina bar.
    const segment = 12
    const health = player.health
    for (let i = 0; i < health.max; i++) {
      g.fillStyle(i < health.hp ? HEALTH_BAR_COLOR : BAR_BG, 1)
      g.fillRect(x + i * (segment + 2), y - 8, segment, 5)
    }
  }
}
