# EVOLUTION SYSTEM — Tam Tam Evo

> Versión 0.2 · Fase 1 · Estado: **aprobado** (decisiones D1–D10, 2026-11-19)
> Alcance: evolución multifactorial, descubrimiento (Códice), genética, reproducción y huevos.
> Principio rector: **determinista, configurable, legible.** Las mismas entradas producen siempre la misma evolución. El azar solo existe en la herencia genética, siempre con una semilla registrada y con probabilidades visibles para el jugador.

---

## 1. Visión general

```
                     ┌───────────────────────────────┐
  CUIDADOS ─────────►│                               │
  PROGRESIÓN ───────►│  Motor de Evolución (puro TS) │──► Forma resultante
  GENÉTICA ─────────►│  1) Gates (requisitos duros)  │      + Informe explicativo
  OBJETOS ──────────►│  2) Puntuación por rama       │
  DECISIONES ───────►│  3) Desempate determinista    │
                     └───────────────────────────────┘
```

- El motor vive en `packages/core/evolution` y no depende de la UI ni de React Native.
- Entrada: `EvolutionContext` (snapshot inmutable de la criatura). Salida: `EvolutionResult { formId, scores[], gatesReport[], reason }`.
- El mismo motor alimenta el **Pronóstico Evolutivo** (UI), las pruebas automatizadas y, en el futuro, la validación en servidor.

---

## 2. Etapas y transiciones

### 2.1 Madurez — ritmo de crecimiento (D10)
De Bebé a Adulto se tarda **entre 5 y 7 días reales, según el cuidado y las horas de juego**. El reloj del crecimiento es la **Madurez (M)**, que se acumula de forma continua (también con la app cerrada, calculada por tramos como las necesidades):

```
dM/dt = 1 + 0.4 · g(t)            // puntos de Madurez por hora real; rango [1.0, 1.4]
g(t)  = 0.5 · C(t) + 0.5 · J(t)   // factor de crecimiento, 0–1
C(t)  = clamp( (satisfacción(t) − 40) / 50, 0, 1 )        // cuidado: 1 con satisfacción ≥ 90
J(t)  = clamp( minutos de juego activo en las últimas 24 h / 45, 0, 1 )   // juego: 1 con ≥ 45 min/día
```
- **Juego activo** = minutos con interacción real con esa criatura: cuidados, minijuegos, entrenamiento y Arena. Tener la app abierta sin tocar nada no cuenta (sin input en 30 s → no suma).
- Durante el sueño programado, `C` usa la satisfacción normal y `J` conserva su último valor (dormir no frena el crecimiento).

| Transición | Madurez necesaria | Ritmo máximo (g = 1) | Ritmo mínimo (g = 0) | Tipo |
|------------|-------------------|----------------------|----------------------|------|
| Bebé → Infantil | 17 | ~12 h | 17 h | Lineal |
| Infantil → Juvenil | 50 (acum. 67) | ~36 h | 50 h | Lineal |
| Juvenil → Adulto | 101 (acum. 168) | ~72 h | 101 h | **Ramificada** |
| **Total** | **168** | **120 h = 5 días** | **168 h = 7 días** | |

**Garantías:**
- Con cuidado y juego excelentes: 5 días. Con lo mínimo: 7 días como máximo.
- **Única excepción:** los estados **Abatido** (abandono grave, GAMEPLAY_SYSTEMS §2.4) y **Guardería** (pausa voluntaria) congelan la Madurez. En ambos casos es una pausa, nunca una pérdida.
- El nivel y el CQ **no bloquean** las transiciones: influyen en la velocidad (vía `g`) y en la rama, pero nunca impiden crecer. Cada etapa tiene un tope de nivel (Bebé 10, Infantil 20, Juvenil 35, Adulto 50). La XP sobrante se guarda y se aplica tras el Ritual (hasta un máximo equivalente a una etapa).
- La ficha de la criatura muestra una barra de Madurez con el **tiempo estimado al ritmo actual** ("Lista para el Ritual en ~14 h"), para que el jugador vea cómo sus cuidados aceleran el crecimiento.

**Ritual de Evolución (D8).** Cuando una criatura alcanza la Madurez necesaria, su icono brilla y aparece el botón **"Iniciar Ritual"**. El jugador elige el momento. Con esto se consigue:
1. Que la evolución sea un momento de celebración y no algo que ocurre mientras la app está cerrada.
2. Que el jugador pueda, sabiéndolo, seguir influyendo en la rama antes de evolucionar.
3. Evitar sorpresas negativas: el Pronóstico muestra la tendencia antes del Ritual.

El tiempo que pasa entre ser elegible y hacer el Ritual no cuenta en los 5–7 días, porque lo decide el jugador. Si la criatura lleva 48 h elegible sin Ritual, se muestra un recordatorio. Nunca evoluciona automáticamente.

La evolución es **irreversible**. La Reliquia "Eco del Primer Latido" (temporadas) permitirá en el futuro un *reinicio de rama* único por criatura.

---

## 3. Las cinco familias de variables

### A. Cuidados → **CQ (Calidad de Cuidado)**, de 0 a 100
Para cada etapa:
```
satisfacción(t) = media(Hambre, Higiene, Felicidad, Cariño, Descanso, Actividad)   // 0–100
avgSat          = ∫ satisfacción(t)·peso(t) dt / ∫ peso(t) dt
peso(t)         = 1.0 con la app abierta o en las primeras 8 h de ausencia
                  0.5 a partir de 8 h de ausencia continua (amortiguación)
                  0.0 durante el sueño programado (dormir no penaliza)
atención        = llamadas atendidas en < 30 min / llamadas totales   // 0–1
CQ              = round( 0.85·avgSat + 15·atención )
```
Las llamadas son peticiones explícitas de la criatura (burbuja de pensamiento). Hay como máximo 6 al día y nunca durante la noche configurada.
La integral se calcula **analíticamente por tramos** (ver GAMEPLAY_SYSTEMS §2.3); no hace falta simular cada segundo.

### B. Progresión
- **XP / Nivel** (1–50): de cuidados, minijuegos, entrenamiento y Arena.
- **Entrenamiento**: niveles de Fuerza, Carrera, Defensa y Meditación (1–10). Otorgan bonus de stat y puntos de eje.
- **Habilidades aprendidas**: algunas reglas de rama comprueban habilidades concretas (gates de ramas secretas).

### C. Genética
- **Locus Temperamento (T)**, con alelos `S` (estructural) y `E` (expresivo). `SS` = +12 a la rama A, `EE` = +12 a la rama B, `SE` = 0.
- **Potencial**: si la suma de potencial en las 2 stats clave de una rama es ≥ 24 (de 30), esa rama recibe +6.
- **Afinidad secundaria**: habilita ramas híbridas (temporadas) y da +4 a la rama cuyo `affinityTag` coincide.

### D. Objetos
| Categoría | Ejemplos | Efecto en la evolución | Uso |
|-----------|----------|------------------------|-----|
| **Catalizadores** | Piedra Magma, Perla Lunar… (1 por rama, 16 en total) | +25 a la puntuación de su rama | 1 hueco de catalizador por criatura y etapa; se consume en el Ritual |
| **Tónicos de eje** | Tónico de Fuerza, de Ingenio… | +40 puntos al eje indicado (máx. 2 por etapa) | Consumible |
| **Piedras evolutivas** | Piedra Solar, Piedra Abismal… | **Gate obligatorio** para ramas secretas | Se consume en el Ritual |
| **Reliquias** | Brújula del Cuidador, Eco del Primer Latido… | Permanentes de cuenta: desbloquean pistas, condiciones ocultas o reinicios | Pasivas |
| **Objetos de afinidad** | Amuleto de Brasa, Amuleto de Marea… | +10 a la rama cuyo `affinityTag` coincide; en incubación fijan la afinidad secundaria | Equipable / incubación |
| **Elementos especiales** | Materiales de temporada | Gate de formas de temporada | Evento |

### E. Decisiones → **Ejes de comportamiento**
Cinco ejes acumulan puntos según lo que el jugador hace con **esa** criatura:

| Acción | FUE | AGI | ING | VÍN | SER |
|--------|-----|-----|-----|-----|-----|
| Caricia (máx. 20 al día) | | | | +2 | |
| Alimentar a mano | | | | +1 | |
| Jugar (pelota, juguete) | | +1 | | +1 | |
| Bañar | | | | | +1 |
| Recoger excremento en < 30 min | | | | | +2 |
| Dormir dentro de su horario (al día) | | | | | +3 |
| Atender una llamada | | | | +2 | +1 |
| Entrenamiento Fuerza | +5 | | | | |
| Entrenamiento Carrera | | +5 | | | |
| Entrenamiento Defensa | +2 | | | | +3 |
| Meditación | | | +1 | | +4 |
| Minijuego `maze` (por partida, × rendimiento 0.5–1.5) | | +2 | +3 | | |
| Minijuego `bricks` | | +4 | +1 | | |
| Minijuego `grid` | | | +5 | | |
| Minijuego `trail` | +2 | +3 | | | |
| Combate de Arena (+2 FUE si gana) | +3 | +1 | +1 | | |
| Decorar el hábitat (al día) | | | | +1 | +1 |

Las ganancias de minijuegos y entrenamiento están sujetas al **Entusiasmo** (rendimiento decreciente tras N partidas diarias, GAMEPLAY_SYSTEMS §4.6), para que ninguna rama se consiga simplemente repitiendo una actividad durante horas.

**Ventana de acumulación** para la decisión Juvenil → Adulto:
`A_i = 0.5 × puntos_i(etapa Infantil) + 1.0 × puntos_i(etapa Juvenil) + tónicos_i`
Proporciones: `p_i = A_i / Σ A` (si `Σ A = 0` → `p_i = 0.2`).

---

## 4. Fórmula de evolución

Para cada rama candidata `c` de la transición actual:

### Paso 1 — Gates (requisitos duros)
Los gates solo deciden **qué rama** se elige; nunca impiden la evolución en sí (siempre hay una rama `default` elegible).
Una rama es **elegible** si cumple **todos** sus gates:
`minLevel`, `minCQ`, `maxCQ`, `requiredItem`, `requiredSkill`, `requiredGene`, `requiredFlag` (p. ej. "10 victorias en Arena"), `requiredAffinity`, `timeWindow` (hora local del Ritual, p. ej. "noche"; se evalúa en el momento del Ritual).

### Paso 2 — Puntuación
```
S(c) =  100 · Σ_i ( w[c,i] · p_i )                 // Decisiones (ejes)
      + careW[c] · 20 · (CQ − 50) / 50              // Cuidados   (±20·careW)
      + gen(c)                                      // Genética   (T: ±12, Potencial: +6, Afinidad: +4)
      + item(c)                                     // Objetos    (catalizador +25, afinidad +10)
      + 10 · Σ_j u[c,j] · (atributo_j / 20)         // Atributos de desarrollo (v3.0, ≤ 10; ACTIVITIES_SYSTEM §5)
      + bias[c]                                     // Ajuste de diseño (normalmente 0)
```
- `w[c,i]` ∈ [0, 1] son los pesos de eje de la rama (tabla §5).
- `careW[c]` ∈ [−1, 1]: las ramas "nobles" premian el buen cuidado (careW > 0) y alguna rama oscura premia el descuido leve (careW < 0).

### Paso 3 — Overrides
Algunas reglas tienen `forceIf` (condición que fuerza la rama si es elegible), evaluadas por `priority`. Ejemplo: Umbralobo si `p_VÍN < 0.08 y CQ < 45`. Los overrides son siempre descubribles en el Códice.

### Paso 4 — Desempate determinista
1. Mayor `S(c)`. Si `|S(a) − S(b)| < 0.5` se considera empate.
2. Empate → rama favorecida por el Temperamento (`S…` → A, `E…` → B).
3. Si persiste (`SE`) → `hash32(creature.id + rule.id) mod 2`. Es estable: la misma criatura siempre desempata igual.

### Paso 5 — Fallback
Cada transición tiene una rama `default` (sin gates más allá de los mínimos de la etapa). Las ramas secretas nunca son `default`.

### 4.1 Ejemplo resuelto — Brasko (Fuego, Juvenil)
Datos: A = {FUE 180, AGI 60, ING 40, VÍN 70, SER 150} → Σ = 500 → p = {0.36, 0.12, 0.08, 0.14, 0.30}. CQ = 78. Temperamento `SE`. Catalizador: *Pluma Cenicienta* (Fenixara).

| | Volcaurio (A) | Fenixara (B) |
|---|---|---|
| Pesos w (FUE, AGI, ING, VÍN, SER) | 1.0, 0.1, 0.2, 0.3, 0.6 | 0.3, 1.0, 0.2, 0.6, 0.1 |
| Ejes: 100·Σ w·p | 100·(0.36+0.012+0.016+0.042+0.18) = **61.0** | 100·(0.108+0.12+0.016+0.084+0.03) = **35.8** |
| Cuidados (careW 0.3 / 0.5) | 0.3·20·0.56 = **3.4** | 0.5·20·0.56 = **5.6** |
| Genética (SE) | 0 | 0 |
| Objeto | 0 | **+25** |
| **Total** | **64.4** | **66.4** |

Resultado: **Fenixara**. El catalizador ha decidido una tendencia que favorecía a Volcaurio. El jugador ha influido a sabiendas y el resultado es reproducible.

---

## 5. Tabla de reglas de rama (lanzamiento)

Pesos de eje (FUE, AGI, ING, VÍN, SER) · careW · catalizador · affinityTag.
**Invariante:** la suma de pesos de toda rama es **2.2**. La identidad de cada rama está en *cómo* se reparten los pesos, no en cuánto suman, y así ninguna rama gana por defecto.

| Familia | Rama | w | careW | Catalizador | Tag |
|---------|------|---|-------|-------------|-----|
| Fuego | Volcaurio (A) | 1.0, 0.1, 0.2, 0.3, 0.6 | 0.3 | Piedra Magma | earth |
| Fuego | Fenixara (B) | 0.3, 1.0, 0.2, 0.6, 0.1 | 0.5 | Pluma Cenicienta | light |
| Agua | Mareón (A) | 0.6, 0.1, 0.2, 0.3, 1.0 | 0.4 | Concha Abisal | earth |
| Agua | Velamar (B) | 0.1, 0.3, 1.0, 0.6, 0.2 | 0.5 | Perla Lunar | cosmos |
| Naturaleza | Robledón (A) | 0.3, 0.1, 0.2, 0.6, 1.0 | 0.6 | Bellota Ancestral | earth |
| Naturaleza | Floriska (B) | 0.6, 1.0, 0.3, 0.1, 0.2 | 0.1 | Néctar Afilado | light |
| Electricidad | Truenarca (A) | 0.2, 1.0, 0.6, 0.3, 0.1 | 0.3 | Núcleo Nimbo | water |
| Electricidad | Ampérix (B) | 1.0, 0.2, 0.6, 0.1, 0.3 | 0.2 | Bobina de Cobre Viejo | earth |
| Oscuridad | Eclipsor (A) | 0.1, 0.2, 1.0, 0.3, 0.6 | 0.4 | Escama de Eclipse | cosmos |
| Oscuridad | Umbralobo (B) | 1.0, 0.6, 0.2, 0.2, 0.2 | **−0.3** | Colmillo de Vacío | dark |
| Luz | Solarca (A) | 1.0, 0.3, 0.1, 0.6, 0.2 | 0.6 | Fragmento de Alba | fire |
| Luz | Prismara (B) | 0.1, 0.2, 1.0, 0.3, 0.6 | 0.5 | Prisma Puro | water |
| Tierra | Monolitán (A) | 0.6, 0.0, 0.3, 0.3, 1.0 | 0.4 | Runa de Basalto | earth |
| Tierra | Geodráx (B) | 0.3, 1.0, 0.6, 0.1, 0.2 | 0.2 | Geoda Viva | electric |
| Cosmos | Galaxión (A) | 0.3, 0.1, 0.2, 0.6, 1.0 | 0.6 | Polvo de Supernova | water |
| Cosmos | Astrolabis (B) | 0.1, 0.6, 1.0, 0.2, 0.3 | 0.3 | Engranaje Celeste | light |

Overrides de lanzamiento: Umbralobo (`p_VÍN < 0.08 ∧ CQ < 45`, prioridad 10).
Ramas `default`: siempre la A, salvo Oscuridad (B).

> **Objetivo de balance:** con un estilo de juego "neutro" (ejes uniformes, CQ 70, sin objetos) la diferencia entre A y B debe ser menor de 6 puntos en todas las familias. Así, cualquier inclinación consciente del jugador decide el resultado. Esto se verificará con un test automatizado sobre la tabla real.

---

## 6. Genética

### 6.1 Genoma
```ts
interface Genome {
  family: FamilyId;                 // familia del progenitor portador
  secondaryAffinity: ElementId;     // elemento del otro progenitor (o el propio = "puro")
  color:   { base: [Allele, Allele]; accent: [Allele, Allele]; pattern: [Allele, Allele] };
  traits:  Record<LocusId, [Allele, Allele]>;  // cuernos, cola, orejas/aletas, marcas, ojos
  temperament: ["S"|"E", "S"|"E"];
  potential: Record<StatId, 0..15>;            // 6 stats
  specials: SpecialTraitId[];                  // 0–2 rasgos especiales
  mutation?: MutationId;
  generation: number;                          // 0 = huevo inicial o Nido Errante
  lineage: [parentAId?, parentBId?];
}
```

### 6.2 Dominancia de alelos (color y rasgos físicos)
Cada alelo tiene un rango: **D** (dominante), **I** (intermedio) o **R** (recesivo).
- D + cualquiera → se expresa D (si D + D distintos → el de menor índice de catálogo, estable).
- I + I distintos → **mezcla** (codominancia: color promediado en espacio OKLCH; en rasgos, variante "mixta" si existe y, si no, la de menor índice).
- I + R → I. R + R → R (los recesivos son raros de ver, de ahí su valor coleccionable).

Ejemplo de paleta base de Fuego: `Brasa (D)`, `Ceniza (I)`, `Oro Fundido (I)`, `Rubí Profundo (R)`, `Azul Llama (R)`.
Cada familia define de 4 a 6 alelos de color base, 4 de acento, 5 patrones (liso, moteado, rayado, degradado, constelado) y de 2 a 4 variantes por locus físico. Total aproximado: **más de 4.000 fenotipos visibles por familia**.

### 6.3 Herencia (determinista con semilla)
```
seed = hash32(parentA.id, parentB.id, pairBreedCount, eggIndex)
rng  = xoshiro128**(seed)
```
| Componente | Regla |
|------------|-------|
| Familia | La del **portador**, elegido por el jugador entre los dos progenitores. |
| Afinidad secundaria | Familia del otro progenitor, o la fijada por un Objeto de afinidad durante la incubación. |
| Loci diploides (color, rasgos, T) | De cada progenitor se toma 1 de sus 2 alelos (50/50 con `rng`). Mendel clásico. |
| Potencial (por stat) | `round( (pA+pB)/2 + drift )`, drift ∈ {−2,−1,0,+1,+2} con pesos {10,20,40,20,10}%. Si ambos progenitores tienen CQ vital ≥ 80 → drift mínimo −1. Límite: 0–15. |
| Rasgos especiales | Cada progenitor transmite 1 de sus rasgos (50/50). Si ambos transmiten el mismo → **Potenciado** (+50% de efecto). Máximo 2. |
| Mutación | Ver §6.5. |

**Transparencia:** antes de criar, la pantalla **"Previsión de nidada"** muestra las probabilidades exactas de cada fenotipo (cuadro de Punnett visual), el rango de potencial esperado y la probabilidad de mutación. Los genotipos ocultos de los progenitores solo aparecen si se han revelado con una **Lupa Genética** (o tras 2 crías, por deducción automática).

### 6.4 Rasgos especiales (lanzamiento: 12)
| ID | Nombre | Efecto |
|----|--------|--------|
| `tr_early_bird` | Madrugador | Las necesidades decaen un 15% menos entre las 6:00 y las 12:00. |
| `tr_glutton` | Glotón | +30% de felicidad al comer, pero el hambre decae un 10% más. |
| `tr_warm_heart` | Corazón Cálido | +25% de puntos de VÍN. |
| `tr_restless_mind` | Mente Inquieta | +25% de puntos de ING. |
| `tr_iron_hide` | Piel Dura | +4% DEF en Arena. |
| `tr_swift` | Patas Ligeras | +4% VEL en Arena. |
| `tr_lucky_star` | Estrella Afortunada | +2% de probabilidad crítica. |
| `tr_tidy` | Pulcro | La higiene decae un 20% menos. |
| `tr_deep_sleeper` | Sueño Profundo | El descanso se recupera un 25% más rápido. |
| `tr_playful` | Juguetón | +20% de puntos de AGI. |
| `tr_stoic` | Estoico | +20% de puntos de SER. |
| `tr_shimmer` | Destello | Cosmético: partículas brillantes al moverse. |

### 6.5 Mutaciones (raras, pero no dependientes solo de la suerte)
```
P(mutación) = 3% base
            + 5% si se usa un Catalizador de Mutación en la incubación
            + 2% si algún progenitor está mutado
Medidor de Inestabilidad (por cuenta): +10 por cada huevo sin mutación.
Al llegar a 100 → mutación garantizada en el siguiente huevo y el medidor vuelve a 0.
```
Con esto, en el peor caso hay **una mutación cada 10 huevos**. El tipo de mutación se elige con `rng`, con pesos visibles:

| Mutación | Peso | Efecto |
|----------|------|--------|
| Iridiscente | 30 | El color base cambia de tono de forma animada. |
| Melánico / Albino | 25 | Paleta en negativo o desaturada con ojos de color. |
| Quimera | 15 | Cuerpo dividido entre dos colores base. |
| Gigantismo | 10 | Escala ×1.15 y voz más grave (solo cosmético). |
| Rasgo Ancestral | 15 | Desbloquea un alelo físico raro (p. ej. tercer cuerno) heredable. |
| Afinidad Prismática | 5 | La afinidad secundaria pasa a ser un elemento al azar no presente en los progenitores. |

---

## 7. Reproducción y huevos

### 7.1 Requisitos para criar
- Ambas criaturas son **Juvenil o Adulto**, están activas y no están Abatidas.
- Felicidad ≥ 70 en ambas.
- **Lazo** entre ambas ≥ nivel 3 (de 5). El Lazo crece al convivir en el hábitat y al jugar juntas (GAMEPLAY_SYSTEMS §3).
- Cooldown de 48 h por criatura tras criar.
- Coste: 150 Tamcoins (ritual del nido).
- Se permiten parejas de la misma familia y de familias distintas.

### 7.2 Rareza del huevo
```
puntosRareza = Σ potencial (0–90)
             + 8 por cada fenotipo recesivo expresado
             + 6 por cada rasgo especial (10 si Potenciado)
             + 20 si mutado
```
| Rareza | Puntos | Incubación | Brillo de la cáscara |
|--------|--------|-----------|----------------------|
| Común | < 45 | 4 h | Ninguno |
| Poco común | 45–59 | 6 h | Destello suave |
| Raro | 60–74 | 10 h | Aura de color |
| Épico | 75–89 | 16 h | Aura + partículas |
| Legendario | ≥ 90 | 24 h | Aura pulsante + latido sonoro |

La incubación se reduce hasta un −30% con decoraciones del nido (Nido Cálido, Incubadora). No hay aceleración de pago.

### 7.3 Visible y oculto
- **Visible en la cáscara:** familia (forma y textura), color base (tono de la cáscara), patrón (manchas) y rareza (brillo).
- **Oculto hasta la eclosión o la Lupa Genética:** potencial exacto, rasgos especiales, alelos recesivos portados y temperamento.

### 7.4 Ciclo de vida del huevo
`Puesto → Incubando (se mueve más según se acerca la eclosión) → Listo (late) → Eclosión animada (secuencia de 4 s: grietas, luz, explosión de fragmentos y primera expresión) → Nombre`
Huecos de nido: 2 huevos incubando a la vez. Si las 3 plazas activas están ocupadas, el huevo puede guardarse **sin eclosionar** en el Santuario.

---

## 8. Ampliabilidad (temporadas)

- **Ramas secretas (S):** una por familia, con gate de Piedra evolutiva + condición especial. Ejemplos reservados: *Brasaluz* (Fuego, afinidad Luz + Piedra Solar + Ritual al amanecer), *Abismareón* (Agua, afinidad Oscuridad + Piedra Abismal + CQ ≥ 90).
- **Híbridos:** reglas cuyo gate es `requiredAffinity` + Reliquia de temporada.
- **Nuevas familias:** se añaden como contenido (datos + arte + rig) sin cambiar el motor.
- **Versionado:** cada regla tiene `version`. Las criaturas guardan `rulesetVersion` del momento del Ritual, de modo que un rebalanceo nunca altera retroactivamente una evolución ya hecha.

```ts
interface EvolutionRule {
  id: string;                        // "evo_fire_j_a"
  version: number;
  from: FormId; to: FormId;
  isDefault?: boolean; isSecret?: boolean;
  gates: Gate[];                     // { type:"minLevel", value:25 } …
  axisWeights: Record<AxisId, number>;
  careWeight: number;
  catalystItem?: ItemId;
  affinityTag?: ElementId;
  temperamentSide?: "S" | "E";
  forceIf?: Condition; priority?: number;
  bias?: number;
  codexHints: [HintId, HintId, HintId];
}
```

---

## 9. Descubrimiento — el Códice

Cada forma tiene cuatro estados en el Códice:

| Estado | Qué ve el jugador | Cómo se alcanza |
|--------|-------------------|-----------------|
| **Desconocida** | "???" y silueta oculta | Por defecto |
| **Avistada** | Silueta en negro + nombre | Verla en un rival de Arena, un Nido Errante o una pista |
| **Investigada** (pistas 1–3) | Pistas progresivas | Puntos de Investigación o progreso parcial |
| **Registrada** | Arte completo, animaciones, stats y **Ficha Técnica** (regla completa con pesos) | Obtenerla |

**Niveles de pista** (ejemplo, Fenixara):
1. *Temática:* "Dicen que las llamas que bailan nunca se apagan."
2. *Dirección:* "Los Brasko que corren y juegan mucho tienden a esta forma." (revela los ejes dominantes)
3. *Concreta:* "Una Pluma Cenicienta inclina la balanza." (revela el catalizador, gates y overrides)

**Fuentes de Investigación:** primeras partidas diarias de minijuegos, combates de Arena, eclosiones, logros y la **investigación pasiva**: cuando una criatura propia cumple el 50% de un gate oculto, la pista correspondiente se desbloquea sola ("Tu Noctaro parece… distante").

**Pronóstico Evolutivo** (ficha de la criatura Juvenil): una balanza ilustrada entre la silueta A y la B (y "✦ ???" si hay una rama secreta elegible) que se inclina según `S(A) − S(B)`. No muestra números hasta que ambas formas están Registradas; a partir de ahí, se puede abrir el desglose completo.

---

## 10. Pruebas automatizadas requeridas (Fase 4)
- Crecimiento: para cualquier trayectoria de cuidado y juego sin Abatido ni Guardería, el tiempo de Bebé a elegible-Adulto está en [120 h, 168 h] (property-based).
- Determinismo: el mismo `EvolutionContext` → el mismo resultado (property-based, 10.000 casos).
- Balance neutro: `|S(A) − S(B)| < 6` con ejes uniformes y CQ 70 en las 8 familias.
- Alcanzabilidad: para cada rama existe un perfil de juego razonable (simulado) que la obtiene sin objetos.
- Herencia: las frecuencias observadas en 100.000 nidadas simuladas coinciden con la Previsión de nidada (χ², p > 0.01).
- Garantía de mutación: nunca más de 10 huevos seguidos sin mutación.
- Versionado: cambiar pesos no altera criaturas ya evolucionadas.

---

## 11. Lustre y calidad de forma (decisiones del 2026-11-19)

**Objetivo:** que casi cada Tamtam sea distinto (más de 300 posibilidades por familia) y que el jugador que cuida, limpia, entrena y combate obtenga formas **más bonitas y mejores**, mientras que el descuido produce formas **menos vistosas y más débiles**.

### 11.1 Lustre (0–100) — `packages/core/src/appearance/appearance.ts`
```
Lustre = 0,45·Cuidado + 0,20·Actividades + 0,20·Arena + 0,15·Vínculo
Cuidado     = 70% satisfacción media de toda la vida + 30% satisfacción actual
Actividades = Σ niveles de atributos / 40     (Gym, Academy, Garden, Music, Workshop)
Arena       = 60% rango + 40% % de victorias (ponderado por experiencia, 20 combates)
Vínculo     = Cariño actual
```
Niveles: Apagado < 30 ≤ Común < 50 ≤ Vivo < 70 ≤ Radiante < 88 ≤ Legendario. Sin Arena el máximo es 80, así que **Legendario exige combatir**.

### 11.2 Se graba en el Ritual
En cada evolución, el Lustre de ese momento pasa a ser la **calidad de la nueva forma** (`formQuality`), que se mantiene hasta la siguiente evolución:

| Calidad | Stats de combate | Habilidades de la forma | Extra |
|---------|------------------|-------------------------|-------|
| Apagado | ×0,88 | **Debilitada**: potencia ×0,85, cooldown ×1,2 | Adornos de descuido |
| Común | ×0,95 | Normal (potencia ×0,95, cooldown ×1,05) | |
| Vivo | ×1,00 | Normal | |
| Radiante | ×1,05 | **Mejorada**: potencia ×1,1, cooldown ×0,95 | Adornos mágicos |
| Legendario | ×1,10 | **Ascendida**: potencia ×1,15, cooldown ×0,9 | +1 hueco de pasiva en Arena |

Además, en tiempo real, un Tamtam descuidado **ahora** pierde color y partículas hasta que se le vuelve a cuidar, sin perder la calidad grabada.

### 11.3 Cuántas posibilidades hay
Rama (A, B o secreta: 3) × calidad (5) × marca de vida (6: Guerrero, Sabio, Artista, Silvestre, Artesano o sin marca) × alelo de color (5) = **450 aspectos adultos por familia**, más mutaciones (×6 cuando se implementen) y el temperamento. El **tiempo** de crecimiento varía de forma continua entre 5 y 7 días (§2.1).

### 11.4 Objetos evolutivos (N11)
Se mantiene el diseño: un catalizador **inclina** la rama (+25) pero no anula una vida entera. La calidad y la marca **no se compran**: dependen de cómo se ha vivido. Esto evita el pay-to-win y hace que cada Tamtam cuente su propia historia.
