# CHANGELOG — Tam Tam Evo

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versionado semántico desde la primera build jugable.

## [Sin publicar]

### Decisiones N9, N11, N12 + magia y Lustre (2026-11-19)
#### Añadido
- **Lustre** (`core/appearance`): puntuación de cuidado, actividades, Arena y vínculo con 5 niveles; se **graba en cada evolución** como calidad de forma (stats ×0,88–1,10, habilidades Debilitada→Ascendida, pasiva extra en Legendario). Marca de vida por atributo dominante.
- Efectos visuales: emisivo con bloom, halo (y luces en órbita), sheen animado, destellos, saturación y densidad de partículas según el nivel; adornos físicos por nivel en Chispín (hollín, pecas doradas, llamas extra, runa, corona).
- Siestas de 20 min (+15 Energía, cada 90 min). Coste del Gym 5/8/10 según el nivel.
- Debug: historial de cuidado forzable y comparativa de Lustre.
- Marca: el juego se llama **TamTam Evolution** y la marca visual es **TamTam EVO**.

### Art Bible + vertical slice del primer Tamtam (2026-11-19)
#### Añadido
- `ART_BIBLE.md` (identidad, proporciones por etapa, anatomía modular, paletas de 8 familias, 14 expresiones, guía de documentación) y concept art generado con IA (`docs/media/concept/`, solo referencia).
- Chispín v2: cejas, cuernitos de brasa, cola con ascua, cuerpo con degradado y 11 clips (6 nuevos: celebrar, entrenar con mancuerna, bañarse, triste, hambriento, enfado). El rig admite rellenos con degradado y los slots `brows` y `prop`.
- **Prototipo jugable**: huevo → eclosión → nombre → casa con muebles → cuidados → comida → Gym (3 niveles) → monedero, historial y tienda ("Probar en mi casa") → decorar → ficha (FUE de Arena) → guardado.
- **Developer Debug Mode**: partida separada, reloj simulado, monedas, necesidades, atributos, objetos, evolución forzada y huevos.
- `packages/core`: simulación de cuidados en tiempo real (`care/needs.ts`), contenido y reglas del slice (`game/*`), motor de evolución con reglas de Fuego (`evolution/engine.ts`) y simulador de ciclo de vida (`sim/lifecycle.ts`).
- Tests: 102 unitarios y de integración, 19 comprobaciones E2E (`tools/playthrough.mjs`), matriz de evolución de 27 escenarios + 5.000 aleatorios.
- Documentos: CHARACTER_DESIGN_FIRST_TAMTAM, CHARACTER_ANIMATION_GUIDE, EVOLUTION_TEST_MATRIX, GAMEPLAY_TEST_PLAN, QA_TEST_PLAN, GAMEPLAY_TEST_RESULTS, PROGRESSION_TIMELINE, BALANCE_CONFIG, FIRST_TAMTAM_VERTICAL_SLICE y REUSABLE_CREATURE_TEMPLATE.
#### Corregido
- Toques en la habitación en web, cierre del panel debug, precisión del crecimiento, `structuredClone` y recorte de la ventana (GAMEPLAY_TEST_RESULTS §5).

### Brief v3.0 — Documentación y núcleo de lógica (2026-11-19)
#### Añadido
- `HOME_SYSTEM.md`, `ECONOMY_SYSTEM.md` y `ACTIVITIES_SYSTEM.md`.
- Análisis de las 5 imágenes de referencia y reglas de estilo derivadas (ART_DIRECTION §11–12).
- Identidad individual del Tamtam y reglas de nombre (CREATURE_DATABASE §12).
- Término de atributos en la fórmula de evolución (específico por rama).
- `packages/core`, lógica pura con 51 tests: identidad y nombres, monedero sobre libro mayor (atómico, idempotente y auditable), inventario, catálogo y tienda, colocación de muebles, recompensas con Entusiasmo, atributos y mejoras de objetos funcionales, y snapshots versionados.
#### Cambiado
- Las criaturas pasan a llamarse **Tamtams** y la moneda común **Tamcoins** (pendiente de N5).
- Hogar = casa decorable (pendiente de N4). Las secciones sustituidas de GAMEPLAY_SYSTEMS están marcadas.
- ROADMAP combinado en 12 fases (pendiente de N8), con unos 12 meses estimados hasta la 1.0.
#### No implementado todavía
- Ninguna pantalla nueva (eclosión con nombre, ficha, tienda, editor de casa, actividades).
- Persistencia SQLite; las actividades jugables; las animaciones nuevas.

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
