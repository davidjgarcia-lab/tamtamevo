# Arte de criaturas (Unity 2D Animation)

Un archivo **PSB** por familia (`fire.psb`, `plant.psb`, …), todos con **las mismas capas y el mismo esqueleto**:

| Capa (grupo) | Categoría Sprite Library | Etiquetas |
|---|---|---|
| body / body_far | body | `{familia}_0`, `{familia}_1` |
| head (+ jaw, horn) | head | `{familia}_0`, `{familia}_1` |
| leg_FN, leg_FF, leg_BN, leg_BF | legs | `{familia}_0`, `{familia}_1` |
| tail_1…tail_4 | tail | `{familia}_0`, `{familia}_1` |
| crest_1…crest_3 (+ wings) | back | `{familia}_0`, `{familia}_1` |
| eyes (open/closed/happy) | eyes | `slit`, `round`, `ring`, `glow`, `twin`, `visor` |
| pattern | pattern | `seams`, `spots`, `stripes`, `veins`, `rings`, `facets`, `rivets`, `none` |

- Pintado a 2048 px de alto, fondo transparente, **escala de grises + máscaras de color** (R = base, G = acento,
  B = emisivo) para que el shader `TamTam/CreatureLit` tiña cualquier mezcla con la paleta del genoma.
- Huesos (iguales al prototipo): root, body, neck, head, jaw, eye, brow, horn, crest1–3, tail1–4, legFN/FF/BN/BF, prop.
- Las piezas pintadas se generan con IA (EVOLUTION_ALGORITHM / UNITY_MIGRATION_PLAN §3) y se limpian por capas.
