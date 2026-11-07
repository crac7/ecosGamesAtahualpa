import Phaser from 'phaser'

/** Keyboard bindings for the player (README §9). */
export class PlayerInput {
  private readonly cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private readonly keys?: {
    left: Phaser.Input.Keyboard.Key
    right: Phaser.Input.Keyboard.Key
    up: Phaser.Input.Keyboard.Key
    jump: Phaser.Input.Keyboard.Key
    attack: Phaser.Input.Keyboard.Key
    roll: Phaser.Input.Keyboard.Key
    interact: Phaser.Input.Keyboard.Key
  }

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard
    this.cursors = keyboard?.createCursorKeys()
    this.keys = keyboard?.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.W,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      attack: Phaser.Input.Keyboard.KeyCodes.J,
      roll: Phaser.Input.Keyboard.KeyCodes.K,
      interact: Phaser.Input.Keyboard.KeyCodes.L,
    }) as PlayerInput['keys']
  }

  get left() {
    return this.cursors?.left?.isDown || this.keys?.left.isDown || false
  }

  get right() {
    return this.cursors?.right?.isDown || this.keys?.right.isDown || false
  }

  get jump() {
    return (
      this.cursors?.up?.isDown ||
      this.keys?.up.isDown ||
      this.keys?.jump.isDown ||
      false
    )
  }

  /** Edge-triggered: true once per press, then the press is consumed. */
  consumeAttack() {
    return !!this.keys && Phaser.Input.Keyboard.JustDown(this.keys.attack)
  }

  /** Edge-triggered: true once per press, then the press is consumed. */
  consumeRoll() {
    return !!this.keys && Phaser.Input.Keyboard.JustDown(this.keys.roll)
  }

  /** Edge-triggered: true once per press, then the press is consumed. */
  consumeInteract() {
    return !!this.keys && Phaser.Input.Keyboard.JustDown(this.keys.interact)
  }
}
