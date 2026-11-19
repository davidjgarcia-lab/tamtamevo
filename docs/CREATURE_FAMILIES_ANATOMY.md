# Familias anatómicas y locomoción — propuestas visuales (v1)

> Estado: **PROPUESTA PARA VALIDAR**. Texto + reglas. Las hojas de concepto de imagen de estas 15 propuestas
> están **BLOQUEADAS**: el generador de imágenes (plan gratuito de ElevenLabs) alcanzó su límite diario de
> imágenes; se generarán en cuanto haya crédito. Solo Chispín v3 (reptiliano) tiene concepto aprobado e
> implementado en el rig (`docs/media/concept/chispin-v3-reptil.jpg`).

Este documento revisa el **sistema de personajes** (no solo un sprite): anatomía por familia, proporciones,
esqueleto (rig), set de animaciones obligatorio según su forma de moverse y cómo evoluciona cada familia.

## 0. Reglas comunes (sustituyen al estilo "mascota redonda")

| Regla | Detalle |
|---|---|
| **Ojos** | Almendrados o rasgados, **blancos/luminosos** (`#FFF8EC` o emisivo de la familia) con **pupila discreta** (rendija, punto o anillo fino). Nada de ojos negros gigantes de dibujo infantil. Máx. 22% del ancho de la cara en bebé, 14% en adulto. Siempre 1 brillo. |
| **Anatomía reconocible** | Cada criatura se lee como un animal plausible: articulaciones, apoyo de patas, cuello, cola o aletas con función. Nada de "bola con cara". |
| **Detalle** | Mínimo 3 capas de detalle: patrón (manchas, bandas, escamas), estructura (placas, crestas, aletas, membranas) y apéndice elemental (llama, burbuja, niebla, cristal). |
| **Silueta única** | Prueba de silueta negra: las 3 propuestas de cada familia deben distinguirse entre sí y del resto a 48 px. |
| **Materiales** | Brillo controlado (glossy), translucidez, iridiscencia, emisivo, sheen suave, oclusión ambiental en uniones y rim light del hogar. Ver ART_BIBLE §8. |
| **Personalidad** | Atractiva, con actitud (curiosa, orgullosa, traviesa, serena…), **no infantil**: cejas/placas expresivas, boca con dientes o pico, pose con peso. |
| **Animación coherente** | La animación respeta la anatomía y la locomoción de la familia (§6). Un pez no camina; una gelatina no corre a zancadas. |

## 1. Acuáticas (agua) — "Mareálidos"

| # | Propuesta | Silueta y anatomía | Detalle y materiales | Personalidad |
|---|---|---|---|---|
| A1 | **Aletín** — axolote-dragón | Cuerpo alargado, 4 patas cortas palmeadas, **6 branquias plumosas** en abanico, cola-remo vertical | Piel húmeda glossy, branquias translúcidas con emisivo cian en las puntas, motas oscuras en el lomo | Curioso y juguetón, sonrisa ancha con dientes finos |
| A2 | **Marelo** — caballito-serpiente | Vertical en S, hocico tubular, **aleta dorsal de velo**, cola prensil enrollada, sin patas | Escamas iridiscentes nacaradas, aleta de velo translúcida que ondula, ojo con anillo luminoso | Elegante y orgulloso, cejas finas altas |
| A3 | **Brumanta** — manta voladora | Plano en rombo, **alas-aleta** amplias, cola látigo con perla, ojos en los bordes frontales | Dorso azul profundo con bioluminiscencia en puntos, vientre claro, sheen de agua | Sereno y misterioso, mirada entornada |

Rasgos ancla de la familia: **gotas/perlas emisivas**, aletas translúcidas, motas bioluminiscentes.

## 2. Gelatinosas — "Gelíferos"

| # | Propuesta | Silueta y anatomía | Detalle y materiales | Personalidad |
|---|---|---|---|---|
| G1 | **Gelatón** — medusa terrestre | Campana translúcida sobre **4 patas-tentáculo** que se doblan como resortes | Núcleo luminoso visible dentro, burbujas internas, borde de la campana con ondas | Tranquilo pero glotón |
| G2 | **Flanix** — babosa de cristal blando | Cuerpo bajo y largo con **dos antenas oculares**, manto con crestas onduladas | Translucidez ámbar con vetas, rastro brillante, sheen húmedo intenso | Pícaro, sonrisa ladeada |
| G3 | **Burbo** — cubo-limo con caparazón | Masa gelatinosa dentro de un **caparazón poliédrico abierto** (placas), brazos pseudópodos | Gelatina verde-menta translúcida, placas opacas con runas | Testarudo y protector |

Rasgos ancla: **núcleo luminoso interno**, translucidez con burbujas, deformación elástica (squash & stretch real).

## 3. Etéreas (aire/espíritu) — "Etéridos"

| # | Propuesta | Silueta y anatomía | Detalle y materiales | Personalidad |
|---|---|---|---|---|
| E1 | **Velisto** — zorro espectral | Cuadrúpedo esbelto **sin patas traseras** (se disuelven en niebla), 3 colas de humo, orejas largas | Pelaje con degradado a transparente, runas que brillan, ojos blanco puro | Sabio y burlón |
| E2 | **Lumbrela** — polilla-búho | Cuerpo compacto con **cuatro alas** de polilla con ocelos, penacho facial | Alas con escamas iridiscentes y polvo de luz (partículas), plumón suave | Noctámbulo y tímido |
| E3 | **Orbián** — guardián de anillos | Torso flotante con máscara, **brazos separados** del cuerpo, anillos orbitando | Máscara de porcelana con grietas emisivas, anillos de cristal | Solemne, protector |

Rasgos ancla: **partes desconectadas o que se disuelven**, emisivo blanco-violeta, flotación constante.

## 4. Reptilianas (fuego/tierra) — "Brasálidos" (implementado: Chispín v3)

| # | Propuesta | Silueta y anatomía | Detalle y materiales | Personalidad |
|---|---|---|---|---|
| R1 | **Chispín v3** — lagarto de magma (**APROBADO, en el juego**) | Cuadrúpedo bajo, cuello corto, **cresta de 3 llamas**, cola de 4 segmentos con ascua | Placas oscuras con **vetas de magma** emisivas, vientre crema, cuernos cortos, ojo blanco con pupila rendija | Valiente y glotón |
| R2 | **Escorial** — camaleón volcánico | Cola enrollada, ojos-torreta, **casco óseo**, patas prensiles | Escamas que cambian de brasa a ceniza, casco con grietas emisivas | Paciente, observador |
| R3 | **Pirotón** — tortuga-ankylo | Caparazón de **placas de basalto**, maza en la cola, patas columnares | Placas con lava entre juntas, musgo carbonizado | Tranquilo pero imparable |

Rasgos ancla (ya en ART_BIBLE): ojos ámbar/blancos, **llama de tres lenguas**, **ascua en la punta de la cola**.

## 5. Híbridas — "Quimeras"

| # | Propuesta | Silueta y anatomía | Detalle y materiales | Personalidad |
|---|---|---|---|---|
| H1 | **Vaporín** (agua + fuego) | Lagarto con **branquias de vapor** y aletas en la cola | Mitad escamas de magma, mitad piel húmeda; vapor como partícula | Impulsivo |
| H2 | **Cristaluz** (gelatina + etéreo) | Gelatina flotante con **alas de cristal** | Translucidez + iridiscencia, núcleo que pulsa | Soñador |
| H3 | **Mantoso** (aire + tierra) | Ave corredora con **placas de roca** en el pecho y alas cortas | Plumas de humo + placas pétreas | Leal |

Regla de híbridos: hereda **un rasgo ancla de cada familia** y la locomoción dominante del padre con mayor peso genético.

## 6. Locomoción y set de animaciones por familia

| Familia | Locomoción | Clips obligatorios (además de idle, eat, sleep, celebrate, sad, hungry, angry, pet, bathe, hit) | Huesos clave del rig |
|---|---|---|---|
| Acuática | **Nadar, ondular, sumergirse, planear** | `swim` (onda senoidal cabeza→cola), `undulate` (idle en el sitio), `dive` (picado + salpicadura), `glide` (aletas extendidas, sin batir) | Cadena de 5–7 huesos en columna/cola con **follow-through**; aletas como cadenas de 2 |
| Gelatinosa | **Comprimir, expandir, rebotar, estirar** | `squash`, `stretch`, `bounce` (desplazamiento a saltos), `ooze` (arrastre lento) | Huesos de **escala** (sx/sy) con conservación de volumen; núcleo interno separado |
| Etérea | **Levitar, flotar, girar, volar** | `levitate` (idle a 20–30 u del suelo, sombra que respira), `float` (deriva), `spin`, `fly` (batido o deslizamiento) | Raíz con offset vertical permanente; partes desconectadas con **lag** propio |
| Reptiliana | **Caminar, correr, reptar, saltar, atacar** | `walk` (paso diagonal), `run` (galope), `crawl`, `jump`, `attack` (lunge + mordisco) | Cuadrúpedo: 4 patas de 2 segmentos, cuello, cabeza, mandíbula, cola de 4 (**implementado en Chispín v3**: walk, run, attack, hit, train, bathe…) |
| Híbrida | La dominante + 1 clip de la otra familia | p. ej. Vaporín: `walk` + `swim` | Combinación de los anteriores |

El motor (TamRig) ya soporta: cadenas con follow-through procedural, escala por hueso, cruces de clips,
slots faciales (ojos/boca/cejas/prop), emisivos, sheen, gradientes y adornos por nivel de Lustre.
**Falta** (siguiente fase): conservación de volumen automática para gelatinosas y offset de flotación +
sombra dinámica para etéreas/acuáticas fuera del agua.

## 7. Evolución por familia (cómo cambia la anatomía)

| Etapa | Proporción | Cambio anatómico |
|---|---|---|
| Bebé | Cabeza 38–42% de la altura | Rasgos ancla pequeños, ojos algo mayores (sin llegar a "kawaii") |
| Infantil | 32–35% | Aparecen estructuras (placas, aletas largas, colas extra) |
| Juvenil | 26–30% | Silueta definitiva; materiales más complejos |
| Adulto | 20–24% | Máxima complejidad; el **Lustre grabado** añade adornos (oro, runas, corona, halo) |

## 8. Validación (pendiente del usuario)

Para cada familia, elegir **1 de las 3** (o pedir mezcla). Criterios: personalidad suficiente, silueta única,
variedad anatómica respecto a las otras familias. Tras la elección se produce la hoja de concepto,
el rig y los clips como se hizo con Chispín v3.
