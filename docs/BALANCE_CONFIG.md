# BALANCE CONFIG — valores en vigor y dónde viven

> Todos los números del vertical slice son **datos**, no lógica. Cambiar un valor = editar el archivo indicado (y pasar los tests).

## Cuidados — `packages/core/src/care/needs.ts` (`DEFAULT_CARE_CONFIG`)
| Parámetro | Valor | Motivo |
|-----------|-------|--------|
| Decaimiento despierto (por hora) | Hambre −6 · Higiene −4 · Felicidad −3 · Cariño −4 · Energía −5 · Actividad −5 | GAMEPLAY_SYSTEMS §2.1 |
| Dormido (por hora) | Hambre −2 · Higiene −1 · Energía **+12** · resto 0 | Dormir no penaliza |
| Excremento | +3/h de pérdida de higiene por excremento · aparece 90–150 min después de comer · máx. 3 | |
| Amortiguación por ausencia | ×0,5 tras 8 h sin interacción | No castigar ausencias |
| Suelo | 25 (el tiempo nunca baja una necesidad de ahí) | |
| Mimos | +8 Cariño, +3 Felicidad · máx. 20 al día | Anti-spam |
| Jugar | +15 Felicidad, +20 Actividad, −5 Energía (requiere Energía ≥ 15) | |
| Baño | +60 Higiene, +4 Felicidad | |
| Comer estando lleno (≥ 95) | Rechaza y −3 Felicidad, sin consumir la comida | Alimentación incorrecta |
| Comida que no le gusta | −8 Felicidad | |

## Crecimiento — mismo archivo
`base 1 + bonus 0,4 · g` puntos/h · cuidado: 40→90 de satisfacción · juego: 45 min/24 h para el máximo · umbrales 17 / 67 / 168.

## Comida — `packages/core/src/game/content.ts` (`FOODS`)
| Comida | Precio | Hambre | Felicidad | Energía | Especial |
|--------|--------|--------|-----------|---------|----------|
| Bollito de bayas | 10 | +25 | +2 | 0 | Básica |
| Pimiento ascua | 25 | +30 | +6 (+10 favorita Fuego) | +5 | Favorita de Fuego; no le gusta a Agua |
| Brocheta asada | 60 | +55 | +8 | +10 | Gourmet |
| Gelatina fresca | 15 | +20 | +4 | 0 | **No le gusta a Fuego** (−8) |
| Guiso de fuerza | 120 | +40 | +5 | +25 | Receta: +5% FUE en el próximo combate |

## Gym — `content.ts` (`GYM`) + `rewards.ts` + `progression.ts`
| Parámetro | Valor |
|-----------|-------|
| Coste | 12 Energía + 6 Hambre |
| Recompensa | 35 TC × calidad (0,5–1,5) × nivel (1 / 1,25 / 1,5) × Entusiasmo · tope 2× base |
| XP de Fuerza | 60 × calidad × Entusiasmo de XP |
| Repeticiones | 5 / 6 / 7 por nivel. La zona verde se estrecha 2,5% por repetición |
| +1 FUE permanente | Cada 10 sesiones |
| Entusiasmo (sesiones/día) | 1–4: 100% · 5–8: 50% (XP 75%) · 9+: 10% (XP 50%) · reinicio a las 04:00 |
| Mejoras | Nv2: 2.000 TC + Fuerza 4 · Nv3: 7.000 TC + Fuerza 10 + 6 de metal |
| Curva de atributo | `50·(n+2)` XP por nivel (nv. 4 = 700 · nv. 10 = 3.250 · nv. 20 = 11.500) |
| Arena | FUE +0,5%/nivel de Fuerza (máx. +10%) + puntos de Gym + comida +5% |

## Economía — `content.ts`, `shop.ts`
Saldo inicial 300 TC · venta al 40% · muebles del slice: silla 120, póster volcán 80, póster estrellas 150, helecho 180, sofá 650, brasero 1.200. Regalo inicial: cama, alfombra, lámpara, póster y mancuernas.

## Huevo — `game.ts`
Primer huevo: 20 s de incubación (tutorial). Huevos normales: ECONOMY y EVOLUTION_SYSTEM §7.2 (aún no implementados).

## Evolución — `packages/core/src/evolution/engine.ts` (`FIRE_RULES`)
Pesos de eje, careW, atributos, catalizadores y gates de la familia Fuego (ver CHARACTER_DESIGN_FIRST_TAMTAM §5).
