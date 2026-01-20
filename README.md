# EL ECO DE ATAHUALPA — Guía Maestra del Proyecto (Pixel Art 2D Soulsvania)

> Objetivo: construir una base sólida (tech + arte + diseño) para desarrollar el juego de forma iterativa, sin desorientarnos.

## 0) Resumen del juego

* **Género:** 2D metroidvania + combate estilo souls (stamina, castigo, atajos, checkpoints).
* **Estética:** pixel art oscuro/andino-futurista.
* **Tema central:** “La verdad no siempre libera, a veces pesa.”
* **Premisa:** un outsider en 2028 descubre que el “tesoro” no es solo oro: es memoria, evidencia, y una carga.

---

## 1) Pilares (lo que NO se negocia)

1. **Combate tenso y legible**

   * Telegráficos claros
   * I-frames cortos en esquiva
   * Stamina manda

2. **Exploración con atajos**

   * Puertas que abren desde el otro lado
   * Ascensores/puentes como shortcuts
   * Rutas alternativas por habilidad (dash, doble salto, gancho, etc.)

3. **Narrativa ambiental**

   * Texto mínimo, objetos con “eco”
   * NPCs crípticos
   * Revelación en capas (3 piezas del legado)

4. **Producción modular**

   * Todo se construye por “bloques”: tilesets, mapas, enemigos, eventos
   * Nada de “una imagen gigante” que luego nadie puede editar

---

## 2) Alcance inicial (MVP)

### MVP = “Vertical Slice” (1 zona jugable)

Incluye:

* Movimiento (correr, saltar, caída, escalones simples)
* Combate básico (1 arma, 1 combo, stamina)
* 1 enemigo básico + 1 miniboss
* 1 checkpoint tipo “fogón” (guardar + respawn)
* 1 zona con 10–15 pantallas (chunks)
* UI mínima (vida, stamina, “eco”/moneda)
* 1 atajo desbloqueable

---

## 3) Tecnología (stack recomendado)

### Motor

* **Phaser 3** (2D web, muy portable)

### Lenguaje y build

* **TypeScript**
* **Vite** (dev server rápido)
* **PNPM o Yarn** (el que uses ya)

### Deploy

* Web (PWA opcional)
* Empaquetado móvil (cuando toque):

  * **Capacitor** (recomendado) o Cordova (si ya lo dominas)

### Física

* **Arcade Physics** para iniciar (simple y rápido)
* Migrar a Matter SOLO si un día necesitas física compleja (probablemente no al inicio)

---

## 4) Reglas visuales (Pixel Art)

### Grid y cámara

* **Tile size:** 32x32 (definido)
* **Escala recomendada:** x3 o x4
* **Resolución interna:** se calcula por tiles visibles (ej. 20x12 tiles = 640x384)
* **Cámara:** pixel-perfect (sin suavizado)

### Paleta

* 16–32 colores por zona
* 2–3 tonos de sombra por material (piedra, metal, piel, tela)

### Sprites

* Protagonista: frames consistentes (ej. 48x64 o 64x64 según diseño)
* Enemigos: tamaño consistente por “familia” (pequeño/mediano/grande)

---

## 5) Pipeline de arte (para que todo encaje)

### Formatos

* PNG 32-bit con transparencia
* Sin escalado automático al exportar (se escala en engine)

### Naming (obligatorio)

* `spr_player_idle.png`
* `spr_player_walk.png`
* `spr_enemy_scout_walk.png`
* `ts_zone01_ruins.png` (tileset)
* `map_zone01_a.json` (tilemap)
* `ui_healthbar.png`

### Carpetas

* `/art/` (fuentes de arte, PSD/ASEPRITE, referencias)
* `/game/assets/` (exports listos para engine)

---

## 6) Mapas (tilemaps) — estándar

### Editor

* **Tiled** (recomendado)

### Capas mínimas en Tiled

* `BG` (decoración sin colisión)
* `Ground` (colisión)
* `FG` (decoración frontal)
* `Collide` (si separas colisión por layer)
* `Objects` (spawns/eventos)

### Convención de objetos

* Spawn jugador: objeto `player_spawn`
* Enemigos: `enemy_spawn` con property `type: scout`
* Checkpoint: `bonfire`
* Puertas/atajos: `gate_shortcut` con `id`

---

## 7) Arquitectura del juego (sistemas)

### Core loop

Explora → combate → consigues eco/llaves → abres atajo → checkpoint → avanzas → miniboss → pieza del legado.

### Sistemas mínimos

1. **Scene Manager**

   * Boot → Preload → MainMenu → Game → UI overlay

2. **Player Controller**

   * Input (teclado + gamepad + touch)
   * State machine: idle/walk/jump/fall/roll/attack/hit/dead

3. **Combat**

   * Hitboxes activas por frame (simple)
   * Invulnerabilidad breve al recibir daño
   * Stamina: atacar/rodar consume

4. **AI Enemiga**

   * Patrullaje
   * Persecución
   * Ataque telegráfico
   * Stagger/knockback básico

5. **Checkpoint (Fogón/Eco)**

   * Guarda progreso
   * Respawn de jugador
   * Reset de enemigos

6. **Economía (“Eco”)**

   * Se pierde al morir y se recupera al volver al punto (opcional soulslike clásico)
   * O versión suave: se pierde porcentaje (para no frustrar demasiado)

7. **Progresión**

   * 3 “Piezas del legado”
   * Cada una desbloquea habilidad (dash / gancho / doble salto)

---

## 8) Contenido (roadmap de zonas)

### ZONA 01 — “Ruinas del Eco” (tutorial oscuro)

* Materiales: piedra andina + metal oxidado + señalética moderna
* Enemigos: exploradores, drones caídos, saqueadores
* Miniboss: “El Tasador” (mide el valor de la verdad)

### ZONA 02 — “Archivo Sumergido”

* Agua, humedad, luces rotas, ecos distorsionados
* Nueva habilidad: dash/air-dash o gancho

### ZONA 03 — “Cámara del Peso”

* Arquitectura ceremonial, trampas, guardianes
* Boss: “El Portador de la Verdad”

*(Estas zonas se detallan después, pero ya quedan fijadas como guía.)*

---

## 9) Controles (desktop + móvil)

### Desktop

* WASD / Flechas: mover
* Space: saltar
* J: ataque
* K: esquiva/roll
* L: interacción
* Esc: menú

### Móvil

* Stick virtual izquierdo
* Botones: jump/attack/roll/interact
* UI grande y clara (dedos no son punteros de mouse)

---

## 10) Métricas de calidad (Definition of Done)

Un incremento se considera “listo” si:

* No rompe el pixel-perfect
* Mantiene 60 FPS estable en desktop promedio
* Se puede jugar 5 minutos sin bug blocker
* Assets cumplen naming + carpeta correcta
* El mapa corre desde JSON sin cambios manuales

---

## 11) Plan por hitos (iteración)

### M0 — Repo y base técnica

* Phaser + TS + Vite funcionando
* Escena vacía con cámara pixel-perfect
* Loader y manifest de assets

### M1 — Movimiento

* Player con idle/walk/jump/fall
* Colisión con tiles

### M2 — Combate

* Attack + hitbox + daño
* Enemigo básico con 2 estados (patrol/chase)

### M3 — Checkpoint + atajo

* Fogón guarda y respawn
* 1 shortcut (puerta que abre desde dentro)

### M4 — Vertical slice

* Zona 01 completa + miniboss
* UI mínima

### M5 — Pulido

* Sonido, feedback, partículas, balance stamina

---

## 12) Reglas del proyecto (para no morir en el intento)

* Toda feature nueva entra como “pequeño bloque” (PR mental)
* Nada de assets sin naming
* Nada de mapas sin Objects layer
* Nada de “lo arreglo después” en el pipeline (después nunca llega)

---

## 13) Checklist de arranque (lo primero que haremos)

1. Crear estructura de carpetas
2. Setup Phaser+TS+Vite
3. Escena Boot/Preload/Game
4. Pixel-perfect: disable antialias + scaling correcto
5. Integrar Tilemap JSON desde Tiled
