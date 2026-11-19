# EVOLUTION TEST MATRIX — Brasálidos

> Ejecutado el 2026-11-19 · `packages/core/src/evolution/evolution.test.ts` · **27 escenarios + 5.000 aleatorios: PASSED**.
> Nivel probado: **motor de evolución** (lógica pura). La integración en partida (acumular ejes con las acciones, Ritual con animación, formas Infantil, Juvenil y Adulto dibujadas) está **NOT IMPLEMENTED**: ver GAMEPLAY_TEST_RESULTS.md.

Base de cada escenario: Brasko, nivel 25, CQ 70, ejes iguales (100), atributos a 0, temperamento SE, afinidad secundaria Fuego, Ritual a las 14:00. Puntuaciones: A = Volcaurio, B = Fenixara, S = Brasaluz (✗ = gates no cumplidos).

| ID | Escenario | Esperado | Obtenido | Puntuaciones | Estado |
|----|-----------|----------|----------|--------------|--------|
| EVO-01a | Bebé, cualquier estado | fogarin | fogarin | fogarin=0.0 | PASSED |
| EVO-01b | Infantil, cualquier estado | brasko | brasko | brasko=0.0 | PASSED |
| EVO-02 | Perfil neutro (ejes iguales, CQ 70, SE) | \|A−B\| < 6 | fenixara (A=46.4, B=48.0) | | PASSED |
| EVO-03 | Mucho Gym y rutina (FUE 300, SER 150) | volcaurio | volcaurio | A=73.6 B=36.0 S=37.2✗ | PASSED |
| EVO-04 | Mucho juego y mimos (AGI 300, VÍN 200) | fenixara | fenixara | A=28.5 B=75.6 S=50.5✗ | PASSED |
| EVO-05a | Poco entrenamiento + cuidados excelentes (CQ 95) | fenixara | fenixara | A=49.4 B=53.0 | PASSED |
| EVO-05b | Poco entrenamiento + cuidados deficientes (CQ 20) | volcaurio | volcaurio | A=40.4 B=38.0 | PASSED |
| EVO-06 | Fuerza nivel 20, resto neutro | volcaurio | volcaurio | A=57.6 B=50.0 | PASSED |
| EVO-07 | Creatividad nivel 20, resto neutro | fenixara | fenixara | A=46.4 B=58.0 | PASSED |
| EVO-08 | Inteligencia nivel 20, resto neutro | igual que neutro | fenixara | A=46.4 B=48.0 | PASSED |
| EVO-09a | Temperamento SS | volcaurio | volcaurio | A=58.4 B=48.0 | PASSED |
| EVO-09b | Temperamento EE | fenixara | fenixara | A=46.4 B=60.0 | PASSED |
| EVO-10a | Afinidad Tierra + SS + CQ 90 | volcaurio | volcaurio | A=64.8 B=52.0 | PASSED |
| EVO-10b | Potencial alto en stats de B (CQ 60) | fenixara | fenixara | A=45.2 B=52.0 | PASSED |
| EVO-11a | Tendencia a A + Pluma Cenicienta | fenixara | fenixara | A=64.4 B=66.4 | PASSED |
| EVO-11b | Tendencia moderada a B (< 25) + Piedra Magma | volcaurio | volcaurio | A=65.6 B=61.8 | PASSED |
| EVO-11c | Tendencia **fuerte** a B (> 25) + Piedra Magma | fenixara | fenixara | A=55.7 B=72.7 | PASSED |
| EVO-12a | Brasaluz: Luz + Piedra Solar + CRE 12 + INT 8 + CQ 80 + amanecer | brasaluz | brasaluz | A=47.6 B=60.0 S=55.0 (override) | PASSED |
| EVO-12b | Igual, Ritual a las 14:00 | fenixara | fenixara | S✗ | PASSED |
| EVO-12c | Igual, sin Piedra Solar | fenixara | fenixara | S✗ | PASSED |
| EVO-12d | Igual, CRE 11 | fenixara | fenixara | S✗ | PASSED |
| EVO-13 | Nivel 1 frente a 50 | mismo resultado | fenixara | | PASSED |
| EVO-14 | Barrido de ejes sin objetos | A y B alcanzables | A y B alcanzables | | PASSED |
| EVO-15 | Abatido / ya adulto | Bloqueado | Bloqueado | | PASSED |
| EVO-16a | FUE muy alto, CQ 30, Pluma, EE | volcaurio | volcaurio | A=72.1 B=67.1 | PASSED |
| EVO-16b | FUE moderado, CQ 60, Pluma, EE | fenixara | fenixara | A=54.8 B=83.7 | PASSED |
| EVO-17 | 5.000 contextos aleatorios | adulto válido y reproducible | OK | | PASSED |

## Comprobaciones del brief
| Requisito | Resultado |
|-----------|-----------|
| Cada evolución requiere condiciones válidas | ✅ Gates evaluados; la rama secreta exige las 6 condiciones (EVO-12) |
| No existen rutas imposibles | ✅ A y B alcanzables sin objetos (EVO-14). S es alcanzable con sus gates (EVO-12a) |
| No hay evoluciones bloqueadas por accidente | ✅ Siempre hay rama por defecto. Solo bloquea Abatido (por diseño) |
| No se puede evolucionar dos veces | ✅ Motor: no hay reglas desde un adulto (EVO-15). Partida: `debugForceEvolution` rechaza `already_in_form` (test) |
| Los atributos se conservan / el nombre permanece | ✅ Test `birth and naming` (game.test.ts): nombre y atributos intactos tras evolucionar y guardar/cargar |
| Transición visual | ⛔ NOT IMPLEMENTED (falta la secuencia de evolución y el arte de Fogarín) |
| Datos guardados | ✅ (snapshot + historial de evolución) |

## Hallazgos de diseño
1. **Un catalizador (+25) inclina, no impone:** con una tendencia fuerte (> 25 puntos) el objeto no cambia el resultado (EVO-11c, EVO-16a). Encaja con EVOLUTION_SYSTEM §4 ("inclina la balanza"). Si quieres que los objetos sean decisivos, habría que subirlo a +40. **Decisión pendiente (N11).**
2. **La Inteligencia no influye en las ramas A y B de Fuego** (solo en la secreta). Es intencionado (ACTIVITIES_SYSTEM §5), pero conviene saberlo.
3. Con un perfil neutro gana B por 1,6 puntos (cuidado medio-alto). La diferencia está dentro del objetivo (< 6).
