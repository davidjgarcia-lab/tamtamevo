# TamTam EVO — Guía de estilo visual (Unity)

Es la biblia visual del juego en Unity 6.3, con URP 2D. El arte de criaturas, objetos y biomas es del usuario y **no se redibuja**.
Este documento fija cómo se ilumina, se gradúa, se escala y se combina ese arte para que todo parezca un único juego.
Fuente de datos: `Assets/TamTam/Data/Evolution/catalog.json` → `families` (los colores salen de ahí).

## 1. Paleta maestra

| Uso | Color | Notas |
|---|---|---|
| Noche del juego (fondos de UI, cielo nocturno) | `#17132B` | Ya es el color de fondo de las cámaras |
| Sombra de contacto | `#0A060E` (alfa 0,62 en el núcleo y 0,38 en la oclusión) | Violeta casi negro, nunca negro puro |
| Luz principal (key) | `#FFE6C8` | Cálida, desde arriba a la izquierda |
| Relleno (ambiente) | `#ECE6FF` × 0,85 | Ligeramente frío |
| Contraluz neutro | `#86A8FF` | Frío; en las criaturas se sustituye por el glow de su familia |
| Destello / UI positiva | `#FFE08A` | |
| Peligro / UI de daño | `#FF4F5E` | |

## 2. Paleta por familia (de `catalog.json`)

| Familia | Nombre | Bases (cuerpo) | Acento | Ojo | Glow (contraluz y emisivo) | Partícula |
|---|---|---|---|---|---|---|
| fire | Brasildo | `#8A2A22` `#6E1E1A` `#A8361E` | `#FF8A2A` | `#FFC247` | `#FFB347` | ascua `#FFD166` |
| water | Aqualin | `#2A6FD6` `#1E5AB8` `#3A86E8` | `#5CE6FF` | `#E6FBFF` | `#9FF0FF` | burbuja `#9FE6FF` |
| plant | Foliaris | `#6E8F2E` `#4F7A2A` `#7A6A3A` | `#B6E35D` | `#E8FFB0` | `#D4FF8A` | hoja/polen `#9BE15D` |
| electric | Voltix | `#2B356B` `#232B5A` `#3A4488` | `#FFD23F` | `#9FE8FF` | `#FFF07A` | chispa `#FFE45C` |
| rock | Rocanix | `#6B5340` `#5A4A3C` `#7A5E44` | `#FF8A2A` | `#FFD580` | `#FFB866` | polvo `#C9A27A` |
| shadow | Umbrin | `#3A1F6B` `#2A1650` `#4B2A86` | `#C77DFF` | `#F2E6FF` | `#D9A8FF` | niebla `#9B6BE0` |
| light | Lúmina | `#F1C6D4` `#F5D8B8` `#E9C0E6` | `#FFD36E` | `#FFFFFF` | `#FFF3C4` | destello `#FFF0B0` |
| crystal | Diamor | `#2C4E9A` `#3A5FB8` `#24407E` | `#9FE4FF` | `#FFFFFF` | `#C8F4FF` | brillo `#C8F4FF` |
| plasma | Plasmax | `#6A2FB8` `#5226A0` `#7B3FD0` | `#FF7BE0` | `#FFFFFF` | `#E3A6FF` | orbe `#E3A6FF` |
| mystic | Mistor | `#2A2E7A` `#3B3F9A` `#4A3E8E` | `#9EE8FF` | `#FFFFFF` | `#FFC2EC` | runa `#FFC2EC` |

El **glow** de la familia es el color del contraluz (rim) de la criatura, de su firma de partículas y de su aura cuando es híbrido.

## 3. Luz

- **Una sola dirección de luz principal: arriba a la izquierda** (unos 45°). La luz principal es cálida (`#FFE6C8`) y está a 0,45–0,6 de intensidad. El arte ya trae su propio sombreado: la luz 2D lo matiza, no lo esculpe de nuevo.
- **Relleno:** luz global a 0,85 (`#ECE6FF`). Nunca por debajo de 0,7: con menos, el arte pintado se ensucia.
- **Contraluz:** desde atrás a la derecha, del color glow de la familia (sección 2), a 0,35–0,5 y solo en el borde (shader, `_RimColor`).
- **Sombras:** contacto `#0A060E` a 0,62; oclusión ambiental 0,38. Las sombras proyectadas 2D (Shadow Caster 2D) solo salen de la luz principal y con una fuerza de 0,35 como máximo.
- **Emisivos** (llamas, cristales, plasma, halos): son los únicos que pasan de 1,0 en HDR y por tanto los únicos con bloom (umbral 1,0).

## 4. Escala y lectura

| Etapa | Alto visible (unidades) | Alto en la habitación | Alto en la Arena |
|---|---|---|---|
| Bebé / inicial | 2,2 | ≈ 0,28 del alto de la pared | ≈ 0,32 de la pantalla |
| Niño (`initial`) | 2,5 × 1,10 | | |
| Juvenil (`intermediate`) | 2,7 × 1,22 | | |
| Adulto (`final`) | 3,0 × 1,34 | ≈ 0,45 | ≈ 0,55 |

- **Pies en el suelo:** el pivote del sprite es la fila opaca más baja (lo comprueba `QaTests.Art_FeetSitOnThePivot`).
- **Márgenes de seguridad:** ninguna criatura pasa del 85 % del alto de la cámara. En la Arena, los luchadores quedan a ±3,2 unidades del centro.
- **Silueta a 48 px:** cada criatura tiene que reconocerse como mancha oscura de 48 px de alto. Por eso se evitan halos o auras que rellenen la silueta (aura de híbrido con una opacidad máxima de 0,3).

## 5. Bordes

El arte llega de orígenes distintos: las hojas de criaturas tienen borde pintado y los muebles de la web tienen línea. Para casarlos:

- **Criaturas:** contorno suave **interior** de 1–2 px de su color base oscurecido. Lo da el rim del shader, sin trazo negro. No se añade contorno exterior.
- **Muebles y props:** misma luz, sombra de contacto y gradación que las criaturas. Las líneas oscuras de los muebles se suavizan con la gradación (contraste −5 en la casa).
- **Fondos:** sin contorno. La viñeta y la desaturación ligera de la gradación los separan del primer plano.

## 6. Gradación de color por escena

Todas las escenas heredan del perfil global `Assets/TamTam/Rendering/TamTamGlobal.asset`: tonemapping neutro, bloom 0,9 con umbral 1,0, viñeta 0,18 y saturación +6. Cada escena solo suma su perfil propio:

| Escena | Perfil | Intención | Ajustes |
|---|---|---|---|
| Habitación · día | `NestHouse_Day` | Luz de ventana, cálida y limpia | exposición +0,1, temperatura +6, contraste −5 |
| Habitación · noche | `NestHouse_Night` | Lámparas y setas: islas de luz en azul | exposición −0,6, temperatura −12, saturación −10, viñeta 0,32 |
| EvolutionLab | `EvolutionLab` | Escaparate: criatura nítida, fondo un paso atrás | contraste +8, viñeta 0,24 |
| Arena | `Arena` | Combate legible: fondo algo apagado | saturación −8 en el fondo (por gradación), viñeta 0,22 |

Luz por bioma de la Arena (contraluz o luz de escena): lava `#FF7A2A` · cueva de cristal `#7FD8FF` · setas `#C77DFF` · bosque `#CFFF9A` ·
cascada `#9FE6FF` · ruinas al atardecer `#FFB070` · islas del cielo `#FFF3C4` · coliseo `#FFD9A0`.

## 7. Lo que no se hace

- No se redibuja ni se sustituye el arte del usuario. No se inventan criaturas.
- No se copia nada de otros juegos.
- Ningún efecto tapa a la criatura. El bloom solo afecta a los emisivos.
