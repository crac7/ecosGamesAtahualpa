import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { Scout } from '../entities/Scout'
import { TrainingDummy } from '../entities/TrainingDummy'
import { PlayerInput } from '../input/PlayerInput'
import { BASE_HEIGHT, CAMERA } from '../settings'
import { CameraRig } from '../systems/CameraRig'
import { DebugHud } from '../ui/DebugHud'

export class GameScene extends Phaser.Scene {
  private player!: Player
  private playerInput!: PlayerInput
  private cameraRig?: CameraRig
  private dummies: TrainingDummy[] = []
  private scouts: Scout[] = []
  private hud?: DebugHud

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

    this.player = new Player(this, spawnX, spawnY, groundLayer, {
      onRespawn: () => this.cameraRig?.snapToTarget(),
    })

    this.cameraRig = new CameraRig(this, this.cameras.main, this.player.sprite, CAMERA)
    this.cameraRig.snapToTarget()

    this.playerInput = new PlayerInput(this)

    const floorY = map.heightInPixels - map.tileHeight
    this.dummies = [
      new TrainingDummy(this, 300, floorY),
      new TrainingDummy(this, 760, floorY),
    ]

    this.scouts = map
      .filterObjects('Objects', (obj) => obj.name === 'enemy_spawn')!
      .filter((obj) => objectType(obj) === 'scout')
      .map((obj) => new Scout(this, obj.x ?? 0, obj.y ?? 0, groundLayer))

    this.hud = new DebugHud(this)
  }

  update(_time: number, delta: number) {
    if (!this.player) return

    // Order matters: player timers, then enemies (their hits land this frame),
    // then player input and attacks.
    this.player.tickTimers(delta)
    for (const scout of this.scouts) scout.tick(delta, this.player)
    this.player.update(delta, this.playerInput, [...this.dummies, ...this.scouts])

    this.hud?.draw(this.player)
  }
}

function objectType(obj: Phaser.Types.Tilemaps.TiledObject): string | undefined {
  const props = obj.properties as { name: string; value: unknown }[] | undefined
  const value = props?.find((p) => p.name === 'type')?.value
  return typeof value === 'string' ? value : undefined
}
