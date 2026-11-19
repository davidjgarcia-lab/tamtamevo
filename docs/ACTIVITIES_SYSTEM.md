# ACTIVITIES SYSTEM — Tam Tam Evo

> Versión 0.3 · Brief v3.0 · Estado: **propuesta, pendiente de aprobación** (decisiones N3, N7 y N10)
> Las 5 actividades de casa (Gym, Academy, Garden, Music y Workshop), los 5 atributos de desarrollo y su integración con la evolución y la Arena.
> Código: `packages/core/src/progression` (curva de atributos y mejoras, implementado). Actividades jugables: Fase 6.

---

## 1. Atributos de desarrollo

Son 5 atributos **independientes de las necesidades** y de las stats genéticas de combate. Representan lo que el Tamtam **ha aprendido**.

| Atributo | ID | Se entrena con | Influencia (con tope) |
|----------|----|----------------|------------------------|
| **Fuerza** | `str` | Gym | Arena: +0,5% FUE por nivel (máx. +10%) |
| **Inteligencia** | `int` | Academy | Arena: +0,4% de regeneración de ENE por nivel (máx. +8%); habilita gambits (§6) |
| **Creatividad** | `cre` | Music, Academy (Arte) | Arena: −0,3% de cooldowns por nivel (máx. −6%); desbloquea canciones y diseños |
| **Afinidad natural** | `nat` | Garden | Arena: +0,25% de resistencia elemental por nivel (máx. +5%); mejores cosechas |
| **Habilidad manual** | `man` | Workshop | Arena: +1% de eficacia del equipo por nivel (máx. +20% del bonus de equipo); calidad de fabricación |

- **Niveles 0–20.** XP para pasar del nivel `n` al `n+1`: `50 × (n + 2)` (acumulado: nv. 4 = 700 XP, nv. 5 = 1.000, nv. 10 = 3.250, nv. 20 = 11.500). Con unas 2 sesiones diarias de calidad media (~60 XP) se llega al nivel 4 en unos 6 días, al 5 en unos 8 y al 10 en unas 4 semanas.
- **No sustituyen a la genética:** la suma de los bonus de atributos en Arena está limitada a ≈ +12% de poder efectivo, el mismo orden que el equipo. La especie, las stats base y el potencial genético siguen siendo lo decisivo (EVOLUTION_SYSTEM §6).
- **Relación con los ejes de comportamiento (decisión N3):** los 5 **ejes** (FUE, AGI, ING, VÍN y SER) siguen midiendo *cómo se comporta el Tamtam en la etapa actual* (son la entrada principal de la evolución y se reinician con cada etapa). Los **atributos** son *aprendizajes permanentes*. Cada sesión de actividad suma a los dos (§2).

---

## 2. Las cinco actividades

Reglas comunes:
- Cada actividad requiere su **objeto funcional colocado** en la casa (HOME_SYSTEM) y la inicia el jugador tocando el objeto.
- Cada sesión es **una interacción jugable** de 30–90 s (nunca un simple botón) cuya precisión da una **calidad** de 0,5 a 1,5.
- Coste: Energía (y a veces Hambre o recursos). Recompensa: Tamcoins (ECONOMY_SYSTEM §3.3), XP de atributo, XP de actividad y puntos de eje.
- **Entusiasmo** por Tamtam, actividad y día (ECONOMY_SYSTEM §3.1).
- Cada objeto funcional tiene **3 niveles** (precios y requisitos en ECONOMY_SYSTEM §4.3). Subir de nivel desbloquea ejercicios o contenidos, mejora las recompensas (×1,25 / ×1,5), reduce los tiempos y desbloquea animaciones.

| Actividad | Base TC/sesión | Energía | Duración | XP de atributo (×calidad) | Ejes |
|-----------|----------------|---------|----------|---------------------------|------|
| Gym | 35 | 12 | 45 s | Fuerza +60 | FUE +5 |
| Academy | 30 | 10 | 60 s | Inteligencia +50, más XP de la materia (Arte: Creatividad +30) | ING +4, SER +1 |
| Garden | 10 por acción + venta de la cosecha | 4 | 20–40 s por acción | Afinidad natural +25 por acción | SER +2, VÍN +1 |
| Music | 30 (práctica) / 120 (concierto) | 10 / 25 | 60–90 s | Creatividad +55 | VÍN +2, AGI +2 |
| Workshop | Venta del objeto fabricado | 10 | 40 s + tiempo real de fabricación | Habilidad manual +55 | ING +2, SER +2 |

### 2.A TAMTAM GYM → Fuerza
| Nivel | Objeto | Ejercicios (interacción) |
|-------|--------|--------------------------|
| 1 | Mancuernas | **Levantamiento:** mantén pulsado para cargar y suelta con la barra en la zona verde. La zona se estrecha a medida que el Tamtam se cansa. 5 repeticiones. |
| 2 | Banco de pesas | + **Resistencia:** toques alternos al ritmo que marca el Tamtam (que acelera y frena). + Defensa: bloquea los balones medicinales en el momento justo. |
| 3 | Gimnasio avanzado | + **Circuito:** combinación de 3 ejercicios con combos. Desbloquea el ejercicio de Velocidad (comba) y la animación `train_advanced`. |
- Cada 10 sesiones de Gym → **+1 FUE base de entrenamiento** en Arena, que se suma al bonus por nivel del atributo. Con esto se sustituyen las "estaciones de entrenamiento" de GAMEPLAY_SYSTEMS §8 (decisión N7).
- Animaciones: `train_lift`, `train_bench`, `train_circuit` y sudor y estrellitas como VFX.

### 2.B TAMTAM ACADEMY → Inteligencia (y conocimientos)
4 materias con nivel propio (1–10):

| Materia | Interacción de la sesión | Desbloquea |
|---------|--------------------------|------------|
| **Cocina** | Memoriza y repite el orden de los ingredientes de la receta | **Recetas**: platos cocinables con ingredientes del Garden que sacian más, restauran Energía, mejoran la Felicidad o dan efectos (p. ej. +5% FUE en el próximo combate) |
| **Ciencia** | Mezcla reactivos hasta llegar al color objetivo (puzle de mezcla) | **Descubrimientos**: nuevos materiales, recetas de taller y semillas raras; pistas del Códice |
| **Estrategia** | Escenarios tácticos: elige la respuesta correcta a una situación de combate | **Comportamientos tácticos** de Arena: presets de estrategia avanzados y huecos de gambit (§6) |
| **Arte** | Trazado o composición de color sobre un boceto | **Diseños**: decoraciones y variantes de color exclusivas, fabricables en el Workshop |
- Animaciones: `study_read`, `study_write`, `study_mix`, `study_paint` y `cook`.

### 2.C TAMTAM GARDEN → Afinidad natural
- **Parcelas:** 4 (Nv1) · 8 (Nv2) · 12 (Nv3).
- **Ciclo por parcela:** plantar (consume una semilla) → **regar** en cada etapa de crecimiento (minijuego de regar: inclinar la regadera sin encharcar) → crecer en **tiempo real** (1–12 h según la especie) → **cosechar** → vender o guardar como ingrediente.
- Sin regar, la planta **se pausa**; nunca muere (no se castiga la ausencia).
- Plantas raras (requieren nivel de Garden o Ciencia): dan ingredientes especiales (cocina avanzada) y materiales (tintes y fibras para el Workshop).
- El Nv3 (Invernadero) reduce el crecimiento un 25% y añade una parcela "mágica" para semillas elementales.
- Animaciones: `garden_plant`, `garden_water` y `garden_harvest`.

### 2.D TAMTAM MUSIC → Creatividad
- **Práctica:** minijuego de ritmo (notas que caen sobre 3 carriles con el tambor Tam-Tam como base). Cada canción tiene un nivel de 1 a 5 de dominio.
- **Aprender canciones:** 12 canciones en el lanzamiento. Se desbloquean con el nivel de Music y la Creatividad.
- **Concierto:** encadena 3 canciones dominadas delante de los otros Tamtams (+Felicidad y +Lazo para todos). Da una recompensa grande y tiene cooldown de 8 h.
- Instrumentos por nivel: tamborcillo → set (con melodía) → escenario (con luces y público).
- Animaciones: `music_drum`, `music_play` y `music_bow` (reverencia).

### 2.E TAMTAM WORKSHOP → Habilidad manual
- **Recetas de fabricación:** `{ materiales, nivel de Workshop, Habilidad manual mínima, tiempo real, producto }`. El producto puede ser un mueble, un juguete, un accesorio o una mejora.
- **Sesión:** minijuego de precisión (serrar siguiendo la línea, martillear en el momento justo o coser). La calidad decide la **calidad del producto** (Normal / Bueno / Excelente, que afecta a su valor de venta y su Confort).
- **Cola de fabricación:** 1 / 2 / 3 huecos según el nivel. Recoger un producto es una acción manual.
- **Materiales:** se compran, se cosechan (fibras y tintes), se descubren con la Ciencia o salen como fragmentos en los minijuegos.
- Animaciones: `craft_saw`, `craft_hammer` y `craft_sew`.

---

## 3. Progresión de actividades
- **XP de actividad** (por objeto funcional) → requisito para mejorar el objeto, junto a los Tamcoins, el atributo y los materiales (ECONOMY_SYSTEM §4.3).
- Lo que da cada mejora: nuevos ejercicios o contenidos, multiplicador de recompensa, reducción de tiempos, animaciones nuevas, objetos especiales (p. ej. la Forja-taller fabrica equipo de Arena).

## 4. Interfaz de actividad
Cada actividad abre una **escena propia** con el Tamtam en primer plano usando el objeto (no es un formulario). La estructura es: cabecera mínima (Energía, calidad en vivo), zona de interacción en el tercio inferior, y una pantalla de resultado con las recompensas animadas (monedas que vuelan al monedero, barras de atributo que suben).

## 5. Integración con la evolución
A la fórmula de EVOLUTION_SYSTEM §4 se añade un término **específico por rama** (no universal):
```
S(c) += 10 · Σ_j u[c,j] · (atributo_j / 20)          // u[c,j] ∈ [0,1]; Σ_j u[c,j] = 1 en todas las ramas
```

| Familia | Rama A → atributos | Rama B → atributos |
|---------|--------------------|--------------------|
| Fuego | Volcaurio: Fuerza 1.0 | Fenixara: Creatividad 1.0 |
| Agua | Mareón: Fuerza 0.5 · Afinidad natural 0.5 | Velamar: Creatividad 0.6 · Inteligencia 0.4 |
| Naturaleza | Robledón: Afinidad natural 1.0 | Floriska: Fuerza 0.5 · Habilidad manual 0.5 |
| Electricidad | Truenarca: Inteligencia 0.5 · Creatividad 0.5 | Ampérix: Habilidad manual 1.0 |
| Oscuridad | Eclipsor: Inteligencia 1.0 | Umbralobo: Fuerza 1.0 |
| Luz | Solarca: Fuerza 0.5 · Creatividad 0.5 | Prismara: Inteligencia 0.5 · Creatividad 0.5 |
| Tierra | Monolitán: Fuerza 0.5 · Habilidad manual 0.5 | Geodráx: Habilidad manual 0.6 · Inteligencia 0.4 |
| Cosmos | Galaxión: Afinidad natural 0.6 · Creatividad 0.4 | Astrolabis: Inteligencia 0.6 · Habilidad manual 0.4 |

- El término vale **como máximo 10 puntos** (con el atributo al nivel 20), para que influya sin anular a los ejes, los cuidados ni los objetos.
- **Ramas secretas** (temporadas) podrán usar atributos como gate (p. ej. *Brasaluz* exige Creatividad ≥ 12), siempre de forma específica por familia.

## 6. Integración con la Arena
- Preparación antes de combatir: entrenamiento (Fuerza y FUE de Gym), estudio (gambits y presets), equipo (Habilidad manual), alimentación (platos con buffs de un combate, máx. 1 activo) y descanso (con Energía baja hay −5% de VEL).
- **Gambits (decisión N10):** el número de huecos lo da `max(desbloqueo por rango, desbloqueo por Estrategia)`. La Estrategia nv. 3/6/9 da 1/2/3 huecos. Así no se pierde el desbloqueo por rango ya diseñado.
- **Límite de preparación:** objetivo de balance verificado en el simulador. Un Tamtam con preparación máxima (atributos al 20, mejor equipo y buff de comida) contra uno de la **misma especie, nivel y potencial** sin preparación gana **como máximo el 75%** de las veces. Los objetos caros nunca garantizan la victoria.

## 7. Animaciones nuevas requeridas
`train` (3 variantes), `study` (4), `cook`, `garden` (3), `music` (3), `craft` (3), `sit`, `bathe` y `angry`. Se implementan como clips del rig del arquetipo más **props** (mancuerna, libro, regadera, tambor, martillo) enganchados a los huesos de las manos (ART_DIRECTION §12).
