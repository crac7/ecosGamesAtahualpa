# Tareas del proyecto (estado actual)

## Hecho
- [x] Phaser + TypeScript + Vite funcionando (`game/`).
- [x] Escenas base Boot -> Preload -> Game creadas.
- [x] Configuracion pixel art (pixelArt, roundPixels, canvas pixelated).
- [x] Movimiento basico (izq/der/salto) y colisiones con plataformas simples.
- [x] Tilemap JSON integrado desde Tiled con colision.
- [x] Estructura de carpetas para assets (`/art`, `/game/assets`).
- [x] Maquina de estados basica del player (idle/walk/jump/fall) con placeholders.
- [x] Sprite idle del player (48x48, dos direcciones) integrado.
- [x] Sprites walk/jump/fall integrados y animaciones basicas creadas.
- [x] Direccion de arte aprobada (`art/ART_DIRECTION.md`) + paleta Zona 01 (`art/palettes/pal_zone01.gpl`).
- [x] Camara con seguimiento (deadzone + look-ahead + suavizado independiente del FPS) y limites por mapa (`game/src/systems/CameraRig.ts`).
- [x] Mapa de prueba ampliado a 60x20 para probar la camara.
- [x] Combate basico: ataque con J (windup/active/recovery), hitbox, dano y muñecos de entrenamiento placeholder.

## Parcial
- [-] M0: Loader/manifest de assets (solo precarga minima).
 

## Por hacer (segun README)
- [x] Player con sprites y maquina de estados (idle/walk/jump/fall).
- [ ] Stamina y esquiva/roll.
- [ ] Enemigo basico (patrol/chase/attack).
- [ ] Checkpoint tipo fogon (guardar + respawn + reset enemigos).
- [ ] Shortcut/atajo desbloqueable (puerta desde el otro lado).
- [ ] UI minima (vida, stamina, eco/moneda).
- [ ] Zona 01 vertical slice (10-15 pantallas) + miniboss.
- [ ] Pulido (sonido, feedback, particulas, balance).
