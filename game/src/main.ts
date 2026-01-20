import './style.css'
import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { PreloadScene } from './scenes/PreloadScene'
import { GameScene } from './scenes/GameScene'
import { BASE_HEIGHT, BASE_WIDTH, SCALE } from './settings'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  backgroundColor: '#0b0f12',
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 900 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: SCALE,
  },
  scene: [BootScene, PreloadScene, GameScene],
}

new Phaser.Game(config)
