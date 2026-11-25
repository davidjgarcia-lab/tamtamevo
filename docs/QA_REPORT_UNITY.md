# QA — TamTam EVO en Unity (2026-11-25)

Unity 6000.3.29f1 · URP 2D · Windows. Pruebas automáticas en `Assets/TamTam/Tests/` (Window ▸ General ▸ Test Runner).

## Resultado

| Suite | Casos | Resultado |
|---|---|---|
| EditMode · `QaTests` (batería QA) | 335 | **335 pasan** (8 avisos PROVISIONAL, ver abajo) |
| EditMode · `GeneticsParityTests` | 18 | 18 pasan (paridad con la web, sin tocar valores) |
| EditMode · `EvolutionDataTests` · `ChispinAssetTests` | 5 | 5 pasan |
| PlayMode · `LabPlayTests` | 3 | 3 pasan (EvolutionLab hasta Adulto, Arena en 8 biomas, casa-nido) |
| **Total** | **361** | **361 pasan** |

## Qué cubre la batería QA (por perfil)

| Perfil | Comprobación | Casos |
|---|---|---|
| Artista 2D | Pies en el pivote (fila opaca más baja) · altura visible por etapa · nitidez ≥ 380 px de cuerpo · sin recortes del lienzo · mipmaps/filtrado/alfa · registrado en FamilyArt | 6 × 41 = 246 |
| Tester de juego | Cada familia crece por etapas · 5 estilos de cuidado × 3 semillas llegan a Adulto con nombre y arte pintado | 10 + 15 |
| Artista de entornos | Biomas: anchura y aspecto, opacos, exposición legible · muebles sin borde de lienzo visible | 24 + 14 |
| Artista 3D / iluminación | Cámara ortográfica y luz global 2D · sin scripts perdidos · sombras de contacto · sin sprites vacíos (4 escenas) · color lineal, URP HDR, bloom + tonemapping, oclusión de contacto en los materiales | 16 + 6 |
| UX / sensación de juego | La sombra de contacto se encoge y se desvanece al saltar (4 alturas) | 4 |
| PlayMode | Pulsa los botones de EvolutionLab hasta Adulto (sombra y pies en el suelo en cada paso) · Arena: luchadores en el suelo y fondo que cubre la pantalla en los 8 biomas · casa-nido renderiza | 3 |

## Defectos encontrados y corregidos

1. **Criaturas flotando** (Arena, EvolutionLab): el pivote estaba en el borde de la imagen y no en los pies. Ahora el importador mide la fila opaca más baja y ajusta el tamaño por el cuerpo visible. Un primer intento tenía una división entera (pivote = 0) y los tests lo detectaron.
2. **Suelo de cada bioma a distinta altura**: `BiomeFloor` guarda la línea de suelo de cada fondo y encaja el fondo para que su suelo quede bajo los pies, sin dejar de cubrir la pantalla.
3. **Criaturas pequeñas en EvolutionLab**: la cámara está reencuadrada para un Adulto, con los pies al 18 % desde abajo, y el fondo es el hábitat de la familia dominante (`HabitatBackdrop`).
4. **Halo rectangular de la lámpara** (casa-nido): ahora se difumina el brillo semitransparente hacia el borde del lienzo. Además, el exportador web ya da márgenes más anchos.
5. **`PaintedCreature` se perdía al guardar escenas**: estaba dentro de `FamilyArt.cs` y Unity exige que la clase y el archivo se llamen igual. Ahora vive en su propio archivo.
6. **`??` con componentes de Unity**: un "null falso" impedía crear las sombras. Ahora se comprueba de forma explícita.
7. **Fondo de EvolutionLab vacío en el editor**: ya se ve antes de pulsar Play.

## Mejoras añadidas

- **Sombra de contacto + oclusión ambiental** (`GroundShadow`): un núcleo oscuro bajo los pies y una mancha amplia y suave. Se encogen y se desvanecen al saltar o flotar. Se aplican a criaturas, a Chispín y a los muebles del suelo.
- **Oclusión de contacto en el shader** (`TamTam/CreatureLit`, `_GroundAO`): la pintura se oscurece suavemente donde toca el suelo.
- **Luces y post-proceso en EvolutionLab y Arena**: luz principal cálida, contraluz frío, bloom y tonemapping.

## PROVISIONAL / pendiente

- **Biomas de baja resolución** (≈ 640 × 340 px de origen): se ven blandos en móvil, y más porque ahora se amplían para alinear el suelo. No se redibujan, porque el arte es del usuario. Hace falta una versión de mayor resolución del mismo arte. El test lo marca como aviso.
- **Líneas de suelo de los biomas medidas a ojo** (`BiomeFloor`): revisar si cambia algún fondo.
- **Aura de híbrido**: es un disco translúcido plano y se lee como un círculo. Mejorarla con VFX (fase de iluminación/VFX).

Capturas: `docs/media/unity/evolution-lab.png`, `arena-biomes.png`, `nest-house.png`, `chispin-painted-clips.png`.

## Pasada de estudio (2026-11-25, tarde)

| Suite | Resultado |
|---|---|
| EditMode (QaTests 335 + paridad 18 + datos 2 + Chispín 3) | **358/358** |
| PlayMode (`LabPlayTests` 3 + `StudioPlayTests` 6) | **9/9** |

`StudioPlayTests` comprueba que:
- los 11 iniciales tienen rig de 2D Animation (SpriteSkin con huesos de cuerpo y cabeza), sombra de contacto y VFX de familia, y que reproducen 10 clips sin errores;
- 3 líneas evolutivas completas (Brasildo · Guerrero, Aqualin · Mimado, Umbrin · Descuidado) llegan a su forma final y aparece un híbrido con aura de partículas;
- la casa tiene la seta luminosa, el cristal azul y las rocas con musgo, y de noche se encienden sus luces;
- la Arena funciona en lava, cueva de cristal y setas, con golpe o crítico;
- el rendimiento queda por debajo de 33 ms;
- se graban los GIF.

**Rendimiento** (editor de Unity, escritorio Windows, 1920×1080; **no es un Android**): EvolutionLab 1,8 ms/frame (≈565 fps),
68 draw calls, 4 k triángulos; Arena 1,8 ms/frame (≈550 fps), 76 draw calls, 16 k triángulos.

**Defectos encontrados en esta pasada**
- Cuelgue nativo de Unity con `ShadowCaster2D` sobre `SpriteSkin` (ClipperOffset2D). Se retiran las sombras proyectadas de las criaturas (PROVISIONAL).
- Los faroles parpadeantes se quedaban apagados de noche, porque `FlickerLight2D` guardaba la intensidad base del día. Corregido y cubierto por un test.
- Los bebés salían pequeños en EvolutionLab. Ahora hay encuadre por etapa (`StageFraming`).
- La emisión automática saturaba el fuego y la luz. Se ha bajado el umbral y la intensidad por familia.
