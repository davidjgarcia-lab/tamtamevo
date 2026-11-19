# TAM TAM EVO — Game Design Document

> Versión 0.1 · Fase 1 (Diseño) · Estado: **pendiente de revisión**
> Título de trabajo: **Tam Tam Evo**. El brief menciona "Tamagotchi Evolution", pero *Tamagotchi* es una marca registrada de Bandai (ver Decisión D1 al final).

Documentos relacionados:
[ART_DIRECTION](ART_DIRECTION.md) · [CREATURE_DATABASE](CREATURE_DATABASE.md) · [EVOLUTION_SYSTEM](EVOLUTION_SYSTEM.md) · [GAMEPLAY_SYSTEMS](GAMEPLAY_SYSTEMS.md) · [TECHNICAL_ARCHITECTURE](TECHNICAL_ARCHITECTURE.md) · [ROADMAP](ROADMAP.md) · [CHANGELOG](CHANGELOG.md)

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
Mirar a la criatura → percibir una necesidad (expresión, burbuja, animación) → actuar (alimentar, acariciar, limpiar…) → reacción animada + feedback (partículas, sonido, háptica) → pequeña recompensa (XP, puntos de eje, Chispas).

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
- Llevar criaturas de Bebé a Adulto (unos 5–7 días por criatura con cuidado normal).
- Completar las 40 formas del Códice y las mutaciones.
- Criar linajes con mejor potencial genético.
- Subir de rango en la Arena (Bronce → Leyenda).
- Temporadas con nuevas criaturas, ramas secretas y eventos.

```
           ┌──────────── CUIDADOS ───────────┐
           │  (necesidades, vínculo, CQ)      │
           ▼                                  │
     MINIJUEGOS ──► Chispas / XP / Ejes ──► EVOLUCIÓN ──► ARENA
           ▲                │                    │          │
           │                ▼                    ▼          │
           └──── TIENDA / OBJETOS ◄──── GENÉTICA / CRÍA ◄───┘
```

---

## 3. Estructura del juego

### 3.1 Navegación (barra inferior)

| Pestaña | Contenido | Rol |
|---------|-----------|-----|
| **Hogar** | Hábitat ilustrado con las criaturas activas. Acciones de cuidado contextuales. | Centro emocional. La criatura ocupa al menos el 60% de la pantalla. |
| **Juegos** | Salón recreativo con los 4 minijuegos y su Entusiasmo. | Fuente de recursos y de ejes de comportamiento. |
| **Criaturas** | Plantel activo (máx. 3), Santuario, Huevos, Códice, Genética. | Colección e investigación. |
| **Arena** | Preparación, rival, combate, rangos e historial. | Competición. |
| **Perfil** | Logros, medallas, estadísticas, ajustes, inventario. | Meta y configuración. |

La tienda y el inventario se abren desde Hogar como hojas contextuales. No hay una pestaña dedicada, para que la tienda no compita con la criatura.

### 3.2 Pantalla Hogar (principio de "no-dashboard")
- Sin barras de estadísticas permanentes. Las necesidades se comunican con la **expresión, postura y animación** de la criatura, y con un anillo radial discreto al tocarla.
- Acciones en una **rueda de cuidados** de 6 botones grandes que aparece al tocar la criatura o el botón central.
- Elementos del hábitat interactivos: cuenco, bañera, cama, juguetes, zona de entrenamiento, decoraciones.
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
| Minijuegos | Laberinto, Rompebloques, Meowdoku y Serpentina. | GAMEPLAY_SYSTEMS §4 |
| Arena | Combate automático en tiempo real a 20 Hz, determinista, con estrategia configurable y 7 rangos. | GAMEPLAY_SYSTEMS §5 |
| Economía | Chispas (común) y Astrolitos (especial, solo ganables). Sin pay-to-win. | GAMEPLAY_SYSTEMS §6 |

---

## 5. Progresión del jugador

### 5.1 Primera experiencia (FTUE, ~8 minutos)
1. **Escena de apertura** (20 s, se puede saltar): un nido luminoso cae en el hábitat.
2. **Elección de huevo** entre 3 iniciales: Brasálido (Fuego), Marélido (Agua) y Brotálido (Naturaleza). Los huevos se mueven y laten de forma distinta para insinuar la personalidad de cada familia.
3. **Eclosión guiada:** el jugador toca el huevo y se produce la primera animación de eclosión.
4. **Nombre** de la criatura.
5. **Tutorial de cuidados** integrado: la criatura tiene hambre, se le da de comer, se ensucia y se limpia.
6. **Primer minijuego** (Serpentina, el más inmediato) con su recompensa.
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

**El mundo:** *Archipiélago Tamtam*, un conjunto de islas flotantes nacidas de un antiguo latido cósmico, el **Tam-Tam**. Cada isla resuena con un elemento. Las criaturas, los **Tamis**, nacen de huevos que caen cuando el latido se acelera. Los **Cuidadores** son humanos elegidos por un huevo; nunca al revés.

**Conflicto suave:** el latido se está debilitando. Cada evolución completada y cada forma registrada en el Códice "refuerza el pulso" (una meta global de colección que sirve de marco a las temporadas). La Arena es un festival ritual, el **Gran Tamborileo**, donde los Tamis muestran su fuerza. No es una guerra.

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

## 13. Decisiones que requieren aprobación

| ID | Decisión | Recomendación |
|----|----------|---------------|
| D1 | Nombre comercial (riesgo de marca con "Tamagotchi") | Usar **Tam Tam Evo** y no usar "Tamagotchi" en ningún sitio. |
| D2 | Stack tecnológico | Expo (React Native) + TypeScript + Skia + Reanimated; Supabase después. |
| D3 | Tecnología de animación | Rig vectorial modular propio sobre Skia. Rive como alternativa si se incorpora un animador. |
| D4 | Producción del arte final | Claude produce el arte vectorial de producción-prototipo. Se recomienda presupuesto para un ilustrador en la Fase 7. |
| D5 | Sin muerte de criaturas | Estado "Abatido" recuperable. |
| D6 | Santuario para criaturas inactivas | Sí, con huecos ampliables por progresión. |
| D7 | Modelo de monetización | F2P solo cosmético. |
| D8 | Evolución manual ("Ritual") o automática | Ritual iniciado por el jugador cuando la criatura es elegible. |
| D9 | Nombres de minijuegos | Laberinto Glotón, Rompebloques, Meowdoku y Serpentina (evitando "Maze Runner" y "Snake.io", que son títulos existentes). |
| D10 | Ritmo de crecimiento | Bebé→Adulto en unos 5–7 días con cuidado normal. |
