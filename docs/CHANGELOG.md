# CHANGELOG — Tam Tam Evo

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versionado semántico desde la primera build jugable.

## [Sin publicar]

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
