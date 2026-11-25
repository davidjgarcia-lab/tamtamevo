import { FAMILY_EYES, FAMILY_PATTERNS, type FamilyId } from "./families";
import type { Genome } from "./genome";
import type { Gait } from "./physics";

/**
 * The first Tamtams (starter art from the user, 2026-11-25). The egg hatches one of them at random.
 * Each has a personality: how it moves (motion), what it says (lines), what it loves to eat, and its traits.
 * Motion values are 0–1 and are read by the web renderer and by Unity's PaintedCreature.
 */
export interface StarterMotion {
  /** Idle hop/bounce energy. */ bounce: number;
  /** Side-to-side sway (floaty creatures). */ sway: number;
  /** Quick nervous jitters (electric). */ jitter: number;
  /** Tail wag amplitude. */ tail: number;
  /** Head tilts / curious looks. */ tilt: number;
  /** Breathing depth (slow, heavy creatures breathe deeper). */ breath: number;
  /** Overall tempo multiplier (0.6 slow … 1.4 hyper). */ tempo: number;
  /** Hovers above the ground. */ float: boolean;
  /** How it moves (evolution physics, see physics.ts). */ gait?: Gait;
}
export interface Starter {
  id: string;
  family: FamilyId;
  /** Genome variant (plasma has two starter looks). */
  variant: 0 | 1;
  species: string;
  title: string;
  traits: string[];
  traitLabels: string[];
  favoriteFood: string;
  motion: StarterMotion;
  lines: { happy: string[]; bored: string[]; hungry: string[]; lonely: string[] };
}

const M = (m: Partial<StarterMotion>): StarterMotion => ({ bounce: 0.4, sway: 0.1, jitter: 0, tail: 0.5, tilt: 0.4, breath: 0.5, tempo: 1, float: false, ...m });

export const STARTERS: Starter[] = [
  { id: "brasildo", family: "fire", variant: 0, species: "Brasildo", title: "Salamandra de brasas", traits: ["brave", "glutton"], traitLabels: ["Valiente", "Glotón"], favoriteFood: "food_ember_pepper",
    motion: M({ bounce: 0.7, tail: 0.8, tilt: 0.3, tempo: 1.15 }),
    lines: { happy: ["¡Mi cola arde de alegría!", "¡Estoy que echo chispas!"], bored: ["¿Una pelea amistosa? ¡Venga!", "Tengo fuego para quemar."], hungry: ["¡Algo picante, porfa!"], lonely: ["Ven, que te caliento las manos."] } },
  { id: "aqualin", family: "water", variant: 0, species: "Aqualin", title: "Ajolote de marea", traits: ["curious", "calm"], traitLabels: ["Curioso", "Tranquilo"], favoriteFood: "food_cool_jelly",
    motion: M({ bounce: 0.25, sway: 0.6, tail: 0.6, tilt: 0.7, tempo: 0.85 }),
    lines: { happy: ["Blub, blub… ¡qué a gusto!", "Me siento como en un río fresquito."], bored: ["¿Vamos a chapotear?", "Burbujas… ¡más burbujas!"], hungry: ["¿Hay gelatina fresca?"], lonely: ["Las branquias me hacen cosquillas si me acaricias."] } },
  { id: "foliaris", family: "plant", variant: 0, species: "Foliaris", title: "Brote del bosque", traits: ["sweet", "shy"], traitLabels: ["Dulce", "Tímido"], favoriteFood: "food_berry_bun",
    motion: M({ bounce: 0.3, sway: 0.25, tail: 0.4, tilt: 0.8, breath: 0.6, tempo: 0.9 }),
    lines: { happy: ["Me han salido dos hojitas nuevas.", "El sol me sienta de maravilla."], bored: ["¿Salimos a ver flores?", "Me gustaría crecer un poco más."], hungry: ["Unas bayas me vendrían genial."], lonely: ["¿Me rascas detrás de las hojas?"] } },
  { id: "voltix", family: "electric", variant: 0, species: "Voltix", title: "Zorro relámpago", traits: ["hyper", "proud"], traitLabels: ["Inquieto", "Orgulloso"], favoriteFood: "food_power_stew",
    motion: M({ bounce: 0.6, jitter: 0.8, tail: 0.9, tilt: 0.5, tempo: 1.4 }),
    lines: { happy: ["¡Bzzz! ¡Estoy a tope!", "¡Soy el más rápido de la casa!"], bored: ["¡Me sobra energía, juguemos YA!", "Bzzz… bzzz… ¡me aburrooo!"], hungry: ["¡Necesito recargar!"], lonely: ["Si me acaricias, no te doy calambre. Prometido."] } },
  { id: "rocanix", family: "rock", variant: 0, species: "Rocanix", title: "Tortuga de cristal ígneo", traits: ["calm", "stubborn"], traitLabels: ["Paciente", "Cabezota"], favoriteFood: "food_roast_skewer",
    motion: M({ bounce: 0.1, sway: 0.05, tail: 0.2, tilt: 0.2, breath: 0.9, tempo: 0.6 }),
    lines: { happy: ["Mmm… estoy como una roca. Feliz.", "Sin prisa, pero sin pausa."], bored: ["Podría quedarme aquí mil años…", "¿Entrenamos? Despacito."], hungry: ["Algo contundente, por favor."], lonely: ["Mi caparazón también nota los mimos."] } },
  { id: "plasmax_slime", family: "plasma", variant: 0, species: "Plasmax", title: "Babosa de plasma", traits: ["glutton", "playful"], traitLabels: ["Glotón", "Juguetón"], favoriteFood: "food_cool_jelly",
    motion: M({ bounce: 0.5, sway: 0.4, tail: 0.6, tilt: 0.3, breath: 0.8, tempo: 0.9, gait: "bounce" }),
    lines: { happy: ["¡Blorp! ¡Estoy brillante!", "Me derrito de felicidad."], bored: ["¿Botamos un rato?", "Me estiro, me encojo… ¡me aburro!"], hungry: ["Todo me cabe dentro. ¡Todo!"], lonely: ["Abrázame, soy blandito."] } },
  { id: "plasmax_orb", family: "plasma", variant: 1, species: "Plasmax", title: "Orbe estelar", traits: ["dreamy", "curious"], traitLabels: ["Soñador", "Curioso"], favoriteFood: "food_berry_bun",
    motion: M({ bounce: 0.2, sway: 0.7, tail: 0.7, tilt: 0.3, tempo: 0.8, float: true, gait: "float" }),
    lines: { happy: ["Mis anillos giran de alegría.", "Veo estrellas… ¡de las buenas!"], bored: ["¿Miramos el cielo?", "Floto, floto… y nada pasa."], hungry: ["Tengo un agujero negro en la tripa."], lonely: ["Ponte cerca, que te enseño una galaxia."] } },
  { id: "umbrin", family: "shadow", variant: 0, species: "Umbrin", title: "Duende de sombra", traits: ["mischievous", "loyal"], traitLabels: ["Travieso", "Leal"], favoriteFood: "food_berry_bun",
    motion: M({ bounce: 0.3, sway: 0.5, jitter: 0.2, tail: 0.6, tilt: 0.6, tempo: 1.05, float: true }),
    lines: { happy: ["Je, je… me escondí y no me viste.", "Las sombras hoy están contentas."], bored: ["¿Jugamos al escondite?", "Me aburro… voy a asustar a una mosca."], hungry: ["Tengo hambre de medianoche."], lonely: ["No me dejes solo en la oscuridad…"] } },
  { id: "lumina", family: "light", variant: 0, species: "Lúmina", title: "Polluelo de aurora", traits: ["kind", "cheerful"], traitLabels: ["Bondadoso", "Alegre"], favoriteFood: "food_berry_bun",
    motion: M({ bounce: 0.5, sway: 0.3, tail: 0.5, tilt: 0.6, tempo: 1.1, float: true }),
    lines: { happy: ["¡Brillo más que nunca!", "Gracias por cuidarme tan bien."], bored: ["¿Volamos un ratito?", "Quiero ver el amanecer."], hungry: ["Un bocadito de luz… digo, de comida."], lonely: ["Mi halo brilla más cuando estás cerca."] } },
  { id: "diamor", family: "crystal", variant: 0, species: "Diamor", title: "Cachorro de cristal", traits: ["elegant", "smart"], traitLabels: ["Elegante", "Listo"], favoriteFood: "food_cool_jelly",
    motion: M({ bounce: 0.3, sway: 0.1, tail: 0.4, tilt: 0.5, breath: 0.4, tempo: 0.95 }),
    lines: { happy: ["Mis cristales están relucientes.", "Hoy refracto arcoíris."], bored: ["¿Estudiamos algo nuevo?", "Me gusta resolver acertijos."], hungry: ["Algo fresco y limpio, por favor."], lonely: ["Pule mis cristales con un mimo."] } },
  { id: "mistor", family: "mystic", variant: 0, species: "Mistor", title: "Espíritu arcano", traits: ["wise", "mysterious"], traitLabels: ["Sabio", "Misterioso"], favoriteFood: "food_power_stew",
    motion: M({ bounce: 0.2, sway: 0.6, tail: 0.8, tilt: 0.5, tempo: 0.8, float: true }),
    lines: { happy: ["Las runas dicen que hoy es un buen día.", "Siento magia en el aire."], bored: ["¿Leemos un libro de hechizos?", "El tiempo es una ilusión… pero me aburro igual."], hungry: ["Un manjar arcano me vendría bien."], lonely: ["Quédate. Te contaré un secreto antiguo."] } },
];

export const starterById = (id: string) => STARTERS.find((s) => s.id === id);

/** Deterministic pick from an id (the egg's tamtamId), so the same egg always hatches the same starter. */
export function pickStarter(seedId: string): Starter {
  let h = 2166136261;
  for (let i = 0; i < seedId.length; i++) h = Math.imul(h ^ seedId.charCodeAt(i), 16777619);
  return STARTERS[(h >>> 0) % STARTERS.length]!;
}

/** Pure genome of a starter (all parts from its family). */
export function starterGenome(s: Starter): Genome {
  const f = s.family;
  return {
    parts: { body: f, head: f, legs: f, tail: f, back: f },
    variant: { body: s.variant, head: s.variant, legs: s.variant, tail: s.variant, back: s.variant },
    eyes: FAMILY_EYES[f][0]!, pattern: FAMILY_PATTERNS[f][0]!,
    palette: { base: f, shade: 0, accent: f }, mutation: "none", line: f,
  } as Genome;
}

/** Starter of a Tamtam (from its formId "starter_<id>"), if it hatched as one. */
export function starterOf(formId: string | undefined): Starter | undefined {
  return formId?.startsWith("starter_") ? starterById(formId.slice(8)) : undefined;
}
