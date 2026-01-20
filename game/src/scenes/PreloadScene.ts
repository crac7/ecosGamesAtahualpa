import Phaser from 'phaser'

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload')
  }

  preload() {
    this.load.spritesheet(
      'player_idle',
      new URL('../../assets/sprites/spr_player_idle.png', import.meta.url)
        .toString(),
      { frameWidth: 48, frameHeight: 48 }
    )
    this.load.spritesheet(
      'player_walk',
      new URL('../../assets/sprites/spr_player_walk.png', import.meta.url)
        .toString(),
      { frameWidth: 48, frameHeight: 48 }
    )
    this.load.spritesheet(
      'player_jump',
      new URL('../../assets/sprites/spr_player_jump.png', import.meta.url)
        .toString(),
      { frameWidth: 48, frameHeight: 48 }
    )
    this.load.spritesheet(
      'player_fall',
      new URL('../../assets/sprites/spr_player_fall.png', import.meta.url)
        .toString(),
      { frameWidth: 48, frameHeight: 48 }
    )
    this.load.image(
      'tileset_ruins',
      new URL('../../assets/tilesets/ts_zone01_ruins.png', import.meta.url)
        .toString()
    )
    this.load.tilemapTiledJSON(
      'zone01',
      new URL('../../assets/maps/map_zone01_a.json', import.meta.url).toString()
    )
  }

  create() {
    this.scene.start('Game')
  }
}
