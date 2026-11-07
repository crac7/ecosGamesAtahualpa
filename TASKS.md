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
- [x] Stamina (gasto, pausa y regeneracion) y roll con K (i-frames, comprometido, solo en el suelo) + barra de stamina placeholder.
- [x] Enemigo basico "scout" (FSM patrol/chase/attack con telegrafia, stagger, muerte) + vida del jugador, knockback, muerte y respawn placeholder.
- [x] Checkpoint tipo fogon con L (descansar: vida/stamina, reset de enemigos, guardado versionado en localStorage, respawn en el ultimo fogon; bloqueado si hay enemigos en persecucion).
- [x] Atajo desbloqueable: puerta `gate_shortcut` que solo se abre con L desde `opensFrom`, persiste en el save (v2 con migracion desde v1).
- [x] UI minima event-driven (vida, stamina, eco) + moneda eco: scouts dan 15, al morir se pierde el 30% (version suave, README 7.6). Save v3 con migracion desde v2.

## Parcial
- [-] M0: Loader/manifest de assets (solo precarga minima).
 

## Por hacer (segun README)
- [x] Player con sprites y maquina de estados (idle/walk/jump/fall).
- [ ] Zona 01 vertical slice (10-15 pantallas) + miniboss.
- [ ] Pulido (sonido, feedback, particulas, balance).
