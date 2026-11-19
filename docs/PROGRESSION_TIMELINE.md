# PROGRESSION TIMELINE — Primer Tamtam

> Simulado el 2026-11-19 con el reloj simulado de `packages/core/src/sim/lifecycle.ts` (se repite con `PROFILES` + `simulate()`).
> Modelo: Madurez (EVOLUTION_SYSTEM §2.1). `dM/dt = 1 + 0,4·g`, con `g = ½·cuidado + ½·juego` y umbrales acumulados 17 / 67 / 168.

## 1. Resultados (horas desde la eclosión hasta ser elegible para el Ritual)

| Perfil | Visitas/día | Bebé → Infantil | → Juvenil | → Adulto | Satisfacción media | Necesidad mínima | Sesiones de Gym |
|--------|-------------|-----------------|-----------|----------|--------------------|------------------|-----------------|
| Cuidado óptimo + ~45 min de juego | 6 | **15 h** | 52 h (2,2 d) | **125 h (5,2 d)** | 84 | 1 (Energía) | 36 |
| Cuidado medio | 3 | 15 h | 55 h | 133 h (5,5 d) | 62 | 1 (Energía) | 36 |
| Casual, poco juego | 2 | 16 h | 64 h | 159 h (6,6 d) | 38 | 25 | 0 |
| Descuido (1 visita, solo comida) | 1 | 17 h | 66 h | **166 h (6,9 d)** | 28 | 25 | 0 |
| Medio + 3 días de ausencia | 3 (0 en días 2–4) | 15 h | 59 h | 149 h (6,2 d) | 53 | 1 | 26 |

**Cumple D10:** de 5 a 7 días según cuidado y juego (test automático en `game.test.ts`).

### 1.1 Con siestas y Gym barato (N12) y Lustre al llegar a adulto (re-simulado)
| Perfil | → Adulto | Satisfacción media | Energía mínima | Sesiones de Gym | Lustre al ser adulto (sin Arena) |
|--------|----------|--------------------|----------------|-----------------|----------------------------------|
| Óptimo | 125 h | 84 | 5 | 72 | **Vivo (56)** |
| Medio | 133 h | 63 | 15 | 36 | Común (33) |
| Casual | 159 h | 38 | 25 | 0 | Apagado (20) |
| Descuido | 166 h | 28 | 25 | 0 | Apagado (18) |
| Medio + 3 días de ausencia | 149 h | 54 | 10 | 27 | Apagado (29, en el límite) |

En la simulación el Lustre solo cuenta el Gym. Con más actividades (Academy, Garden…) y la Arena, el jugador óptimo llega a Radiante o Legendario.

## 2. Lectura
- **Tiempo mínimo:** 120 h teóricas (g = 1 constante). El perfil óptimo real llega a 125 h porque por la noche la satisfacción baja un poco.
- **Tiempo máximo razonable:** 168 h (g = 0). La única forma de superarlo es el estado Abatido o la Guardería, que congelan la Madurez (Abatido aún **no está implementado** en la simulación; ver GAMEPLAY_TEST_RESULTS).
- **Ausencias:** no castigan (el crecimiento continúa al ritmo mínimo y las necesidades tienen suelo 25). Volver tras 3 días cuesta unas 16 h sobre el perfil medio.
- **Objetos especiales:** no cambian el tiempo; deciden la rama (EVOLUTION_TEST_MATRIX).
- **Experiencia y nivel:** no cambian el tiempo (D10). Topes de nivel por etapa.
- **Genética:** no cambia el tiempo en el diseño actual. Posible rasgo futuro "Precoz" (−5%).

## 3. Hallazgo de balance
- **La Energía llega a ~1** en los perfiles activos (6 visitas con Gym y juego). No es un error (las actividades exigen Energía ≥ coste y el Tamtam se niega con "demasiado cansado"), pero indica que **un jugador muy activo se queda sin actividades por la tarde**. Propuesta para revisar en balance: dormir siesta (+15) disponible cada 3 h, o bajar el coste del Gym a 10. **Pendiente de tu decisión (N12).**

## 4. Objetivos a corto, medio y largo plazo (con el ritmo simulado)
| Plazo | Objetivo | Cuándo llega (perfil medio) |
|-------|----------|-----------------------------|
| Sesión | Cuidar, jugar una sesión de Gym, comprar un mueble barato | Minuto 5–10 |
| Día 1 | Primer mueble comprado con monedas del Gym; Fuerza nv. 1–2 | ~6 sesiones de Gym |
| Día 1 (15 h) | Primera evolución: Fogarín | 15 h |
| Días 2–3 | Juvenil (Brasko); Gym nivel 2 (Fuerza 4 + 2.000 TC) | 55 h · día 4–6 |
| Días 5–7 | Primer adulto; rama según su vida | 125–166 h |
| Semanas 2–4 | Gym nivel 3, segundo Tamtam, cría | — |
| Meses | Colección (40 formas), rangos de Arena, ramas secretas | — |

## 5. Cómo reproducir o explorar
- Tests: `pnpm --filter @tamtam/core test` (incluye el test de 5–7 días).
- En la app: **Developer Debug Mode → Tiempo** (+1 h, +6 h, +12 h, +24 h, +3 días, +7 días) sobre una partida separada.
