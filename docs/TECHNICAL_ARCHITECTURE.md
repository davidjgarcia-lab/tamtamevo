# TECHNICAL ARCHITECTURE — Tam Tam Evo

> Versión 0.2 · Fase 1 · Estado: **aprobado** (decisiones D1–D10, 2026-11-19)

---

## 1. Requisitos que condicionan la arquitectura

| # | Requisito | Consecuencia técnica |
|---|-----------|----------------------|
| R1 | iOS + Android desde un único código | Framework multiplataforma |
| R2 | Animación 2D fluida y modular, con rasgos genéticos (partes intercambiables y colores) | Render vectorial o esqueletal en runtime, no sprites pre-renderizados |
| R3 | 4 minijuegos arcade a 60 fps | Bucle de juego con canvas acelerado por GPU, fuera del hilo de JS de la UI |
| R4 | Combate en tiempo real **determinista** y validable en servidor | Lógica pura compartible entre cliente y servidor |
| R5 | Offline-first con persistencia robusta | Base de datos local transaccional y migraciones de esquema |
| R6 | Interfaz rica tipo app (navegación, listas, formularios, accesibilidad, i18n) | Buen soporte de UI nativa |
| R7 | Backend social futuro (amigos, PvP, clasificaciones) | BaaS con Postgres, auth, realtime y funciones |
| R8 | QA visual automatizable en múltiples resoluciones | Preferible poder ejecutar la app en un navegador headless |

---

## 2. Comparativa de tecnologías

### 2.1 Motor / framework cliente

| Criterio (peso) | **Expo + React Native + Skia + Reanimated** | **Godot 4** | **Unity 6** | **Flutter + Flame** |
|-----------------|---------------------------------------------|-------------|-------------|---------------------|
| Render 2D de juego (20%) | ●●●○ Skia en GPU, bucle con worklets en el hilo de UI | ●●●● Motor nativo 2D, partículas y shaders | ●●●● Excelente | ●●●○ Flame es correcto |
| UI de app / accesibilidad / i18n (15%) | ●●●● Nativa | ●●○○ UI propia, a11y limitada | ●●○○ UI Toolkit; a11y mejorable | ●●●● Muy buena |
| Lógica compartida cliente-servidor (15%) | ●●●● TypeScript en Supabase Edge Functions (Deno) | ●○○○ GDScript no corre en el servidor estándar | ●●○○ C# en servidor dedicado (más infraestructura) | ●●○○ Dart en servidor (poco habitual) |
| Animación esqueletal y rasgos modulares (15%) | ●●●○ Rig propio sobre Skia o Rive | ●●●● Skeleton2D nativo y Spine | ●●●● 2D Animation y Spine | ●●●● Rive de primera clase |
| Persistencia offline y servicios móviles (10%) | ●●●● expo-sqlite, notificaciones, IAP, OTA | ●●○○ Plugins de terceros | ●●●○ Paquetes | ●●●○ Paquetes |
| Testabilidad y QA visual automatizada (10%) | ●●●● Vitest + build web con Playwright en CI | ●●○○ GUT; visual difícil en CI | ●●○○ Test Framework; pesado en CI | ●●●○ Golden tests |
| Productividad del equipo (Claude Code + tú) (10%) | ●●●● TS es el lenguaje donde Claude es más productivo y verificable | ●●●○ | ●●○○ Editor gráfico imprescindible | ●●●○ |
| Tamaño de binario y arranque (5%) | ●●●○ ~25–35 MB | ●●●○ ~30 MB | ●●○○ 40+ MB | ●●●○ ~20 MB |
| **Puntuación ponderada (sobre 4)** | **3.60** | 2.70 | 2.80 | 3.15 |

**Conclusión.** Godot y Unity son mejores *motores de juego puros*, pero este proyecto es en un 50% "app de mascota" (UI, persistencia, notificaciones, navegación) y en un 50% "juego". Lo que decide la elección es **R4**: con TypeScript, el mismo módulo de combate, evolución y genética corre en el móvil, en los tests y en el servidor (Supabase Edge Functions), y la validación anti-trampas del PvP futuro es trivial. Flutter + Flame sería la segunda opción.

**Recomendación (D2): Expo (React Native, New Architecture) + TypeScript estricto + React Native Skia + Reanimated.**

### 2.2 Animación de criaturas

| Opción | Pros | Contras | Veredicto |
|--------|------|---------|-----------|
| **Spritesheets** | Simple, máxima fidelidad a la ilustración | Memoria enorme (40 formas × 20 animaciones × variantes genéticas), sin intercambio de partes | Solo para VFX puntuales |
| **Spine 2D** | Estándar de la industria, mallas deformables | **Sin runtime oficial mantenido para React Native**, licencia de editor | Descartado en este stack |
| **Rive** | State machines, runtime RN oficial, archivos pequeños, data binding | Requiere el editor Rive (trabajo humano). El intercambio de partes genéticas se complica con miles de combinaciones | **Alternativa** si se incorpora un animador |
| **Rig vectorial modular propio (Skia)** | Partes SVG intercambiables por genética, tintado en runtime, animación procedural + keyframes en JSON. Todo versionable en git y producible por Claude | Hay que construir el runtime (~1.5 semanas). La calidad depende del arte de las partes | **Recomendada (D3)** |

**Diseño del rig "TamRig":**
```
Rig (JSON)                         Clip (JSON)                     Capas procedurales (runtime)
├─ bones: root→body→head→…         ├─ tracks[bone].rot/pos/scale  ├─ respiración (seno en body.scaleY)
├─ slots: orden de dibujo          ├─ curvas: bezier por clave    ├─ parpadeo (aleatorio con semilla)
├─ parts: slot→SVG path por alelo  ├─ eventos: "hit", "step", "sfx"├─ mirar a (cabeza → objetivo)
└─ tints: base/acento/patrón       └─ loop / one-shot             ├─ squash & stretch (saltos, impactos)
                                                                   └─ física secundaria (muelles en colas, orejas y antenas)
```
- **Esqueletos compartidos** por arquetipo: `biped_small`, `quadruped_light`, `quadruped_heavy`, `serpentine`, `flyer`, `floater`, `blob`. Las 40 formas reutilizan unos 7 rigs, de modo que los clips se comparten y se sobrescriben solo donde hace falta.
- **Expresiones faciales:** capa de cara independiente (ojos, boca y cejas como partes con estados: feliz, triste, enfadado, sueño, sorpresa, comiendo), mezclable con cualquier clip corporal.
- **Render:** Skia `Picture` por criatura. Las transformaciones se calculan en worklets de Reanimated (hilo de UI) a 60/120 fps sin pasar por el hilo de JS.
- **Evolución:** secuencia especial con shader `RuntimeEffect` (silueta blanca → *morph* de contornos → explosión de partículas → revelado).
- **Partículas:** sistema propio sobre Skia (pool de partículas, atlas de texturas para chispas, burbujas, hojas, estrellas…).

---

## 3. Arquitectura del sistema

```
┌────────────────────────────── apps/mobile (Expo) ─────────────────────────────┐
│  UI (expo-router, pantallas, componentes)                                     │
│     │  lee/escribe vía hooks                                                  │
│  Estado de app (Zustand)  ◄──── Game Services (orquestación, sin lógica pura) │
│     │                                │                                         │
│  Render de juego (Skia + Reanimated) │   Persistencia (expo-sqlite)           │
│   ├─ TamRig runtime                  │   ├─ snapshot + log de acciones        │
│   ├─ Partículas / VFX                │   └─ migraciones versionadas           │
│   └─ Escenas: Hogar, 4 minijuegos, Arena                                      │
└──────────────────────────────────────┼────────────────────────────────────────┘
                                       │ importa
┌──────────────────────── packages/core (TS puro, sin RN) ──────────────────────┐
│ time/  care/  evolution/  genetics/  combat/  minigames/*  economy/  rng/     │
│ Determinista · sin Date.now() directo (reloj inyectado) · 100% testeable     │
└──────────────────────────────────────┬────────────────────────────────────────┘
                                       │ consume datos de
┌──────────── packages/content ───────────┐   ┌──────── packages/art ─────────┐
│ criaturas, habilidades, objetos,        │   │ partes SVG, rigs, clips,      │
│ reglas de evolución, balance (Zod)      │   │ paletas, VFX                  │
└─────────────────────────────────────────┘   └───────────────────────────────┘
                     (futuro) supabase/: Postgres + Auth + Edge Functions que importan packages/core
```

### 3.1 Estructura del repositorio (monorepo pnpm + Turborepo)
```
tam-tam-evo/
├─ apps/mobile/            # Expo app (expo-router)
│  ├─ app/                 # rutas: (tabs)/home, games, creatures, arena, profile
│  ├─ src/scenes/          # escenas Skia: habitat, maze, bricks, grid, trail, arena
│  ├─ src/rig/             # runtime TamRig
│  ├─ src/vfx/             # partículas y shaders
│  ├─ src/services/        # GameService, SaveService, AudioService, NotificationService
│  ├─ src/state/           # stores Zustand
│  └─ src/ui/              # design system (componentes)
├─ packages/core/          # lógica pura de juego
├─ packages/content/       # datos de juego validados
├─ packages/art/           # assets fuente y pipeline (SVGO → JSON de paths)
├─ tools/                  # simuladores de balance (sim:arena, sim:evolution, sim:breeding)
├─ supabase/               # (Fase 8+) migraciones SQL y edge functions
└─ docs/                   # esta documentación
```

### 3.2 Reglas de arquitectura (verificadas por lint)
1. `packages/core` **no importa** React, React Native ni Expo, ni accede a `Date.now()` o `Math.random()`: el reloj y el RNG se inyectan.
2. La UI nunca muta el estado de juego directamente: llama a `GameService.dispatch(action)`, que ejecuta la lógica de core, persiste y notifica.
3. Todos los datos de contenido pasan por un esquema Zod en tiempo de build (con tests de integridad referencial: cada `skillId` y `formId` existe).
4. Los textos visibles al jugador están en archivos i18n.

---

## 4. Persistencia y offline

- **expo-sqlite** (transaccional, con WAL) como almacenamiento principal. MMKV solo para preferencias de UI.
- **Modelo híbrido snapshot + log:**
  - `snapshot` de cada entidad (jugador, criaturas, inventario, huevos), versionado por `schemaVersion`.
  - `action_log` *append-only* con cada acción relevante (`{id, ts, type, payload, rngSeed}`). Sirve para depurar, recuperarse ante corrupción y, en el futuro, **sincronizar y validar** en el servidor.
- Guardado: tras cada acción (transacción) y al pasar a segundo plano (`AppState`). Nada se pierde al cerrar.
- **Migraciones** numeradas y con test (se carga un save de cada versión antigua → se migra → se valida contra el esquema actual).
- **Copia de seguridad:** export/import local de un archivo cifrado en el MVP y nube con Supabase después.

---

## 5. Bucles de juego y rendimiento

| Escena | Lógica | Render |
|--------|--------|--------|
| Hogar | IA de criaturas a 4 Hz en JS; animación en worklets | Skia Canvas, 60 fps |
| Minijuegos | Paso fijo de 60 Hz (`maze`, `bricks`, `trail`) en `useFrameCallback` (worklet) con core puro | Skia, 60/120 fps |
| `grid` | Event-driven | UI RN + Skia para celebraciones |
| Arena | Simulación completa precalculada en ~5 ms (determinista) → reproducción interpolada a 20 Hz | Skia, 60 fps |

> La Arena **precalcula** el combate entero (es determinista) y luego lo **reproduce** como una línea de tiempo de eventos. Ventajas: rendimiento estable, velocidad 2×, repeticiones gratuitas y el mismo resultado que el servidor.

**Presupuestos (gama media, p. ej. Pixel 6a / iPhone 12):**
- 60 fps sostenidos en todas las escenas; frame JS < 8 ms.
- Arranque en frío < 2.5 s.
- Memoria < 250 MB.
- APK/IPA < 60 MB (audio en OGG/AAC y arte vectorial).
- Batería: sin trabajo en segundo plano (todo se calcula por timestamps al abrir).

---

## 6. Calidad y pruebas

| Nivel | Herramienta | Alcance |
|-------|-------------|---------|
| Unitarias y property-based | **Vitest + fast-check** | Todo `packages/core`: cuidados (integración temporal), evolución, herencia, combate, generadores de minijuegos |
| Integridad de contenido | Vitest + Zod | Referencias, balance de pesos (Σw = 2.2), stats (suma 515 en adultos) |
| Simulación de balance | `tools/sim-*` (Node) | Matrices de victoria en la Arena, alcanzabilidad de ramas, distribuciones genéticas |
| Componentes | React Native Testing Library | Pantallas y flujos de UI |
| E2E móvil | **Maestro** | FTUE, cuidar, evolucionar, minijuego y combate en emulador Android |
| Visual | **Playwright** sobre el build web de Expo | Capturas en 360×640, 390×844, 430×932 y 768×1024; diff visual en CI |
| Rendimiento | Perf monitor + Flashlight (Android) | Presupuestos de §5 |

CI: GitHub Actions → lint, typecheck, tests, sims de balance (con umbrales), build web y capturas, y EAS Build en las ramas de release.
Registro de errores: Sentry (crash reporting, opt-in) desde la Fase 7. Bug log en `docs/CHANGELOG.md` (sección *Known issues*) hasta entonces.

---

## 7. Backend (preparado, no implementado en el MVP)

**Recomendación: Supabase** (Postgres gestionado, Auth, Realtime, Edge Functions en Deno/TS y Storage).
- Postgres encaja con datos relacionales (jugadores, criaturas, amistades, combates, clasificaciones) y RLS da seguridad por fila.
- Las Edge Functions en TypeScript **importan `packages/core`**: el servidor ejecuta exactamente la misma simulación.
- Alternativas valoradas: Firebase (NoSQL, menos adecuado para clasificaciones y relaciones; funciones en TS también viables) y Nakama (excelente para juegos, pero más infraestructura propia). Supabase ofrece el mejor equilibrio para este equipo.

Esquema inicial previsto (borrador):
```
players(id, display_name, created_at, caretaker_level, ...)
creatures(id, owner_id, form_id, genome jsonb, stats jsonb, ruleset_version, ...)
action_log(id, player_id, ts_client, ts_server, type, payload jsonb, seed)
fighter_snapshots(id, creature_id, loadout jsonb, ruleset_version, power, created_at)
battles(id, attacker_snapshot, defender_snapshot, seed, result, pc_delta, validated_at)
friendships(player_a, player_b, status)
leaderboards(season_id, player_id, pc, rank)
```

---

## 8. Preparación para multijugador

| Función futura | Base ya preparada en el MVP |
|----------------|-----------------------------|
| **PvP asíncrono** (formato principal, estilo El Bruto) | `FighterSnapshot` + combate determinista con semilla. El servidor genera la semilla, ejecuta la simulación y devuelve el resultado; el cliente la reproduce. |
| PvP en directo (espectador) | La misma simulación; el servidor emite la línea de tiempo por Realtime. |
| Amigos y visitas | El estado del hábitat es serializable (decoración + criaturas) → vista de solo lectura del hábitat de otro jugador. |
| Interacciones | Acciones sociales como entradas del `action_log` validadas en el servidor. |
| Intercambios | IDs de criatura globales (UUIDv7) y genoma autocontenido. Transferencia de propiedad atómica en Postgres. |
| Torneos | Brackets de snapshots ejecutados en el servidor por lotes. |
| Clasificaciones | PC calculados en el servidor; el Puzle del Día con semilla común. |
| Eventos | Contenido versionado (`season`, `rulesetVersion`) y *feature flags*. |

**Regla:** todo lo competitivo se calcula en el servidor. El cliente solo propone acciones y reproduce resultados.

---

## 9. Dependencias previstas (a confirmar con versiones actuales al empezar la Fase 3)
`expo`, `expo-router`, `react-native-reanimated`, `react-native-gesture-handler`, `@shopify/react-native-skia`, `expo-sqlite`, `react-native-mmkv`, `zustand`, `zod`, `i18next`, `expo-audio`, `expo-haptics`, `expo-notifications`; desarrollo: `typescript`, `vitest`, `fast-check`, `eslint` (+ reglas de límites de import), `turbo`, `playwright`, `maestro`.

## 10. Riesgos técnicos

| Riesgo | Prob. | Impacto | Mitigación |
|--------|-------|---------|------------|
| Calidad artística del rig propio inferior a Spine/Rive | Media | Alto | Spike en la Fase 2 con 1 criatura completa; si no convence → Rive (D3) |
| Rendimiento de Skia con 3 criaturas + partículas en gama baja | Baja | Medio | Caché de `Picture`, LOD de partículas y prueba en un dispositivo de gama baja en la Fase 3 |
| Producción de 40 formas × 11+ animaciones | Alta | Alto | Rigs compartidos por arquetipo, capas procedurales y clips reutilizables; ilustrador externo (D4) |
| Bugs de cálculo temporal (zonas horarias, DST, cambio de reloj) | Media | Alto | Core con reloj inyectado y property tests de DST y saltos |
| Deriva de balance | Alta | Medio | Simuladores en CI con umbrales |
