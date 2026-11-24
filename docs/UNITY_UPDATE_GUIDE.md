# Actualizar Unity con las criaturas, evoluciones y entornos actuales

> Estado (2026-11-24, Unity 6000.3.29f1 en el PC): **COMPILA SIN ERRORES Y PROBADO.** "Actualizar todo" importa
> 30/30 sprites pintados, construye 80/80 formas, EvolutionLab y NestHouse (7 muebles). EditMode 23/23
> (GeneticsParityTests 18/18, EvolutionDataTests 2/2, ChispinAssetTests 3/3). PlayMode 2/2 (`LabPlayTests`:
> los 5 estilos de cuidado llegan a Adulto; capturas en `docs/media/unity/evolution-lab.png` y `nest-house.png`).
> Escena `Arena.unity` con los 8 biomas: **TamTam ▸ Entornos ▸ 3** (captura `docs/media/unity/arena-biomes.png`).
> Las 80 formas generadas (~560 MB) **no se suben a git**: tras clonar o hacer pull, ejecuta "Actualizar todo".
> Línea de comandos: `-executeMethod TamTam.EditorTools.BatchRunner.UpdateEverything` (y `BuildArena`).
>
> Estado anterior: IMPLEMENTADO, PENDIENTE DE PROBAR EN UNITY (el C# no se había compilado en la nube).
> La paridad de datos web↔Unity sí está verificada: las 80 formas exportadas se reensamblan igual desde la biblioteca
> (0 diferencias), y hay un test EditMode que lo vuelve a comprobar dentro de Unity.

## Qué estaba mal

Unity solo sabía construir a **Chispín** (`TamTam ▸ Build Chispín…`). No había ninguna ruta del **genoma** al arte:
al evolucionar no podía mostrar las 9 familias, sus mezclas de piezas, ojos, patrones, colores ni mutaciones.

## Qué hay ahora

| Pieza | Dónde | Qué hace |
|---|---|---|
| Exportador de criaturas | `tools/export-unity.ts` | Lleva a `Assets/TamTam/Data/Evolution/` las 9 familias, la **biblioteca de piezas** (9 familias × 5 piezas × 2 variantes + 6 ojos + 8 patrones + piezas comunes), el esqueleto y **80 formas** de ejemplo (18 puras + 62 evoluciones por estilos de cuidado). Fuente única: `packages/core` + `packages/art`. |
| Exportador de entornos | `tools/export-unity-assets.mjs` | Renderiza con el mismo código del juego la casa-nido (día y noche), 5 paredes, 4 suelos, 8 paisajes, 8 cuadros y 14 muebles (incluidos arenero, juguetes, fogón y tina) en `Assets/TamTam/Art/Environments/NestHouse/`, con pivotes y la disposición inicial. |
| Constructor de formas | `Editor/Evolution/EvolvedFormsBuilder.cs` | Convierte cada forma en un prefab con el esqueleto y las 14 animaciones de Chispín, y rellena `Data/EvolutionCatalog.asset`. Puede construir **cualquier** genoma desde la biblioteca, no solo los 80 exportados. |
| Presentador | `Runtime/Evolution/TamtamPresenter.cs` | Bebé = Chispín pintado; al evolucionar instancia la forma del genoma, la escala por etapa y aplica la paleta y la mutación del genoma (máscara de tinte). Si una forma no está construida, muestra la más parecida y lo avisa en la consola. |
| Escena de prueba | `Scenes/EvolutionLab.unity` | Botones de estilo de cuidado (Guerrero, Mimado, Jugón…) que evolucionan con el mismo algoritmo que la web, y botones de animación. |
| Casa-nido | `Editor/Environments/NestHouseBuilder.cs` | Importa los PNG como sprites y monta `Scenes/NestHouse.unity` con los muebles iniciales en su sitio. |
| Tests | `Tests/Editor/EvolutionDataTests.cs` | La biblioteca está completa y el ensamblado en C# coincide con la web forma a forma. |

## Pasos en tu PC (sesión local de Claude Code o a mano)

1. Trae los cambios del repositorio:
   ```bash
   git pull
   ```
2. Abre el proyecto en Unity 6.3 LTS y espera a que compile.
3. Menú **TamTam ▸ Actualizar todo (criaturas, evoluciones y entornos)**. Construye las 80 formas
   (tarda varios minutos: cada forma pinta sus capas y crea 14 animaciones), la escena EvolutionLab y la casa-nido.
   - Para una prueba rápida: **TamTam ▸ Evoluciones ▸ 1b · Construir solo las 18 formas puras**.
4. Abre `Assets/TamTam/Scenes/EvolutionLab.unity` y pulsa Play: evoluciona con distintos estilos de cuidado.
5. **Window ▸ General ▸ Test Runner ▸ EditMode ▸ Run All** (deben pasar `GeneticsParityTests` y `EvolutionDataTests`).
6. Para ver en Unity el Tamtam concreto que tienes en la web: en la app, **DEV ▸ Modo debug ▸ Copiar genoma para Unity**,
   y en Unity **TamTam ▸ Evoluciones ▸ 2 · Construir forma desde genoma (portapapeles)**.

## Cuando cambien las criaturas o la casa en la web

```bash
pnpm unity:export
```
Regenera `Data/Evolution/` y `Art/Environments/NestHouse/`. Después, en Unity, repite el paso 3.

## Arte pintado de las 10 familias (2026-11-24)

- `Art/Creatures/Families/{familia}_{initial|intermediate|final}.png`: 30 criaturas recortadas de tus hojas y escaladas ×4.
- **TamTam ▸ Evoluciones ▸ 0 · Importar arte pintado de familias** crea `Data/FamilyArt.asset`. "Actualizar todo" ya lo incluye.
- `TamtamPresenter.familyArt`: cuando está asignado, las formas evolucionadas usan el sprite pintado de la familia dominante,
  con animación procedural (`PaintedCreature`). Si no hay sprite, usa las formas vectoriales.
- `Art/Environments/Biomes/`: 8 biomas escalados ×4 (bosque, cascada, lava, cueva de cristal, setas, ruinas, islas del cielo y coliseo).

## Limitación honesta: el aspecto de las formas evolucionadas

- Las formas evolucionadas usan las **piezas modulares vectoriales** de las 9 familias, pintadas por el rasterizador
  de Unity (degradados, sombreado y grano, como el primer Chispín de Unity). **No** tienen todavía el acabado de
  ilustración pintada con IA que sí tiene el bebé (Chispín pintado). Lo mismo pasa en la web.
- Para que todas las evoluciones tengan ese acabado hace falta **pintar las piezas de cada familia** (un PSB por familia
  con las capas de `Art/Creatures/README.md`). Las hojas de concepto están **BLOQUEADAS** desde que el generador de
  imágenes agotó su cupo diario. Cuando haya arte pintado, `GenomeView` cambia los sprites por categoría y etiqueta,
  y el resto (genoma, catálogo, presentador, animaciones) se mantiene.
- Las paredes y los suelos van integrados en el fondo de la habitación de Unity. Los PNG sueltos de cada acabado
  están exportados, pero todavía no hay un componente que los cambie en tiempo de ejecución (**NO IMPLEMENTADO**).
