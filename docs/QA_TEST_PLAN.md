# QA TEST PLAN — TamTam Evolution

> Versión 1.0 · 2026-11-19. Resultados en GAMEPLAY_TEST_RESULTS.md. Escenarios de juego en GAMEPLAY_TEST_PLAN.md.

## 1. Niveles de prueba y herramientas
| Nivel | Herramienta | Dónde | Cómo se ejecuta |
|-------|-------------|-------|-----------------|
| 1. Unitarias | Vitest | `packages/*/src/**/*.test.ts` | `pnpm test` |
| 2. Integración (reglas combinadas, atomicidad) | Vitest + `MemoryStore` | `packages/core/src/game/game.test.ts` | `pnpm test` |
| 3. Gameplay (E2E) | Playwright sobre el build web | `tools/playthrough.mjs` | `pnpm --filter mobile web:build` y después `node tools/playthrough.mjs <dir>` |
| 4. Visuales | Capturas en 4 resoluciones + revisión manual | `tools/playthrough.mjs`, `tools/screenshots.mjs` | Igual |
| 5. Persistencia | Recarga de página en E2E; serialización en unitarias | E2E-13, tests `persistence` | Igual |
| 6. Rendimiento | Contador de FPS del Rig Lab; Flashlight/Perf Monitor en dispositivo | Dispositivo real | **Requiere dispositivo** (no disponible en la nube) |
| 7. Regresión | Todo lo anterior en cada cambio (CI pendiente) | — | `pnpm test && pnpm typecheck` + playthrough |

## 2. Reglas
- Estados: **PASSED**, **FAILED**, **BLOCKED** y **NOT IMPLEMENTED**. Nunca se marca PASSED sin ejecutar la prueba.
- Toda prueba tiene un ID estable, una entrada, el resultado esperado y una evidencia (test, captura o vídeo).
- Un fallo encontrado se registra con su causa y su solución en GAMEPLAY_TEST_RESULTS.

## 3. Áreas y criterios de salida del primer Tamtam (ART_BIBLE / FASE 8 del brief)
| Área | Criterio de salida |
|------|--------------------|
| Nacimiento y nombre | E2E incubación → eclosión → nombre (válido, inválido, Unicode, por defecto) → persistencia → renombrar |
| Cuidados | Cada acción cambia la necesidad correcta, tiene reacción visual y se guarda |
| Tiempo | Simulación con app cerrada = observada; suelo; amortiguación; sueño; excrementos; reloj hacia atrás |
| Alimentación | Inventario, favoritos, rechazos, saciedad, energía, efectos especiales |
| Gym | Coste, recompensa, idempotencia, Fuerza, +FUE cada 10, mejoras, cansancio |
| Economía | Saldo, compras, historial, atomicidad, persistencia, "Probar en mi casa" |
| Habitación | Colocar, mover, girar, retirar, colisiones, capas |
| Evolución | Matriz completa (EVOLUTION_TEST_MATRIX) + integración visual |
| Minijuegos / Arena / Genética | Ver GAMEPLAY_TEST_PLAN; hoy NOT IMPLEMENTED |
| Visual | 360×640, 390×844, 430×932, 768×1024 sin cortes ni deformaciones; texto legible; táctiles ≥ 44 pt |
| Rendimiento | 60 fps en gama media (dispositivo) |
