# TamTam Evolution — Game Design Document (marca: TamTam EVO)

> Versión 0.3 · Brief v3.0 integrado · Estado: D1–D10 aprobadas; **N1–N10 pendientes** (§13.2)
> Título: **Tam Tam Evo** (D1 aprobada). No se usa la marca "Tamagotchi" en ningún material.

Documentos relacionados:
[ART_DIRECTION](ART_DIRECTION.md) · [CREATURE_DATABASE](CREATURE_DATABASE.md) · [EVOLUTION_SYSTEM](EVOLUTION_SYSTEM.md) · [GAMEPLAY_SYSTEMS](GAMEPLAY_SYSTEMS.md) · [HOME_SYSTEM](HOME_SYSTEM.md) · [ECONOMY_SYSTEM](ECONOMY_SYSTEM.md) · [ACTIVITIES_SYSTEM](ACTIVITIES_SYSTEM.md) · [TECHNICAL_ARCHITECTURE](TECHNICAL_ARCHITECTURE.md) · [ROADMAP](ROADMAP.md) · [CHANGELOG](CHANGELOG.md)

---

## 1. Visión

Tam Tam Evo es un juego móvil de crianza de criaturas fantásticas. El jugador cuida, entrena y cría hasta tres criaturas a la vez; sus decisiones diarias definen en qué se convierten. Las criaturas adultas compiten solas en una Arena de combate automático en tiempo real, y los minijuegos arcade alimentan todo el ciclo de progresión.

**En una frase:** *"Lo que haces con tu criatura decide en qué se convierte."*

### 1.1 Pilares de diseño

| # | Pilar | Qué significa en la práctica |
|---|-------|------------------------------|
| P1 | **Vínculo** | La criatura es protagonista visual en todas las pantallas, reacciona a cada acción y recuerda cómo se la ha tratado. |
| P2 | **Agencia evolutiva** | La evolución es el resultado legible y reproducible de las decisiones del jugador, no de una tirada de dados. |
| P3 | **Descubrimiento** | El Códice oculta condiciones y ofrece pistas progresivas. Siempre hay algo por investigar. |
| P4 | **Colección con identidad** | Cada familia se reconoce por su silueta. La genética da a cada ejemplar rasgos únicos. |
| P5 | **Respeto al tiempo del jugador** | Nada de muertes por ausencia, castigos desproporcionados ni pay-to-win. Sesiones cortas que merecen la pena. |

### 1.2 Público objetivo

- **Principal:** jugadores de 12 a 35 años con interés en criaturas coleccionables, juegos cozy y progresión ligera.
- **Secundario:** jugadores competitivos casuales que disfrutan optimizando builds (perfil El Bruto o autobattlers).
- **Clasificación objetivo:** PEGI 7 / ESRB E10+ (violencia de fantasía sin sangre).

### 1.3 Plataformas

iOS y Android (teléfonos, vertical). Hay build web interna para QA y pruebas visuales, que no es un producto.

---

## 2. Bucles de juego

### 2.1 Bucle momento a momento (segundos)
Mirar a la criatura → percibir una necesidad (expresión, burbuja, animación) → actuar (alimentar, acariciar, limpiar…) → reacción animada + feedback (partículas, sonido, háptica) → pequeña recompensa (XP, puntos de eje, Tamcoins).

### 2.2 Bucle de sesión (2–10 min)
1. Abrir la app: resumen de lo que ocurrió mientras no estabas, contado por la criatura ("Ha dormido bien", "Te ha echado de menos").
2. Atender necesidades.
3. Elegir una actividad: minijuego, entrenamiento o Arena.
4. Recompensas → comprar o equipar objetos.
5. Revisar el Pronóstico Evolutivo y el Códice.

### 2.3 Bucle diario
- Ritmo de comidas, sueño y limpieza en tiempo real.
- Objetivos diarios (3) con recompensa, sin rachas punitivas.
- Rendimiento completo en minijuegos según el **Entusiasmo** de la criatura (ver GAMEPLAY_SYSTEMS §4.6).
- Progreso de incubación de huevos.

### 2.4 Bucle a largo plazo (semanas)
- Llevar criaturas de Bebé a Adulto (entre 5 y 7 días según el cuidado y el tiempo de juego; ver EVOLUTION_SYSTEM §2).
- Completar las 40 formas del Códice y las mutaciones.
- Criar linajes con mejor potencial genético.
- Subir de rango en la Arena (Bronce → Leyenda).
- Temporadas con nuevas criaturas, ramas secretas y eventos.

```
           ┌──────────── CUIDADOS ───────────┐
           │  (necesidades, vínculo, CQ)      │
           ▼                                  │
MINIJUEGOS + ACTIVIDADES ──► Tamcoins / XP / Ejes / Atributos ──► EVOLUCIÓN ──► ARENA
           ▲                │                    │          │
           │                ▼                    ▼          │
           └──── TIENDA / OBJETOS ◄──── GENÉTICA / CRÍA ◄───┘
```

---

## 3. Estructura del juego

### 3.1 Navegación (barra inferior)

| Pestaña | Contenido | Rol |
|---------|-----------|-----|
| **Hogar** | **TamTam Home**: la casa decorable con los Tamtams activos, sus objetos funcionales (Gym, Academy, Garden, Music, Workshop), la tienda y el modo Decorar. | Centro emocional y visual. |
| **Juegos** | Salón recreativo con los 4 minijuegos, representados **solo por iconos** (sin nombres), y su Entusiasmo. | Fuente de recursos y de ejes de comportamiento. |
| **Criaturas** | Plantel activo (máx. 3), Santuario, Huevos, Códice, Genética. | Colección e investigación. |
| **Arena** | Preparación, rival, combate, rangos e historial. | Competición. |
| **Perfil** | Logros, medallas, estadísticas, ajustes, inventario. | Meta y configuración. |

La tienda, el inventario y el modo Decorar se abren desde Hogar. No hay una pestaña dedicada, para que la tienda no compita con el Tamtam.

### 3.2 Pantalla Hogar (principio de "no-dashboard")
- La pantalla es la **habitación ilustrada** (HOME_SYSTEM): el Tamtam y la casa ocupan toda la pantalla y la interfaz flota en los bordes.
- **Arriba:** el **nombre del Tamtam** seleccionado (sobre una cinta ilustrada; al tocarlo se abre su ficha), el **monedero** (Tamcoins con contador animado) y un selector de Tamtam si hay varios.
- **Necesidades:** se leen en la **expresión, postura y animación**. Además hay un anillo radial compacto de 6 iconos junto al nombre, que se expande al tocar al Tamtam. No hay barras permanentes.
- **Acciones rápidas:** **rueda de cuidados** de 6 botones grandes al tocar al Tamtam.
- **Abajo, sobre la barra de navegación:** tres botones grandes ilustrados: **Tienda**, **Decorar** y **Actividades**. El último resalta los objetos funcionales de la casa; también se pueden tocar directamente.
- Los objetos de la casa son interactivos: cuenco, bañera, cama, juguetes, objetos funcionales y decoración.
- Ciclo día/noche sincronizado con la hora local. La iluminación del fondo cambia.
- Con varias criaturas, se mueven libremente e interactúan entre sí (ver GAMEPLAY_SYSTEMS §3).

---

## 4. Sistemas (resumen; detalle en documentos dedicados)

| Sistema | Resumen | Documento |
|---------|---------|-----------|
| Cuidados | 6 necesidades con decaimiento en tiempo real calculado por timestamps, sin muerte, con amortiguación por ausencia. | GAMEPLAY_SYSTEMS §2 |
| Criaturas | 8 familias × 4 etapas, 2 adultos por familia (40 formas en el lanzamiento). | CREATURE_DATABASE |
| Evolución | Multifactorial y determinista: requisitos (gates) + puntuación por rama. | EVOLUTION_SYSTEM |
| Genética | Genoma con loci de color, rasgos, potencial y afinidad secundaria. Cría desde Juvenil. | EVOLUTION_SYSTEM §6 |
| Minijuegos | 4 juegos identificados solo por icono: laberinto (`maze`), bloques (`bricks`), cuadrícula lógica (`grid`) y serpiente (`trail`). | GAMEPLAY_SYSTEMS §4 |
| Arena | Combate automático en tiempo real a 20 Hz, determinista, con estrategia configurable y 7 rangos. | GAMEPLAY_SYSTEMS §5 |
| Identidad y nombres | Cada Tamtam es un individuo con ID, nombre propio que se conserva al evolucionar, historial y relaciones. | CREATURE_DATABASE §12 |
| Casa | Habitación decorable por capas (pared, suelo, alfombras), editor táctil con rejilla y colisiones. Los Tamtams usan los muebles. | HOME_SYSTEM |
| Actividades | Gym, Academy, Garden, Music y Workshop: interacciones jugables, 3 niveles de mejora y 5 atributos de desarrollo. | ACTIVITIES_SYSTEM |
| Economía | **Tamcoins** (principal) y Astrolitos (especial, solo se ganan). Libro mayor atómico e idempotente. Sin pay-to-win. | ECONOMY_SYSTEM |

---

## 5. Progresión del jugador

### 5.0 Tamtams: individuos con nombre
- **Tamtam** es el nombre genérico de todas las criaturas del juego. Cada una es un **individuo**: tiene ID único, especie (familia), forma actual, **nombre propio**, fase, edad, personalidad, genética, afinidad, stats, atributos aprendidos, nivel, historial de evolución y relaciones (CREATURE_DATABASE §12).
- **Nacimiento con nombre:** eclosión animada → presentación del Tamtam → campo de nombre (2–16 caracteres, Unicode completo, validado; si se deja vacío se propone un nombre por defecto) → confirmación → el Tamtam reacciona a su nombre (celebración).
- **El nombre se conserva al evolucionar:** cambian la forma y la especie visible, no la identidad. Se puede renombrar en cualquier momento desde la ficha, gratis.
- El nombre aparece en Hogar, la ficha, la colección, las pantallas de evolución, la Arena, los resultados de combate y las burbujas de interacción entre Tamtams ("Brasa y Lumi juegan juntos").


### 5.1 Primera experiencia (FTUE, ~8 minutos)
1. **Escena de apertura** (20 s, se puede saltar): un nido luminoso cae en el hábitat.
2. **Elección de huevo** entre 3 iniciales: Brasálido (Fuego), Marélido (Agua) y Brotálido (Naturaleza). Los huevos se mueven y laten de forma distinta para insinuar la personalidad de cada familia.
3. **Eclosión guiada:** el jugador toca el huevo y se produce la primera animación de eclosión.
4. **Nombre** de la criatura.
5. **Tutorial de cuidados** integrado: la criatura tiene hambre, se le da de comer, se ensucia y se limpia.
6. **Primer minijuego** (el de serpiente, `trail`, el más inmediato) con su recompensa.
7. **Códice:** se muestra la silueta de su forma Infantil y una primera pista.

Desbloqueos escalonados: Juegos (minuto 3), Criaturas (minuto 6), Arena (cuando la criatura llega a Infantil), Cría (al llegar a Juvenil).

### 5.2 Obtención de nuevas criaturas
| Fuente | Familias | Momento |
|--------|----------|---------|
| Huevo inicial | Fuego / Agua / Naturaleza | Día 1 |
| Huevo de bienvenida (segunda criatura) | Una de las 2 iniciales no elegidas | Día 2 (para permitir cría temprana) |
| **Nidos Errantes** (hitos de colección, minijuegos y Arena) | Electricidad, Tierra, Luz, Oscuridad, Cosmos | Desbloqueo determinista por hitos (ver GAMEPLAY_SYSTEMS §6.4) |
| Cría | Familias de los progenitores | Desde Juvenil |
| Eventos de temporada | Variantes y formas secretas | Post-lanzamiento |

### 5.3 Nivel de Cuidador (cuenta)
Nivel de cuenta del 1 al 50, alimentado por todas las actividades. Desbloquea decoraciones, recetas, huecos de Santuario y funciones. Nunca desbloquea poder de combate directo.

---

## 6. Reglas fundamentales (no negociables)

1. **Las criaturas no mueren.** Si se descuidan mucho, entran en estado **Abatido** (no evolucionan, no ganan XP y caen sus ejes de Vínculo y Serenidad) hasta que se las cuida. Ver decisión D5.
2. **Máximo 3 criaturas activas.** El resto descansa en el **Santuario** (no consumen necesidades ni evolucionan). Ver decisión D6.
3. **Todo resultado relevante es reproducible:** evolución, herencia y combate usan funciones deterministas y semillas registradas.
4. **Toda acción provoca una reacción visual.** No hay botones sin feedback.
5. **Offline-first:** cuidados, minijuegos, evolución, cría y Arena contra IA funcionan sin conexión.

---

## 7. Narrativa y mundo

**El mundo:** *Archipiélago Tamtam*, un conjunto de islas flotantes nacidas de un antiguo latido cósmico, el **Tam-Tam**. Cada isla resuena con un elemento. Las criaturas, los **Tamtams**, nacen de huevos que caen cuando el latido se acelera. Los **Cuidadores** son humanos elegidos por un huevo; nunca al revés.

**Conflicto suave:** el latido se está debilitando. Cada evolución completada y cada forma registrada en el Códice "refuerza el pulso" (una meta global de colección que sirve de marco a las temporadas). La Arena es un festival ritual, el **Gran Tamborileo**, donde los Tamtams muestran su fuerza. No es una guerra.

**Tono:** cálido, curioso y humorístico, con momentos épicos en evoluciones y combates. Las criaturas no hablan; se expresan con sonidos característicos por familia y lenguaje corporal.

---

## 8. Audio (dirección)
- **Música:** tema principal con percusión de tambor ("tam-tam") como leitmotiv. Variaciones por hábitat, una pista por minijuego y una pista de Arena con capas dinámicas (se intensifica cuando la vida baja del 30%).
- **SFX:** cada familia tiene una "voz" de 6 sonidos (feliz, triste, hambre, sueño, ataque, evolución). Las acciones de cuidado tienen sonidos táctiles cortos.
- **Háptica:** suave en caricias, media en golpes críticos y fuerte en evolución y eclosión.

---

## 9. Accesibilidad
- Tamaños táctiles de 48 pt como mínimo; botones principales de 64 pt o más.
- Modo daltónico: los elementos se distinguen también por **icono y forma**, no solo por color.
- Respeto a "reducir movimiento" del sistema: transiciones simplificadas y partículas reducidas.
- Subtítulos o iconos para todos los cues de audio relevantes.
- Velocidad de combate ajustable (1×, 2×) y repetición.
- Textos externalizados (i18n) desde el día 1. Español primero, inglés en el lanzamiento.

---

## 10. Monetización (propuesta, requiere aprobación — D7)
- **Modelo recomendado:** free-to-play cosmético y sin anuncios intrusivos.
  - Venta de **cosméticos** (decoraciones, accesorios, temas de hábitat) y de un **Pase de Temporada** cosmético.
  - Opción de *supporter pack* de pago único (decoración exclusiva + hueco extra de Santuario).
- **Prohibido:** vender estadísticas, objetos evolutivos exclusivos, mutaciones, rango o aceleradores de combate. Tampoco habrá loot boxes de pago.
- Los Astrolitos (moneda especial) **solo se ganan jugando**.

---

## 11. Métricas de éxito (para la beta)
| Métrica | Objetivo |
|---------|----------|
| Retención D1 / D7 / D30 | 45% / 20% / 8% |
| Sesiones por día | ≥ 3 |
| % de jugadores que llegan a su primer Adulto | ≥ 35% |
| % que crían al menos un huevo | ≥ 20% |
| Crash-free sessions | ≥ 99.5% |
| Tiempo medio de arranque en frío | < 2.5 s en gama media |

---

## 12. Alcance del MVP (versión 1.0)
**Dentro:** 8 familias, 40 formas, genética y cría, 4 minijuegos completos, Arena contra IA con 7 rangos, economía, Códice, persistencia offline, ES/EN.
**Fuera (preparado arquitectónicamente):** amigos, visitas, PvP, intercambios, torneos, clasificaciones online y eventos en vivo. Ver TECHNICAL_ARCHITECTURE §8.

---

## 13. Decisiones

### 13.1 Aprobadas (2026-11-19)

| ID | Decisión | Resolución |
|----|----------|------------|
| D1 | Nombre comercial (riesgo de marca con "Tamagotchi") | ✅ Usar **Tam Tam Evo** y no usar "Tamagotchi" en ningún sitio. |
| D2 | Stack tecnológico | ✅ Expo (React Native) + TypeScript + Skia + Reanimated; Supabase después. |
| D3 | Tecnología de animación | ✅ Rig vectorial modular propio sobre Skia. Rive como alternativa si se incorpora un animador. |
| D4 | Producción del arte final | ✅ Claude produce el arte vectorial de producción-prototipo. Se recomienda presupuesto para un ilustrador en la Fase 7. |
| D5 | Sin muerte de criaturas | ✅ Estado "Abatido" recuperable. |
| D6 | Santuario para criaturas inactivas | ✅ Sí, con huecos ampliables por progresión. |
| D7 | Modelo de monetización | ✅ F2P solo cosmético. |
| D8 | Evolución manual ("Ritual") o automática | ✅ Ritual iniciado por el jugador cuando la criatura es elegible. |
| D9 | Nombres de minijuegos | ✅ **Sin nombres: solo iconos.** En la interfaz cada minijuego se identifica por un icono propio; ningún texto visible los nombra. Internamente se usan los IDs `maze`, `bricks`, `grid` y `trail`. |
| D10 | Ritmo de crecimiento | ✅ Bebé→Adulto **entre 5 y 7 días según el cuidado y las horas de juego** (sistema de Madurez, EVOLUTION_SYSTEM §2). |

### 13.2 Pendientes (brief v3.0)

| ID | Decisión | Recomendación |
|----|----------|---------------|
| N1 | Uso de las imágenes de referencia: 3 son arte de *World of Warcraft* y 1 recuerda a *Hollow Knight* | Usarlas solo como lenguaje visual, con las reglas de ART_DIRECTION §11. No reproducir criaturas, caras ni siluetas, y no guardar las imágenes en el repositorio |
| N2 | Producción del arte final de los adultos (acabado pintado como R2, o 3D como R3 y R4) | Estilo vectorial propio (cercano a R1 y R5) para todas las formas ahora, e ilustrador o ilustradora para los adultos en el Polish (ya contemplado en D4) |
| N3 | Atributos de desarrollo frente a ejes de comportamiento | Mantener ambos: los **ejes** son tendencias de etapa (ocultas, para la evolución) y los **atributos** son aprendizajes permanentes y visibles. Las actividades suman a los dos |
| N4 | Casa frente a hábitats de familia | La **casa** es el fondo de Hogar. Los hábitats pasan a ser la vista de la ventana, temas cosméticos y escenarios |
| N5 | Monedas | **Tamcoins** sustituye a "Tamcoins". Astrolitos se mantiene como moneda especial que solo se gana jugando |
| N6 | Coste de energía de las actividades | La necesidad *Descanso* pasa a llamarse **Energía** y es el coste de las actividades. Así se limitan las monedas de forma natural |
| N7 | Estaciones de entrenamiento previas | Se sustituyen por el **Gym** (3 niveles, con ejercicios de fuerza, defensa y velocidad). La meditación pasa a la Music |
| N8 | Roadmap combinado (casa, economía y actividades antes que evolución completa, minijuegos y Arena) | Ver ROADMAP. Es el orden del brief v3.0; las fases ya planificadas se mantienen después |
| N9 | Nombre comercial: "Tam Tam Evo" (aprobado en D1) o "TamTam Evolution" (usado en el brief v3.0) | Necesito que elijas uno. Ambos son viables a nivel de marca |
| N10 | Desbloqueo de gambits | Lo que llegue antes: rango de Arena o materia Estrategia |

### 13.3 Resueltas el 2026-11-19 (tras el vertical slice)
| ID | Resolución |
|----|------------|
| Art Bible | ✅ Aprobada, con efectos de **emisivo, halos, sheen** y magia (ART_BIBLE §8) |
| N4 · N6 · N7 | ✅ Casa como Hogar · Energía como coste · Gym sustituye a las estaciones |
| N9 | ✅ Nombre del juego: **TamTam Evolution**. Marca visual, logotipo e icono: **TamTam EVO** |
| N11 | ✅ Variedad y calidad: sistema de **Lustre** grabado en cada evolución (aspecto, combate y habilidades) + marca de vida + rama + genética → 450 aspectos adultos por familia (EVOLUTION_SYSTEM §11). Los catalizadores inclinan, no imponen |
| N12 | ✅ **Siestas de 20 min** (+15 Energía, cada 90 min) y **coste del Gym de 5 a 10** según el nivel (5 / 8 / 10) |
