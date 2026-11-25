/**
 * Tamtam naming rules (CREATURE_DATABASE §12).
 * Names are user text: normalise, count visible characters (graphemes), allow any
 * script and emoji, reject invisible/control characters and blocked words.
 */

export interface NamingRules {
  minLength: number;
  maxLength: number;
  /** Lower-case, accent-free words; matched as whole words or as the full name. */
  blocklist: string[];
}

export const DEFAULT_NAMING_RULES: NamingRules = {
  minLength: 2,
  maxLength: 16,
  blocklist: ["puta", "puto", "mierda", "cabron", "gilipollas", "imbecil", "fuck", "shit", "bitch", "nazi"],
};

export type NameError = "empty" | "too_short" | "too_long" | "invalid_characters" | "no_letters" | "blocked";

export type NameResult = { ok: true; name: string } | { ok: false; error: NameError };

/** NFC, trimmed, internal whitespace collapsed to single spaces. */
export function normalizeName(raw: string): string {
  return raw.normalize("NFC").replace(/\s+/gu, " ").trim();
}

/** Visible character count (grapheme clusters). "Ñandú" → 5, "👩‍🚀" → 1. */
export function graphemeLength(s: string): number {
  const Seg = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
  if (Seg) {
    let n = 0;
    for (const _ of new Seg(undefined, { granularity: "grapheme" }).segment(s)) n++;
    return n;
  }
  // Fallback (engines without Intl.Segmenter): code points, ignoring combining marks,
  // variation selectors and zero-width joiners plus the code point they join.
  let n = 0;
  let joinNext = false;
  for (const ch of s) {
    if (/\p{M}|️|︎/u.test(ch)) continue;
    if (ch === "‍") {
      joinNext = true;
      continue;
    }
    if (joinNext) {
      joinNext = false;
      continue;
    }
    n++;
  }
  return n;
}

// Letters, marks, numbers, space, a few punctuation marks, emoji (+ ZWJ / VS16 / skin tones).
const ALLOWED = /^(?:[\p{L}\p{M}\p{N} '\-.·]|\p{Extended_Pictographic}|\p{Emoji_Component}|‍|️)+$/u;
const HAS_LETTER_OR_NUMBER = /[\p{L}\p{N}]/u;

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

export function validateName(raw: string, rules: NamingRules = DEFAULT_NAMING_RULES): NameResult {
  const name = normalizeName(raw);
  if (name.length === 0) return { ok: false, error: "empty" };
  if (!ALLOWED.test(name)) return { ok: false, error: "invalid_characters" };
  if (!HAS_LETTER_OR_NUMBER.test(name)) return { ok: false, error: "no_letters" };
  const len = graphemeLength(name);
  if (len < rules.minLength) return { ok: false, error: "too_short" };
  if (len > rules.maxLength) return { ok: false, error: "too_long" };
  const folded = fold(name);
  const words = folded.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const compact = words.join("");
  if (rules.blocklist.some((b) => words.includes(b) || compact === b)) return { ok: false, error: "blocked" };
  return { ok: true, name };
}

/** Themed default names per family (used when the player leaves the field empty). */
export const DEFAULT_NAMES: Record<string, string[]> = {
  fire: ["Brasa", "Chispa", "Tizón", "Ascua", "Pimienta", "Fogata", "Candela", "Rescoldo"],
  water: ["Gota", "Marea", "Burbuja", "Nácar", "Ola", "Rocío", "Coral", "Bruma"],
  nature: ["Brote", "Musgo", "Trébol", "Hojita", "Bellota", "Semilla", "Helecho", "Pistacho"],
  electric: ["Voltio", "Zumbido", "Pila", "Destello", "Rayito", "Ión", "Faro", "Chasquido"],
  dark: ["Sombra", "Niebla", "Noctis", "Eclipse", "Penumbra", "Mora", "Tinta", "Luciérnaga"],
  light: ["Lumi", "Aurora", "Sol", "Halo", "Albor", "Perla", "Miel", "Prisma"],
  earth: ["Guijarro", "Canto", "Arcilla", "Geoda", "Ocre", "Pedrusco", "Cuarzo", "Mica"],
  cosmos: ["Nebulosa", "Orbe", "Cometa", "Estrella", "Luna", "Astro", "Quasar", "Polvo"],
  crystal: ["Gema", "Zafiro", "Cuarzo", "Brillo", "Diamante", "Ópalo", "Escarcha", "Topacio"],
  mystic: ["Runa", "Arcano", "Sueño", "Enigma", "Oráculo", "Lirio", "Sibila", "Merlín"],
};
/** Family ids of the genetics → name lists. */
const NAME_LIST_OF: Record<string, string> = { plant: "nature", shadow: "dark", rock: "earth", plasma: "cosmos" };

/** Deterministic default name for a Tamtam (stable for the same id). */
export function defaultName(familyId: string, tamtamId: string): string {
  const list = DEFAULT_NAMES[familyId] ?? DEFAULT_NAMES[NAME_LIST_OF[familyId] ?? ""] ?? DEFAULT_NAMES.fire!;
  let h = 2166136261;
  for (let i = 0; i < tamtamId.length; i++) h = Math.imul(h ^ tamtamId.charCodeAt(i), 16777619);
  return list[(h >>> 0) % list.length]!;
}
