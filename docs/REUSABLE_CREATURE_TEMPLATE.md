# REUSABLE CREATURE TEMPLATE

> Cómo añadir una forma o una especie **solo con datos y arte**, sin tocar la lógica del juego. Chispín es la referencia.

## 1. Plantilla de especie (`packages/core` + `packages/art`)
```ts
// packages/art/src/<family>/<form>.ts
export const <form>Rig: RigDef = { id, bones, parts, secondary, breathBone, eyeBones };   // anatomía
export const <form>Clips: ClipDef[] = [...];                                               // animaciones
export const <form>Emitters: Record<ClipId, EmitterDef[]> = {...};                          // partículas por clip
export const <family>ColorAlleles = [{ id, name, rank: "D"|"I"|"R", genes: { base, accent, eye, glow? } }];
```
Checklist de arte (ART_BIBLE §7): silueta a 64 px, paleta validada (tinta frente a base ≥ 2,5:1, test automático), slots `eyes`, `brows`, `mouth` y `prop` con todos los estados usados por los clips (test automático), rasgos ancla de la familia.

## 2. Plantilla de evolución (`packages/core/src/evolution/engine.ts`)
```ts
{ id: "evo_<fam>_<from>_<to>", version: 1, from, to, isDefault?, isSecret?,
  gates: Gate[],                       // minLevel | minCQ | maxCQ | requiredItem | requiredAffinity | minAttribute | timeWindow
  axisWeights: { str, agi, int, bond, calm },   // Σ = 2,2 (invariante)
  careWeight, attributeWeights: {...}, // Σ u = 1
  catalystItem?, affinityTag?, temperamentSide?, forceIf?, priority? }
```
Obligatorio: una rama `isDefault` por transición y filas nuevas en EVOLUTION_TEST_MATRIX (alcanzabilidad + neutralidad < 6).

## 3. Plantilla de animación (CHARACTER_ANIMATION_GUIDE)
Clips mínimos por etapa, nombres estándar (`idle`, `walk`, `eat`, `pet`, `sleep`, `celebrate`, `train`, `bathe`, `sad`, `hungry`, `angry`…). Así la lógica del juego pide los clips por nombre y funcionan con cualquier especie.

## 4. Plantilla de atributos
Los 5 atributos (`str`, `int`, `cre`, `nat`, `man`) son comunes a todas las especies. La especie solo decide **cómo pesan** en sus ramas (`attributeWeights`) y en su stat base de Arena (`FORM_BASE_STR` → pasará a `baseStats` por forma).

## 5. Plantilla de genética
Alelos de color por familia (arriba) + loci físicos (`traits`: cuernos, cola, marcas…) declarados como variantes de partes del rig, más temperamento S/E (EVOLUTION_SYSTEM §6). *Loci físicos y herencia: pendientes (NI-08).*

## 6. Plantilla de habilidades
`{ id, name, learnedAt: stage, type, ene, cooldown, power, effect }` en CREATURE_DATABASE. Las animaciones de ataque usan el clip `attack_<skillId>` o el genérico del arquetipo.

## 7. Qué NO hay que tocar al añadir una especie
`GameProvider`, `HomeScreen`, cuidados, economía, Gym, tienda, guardado y reloj. Hoy hay **un acoplamiento pendiente**: `useCreature` importa Chispín directamente. Siguiente paso: un registro `FORMS[formId] → { rig, clips, emitters, alleles }` para que la pantalla dibuje la forma actual del Tamtam (necesario para la evolución visible).
