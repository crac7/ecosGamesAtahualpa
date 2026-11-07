import Phaser from 'phaser'

export interface CameraRigConfig {
  /** Half-size of the deadzone box around the focus, in world pixels. */
  deadzoneHalfWidth: number
  deadzoneHalfHeight: number
  /** Horizontal distance the camera leads in the facing direction. */
  lookAhead: number
  /** Exponential smoothing rates (1/s). Higher = snappier. */
  followRateX: number
  followRateY: number
  lookAheadRate: number
}

/** Anything with a world position and an Arcade body velocity. */
export interface CameraTarget {
  x: number
  y: number
  body: { velocity: { x: number } } | null
}

/**
 * Platformer follow camera: deadzone + facing look-ahead + frame-rate
 * independent exponential smoothing, clamped to the camera bounds.
 *
 * Runs on POST_UPDATE so it reads the sprite after Arcade Physics has synced
 * it (avoids a one-frame lag). Phaser's own preRender then clamps the scroll
 * to the camera bounds and floors it when roundPixels is on.
 */
export class CameraRig {
  private focusX: number
  private focusY: number
  private lead = 0
  private direction: 1 | -1 = 1
  /** Additive offset for screen shake (owned by game-feel, not by the rig). */
  readonly shakeOffset = new Phaser.Math.Vector2(0, 0)
  private readonly scene: Phaser.Scene
  private readonly camera: Phaser.Cameras.Scene2D.Camera
  private readonly target: CameraTarget
  private readonly config: CameraRigConfig

  constructor(
    scene: Phaser.Scene,
    camera: Phaser.Cameras.Scene2D.Camera,
    target: CameraTarget,
    config: CameraRigConfig
  ) {
    this.scene = scene
    this.camera = camera
    this.target = target
    this.config = config
    this.focusX = target.x
    this.focusY = target.y
    this.camera.setRoundPixels(true)
    this.apply(this.focusX, this.focusY)

    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.update, this)
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this)
  }

  /** Hard-cut to the target (spawn, respawn, teleport). Resets smoothing. */
  snapToTarget() {
    this.focusX = this.clampFocusX(this.target.x)
    this.focusY = this.clampFocusY(this.target.y)
    this.lead = this.direction * this.config.lookAhead
    this.apply(this.focusX + this.lead, this.focusY)
  }

  destroy() {
    this.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.update, this)
  }

  private update(_time: number, deltaMs: number) {
    const dt = deltaMs / 1000
    const c = this.config

    // Deadzone: the focus only moves by how far the target left the box.
    const dx = this.target.x - this.focusX
    const dy = this.target.y - this.focusY
    const goalX =
      this.focusX + Math.sign(dx) * Math.max(0, Math.abs(dx) - c.deadzoneHalfWidth)
    const goalY =
      this.focusY + Math.sign(dy) * Math.max(0, Math.abs(dy) - c.deadzoneHalfHeight)

    this.focusX = this.clampFocusX(damp(this.focusX, goalX, c.followRateX, dt))
    this.focusY = this.clampFocusY(damp(this.focusY, goalY, c.followRateY, dt))

    // Look-ahead keeps the last direction while standing still.
    const vx = this.target.body?.velocity.x ?? 0
    if (Math.abs(vx) > 1) this.direction = vx > 0 ? 1 : -1
    this.lead = damp(this.lead, this.direction * c.lookAhead, c.lookAheadRate, dt)

    this.apply(this.focusX + this.lead, this.focusY)
  }

  private apply(centerX: number, centerY: number) {
    // Bounds clamp + pixel rounding happen in Camera#preRender.
    this.camera.setScroll(
      centerX - this.camera.width / 2 + this.shakeOffset.x,
      centerY - this.camera.height / 2 + this.shakeOffset.y
    )
  }

  // Keep the focus inside the area the view can reach, so it does not drift
  // past the level edge and lag behind when the player turns around.
  private clampFocusX(x: number) {
    const b = this.camera.getBounds()
    const half = this.camera.width / 2
    return b.width > 0 ? Phaser.Math.Clamp(x, b.x + half, b.right - half) : x
  }

  private clampFocusY(y: number) {
    const b = this.camera.getBounds()
    const half = this.camera.height / 2
    return b.height > 0 ? Phaser.Math.Clamp(y, b.y + half, b.bottom - half) : y
  }
}

/** Frame-rate independent exponential smoothing toward `to`. */
export function damp(from: number, to: number, rate: number, dt: number) {
  return from + (to - from) * (1 - Math.exp(-rate * dt))
}
