import Phaser from 'phaser'
import { Checkpoint } from '../entities/Checkpoint'
import { Player } from '../entities/Player'
import { Scout } from '../entities/Scout'
import { ShortcutGate, type GateSide } from '../entities/ShortcutGate'
import { TrainingDummy } from '../entities/TrainingDummy'
import { PlayerInput } from '../input/PlayerInput'
import { BASE_HEIGHT, CAMERA } from '../settings'
import { CameraRig } from '../systems/CameraRig'
import { loadSave, writeSave, type SaveData } from '../systems/save/SaveStore'
import { DebugHud } from '../ui/DebugHud'

export class GameScene extends Phaser.Scene {
  private player!: Player
  private playerInput!: PlayerInput
  private cameraRig?: CameraRig
  private dummies: TrainingDummy[] = []
  private scouts: Scout[] = []
  private hud?: DebugHud
  private checkpoints: Checkpoint[] = []
  private gates: ShortcutGate[] = []
  private save!: SaveData

  constructor() {
    super('Game')
  }

  create() {
    const map = this.make.tilemap({ key: MAP_KEY })
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
    this.save = loadSave(MAP_KEY)
    this.checkpoints = map
      .filterObjects('Objects', (obj) => obj.name === 'bonfire')!
      .map(
        (obj) =>
          new Checkpoint(this, objectProp(obj, 'id') ?? `bonfire_${obj.id}`, obj.x ?? 0, obj.y ?? 0)
      )
    for (const cp of this.checkpoints) {
      if (this.save.litCheckpoints.includes(cp.id)) cp.light()
    }

    // Start at the last checkpoint rested at, else at the map spawn.
    const resumeAt = this.checkpoints.find((cp) => cp.id === this.save.checkpointId)
    const spawnX = resumeAt?.x ?? spawn?.x ?? 96
    const spawnY = resumeAt?.y ?? spawn?.y ?? BASE_HEIGHT - 64

    this.player = new Player(this, spawnX, spawnY, groundLayer, {
      onRespawn: () => {
        this.resetEnemies()
        this.cameraRig?.snapToTarget()
      },
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
      .filter((obj) => objectProp(obj, 'type') === 'scout')
      .map((obj) => new Scout(this, obj.x ?? 0, obj.y ?? 0, groundLayer))

    this.gates = map
      .filterObjects('Objects', (obj) => obj.name === 'gate_shortcut')!
      .map((obj) => {
        const id = objectProp(obj, 'id') ?? `gate_${obj.id}`
        const side: GateSide = objectProp(obj, 'opensFrom') === 'left' ? 'left' : 'right'
        const gate = new ShortcutGate(this, id, obj.x ?? 0, obj.y ?? 0, side)
        if (this.save.openedShortcuts.includes(id)) gate.open(true)
        return gate
      })
    this.physics.add.collider(this.player.sprite, this.gates)
    this.physics.add.collider(this.scouts, this.gates)

    this.hud = new DebugHud(this)
  }

  update(_time: number, delta: number) {
    if (!this.player) return

    // Consumed every frame so a press made while unable to interact is dropped.
    const interactPressed = this.playerInput.consumeInteract()

    // Order matters: player timers, then enemies (their hits land this frame),
    // then player input and attacks.
    this.player.tickTimers(delta)
    for (const scout of this.scouts) scout.tick(delta, this.player)
    this.player.update(delta, this.playerInput, [...this.dummies, ...this.scouts])
    const usedByCheckpoint = this.updateCheckpoints(interactPressed)
    this.updateGates(interactPressed && !usedByCheckpoint)

    this.hud?.draw(this.player)
  }

  /** Returns true when the interact press was used to rest. */
  private updateCheckpoints(interactPressed: boolean): boolean {
    const player = this.player
    let used = false
    const enemiesAggroed = this.scouts.some(
      (s) => s.aiState === 'chase' || s.aiState === 'attack'
    )
    for (const cp of this.checkpoints) {
      if (!cp.inRange(player.x, player.y) || player.health.isDead) {
        cp.setPrompt(null)
        continue
      }
      if (enemiesAggroed) {
        cp.setPrompt('enemies nearby')
        continue
      }
      cp.setPrompt(player.canInteract ? 'L: rest' : null)
      if (interactPressed && player.canInteract && !used) {
        this.restAt(cp)
        used = true
      }
    }
    return used
  }

  private updateGates(interactPressed: boolean) {
    const player = this.player
    for (const gate of this.gates) {
      if (!gate.inRange(player.x, player.y) || player.health.isDead) {
        gate.setPrompt(null)
        continue
      }
      if (!gate.canOpenFrom(player.x)) {
        gate.setPrompt('opens from the other side')
        continue
      }
      gate.setPrompt(player.canInteract ? 'L: open' : null)
      if (interactPressed && player.canInteract) {
        gate.open()
        const opened = new Set([...this.save.openedShortcuts, gate.id])
        this.persist({ ...this.save, openedShortcuts: [...opened] })
        return
      }
    }
  }

  /** Souls-style rest: refill, set respawn, reset enemies, save. */
  private restAt(cp: Checkpoint) {
    cp.light()
    this.player.rest()
    this.player.setRespawnPoint(cp.x, cp.y)
    this.resetEnemies()

    const lit = new Set([...this.save.litCheckpoints, cp.id])
    this.persist({ ...this.save, checkpointId: cp.id, litCheckpoints: [...lit] })
  }

  private persist(next: SaveData) {
    this.save = next
    if (!writeSave(next)) {
      console.warn('[save] Could not write the save (storage unavailable or full).')
    }
  }

  private resetEnemies() {
    for (const scout of this.scouts) scout.reset()
  }
}

const MAP_KEY = 'zone01'

function objectProp(obj: Phaser.Types.Tilemaps.TiledObject, name: string): string | undefined {
  const props = obj.properties as { name: string; value: unknown }[] | undefined
  const value = props?.find((p) => p.name === name)?.value
  return typeof value === 'string' ? value : undefined
}
