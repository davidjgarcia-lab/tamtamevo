// Port of packages/core/src/genetics (TypeScript) — MUST give identical results (see GeneticsParityTests).
// Pure C#: no UnityEngine references, so the same rules run in the game, in tests and on a server.
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace TamTam.Core
{
    public enum Family { fire, plant, electric, crystal, shadow, water, plasma, light, rock, mystic }
    public enum PartSlot { body, head, legs, tail, back }

    public sealed class FamilyDef
    {
        public Family Id; public string Name; public string[] Bases; public string Accent, Eye, Glow;
        public string[] Prefixes; public string Suffix; public string Skill; public string Locomotion;
        public float Hp, Str, Def, Spd, Crit, SkillMul;
    }

    public sealed class CareProfile
    {
        public double care, affection, hygiene, training, fighting, study, play, neglect;
    }

    [Serializable]
    public sealed class Genome
    {
        public Family[] parts = new Family[5];   // indexed by PartSlot
        public int[] variant = new int[5];
        public string eyes = "slit";
        public string pattern = "seams";
        public Family paletteBase = Family.fire;
        public int shade;
        public Family paletteAccent = Family.fire;
        public string mutation = "none";

        public Family this[PartSlot s] { get => parts[(int)s]; set => parts[(int)s] = value; }
        public Genome Clone() => new Genome { parts = (Family[])parts.Clone(), variant = (int[])variant.Clone(), eyes = eyes, pattern = pattern, paletteBase = paletteBase, shade = shade, paletteAccent = paletteAccent, mutation = mutation };
    }

    public enum HowDecided { inherited, affinity, wild }

    public sealed class EvolutionRoll
    {
        public Genome genome; public CareProfile profile; public Dictionary<Family, double> odds; public HowDecided[] how = new HowDecided[5]; public string name;
    }

    public static class Genetics
    {
        public static readonly Family[] Families = (Family[])Enum.GetValues(typeof(Family));
        public static readonly PartSlot[] Slots = (PartSlot[])Enum.GetValues(typeof(PartSlot));
        public static readonly string[] EyeStyles = { "slit", "round", "ring", "glow", "twin", "visor" };
        public static readonly string[] Patterns = { "seams", "spots", "stripes", "veins", "rings", "facets", "rivets", "none" };

        public static readonly Dictionary<Family, FamilyDef> Defs = new Dictionary<Family, FamilyDef>
        {
            [Family.fire] = new FamilyDef { Id = Family.fire, Name = "Brasildo", Bases = new[] { "#8A2A22", "#6E1E1A", "#A8361E" }, Accent = "#FF8A2A", Eye = "#FFC247", Glow = "#FFB347", Prefixes = new[] { "Brasa", "Ígni", "Tizo", "Llama" }, Suffix = "ildo", Skill = "Lluvia de Ascuas", Locomotion = "walk", Hp = 1f, Str = 1.18f, Def = 0.95f, Spd = 1.02f, Crit = 1.08f, SkillMul = 1.05f },
            [Family.plant] = new FamilyDef { Id = Family.plant, Name = "Foliaris", Bases = new[] { "#6E8F2E", "#4F7A2A", "#7A6A3A" }, Accent = "#B6E35D", Eye = "#E8FFB0", Glow = "#D4FF8A", Prefixes = new[] { "Folia", "Rama", "Musgo", "Brote" }, Suffix = "aris", Skill = "Abrazo de Raíces", Locomotion = "walk", Hp = 1.16f, Str = 0.95f, Def = 1.05f, Spd = 0.94f, Crit = 0.95f, SkillMul = 1.06f },
            [Family.electric] = new FamilyDef { Id = Family.electric, Name = "Voltix", Bases = new[] { "#2B356B", "#232B5A", "#3A4488" }, Accent = "#FFD23F", Eye = "#9FE8FF", Glow = "#FFF07A", Prefixes = new[] { "Volt", "Rayo", "Chispa", "Trueno" }, Suffix = "ix", Skill = "Descarga Rayo", Locomotion = "walk", Hp = 0.96f, Str = 1.06f, Def = 0.95f, Spd = 1.18f, Crit = 1.12f, SkillMul = 1.02f },
            [Family.crystal] = new FamilyDef { Id = Family.crystal, Name = "Diamor", Bases = new[] { "#2C4E9A", "#3A5FB8", "#24407E" }, Accent = "#9FE4FF", Eye = "#FFFFFF", Glow = "#C8F4FF", Prefixes = new[] { "Diam", "Prisma", "Gema", "Cuarzo" }, Suffix = "or", Skill = "Prisma Cortante", Locomotion = "walk", Hp = 0.94f, Str = 1f, Def = 1.1f, Spd = 1f, Crit = 1.15f, SkillMul = 1.14f },
            [Family.shadow] = new FamilyDef { Id = Family.shadow, Name = "Umbrin", Bases = new[] { "#3A1F6B", "#2A1650", "#4B2A86" }, Accent = "#C77DFF", Eye = "#F2E6FF", Glow = "#D9A8FF", Prefixes = new[] { "Umbra", "Sombra", "Niebla", "Velo" }, Suffix = "rin", Skill = "Abrazo Umbrío", Locomotion = "float", Hp = 0.92f, Str = 1f, Def = 0.92f, Spd = 1.16f, Crit = 1.14f, SkillMul = 1.1f },
            [Family.water] = new FamilyDef { Id = Family.water, Name = "Aqualin", Bases = new[] { "#2A6FD6", "#1E5AB8", "#3A86E8" }, Accent = "#5CE6FF", Eye = "#E6FBFF", Glow = "#9FF0FF", Prefixes = new[] { "Aqua", "Marea", "Ola", "Perla" }, Suffix = "alin", Skill = "Torbellino", Locomotion = "swim", Hp = 1.04f, Str = 0.98f, Def = 1f, Spd = 1.12f, Crit = 1f, SkillMul = 1.04f },
            [Family.plasma] = new FamilyDef { Id = Family.plasma, Name = "Plasmax", Bases = new[] { "#6A2FB8", "#5226A0", "#7B3FD0" }, Accent = "#FF7BE0", Eye = "#FFFFFF", Glow = "#E3A6FF", Prefixes = new[] { "Plasma", "Nebu", "Orbi", "Cosmo" }, Suffix = "ax", Skill = "Órbita Plasmática", Locomotion = "bounce", Hp = 1.2f, Str = 0.92f, Def = 1.06f, Spd = 0.92f, Crit = 0.94f, SkillMul = 1.08f },
            [Family.light] = new FamilyDef { Id = Family.light, Name = "Lúmina", Bases = new[] { "#F1C6D4", "#F5D8B8", "#E9C0E6" }, Accent = "#FFD36E", Eye = "#FFFFFF", Glow = "#FFF3C4", Prefixes = new[] { "Lumi", "Aura", "Alba", "Halo" }, Suffix = "ina", Skill = "Rayo Sagrado", Locomotion = "float", Hp = 0.95f, Str = 0.96f, Def = 0.94f, Spd = 1.14f, Crit = 1.05f, SkillMul = 1.16f },
            [Family.rock] = new FamilyDef { Id = Family.rock, Name = "Rocanix", Bases = new[] { "#6B5340", "#5A4A3C", "#7A5E44" }, Accent = "#FF8A2A", Eye = "#FFD580", Glow = "#FFB866", Prefixes = new[] { "Roca", "Pedra", "Basal", "Cantil" }, Suffix = "anix", Skill = "Avalancha", Locomotion = "walk", Hp = 1.12f, Str = 1.08f, Def = 1.2f, Spd = 0.88f, Crit = 0.96f, SkillMul = 0.98f },
            [Family.mystic] = new FamilyDef { Id = Family.mystic, Name = "Mistor", Bases = new[] { "#2A2E7A", "#3B3F9A", "#4A3E8E" }, Accent = "#9EE8FF", Eye = "#FFFFFF", Glow = "#FFC2EC", Prefixes = new[] { "Misti", "Runa", "Arcan", "Sueño" }, Suffix = "or", Skill = "Ilusión Arcana", Locomotion = "walk", Hp = 1f, Str = 0.98f, Def = 0.98f, Spd = 1.06f, Crit = 1.06f, SkillMul = 1.18f },
        };

        static readonly Dictionary<Family, string[]> FamilyEyes = new Dictionary<Family, string[]>
        {
            [Family.fire] = new[] { "slit", "glow" },
            [Family.plant] = new[] { "round", "ring" },
            [Family.electric] = new[] { "visor", "ring" },
            [Family.crystal] = new[] { "glow", "twin" },
            [Family.shadow] = new[] { "glow", "twin" },
            [Family.water] = new[] { "round", "ring" },
            [Family.plasma] = new[] { "round", "twin" },
            [Family.light] = new[] { "glow", "ring" },
            [Family.rock] = new[] { "slit", "round" },
            [Family.mystic] = new[] { "glow", "twin" },
        };
        static readonly Dictionary<Family, string[]> FamilyPatterns = new Dictionary<Family, string[]>
        {
            [Family.fire] = new[] { "seams", "spots" },
            [Family.plant] = new[] { "veins", "spots" },
            [Family.electric] = new[] { "rivets", "stripes" },
            [Family.crystal] = new[] { "facets", "veins" },
            [Family.shadow] = new[] { "rings", "none" },
            [Family.water] = new[] { "spots", "rings" },
            [Family.plasma] = new[] { "spots", "none" },
            [Family.light] = new[] { "rings", "stripes" },
            [Family.rock] = new[] { "stripes", "spots" },
            [Family.mystic] = new[] { "rings", "veins" },
        };

        /// Affinity weights, in the SAME order as the TypeScript object literals (float sums depend on order).
        static readonly Dictionary<Family, (string axis, double w)[]> Weights = new Dictionary<Family, (string, double)[]>
        {
            [Family.fire] = new[] { ("fighting", 1.3), ("training", 0.7), ("care", 0.2) },
            [Family.electric] = new[] { ("training", 1), ("play", 0.8), ("fighting", 0.3) },
            [Family.crystal] = new[] { ("hygiene", 1.2), ("study", 0.9), ("care", 0.3) },
            [Family.plant] = new[] { ("care", 0.5), ("affection", 1), ("hygiene", 0.2) },
            [Family.shadow] = new[] { ("neglect", 1.4) },
            [Family.water] = new[] { ("hygiene", 0.9), ("play", 0.9), ("affection", 0.2) },
            [Family.plasma] = new[] { ("play", 1.1), ("neglect", 0.3) },
            [Family.light] = new[] { ("affection", 1), ("care", 0.6), ("hygiene", 0.2) },
            [Family.rock] = new[] { ("training", 0.8), ("fighting", 0.4), ("care", 0.3) },
            [Family.mystic] = new[] { ("study", 1.2), ("affection", 0.4), ("hygiene", 0.2) },
        };
        static readonly Dictionary<Family, double> BaseWeight = new Dictionary<Family, double>
        {
            [Family.fire] = 0.1, [Family.electric] = 0.1, [Family.crystal] = 0.08, [Family.plant] = 0.08, [Family.shadow] = 0.06, [Family.water] = 0.1, [Family.plasma] = 0.12, [Family.light] = 0.08, [Family.rock] = 0.14, [Family.mystic] = 0.06,
        };

        public static readonly Genome Chispin = new Genome
        {
            parts = new[] { Family.fire, Family.fire, Family.fire, Family.fire, Family.fire },
            variant = new int[5], eyes = "slit", pattern = "seams", paletteBase = Family.fire, shade = 0, paletteAccent = Family.fire, mutation = "none",
        };

        static double Axis(CareProfile p, string a) => a switch
        {
            "care" => p.care, "affection" => p.affection, "hygiene" => p.hygiene, "training" => p.training,
            "fighting" => p.fighting, "study" => p.study, "play" => p.play, "neglect" => p.neglect, _ => 0,
        };

        public static Dictionary<Family, double> FamilyShare(Genome g)
        {
            var o = Families.ToDictionary(f => f, f => 0.0);
            foreach (var s in Slots) o[g[s]] += 1.0 / 6;
            o[g.paletteBase] += 1.0 / 6;
            return o;
        }

        public static Dictionary<Family, double> Affinity(CareProfile p, Genome lineage)
        {
            var share = FamilyShare(lineage);
            var o = new Dictionary<Family, double>();
            foreach (var f in Families)
            {
                double v = BaseWeight[f];
                foreach (var (axis, w) in Weights[f]) v += w * Axis(p, axis);
                if (f == Family.crystal || f == Family.light || f == Family.mystic) v *= 1 - 0.5 * p.neglect;
                o[f] = v + 0.35 * share[f];
            }
            return o;
        }

        public static Dictionary<Family, double> Odds(CareProfile p, Genome lineage)
        {
            var a = Affinity(p, lineage);
            var sq = Families.Select(f => a[f] * a[f]).ToArray();
            double tot = 0; foreach (var x in sq) tot += x;
            var o = new Dictionary<Family, double>();
            for (int i = 0; i < Families.Length; i++) o[Families[i]] = sq[i] / tot;
            return o;
        }

        /// mulberry32-style generator, bit-identical to the TypeScript `rng`.
        public static Func<double> Rng(uint seed)
        {
            uint a = seed == 0 ? 0x9e3779b9u : seed;
            return () =>
            {
                unchecked
                {
                    a += 0x6d2b79f5u;
                    uint t = a;
                    t = (t ^ (t >> 15)) * (t | 1u);
                    t ^= t + (t ^ (t >> 7)) * (t | 61u);
                    return (t ^ (t >> 14)) / 4294967296.0;
                }
            };
        }

        /// FNV-1a over the UTF-16 code units of the parts joined with "|" (same as `hashSeed`).
        public static uint HashSeed(params object[] parts)
        {
            unchecked
            {
                uint h = 2166136261u;
                foreach (char ch in string.Join("|", parts.Select(Convert.ToString))) h = (h ^ ch) * 16777619u;
                return h;
            }
        }

        static T Pick<T>(Func<double> r, IList<(T v, double w)> weights)
        {
            double tot = 0; foreach (var x in weights) tot += x.w;
            double y = r() * tot;
            foreach (var (v, w) in weights) if ((y -= w) <= 0) return v;
            return weights[weights.Count - 1].v;
        }

        public static EvolutionRoll Roll(Genome prev, CareProfile profile, uint seed, string tier = "plain")
        {
            var r = Rng(seed);
            var odds = Odds(profile, prev);
            var fam = Families.Select(f => (f, odds[f])).ToList();
            const double pKeep = 0.28;
            double pWild = 0.05 + 0.12 * profile.neglect;
            var g = prev.Clone();
            var how = new HowDecided[5];
            foreach (var s in Slots)
            {
                double x = r();
                if (x < pKeep) { how[(int)s] = HowDecided.inherited; continue; }
                if (x < pKeep + pWild) { g[s] = Families[(int)Math.Floor(r() * Families.Length)]; how[(int)s] = HowDecided.wild; }
                else { g[s] = Pick(r, fam); how[(int)s] = HowDecided.affinity; }
                g.variant[(int)s] = r() < 0.5 ? 0 : 1;
            }
            g.paletteBase = r() < 0.3 ? prev.paletteBase : Pick(r, fam);
            g.paletteAccent = r() < 0.5 ? g[PartSlot.back] : Pick(r, fam);
            g.shade = (int)Math.Floor(r() * Defs[g.paletteBase].Bases.Length);
            g.eyes = r() < 0.75 ? FamilyEyes[g[PartSlot.head]][(int)Math.Floor(r() * 2)] : EyeStyles[(int)Math.Floor(r() * EyeStyles.Length)];
            g.pattern = r() < 0.75 ? FamilyPatterns[g[PartSlot.body]][(int)Math.Floor(r() * 2)] : Patterns[(int)Math.Floor(r() * Patterns.Length)];
            bool top = tier == "radiant" || tier == "legendary";
            g.mutation = Pick(r, new List<(string, double)>
            {
                ("none", 1), ("iridescent", 0.02 + 0.06 * profile.hygiene), ("aurora", top ? 0.08 : 0.01),
                ("melanic", 0.01 + 0.25 * Math.Max(0, profile.neglect - 0.4)), ("albino", 0.015),
            });
            return new EvolutionRoll { genome = g, profile = profile, odds = odds, how = how, name = FormName(g, (int)Math.Floor(r() * 1000)) };
        }

        public static (Family family, Family second, double share) Dominant(Genome g)
        {
            var share = FamilyShare(g);
            var sorted = Families.OrderByDescending(f => share[f]).ToArray(); // stable, like Array.prototype.sort
            var second = share[sorted[1]] > 0 ? sorted[1] : sorted[0];
            return (sorted[0], second, share[sorted[0]]);
        }

        public static string FormName(Genome g, int seed)
        {
            var d = Dominant(g);
            var a = Defs[d.family];
            var b = Defs[d.second];
            var pre = a.Prefixes[seed % a.Prefixes.Length];
            var stem = Regex.Replace(pre, "[aeiouáéíóú]+$", "", RegexOptions.IgnoreCase);
            return d.family == d.second ? pre + a.Suffix : stem + b.Suffix;
        }
    }
}
