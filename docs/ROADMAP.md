# ROADMAP — Tam Tam Evo

> Versión 0.3 · Actualizado: 2026-11-19 (brief v3.0)
> Cada fase termina con un **producto funcional y verificable** y una revisión tuya antes de pasar a la siguiente.
> Estimaciones en semanas de trabajo efectivo para el equipo actual (tú + Claude Code). Incluyen un margen del 25%. No incluyen tiempos de espera de revisión ni de tiendas.

---

## Resumen (v0.3: combinado con el brief v3.0, **pendiente de N8**)

| Fase | Nombre | Estimación | Acumulado | Estado |
|------|--------|-----------|-----------|--------|
| 1 | Documentación (GDD + brief v3.0) | 1,5 sem | 1,5 | 🟡 v3.0 entregada, pendiente de N1–N10 |
| 2 | Identidad visual (Tamtams, casa, muebles, interfaz) + spike de animación | 4 sem | 5,5 | 🔵 Spike terminado |
| 3 | Núcleo y personalización: persistencia SQLite, identidad y nombres, eclosión con nombre, ficha, cuidados y tiempo real | 4 sem | 9,5 | 🔵 Lógica de identidad y nombres implementada (sin UI) |
| 4 | Economía: monedero, libro mayor, inventario y tienda | 3 sem | 12,5 | 🔵 Lógica implementada y probada (sin UI ni SQLite) |
| 5 | Casa: render de la habitación, editor táctil, muebles, comportamiento de los Tamtams con el mobiliario | 4 sem | 16,5 | 🔵 Reglas de colocación implementadas (sin UI) |
| 6 | Actividades: Gym y Academy → Garden, Music y Workshop | 7 sem | 23,5 | 🔵 Curva de atributos y mejoras implementada (sin UI) |
| 7 | Evolución completa, 8 familias, genética y cría | 7 sem | 30,5 | ⚪ |
| 8 | Minijuegos (4) | 6 sem | 36,5 | ⚪ |
| 9 | Arena | 5 sem | 41,5 | ⚪ |
| 10 | Integración y balance (atributos ↔ evolución ↔ Arena ↔ economía) | 2 sem | 43,5 | ⚪ |
| 11 | Polish (arte final, sonido, VFX, rendimiento y QA) | 6 sem | 49,5 | ⚪ |
| 12 | Publicación | 3 sem + tiendas | ~52 | ⚪ |

**Total realista hasta la 1.0: unos 12 meses** (antes eran 8: el brief v3.0 añade casa, economía completa y 5 actividades). El cuello de botella sigue siendo el **arte y la animación**: 40 formas, más de 19 animaciones por arquetipo, unos 120 muebles y props. Con un ilustrador en paralelo desde la Fase 5, el total baja a unos 10 meses.

> Regla: no se avanza de fase sin comprobar que la anterior funciona. "🔵 lógica implementada" significa que el módulo de reglas está terminado y probado, pero la fase **no** se da por terminada hasta tener interfaz, persistencia y verificación visual.

---

## Fase 1 — Game Design Document ✅ (entregada)
**Entregables:** GDD, Arquitectura Técnica, Dirección de Arte, Base de Datos de Criaturas, Sistema de Evolución, Sistemas de Juego, Roadmap y Changelog.
**Criterio de salida:** tu aprobación de las decisiones D1–D10 (GDD §13). ✅ Aprobadas el 2026-11-19.

## Fase 2 — Identidad visual y spike técnico de animación
**Entregables:** ver ART_DIRECTION §10. Además:
- **Spike técnico (riesgo nº 1):** runtime TamRig mínimo en Expo + Skia con Chispín animado (idle, walk, eat, pet, sleep) a 60 fps en un Android de gama media.
- Lámina de siluetas de las 40 formas.

**Criterios de aceptación:**
- [x] Chispín se percibe vivo (respiración, parpadeo, física secundaria) y no como una imagen estática. *(spike, 2026-11-19; ver `docs/media/chispin-spike.mp4`)*
- [ ] 60 fps con 3 criaturas + partículas en un dispositivo de gama media. *(pendiente de medir en un dispositivo real: el entorno de desarrollo en la nube no tiene GPU)*
- [ ] Las 40 siluetas superan el test de identificación a 64 px.
- [ ] Tu aprobación del estilo. Si no convence → plan B con Rive (D3).

## Fase 3 — Núcleo y personalización (antes: Prototipo funcional)
**Alcance:** monorepo, navegación de 5 pestañas (las pantallas no implementadas se ocultan; no hay botones falsos), Hogar con hábitat de Fuego, eclosión de la primera mascota, las 9 acciones de cuidado con reacción animada, simulación temporal por timestamps, Abatido/Malestar/Guardería, persistencia en SQLite con migraciones, notificaciones locales e i18n ES/EN.

**Criterios de aceptación:**
- [ ] Cerrar la app 3 h → al volver, las necesidades coinciden con el cálculo de referencia (test).
- [ ] Matar la app durante una acción → no hay pérdida de datos.
- [ ] Tests de `core/care` y `core/time` ≥ 95% de cobertura, incluidos DST y cambios de reloj.
- [ ] Capturas automáticas en 4 resoluciones sin solapes.
- [ ] Build instalable (EAS preview) en Android e iOS.

## Fase 4 — Economía
**Alcance:** monedero de Tamcoins y Astrolitos sobre un libro mayor atómico e idempotente, inventario, catálogo, tienda con categorías, previsualización "Probar en mi casa", historial de transacciones y recompensas con Entusiasmo.
**Criterios de aceptación:**
- [x] Lógica: saldo, libro mayor auditable, idempotencia, saldo nunca negativo, atomicidad de compras, inventario y requisitos (tests en `packages/core`).
- [ ] Persistencia SQLite con transacciones reales y test de "cerrar la app a mitad de compra".
- [ ] Tienda jugable con 7 categorías, artículos ilustrados y previsualización.

## Fase 5 — Casa
**Alcance:** HOME_SYSTEM completo: render por capas, acabados, editor táctil (seleccionar, arrastrar, reflejar, color, retirar, guardar o descartar), comportamiento de los Tamtams con los muebles y actividades compartidas.
**Criterios de aceptación:**
- [x] Lógica de colocación: límites, solapes por capa, alfombras bajo muebles, copias limitadas por inventario y serialización.
- [ ] Accesibilidad de los puntos de interacción y comprobación por inundación.
- [ ] Editor jugable a 60 fps; capturas en 4 resoluciones.

## Fase 6 — Actividades
**Alcance:** ACTIVITIES_SYSTEM: primero **Gym y Academy**, después **Garden, Music y Workshop**. Interacciones jugables, 3 niveles de mejora, atributos, recetas y fabricación.
**Criterios de aceptación:**
- [x] Curva de XP de atributos y validación de mejoras (lógica).
- [ ] Cada actividad: escena propia, interacción, coste de Energía, recompensa con idempotencia, progresión guardada.
- [ ] Simulación económica: ningún perfil de juego supera 2.000 TC/día por Tamtam.

## Fase 7 — Evolución y genética (antes Fase 4)
**Alcance:** motor de evolución (gates, puntuación, overrides y desempate), ejes, CQ, Pronóstico, Ritual con animación, Códice con pistas, **8 familias × 5 formas con rig y animaciones básicas**, genoma, Previsión de nidada, cría, huevos (rareza, incubación, eclosión), mutaciones con medidor de Inestabilidad, Santuario, Nidos Errantes, Lazo e interacciones entre criaturas.

**Criterios de aceptación:**
- [ ] Todos los tests de EVOLUTION_SYSTEM §10 en verde.
- [ ] Las 16 ramas adultas son alcanzables en simulación sin objetos.
- [ ] Es posible llegar de huevo a adulto en una partida real acelerada (modo debug ×100).

## Fase 8 — Minijuegos (antes Fase 5)
**Alcance:** `maze` (30 niveles + infinito), `bricks` (40 niveles + infinito), `grid` (5 dificultades, generador con solución única, Puzle del Día) y `trail` (IA de 4 personalidades). Recompensas, Entusiasmo, fragmentos, récords y habilidades de familia.

**Criterios de aceptación:**
- [ ] 60 fps en los 4 juegos en gama media.
- [ ] `grid`: 10.000 puzles generados con solución única verificada.
- [ ] `bricks`: sin *tunneling* a velocidad máxima (test de física).
- [ ] Cada juego tiene música, SFX, tutorial y pantalla de resultados.
- [ ] Ningún texto visible nombra los minijuegos; los 4 iconos superan el test de identificación (D9).

## Fase 9 — Arena (antes Fase 6)
**Alcance:** simulación determinista, IA de utilidad, estrategias y gambits, habilidades y estados, equipo y crafteo, generador de rivales, escalera de 100 Cuidadores IA, rangos y PC, medallas, historial y repeticiones, simulador de balance en CI.

**Criterios de aceptación:**
- [ ] Mismo snapshot + semilla → combate idéntico (10.000 casos).
- [ ] Objetivos de balance de GAMEPLAY_SYSTEMS §5.9 cumplidos.
- [ ] El combate es legible a 1× (encuesta interna: se entiende quién gana y por qué).

## Fase 10 — Integración y balance
Atributos en la fórmula de evolución (término por rama), atributos y preparación en la Arena (objetivo ≤ 75% de victorias con preparación máxima, ACTIVITIES_SYSTEM §6) y simulación económica de 30 días.

## Fase 11 — Polish (antes Fase 7)
Arte final (ilustrador si se aprueba D4), animaciones avanzadas completas, 7 hábitats restantes, música y SFX finales, háptica, accesibilidad (daltonismo, reducción de movimiento, tamaños de texto), optimización (memoria y arranque), Sentry, pruebas en más de 8 dispositivos reales y balance de economía con una beta interna.

## Fase 12 — Publicación (antes Fase 8)
Cuentas de desarrollador, fichas de tienda (capturas, vídeo, textos ES/EN), clasificación de edad, política de privacidad, beta cerrada (TestFlight / Play Internal Testing) de 2 semanas, corrección de errores y lanzamiento.

## Post-lanzamiento (temporadas)
1. **T1:** backend Supabase, cuentas, copia en la nube y **PvP asíncrono**.
2. **T2:** amigos, visitas al hábitat, clasificaciones online y Puzle del Día global.
3. **T3:** ramas secretas (8) y primeros híbridos.
4. **T4:** intercambios, torneos y eventos en vivo.

---

## Registro de funcionalidades

| Área | Funcionalidad | Estado |
|------|---------------|--------|
| Diseño | GDD y documentos de sistemas | ✅ Terminado y aprobado |
| Arte | Identidad visual | ⚪ Pendiente |
| Técnico | Monorepo | ✅ Terminado (CI pendiente) |
| Técnico | Runtime TamRig | 🔵 Spike funcional (5 clips, partículas, tintado genético) |
| Juego | Cuidados y tiempo real | ⚪ Pendiente |
| Juego | Evolución | ⚪ Pendiente |
| Juego | Genética y cría | ⚪ Pendiente |
| Juego | Minijuego `maze` | ⚪ Pendiente |
| Juego | Minijuego `bricks` | ⚪ Pendiente |
| Juego | Minijuego `grid` | ⚪ Pendiente |
| Juego | Minijuego `trail` | ⚪ Pendiente |
| Juego | Arena | ⚪ Pendiente |
| Juego | Economía: monedero, libro mayor, inventario y tienda | 🔵 Lógica implementada y probada; falta UI y SQLite |
| Juego | Identidad y nombres de Tamtam | 🔵 Lógica implementada y probada; falta UI |
| Juego | Casa: colocación de muebles | 🔵 Reglas implementadas y probadas; falta render y editor |
| Juego | Actividades (Gym, Academy, Garden, Music, Workshop) | 🔵 Curva de atributos y mejoras implementadas; actividades pendientes |
| Meta | Códice, logros y objetivos | ⚪ Pendiente |

Leyenda: ✅ terminado · 🟡 en revisión · 🔵 en curso · ⚪ pendiente · ⛔ bloqueado
