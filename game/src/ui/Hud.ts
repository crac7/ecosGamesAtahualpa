import Phaser from 'phaser'
import type { Player } from '../entities/Player'
import { PlayerEvents } from '../events'

const SAFE_MARGIN = 8
const HEALTH_COLOR = 0x8e2b3a // textile_red
const STAMINA_COLOR = 0x2fa3a8 // eco_2
const EMPTY_COLOR = 0x23283a // shadow_deep
const ECO_ICON_COLOR = 0x7ff0e6 // eco_3
const TEXT_COLOR = '#e2b08e' // skin_3: warm, readable on the dark scene
const HINT_COLOR = '#66708a' // stone_3
const GAIN_COLOR = '#7ff0e6' // eco_3
const LOSS_COLOR = '#939cb0' // stone_4
const FONT = 'monospace'
const OUTLINE = '#0b0f12' // void: keeps text readable over any world color
const CONTROLS = 'move WASD/arrows  jump Space  attack J  roll K  interact L'

const SEGMENT_W = 10
const SEGMENT_H = 6
const SEGMENT_GAP = 2
const STAMINA_W = 64
const STAMINA_H = 3

/**
 * Gameplay HUD. Event-driven: it redraws only when the player emits a change
 * (see PlayerEvents), never by polling game state. Anchored to screen corners
 * with a safe margin, in internal pixels (the game scales by whole numbers).
 */
export class Hud {
  private readonly scene: Phaser.Scene
  private readonly vitals: Phaser.GameObjects.Graphics
  private readonly ecoText: Phaser.GameObjects.Text
  private readonly ecoDelta: Phaser.GameObjects.Text
  private readonly controls: Phaser.GameObjects.Text
  private readonly debugText?: Phaser.GameObjects.Text
  private hp = 0
  private maxHp = 0
  private stamina = 1

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    const { width, height } = scene.scale

    this.vitals = scene.add.graphics()

    // Top-right: eco icon + amount, right-aligned to the safe margin.
    const right = width - SAFE_MARGIN
    this.ecoText = scene.add
      .text(right, SAFE_MARGIN - 1, '0', { fontFamily: FONT, fontSize: '8px', color: TEXT_COLOR })
      .setOrigin(1, 0)
    this.ecoDelta = scene.add
      .text(right, SAFE_MARGIN + 10, '', { fontFamily: FONT, fontSize: '8px', color: GAIN_COLOR })
      .setOrigin(1, 0)
      .setAlpha(0)

    // Bottom-left: controls reminder.
    this.controls = scene.add
      .text(SAFE_MARGIN, height - SAFE_MARGIN, CONTROLS, {
        fontFamily: FONT,
        fontSize: '8px',
        color: HINT_COLOR,
      })
      .setOrigin(0, 1)

    if (import.meta.env.DEV) {
      this.debugText = scene.add
        .text(SAFE_MARGIN, height - SAFE_MARGIN - 12, '', {
          fontFamily: FONT,
          fontSize: '8px',
          color: HINT_COLOR,
        })
        .setOrigin(0, 1)
    }

    for (const obj of this.objects()) {
      obj.setScrollFactor(0).setDepth(100)
      if (obj instanceof Phaser.GameObjects.Text) obj.setStroke(OUTLINE, 3)
    }

    const events = scene.events
    events.on(PlayerEvents.HEALTH, this.onHealth, this)
    events.on(PlayerEvents.STAMINA, this.onStamina, this)
    events.on(PlayerEvents.ECO, this.onEco, this)
    events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this)
  }

  /** Dev-only line with the player state (not part of the game HUD). */
  debug(player: Player) {
    this.debugText?.setText(`state: ${player.state}`)
  }

  destroy() {
    const events = this.scene.events
    events.off(PlayerEvents.HEALTH, this.onHealth, this)
    events.off(PlayerEvents.STAMINA, this.onStamina, this)
    events.off(PlayerEvents.ECO, this.onEco, this)
  }

  private objects() {
    const list: (Phaser.GameObjects.Graphics | Phaser.GameObjects.Text)[] = [
      this.vitals,
      this.ecoText,
      this.ecoDelta,
      this.controls,
    ]
    if (this.debugText) list.push(this.debugText)
    return list
  }

  private onHealth(hp: number, maxHp: number) {
    this.hp = hp
    this.maxHp = maxHp
    this.drawVitals()
  }

  private onStamina(ratio: number) {
    this.stamina = ratio
    this.drawVitals()
  }

  private onEco(eco: number, delta: number) {
    this.ecoText.setText(String(eco))
    this.drawVitals() // the eco icon sits left of the (resized) amount
    if (delta === 0) return

    this.scene.tweens.killTweensOf(this.ecoDelta)
    this.ecoDelta
      .setText(delta > 0 ? `+${delta}` : `${delta}`)
      .setColor(delta > 0 ? GAIN_COLOR : LOSS_COLOR)
      .setAlpha(1)
    this.scene.tweens.add({ targets: this.ecoDelta, alpha: 0, delay: 900, duration: 400 })
  }

  private drawVitals() {
    const g = this.vitals
    g.clear()

    // Top-left: one segment per hit point, stamina bar under it.
    const x = SAFE_MARGIN
    const y = SAFE_MARGIN
    for (let i = 0; i < this.maxHp; i++) {
      g.fillStyle(i < this.hp ? HEALTH_COLOR : EMPTY_COLOR, 1)
      g.fillRect(x + i * (SEGMENT_W + SEGMENT_GAP), y, SEGMENT_W, SEGMENT_H)
    }
    const sy = y + SEGMENT_H + 3
    g.fillStyle(EMPTY_COLOR, 1)
    g.fillRect(x, sy, STAMINA_W, STAMINA_H)
    g.fillStyle(STAMINA_COLOR, 1)
    g.fillRect(x, sy, Math.round(STAMINA_W * this.stamina), STAMINA_H)

    // Eco icon: a small diamond left of the amount.
    const iconX = this.ecoText.x - this.ecoText.width - 6
    const iconY = SAFE_MARGIN + 4
    g.fillStyle(ECO_ICON_COLOR, 1)
    g.fillTriangle(iconX, iconY - 4, iconX + 3, iconY, iconX - 3, iconY)
    g.fillTriangle(iconX, iconY + 4, iconX + 3, iconY, iconX - 3, iconY)
  }
}
