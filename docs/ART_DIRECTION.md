# ART DIRECTION — Tam Tam Evo

> Versión 0.3 · Brief v3.0 · Estado: §1–10 aprobados; **§11–12 pendientes de aprobación** (N1, N2)
> Estética obligatoria: **2D ilustrado, muy colorido y con animaciones fluidas.** No es pixel art ni 3D.

---

## 1. Pilares visuales

| Pilar | Descripción | Anti-objetivo |
|-------|-------------|---------------|
| **Vivo** | Nada está totalmente quieto: respiración, parpadeo, partículas ambientales y vegetación que se mece. | Pantallas estáticas, criaturas tipo "sticker". |
| **Táctil** | Formas blandas, squash & stretch y respuesta inmediata al toque. | Botones planos sin estado de pulsación. |
| **Legible** | Siluetas claras, jerarquía de color y criatura siempre en primer plano. | Fondos que compiten con la criatura, UI tipo dashboard. |
| **Maravilla** | Las formas adultas son espectaculares, con escala, detalle y efectos propios. | Adultos que son bebés más grandes o recoloreados. |

Referencias: ver **§11** (imágenes aportadas en el brief v3.0, analizadas y traducidas a reglas propias). Todo diseño es **original**: no se reutilizan personajes, siluetas ni paletas reconocibles de franquicias existentes.

---

## 2. Lenguaje de formas por etapa

| Etapa | Proporción cabeza/cuerpo | Formas | Detalle | Expresividad |
|-------|--------------------------|--------|---------|--------------|
| Bebé | 1 : 1 (o cuerpo-cabeza único) | Círculos y gotas | Mínimo, 1 rasgo distintivo | Ojos ≥ 35% de la cara |
| Infantil | 1 : 1.3 | Óvalos y extremidades cortas | 2–3 rasgos | Muy alta |
| Juvenil | 1 : 2 | Aparecen ángulos y alargamiento | Rasgos de familia completos | Alta |
| Adulto | 1 : 3 o más (o anatomía no humanoide) | Siluetas únicas y asimétricas permitidas | Máximo: VFX integrados (lava, nebulosa, cristal) | Postura y porte, más que expresiones faciales |

**Test de silueta (obligatorio):** cada forma rellena en negro a 64 px debe ser identificable entre las 40. Las dos ramas adultas de una familia deben pertenecer a **arquetipos de rig distintos** (p. ej. Volcaurio = `quadruped_heavy`, Fenixara = `serpentine`).

### 2.1 Lenguaje de formas por familia
| Familia | Forma base | Ritmo de línea | Motivo recurrente |
|---------|------------|----------------|-------------------|
| Brasálidos (Fuego) | Triángulo hacia arriba | Ondulante y rápido | Lenguas de llama de 3 puntas |
| Marélidos (Agua) | Gota y círculo | Curvas largas y fluidas | Espirales y burbujas |
| Brotálidos (Naturaleza) | Hoja / lágrima vertical | Orgánico, asimétrico | Brotes, hojas en tríada |
| Voltíidos (Electricidad) | Zigzag / rombo | Quebrado y nervioso | Rayo doble |
| Umbrálidos (Oscuridad) | Media luna | Bordes que se deshacen en humo | Ojos luminosos, creciente |
| Lumálidos (Luz) | Estrella / círculo con rayos | Simétrico y elegante | Halo, rayos |
| Terrálidos (Tierra) | Cuadrado redondeado y bloque | Pesado y escalonado | Gemas y estratos |
| Astrálidos (Cosmos) | Anillo / órbita | Elíptico | Orbes satélite, constelaciones |

---

## 3. Color

### 3.1 Paletas de familia (propuesta inicial; se validará en la Fase 2)
| Familia | Primario | Secundario | Acento | Sombra (tinta) |
|---------|----------|------------|--------|----------------|
| Fuego | `#FF6B35` | `#FFB627` | `#FFE66D` | `#7A1F1F` |
| Agua | `#2EC4F1` | `#4361EE` | `#9BF6FF` | `#14286B` |
| Naturaleza | `#5BC85B` | `#A7D948` | `#FF8FB1` | `#1F4D2B` |
| Electricidad | `#FFD60A` | `#00E0FF` | `#FFF3B0` | `#3D3A00` |
| Oscuridad | `#5A3D8A` | `#2B1B4A` | `#C77DFF` | `#120A21` |
| Luz | `#FFF4D6` | `#FFD166` | `#FF9EC7` | `#8A6A2E` |
| Tierra | `#C68B59` | `#8C5A3C` | `#7EE8C7` | `#3B2416` |
| Cosmos | `#3A0CA3` | `#F72585` | `#4CC9F0` | `#0B0630` |

### 3.2 Reglas de color
- **Línea de contorno de color**, no negra: el tono de "tinta" de la familia, de grosor variable (más gruesa en la parte inferior y exterior).
- **Sombreado:** 2 tonos planos (luz y sombra) + **rim light** del color ambiente del hábitat + 1 brillo especular en ojos y superficies húmedas o cristalinas.
- **Genética:** los colores base, de acento y de patrón son *tintes* aplicados en runtime en espacio OKLCH. Cada alelo de color define un tono y la luz y la sombra se derivan automáticamente, conservando el contraste.
- **Criatura frente a fondo:** los fondos usan una saturación un 30% menor y valores medios. Las criaturas usan saturación alta y un contorno que garantiza la separación.
- **UI:** neutros cálidos (crema `#FFF8EC`, tinta `#2A2238`) y un color de marca, **Tam Coral** `#FF5E7E`. Los elementos de familia solo aparecen como acento contextual.
- Contraste de texto AA como mínimo (4.5:1) y AAA en textos pequeños críticos.

---

## 4. Tipografía (propuesta, a validar en la Fase 2)
| Uso | Fuente | Motivo |
|-----|--------|--------|
| Logo | Lettering personalizado ("TAM TAM" con forma de dos tambores y "EVO" en espiral) | Identidad propia |
| Títulos / UI display | **Fredoka** (variable, redondeada) | Amable, legible y con pesos variables para animar |
| Texto / cuerpo | **Nunito** | Muy legible en tamaños pequeños y con buena cobertura de acentos |
| Números de combate | **Fredoka** Bold con contorno | Coherencia y lectura rápida |

Ambas tienen licencia OFL (libres para uso comercial). Escala tipográfica base: 12 / 14 / 16 / 20 / 24 / 32 / 44.

---

## 5. Iconografía
- Set **original** con trazo redondeado de 2.5 px, relleno con 2 tonos y esquinas redondeadas, en rejilla de 24 px.
- Iconos de pestañas: **Hogar** (casita-nido con huevo), **Juegos** (mando con forma de tambor), **Criaturas** (huella con estrella), **Arena** (dos tambores cruzados con banderín) y **Perfil** (medallón).
- Iconos de cuidado: cuenco, burbuja de jabón, paño, pala, pelota, mano-corazón, luna y cojín.
- **Iconos de minijuego (D9: son su única identidad, sin nombre):** tamaño grande (96 pt en el salón recreativo), animados en reposo y con color propio para distinguirse también en modo daltónico por forma:
  - `maze`: laberinto cuadrado con una semilla de luz y un Gruñón asomando (verde neón).
  - `bricks`: tres bloques apilados con la pelota rebotando (naranja caramelo).
  - `grid`: cuadrícula 3×3 con emblemas de familia (azul acuarela).
  - `trail`: estela ondulada de orbes con una cabecita al frente (violeta nocturno).
  - Test: cada icono debe identificarse a 48 pt sin texto y en escala de grises.
- **No se usan emojis** como iconos ni como criaturas (los emojis de los documentos son solo marcas de lectura).

---

## 6. Hábitats y fondos
- **Composición en 4 capas con parallax** sutil por inclinación del dispositivo (opcional) y al desplazar: cielo, fondo lejano, plano medio (interactivo) y primer plano (vegetación o objetos que enmarcan).
- **Ciclo día/noche** (4 estados: amanecer, día, atardecer y noche) con interpolación de paleta (LUT de color sobre las capas) y efectos de luz por hábitat (luciérnagas de noche, rayos de sol de día).
- Partículas ambientales específicas: ascuas (Fuego), cáusticas (Agua), polen (Naturaleza), chispas (Electricidad), niebla (Oscuridad), motas doradas (Luz), polvo (Tierra) y estrellas fugaces (Cosmos).
- El hábitat se elige por familia de la criatura principal o por tema cosmético comprado.

---

## 7. Animación

### 7.1 Principios
Squash & stretch, anticipación, follow-through (colas, orejas, llamas), *slow in / slow out*, arcos y timing con carácter de familia (Voltíidos rápidos y entrecortados, Marélidos lentos y fluidos).

### 7.2 Catálogo mínimo por forma
**Básicas (todas las formas):** `idle` (2 variantes), `walk`, `jump`, `eat`, `sleep`, `bathe`, `pet`, `sad`, `angry`, `celebrate`, `interact` (saludo y juego con otra criatura).
**Avanzadas (Juvenil y Adulto; algunas en Infantil):** `fly` / `float` (si aplica), `attack_basic`, `attack_skill` (1 por habilidad), `guard`, `dodge`, `hit`, `ko`, `special` (habilidad característica), `evolve_in` / `evolve_out` y `transform` (estados temporales: Berrinche, Égida…).
**Faciales (capa independiente):** neutral, feliz, muy feliz, triste, enfadado, sorpresa, sueño, comiendo, dolor y determinación.

### 7.3 Tokens de timing (UI)
| Token | Duración | Curva | Uso |
|-------|----------|-------|-----|
| `instant` | 100 ms | ease-out | Pulsación de botón |
| `quick` | 180 ms | ease-out | Hojas, tooltips |
| `base` | 280 ms | spring (damping 18, stiffness 220) | Transiciones de pantalla y tarjetas |
| `expressive` | 450 ms | spring con *overshoot* | Recompensas, desbloqueos |
| `ceremony` | 2–4 s | coreografiada | Evolución, eclosión, ascenso de rango |

Con "Reducir movimiento" activo: sin parallax, partículas al 30% y ceremonias abreviadas a un fundido de 600 ms.

### 7.4 Storyboard — Ritual de Evolución (≈ 6 s, se puede saltar desde la segunda vez)
1. **0.0 s** — La música se atenúa y el hábitat se oscurece. La criatura mira a cámara.
2. **0.6 s** — Un latido de tambor. Aparecen anillos de luz con el color de la familia.
3. **1.2 s** — La criatura levita y su silueta se rellena de blanco, con pulsos al ritmo.
4. **2.4 s** — *Morph* de contorno de la silueta actual hacia la nueva (interpolación de paths), con aceleración.
5. **3.6 s** — Destello, explosión de partículas de familia y *shake* suave. Háptica fuerte.
6. **4.0 s** — Revelado a color con una pose épica (`evolve_out`) y rugido o sonido característico.
7. **5.0 s** — Tarjeta con el nombre de la nueva forma, nuevas habilidades y el Códice actualizado.

### 7.5 Eclosión (≈ 4 s)
Bamboleo creciente → grietas que brillan con el color heredado → pausa y silencio → estallido de cáscara en fragmentos con física → primera expresión (parpadeo y sorpresa) → estornudo o sonido característico.

---

## 8. Interfaz

- **Mobile-first, vertical.** Zona del pulgar para acciones principales (tercio inferior).
- **La criatura como protagonista:** en Hogar ocupa más del 60% del área visible. La UI flota en los bordes y se oculta tras 5 s de inactividad (modo "contemplar").
- **Componentes:** botones grandes con relieve suave (sombra inferior de 4 px que se aplana al pulsar), tarjetas redondeadas de 20 px, hojas inferiores (*bottom sheets*) para tienda, inventario y detalles, chips de elemento con icono + color.
- **Sin estética de dashboard:** las necesidades se muestran en el anillo radial al tocar la criatura, no con barras permanentes.
- **Minijuegos y Arena:** estilo propio por juego (`maze` con un tono de neón suave, `bricks` con colores de caramelo, `grid` con papel y acuarela, `trail` en un estanque nocturno y la Arena como un coliseo-festival con banderines y tambores), manteniendo tipografía, iconos y paleta base.

---

## 9. Pipeline de producción de arte

```
Concepto (boceto) → Ilustración por partes (SVG por capa/slot) → Optimización (SVGO)
→ Conversión a JSON de paths por slot/alelo → Ensamblado en rig (JSON) → Clips (JSON)
→ Vista previa en el "Rig Viewer" de desarrollo → QA (silueta, contraste, animaciones) → Integración
```
- Cada parte se dibuja en **gris neutro con canales de tinte** (base, acento y patrón) para que la genética coloree en runtime.
- Herramienta interna **Rig Viewer** (pantalla dev en la app): reproduce clips, cambia alelos y colores y prueba expresiones.
- **Producción (D4):** Claude puede producir el arte vectorial de las partes y los clips (calidad de prototipo avanzado o producción indie). Para un acabado "comercial premium" se recomienda incorporar un ilustrador en la Fase 7 que redibuje las partes sobre los mismos rigs. El pipeline está diseñado para que el reemplazo no requiera tocar código.

---

## 10. Entregables de la Fase 2
1. Logo y variantes (completo, icono de app, monocromo).
2. Paleta de UI + 8 paletas de familia validadas (contraste y daltonismo).
3. Tipografía y escala.
4. Librería de componentes UI (botones, tarjetas, hojas, chips, barra de navegación, anillo de necesidades).
5. Set de iconos (navegación, cuidados, stats y elementos).
6. **Criatura vertical slice:** familia de Fuego completa (5 formas) con rig y las 11 animaciones básicas de Chispín.
7. Hábitat de Fuego (4 capas, día/noche).
8. Mockups de las 5 pantallas principales.
9. Lámina de siluetas de las 40 formas (para validar el test de silueta antes de producir).

---

## 11. Referencias del brief v3.0 — análisis

Se aportaron **5 imágenes** (el brief habla de cuatro). Este es el análisis de lo que **realmente muestran**, porque las descripciones del brief no coinciden del todo con los archivos:

| # | Lo que muestra la imagen | Técnica | Descripción del brief que mejor encaja | Uso que propongo |
|---|--------------------------|---------|----------------------------------------|------------------|
| R1 | Monstruito rojo compacto, cuernos naranjas grandes, cejas en "V", ojos amarillos, colmillo, pies y punta de cola violetas | 2D cartoon con contorno marrón oscuro, sombreado suave y brillo especular | "Monstruo rojo" ✔ | **Bebé e Infantil** |
| R2 | Criatura humanoide delgada de bosque: melena de hojas con bordes cian luminosos, ojos brillantes, garras largas, cola frondosa | 2D pintado (concept art profesional) | "Criatura azul del bosque" (no tiene astas; la cresta hace ese papel) | **Adultos especiales**: bordes emisivos, melenas de hojas y plumas por capas |
| R3 | Bestias emplumadas azules (cuadrúpedos y un ave con astas) con runas en espiral luminosas, en varias vistas "antes/después" | **3D** (modelos de juego) | "Azul y rosa, varios ángulos" (no hay rosa) | **Juvenil y Adulto**: plumaje en capas, runas en espiral, coherencia entre vistas, ojos amarillos brillantes. Se traduce a 2D |
| R4 | Las mismas bestias dentro del juego, con niebla y poca luz | **3D** in-game | (sin descripción propia) | **Lectura de silueta y emisivos en entornos oscuros** (Arena y hábitats nocturnos) |
| R5 | Personajes chibi encapuchados con cara-máscara blanca y llamas azules como cuernos y bordes de capa, en varias poses | 2D cartoon plano | "Criatura azul con llamas" (las llamas son **azules**, no naranjas) | **Elemento integrado en la silueta**: la llama forma parte de la forma, no es un efecto añadido. Hojas de poses |

**Propiedad intelectual (decisión N1):** R2, R3 y R4 son arte de *World of Warcraft* (Blizzard; R2 está firmada por su artista), y R5 recuerda mucho al protagonista de *Hollow Knight*. Se usan **solo como lenguaje visual**. Reglas concretas:
- No se reproduce ninguna criatura, silueta, cara ni marca de estas obras.
- En particular, ningún Tamtam tendrá **capucha con cara-máscara blanca y ojos negros** (rasgo identificativo de R5). Los Umbrálidos mantienen su diseño propio de humo y ojos luminosos.
- Las imágenes no se guardan en el repositorio.

### 11.1 Reglas de estilo derivadas
| Regla | Viene de | Aplicación técnica en TamRig |
|-------|----------|------------------------------|
| **Cejas expresivas** como motor de la expresión (enfado, determinación, tristeza) | R1 | Nuevo slot facial `brows` con estados (`neutral`, `angry`, `sad`, `determined`, `surprised`) |
| **Apéndices grandes que definen la silueta** (cuernos, crestas, orejas) desde el Bebé | R1, R5 | Cada Bebé e Infantil lleva al menos 1 apéndice icónico de su familia (Chispín: llama + **dos cuernitos de brasa**, ver §11.2) |
| **Contorno de color oscuro y grueso**, con más peso abajo | R1 | Ya implementado (trazo inferior); se añade grosor variable por parte |
| **Volumen con degradados suaves** (no solo planos) + brillo especular controlado | R1 | Nuevo: rellenos con **degradado lineal o radial** por parte (`fill: { gradient }`) |
| **Plumaje, hojas y escamas en capas** que se superponen (textura por forma, no por píxel) | R2, R3 | Generador de **mechones procedurales**: N piezas repetidas a lo largo de un hueso, con variación determinista de tamaño y ángulo. Cada mechón tiene follow-through propio |
| **Bordes y runas emisivos** (cian, magenta, oro) sobre bases de valor oscuro | R2, R3, R4 | Nuevo tinte `emissive` + capa de *glow* aditivo (blur) + pulso animado (runas que "respiran") |
| **Ojos luminosos** en formas adultas y juveniles | R2, R3, R4 | Variante de ojo `glow` (iris emisivo sin pupila) para los adultos |
| **Elemento como parte de la anatomía** (llamas-cuerno, colas de agua, astas de cristal) | R5, R2 | Partes elementales con su propio shader animado (ondulación de llama o agua) |
| **Garras y extremidades afiladas** solo a partir del Juvenil | R2, R3 | Progresión de forma: redondo (Bebé) → ángulos (Juvenil) → afilado (Adulto) |
| **Hojas de poses / vistas** como entregable de diseño | R3, R5 | Cada forma se entrega con una hoja de 4 poses antes de animarla |

### 11.2 Qué cambia en Chispín (aplicación inmediata, Fase 2)
Chispín ya sigue la línea de R1 (cuerpo compacto, contorno de color y saturación). Le faltan:
1. **Cejas** (para expresar enfado, determinación y tristeza).
2. **Dos cuernitos de brasa** a los lados de la llama: refuerzan la silueta y anticipan los cuernos de Volcaurio.
3. **Degradado de volumen** en el cuerpo, en lugar de la sombra plana.
4. **Colmillito** visible en la expresión de enfado.
5. **Punta de cola** con ascua (secundaria con follow-through).

### 11.3 Límites honestos de producción (decisión N2)
- El arte que produzco es **vectorial y generado como código** (rutas SVG, degradados y capas). Con las reglas de §11.1 se puede llegar a un acabado cercano a **R1 y R5** (cartoon limpio).
- **No se puede igualar con este método** el acabado pintado de R2 ni el de los modelos 3D de R3 y R4 (texturas pintadas a mano e iluminación volumétrica). Para los adultos se pueden **evocar** (capas, emisivos, runas), no replicar.
- Todo arte provisional se marca como **PLACEHOLDER** en los datos (`artStatus: "placeholder" | "prototype" | "final"`) y en el Rig Lab, y nunca se presenta como final.
- Opciones para el arte final de los adultos: (a) ilustrador o ilustradora 2D, trabajando sobre los rigs existentes; (b) concept art generado con herramientas de imagen como guía, que yo traduzco a vector (coste por generación y consistencia variable); (c) aceptar el estilo vectorial como identidad propia.

---

## 12. Props y animaciones de actividad
- Los **props** (mancuerna, libro, pincel, regadera, tambor, martillo, sartén) son partes con su propio mini-rig que se **enganchan** a los huesos `handL` / `handR` del Tamtam mediante un punto de anclaje. Un mismo clip `train_lift` sirve para todos los Tamtams de un arquetipo.
- Los arquetipos sin manos (serpentinos, flotantes, `blob`) usan **anclaje a la cabeza o la cola**, o telequinesis (el prop flota con un brillo elemental).
- Los muebles siguen la misma dirección de arte: contorno de color, 2 tonos + degradado suave, formas redondeadas y un motivo de familia en los temas.
- **Muebles coherentes:** cada colección (Básica, Bosque, Brasa, Marea, Astral…) comparte paleta y lenguaje de formas. No se mezclan estilos dentro de una colección.
