# Dirección de arte — El Eco de Atahualpa

> Estado: **APROBADA** (2026-11-07). Fuente de verdad visual del proyecto.
> Complementa la sección 4 del `README.md`. Si hay conflicto, este documento manda.

## 1) Marco del juego

- **Fantasía del jugador:** un outsider frágil que avanza entre ruinas andinas tecnificadas cargando una verdad que pesa.
- **Verbos principales:** caminar, saltar, atacar, esquivar (roll), activar ecos/checkpoints.
- **Motor y renderer:** Phaser 3.90, `pixelArt: true`, `roundPixels: true` (`game/src/main.ts`).
- **Plataformas:** desktop (navegador) y móvil.
- **Cámara/vista:** lateral 2D estricta (side view), sin perspectiva. Personajes mirando a izquierda/derecha.
- **Viewport nativo:** 640x384 (20x12 tiles de 32px), zoom entero x3 → 1920x1152. Nunca escalas no enteras.
- **Escala en pantalla:** protagonista ≈ 1.25 tiles de alto (~40px de cuerpo).

## 2) Sistema visual

### Lenguaje de formas
- **Arquitectura andina:** bloques trapezoidales, juntas ortogonales, escalonado (chakana). Piedra = rectángulos pesados.
- **Tecnología 2028:** líneas rectas finas, ángulos de 45°, paneles. Se ve *incrustada* sobre la piedra, nunca al revés.
- **Protagonista:** formas compactas y redondeadas → vulnerable.
- **Enemigos:** formas angulares y asimétricas → amenaza. Su silueta tiene que distinguirse del protagonista **solo por la forma**.

### Prioridad de silueta (de mayor a menor)
1. Telegrafía de ataque enemigo (pose de anticipación).
2. Protagonista y su arma.
3. Enemigos en reposo y hazards.
4. Interactuables (checkpoint, palancas, puertas de atajo).
5. Decoración.

### Estructura de valores (claro/oscuro)
| Capa | Contraste | Saturación |
|------|-----------|------------|
| Fondos parallax lejanos | muy bajo | muy baja (tonos `stone_1–2`) |
| Fondo cercano / decoración BG | bajo | baja |
| Plano de juego (Ground, plataformas) | medio | media |
| Personajes, hazards, interactuables | **alto** | **alta** |

Regla: todo lo que puede herirte o con lo que puedes interactuar tiene que verse con más contraste que el fondo cuando se mira a escala x1.

### Roles de color RESERVADOS (legibilidad del combate)
- **Eco (cian):** solo protagonista, ecos, checkpoints y la UI amiga. Ningún enemigo lo usa.
- **Peligro (rojo/naranja):** solo telegrafías, hitboxes activas, hazards y daño. No se usa como decoración.
- **Oro de textil:** solo tesoro, memorias y objetos de lore.

### Paleta Zona 01 — "Ruinas del Eco" (26 colores)
Archivo para Aseprite: `art/palettes/pal_zone01.gpl`.

| Rol | Swatches |
|-----|----------|
| Oscuridad / outline | `#0b0f12` void · `#1a1c24` outline · `#23283a` sombra profunda |
| Piedra andina | `#2e3548` · `#444d63` · `#66708a` · `#939cb0` |
| Metal oxidado | `#3d2321` · `#6b3a2a` · `#a35a32` · `#d68b4a` |
| Tierra / tela | `#4a3426` · `#7a5538` · `#b08458` · `#8e2b3a` textil rojo |
| Oro (reservado) | `#d9a83c` |
| Piel | `#8a5a44` · `#c48a68` · `#e2b08e` |
| Eco (reservado) | `#1d5a63` · `#2fa3a8` · `#7ff0e6` · `#e6fffb` |
| Peligro (reservado) | `#7a1420` · `#e0402e` · `#ff9a5c` |

Cada material usa 2 o 3 tonos de sombra, como fija el README: piedra 4, metal 4, piel 3.
Las zonas futuras reutilizan oscuridad + eco + peligro y cambian los materiales.

### Materiales y superficie
- **Piedra:** bloques con bisel de 1px claro arriba e izquierda y oscuro abajo y derecha. Grietas de 1px. Musgo escaso.
- **Metal oxidado:** bordes en `rust_4` y manchas irregulares. Remaches de 1px.
- **Señalética moderna:** placas planas en `stone_4` con un acento de peligro. **Sin texto legible** (los glifos son abstractos).

### Contorno
- Outline de 1px en `#1a1c24` para personajes, enemigos e interactuables. **Nunca negro puro.**
- Tiles y fondo **sin outline** exterior; se separan por valor. Así los personajes se despegan del escenario.
- Sin anti-aliasing contra la transparencia. Se permite AA interno de forma manual y mínima.

### Iluminación
- Luz ambiental cenital tenue (desde arriba y levemente a la izquierda) para el modelado base.
- Luces locales: el eco cian (checkpoints, protagonista) y las luminarias de peligro. Se resuelven con sprites de glow o con la capa de luz de Phaser, nunca pintadas en el tile.
- El contraste lo pone la oscuridad: la escena es mayormente oscura y la luz es escasa y tiene significado.

### Densidad de detalle
- Personajes: detalle concentrado en la cabeza, las manos y el arma. El torso es simple.
- Tiles: el 70 % de la superficie es tranquila y el detalle va en bordes y esquinas.
- Fondos: detalle mínimo; solo siluetas.

### Carácter del movimiento
- **Protagonista:** pesado y deliberado. Anticipación visible y follow-through corto.
- **Enemigos:** la anticipación es **exagerada y legible**: pose + destello en color de peligro antes de golpear.
- Animación a 10–12 fps base. Los frames de ataque se definen **después** de ajustar timings con placeholders (ver M2 en el README).

### Exclusiones explícitas
- Negro `#000000` y blanco `#ffffff` puros.
- Degradados suaves, blur, sub-pixel y escalas no enteras.
- Rotar pixel art en runtime (rompe la grilla). Excepción: partículas y VFX.
- Mezclar resoluciones de píxel (cada sprite se dibuja a escala 1:1).
- Texto horneado en el arte (toda la UI de texto se hace en código).
- Usar cian en enemigos o rojo de peligro en decoración.

## 3) Contrato técnico

| Elemento | Regla |
|----------|-------|
| Tiles | 32x32, tilesets en grilla sin margen ni spacing |
| Protagonista | frame **64x64**, cuerpo ~40px de alto, centrado; el espacio libre es para los arcos del arma |
| Enemigos | familias de cuerpo: pequeño ≤32px · mediano ~48px · grande 64–96px · boss libre. Frame múltiplo de 16 |
| Pivote/anchor | abajo al centro (pies). La línea de pies siempre en la misma fila en todos los frames |
| Formato | PNG 32-bit con alfa real, exportado 1:1 (sin escalar) |
| Spritesheets | una tira horizontal por animación, frames del mismo tamaño |
| Filtrado | nearest (lo garantiza `pixelArt: true`), sin mipmaps |
| Espacio de color | sRGB |
| Parallax | 3 o 4 capas: lejana, media, cercana y FG. Ancho múltiplo de 640 para que tile horizontalmente |
| Naming y carpetas | según README §5: `spr_`, `ts_`, `map_`, `ui_`. Fuentes en `/art/`, exports en `/game/assets/` |

> **Cambio respecto a lo actual:** los sprites del protagonista son de 48x48. Se propone pasar a 64x64 cuando se haga el arte de producción, porque los ataques del souls necesitan espacio para el arma. Los 48x48 actuales siguen como placeholder.

## 4) Objetivo visual (pendiente)

- **Seed a aprobar:** 1 pantalla de 640x384 con el protagonista idle, un enemigo "explorador", tiles de piedra, un checkpoint encendido y una capa de parallax.
- Se juzga **dentro del juego a x3**, no en el editor.
- Brief, paleta y roles de color aprobados el 2026-11-07. El seed visual sigue pendiente.
