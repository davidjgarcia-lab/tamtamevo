# FIRST TAMTAM — VERTICAL SLICE

> Estado al 2026-11-19 · **prototipo jugable** en `apps/mobile` (iOS, Android y web). Vídeo: `docs/media/vertical-slice-demo.mp4`.

## Qué se puede jugar
1. **Huevo** con incubación animada (20 s en el primer huevo), bamboleo creciente, grietas, luz y eclosión.
2. **Nombre**: validación en vivo (2–16 caracteres, Unicode), "Sugerir", y nombre por defecto si se deja vacío.
3. **Casa** (TamTam Home): pared con papel pintado, ventana con la isla volcánica (día/noche según la hora), suelo de madera, cama-nido, alfombra, lámpara seta, póster y mancuernas. Chispín deambula, cambia de expresión según su estado y reacciona a todo.
4. **Cuidados**: comer (5 comidas: favorita, odiada, gourmet y especial), bañar, limpiar y recoger excrementos tocándolos, mimos (botón o tocando a Chispín), jugar, dormir y despertar (luces). Las necesidades evolucionan en tiempo real y con la app cerrada.
5. **Gym**: mantén y suelta en la zona verde; repeticiones según el nivel; monedas, XP de Fuerza y Energía; +1 FUE cada 10 sesiones; 3 niveles de mejora.
6. **Economía**: monedero de Tamcoins, historial, tienda por categorías, "Probar en mi casa" (fantasma verde o rojo, compra y colocación atómicas).
7. **Decorar**: colocar desde el inventario, mover, girar y retirar con colisiones por capas.
8. **Ficha**: necesidades, Madurez y tiempo de crecimiento, atributos, **FUE en Arena con su desglose** (base + Fuerza + Gym + comida) e historial de evolución; renombrar.
9. **Developer Debug Mode** (botón DEV): partida separada con reloj simulado (+1 h … +7 días), monedas ±, necesidades, niveles, atributos, desbloquear objetos, forzar evolución (en datos), huevos de cualquier alelo de color y reinicio.

## Qué NO incluye (honesto)
Minijuegos, Arena, evolución visible (Ritual y formas siguientes), genética y cría, cocina, enfermedad, Abatido, IA con muebles, sonido. Ver GAMEPLAY_TEST_RESULTS §3.

## Arte
Chispín v2 (vectorial, siguiendo ART_BIBLE) y muebles en estilo coherente: **artStatus = prototype** (no es arte final). Las imágenes de concepto IA son referencias de diseño.

## Cómo probarlo
```bash
pnpm install
```
```bash
pnpm --filter mobile start
```
Escanea el QR con **Expo Go** en tu móvil. Para la web: `pnpm --filter mobile web:build` y después sirve `apps/mobile/dist`.

## Arquitectura (resumen)
`apps/mobile/src/game/GameProvider.tsx` (estado, guardado, reloj y perfil debug) → reglas puras en `packages/core` (`game.ts`, `care/needs.ts`, `economy`, `shop`, `home`, `progression`, `evolution`) → render con Skia (`creature/*`, `home/roomArt.ts`) y animación con TamRig (`packages/rig`, `packages/art`).
