import type { FoodDef } from "../care/needs";
import type { CatalogItem } from "../shop/catalog";
import { validateCatalog } from "../shop/catalog";

/**
 * Vertical-slice content (first Tamtam). Prices: ECONOMY_SYSTEM §4. artStatus marks
 * every item honestly: "prototype" = vector art made for the slice, not final.
 */

const base = {
  description: { es: "", en: "" },
  requirements: [],
  effects: [],
  artStatus: "prototype" as const,
};

const food = (id: string, es: string, en: string, price: number, rarity: CatalogItem["rarity"], desc: string): CatalogItem => ({
  ...base,
  id,
  name: { es, en },
  description: { es: desc, en: desc },
  image: `food/${id}`,
  price: { currency: "tamcoin", amount: price },
  category: "food",
  rarity,
  level: 1,
  maxOwned: 99,
  stackable: true,
});

export const FOODS: Record<string, FoodDef & { item: CatalogItem }> = {
  food_berry_bun: { id: "food_berry_bun", hunger: 25, happiness: 2, energy: 0, favoriteOf: [], dislikedBy: [], item: food("food_berry_bun", "Bollito de bayas", "Berry bun", 10, "common", "Comida básica. Sacia un poco.") },
  food_ember_pepper: { id: "food_ember_pepper", hunger: 30, happiness: 6, energy: 5, favoriteOf: ["fire"], dislikedBy: ["water"], item: food("food_ember_pepper", "Pimiento ascua", "Ember pepper", 25, "common", "Picante. Favorito de los Brasálidos.") },
  food_roast_skewer: { id: "food_roast_skewer", hunger: 55, happiness: 8, energy: 10, favoriteOf: ["fire", "earth"], dislikedBy: [], item: food("food_roast_skewer", "Brocheta asada", "Roast skewer", 60, "uncommon", "Gourmet: sacia mucho y da energía.") },
  food_cool_jelly: { id: "food_cool_jelly", hunger: 20, happiness: 4, energy: 0, favoriteOf: ["water"], dislikedBy: ["fire"], item: food("food_cool_jelly", "Gelatina fresca", "Cool jelly", 15, "common", "Fría. A los Brasálidos no les gusta nada.") },
  food_power_stew: { id: "food_power_stew", hunger: 40, happiness: 5, energy: 25, favoriteOf: [], dislikedBy: [], buff: "str_5_next_fight", item: food("food_power_stew", "Guiso de fuerza", "Power stew", 120, "rare", "Receta especial: +25 energía y +5% FUE en el próximo combate.") },
};

const furn = (
  id: string, es: string, en: string, category: CatalogItem["category"], price: number, rarity: CatalogItem["rarity"],
  f: NonNullable<CatalogItem["furniture"]>, maxOwned = 3,
): CatalogItem => ({
  ...base,
  id,
  name: { es, en },
  image: `furniture/${id}`,
  price: { currency: "tamcoin", amount: price },
  category,
  rarity,
  level: 1,
  maxOwned,
  stackable: true,
  furniture: f,
  effects: f.comfort ? [{ type: "comfort", value: f.comfort }] : [],
});

export const FURNITURE: CatalogItem[] = [
  furn("furn_bed_nest", "Cama-nido", "Nest bed", "furniture", 0, "common", { layer: "floor", w: 3, h: 1, mirrorable: true, rotatable: false, comfort: 3, interactions: [{ kind: "sleep", dx: 1, dy: 0, capacity: 1 }] }, 1),
  furn("furn_rug_round", "Alfombra de brasas", "Ember rug", "decoration", 0, "common", { layer: "rug", w: 4, h: 2, mirrorable: false, rotatable: false, comfort: 1 }, 2),
  furn("furn_lamp_mushroom", "Lámpara seta", "Mushroom lamp", "lighting", 0, "common", { layer: "floor", w: 1, h: 1, mirrorable: true, rotatable: false, comfort: 1, interactions: [{ kind: "toggle_light", dx: 0, dy: 0, capacity: 1 }] }, 3),
  furn("furn_chair_wood", "Silla de madera", "Wooden chair", "furniture", 120, "common", { layer: "floor", w: 1, h: 1, mirrorable: true, rotatable: false, comfort: 1, interactions: [{ kind: "sit", dx: 0, dy: 0, capacity: 1 }] }),
  furn("furn_poster_volcano", "Cuadro Volcán", "Volcano painting", "decoration", 80, "common", { layer: "wall", w: 2, h: 2, mirrorable: false, rotatable: false, comfort: 1, colorVariants: ["dusk", "night"] }),
  furn("furn_poster_stars", "Cuadro Noche estrellada", "Starry night painting", "decoration", 150, "common", { layer: "wall", w: 2, h: 2, mirrorable: false, rotatable: false, comfort: 1 }),
  furn("furn_poster_forest", "Cuadro Bosque al alba", "Forest at dawn painting", "decoration", 90, "common", { layer: "wall", w: 2, h: 2, mirrorable: false, rotatable: false, comfort: 1 }),
  furn("furn_poster_sea", "Cuadro Acantilado y mar", "Sea cliffs painting", "decoration", 110, "common", { layer: "wall", w: 2, h: 2, mirrorable: false, rotatable: false, comfort: 1 }),
  furn("furn_poster_mountains", "Cuadro Montañas nevadas", "Snowy mountains painting", "decoration", 130, "common", { layer: "wall", w: 2, h: 2, mirrorable: false, rotatable: false, comfort: 1 }),
  furn("furn_poster_aurora", "Cuadro Aurora boreal", "Aurora painting", "decoration", 220, "uncommon", { layer: "wall", w: 2, h: 2, mirrorable: false, rotatable: false, comfort: 2 }),
  furn("furn_poster_waterfall", "Cuadro Cascada escondida", "Hidden waterfall painting", "decoration", 160, "common", { layer: "wall", w: 2, h: 2, mirrorable: false, rotatable: false, comfort: 1 }),
  furn("furn_poster_desert", "Cuadro Dunas al atardecer", "Desert dunes painting", "decoration", 120, "common", { layer: "wall", w: 2, h: 2, mirrorable: false, rotatable: false, comfort: 1 }),
  furn("furn_plant_fern", "Helecho de fuego", "Fire fern", "decoration", 180, "uncommon", { layer: "floor", w: 1, h: 1, mirrorable: true, rotatable: false, comfort: 2, interactions: [{ kind: "look", dx: 0, dy: 0, capacity: 1 }] }),
  furn("furn_sofa_cushion", "Sofá de cojines", "Cushion sofa", "furniture", 650, "uncommon", { layer: "floor", w: 3, h: 1, mirrorable: true, rotatable: false, comfort: 3, interactions: [{ kind: "sit", dx: 1, dy: 0, capacity: 2 }] }, 1),
  furn("furn_brazier", "Brasero de cobre", "Copper brazier", "lighting", 1200, "rare", { layer: "floor", w: 1, h: 1, mirrorable: false, rotatable: false, comfort: 3 }, 2),
  furn("gym_dumbbells", "Mancuernas", "Dumbbells", "equipment", 0, "common", { layer: "floor", w: 2, h: 1, mirrorable: true, rotatable: false, interactions: [{ kind: "train", dx: 0, dy: 0, capacity: 1 }] }, 1),
  furn("study_desk", "Escritorio de estudio", "Study desk", "equipment", 0, "common", { layer: "floor", w: 2, h: 1, mirrorable: true, rotatable: false, interactions: [{ kind: "study", dx: 0, dy: 0, capacity: 1 }] }, 1),
];

/** Wall and floor finishes of the nest-house (category "surfaces"): not placed, applied to the whole room. */
const finish = (id: string, es: string, en: string, price: number, rarity: CatalogItem["rarity"], desc: string): CatalogItem => ({
  ...base, id, name: { es, en }, description: { es: desc, en: desc }, image: `surfaces/${id}`,
  price: { currency: "tamcoin", amount: price }, category: "surfaces", rarity, level: 1, maxOwned: 1, stackable: false,
});
export const WALL_FINISHES: CatalogItem[] = [
  finish("wall_woven", "Pared de nido trenzado", "Woven nest wall", 0, "common", "Ramas trenzadas, como el interior de un nido."),
  finish("wall_logs", "Pared de troncos", "Log cabin wall", 140, "common", "Troncos apilados de cabaña de bosque."),
  finish("wall_moss", "Piedra con musgo", "Mossy stone wall", 180, "uncommon", "Piedra fresca cubierta de musgo y helechos."),
  finish("wall_leaves", "Papel de hojas", "Leaf wallpaper", 120, "common", "Papel pintado con hojas de otoño."),
  finish("wall_treeheart", "Corazón del árbol", "Tree heart wall", 260, "rare", "Madera viva con vetas y luciérnagas."),
];
export const FLOOR_FINISHES: CatalogItem[] = [
  finish("floor_planks", "Suelo de tablones", "Wooden planks", 0, "common", "Tablones de madera cálida."),
  finish("floor_moss", "Alfombra de musgo", "Moss floor", 150, "common", "Musgo mullido con tréboles."),
  finish("floor_stone", "Losas de río", "River stones", 170, "uncommon", "Piedras redondeadas del río."),
  finish("floor_rings", "Anillos de árbol", "Tree rings", 210, "rare", "Rodajas de tronco con sus anillos."),
];

/** Caretaker level needed to buy each item (unlock progression, PLAN_MEJORAS A2). */
export const ITEM_LEVELS: Record<string, number> = {"furn_poster_stars": 3, "furn_poster_sea": 2, "furn_poster_mountains": 4, "furn_poster_aurora": 8, "furn_poster_waterfall": 5, "furn_poster_desert": 6, "furn_plant_fern": 2, "furn_brazier": 7, "wall_logs": 2, "wall_moss": 5, "wall_leaves": 3, "wall_treeheart": 9, "floor_moss": 3, "floor_stone": 5, "floor_rings": 8, "food_roast_skewer": 3};
for (const it of [...FURNITURE, ...WALL_FINISHES, ...FLOOR_FINISHES, ...Object.values(FOODS).map((f) => f.item)]) it.level = ITEM_LEVELS[it.id] ?? 1;

export const SLICE_CATALOG = validateCatalog([...FURNITURE, ...WALL_FINISHES, ...FLOOR_FINISHES, ...Object.values(FOODS).map((f) => f.item)]);

/** Items granted at the start of the game (welcome pack). */
export const STARTER_ITEMS: Record<string, number> = {
  furn_bed_nest: 1,
  furn_rug_round: 1,
  furn_lamp_mushroom: 1,
  furn_poster_volcano: 1,
  furn_poster_forest: 1,
  wall_woven: 1,
  floor_planks: 1,
  gym_dumbbells: 1,
  study_desk: 1,
  food_berry_bun: 3,
  food_ember_pepper: 2,
};

export const STARTER_COINS = 300;

/** Gym (ACTIVITIES_SYSTEM §2.A). */
export const GYM = {
  /** Energy cost by gym level (decision N12: between 5 and 10). */
  energyCostByLevel: { 1: 5, 2: 8, 3: 10 } as Record<number, number>,
  energyCost: 5,
  hungerCost: 6,
  baseCoins: 35,
  baseXp: 60,
  /** Every N sessions → +1 permanent STR training point in Arena. */
  sessionsPerStrPoint: 10,
  levelMultiplier: { 1: 1, 2: 1.25, 3: 1.5 } as Record<number, number>,
  levelNames: { 1: "Mancuernas", 2: "Banco de pesas", 3: "Gimnasio avanzado" } as Record<number, string>,
  reps: { 1: 5, 2: 6, 3: 7 } as Record<number, number>,
};
