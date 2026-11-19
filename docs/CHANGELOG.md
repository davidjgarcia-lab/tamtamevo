# CHANGELOG — Tam Tam Evo

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versionado semántico desde la primera build jugable.

## [Sin publicar]

### Fase 2 — Spike técnico de animación (2026-11-19)
#### Añadido
- Monorepo pnpm: `apps/mobile` (Expo SDK 58, React Native 0.88, Skia 2.14, Reanimated 4.7), `packages/rig` y `packages/art`.
- **TamRig** (`packages/rig`), runtime de animación esqueletal vectorial:
  - Huesos jerárquicos y clips por keyframes con easing.
  - Cross-fade entre clips de 0,25 s.
  - Capas procedurales: respiración, parpadeo determinista y follow-through con retardo y reacción a la velocidad (llamas, colas).
  - Expresiones faciales por estado.
  - Partículas sin estado.
  - Paletas genéticas derivadas en OKLCH.
  - Todo es TypeScript puro ejecutable como worklet en el hilo de UI.
- **Chispín** (`packages/art`): 14 huesos, 40 partes vectoriales con canales de tinte, 5 clips (reposo, caminar, comer, caricia y dormir), emisores de partículas por clip (ascuas, polvo, migas, corazones y Zzz) y 5 alelos de color de la familia Fuego.
- Hábitat de Fuego en versión spike (cueva basáltica, río de lava y cristales de obsidiana) en 4 capas.
- Pantalla "Rig Lab" (herramienta de desarrollo): cambio de animación, acariciar tocando a la criatura, cambio de alelo de color y contador de FPS.
- 19 tests (Vitest) y `tools/screenshots.mjs` para QA visual con Playwright en 4 resoluciones.
- Vídeo y capturas en `docs/media/`.

### Fase 1 — Aprobación (2026-11-19)
#### Cambiado
- Decisiones D1–D8 aprobadas tal como se propusieron.
- **D9:** los minijuegos no tienen nombre visible; se identifican solo por iconos. IDs internos `maze`, `bricks`, `grid` y `trail`. Se ha añadido la especificación de los iconos en ART_DIRECTION §5 y un criterio de aceptación en el ROADMAP.
- **D10:** nuevo sistema de **Madurez** (EVOLUTION_SYSTEM §2.1). El crecimiento de Bebé a Adulto dura entre 5 y 7 días según el cuidado y el juego activo. El nivel y el CQ dejan de bloquear las transiciones (ahora hay topes de nivel por etapa). Se ha añadido el test de propiedad 120–168 h.
- Todos los documentos pasan a la versión 0.2, en estado aprobado.

### Fase 1 — Diseño (2026-11-19)
#### Añadido
- `GAME_DESIGN_DOCUMENT.md`: visión, pilares, bucles, navegación, FTUE, reglas fundamentales, mundo, audio, accesibilidad, monetización (propuesta) y decisiones pendientes D1–D10.
- `CREATURE_DATABASE.md`: 8 familias, 40 formas (Bebé → Infantil → Juvenil → 2 Adultos), tabla elemental, 56 habilidades de familia, 6 universales, estados alterados y plantilla de nuevas criaturas.
- `EVOLUTION_SYSTEM.md`: fórmula de evolución determinista (gates + puntuación + overrides + desempate), CQ, ejes, objetos, genética mendeliana con semilla, mutaciones con garantía, reproducción, huevos, Códice y pruebas requeridas.
- `GAMEPLAY_SYSTEMS.md`: cuidados con simulación por timestamps, vida en el hábitat, 4 minijuegos, Arena en tiempo real (20 Hz, determinista, IA de utilidad, gambits, rangos), economía y entrenamiento.
- `TECHNICAL_ARCHITECTURE.md`: comparativa de stacks, propuesta Expo + RN + Skia + Reanimated + TS, rig de animación TamRig, monorepo, persistencia offline, pruebas, backend Supabase futuro y preparación para multijugador.
- `ART_DIRECTION.md`: pilares visuales, lenguaje de formas, paletas, tipografía, iconografía, animación, storyboards y pipeline.
- `ROADMAP.md`: 8 fases con criterios de aceptación y registro de funcionalidades.

#### Decisiones de diseño internas
- Los pesos de eje de todas las ramas suman 2.2 (invariante) para garantizar el balance neutro entre ramas.

## Errores conocidos
_Ninguno (todavía no hay código)._
