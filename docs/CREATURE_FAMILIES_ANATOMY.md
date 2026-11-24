> **Actualización 2026-11-24:** las familias del juego son ahora las **10 de las hojas de arte**
> (`docs/media/concept/sheets/`): Brasildo, Aqualin, Foliaris, Voltix, Rocanix, Umbrin, Lúmina, Diamor, Plasmax y Mistor.
> Correspondencia con este documento: Magmáridos→Brasildo, Mareálidos→Aqualin, Silváridos→Foliaris, Ferrálidos→Voltix,
> Escamáridos→Rocanix, Umbrálidos→Umbrin, Etéridos→Lúmina, Cristálidos→Diamor y Gelíferos→Plasmax; Mistor es nueva.
> Las propuestas de abajo quedan como referencia de anatomía.

# Familias anatómicas y locomoción — propuestas visuales (v1)

> Estado: **PROPUESTA PARA VALIDAR** (v2: 10 familias × 5 propuestas). Texto + reglas. Las piezas modulares de las 9 familias ya están en el juego (prototipo vectorial, `packages/art/src/modular/`). Las hojas de concepto de imagen de estas 15 propuestas
> están **en curso**: 2 de 9 hechas (Brasardo y Ramollo, `docs/media/concept/families/`); el resto **BLOQUEADAS** por el límite diario de
> imágenes; se generarán en cuanto haya crédito. Solo Chispín v3 (reptiliano) tiene concepto aprobado e
> implementado en el rig (`docs/media/concept/chispin-v3-reptil.jpg`).

Las evoluciones son **aleatorias y combinan piezas de cualquier familia** (EVOLUTION_ALGORITHM.md, >110.000 millones de combinaciones).

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

## 1. Las 10 familias (9 de piezas + Híbridas)

| Familia (código) | Nombre | Elemento | Rasgos ancla | En el juego se consigue sobre todo con… |
|---|---|---|---|---|
| fire | **Magmáridos** | Fuego / lava | vetas de magma, llamas, roca volcánica | combatir y entrenar |
| plant | **Silváridos** | Planta / árbol | corteza, hojas, raíces, flores | mimos y buenos cuidados |
| metal | **Ferrálidos** | Metal | placas, remaches, visor, engranajes | mucho Gimnasio |
| crystal | **Cristálidos** | Cristal | facetas, translucidez, prismas, luz interna | higiene y estudio |
| ghost | **Umbrálidos** | Fantasma / oscuridad | niebla, capucha, ojos sin pupila, levitan | descuido (forma rara, no castigo) |
| water | **Mareálidos** | Agua | aletas, branquias, piel húmeda, burbujas | higiene y minijuegos |
| gel | **Gelíferos** | Gelatina | cuerpo translúcido con núcleo, rebote | minijuegos |
| ether | **Etéridos** | Aire / espíritu | plumas, alas, halo, levitan | mimos y estudio |
| reptile | **Escamáridos** | Tierra / escama | escamas, garras, cuernos, colas con maza | equilibrio entreno/combate/cuidados |
| — | **Híbridas / Quimeras** | Mezcla | ninguna familia tiene la mitad de las piezas | aparece sola al mezclar |

Cada evolución sortea **5 piezas** (cuerpo, cabeza, patas, cola, lomo) más ojos, patrón, colores y mutación
(EVOLUTION_ALGORITHM.md). Las propuestas siguientes son **formas de referencia** de cada familia, ya mezclando
rasgos de otras, para el arte final y para guiar el generador.

## 2. Cinco propuestas por familia

### Magmáridos — fuego / lava
| # | Propuesta | Anatomía y mezcla | Detalle y materiales | Personalidad |
|---|---|---|---|---|
| F1 | **Brasardo** | Lagarto de lava con **cresta de tres llamas** y cola-antorcha (fuego + reptil) | Placas de basalto con vetas emisivas | Valiente, glotón |
| F2 | **Magmón** | Tortuga-volcán: caparazón con **cráter humeante**, patas columnares de roca (fuego + metal) | Lava entre juntas, humo como partícula | Lento e imparable |
| F3 | **Tizombra** | Zorro de ceniza con **brasas en vez de ojos** y cola de humo (fuego + sombra) | Pelaje gris carbón, ascuas que flotan | Travieso, nocturno |
| F4 | **Ígnaro** | Ave corredora con **alas de llama** cortas y cresta de plumas ardientes (fuego + aire) | Plumas con degradado naranja→amarillo | Impulsivo, orgulloso |
| F5 | **Vaporín** | Salamandra anfibia con **branquias de vapor** y aleta caudal (fuego + agua) | Piel húmeda con chispas, vapor | Juguetón, cambiante |

### Silváridos — planta / árbol
| # | Propuesta | Anatomía y mezcla | Detalle y materiales | Personalidad |
|---|---|---|---|---|
| P1 | **Ramollo** | Ciervo pequeño con **cornamenta de rama** florida y patas-raíz | Corteza con musgo, flores rosa | Dulce, protector |
| P2 | **Saucuchi** | Gelatina verde con **brotes y hojas** que crecen de la espalda (planta + gelatina) | Savia translúcida con semillas dentro | Tranquilo, dormilón |
| P3 | **Musgex** | Lagarto tronco con **escamas de corteza** y cola de enredadera (planta + reptil) | Musgo, hongos luminosos | Paciente, gruñón |
| P4 | **Brotiel** | Mariposa-hada con **alas de pétalo** y antenas de semilla (planta + aire) | Pétalos translúcidos, polen dorado | Curioso, risueño |
| P5 | **Espinardo** | Erizo-cactus con **espinas cristalizadas** y flor en la cabeza (planta + cristal) | Púas verdes con puntas de cuarzo | Tímido pero valiente |

### Ferrálidos — metal
| # | Propuesta | Anatomía y mezcla | Detalle y materiales | Personalidad |
|---|---|---|---|---|
| M1 | **Ferrón** | Perro-armadura con **visor luminoso** y placas remachadas | Acero cepillado, sheen fuerte, juntas cobre | Leal, disciplinado |
| M2 | **Cobrardo** | Escarabajo de cobre con **horno en el pecho** (metal + fuego) | Pátina verde, chispas | Trabajador |
| M3 | **Engranino** | Búho mecánico con **engranajes en las alas** y ojos de lente (metal + aire) | Latón, cristal de lente | Sabio, meticuloso |
| M4 | **Acerex** | Pangolín de escamas metálicas que se **enrolla en bola** (metal + reptil) | Escamas de acero superpuestas | Defensivo, testarudo |
| M5 | **Remachín** | Robot-gelatina: **núcleo líquido** dentro de un esqueleto de varillas (metal + gelatina) | Metal + translucidez | Inventor, despistado |

### Cristálidos — cristal
| # | Propuesta | Anatomía y mezcla | Detalle y materiales | Personalidad |
|---|---|---|---|---|
| C1 | **Prismino** | Lince de cristal con **esquirlas en el lomo** que refractan arcoíris | Facetas, translucidez, luz interna | Elegante, frío |
| C2 | **Cuarzardo** | Dragón pequeño con **cuernos de cuarzo** y cola-cristal (cristal + reptil) | Escamas mate + cristales emisivos | Orgulloso |
| C3 | **Geodín** | Armadillo-geoda: **por fuera roca, por dentro amatista** al abrirse (cristal + metal) | Contraste rugoso/brillante | Reservado |
| C4 | **Gemiel** | Medusa de cristal flotante con **tentáculos de hielo** (cristal + aire + agua) | Iridiscencia, partículas de escarcha | Serena |
| C5 | **Facetombra** | Gato de obsidiana con **ojos de luz** y facetas negras (cristal + sombra) | Vidrio volcánico, reflejos violeta | Misterioso |

### Umbrálidos — fantasma / oscuridad
| # | Propuesta | Anatomía y mezcla | Detalle y materiales | Personalidad |
|---|---|---|---|---|
| U1 | **Umbrardo** | Lobo de niebla **sin patas traseras** (se disuelven), capucha de sombra | Humo, ojos blancos sin pupila | Solitario, leal a quien vuelve |
| U2 | **Velombra** | Polilla nocturna con **alas con ojos** pintados y antenas plumosas (sombra + aire) | Polvo de luz violeta | Tímida |
| U3 | **Farolín** | Rana-espectro con **farolillo** colgando de la cabeza (sombra + agua) | Piel translúcida oscura, luz cálida | Bromista |
| U4 | **Nieblex** | Serpiente de humo con **máscara de hueso** (sombra + reptil) | Máscara mate, cuerpo que se deshace | Solemne |
| U5 | **Sombruchi** | Gelatina negra con **estrellas dentro** (sombra + gelatina) | Translucidez con puntos de luz | Soñador |

### Mareálidos — agua
| # | Propuesta | Anatomía y mezcla | Detalle y materiales | Personalidad |
|---|---|---|---|---|
| A1 | **Aletín** | Axolote-dragón con **6 branquias plumosas** y cola-remo | Piel glossy, puntas cian emisivas | Curioso |
| A2 | **Marelo** | Caballito-serpiente con **aleta de velo** y cola prensil | Escamas nacaradas iridiscentes | Elegante |
| A3 | **Brumanta** | Manta voladora con **bioluminiscencia** y cola-látigo (agua + aire) | Puntos de luz, sheen de agua | Serena |
| A4 | **Coralón** | Cangrejo-tortuga con **arrecife de coral** en el caparazón (agua + metal + planta) | Coral rosa, conchas | Hogareño |
| A5 | **Perlina** | Nutria con **perla luminosa** en la frente y bigotes-aleta (agua + cristal) | Pelaje húmedo, perla emisiva | Juguetona |

### Gelíferos — gelatina
| # | Propuesta | Anatomía y mezcla | Detalle y materiales | Personalidad |
|---|---|---|---|---|
| G1 | **Gelatón** | Medusa terrestre: campana sobre **4 patas-resorte** | Núcleo luminoso, burbujas | Glotón |
| G2 | **Flanix** | Babosa de cristal blando con **antenas oculares** | Ámbar translúcido, rastro brillante | Pícaro |
| G3 | **Burbo** | Limo dentro de un **caparazón poliédrico abierto** (gelatina + metal) | Placas con runas | Protector |
| G4 | **Mochiel** | Bola elástica con **alitas** y cola de nube (gelatina + aire) | Mate suave, rubor | Alegre |
| G5 | **Lavuchi** | Gelatina de **magma** con piedras flotando dentro (gelatina + fuego) | Translucidez naranja, emisivo | Temperamental |

### Etéridos — aire / espíritu
| # | Propuesta | Anatomía y mezcla | Detalle y materiales | Personalidad |
|---|---|---|---|---|
| E1 | **Velisto** | Zorro espectral con **3 colas de viento** y orejas largas | Pelaje que se vuelve transparente | Sabio, burlón |
| E2 | **Lumbrela** | Polilla-búho con **cuatro alas** de ocelos | Escamas iridiscentes | Noctámbulo |
| E3 | **Orbián** | Guardián con máscara y **anillos orbitando** | Porcelana con grietas de luz | Solemne |
| E4 | **Céfiriel** | Grulla-lagarto con **alas de pluma** y cuello largo (aire + reptil) | Plumas blancas, escamas en las patas | Noble |
| E5 | **Nimbollo** | Oveja-nube con **cuernos de rama** y lluvia ligera (aire + planta + agua) | Lana-nube, hojas | Tranquila |

### Escamáridos — tierra / escama
| # | Propuesta | Anatomía y mezcla | Detalle y materiales | Personalidad |
|---|---|---|---|---|
| R1 | **Chispín** (bebé, implementado) | Lagarto cuadrúpedo con **cresta de llamas** y cola con ascua (reptil + fuego) | Vetas de magma, ojo blanco con rendija | Valiente, glotón |
| R2 | **Escorial** | Camaleón con **ojos-torreta** y casco óseo | Escamas que cambian de color | Observador |
| R3 | **Garrex** | Dinosaurio corredor con **maza en la cola** y placas dorsales | Escamas mate, placas pulidas | Feroz |
| R4 | **Drácoral** | Lagarto marino con **aletas** y cuernos de coral (reptil + agua) | Escamas azules, coral rosa | Aventurero |
| R5 | **Sauromusgo** | Iguana anciana con **musgo y flores** en el lomo (reptil + planta) | Corteza, líquenes | Paciente |

### Híbridas / Quimeras (emergentes)
| # | Propuesta | Mezcla | Rasgo |
|---|---|---|---|
| H1 | **Vaporín** | fuego + agua | Branquias de vapor |
| H2 | **Cristaluz** | gelatina + cristal + aire | Gelatina con alas de cristal |
| H3 | **Mantoso** | aire + reptil + metal | Ave corredora con placas |
| H4 | **Ferrombra** | metal + sombra | Armadura vacía con niebla dentro |
| H5 | **Florarco** | planta + cristal + fuego | Árbol de brasas con frutos de cuarzo |

Regla: Quimera = ninguna familia aporta ≥ 50% de las piezas; hereda **un rasgo ancla de cada familia** presente.

## 6. Locomoción y set de animaciones por familia

| Familia | Locomoción | Clips obligatorios (además de idle, eat, sleep, celebrate, sad, hungry, angry, pet, bathe, hit) | Huesos clave del rig |
|---|---|---|---|
| Acuática | **Nadar, ondular, sumergirse, planear** | `swim` (onda senoidal cabeza→cola), `undulate` (idle en el sitio), `dive` (picado + salpicadura), `glide` (aletas extendidas, sin batir) | Cadena de 5–7 huesos en columna/cola con **follow-through**; aletas como cadenas de 2 |
| Gelatinosa | **Comprimir, expandir, rebotar, estirar** | `squash`, `stretch`, `bounce` (desplazamiento a saltos), `ooze` (arrastre lento) | Huesos de **escala** (sx/sy) con conservación de volumen; núcleo interno separado |
| Etérea | **Levitar, flotar, girar, volar** | `levitate` (idle a 20–30 u del suelo, sombra que respira), `float` (deriva), `spin`, `fly` (batido o deslizamiento) | Raíz con offset vertical permanente; partes desconectadas con **lag** propio |
| Reptiliana | **Caminar, correr, reptar, saltar, atacar** | `walk` (paso diagonal), `run` (galope), `crawl`, `jump`, `attack` (lunge + mordisco) | Cuadrúpedo: 4 patas de 2 segmentos, cuello, cabeza, mandíbula, cola de 4 (**implementado en Chispín v3**: walk, run, attack, hit, train, bathe…) |
| Fuego, Planta, Metal, Cristal | Caminar (como reptil); Metal más pesado, Cristal más rígido | `walk`, `run`, `attack`; Planta: `root` (se planta), Metal: `stomp` | Mismo cuadrúpedo |
| Sombra (fantasma) | **Levitar**, desvanecerse | `levitate`, `fade`, `phase` | Raíz elevada (implementado: flota 14 u), estelas en lugar de patas |
| Híbrida | La de sus patas (la pieza 'patas' decide) | p. ej. Vaporín: `walk` + `swim` | Combinación de los anteriores |

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

Para cada familia, marcar las propuestas favoritas de las 5 (o pedir mezclas). Criterios: personalidad suficiente, silueta única,
variedad anatómica respecto a las otras familias. Tras la elección se produce la hoja de concepto,
el rig y los clips como se hizo con Chispín v3.
