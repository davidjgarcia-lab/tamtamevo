# Algoritmo de evolución genética (v2) — IMPLEMENTADO

> Código: `packages/core/src/genetics/` (families.ts, genome.ts, evolve.ts) · tests `genetics.test.ts` ·
> render: `packages/art/src/modular/` · app: aviso "listo para evolucionar" en Casa → Ritual.
> Sustituye al motor de ramas fijas de `EVOLUTION_SYSTEM.md` §3 para las formas visibles (el Lustre §11 se mantiene).

## Esquema

```
 ┌──────────────────────────── DURANTE LA ETAPA (bebé, infantil o juvenil) ─────────────────────────────┐
 │  Registro de etapa (care.log): ∫ satisfacción, ∫ higiene, ∫ cariño, ∫ hambre · nº de caricias,         │
 │  baños, limpiezas, comidas, sesiones de Gym, estudio, minijuegos, combates y victorias                 │
 └───────────────────────────────────────────────┬───────────────────────────────────────────────────────┘
                                                 ▼
 1. ¿PUEDE EVOLUCIONAR?  madurez de la etapa ≥ umbral (bebé→adulto en 5–7 días, D10)  ── no ──► sigue creciendo
                                                 │ sí  (aviso en Casa: "¡listo para evolucionar!")
                                                 ▼
 2. PERFIL DE CUIDADO (0–1)
    Cuidados = media de satisfacción      Mimos = cariño medio (70%) + caricias (30%)
    Higiene  = higiene media (75%) + baños/limpiezas (25%)
    Entreno  = sesiones de Gym / 12       Combate = (combates + victorias) / 18
    Estudio  = sesiones / 10              Juego   = minijuegos / 12        Abandono = 1 − Cuidados
                                                 ▼
 3. AFINIDAD POR FAMILIA  = base + Σ peso·eje  (+0,35 × piezas que ya tiene de esa familia = linaje)
    Magmáridos (fuego)   ← Combate 1,3 · Entreno 0,7        Ferrálidos (metal)  ← Entreno 1,3 · Combate 0,5 · Estudio 0,4
    Cristálidos          ← Higiene 1,2 · Estudio 0,9        Silváridos (planta) ← Mimos 1,0 · Cuidados 0,5
    Umbrálidos (sombra)  ← Abandono 1,4                     Mareálidos (agua)   ← Higiene 0,9 · Juego 0,9
    Gelíferos            ← Juego 1,1 · Abandono 0,3         Etéridos (aire)     ← Mimos 1,0 · Estudio 0,8
    Escamáridos (reptil) ← Entreno 0,5 · Combate 0,5 · Cuidados 0,4 (base alta: el "equilibrado")
    (Cristálidos y Etéridos pierden hasta el 50% si hay abandono)
    Probabilidad de cada familia = afinidad² normalizada  → ninguna puerta se cierra del todo
                                                 ▼
 4. SORTEO POR PIEZA (cuerpo, cabeza, patas, cola, lomo) con semilla = id del Tamtam + etapa
        28%  se HEREDA la pieza actual
        5% + 12%·Abandono  MUTACIÓN SALVAJE: cualquier familia
        resto  se sortea con las probabilidades del paso 3 (y variante 0/1 dentro de la familia)
                                                 ▼
 5. DETALLES
    Color base: familia sorteada (30% se mantiene) · tono 1 de 3 · acento: el del lomo (50%) u otra familia
    Ojos (6 estilos): 75% los de la familia de la cabeza · Patrón (8): 75% el de la familia del cuerpo
    Mutaciones raras: iridiscente (↑ higiene) · aurora (↑ si Lustre radiante/legendario) ·
                      melánica (↑ abandono) · albina (1,5%)
                                                 ▼
 6. CALIDAD (Lustre, EVOLUTION_SYSTEM §11): el Lustre de ese momento se GRABA → adornos, stats ×0,88–1,10, habilidad
                                                 ▼
 7. RESULTADO: genoma nuevo + nombre de forma (familia dominante + sufijo de la segunda: "Ferrino", "Umbrardo")
    stats = media de las 5 piezas × etapa (infantil ×1,25 · juvenil ×1,55 · adulto ×1,9) · habilidad = la del lomo
    se reinicia el registro de etapa y la madurez · el nombre propio del Tamtam no cambia
```

## Combinaciones

`(9 familias × 2 variantes)^5 piezas × 6 ojos × 8 patrones × (9 × 3 × 9) paletas × 5 mutaciones` =
**110.199.605.760** genomas posibles (muy por encima de las 500 pedidas). En 600 tiradas con el mismo perfil salen
más de 500 genomas distintos (test).

## Distribución medida (2.000 evoluciones por perfil, solo piezas nuevas)

| Cómo se crió | Familias más probables |
|---|---|
| Equilibrado | Planta 15% · Agua 15% · Cristal 14% · Fuego 14% (muy variado) |
| Guerrero (Gym + Arena) | **Fuego 37%** · Metal 22% · Reptil 18% |
| Forzudo (mucho Gym) | **Metal 27%** · Reptil 15% · Fuego 14% |
| Limpio y estudioso | **Cristal 45%** · Aire 19% · Planta 13% |
| Mimado (muchas caricias) | **Planta 38%** · Aire 20% · Cristal 15% |
| Jugón (minijuegos) | **Agua 37%** · Gelatina 19% |
| Descuidado | **Sombra 63%** |

## Por qué así

- **Aleatorio pero justo:** el cuidado inclina la balanza, no la decide. Dos Tamtams criados igual salen distintos.
- **Determinista:** la semilla es el id + la etapa; recargar la partida no cambia el resultado (no hay "re-roll").
- **Herencia:** el 28% de las piezas se conserva → la línea del Tamtam se reconoce entre etapas.
- **El descuido tiene cara propia** (Umbrálidos, melánico) pero no es un castigo: es una forma válida y rara de lucir.
- **El Lustre sigue mandando en la calidad**: un Tamtam bien cuidado luce mejor sea cual sea la mezcla.

## Pendiente

- Arte: las piezas son vectoriales de prototipo sobre el esqueleto cuadrúpedo de Chispín; las familias flotantes
  (sombra, aire) levitan, pero aún no hay clips propios de nadar/rebotar (CREATURE_FAMILIES_ANATOMY §6).
- Cría (dos padres) usará el mismo genoma: cada pieza vendría de un padre o mutaría.
- Validación de balance con jugadores reales (los pesos están en `AFFINITY_WEIGHTS`).
