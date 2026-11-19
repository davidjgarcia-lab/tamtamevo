# CHARACTER ART BIBLE — TamTam Evolution (marca visual: TamTam EVO)

> Versión 1.1 · 2026-11-19 · Estado: **aprobada** (con la ampliación de efectos mágicos de §8)
> Fuente de verdad visual para **toda** criatura (Tamtam), mueble y efecto. Si algo contradice ART_DIRECTION.md, prevalece este documento.
> Referencias: las 5 imágenes del brief v3.0, usadas solo como **lenguaje visual** (ART_DIRECTION §11). Ningún diseño reproduce personajes, siluetas o caras de obras existentes.
> Concept art de la primera especie: `docs/media/concept/` (generado con IA a partir de esta biblia y marcado como **CONCEPTO**, no como asset de juego).

---

## 0. Principios en una página

| # | Principio | Se comprueba con |
|---|-----------|------------------|
| 1 | **La silueta lo dice todo.** Cada forma se reconoce en negro a 64 px | Lámina de siluetas (§3.4) |
| 2 | **Cara primero.** Ojos grandes y cejas cuentan la emoción antes que el cuerpo | Biblioteca de expresiones (§5) |
| 3 | **El elemento es anatomía.** Llamas, agua, cristal o humo forman parte del cuerpo, no se pegan encima | Revisión de diseño |
| 4 | **De lo blando a lo afilado.** Bebé = curvas; Adulto = curvas + ángulos + puntas | Tabla de proporciones (§2) |
| 5 | **Un acento brillante por criatura.** Un solo color emisivo domina los efectos | Paleta (§4) |
| 6 | **Nunca negro puro.** Contornos y sombras son tonos oscuros del color de la familia | Validador de paleta |
| 7 | **Siempre vivo.** Ninguna criatura está totalmente quieta en pantalla | Guía de animación |

---

## 1. Identidad visual general

| Aspecto | Regla |
|---------|-------|
| **Estilo** | 2D cartoon de videojuego comercial. Formas vectoriales limpias con volumen pintado suave. Entre la mascota digital adorable (bebés) y el bestiario fantástico (adultos). |
| **Contorno** | Línea de **color** (tinta de familia, §4). Grosor relativo a la altura del personaje `H`: **exterior 2,6% de H** y **interior 1,2% de H**. El trazo exterior es más grueso en la parte inferior (+30%) y se adelgaza en las puntas (cuernos, llamas). Las partes emisivas (llamas, runas) **no llevan contorno**: su borde es luz. |
| **Sombras** | 2 niveles: **sombra media** (tono −13 L en OKLCH y hue +10° hacia el cálido-oscuro) y **oclusión** en uniones (cuello, axilas, bajo la barriga) al 60% de opacidad. La luz principal viene de **arriba a la izquierda** (45°). |
| **Degradados** | Un degradado suave vertical por masa principal (cuerpo y cabeza): luz +6 L arriba → base → sombra abajo. Nunca degradados de colores distintos en la misma masa salvo en partes elementales. |
| **Iluminación** | Key light cálida y neutra + **rim light** del color del hábitat o la casa (1,5% de H en el borde opuesto a la luz) + **luz propia** de las partes emisivas sobre el cuerpo (glow aditivo). |
| **Brillos** | Especular **controlado**: 1 brillo grande + 1 pequeño en ojos, 1 brillo elíptico en la masa superior del cuerpo (blanco al 75%). Las superficies cristalinas o húmedas pueden tener 2–3. |
| **Texturas** | No hay texturas de píxel. La "textura" se construye **con formas**: escamas, plumas, hojas, grietas o cristales en capas (generador de mechones del rig). Para adultos se permite un *grain* sutil (2%) solo en el render del Códice. |
| **Saturación** | Alta en el personaje (croma OKLCH 0,12–0,20), media-baja en fondos (−30%). Los emisivos son la saturación máxima de la escena. |
| **Contraste** | Personaje frente a fondo ≥ 3:1 en luminancia en el contorno. Ojos frente a cara ≥ 4,5:1. |
| **Nivel de detalle** | Por etapa: Bebé ≤ 12 formas visibles · Infantil ≤ 20 · Juvenil ≤ 35 · Adulto ≤ 60 (sin contar partículas). |
| **Acabado** | Cada forma entregada incluye: frontal, 3/4, lateral, trasera, silueta, paleta, expresiones, hoja de poses y rig (§7). |

---

## 2. Proporciones por etapa

`H` = altura total del personaje en reposo (sin efectos). La cabeza se mide en "cabezas" (`C`).

| Regla | **Bebé** | **Infantil** | **Juvenil** | **Adulto** |
|-------|----------|--------------|-------------|------------|
| Altura relativa en pantalla | 1,0 | 1,35 | 1,8 | 2,4–3,2 |
| Cabeza / cuerpo | 1 : 0 (cabeza = cuerpo) o 1 : 0,4 | 1 : 1 | 1 : 2 | 1 : 3–5 (o anatomía no humanoide) |
| Ancho de los ojos (respecto a la cara) | 30–36% cada ojo | 24–28% | 16–20% | 8–14% (pueden ser luminosos, sin pupila) |
| Altura de los ojos en la cara | Mitad inferior (cara de bebé) | Centro | Centro-alto | Alto, mirada más intensa |
| Extremidades | Muñones (≤ 12% de H) | Cortas con 3 dedos (≤ 25%) | Largas, articuladas, garras romas | Largas y potentes, garras y pezuñas definidas |
| Forma de la cabeza | Círculo o gota | Óvalo, aparece el hocico | Óvalo + mandíbula marcada | Angulosa, con estructuras (cuernos, crestas) |
| Cola | 0–25% de H | 30–50% | 60–100% | 80–200% (o alas o tentáculos equivalentes) |
| Orejas y cuernos | Muñones (≤ 10% de H) | 15% | 25% | 30–60% (definen la silueta) |
| Postura | Sentada o erguida, ligeramente hacia atrás | Erguida, curiosa, inclinada hacia delante | Dinámica, peso en las patas delanteras | Imponente; frontal o de perfil heroico |
| Centro de gravedad | Muy bajo (30% de H): "tentetieso" | 40% | 50% | Según la anatomía (voladores ≈ 60%) |
| Elemento | 1 rasgo (llama, gota, brote…) | 2–3 rasgos | Rasgos en recorrido (melena, aleta dorsal) | Elemento estructural (volcán, arrecife, árbol) + VFX |
| Formas dominantes | Círculos | Óvalos | Óvalos + triángulos | Triángulos + curvas en S |

```
Altura relativa (cada █ = 0,25)
BEBÉ      ████
INFANTIL  █████▌
JUVENIL   ███████▏
ADULTO    ██████████  – █████████████
```

Diagrama de proporciones: `docs/media/art-bible/proportions.svg`.

---

## 3. Anatomía modular

### 3.1 Bloques de construcción
Cada especie se construye combinando **módulos**. No todas las especies tienen todos.

| Módulo | Variantes de arquetipo | Huesos del rig | Reglas |
|--------|------------------------|----------------|--------|
| **Cabeza** | redonda, hocico, pico, máscara-cristal | `head`, `jaw` | Siempre la masa más legible. En Bebé = cuerpo. |
| **Torso** | blob, barril, esbelto, serpentino | `body`, `chest`, `spine_1…n` | Define el arquetipo de rig. |
| **Extremidades** | ninguna, muñones, bípedo, cuadrúpedo, aletas | `arm_*`, `leg_*`, `foot_*` | Máximo 4 patas + 2 brazos. Los dedos se cuentan: 3 (Infantil y Juvenil), 3–4 (Adulto). |
| **Ojos** | grandes con pupila, felinos, luminosos sin pupila | `eyeL`, `eyeR` | Siempre 2 (salvo diseño especial aprobado). Mínimo 2 brillos. |
| **Cejas** | trazo, mechón, placa | `browL`, `browR` | **Obligatorias** en todas las etapas (motor de la expresión). |
| **Boca** | gato "w", pico, hocico, mandíbula | `mouth`, `jaw` | Colmillo visible solo en enfado o competición (Bebé e Infantil). |
| **Nariz** | ninguna, punto, hocico | — | Opcional; nunca protagonista. |
| **Orejas** | muñón, punta, aleta, pluma | `earL`, `earR` | Con follow-through. |
| **Cuernos** | muñón, curvo, ramificado, cristal | `horn_*` | Crecen por etapa (§2). Estáticos, con un leve rebote en impactos. |
| **Alas** | membrana, pluma, cinta elemental, nube | `wing_*` con 2–3 segmentos | Solo desde Juvenil. Plegables. |
| **Cola** | muñón, cola larga, abanico, cinta | `tail_1…n` | Cadena con follow-through (retardo de 0,06 s por segmento). |
| **Elemental** | llama, gota, hoja, chispa, humo, rayo de luz, cristal, nebulosa | `elem_*` | Sin contorno, emisivo, animado de forma procedural. |
| **Decoración natural** | marcas, runas, manchas, escamas | sobre `body` | Las runas son emisivas; las marcas, tintes. |
| **Accesorios** | collar, pañuelo, gafas (cosméticos) | anclas `acc_head`, `acc_neck` | Nunca tapan los ojos ni rompen la silueta. |

### 3.2 Arquetipos de rig
`blob` (Bebé redondo) · `biped_small` · `quadruped_light` · `quadruped_heavy` · `serpentine` · `flyer` · `floater`.
Las dos ramas adultas de una familia **deben** usar arquetipos distintos.

### 3.3 Herencia visual entre etapas
Cada familia define **3 rasgos ancla** que aparecen en las 4 etapas transformándose. Fuego: (1) ojos ámbar, (2) motivo de **llama de tres lenguas**, (3) **ascua en la punta de la cola**. Así un jugador reconoce a "su" Tamtam aunque cambie de anatomía.

### 3.4 Prueba de silueta
Cada forma, rellena en negro a 64 px de alto, debe identificarse entre todas las formas de la misma etapa (prueba con 3 personas, ≥ 90% de aciertos). Si falla, se cambia el apéndice principal, nunca el color.

---

## 4. Paletas

Formato de cada paleta: **Base · Base-luz · Base-sombra · Acento · Emisivo · Tinta (contorno) · Ojos · Rim light del hogar**.
Los tonos de luz y sombra se **derivan automáticamente** en OKLCH (`packages/rig/src/palette.ts`); los HEX listados son los de referencia del alelo dominante.

| Familia | Base | Luz | Sombra | Acento | Emisivo | Tinta | Ojos |
|---------|------|-----|--------|--------|---------|-------|------|
| Fuego · Brasálidos | `#FF6B35` | `#FF9566` | `#D9461B` | `#FFB627` | `#FFE08A` | `#5A1426` | `#FFB627` iris, `#2A1430` pupila |
| Agua · Marélidos | `#2EC4F1` | `#7CDDF7` | `#1B8FC4` | `#4361EE` | `#B8F4FF` | `#102A5C` | `#4361EE` iris |
| Naturaleza · Brotálidos | `#5BC85B` | `#8FDB7A` | `#33964A` | `#FF8FB1` | `#E6FF8A` | `#1C4224` | `#3A9E4F` iris dorado |
| Electricidad · Voltíidos | `#FFD60A` | `#FFE76B` | `#D9A400` | `#00E0FF` | `#FFFBD1` | `#3D2A00` | `#00B8D9` iris |
| Oscuridad · Umbrálidos | `#5A3D8A` | `#7A5DB0` | `#3A2560` | `#C77DFF` | `#E3B8FF` | `#140A24` | `#C77DFF` luminosos |
| Luz · Lumálidos | `#FFF4D6` | `#FFFFFF` | `#E8CF9A` | `#FFD166` | `#FFF1B0` | `#7A5A2E` | `#FF9EC7` iris |
| Tierra · Terrálidos | `#C68B59` | `#DDAA7A` | `#9A6438` | `#7EE8C7` | `#B9FFE9` | `#3B2416` | `#2F8F75` iris |
| Cosmos · Astrálidos | `#3A0CA3` | `#5A33C4` | `#25077A` | `#F72585` | `#4CC9F0` | `#0B0630` | `#4CC9F0` luminosos |

**Reglas de uso**
1. Distribución por criatura: **60% base, 25% acento (y luz), 10% sombra y tinta, 5% emisivo**.
2. Los emisivos solo se usan en partes elementales, runas y ojos adultos.
3. **No son recoloraciones.** Cada familia cambia también su **forma** dominante, la textura por formas y el tipo de elemento (ART_DIRECTION §2.1). Una prueba de aprobación es poner las 8 formas Bebé en escala de grises: deben seguir distinguiéndose.
4. **Variantes genéticas:** cada familia tiene de 4 a 6 alelos de color base (rango D, I o R; EVOLUTION_SYSTEM §6.2). Un alelo cambia `Base` y `Acento`; el resto se deriva.
5. **Variantes raras (mutaciones):** *Iridiscente* (el hue de la base gira ±25° con el tiempo), *Melánico* (base con L 0,25 y emisivo intacto), *Albino* (base con L 0,92 y croma 0,02, ojos rosa `#FF6F91`), *Quimera* (dos bases divididas por un eje vertical suave).
6. Contraste mínimo de la tinta frente a la base de 2,5:1 en todos los alelos (test automático).

Fuego — alelos de referencia: Brasa `#FF6B35` (D) · Ceniza `#8F8794` (I) · Oro Fundido `#FFB000` (I) · Rubí Profundo `#C81D4E` (R) · Azul Llama `#3A6FE0` (R, con llama cian).

---

## 5. Biblioteca de expresiones

Slots faciales del rig: `eyes`, `brows`, `mouth`, más `cheeks` (rubor) y un modificador de **postura** que el animador aplica como capa aditiva.

| Expresión | Ojos | Cejas | Boca | Postura / extras |
|-----------|------|-------|------|------------------|
| **Feliz** | Abiertos, brillo grande | Arqueadas suaves, arriba | Sonrisa "w" | Rebote suave, cola alegre |
| **Muy feliz / cariñoso** | Cerrados `^ ^` | Relajadas, altas | Abierta contenta con lengua | Balanceo, rubor ×1,4, corazones |
| **Triste** | Abiertos, pupila abajo, brillo pequeño | Caídas por fuera ( / \ ) | Curva hacia abajo | Cabeza baja, elemento atenuado (llama al 60%) |
| **Enfadado** | Entornados (párpado superior al 35%) | En V marcadas | Recta con colmillo | Cuerpo hacia delante, humo o chispas, elemento ×1,3 |
| **Sorprendido** | Muy abiertos, pupila pequeña | Muy arriba | "O" pequeña | Salto de 6% de H, elemento en pico |
| **Dormido** | Cerrados curvados hacia abajo | Relajadas | "o" pequeña | Respiración lenta y amplia, Zzz, elemento al 35% |
| **Hambriento** | Abiertos, mirada a la comida | Arriba en el centro | Abierta con baba | Se toca la tripa, ruido de tripa |
| **Enfermo / indispuesto** | Semicerrados, espiral leve | Caídas | Ondulada | Tono base −15% de croma, tiritona, gotita de sudor |
| **Juguetón** | Uno guiñado | Una arriba | Lengua fuera | Salta de lado, cola en látigo |
| **Curioso** | Abiertos, pupila hacia el objeto | Una arriba | Pequeña "o" lateral | Cabeza ladeada 12° |
| **Asustado** | Muy abiertos, pupila temblorosa | Arriba y juntas | Dientes apretados | Encogido (sy 0,9), temblor de 8 Hz |
| **Orgulloso** | Entornados, brillo arriba | Planas y seguras | Sonrisa ladeada | Pecho fuera, barbilla arriba |
| **Competitivo** | Pupila afilada, brillo intenso | En V suave | Sonrisa con colmillo | Postura de guardia, elemento ×1,2 |
| **Cansado** | Párpados al 50% | Caídas | Bostezo periódico | Hombros caídos, se tambalea |

Regla de adaptación: en especies sin boca visible (p. ej. máscaras de cristal) la emoción la llevan cejas, ojos y **elemento**; en especies sin cejas anatómicas se usan **placas o mechones** sobre los ojos que cumplen la misma función.

---

## 6. Guía de animación (resumen; detalle en CHARACTER_ANIMATION_GUIDE.md)

**Sistema elegido:** rig esqueletal vectorial propio **TamRig** (aprobado en D3) con clips por keyframes, capas procedurales (respiración, parpadeo, follow-through) y partículas sin estado. Spritesheets solo para VFX rasterizados; Spine descartado (no tiene runtime RN mantenido); Rive como alternativa si se incorpora un animador.

Principios: **anticipación** antes de toda acción con impacto (8–15% de la duración), **follow-through** en colas, orejas y llamas (retardo de 0,06–0,22 s), **ease in/out** cúbico por defecto, **squash & stretch** limitado a ±8% (Bebé ±12%), arcos en todo movimiento y ninguna pose perfectamente simétrica en reposo.

---

## 7. Documentación obligatoria de cada personaje

| Entregable | Formato | Estado para la primera especie |
|------------|---------|--------------------------------|
| Vistas: frontal, 3/4, lateral, trasera | Hoja de concepto | Concepto de Chispín generado (`docs/media/concept/`) |
| Silueta | PNG en negro | Concepto |
| Paleta | Tabla HEX + muestra | ✅ §4 |
| Expresiones | Hoja | Concepto de Chispín (6 de 14) |
| Hoja de poses | Hoja | Pendiente |
| Hoja de animaciones | Tabla de clips + GIF/vídeo | Spike (5 clips) |
| Detalles anatómicos | Notas en CHARACTER_DESIGN_FIRST_TAMTAM.md | ✅ |
| Rig | `packages/art/src/<familia>/<forma>.ts` | Chispín (rig v2 en curso) |

Las hojas de concepto generadas con IA son **referencias de diseño**: guían el redibujo vectorial del rig y **nunca** se usan como asset final en el juego.

---

## 8. Magia y calidad: emisivos, halos, sheen y Lustre

Petición aprobada: los Tamtams deben tener **efectos de emisivo, halos, sheen** y detalles que les den calidad y magia. Esos efectos **se ganan**: dependen del **Lustre** (cómo se ha cuidado, entrenado, limpiado y combatido) y quedan **grabados en cada evolución**.

### 8.1 Efectos (implementados en el renderer, `apps/mobile/src/creature/draw.ts`)
| Efecto | Qué es | Regla de arte |
|--------|--------|---------------|
| **Emisivo + bloom** | Las partes marcadas `emissive` (llamas, ascuas, runas, pecas doradas) brillan; con intensidad > 1 se añade un pase de *bloom* difuminado | Solo partes elementales u ornamentales; nunca la piel base |
| **Halo** | Gradiente radial + anillo difuso detrás del Tamtam; el Legendario añade luces en órbita | Color = emisivo de la familia |
| **Sheen** | Banda de luz diagonal que recorre el cuerpo cada 3,2 s (recortada a la silueta) | Solo en masas grandes (cuerpo, caparazón, alas) |
| **Destellos** | Estrellas de 4 puntas que parpadean alrededor | Radiante y Legendario |
| **Saturación** | Filtro de color sobre la criatura | Apagado al 55%; Legendario al 114% |
| **Densidad de partículas** | Multiplicador de todos los emisores | ×0,35 (Apagado) a ×1,7 (Legendario) |

### 8.2 Niveles de Lustre y adornos físicos
| Nivel | Puntuación | Aspecto | Adornos de la forma (ejemplo: Chispín) |
|-------|------------|---------|----------------------------------------|
| **Apagado** | < 30 | Desaturado, llama débil, pocas ascuas | Manchas de hollín (3) |
| **Común** | 30–49 | Algo apagado | Manchas de hollín (2) |
| **Vivo** | 50–69 | Aspecto base y limpio, sheen suave | — |
| **Radiante** | 70–87 | Halo, destellos y sheen marcado | Pecas doradas emisivas y 2 lenguas de llama extra |
| **Legendario** | ≥ 88 (requiere Arena) | Halo doble con luces en órbita, bloom fuerte | Runa luminosa en la barriga y corona de ascuas |

Cada forma nueva debe diseñar sus adornos por nivel (`tiers: [min, max]` en las partes del rig). Regla: **las formas descuidadas son menos vistosas, no feas ni grotescas**. Siguen siendo adorables, pero sin magia.

Comparativa real: `docs/media/lustre-tiers.jpg`.
