# ROADMAP — Tam Tam Evo

> Versión 0.1 · Actualizado: 2026-11-19
> Cada fase termina con un **producto funcional y verificable** y una revisión tuya antes de pasar a la siguiente.
> Estimaciones en semanas de trabajo efectivo para el equipo actual (tú + Claude Code). Incluyen un margen del 25%. No incluyen tiempos de espera de revisión ni de tiendas.

---

## Resumen

| Fase | Nombre | Estimación | Acumulado | Estado |
|------|--------|-----------|-----------|--------|
| 1 | Game Design Document | 1 sem | 1 | 🟡 Entregada, pendiente de revisión |
| 2 | Identidad visual + spike de animación | 3 sem | 4 | ⚪ Pendiente |
| 3 | Prototipo funcional (Hogar, primera mascota, cuidados, persistencia) | 4 sem | 8 | ⚪ |
| 4 | Evolución, 8 familias, genética y reproducción | 7 sem | 15 | ⚪ |
| 5 | Cuatro minijuegos | 6 sem | 21 | ⚪ |
| 6 | Arena | 5 sem | 26 | ⚪ |
| 7 | Polish (arte final, sonido, VFX, rendimiento y QA) | 6 sem | 32 | ⚪ |
| 8 | Publicación (beta cerrada → tiendas) | 3 sem + revisión de tiendas | ~35 | ⚪ |

**Total realista hasta la 1.0: unos 8 meses.** El cuello de botella es la **producción de arte y animación** (40 formas). Si se incorpora un ilustrador en paralelo desde la Fase 4, la Fase 7 baja a unas 3 semanas.

---

## Fase 1 — Game Design Document ✅ (entregada)
**Entregables:** GDD, Arquitectura Técnica, Dirección de Arte, Base de Datos de Criaturas, Sistema de Evolución, Sistemas de Juego, Roadmap y Changelog.
**Criterio de salida:** tu aprobación de las decisiones D1–D10 (GDD §13).

## Fase 2 — Identidad visual y spike técnico de animación
**Entregables:** ver ART_DIRECTION §10. Además:
- **Spike técnico (riesgo nº 1):** runtime TamRig mínimo en Expo + Skia con Chispín animado (idle, walk, eat, pet, sleep) a 60 fps en un Android de gama media.
- Lámina de siluetas de las 40 formas.

**Criterios de aceptación:**
- [ ] Chispín se percibe vivo (respiración, parpadeo, física secundaria) y no como una imagen estática.
- [ ] 60 fps con 3 criaturas + partículas en un dispositivo de gama media.
- [ ] Las 40 siluetas superan el test de identificación a 64 px.
- [ ] Tu aprobación del estilo. Si no convence → plan B con Rive (D3).

## Fase 3 — Prototipo funcional
**Alcance:** monorepo, navegación de 5 pestañas (las pantallas no implementadas se ocultan; no hay botones falsos), Hogar con hábitat de Fuego, eclosión de la primera mascota, las 9 acciones de cuidado con reacción animada, simulación temporal por timestamps, Abatido/Malestar/Guardería, persistencia en SQLite con migraciones, notificaciones locales e i18n ES/EN.

**Criterios de aceptación:**
- [ ] Cerrar la app 3 h → al volver, las necesidades coinciden con el cálculo de referencia (test).
- [ ] Matar la app durante una acción → no hay pérdida de datos.
- [ ] Tests de `core/care` y `core/time` ≥ 95% de cobertura, incluidos DST y cambios de reloj.
- [ ] Capturas automáticas en 4 resoluciones sin solapes.
- [ ] Build instalable (EAS preview) en Android e iOS.

## Fase 4 — Evolución y genética
**Alcance:** motor de evolución (gates, puntuación, overrides y desempate), ejes, CQ, Pronóstico, Ritual con animación, Códice con pistas, **8 familias × 5 formas con rig y animaciones básicas**, genoma, Previsión de nidada, cría, huevos (rareza, incubación, eclosión), mutaciones con medidor de Inestabilidad, Santuario, Nidos Errantes, Lazo e interacciones entre criaturas.

**Criterios de aceptación:**
- [ ] Todos los tests de EVOLUTION_SYSTEM §10 en verde.
- [ ] Las 16 ramas adultas son alcanzables en simulación sin objetos.
- [ ] Es posible llegar de huevo a adulto en una partida real acelerada (modo debug ×100).

## Fase 5 — Minijuegos
**Alcance:** Laberinto Glotón (30 niveles + infinito), Rompebloques (40 niveles + infinito), Meowdoku (5 dificultades, generador con solución única, Puzle del Día) y Serpentina (IA de 4 personalidades). Recompensas, Entusiasmo, fragmentos, récords y habilidades de familia.

**Criterios de aceptación:**
- [ ] 60 fps en los 4 juegos en gama media.
- [ ] Meowdoku: 10.000 puzles generados con solución única verificada.
- [ ] Rompebloques: sin *tunneling* a velocidad máxima (test de física).
- [ ] Cada juego tiene música, SFX, tutorial y pantalla de resultados.

## Fase 6 — Arena
**Alcance:** simulación determinista, IA de utilidad, estrategias y gambits, habilidades y estados, equipo y crafteo, generador de rivales, escalera de 100 Cuidadores IA, rangos y PC, medallas, historial y repeticiones, simulador de balance en CI.

**Criterios de aceptación:**
- [ ] Mismo snapshot + semilla → combate idéntico (10.000 casos).
- [ ] Objetivos de balance de GAMEPLAY_SYSTEMS §5.9 cumplidos.
- [ ] El combate es legible a 1× (encuesta interna: se entiende quién gana y por qué).

## Fase 7 — Polish
Arte final (ilustrador si se aprueba D4), animaciones avanzadas completas, 7 hábitats restantes, música y SFX finales, háptica, accesibilidad (daltonismo, reducción de movimiento, tamaños de texto), optimización (memoria y arranque), Sentry, pruebas en más de 8 dispositivos reales y balance de economía con una beta interna.

## Fase 8 — Publicación
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
| Diseño | GDD y documentos de sistemas | ✅ Terminado (pendiente de revisión) |
| Arte | Identidad visual | ⚪ Pendiente |
| Técnico | Monorepo y CI | ⚪ Pendiente |
| Técnico | Runtime TamRig | ⚪ Pendiente |
| Juego | Cuidados y tiempo real | ⚪ Pendiente |
| Juego | Evolución | ⚪ Pendiente |
| Juego | Genética y cría | ⚪ Pendiente |
| Juego | Laberinto Glotón | ⚪ Pendiente |
| Juego | Rompebloques | ⚪ Pendiente |
| Juego | Meowdoku | ⚪ Pendiente |
| Juego | Serpentina | ⚪ Pendiente |
| Juego | Arena | ⚪ Pendiente |
| Juego | Economía y tienda | ⚪ Pendiente |
| Meta | Códice, logros y objetivos | ⚪ Pendiente |

Leyenda: ✅ terminado · 🟡 en revisión · 🔵 en curso · ⚪ pendiente · ⛔ bloqueado
