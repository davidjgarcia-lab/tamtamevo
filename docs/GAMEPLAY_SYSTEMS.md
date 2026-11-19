# GAMEPLAY SYSTEMS — Tam Tam Evo

> Versión 0.1 · Fase 1 · Estado: **pendiente de revisión**
> Cuidados, vida en el hábitat, entrenamiento, minijuegos, Arena, economía, logros.
> Todos los números son **valores iniciales de balance**. Vivirán en `packages/content/balance.ts` y se ajustarán con telemetría y simulación.

---

## 1. Ficha de una criatura (estado persistente)

```ts
interface Creature {
  id: string; name: string; formId: FormId; stage: Stage;
  bornAt: number; stageStartedAt: number;      // timestamps UTC (ms)
  level: number; xp: number;
  needs: Needs; needsUpdatedAt: number;        // snapshot + timestamp (ver §2.3)
  cqAccumulator: CareAccumulator;              // integral de satisfacción por etapa
  axes: Record<AxisId, number>;                // puntos por etapa
  training: Record<TrainingId, number>;
  skills: { learned: SkillId[]; equipped: SkillId[] };
  equipment: { amulet?: ItemId; talisman?: ItemId; accessory?: ItemId };
  genome: Genome;
  status: "active" | "sanctuary" | "daycare";
  flags: Record<string, number>;               // victorias, partidas, etc. (para gates)
  bonds: Record<CreatureId, number>;           // Lazo con otras criaturas (0–5)
  catalystSlot?: ItemId;
  rulesetVersion: number;
}
```

---

## 2. Cuidados

### 2.1 Necesidades (0–100; 100 = plenamente satisfecha)

| Necesidad | Decaimiento base (despierto) | Se recupera con | Señal visual principal |
|-----------|------------------------------|-----------------|------------------------|
| **Hambre** | −6 / h | Alimentar (+15 a +45 según la comida) | Se toca la tripa, ruge, mira el cuenco |
| **Higiene** | −4 / h, más −3 / h por cada excremento presente | Bañar (+60), Limpiar (+20) | Manchas, moscas estilizadas, se rasca |
| **Felicidad** | −3 / h | Jugar, minijuegos, regalos, decoración | Postura, color de ojos, saltitos o cabizbajo |
| **Cariño** | −4 / h | Acariciar (+8 por caricia, con un máximo diario), hablarle, atender llamadas | Busca al jugador, mira a cámara, se acurruca |
| **Descanso** | −5 / h despierto · **+12 / h dormido** | Dormir, Descansar (siesta de 20 min: +15) | Bostezos, ojos entornados, se tambalea |
| **Actividad** | −5 / h | Jugar, entrenar, minijuegos, Arena | Inquieto, da vueltas, tira cosas |

Los modificadores de familia y de rasgos especiales se aplican como multiplicadores (CREATURE_DATABASE y EVOLUTION_SYSTEM §6.4).

### 2.2 Acciones de cuidado y reacción visual obligatoria

| Acción | Interacción | Reacción (animación + VFX + SFX) |
|--------|-------------|----------------------------------|
| **Alimentar** | Arrastrar la comida desde la bandeja hasta la boca (o tocar el cuenco) | `eat` (masticar, carrillos hinchados), migas, sonido por comida; reacción de gusto (favorita = corazones, odiada = mueca). |
| **Bañar** | Abrir la bañera y frotar con el dedo | `bathe`: espuma que aparece donde se frota, sacudida final con gotas. |
| **Limpiar** | Pasar el paño por las manchas | Destello en la zona limpia, la criatura se mira satisfecha. |
| **Recoger excrementos** | Tocar el excremento (pala) | El excremento se recoge con una animación cómica y +higiene; la criatura se avergüenza un poco. |
| **Jugar** | Lanzar la pelota o el juguete con un swipe | `run` + `jump` para atraparla; la devuelve; celebración. |
| **Acariciar** | Frotar sobre la criatura (detección de dirección) | `pet`: ojos cerrados, ronroneo por familia, corazones; a contrapelo en Voltíidos = chispa cómica. |
| **Dormir** | Apagar la lámpara | Transición nocturna, `sleep` en bucle con respiración y Zzz propias de cada familia. |
| **Descansar** | Cojín de siesta | `rest` 20 min reales (se puede interrumpir). |
| **Decorar** | Modo edición: arrastrar decoraciones | La criatura se acerca a curiosear lo nuevo. |

La rueda de cuidados solo muestra **acciones con sentido en ese momento** (no se puede bañar a una criatura dormida; la acción aparece atenuada con su motivo).

### 2.3 Simulación temporal (con la app cerrada)
- **No hay temporizadores activos.** El estado se guarda como *snapshot + timestamp* y al reabrir se integra el tiempo transcurrido de forma **analítica por tramos**:
  1. Se construye la lista ordenada de **eventos de frontera** entre `needsUpdatedAt` y `now`: inicio y fin de sueño programado, aparición de excrementos, umbral de 8 h de ausencia, fin de siesta y fin de incubación.
  2. Entre dos eventos, cada necesidad es lineal (`n(t) = clamp(n0 + r·Δt, floor, 100)`), así que el cálculo es exacto y en O(eventos).
  3. La integral de satisfacción para CQ se acumula en cada tramo (área del trapecio, con el recorte del suelo).
- **Excrementos:** aparecen 90 min después de cada comida + jitter determinista (`hash(mealTimestamp)` → 0–60 min). Máximo 3 a la vez.
- **Sueño:** horario configurable (por defecto 22:00–07:00 hora local; Umbrálidos invertido). Si no se apaga la luz, se duerme sola 1 h después con un 50% de calidad de descanso.

### 2.4 Protección contra castigos excesivos
| Regla | Valor |
|-------|-------|
| Amortiguación por ausencia | Tras 8 h seguidas sin abrir la app, todos los decaimientos ×0.5. |
| Suelo por tiempo | Ninguna necesidad baja de **25** solo por el paso del tiempo. |
| Estado **Abatido** | Si la satisfacción media es ≤ 30 durante 24 h. Efectos: no gana XP, no evoluciona y no cría. **Se sale** al llegar a una media ≥ 60 (3–4 acciones). Sin pérdidas permanentes. En la práctica, solo ocurre tras más de 2 días de abandono total. |
| **Malestar** (enfermedad leve) | 2 o más excrementos durante 4 h o Higiene < 30 durante 6 h. Efectos: −50% de felicidad ganada y animación de estornudos. Se cura con Medicina, o con baño + descanso. |
| **Guardería** | El jugador puede dejar criaturas en la Guardería antes de un viaje: las necesidades se congelan y la criatura no progresa ni pierde nada. Cooldown de 24 h para evitar abusos en el CQ. |
| **Muerte** | No existe (decisión D5). |

### 2.5 Integridad del reloj
- Se guarda el `lastSeenWallClock` y un contador monotónico de sesión.
- Si `now < lastSeen` (reloj atrasado) → el tiempo negativo se ignora.
- Saltos hacia delante mayores de 14 días → se trata como ausencia larga (el suelo de 25 ya limita el efecto).
- Con conexión, se usa la hora del servidor como referencia (Fase de backend). Las acciones competitivas futuras siempre usan la hora del servidor.

### 2.6 Notificaciones locales (opt-in)
Máximo 3 al día y nunca en el horario de sueño del jugador: "Chispín tiene hambre", "¡Tu huevo está a punto de eclosionar!", "Brasko está listo para el Ritual". Se pueden desactivar por categoría.

---

## 3. Vida en el hábitat

### 3.1 IA autónoma de criaturas (Hogar)
IA de **utilidad** evaluada cada 2–4 s cuando la criatura no está en una interacción:

| Comportamiento | Utilidad aumenta con |
|----------------|----------------------|
| Deambular | Base |
| Ir al cuenco / pedir comida | Hambre baja |
| Jugar con un juguete del hábitat | Actividad baja, Felicidad media |
| Siesta espontánea | Descanso bajo |
| Interactuar con una decoración favorita | Preferencias de familia |
| Acercarse al jugador (pantalla) | Cariño bajo |
| **Interactuar con otra criatura** | Lazo, compatibilidad de personalidad |
| Llamada (burbuja de petición) | Necesidad < 40 (máx. 6 al día) |

### 3.2 Interacciones entre criaturas
| Interacción | Condición | Animación | Efecto |
|-------------|-----------|-----------|--------|
| Saludo | Siempre | Se acercan y se tocan el hocico | +Lazo pequeño |
| Pillapilla | Ambas con Actividad < 70 | Persecución con risas | +Actividad, +Lazo |
| Acicalarse | Lazo ≥ 2 | Una limpia a la otra | +Higiene, +Cariño |
| Compartir comida | Lazo ≥ 3, una con hambre | Le acerca comida | +Hambre de la receptora |
| Riña cómica | Elementos con desventaja y Lazo ≤ 1 | Nube de polvo cómica | −Felicidad leve; luego se reconcilian |
| Dormir juntas | Lazo ≥ 4 | Duermen acurrucadas | +Descanso un 10% más rápido |

**Lazo** (0–5): puntos por interacciones y por actividades conjuntas (botón "Jugar juntas"). Requisito de cría: Lazo ≥ 3.

### 3.3 Decoración
- Hábitat con 3 capas de profundidad (fondo, medio, primer plano) y colocación libre con *snapping* suave.
- Cada decoración tiene **Confort** (de +1 a +5). El Confort total da hasta −15% de decaimiento de Felicidad.
- Preferencias por familia (p. ej. a los Lumálidos les encantan las vidrieras; a los Terrálidos, las piedras raras). Una decoración preferida genera interacciones especiales.
- Temas de hábitat completos (cosméticos) por familia.

---

## 4. Minijuegos

### 4.0 Reglas comunes
- La criatura activa elegida **es el avatar** del jugador (usa su rig y sus animaciones).
- Cada juego tiene su propia interfaz con identidad del universo, controles táctiles, música, SFX y récords locales (por criatura y global).
- La lógica de cada juego es un módulo puro en `packages/core/minigames/<juego>` con paso fijo y semilla (reproducible, testeable y preparado para validación de récords en el servidor en el futuro).
- Recompensas al terminar: Chispas, XP, puntos de eje (EVOLUTION_SYSTEM §3E), Investigación y fragmentos de objetos.
- **Habilidad de familia** (1 uso por partida o nivel) para que cada familia juegue un poco distinto: Fuego "Acelerón", Agua "Deslizar", Naturaleza "Brote" (escudo), Electricidad "Chispa" (aturde), Oscuridad "Fundirse" (intangible), Luz "Destello" (revela), Tierra "Excavar" (atraviesa un muro o bloque), Cosmos "Gravedad" (atrae objetos).

### 4.1 A · LABERINTO GLOTÓN (inspiración: laberintos arcade de persecución)
- **Objetivo:** recorrer el laberinto comiendo todas las *Semillas de Luz* sin que te atrapen los **Gruñones** (criaturas de humo gris).
- **Controles:** swipe con *buffer* de giro (el giro se ejecuta en la siguiente intersección válida). Joystick virtual opcional.
- **Enemigos (4 conductas):** *Perseguidor* (va a tu casilla), *Emboscador* (va 4 casillas por delante), *Patrullero* (circuito fijo + persecución cercana) y *Errático* (elige con RNG con semilla). Fases alternas de dispersión y caza.
- **Power-ups:** *Latido* (los Gruñones se vuelven vulnerables durante 6 s), *Imán* (atrae semillas), *Escudo* (1 golpe), *Fruta bonus* (puntos y Chispas).
- **Niveles:** 30 diseñados a mano en 3 mundos (Jardín, Cuevas, Nubes) y un modo Infinito procedural (generador de laberintos con bucles; validación de conectividad).
- **Puntuación:** semilla 10, fruta 100–500, Gruñón comido 200·2ⁿ dentro del mismo Latido, bonus de tiempo y de "sin golpes". 3 vidas.

### 4.2 B · ROMPEBLOQUES (inspiración: arkanoid / breakout)
- **Objetivo:** romper todos los bloques con la *Pelota-Tam* rebotando en un cojín que sostiene tu criatura.
- **Controles:** arrastre horizontal relativo (el dedo no tapa el cojín). Tap para lanzar.
- **Física:** propia y determinista (círculo contra AABB con barrido continuo para evitar *tunneling*). El ángulo de salida depende del punto de impacto en el cojín (±60°). La velocidad sube un 2% cada 10 golpes.
- **Bloques:** normal, duro (2–3 golpes), metálico (indestructible), explosivo (área 3×3), moneda (Chispas), jaula (libera un Tami bebé cosmético que anima desde abajo) y elemental (débil a la familia del jugador: se rompe de un golpe).
- **Power-ups (caen al romper):** Multibola ×3, Cojín Grande, Imán, Láser, Bola de Fuego (atraviesa), Lento y Vida extra. Malos: Cojín Pequeño y Rápido.
- **Niveles:** 40 en 4 mundos (uno por grupo de islas) con jefes cada 10 (un bloque-jefe animado con patrón propio) y modo Infinito.
- **Puntuación:** por bloque, combos sin tocar el cojín (×1.1 acumulable) y bonus de nivel limpio.

### 4.3 C · MEOWDOKU (inspiración: sudoku)
- **Concepto:** sudoku en el que los números son **emblemas del universo** (8 insignias de familia + el tambor Tam-Tam en 9×9). Hay un modo alternativo con números para accesibilidad.
- **Tamaños y dificultades:** 4×4 *Gatito* (tutorial), 6×6 *Fácil*, 9×9 *Normal*, *Difícil* y *Experto*.
- **Generador:** soluciones completas por backtracking aleatorio con semilla → retirada de pistas manteniendo **solución única** → calificación de dificultad según las técnicas necesarias para resolverlo (singles desnudos y ocultos → pares e intersecciones → X-Wing…). Se descartan y regeneran los puzles que no encajan con la dificultad pedida.
- **Herramientas:** modo notas, borrar, deshacer ilimitado, resaltado de emblema igual.
- **Pistas (3 por puzle):** 1) señalar una casilla resoluble, 2) explicar la técnica, 3) rellenar la casilla.
- **Validación:** opción "avisar conflictos" (activada por defecto en Fácil) y validación final con animación de celebración por fila, columna y caja.
- **Récords:** mejor tiempo por dificultad, puzles sin pistas, racha y **Puzle del Día** (semilla = fecha, igual para todos → base para futuras clasificaciones).
- **Ritmo:** la criatura reacciona en una esquina (piensa, celebra cada caja completada).

### 4.4 D · SERPENTINA (inspiración: snake / .io)
- **Concepto:** tu criatura encabeza una *estela* de orbes de su color. Come energía para crecer y haz que los rivales choquen contra tu estela.
- **Controles:** joystick flotante de dirección (giro con radio máximo) y botón **Turbo** (consume longitud).
- **Arena:** mapa circular grande con cámara que sigue y hace zoom según la longitud. Obstáculos: rocas, zarzas (−longitud) y portales.
- **Rivales IA (8–12):** personalidades *Glotón* (prioriza comida), *Cazador* (intenta encerrar), *Cobarde* (huye de los grandes) y *Oportunista* (busca restos). Usan steering behaviours + evaluación de peligro por raycasts. Nombres y colores generados.
- **Objetos:** Imán, Turbo gratis, Escudo (sobrevive a un choque) y Fantasma (atraviesa estelas 3 s).
- **Partida:** 3 minutos o hasta ser derrotado. Al ser derrotado, la estela se convierte en comida.
- **Puntuación:** longitud máxima + 250 por rival derrotado + posición final.

### 4.5 Recompensas de minijuegos
```
Chispas = round( base_juego + puntuación / k_juego )   // tope por partida: 120
XP      = 20 + 60 × rendimiento                         // rendimiento ∈ [0,1] normalizado por juego
Ejes    = tabla EVOLUTION_SYSTEM §3E × (0.5 + rendimiento)
Fragmentos: 1–3 por partida según rendimiento → 10 fragmentos = 1 objeto (catalizador/tónico) elegido por el jugador
```
Los fragmentos sustituyen a los drops aleatorios: el progreso hacia los objetos evolutivos es **acumulativo y predecible**.

### 4.6 Entusiasmo (rendimiento decreciente sin bloqueo)
Por criatura y minijuego, cada día (se reinicia a las 04:00 locales):
| Partidas del día | Multiplicador de recompensas (Chispas, ejes, fragmentos) |
|------------------|----------------------------------------------------------|
| 1–5 | 100% |
| 6–10 | 50% |
| 11+ | 20% (se sigue pudiendo jugar por diversión y récords) |

Cambiar de criatura o de minijuego mantiene el 100%: se incentiva la variedad, no el *grinding*.

---

## 5. Arena — combate automático en tiempo real

### 5.1 Flujo
`Arena → Preparación (criatura, habilidades, equipo, estrategia, stats) → Elegir rival (3 opciones) → Presentación (3 s) → Combate en tiempo real (≤ 75 s) → Resultado → Recompensas → Repetición opcional`
Pueden competir en ranked las criaturas **Juveniles y Adultas**. Las Infantiles pueden hacer *Combates de práctica* (sin PC).

### 5.2 Preparación
- **Habilidades:** 1 básico fijo + **3 activas** + **1 pasiva**, elegidas entre las aprendidas.
- **Equipo (3 huecos):** *Amuleto* (bonus de stat), *Talismán* (efecto disparado, p. ej. "al bajar del 50% de VID gana escudo") y *Accesorio* (cosmético + bonus menor). **Tope total del equipo: +12% de poder**, para que la criatura y la estrategia pesen más que el equipo.
- **Estrategia (preset + reglas):**

| Preset | Comportamiento |
|--------|----------------|
| Agresiva | Prioriza el daño y la distancia corta; usa habilidades en cuanto están listas. |
| Equilibrada | Valores por defecto. |
| Defensiva | Prioriza escudos y curas; guarda energía para reaccionar. |
| Oportunista | Guarda las ofensivas para cuando el rival tiene un debuff o VID < 40%. |
| Táctica | Mantiene la distancia ideal según su rango (kiting en los de distancia). |

  **Reglas (gambits):** hasta 3 reglas *"Si [condición] → [acción]"* que se evalúan antes que la IA, en orden. Condiciones: VID propia o rival < X%, ENE ≥ X, rival con estado Y, segundos de combate > X, distancia. Acciones: usar la habilidad Z, retroceder, acercarse, guardia. Se desbloquean progresivamente (1 regla en Plata, 2 en Oro y 3 en Platino).

### 5.3 Estadísticas de combate
```
stat_final = round( base_forma × (0.4 + 0.012 × nivel) × (1 + potencial/60) )
           + bonus_entrenamiento        // hasta +10% vía niveles de entrenamiento
           × (1 + bonus_equipo)         // ≤ 12%
VID_combate = stat_final(VID) × 6
ENE_max     = 50 + stat_final(ENE) / 2      ENE_regen = 4 + stat_final(ENE)/20  (/s)
P(crítico)  = min(35%, 5% + CRI_final/4 %)   multiplicador crítico ×1.5
```

### 5.4 Simulación
- **Paso fijo de 50 ms (20 Hz)**, lógica pura y determinista en `packages/core/combat` con RNG con semilla `xoshiro128**`. El render interpola a 60/120 fps.
- **Espacio:** pista 1D de 100 unidades (estilo El Bruto) con dos combatientes. Los voladores tienen un offset vertical cosmético. Rango: cuerpo a cuerpo ≤ 8, medio ≤ 25, distancia ≤ 60.
- **Máquina de estados** por combatiente: `Idle → Approach/Retreat → Windup → Strike → Recover`, más `Cast`, `Dodge`, `Guard`, `Stunned`, `KO`. Cada ataque tiene **windup visible** (anticipación de animación), lo que hace el combate legible.
- **Cadencias:**
  - Intervalo de ataque básico = `1.8 s / (1 + VEL/120)` (VEL 55 → 1.23 s; VEL 130 → 0.86 s).
  - Velocidad de desplazamiento = `8 + VEL/10` u/s.
  - Las habilidades tienen *windup* propio y comparten la ENE.
- **Resolución de golpe:**
  ```
  P(esquiva) = clamp(0.04 + (VEL_def − VEL_atq)/400, 0.02, 0.25) + buffs
  P(fallo)   = ceguera
  daño = FUE × potencia% × mult_elemental × (crítico ? 1.5 : 1) × var(0.92–1.08)
         × 100/(100 + DEF) × modificadores (guardia, escudo, buffs)   // mínimo 1
  ```
- **Fin:** KO, o al llegar a 60 s comienza la **Muerte súbita** (ambos pierden un 2% de VID máx./s, de forma creciente). A los 75 s gana quien tenga mayor % de VID; si es idéntico → empate.
- **Variabilidad controlada:** la varianza de daño, las esquivas, los críticos y el ruido de la IA (±10% en utilidades) salen del mismo RNG con semilla. Con las mismas entradas y la misma semilla, el combate es idéntico, lo que permite **repeticiones** y validación en el servidor.

### 5.5 IA de combate (configurable)
Utility AI evaluada en cada decisión libre (cuando no está en windup ni recuperación):
```
para cada acción a ∈ {básico, habilidad_1..3, acercarse, alejarse, guardia, esperar}:
  si !disponible(a) → descartar  (CD, ENE, rango alcanzable)
  U(a) = valor_base(a)
       × peso_estrategia[preset][tipo(a)]
       × factor_situacional(a, estado)   // p. ej. cura ×3 si VID < 35%; control ×1.5 si rival casteando
       × personalidad_familia[tipo(a)]   // ±10%: Brasálidos más agresivos, Marélidos más defensivos…
       × (1 + ruido_rng(±0.10))
elegir argmax U   (los gambits del jugador tienen prioridad absoluta si su condición se cumple)
```
Los parámetros (`valor_base`, pesos y factores) son **datos**, no código: se ajustan sin recompilar y se pueden versionar por temporada.

### 5.6 Rivales (MVP: IA)
- Cada vez se ofrecen 3 rivales: **Fácil, Igualado y Difícil**, con presupuesto de poder del 85%, 100% y 115% del poder del jugador ± variación por rango.
- Se generan con un *generador de rivales*: forma adulta o juvenil del pool desbloqueado por rango, genoma aleatorio con semilla, build de habilidades coherente con la estrategia y nombre de Cuidador generado.
- Escalera local de **100 Cuidadores IA** con PC propios que también "juegan" (simulación ligera al abrir la app), lo que da una **Clasificación** creíble offline.
- **Preparado para PvP asíncrono:** un rival es un `FighterSnapshot` (criatura + equipo + estrategia + versión de reglas), venga de la IA o de otro jugador.

### 5.7 Presentación visual
Barras de VID y ENE con *damage trail*, números de daño (los críticos más grandes, con borde y un pequeño *shake*), iconos de estado sobre la criatura, chispas por elemento, banner de efectividad ("¡Eficaz!" / "Resistido"), cámara con micro-zoom en habilidades especiales, cámara lenta en el golpe final y KO **sin violencia**: la criatura cae aturdida con estrellitas y una luz Tam-Tam la recoge. Velocidad 1×/2×.

### 5.8 Rangos, PC y medallas
| Rango | PC mínimo | Divisiones | Desbloquea |
|-------|-----------|-----------|------------|
| Bronce | 0 | III–I | — |
| Plata | 300 | III–I | 1 gambit · Nido Errante de Luz |
| Oro | 700 | III–I | 2 gambits |
| Platino | 1200 | III–I | 3 gambits |
| Diamante | 1800 | III–I | Equipo épico craftable |
| Maestro | 2500 | — | Marco de perfil animado |
| Leyenda | 3300 | — | Título y efecto de entrada exclusivos (en online: top 100) |

| Resultado | Fácil | Igualado | Difícil |
|-----------|-------|----------|---------|
| Victoria | +12 | +20 | +30 |
| Derrota | −20 | −15 | −8 |

- Racha de victorias: +3 PC por victoria consecutiva (máx. +9).
- Protección: no se puede descender de rango en Bronce ni en Plata.
- **Fatiga:** cada combate consume −8 de Descanso y −6 de Hambre. El límite diario es natural y está integrado en los cuidados.
- **Historial:** últimos 50 combates con repetición exacta (semilla + snapshots).
- **Medallas** (ejemplos): *Intocable* (ganar con > 90% de VID), *Remontada* (ganar con < 10%), *Maestro Elemental* (50 victorias con ventaja elemental), *David* (ganar a un rival Difícil 2 rangos por encima), *Imparable* (racha de 10) y una de *Especialista* por familia.

### 5.9 Herramientas de balance (obligatorias en la Fase 6)
CLI `pnpm sim:arena` que enfrenta todas las formas contra todas (N = 1.000 combates por pareja con semillas distintas, mismo nivel y potencial medio). Objetivos:
- Ninguna forma por encima del 58% de victorias medias ni por debajo del 42%.
- Duración media del combate entre 20 y 45 s.
- Con stats iguales, la ventaja elemental da entre el 60% y el 68% de victorias (importa, pero no lo decide todo).
- Una criatura 5 niveles por debajo con la estrategia correcta gana al menos el 25% de las veces (el nivel no lo es todo).

---

## 6. Economía

### 6.1 Monedas
| Moneda | Tipo | Fuentes | Usos |
|--------|------|---------|------|
| **Chispas** | Común | Cuidados (pequeñas), minijuegos, Arena, objetivos diarios, logros | Comida, medicina, decoración, catalizadores, tónicos, manuales de habilidad, cría, crafteo de equipo, Lupa Genética |
| **Astrolitos** | Especial (solo ganables) | Logros, primer ascenso a cada rango, objetivos semanales, hitos del Códice, eventos | Cosméticos especiales, Reliquias, huecos de Santuario, Catalizador de Mutación (máx. 1/semana), temas de hábitat |

### 6.2 Flujo objetivo (jugador medio, 3–4 sesiones diarias)
| Fuente | Chispas al día |
|--------|----------------|
| Cuidados (+2 por acción útil, tope 80) | 80 |
| Minijuegos (≈ 6 partidas a pleno rendimiento) | 400 |
| Arena (≈ 6 combates, 25–60 por combate) | 250 |
| Objetivos diarios (3) | 150 |
| **Total** | **≈ 880** |

| Sumidero | Precio |
|----------|--------|
| Comida básica / favorita / gourmet | 10 / 25 / 60 |
| Medicina | 50 |
| Tónico de eje | 250 |
| Catalizador (alternativa a 10 fragmentos) | 900 |
| Lupa Genética | 300 |
| Ritual del nido (cría) | 150 |
| Manual de habilidad universal | 800 |
| Decoraciones | 150 – 2.500 |
| Crafteo de equipo | 300 – 1.500 |

Objetivo: el gasto en cuidados básicos (~120/día) es muy inferior a los ingresos. Lo que se ahorra va a progresión y personalización. Revisión de inflación en la beta: los sumideros escalan con el nivel de Cuidador (decoraciones de tier superior).

### 6.3 Antiabuso
- Entusiasmo (§4.6), tope de Chispas por partida y tope de caricias diarias.
- Récords y acciones competitivas con validación en el servidor en el futuro (los módulos son deterministas y reproducibles).
- Sin pay-to-win: no se venden con dinero real ni stats, ni catalizadores, ni mutaciones, ni PC.

### 6.4 Nidos Errantes (adquisición determinista de familias)
| Familia | Hito |
|---------|------|
| Electricidad | Superar el Mundo 1 de Rompebloques **o** nivel de Cuidador 5 |
| Tierra | Tener la primera criatura Juvenil |
| Luz | Alcanzar Plata en la Arena |
| Oscuridad | Registrar 8 formas en el Códice |
| Cosmos | Récord "Oro" en los 4 minijuegos **o** nivel de Cuidador 20 |
| Semanal | Un Nido Errante a la semana de una familia rotativa (calendario fijo), por 600 Chispas |

---

## 7. Objetivos y logros
- **Objetivos diarios (3):** elegidos de una lista según las actividades disponibles. Se pueden cambiar 1 vez al día. **Sin rachas punitivas** (hay recompensa por 5 días completados en la semana, no necesariamente seguidos).
- **Objetivos semanales (5):** dan Astrolitos.
- **Logros:** más de 80 en el lanzamiento, por categorías (Cuidados, Evolución, Genética, Minijuegos, Arena y Colección). Cada uno da una recompensa y algunos un título.

## 8. Entrenamiento
- Cuatro estaciones en el hábitat: **Fuerza** (saco), **Carrera** (rueda), **Defensa** (escudo de madera) y **Meditación** (cojín).
- Interacción: **mini-ritmo de 20 s** (tocar al compás del tam-tam). La precisión da un multiplicador de 0.6 a 1.4 sobre la XP de entrenamiento y los puntos de eje.
- Coste: −10 de Descanso y −8 de Hambre. Cooldown de 30 min por estación.
- 10 niveles por estación; cada nivel da +1% de la stat asociada (máx. +10%) y desbloquea habilidades universales en el nivel 3.
